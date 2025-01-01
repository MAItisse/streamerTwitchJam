//! Game server

#![warn(
    clippy::pedantic,
    clippy::clone_on_ref_ptr,
    clippy::create_dir,
    clippy::filetype_is_file,
    clippy::fn_to_numeric_cast_any,
    clippy::if_then_some_else_none,
    missing_docs,
    clippy::missing_docs_in_private_items,
    missing_copy_implementations,
    missing_debug_implementations,
    clippy::missing_const_for_fn,
    clippy::mixed_read_write_in_expression,
    clippy::panic,
    clippy::partial_pub_fields,
    clippy::same_name_method,
    clippy::str_to_string,
    clippy::suspicious_xor_used_as_pow,
    clippy::try_err,
    clippy::unneeded_field_pattern,
    clippy::use_debug,
    clippy::verbose_file_reads,
    // clippy::expect_used
)]
#![deny(
    clippy::unwrap_used,
    clippy::unreachable,
    clippy::unimplemented,
    clippy::todo,
    clippy::dbg_macro,
    clippy::error_impl_error,
    clippy::exit,
    clippy::panic_in_result_fn,
    clippy::tests_outside_test_module
)]

#[macro_use]
extern crate rocket;
use std::collections::HashMap;
use std::env;
use std::sync::{Arc, RwLock};
use std::time::Instant;

use base64::prelude::*;
use dotenv::dotenv;
use jsonwebtoken::{decode, Algorithm, DecodingKey, TokenData, Validation};
use log::warn;
use rocket::futures::{SinkExt, StreamExt};
use rocket::http::Status;
use rocket::response::status;
use rocket::serde::json::Json;
use rocket::tokio::sync;
use rocket::{Request, State};
use serde::{Deserialize, Serialize};
use ws::Message;

/// The host we are at
const HOST: &str = "localhost:8000";

/// The type yes to store the jwt secret.
type JwtSecretType = Arc<str>;

/// Holds the communication channels for proxying events between the streamer and the clients
#[derive(Debug)]
struct LobbyChannels {
    /// Client --> Streamer
    client_to_streamer: sync::mpsc::Sender<ws::Message>,
    /// Streamer --> Client
    streamer_to_client: sync::broadcast::Receiver<ws::Message>,
}

/// A lobby is one instance of a game, one per channel
#[derive(Debug)]
struct Lobby {
    /// Key required for the streamer to connect to the socket
    streamer_key: String,
    /// Channels for communication
    channels: Option<LobbyChannels>,
}

impl Lobby {
    /// Create a new lobby
    fn new() -> Self {
        Self {
            streamer_key: uuid::Uuid::new_v4().to_string(),
            channels: None,
        }
    }
}

/// Holds information on the lobbies
#[derive(Default)]
struct Lobbies {
    /// Lookup from userid to lobby
    channels: RwLock<HashMap<Box<str>, Lobby>>,
}

/// Errors that can happen in the api
#[derive(Responder, Debug, PartialEq, Eq)]
enum Errors {
    /// Not found
    #[response(status = 404)]
    NotFound(String),
    /// Not allowed
    #[response(status = 403)]
    NotAllowed(String),
    /// Another socket is already connected
    #[response(status = 409)]
    AlreadyConnected(String),
    /// Already Exsists
    #[response(status = 409)]
    LobbyAlreadyExsists(String),
    /// We have no clue what happend
    #[response(status = 500)]
    Unknown(String),
}

/// Extension for Result for convenient shit
trait ResultExt<T, E> {
    /// Use errors `Debug` as message
    fn unknown(self) -> Result<T, Errors>
    where
        E: std::fmt::Debug;
}

impl<T, E> ResultExt<T, E> for Result<T, E> {
    fn unknown(self) -> Result<T, Errors>
    where
        E: std::fmt::Debug,
    {
        match self {
            Ok(val) => Ok(val),
            Err(err) => Err(Errors::Unknown(format!("{err:?}"))),
        }
    }
}

/// A generic unknown error
#[derive(Serialize)]
struct GenericError {
    /// Status code
    status: u16,
    /// Reason
    reason: Option<String>,
}

#[catch(default)]
fn default_catcher(status: Status, _request: &Request) -> Json<GenericError> {
    Json(GenericError {
        status: status.code,
        reason: status.reason().map(ToOwned::to_owned),
    })
}

/// Structure of the auth message
#[derive(Debug, Serialize, Deserialize)]
struct ClientAuthMessage {
    /// The users jwt
    jwt: String,
}

