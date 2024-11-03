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
    clippy::expect_used
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
use std::sync::{Arc, RwLock};
use std::time::Instant;

use log::{error, warn};
use rocket::futures::{SinkExt, StreamExt};
use rocket::http::Status;
use rocket::response::status;
use rocket::serde::json::Json;
use rocket::tokio::sync;
use rocket::{Request, State};
use serde::{Deserialize, Serialize};

/// The host we are at
const HOST: &str = "localhost:8000";

/// Twitch user id
type UserId = Arc<str>;

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
    /// Streamer who created the lobby
    owner: UserId,
    /// Key required for the streamer to connect to the socket
    streamer_key: String,
    /// Channels for communication
    channels: RwLock<Option<LobbyChannels>>,
}

impl Lobby {
    /// Create a new lobby
    fn new(owner: UserId) -> Self {
        Self {
            owner,
            streamer_key: uuid::Uuid::new_v4().to_string(),
            channels: RwLock::new(None),
        }
    }
}

/// Holds information on the lobbies
#[derive(Default)]
struct Lobbies {
    /// Lookup from userid to lobby
    channels: RwLock<HashMap<UserId, Lobby>>,
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
    /// Unknwon with custom msg
    fn unknown_with(self, msg: impl Into<String>) -> Result<T, Errors>;
    /// Use errors `Debug` as message
    fn unknown(self) -> Result<T, Errors>
    where
        E: std::fmt::Debug;
}

impl<T, E> ResultExt<T, E> for Result<T, E> {
    fn unknown_with(self, msg: impl Into<String>) -> Result<T, Errors> {
        match self {
            Ok(val) => Ok(val),
            Err(_) => Err(Errors::Unknown(msg.into())),
        }
    }
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
    let user = Arc::from(user);
    let mut channels = lobbies.channels.write().unknown()?;

    if channels.contains_key(&user) {
        log::warn!("Somebody tried to create a new lobby that already exsists.");
        return Err(Errors::LobbyAlreadyExsists("Lobby already in play, please close exsisting game instance or wait for previous lobby to timeout".into()));
    }

    let lobby = Lobby::new(Arc::clone(&user));
    let key = lobby.streamer_key.clone();
    channels.insert(Arc::clone(&user), lobby);

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
    let channels = lobbies.channels.read().unknown()?;
    let Some(lobby) = channels.get(user) else {
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

    let mut lobby_channels = lobby.channels.write().unknown()?;
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
    drop(lobby_channels);
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
) -> Result<ws::Channel<'static>, Errors> {
    let channels = lobbies.channels.read().unknown()?;
    let Some(lobby) = channels.get(user) else {
        log::warn!("Viewer tried to connect to unknown lobby.");
        return Err(Errors::NotFound("Lobby does not exsit".into()));
    };

    let lobby_channels_lock = lobby.channels.read().unknown()?;
    let Some(lobby_channels) = lobby_channels_lock.as_ref() else {
        log::warn!("Viewer tried to lobby a that doesnt have a streamer connected yet.");
        return Err(Errors::NotFound(
            "The game has not yet connected to this lobby".to_owned(),
        ));
    };

    let mut channel_recv = lobby_channels.streamer_to_client.resubscribe();
    let channel_send = lobby_channels.client_to_streamer.clone();

    // Make sure we dont hold the locks too long
    drop(lobby_channels_lock);
    drop(channels);

    Ok(ws.channel(move |connection| {
        Box::pin(async move {
            let (mut connection_send, mut connection_recv) = connection.split();

            let client_stream = async move {
                // We can only create a instant from the current time,
                // because its a moment in time and not a timestamp (does that make sense?)
                let mut is_first_message = true;
                let mut last_accepted_message_time = Instant::now();

                while let Some(Ok(message)) = connection_recv.next().await {
                    if !message.is_close() {
                        if message.len() >= 1000 {
                            warn!("Client sent message of length {}", message.len());
                            continue;
                        }

                        if is_first_message
                            || Instant::now()
                                .saturating_duration_since(last_accepted_message_time)
                                .as_millis()
                                >= 20
                        {
                            is_first_message = false;
                            last_accepted_message_time = Instant::now();
                            let _ = channel_send.send(message).await;
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

/// Start the server
#[launch]
fn rocket() -> _ {
    let cors = rocket_cors::CorsOptions::default();
    #[allow(clippy::expect_used)]
    rocket::build()
        .mount(
            "/",
            routes![index, new_lobby, connect_streamer, connect_user],
        )
        .register("/", catchers![default_catcher])
        .manage(Lobbies::default())
        .attach(cors.to_cors().expect("Failed to create cors"))
}

#[cfg(test)]
mod tests {
    #![allow(clippy::unwrap_used)]

    use super::*;
    mod result_ext {
        use super::*;

        #[test]
        fn unknown_with_pass() {
            let res: Result<u8, ()> = Ok(10);
            assert_eq!(res.unknown_with("test"), Ok(10));
        }
        #[test]
        fn unknown_pass() {
            let res: Result<u8, ()> = Ok(10);
            assert_eq!(res.unknown(), Ok(10));
        }
        #[test]
        fn unknown_with_fail() {
            let res: Result<u8, ()> = Err(());
            assert_eq!(
                res.unknown_with("test"),
                Err(Errors::Unknown("test".into()))
            );
        }
        #[test]
        fn unknown_fail() {
            let x = "hello world";
            let res: Result<u8, _> = Err(x);
            assert_eq!(res.unknown(), Err(Errors::Unknown(format!("{x:?}"))));
        }
    }

    mod create_lobby {
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
}
