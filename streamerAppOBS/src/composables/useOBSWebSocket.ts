import { ref, onMounted, onUnmounted } from 'vue';
import { OBSConnectionStatus, useStatusStore } from '../store/statusStore';
import { useConfigStore } from '../store/configStore';
import OBSWebSocket from 'obs-websocket-js';

export function useOBSWebSocket() {

    const statusStore = useStatusStore();
    const configStore = useConfigStore();

    // let socket: OBSWebSocket | null = null;
    let socket = ref();

    const init = () => {
        // TODO: maybe do some stuff here?
    }

    const connect = async () => {
        close();
        console.log("useOBSWebSocket: connect()");

        socket.value = new OBSWebSocket();
        const protocol = "ws";
        const address = `${protocol}://${configStore.obsHost}:${configStore.obsPort}`;

        try {
            statusStore.obsConnectionStatus = OBSConnectionStatus.Connecting;
            socket.value.connect(address, configStore.obsPassword);

            // We have to wait for the "Hello" and "Identified"
            // before we kick off barking orders at OBS
            socket.value.on('Identified', () => {
                console.log("\tOBS is connected!");
                statusStore.obsConnectionStatus = OBSConnectionStatus.Open;
            });
            socket.value.on('ConnectionClosed', () => {
                console.log("OBS WebSocket has ConnectionClosed!");
                statusStore.obsConnectionStatus = OBSConnectionStatus.Closed;
            })
        } catch (e) {
            console.warn("useOBSWebSocket: connect() - EXCEPTION:", e);
            statusStore.obsConnectionStatus = OBSConnectionStatus.AuthenticationError;
        }
    }

    const close = () => {
        if (socket.value) {
            console.log("useOBSWebSocket: close()");
            statusStore.obsConnectionStatus = OBSConnectionStatus.Closing;
            socket.value.disconnect();
            socket.value = null;
            statusStore.obsConnectionStatus = OBSConnectionStatus.Closed;
        }
    }

    const getVideoOutputSettings = async () => {
        if (!socket.value) throw Error("OBS Disconnected.");

        const res = await socket.value.call('GetVideoSettings');

        // const { baseWidth: width, baseHeight: height } = res;
        return {
            width: res.baseWidth,
            height: res.baseHeight
        };
    }

    const getSceneItems = async (sceneName = 'Scene') => {
        if (!socket.value) throw Error("OBS Disconnected.");

        const sceneItems = await socket.value.call('GetSceneItemList', { sceneName })
        return sceneItems
    }

    onMounted(init);
    onUnmounted(close);

    return {
        socket,
        connect,
        close,
        getVideoOutputSettings,
        getSceneItems
    };
}
