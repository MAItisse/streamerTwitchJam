import { onMounted, onUnmounted, Ref, ref } from 'vue';
import { useStatusStore } from '../store/statusStore';
import { useConfigStore } from '../store/configStore';

export function useProxyWebSocket() {

    const statusStore = useStatusStore();
    const configStore = useConfigStore();

    const onOpenCallback: Ref<null | (() => void)> = ref(null);
    const onMessageCallback: Ref<null | ((event: MessageEvent<any>) => void)> = ref(null);
    const onCloseCallback: Ref<null | (() => void)> = ref(null);

    const proxyHost = 'websocket.matissetec.dev';
    const isProxySecure = false;
    const pingTimeout = 30000;

    let socket: WebSocket | null = null;
    let twitchUserId: string | null = null;
    let pingKeepAliveIntervalId: NodeJS.Timeout | null = null;

    const init = () => {
        // TODO: maybe do some stuff here?
    }

    const fetchTwitchUserId = async () => {
        const resp = await fetch(`https://decapi.me/twitch/id/${configStore.twitchUsername}`);
        const text = await resp.text();
        return text;
    }

    const fetchLobbyKey = async () => {
        const resp = await fetch(`http${isProxySecure ? 's' : ''}://${proxyHost}/lobby/new?user=${twitchUserId}`, { method: 'POST' })
        const key = await resp.text()
        if (key.includes('Lobby already in play')) {
            console.log(key)
            // TODO: probably throw something here
            return null;
        }
        return key
    }

    const startPingLoop = async () => {
        if (!pingKeepAliveIntervalId) {
            pingKeepAliveIntervalId = setInterval(() => {
                if (socket != null && socket.readyState == WebSocket.OPEN) {
                    socket?.send('ping');
                }
            }, pingTimeout);
        }
    }

    const stopPingLoop = async () => {
        console.log("useProxyWebSocket: stopPingLoop()")
        if (pingKeepAliveIntervalId) {
            console.log("\tstopping interval ID:", pingKeepAliveIntervalId)
            clearInterval(pingKeepAliveIntervalId);
        }
    }

    const connect = async () => {
        close(); // avoid any attempts to double connect()
        console.log('useProxyWebSocket: connect()')

        // Get twitchUserId
        console.log('fetching twitch user ID...');
        twitchUserId = await fetchTwitchUserId();
        console.log("\tuser ID: ", twitchUserId);

        // Get proxy lobby key
        console.log('fetching lobby key...');
        let lobbyKey = await fetchLobbyKey();
        if (!lobbyKey) {
            // TODO: report this issue to the user
            return;
        }
        console.log("\t key:", lobbyKey);

        // Connect to proxy lobby
        socket = new WebSocket(`ws${isProxySecure ? 's' : ''}://${proxyHost}/lobby/connect/streamer?user=${twitchUserId}&key=${lobbyKey}`);

        socket.onopen = async () => {
            console.log('Proxy WebSocket connected!')
            startPingLoop();
            statusStore.proxyConnectionStatus = true;
            if (onOpenCallback.value != null) {
                onOpenCallback.value();
            }
        }

        socket.onmessage = async (event) => {
            console.log('TODO: handle Proxy message... ', event.data);
            if (onMessageCallback.value != null) {
                await onMessageCallback.value(event);
            }
        }

        socket.onclose = async () => {
            console.log('useProxyWebSocket.socket.onclose: websocket closed')
            if (onCloseCallback.value != null) {
                await onCloseCallback.value();
            }
            if (pingKeepAliveIntervalId) {
                stopPingLoop();
            }
            socket = null;
            statusStore.proxyConnectionStatus = false;
        }

    }

    const send = async (message: string) => {
        if (socket && statusStore.proxyConnectionStatus == true) {
            console.log("useProxyWebsockets: >>>>>>>> ", message);
            socket.send(message);
        }
    }

    const sendObsSizeConfig = async () => {
        /*
            *** NOTE: TODO: note the double-encoded JSON

            Extension expects this format:

            {
                obsSize: {
                    obsSize: {
                        width: 1920,
                        height: 1080
                    }
                }
            }
        */
        let payload = JSON.stringify(JSON.stringify({
            obsSize: {
                obsSize: {
                    width: 1920, // TODO: configStore.baseWidth,
                    height: 1080, // TODO: configStore.baseHeight,
                }
            }
        }))
        await send(payload);
    }

    const sendWindowConfig = async () => {
        /* 
            *** NOTE: TODO: note the double-encoded JSON

            Extension expects this format:
            {
                "bounds":
                {
                    "84":{"left":0.45,"right":1,"bottom":0.5,"top":0},
                    "96":{"left":0.45,"right":1,"bottom":0.9,"top":0.25},
                }
            }
        */

        const tempBoundaries = {
            "84": { "left": 0.45, "right": 1, "bottom": 0.5, "top": 0 },
            "96": { "left": 0.45, "right": 1, "bottom": 0.9, "top": 0.25 },
        }
        const payload = JSON.stringify(JSON.stringify({
            bounds: tempBoundaries // TODO: use configStore.boundaries
        }))
        await send(payload);
    }

    const sendInfoWindowDataConfig = async () => {
        /*
            *** NOTE: TODO: note the double-encoded JSON

            Extension expects this format:

            {
                "infoWindow": {
                    "84": {
                        "title": "coStreamer! vivax3794",
                        "description": "Follow [vivax3794](FOLLOW_BUTTON)"
                    }
            }
        */

        const tempInfoWindowConfig = {
            "84": {
                title: "Cool title here!",
                description: "### also\n- this\n- and this"
            }
        };
        const payload = JSON.stringify(JSON.stringify({
            infoWindow: tempInfoWindowConfig // TODO: use configStore.infoWindowConfig
        }));
        await send(payload);
    }

    const runHello = async () => {
        // wholeData.data.push({
        //     name: window.id,
        //     x: window.x,
        //     y: window.y,
        //     width: `${window.width}px`,
        //     height: `${window.height}px`,
        //     // copying random stuff from python version
        //     info: 'some data to register later',
        //     // maybe we also have this settable for each window
        //     zIndex: 10
        // })

        const tempWindowData = [
            {
                name: 84,
                x: 200,
                y: 200,
                width: '300px',
                height: '300px',
                info: 'some data to register later',
                zIndex: 10
            }
        ];

        const payload = JSON.stringify({
            // TODO: use configStore.windowDetails
            data: tempWindowData
        });
        await send(payload);
    }

    const close = () => {
        console.log('useProxyWebSocket: close()');
        if (socket) {
            socket.close();
        }
    }


    onMounted(init);
    onUnmounted(close);

    return {
        socket,
        connect,
        send,
        close,
        onOpenCallback,
        onMessageCallback,
        onCloseCallback,
        sendObsSizeConfig,
        sendWindowConfig,
        sendInfoWindowDataConfig,
        runHello
    };
}
