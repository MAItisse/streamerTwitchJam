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

        async obsOnOpen() {
            // Fetch some info that we'll need after OBS finishes connecting
            this.configStore.videoSettings = await this.obsWebSocket.getVideoSettings();
            this.configStore.obsSceneItems = await this.obsWebSocket.getSceneItems();
        },

        proxyOnOpen() {
            console.log("appStore: proxyOnOpen()");
        },

        async proxyOnMessage(event: any) {
            const message = event.data;
            console.log("hijacked proxy message: ", message);

            if (message.includes('Hello Server!')) {

                console.info("saying hello to the server!");
                await this.proxyWebSocket.sendObsSizeConfig();
                await this.proxyWebSocket.sendWindowConfig();
                await this.proxyWebSocket.sendInfoWindowDataConfig()
                await this.proxyWebSocket.runHello()

                return;
            }
        },

        proxyOnClose() {
            console.log("appStore: proxyOnClose()");
        },

        disconnect() {
            console.log("useAppStore: disconnect()");
            this.proxyWebSocket.close();
            this.obsWebSocket.close();
            console.log("useAppStore: Disconnected Proxy and OBS.");
        },
        saveToLocalStorage() {
            // Save other items if necessary
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

            // TODO: build the windowConfig object
            


            // TODO: build the infoWindowConfig object
        }
    },
});
