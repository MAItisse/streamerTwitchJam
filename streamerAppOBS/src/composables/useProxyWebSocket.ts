import { onUnmounted, Ref, ref } from 'vue';
import { ProxyConnectionStatus, useStatusStore } from '../store/statusStore';
import { useConfigStore } from '../store/configStore';
import { Boundary, Boundaries } from '../types';

export class InvalidTwitchUsernameError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "InvalidTwitchUsernameError";
        Object.setPrototypeOf(this, InvalidTwitchUsernameError.prototype);
    }
}

export class LobbyTakenError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "LobbyTakenError";
        Object.setPrototypeOf(this, LobbyTakenError.prototype);
    }
}

export function useProxyWebSocket() {

    const statusStore = useStatusStore();
    const configStore = useConfigStore();

    const onOpenCallback: Ref<null | (() => void)> = ref(null);
    const onMessageCallback: Ref<null | ((event: MessageEvent<any>) => void)> = ref(null);
    const onCloseCallback: Ref<null | (() => void)> = ref(null);

    const proxyHost = 'websocket.matissetec.dev';
    const isProxySecure = true;
    const pingTimeout = 10000;

    let socket: WebSocket | null = null;
    let twitchUserId: string | null = null;
    let pingKeepAliveIntervalId: NodeJS.Timeout | null = null;

    const fetchTwitchUserId = async () => {
        const resp = await fetch(`https://decapi.me/twitch/id/${configStore.twitchUsername}`);
        const text = await resp.text();

        if (text.includes('User not found')) {
            // console.log("useProxyWebSockets: fetchTwitchUserId error: Invalid Twitch Username");
            throw new InvalidTwitchUsernameError("Invalid Twitch Username");
        }
        return text;
    }

    const fetchLobbyKey = async () => {
        const resp = await fetch(`http${isProxySecure ? 's' : ''}://${proxyHost}/lobby/new?user=${twitchUserId}`, { method: 'POST' })
        const key = await resp.text()
        if (key.includes('Lobby already in play')) {
            throw new LobbyTakenError("Lobby is taken.");
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
            return;
        }

        // Connect to proxy lobby
        socket = new WebSocket(`ws${isProxySecure ? 's' : ''}://${proxyHost}/lobby/connect/streamer?user=${twitchUserId}&key=${lobbyKey}`);

        socket.onopen = async () => {
            console.log('Proxy WebSocket connected!')
            startPingLoop();
            statusStore.proxyConnectionStatus = ProxyConnectionStatus.Open;
            if (onOpenCallback.value != null) {
                onOpenCallback.value();
            }
        }

        socket.onmessage = async (event) => {
            if (onMessageCallback.value != null) {
                onMessageCallback.value(event);
            }
        }

        socket.onclose = async () => {
            console.log('useProxyWebSocket.socket.onclose: websocket closed')
            if (onCloseCallback.value != null) {
                onCloseCallback.value();
            }
            if (pingKeepAliveIntervalId) {
                stopPingLoop();
            }
            socket = null;
            statusStore.proxyConnectionStatus = ProxyConnectionStatus.Closed;
        }

    }

    const send = async (message: string) => {
        if (socket && statusStore.proxyConnectionStatus == ProxyConnectionStatus.Open) {
            // console.log("useProxyWebsockets: send()");
            socket.send(message);
        }
    }

    const sendObsSizeConfig = async () => {
        // console.log("useProxyWebSockets: sendObsSizeConfig()");
        /*
            Extension expects this format:
            {
                obsSize: {
                    width: 1920,
                    height: 1080
                }
            }
        */
        let payload = JSON.stringify(JSON.stringify({
            obsSize: {
                width: configStore.videoSettings.baseWidth,
                height: configStore.videoSettings.baseHeight,
            }
        }))
        await send(payload);
    }

    const sendWindowConfig = async () => {
        // console.log("useProxyWebSockets: sendWindowConfig()");
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
        let bounds = {} as Boundaries;
        for (const key in configStore.sourceToBoundaryMap) {
            if (configStore.sourceToBoundaryMap.hasOwnProperty(key)) {
                const boundary_key = configStore.sourceToBoundaryMap[key];
                if (boundary_key == "locked") {
                    // Generate a 0-sized boundary for this card to effectively lock it
                    const lockedSceneItemInd = configStore.obsSceneItems.findIndex((item: any) => item.sceneItemId == key);
                    // there is an item in our memory that isnt in the list of current sources
                    if (lockedSceneItemInd == -1){ continue; }
                    const lockedSceneItem = configStore.obsSceneItems[lockedSceneItemInd];
                    const transform = lockedSceneItem.sceneItemTransform;
                    const lockedBoundary: Boundary = {
                        left: transform.positionX / configStore.videoSettings.baseWidth,
                        top: transform.positionY / configStore.videoSettings.baseHeight,
                        right: transform.positionX / configStore.videoSettings.baseWidth,
                        bottom: transform.positionY / configStore.videoSettings.baseHeight,
                    };
                    bounds[key] = lockedBoundary;
                } else {
                    bounds[key] = configStore.bounds[boundary_key];
                }
            }
        }

        const payload = JSON.stringify(JSON.stringify({
            bounds: bounds 
        }))
        await send(payload);
    }

    const sendInfoWindowDataConfig = async () => {
        // console.log("useProxyWebSockets: sendInfoWindowDataConfig()");
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

        // Truncate title and description fields before sending... just in case
        Object.keys(configStore.sourceInfoCards).forEach(key => {
            let title = configStore.sourceInfoCards[key].title || '';
            let description = configStore.sourceInfoCards[key].description || '';

            configStore.sourceInfoCards[key].title = title.slice(0, 64);
            configStore.sourceInfoCards[key].description = description.slice(0, 256);
        });

        const payload = JSON.stringify(JSON.stringify({
            infoWindow: configStore.sourceInfoCards
        }));
        await send(payload);
    }

    const sendWindowLocations = async (x: number, y: number, windowId: number, sceneItem: any) => {
        const windowWidth = (sceneItem['sceneItemTransform']['width'] - (sceneItem['sceneItemTransform']['cropLeft'] + sceneItem['sceneItemTransform']['cropRight']) * sceneItem['sceneItemTransform']['scaleX']);
        const windowHeight = (sceneItem['sceneItemTransform']['height'] - (sceneItem['sceneItemTransform']['cropTop'] + sceneItem['sceneItemTransform']['cropBottom']) * sceneItem['sceneItemTransform']['scaleY']);
        let data = {
            "data": [
                {
                    "name": windowId,
                    "x": x,
                    "y": y,
                    "width": windowWidth + "px",
                    "height": windowHeight + "px",
                    "info": "some data to register later"
                }]
        }
        await send(JSON.stringify(data));
        // let data4 = {
        //     "name": windowId,
        //     "x": x,
        //     "y": y,
        //     "width": windowWidth + "px",
        //     "height": windowHeight + "px",
        //     "info": "some data to register later"
        // }
        // await send(JSON.stringify(data4));

        configStore.obsSceneItems.forEach((scene: any, _: number) => {
            if (scene.sceneItemId == windowId) {
                scene.sceneItemTransform.positionX = x;
                scene.sceneItemTransform.positionY = y;
            }
        });
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
        // })

        let sourceData: { name: any; x: any; y: any; width: any; height: any; info: string; }[] = [];

        configStore.obsSceneItems.forEach((scene: any, _: number) => {

            const t = scene.sceneItemTransform;
            const width = (t.sourceWidth - (t.cropLeft + t.cropRight)) * t.scaleX;
            const height = (t.sourceHeight - (t.cropTop + t.cropBottom)) * t.scaleY;

            if (scene.sceneItemId in configStore.sourceToBoundaryMap) {
                let w:{ name: any; x: any; y: any; width: any; height: any; info: string; } = {
                    name: scene.sceneItemId,
                    x: scene.sceneItemTransform.positionX,
                    y: scene.sceneItemTransform.positionY,
                    width: `${width}px`,
                    height: `${height}px`,
                    info: 'this window will have info'
                };
                sourceData.push(w);
                // TODO we want to probably just send these one at a time,
                //      works fine, but we need to change the other side to allow building this list on that side if needed
                //      possible workaround would be to gather the windows from the html, and run the array off that
                // send(JSON.stringify(w))
                // console.log("sending ", w);
            }
        });

        const payload = JSON.stringify({
            data: sourceData
        });
        await send(payload);
    }

    const close = () => {
        console.log('useProxyWebSocket: close()');
        if (socket) {
            socket.close();
        }
    }

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
        sendWindowLocations,
        runHello
    };
}
