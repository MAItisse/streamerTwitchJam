<script setup lang="ts">
import { OBSConnectionStatus, useStatusStore } from '../store/statusStore';
import { useConfigStore } from '../store/configStore';
import { useAppStore } from '../store/appStore';
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const configStore = useConfigStore();
const statusStore = useStatusStore();
const appStore = useAppStore();
const router = useRouter();

const isConnecting = ref(false);

onMounted(() => {
    isConnecting.value = false;
})

async function connect() {
    console.log("LoginPage: connect()");

    try {
        configStore.saveLoginToLocalStorage();
        console.log("\tsaving login details to localStorage...");

        isConnecting.value = true;
        setTimeout(() => {
            isConnecting.value = false;
        }, 3000);
        appStore.connect();

    } catch (e) {
        isConnecting.value = false;
        console.error("\terror caught: ", e);
    }
}

watch(statusStore, (statusStore) => {
    if (statusStore.isObsConnected && statusStore.isProxyConnected) {
        router.push("/dashboard");
    }
});

</script>

<template>
    <div class="card-collection">
        <div class="card">
            <div class="w-full">
                <form>
                    <h1 class="mb-0 text-lg p-1 mb-4 font-extrabold">Enter Connection Details
                    </h1>
                    <div v-if="statusStore.generalErrorMessage"
                        class="flex flex-col items-center font-medium text-red-700">
                        {{ statusStore.generalErrorMessage }}
                    </div>
                    <!-- OBS Password Row -->
                    <div class="flex flex-col">
                        <label for="obsPassword" class="mb-1 text-sm font-medium text-gray-700">
                            <FontAwesomeIcon class="mr-1" icon="cog"></FontAwesomeIcon>
                            OBS WebSocket Password:
                            <FontAwesomeIcon class="ml-1 text-gray-600 text-xl" icon="question-circle"
                                v-tooltip="'Go to OBS, click Tools -> WebSocket Server Settings, then click [Show connection settings] to find the password'">
                            </FontAwesomeIcon>
                        </label>
                        <input id="obsPassword" v-model="configStore.obsPassword" type="password" autocomplete="on"
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
                        <label for="twitchUsername" class="mb-1 text-sm font-medium text-gray-700">
                            <FontAwesomeIcon class="mr-1" :icon="['fab', 'twitch']"></FontAwesomeIcon>
                            Twitch Username:
                        </label>
                        <input id="twitchUsername" v-model="configStore.twitchUsername" type="text" autocomplete="on"
                            placeholder="Enter your Twitch username"
                            class="px-3 py-0 mb-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'bg-red-200': statusStore.invalidTwitchUsername }" />
                        <div v-if="statusStore.invalidTwitchUsername"
                            class="flex flex-col items-center font-medium text-red-700">
                            Username not found!
                        </div>
                    </div>

                    <!-- OBS Scene Name -->
                    <div class="flex flex-col">
                        <label for="obsSceneName" class="mb-1 text-sm font-medium text-gray-700">
                            <FontAwesomeIcon class="mr-1" icon="object-group"></FontAwesomeIcon>
                            OBS Scene Name:
                        </label>
                        <input id="obsSceneName" v-model="configStore.obsSceneName" type="text" autocomplete="on"
                            placeholder="Enter Target OBS Scene Name"
                            class="px-3 py-0 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'bg-red-200': statusStore.invalidSceneName }" />
                        <div v-if="statusStore.invalidSceneName"
                            class="flex flex-col items-center font-medium text-red-700">
                            OBS Scene not found!
                        </div>
                    </div>

                </form>
                <!-- Connect Button -->
                <div class="p-2 mt-2">
                    <!-- v-if="!statusStore.isProxyConnected && !statusStore.isObsConnected" -->
                    <button type="button" @click="connect"
                        class="w-full py-2 font-semibold text-white bg-blue-600 rounded 
                    hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition active:scale-[.95]" :disabled="isConnecting">
                        <div v-if="isConnecting">
                            <FontAwesomeIcon icon="spinner" class="fa-spin mr-2"></FontAwesomeIcon>
                            Connecting
                        </div>
                        <div v-else>
                            <span class="mr-2">Connect</span>
                            <FontAwesomeIcon icon="plug" class="rotate-45"></FontAwesomeIcon>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
