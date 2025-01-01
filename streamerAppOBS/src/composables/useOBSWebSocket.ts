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

        socket.value.on("CustomEvent", (data) => {
            if("chatPlaysObs" in data) {
                let apiData: any = data.chatPlaysObs;
                console.log('CustomEvent event received:', apiData);
                // TODO we want to define the api here and allow for people to hit different parts of the script'
                if ("AppendToAllowList" in apiData) {
                    configStore.allowList["pf4ireo"].allowed = configStore.allowList["pf4ireo"].allowed + ", " + apiData.AppendToAllowList["name"];
                }
                if ("EditInfoCard" in apiData) {
                    configStore.sourceInfoCards["110"]["title"] = apiData.EditInfoCard["title"];
                    configStore.sourceInfoCards["110"]["description"] = apiData.EditInfoCard["description"];
                    appStore.resetWindowConfig();
                }
                //"pwypmbn":{"left":0,"top":0.256,"right":1,"bottom":1.001}}
                if ("EditBoundaryData" in apiData) {
                    for (let i = 0; i < configStore.obsSceneItems.length; i++) {
                        if(configStore.obsSceneItems[i].sourceName == apiData.EditBoundaryData["sourceName"]) {
                            // configStore.obsSceneItems[i] = apiData.EditBoundary["movable"];
                            console.log("found the sourcename: " + apiData.EditBoundaryData["sourceName"]);
                            if(configStore.obsSceneItems[i].boundary_key in ["none", "locked"]) {
                                // Ignore for now
                            } else {
                                // {"2":"none","84":"xu8uffo","96":"none","97":"k08iunx","104":"none","105":"6tot8qm",
                                // "119":"none","121":"none","128":"6tot8qm","135":"locked"}
                                let boundaryId = configStore.sourceToBoundaryMap[configStore.obsSceneItems[i].sceneItemId];
                                // {"o7trukd":{"left":0,"top":0.2,"right":0.538,"bottom":0.872},
                                // "6tot8qm":{"left":0.066,"top":0.734,"right":0.909,"bottom":0.931}}
                                configStore.bounds[boundaryId] = {"left":apiData.EditBoundaryData["left"],"top":apiData.EditBoundaryData["top"],
                                    "right":apiData.EditBoundaryData["right"],"bottom":apiData.EditBoundaryData["bottom"]};
                            }
                        }
                    }
                    configStore.bounds["pwypmbn"] = {"left":apiData.EditBoundaryData["left"],"top":apiData.EditBoundaryData["top"],
                                                     "right":apiData.EditBoundaryData["right"],"bottom":apiData.EditBoundaryData["bottom"]};
                    appStore.resetInfoCards();
                }
                if ("EditMovable" in apiData) {
                    for (let i = 0; i < configStore.obsSceneItems.length; i++) {
                        if(configStore.obsSceneItems[i].sourceName == apiData.EditMovable["sourceName"]) {
                            configStore.obsSceneItems[i].twitch_movable = apiData.EditMovable["movable"];
                        }
                    }
                }
                if ("EditBoundary" in apiData) {

                }
                if ("EditAllowList" in apiData) {
                    console.log(configStore.obsSceneItems);
                    console.log(configStore.obsSceneItems[1].sourceName);
                    console.log(configStore.obsSceneItems[1].sceneItemId);
                    console.log(configStore.obsSceneItems[1].allowList_key);
                }


                if ("SaveSettings" in apiData) {
                    configStore.saveSettingsToLocalStorage();
                }
            }
            else {
                console.log('not our customEvent');
            }
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
