<script setup lang="ts">
import { OBSConnectionStatus, useStatusStore } from '../store/statusStore';
import { useConfigStore } from '../store/configStore';
import { useAppStore } from '../store/appStore';

const configStore = useConfigStore();
const statusStore = useStatusStore();
const appStore = useAppStore();

async function connect() {
    console.log("LoginPage: connect()");

    try {
        configStore.saveLoginToLocalStorage();
        console.log("\tsaving login details to localStorage...");

        //
        // TODO
        //

        appStore.connect();

        // router.push("/dashboard");
    } catch (e) {
        console.error("\terror caught: ", e);
    }

}

async function disconnect() {
    console.log("LoginPage: disconnect()");
    appStore.disconnect();
}

</script>

<template>
    <section>
        <div
            class="flex flex-col items-center justify-center px-2 py-1 bg-gray-100 rounded-lg shadow-lg max-w-md mx-auto">
            <form class="w-full space-y-0">

                <!-- OBS Password Row -->
                <div class="flex flex-col">
                    <label for="obsPassword" class="mb-1 text-sm font-medium text-gray-700">OBS WebSocket Server
                        Password:</label>
                    <input id="obsPassword" v-model="configStore.obsPassword" type="password"
                        placeholder="Enter your OBS WebSocket Password"
                        class="px-3 py-0 mb-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        :class="{ 'bg-red-200': statusStore.obsConnectionStatus == OBSConnectionStatus.AuthenticationError }" />
                    <div v-if="statusStore.obsConnectionStatus == OBSConnectionStatus.AuthenticationError"
                        class="flex flex-col items-center font-medium text-red-700">
                        Invalid Password!
                    </div>
                </div>

                <!-- Twitch Username Row -->
                <div class="flex flex-col">
                    <label for="twitchUsername" class="mb-1 text-sm font-medium text-gray-700">Twitch Username:</label>
                    <input id="twitchUsername" v-model="configStore.twitchUsername" type="text"
                        placeholder="Enter your Twitch username"
                        class="px-3 py-0 mb-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <!-- OBS Scene Name -->
                <div class="flex flex-col">
                    <label for="obsSceneName" class="mb-1 text-sm font-medium text-gray-700">OBS Scene Name:</label>
                    <input id="obsSceneName" v-model="configStore.obsSceneName" type="text"
                        placeholder="Enter Target OBS Scene Name"
                        class="px-3 py-0 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

            </form>
            <!-- Connect Button -->
            <button type="button" @click="connect"
                class="w-full m-4 px-4 py-2 font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition active:scale-[.95]"
                v-if="!statusStore.isProxyConnected && !statusStore.isObsConnected"
                :disabled="statusStore.isProxyConnected || statusStore.isObsConnected">
                Connect to OBS
            </button>

            <!-- Disconnect Button -->
            <button v-if="statusStore.isProxyConnected || statusStore.isObsConnected" type="button" @click="disconnect"
                class="w-full m-4 px-4 py-2 font-semibold text-white bg-red-600 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition active:scale-[.95]">
                Disconnect
            </button>
        </div>
    </section>
    <section>
    </section>
</template>

<style scoped></style>
