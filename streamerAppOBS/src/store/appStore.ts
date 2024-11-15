import { defineStore } from 'pinia';
import { useStatusStore } from './statusStore';
import { useConfigStore } from './configStore';
import { InvalidTwitchUsernameError, LobbyTakenError, useProxyWebSocket } from '../composables/useProxyWebSocket';
import { useOBSWebSocket } from '../composables/useOBSWebSocket';

export const useAppStore = defineStore({
    id: 'app',
    state: () => ({
        statusStore: useStatusStore(),
        configStore: useConfigStore(),
        proxyWebSocket: useProxyWebSocket(),
        obsWebSocket: useOBSWebSocket(),
    }),
    actions: {
        async connect() {
            console.log("useAppStore: connect()");

            // Reset error states
            this.statusStore.generalErrorMessage = null;
            this.statusStore.invalidTwitchUsername = false;
            this.statusStore.invalidSceneName = false;

            // Setup OBS websocket callback
            this.obsWebSocket.onOpenCallback = this.obsOnOpen;

            // Setup proxy websocket callbacks
            this.proxyWebSocket.onOpenCallback = this.proxyOnOpen;
            this.proxyWebSocket.onMessageCallback = this.proxyOnMessage;
            this.proxyWebSocket.onCloseCallback = this.proxyOnClose;

            /**
             * This is where the main chain of events begins:
             * - Connect to OBS (or error)
             * - Wait for OBS identification OK (or error)
             * - getVideoOutputSettings from OBS
             * - getSceneItems() from OBS (or error)
             * - Connect to Web Proxy
             * - Redirect to Dashboard
             */
            await this.obsWebSocket.connect();
        },

        // obsOnOpen is called after the OBS websocket has connected and identified us and is ready to take commands
        // (Note: it will hang up if we don't let it say hello before we send commands to it)
        async obsOnOpen() {
            // Fetch some info that we'll need after OBS finishes connecting
            this.configStore.videoSettings = await this.obsWebSocket.getVideoSettings();

            /**
             * Basic logic here is:
             * - Try to getSceneItems(), if error then abort all connections
             * - Connect to proxy web socket, if error abort all connections
             * - Repopulate all frontend states for rendering
             * - (then when both websockets are "OPEN" a trigger will redirect user to /dashboard)
             */
            await this.obsWebSocket.getSceneItems().catch((e) => {
                // if getSceneItems failed, it's probably due to invalid Scene Name, so we abort
                this.disconnect();
                throw e;
            }).then((sceneItems) => {

                this.configStore.obsSceneItems = sceneItems;

                this.proxyWebSocket.connect()
                    .then(() => {

                        // At this point we have all the data we need to repopulate frontend states
                        this.configStore.obsSceneItems.forEach((scene: any, index: number) => {
                            if (scene.sceneItemId in this.configStore.sourceToBoundaryMap) {
                                const boundaryKey = this.configStore.sourceToBoundaryMap[scene.sceneItemId];
                                this.configStore.obsSceneItems[index].twitch_movable = true;
                                this.configStore.obsSceneItems[index].boundary_key = boundaryKey;

                                const { title, description } = this.configStore.sourceInfoCards[scene.sceneItemId];
                                this.configStore.obsSceneItems[index].info_title = title;
                                this.configStore.obsSceneItems[index].info_description = description;

                                console.log("setting index", index, "to movable, and boundaryKey to:", boundaryKey);
                            }
                        });
                    })
                    .catch((e) => {
                        console.log("appStore: obsOnOpen(): Proxy connection error", e.message);
                        if (e instanceof InvalidTwitchUsernameError) {
                            this.statusStore.invalidTwitchUsername = true;
                        } else if (e instanceof LobbyTakenError) {
                            this.statusStore.generalErrorMessage = 'Lobby Conflict';
                        } else {
                            this.statusStore.generalErrorMessage = e.message;
                        }
                        this.disconnect();
                    });

            }).catch((e) => {
                console.warn("appStore: obsOnOpen(): Unexpected error:", e);
            });
        },

        // proxyOnOpen is called from onopen in the proxyWebSocket
        proxyOnOpen() {
            console.log("appStore: proxyOnOpen()");
        },

        // proxyOnMessage is called from onmessage in the proxyWebSocket
        async proxyOnMessage(event: any) {
            const message = event.data;
            console.log("hijacked proxy message: ", message);

            if (typeof message == "string" && message.includes('Hello Server!')) {
                console.info("saying hello to the server!");
                await this.proxyWebSocket.sendObsSizeConfig();
                await this.proxyWebSocket.sendWindowConfig();
                await this.proxyWebSocket.sendInfoWindowDataConfig()
                await this.proxyWebSocket.runHello()
                return;
            }

            try {
                const transformRequest = JSON.parse(message);
                console.log("appStore: proxyOnMessage() received SetSceneTransformItem request from user: ", transformRequest.userId);

                // Verify received payload has necessary fields
                if (!(transformRequest.hasOwnProperty('name') &&
                    transformRequest.hasOwnProperty('x') &&
                    transformRequest.hasOwnProperty('y'))) {
                    throw new Error('Invalid transform request: ' + transformRequest);
                }

                // Verify target window is valid
                // if (!(transformRequest.name in this.configStore.bounds)) {
                //     throw new Error('Invalid boundary ID: ' + transformRequest.name);

                // }

                // // Clamp the move within the associated boundary
                // const boundaryKey = this.configStore.sourceToBoundaryMap[transformRequest.name];
                // const boundary = this.configStore.bounds[boundaryKey];

                // let newX = transformRequest.x;
                // let newY = transformRequest.y;

                // newX = Math.max(boundary.left, Math.min(newX, boundary.right));
                // newY = Math.max(boundary.top, Math.min(newY, boundary.bottom));

                // Move the specified scene item 
                await this.obsWebSocket.setSceneItemTransform(
                    transformRequest.name,
                    transformRequest.x * this.configStore.videoSettings.baseWidth,
                    transformRequest.y * this.configStore.videoSettings.baseHeight);

                // Update all clients with window positions
                this.broadcastCurrentSettings();

            } catch (e) {
                console.log("appStore: invalid sceneItem transform request: ", e);
            }
        },

        // proxyOnClose is called from onclose in the proxyWebSocket
        proxyOnClose() {
            console.log("appStore: proxyOnClose()");
        },

        disconnect() {
            console.log("useAppStore: disconnect()");
            this.proxyWebSocket.close();
            this.obsWebSocket.close();
            console.log("useAppStore: Disconnected Proxy and OBS.");
        },

        async getSourceScreenshot(sourceName: string) {
            console.log("appStore: getSourceScreenshot() with:", sourceName);
            try {
                let res = await this.obsWebSocket.getSourceScreenshot(sourceName);
                return res.imageData;
            } catch (e) {
                return '';
            }
        },

        async broadcastCurrentSettings() {
            console.log("appStore: broadcastUpdatedSettings()");
            await this.proxyWebSocket.sendObsSizeConfig();
            await this.proxyWebSocket.sendWindowConfig();
            await this.proxyWebSocket.sendInfoWindowDataConfig();
        }
    },
});
