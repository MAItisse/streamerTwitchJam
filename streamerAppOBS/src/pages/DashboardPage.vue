<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useConfigStore } from '../store/configStore';
import BoundaryTable from '../components/BoundaryTable.vue';
import SceneItemTable from '../components/SceneItemTable.vue';
import BoundaryViewer from '../components/BoundaryViewer.vue';
import SceneItemPopupEditor from '../components/SceneItemPopupEditor.vue';
import { useAppStore } from '../store/appStore';
import { useRouter } from 'vue-router';
import { useStatusStore } from '../store/statusStore';
import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { useProxyWebSocket } from '../composables/useProxyWebSocket';
import AllowList from "@/components/AllowList.vue";

const router = useRouter();
const appStore = useAppStore();
const configStore = useConfigStore();
const statusStore = useStatusStore();

const proxyWebSocket = useProxyWebSocket();

let proxyReconnectIntervalId: NodeJS.Timeout | null = null;
let obsStatusCheckIntervalId: NodeJS.Timeout | null = null;

onMounted(() => {
    console.log("DashboardPage: onMounted()");

    if (!statusStore.isObsConnected || !statusStore.isProxyConnected) {
        console.warn("isObsConnected: ", statusStore.isObsConnected);
        console.warn("isProxyConnected: ", statusStore.isProxyConnected);
        router.push("/");
    }

    proxyReconnectIntervalId = setInterval(() => {
        // console.log("Is proxy still connected?", statusStore.isProxyConnected);
        if (!statusStore.isProxyConnected) {
            console.log("DashboardPage: Found disconnected web proxy... trying to reconnect.");
            appStore.obsOnOpen();
        }
    }, 10000);

    obsStatusCheckIntervalId = setInterval(() => {
        // console.log("Is OBS still connected? ", statusStore.isObsConnected);
        if (!statusStore.isObsConnected) {
            // If OBS disappears (likely a program close), we should shutdown too
            appStore.disconnect();
        }
    }, 10000);
});

onUnmounted(() => {

    // TODO: clear any reconnect intervals
    if (proxyReconnectIntervalId) {
        clearInterval(proxyReconnectIntervalId);
    }
    if (obsStatusCheckIntervalId) {
        clearInterval(obsStatusCheckIntervalId);
    }
});

const saveConfig = () => {
    console.log("DashboardPage: saveConfig()");

    // Persist current settings to storage
    configStore.saveSettingsToLocalStorage();

    // Adapt current configStore settings to expected server format and send them out
    appStore.broadcastCurrentSettings();

    toast("Settings Saved Successfully!", {
        "theme": "dark",
        "type": "default",
        "transition": "flip",
        "dangerouslyHTMLString": true,
        "autoClose": 500 ,
    })
}

function disconnect() {
    console.log("LoginPage: disconnect()");
    appStore.disconnect();
    router.push("/");
}

</script>

<template>
    <div class="card-collection">
        <div class="card">
            <button type="button" @click="disconnect" class="w-ful m-0 px-20 py-1.5 font-semibold text-white bg-red-600 
                    rounded hover:bg-red-700 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 
                    transition active:scale-[.95]">
                <FontAwesomeIcon icon="power-off" class="mr-2"></FontAwesomeIcon>
                Disconnect
            </button>
        </div>
        <div class="card">
            <BoundaryTable></BoundaryTable>
            <BoundaryViewer></BoundaryViewer>
        </div>
        <div class="card">
            <AllowList></AllowList>
        </div>
        <div class="card">
            <SceneItemTable></SceneItemTable>
        </div>
        <div class="card">
            <SceneItemPopupEditor></SceneItemPopupEditor>
        </div>
        <div class="card">
            <button type="button" @click="saveConfig"
                class="w-full py-2 font-bold text-2xl text-white bg-green-600 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 active:bg-green-800 transition active:scale-[.98]">
                Confirm Settings
                <FontAwesomeIcon icon="rocket" class="ml-2"></FontAwesomeIcon>
            </button>
            <!-- TODO: add "save" confirmation messages -->
        </div>
    </div>
</template>
