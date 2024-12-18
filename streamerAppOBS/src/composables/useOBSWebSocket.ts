import { ref, onUnmounted, Ref } from 'vue';
import { OBSConnectionStatus, useStatusStore } from '../store/statusStore';
import { useConfigStore } from '../store/configStore';
import OBSWebSocket, { OBSWebSocketError } from 'obs-websocket-js';
import { useAppStore } from '../store/appStore';

export function useOBSWebSocket() {

    const appStore = useAppStore();
    const statusStore = useStatusStore();
    const configStore = useConfigStore();
    const onOpenCallback: Ref<null | (() => void)> = ref(null);

    let socket = ref<OBSWebSocket | null>();

    const connect = async () => {
        close();
        console.log("useOBSWebSocket: connect()");

        socket.value = new OBSWebSocket();
        const protocol = "ws";
        const address = `${protocol}://${configStore.obsHost}:${configStore.obsPort}`;


        // We have to wait for the "Hello" and "Identified"
        // before we kick off barking orders at OBS
        socket.value.on('Identified', async () => {
            console.log("\tOBS is connected!");

            statusStore.obsConnectionStatus = OBSConnectionStatus.Open;

            if (onOpenCallback.value != null) {
                onOpenCallback.value();
            }
        });

        // in the event that someone changes the visibility of a source
        socket.value.on("SceneItemEnableStateChanged", (data) => {
            console.log('SceneItemEnableStateChanged event received:', data);
            appStore.obsOnOpen();//true
        });

        socket.value.on("CurrentProgramSceneChanged", (data) => {
            console.log('CurrentProgramSceneChanged event received:', data);
            configStore.obsSceneName = data['sceneName'];
            appStore.obsOnOpen(true);

            // TODO we want to change the memory mapping so that they are saved by the scenename
                    // this could mean taking the current name and appending the scene to it
                    // should remain unique in most cases
                    // this might just be a bunch of numbers
            // TODO when we see then change we want to move to the new mapping and drop the old boundaries
                    // we will need to add in new boundaries or just fully call a hello or something

        });

        statusStore.obsConnectionStatus = OBSConnectionStatus.Connecting;
        await socket.value.connect(address, configStore.obsPassword).catch((e) => {
            console.warn("caught error:", e, e.code, e.name, e.message);
            if (e instanceof OBSWebSocketError && e.message == "Authentication failed.") {
                console.warn("OBS authentication error");
                statusStore.generalErrorMessage = e.message;
                statusStore.obsConnectionStatus = OBSConnectionStatus.AuthenticationError;
            } else {
                statusStore.generalErrorMessage = `OBS Connection Error: ${e.message}`;
            }
            throw e;
        });

        socket.value.on('ConnectionClosed', () => {
            console.log("OBS WebSocket has ConnectionClosed!");
            statusStore.obsConnectionStatus = OBSConnectionStatus.Closed;
        });
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

    const getVideoSettings = async () => {
        if (!socket.value) throw Error("OBS Disconnected.");

        const res = await socket.value.call('GetVideoSettings');
        console.log("useOBSWebSocket: getVideoSettings() response:", res);
        return res;
    }

    const getSceneItems = async () => {
        if (!socket.value) throw Error("OBS Disconnected.");

        const sceneName = configStore.obsSceneName;

        try {
            const res = await socket.value.call('GetSceneItemList', { sceneName })
            console.log("useOBSWebSocket: getSceneItems() response:", res);
            return res.sceneItems;
        } catch (e) {
            if (e instanceof OBSWebSocketError && e.message.includes('No source')) {
                console.warn("invalid OBS scene name");
                statusStore.invalidSceneName = true;
                throw e;
            }
        }
    }

    const getSourceScreenshot = async (sourceName: string) => {
        if (!socket.value) throw Error("OBS Disconnected.");

        const res = await socket.value.call('GetSourceScreenshot', {
            imageFormat: 'png',
            sourceName: sourceName
        });
        console.log("useOBSWebSocket: getSourceScreenshot() response:", res);
        return res;
    }

    const setSceneItemTransform = async (sceneItemId: number, positionX: number, positionY: number) => {
        if (!socket.value) throw Error("OBS Disconnected.");

        const res = await socket.value.call("SetSceneItemTransform", {
            sceneName: configStore.obsSceneName,
            sceneItemId: Number(sceneItemId),
            sceneItemTransform: {
                positionX: positionX,
                positionY: positionY,
            }
        });
        console.log("useOBSWebSocket: setSceneItemTransform() response:", res);
        return res;
    }

    const getWindowDetail = async (sceneItemId: number) => {
        if (!socket.value) throw Error("OBS Disconnected.");

        const res = await socket.value.call("GetSceneItemTransform", {
            sceneName: configStore.obsSceneName,
            sceneItemId: Number(sceneItemId),
        });
        console.log("useOBSWebSocket: getWindowDetail() response:", res);
        return res;
    }

    onUnmounted(close);

    return {
        socket,
        connect,
        onOpenCallback,
        close,
        getVideoSettings,
        getSceneItems,
        getSourceScreenshot,
        setSceneItemTransform,
        getWindowDetail
    };
}