/// The json data from the jwt that we care about
#[derive(Debug, Serialize, Deserialize)]
struct JwtData {
    /// The users id, emitted to streamer connection on each client message.
    user_id: String,
}

/// Return a simple message to show we are working
#[get("/")]
const fn index() -> &'static str {
    "I am online!"
}

/// Create a new lobby for the specifed user
///
/// Returns a key to be used when connecting to `/lobby/connect/streamer`
#[post("/lobby/new?<user>")]
fn new_lobby(user: &str, lobbies: &State<Lobbies>) -> Result<status::Created<String>, Errors> {
    let mut channels = lobbies.channels.write().unknown()?;

    if channels.contains_key(user) {
        log::warn!("Somebody tried to create a new lobby that already exsists.");
        return Err(Errors::LobbyAlreadyExsists("Lobby already in play, please close exsisting game instance or wait for previous lobby to timeout".into()));
    }

    let lobby = Lobby::new();
    let key = lobby.streamer_key.clone();
    channels.insert(user.into(), lobby);

    Ok(status::Created::new(format!(
        "ws://{HOST}/lobby/connect/streamer?user={user}&key={key}"
    ))
    .body(key))
}

/// Connect to the lobby as a streamer
#[get("/lobby/connect/streamer?<user>&<key>")]
fn connect_streamer<'a>(
    ws: ws::WebSocket,
    user: &'a str,
    key: &str,
    lobbies: &'a State<Lobbies>,
) -> Result<ws::Channel<'a>, Errors> {
    let mut channels = lobbies.channels.write().unknown()?;
    let Some(lobby) = channels.get_mut(user) else {
        log::warn!("Streamer tried to connect to unknown lobby.");
        return Err(Errors::NotFound("You dont have a lobby open".into()));
    };

    if key != lobby.streamer_key {
        log::warn!(
            "Streamer provided wrong key, expected {}",
            lobby.streamer_key,
        );
        return Err(Errors::NotAllowed("Wrong key!".into()));
    }

    let lobby_channels = &mut lobby.channels;
    if lobby_channels.is_some() {
        log::warn!("Streamer tried to connect but lobby already exsits.");
        return Err(Errors::AlreadyConnected(
            "You are already connected to this lobby".to_owned(),
        ));
    }

    let (streamer_to_client_send, streamer_to_client_recv) = sync::broadcast::channel(100);
    let (client_to_streamer_send, client_to_streamer_recv) = sync::mpsc::channel(100);

    *lobby_channels = Some(LobbyChannels {
        streamer_to_client: streamer_to_client_recv,
        client_to_streamer: client_to_streamer_send,
    });

    // Make sure we dont hold the locks too long
    drop(channels);

    Ok(ws.channel(move |mut connection| {
        Box::pin(async move {
            let mut channel_recv = client_to_streamer_recv;
            let channel_send = streamer_to_client_send;

            loop {
                rocket::tokio::select! {
                    res = connection.next() => {
                        if let Some(Ok(message)) = res {
                            if !message.is_close() {
                                let _ = channel_send.send(message);
                            }
                        } else {
                            info!("STREAM: Websocket closed");
                            break;
                        }
                    },
                    res = channel_recv.recv() => {
                        if let Some(message) = res {
                            let _ = connection.send(message).await;
                        }
                    },
                }
            }

            if let Ok(mut channels) = lobbies.channels.write() {
                log::info!("Closing lobby");
                channels.remove(user);
            }

            Ok(())
        })
    }))
}

