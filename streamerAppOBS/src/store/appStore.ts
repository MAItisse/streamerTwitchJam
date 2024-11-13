import { defineStore } from 'pinia';
import { useStatusStore } from './statusStore';
import { useConfigStore } from './configStore';
import { useProxyWebSocket } from '../composables/useProxyWebSocket';
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
            try {

                // Setup OBS websocket callback
                this.obsWebSocket.onOpenCallback = this.obsOnOpen;

                // Connect to OBS WebSocket
                await this.obsWebSocket.connect();

                // Setup proxy websocket callbacks
                this.proxyWebSocket.onOpenCallback = this.proxyOnOpen;
                this.proxyWebSocket.onMessageCallback = this.proxyOnMessage;
                this.proxyWebSocket.onCloseCallback = this.proxyOnClose;

                // Connect to Proxy WebSocket
                await this.proxyWebSocket.connect();

            } catch (e) {
                throw e;
            }

        },

        // obsOnOpen is called after the OBS websocket has connected and identified us and is ready to take commands
        // (Note: it will hang up on us if we don't let it say hello before sending any commands)
        async obsOnOpen() {
            // Fetch some info that we'll need after OBS finishes connecting
            this.configStore.videoSettings = await this.obsWebSocket.getVideoSettings();
            this.configStore.obsSceneItems = await this.obsWebSocket.getSceneItems();

            // At this point we have all the data we need to repopulate frontend states
            this.configStore.obsSceneItems.forEach((scene: any, index: number) => {
                console.log("checking scene... ", scene);
                if (scene.sceneItemId in this.configStore.sourceToBoundaryMap) {
                    const boundaryKey = this.configStore.sourceToBoundaryMap[scene.sceneItemId];
                    this.configStore.obsSceneItems[index].twitch_movable = true;
                    this.configStore.obsSceneItems[index].boundary_key = boundaryKey;

                    const { title, description } = this.configStore.sourceInfoCards[scene.sceneItemId];
                    this.configStore.obsSceneItems[index].info_title = title;
                    this.configStore.obsSceneItems[index].info_description = description;

                    console.log("setting index", index, "to movable, and boundarykey to:", boundaryKey);
                }
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
                await this.obsWebSocket.setSceneItemTransform(
                    transformRequest.name,
                    transformRequest.x * this.configStore.videoSettings.baseWidth,
                    transformRequest.y * this.configStore.videoSettings.baseHeight);

            } catch (e) {
                console.log("appStore: proxyOnMessage JSON parse error: ", e);
                return
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