/// Connect to the lobby
#[get("/lobby/connect?<user>")]
fn connect_user(
    ws: ws::WebSocket,
    user: &str,
    lobbies: &State<Lobbies>,
    jwt_auth_key: &State<JwtSecretType>,
) -> Result<ws::Channel<'static>, Errors> {
    let channels = lobbies.channels.read().unknown()?;
    let Some(lobby) = channels.get(user) else {
        log::warn!("Viewer tried to connect to unknown lobby.");
        return Err(Errors::NotFound("Lobby does not exsit".into()));
    };

    let Some(lobby_channels) = lobby.channels.as_ref() else {
        log::warn!("Viewer tried to lobby a that doesnt have a streamer connected yet.");
        return Err(Errors::NotFound(
            "The game has not yet connected to this lobby".to_owned(),
        ));
    };

    let mut channel_recv = lobby_channels.streamer_to_client.resubscribe();
    let channel_send = lobby_channels.client_to_streamer.clone();

    drop(channels);

    let jwt_auth_key = Arc::clone(jwt_auth_key);
    Ok(ws.channel(move |connection| {
        Box::pin(async move {
            let (mut connection_send, mut connection_recv) = connection.split();

            let client_stream = async move {
                // We can only create a instant from the current time,
                // because its a moment in time and not a timestamp (does that make sense?)
                let mut is_first_message = true;
                let mut last_accepted_message_time = Instant::now();
                let mut jwt_data: Option<TokenData<JwtData>> = None;

                while let Some(Ok(message)) = connection_recv.next().await {
                    if message.is_close() {
                        if message.len() >= 1000 {
                            warn!("Client sent message of length {}", message.len());
                            continue;
                        }

                        if is_first_message
                            || Instant::now()
                                .saturating_duration_since(last_accepted_message_time)
                                .as_millis()
                                >= 100
                        {
                            if let Some(jwt_data) = &jwt_data {
                                is_first_message = false;
                                last_accepted_message_time = Instant::now();

                                let mut message_data: HashMap<String, serde_json::Value> =
                                    serde_json::from_str(
                                        message.to_text().expect("Message wasnt text"),
                                    )
                                    .expect("Message wasnt valid json");
                                message_data.insert(
                                    "userId".into(),
                                    serde_json::Value::String(jwt_data.claims.user_id.clone()),
                                );
                                let _ = channel_send
                                    .send(Message::text(
                                        serde_json::to_string(&message_data)
                                            .expect("Message couldnt be serialized"),
                                    ))
                                    .await;
                            } else {
                                jwt_data = parse_jwt_data(&message, &jwt_auth_key);
                                log::info!("JWT data: {:?}", jwt_data);

                                // TODO decide if we want to remove this, this is for users that dont
                                //      have grant access enabled - if they enable after load this also applies
                                if jwt_data.is_none() {
                                    let contains_jwt = message
                                        .to_text()
                                        .expect("Message wasnt text")
                                        .contains("jwt");
                                    log::info!("is jwt message {:?}", contains_jwt);
                                    if contains_jwt {
                                        let _ = channel_send.send(message).await;
                                    }
                                }
                            }
                        }
                    }
                }
                info!("CLIENT: Websocket closed!");
                Ok::<(), ws::result::Error>(())
            };
            let stream_client = async move {
                while let Ok(message) = channel_recv.recv().await {
                    connection_send.send(message).await?;
                }
                info!("CLIENT: Channel closed (stream disconnected)");
                Ok::<(), ws::result::Error>(())
            };

            rocket::tokio::select!(
                res = client_stream => res,
                res = stream_client => res,
            )
        })
    }))
}

/// Parse the given ws message as a auth message with the given secret
///
/// Returns `None` on error.
fn parse_jwt_data(message: &Message, jwt_auth_key: &JwtSecretType) -> Option<TokenData<JwtData>> {
    let twitch_auth: ClientAuthMessage = serde_json::from_str(message.to_text().ok()?).ok()?;
    let validation = Validation::new(Algorithm::HS256);
    decode::<JwtData>(
        &twitch_auth.jwt,
        &DecodingKey::from_secret(&BASE64_STANDARD.decode(jwt_auth_key.as_ref()).ok()?),
        &validation,
    )
    .ok()
}

/// Start the server
#[launch]
fn rocket() -> _ {
    let cors = rocket_cors::CorsOptions::default();
    dotenv().ok(); // Reads the .env file
    let jwt_auth_key =
        env::var("JWT_AUTH_KEY").expect("JWT Auth Key must be set in the environment variables");
    #[allow(clippy::expect_used)]
    rocket::build()
        .mount(
            "/",
            routes![index, new_lobby, connect_streamer, connect_user],
        )
        .register("/", catchers![default_catcher])
        .manage(Lobbies::default())
        .manage(JwtSecretType::from(jwt_auth_key))
        .attach(cors.to_cors().expect("Failed to create cors"))
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use rocket::local::blocking::Client;

    use super::*;

    #[test]
    fn create() {
        let client = Client::tracked(rocket()).unwrap();
        let response = client.post(uri!(new_lobby("viv"))).dispatch();

        assert_eq!(response.status(), Status::Created);
    }

    #[test]
    fn duplicate() {
        let client = Client::tracked(rocket()).unwrap();

        client.post(uri!(new_lobby("viv"))).dispatch();
        let response = client.post(uri!(new_lobby("viv"))).dispatch();

        assert_eq!(response.status(), Status::Conflict);
    }
}
