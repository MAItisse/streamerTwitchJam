<script setup lang="ts">
import { onMounted, onUnmounted, reactive } from 'vue';
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

type CardName = 'boundary' | 'allowList' | 'sceneItemTable' | 'sceneItemPopupEditor';

let proxyReconnectIntervalId: NodeJS.Timeout | null = null;
let obsStatusCheckIntervalId: NodeJS.Timeout | null = null;
let isMinimized = reactive<Record<CardName, boolean>>({
  boundary: false,
  allowList: false,
  sceneItemTable: false,
  sceneItemPopupEditor: false,
});

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


function toggleCard(cardName: CardName) {
  isMinimized[cardName] = !isMinimized[cardName];
}
</script>

<template>
  <div class="card-collection">
    <!-- Disconnect Card -->
    <div class="card">
        <button
            type="button"
            @click="disconnect"
            class="button disconnect-button"
        >
          <FontAwesomeIcon icon="power-off" class="mr-2"></FontAwesomeIcon>
          Disconnect
        </button>
    </div>

    <!-- Boundary Table Card -->
    <div class="card">
      <div class="card-header" @click="toggleCard('boundary')">
        <h3 class="card-title">Boundary</h3>
        <FontAwesomeIcon
            :icon="isMinimized.boundary ? 'chevron-down' : 'chevron-up'"
            class="toggle-icon"
        />
      </div>
      <div class="card-content" v-show="!isMinimized.boundary">
        <BoundaryTable></BoundaryTable>
        <BoundaryViewer></BoundaryViewer>
      </div>
    </div>

    <!-- Allow List Card -->
    <div class="card">
      <div class="card-header" @click="toggleCard('allowList')">
        <h3 class="card-title">Allow List</h3>
        <FontAwesomeIcon
            :icon="isMinimized.allowList ? 'chevron-down' : 'chevron-up'"
            class="toggle-icon"
        />
      </div>
      <div class="card-content" v-show="!isMinimized.allowList">
        <AllowList></AllowList>
      </div>
    </div>

    <!-- Scene Item Table Card -->
    <div class="card">
      <div class="card-header" @click="toggleCard('sceneItemTable')">
        <h3 class="card-title">Scene Item Table</h3>
        <FontAwesomeIcon
            :icon="isMinimized.sceneItemTable ? 'chevron-down' : 'chevron-up'"
            class="toggle-icon"
        />
      </div>
      <div class="card-content" v-show="!isMinimized.sceneItemTable">
        <SceneItemTable></SceneItemTable>
      </div>
    </div>

    <!-- Scene Item Popup Editor Card -->
    <div class="card">
      <div class="card-header" @click="toggleCard('sceneItemPopupEditor')">
        <h3 class="card-title">Scene Item Popup Editor</h3>
        <FontAwesomeIcon
            :icon="isMinimized.sceneItemPopupEditor ? 'chevron-down' : 'chevron-up'"
            class="toggle-icon"
        />
      </div>
      <div class="card-content" v-show="!isMinimized.sceneItemPopupEditor">
        <SceneItemPopupEditor></SceneItemPopupEditor>
      </div>
    </div>

    <!-- Confirm Settings Card -->
    <div class="card">
        <button
            type="button"
            @click="saveConfig"
            class="button confirm-button"
        >
          Confirm Settings
          <FontAwesomeIcon icon="rocket" class="ml-2"></FontAwesomeIcon>
        </button>
        <!-- TODO: add "save" confirmation messages -->
    </div>
  </div>
</template>


<style scoped lang="scss">
  .card {
    border: 3px solid #733604;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    overflow: hidden;
    background-color: #fff; /* Optional: Add a background color */
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Optional: Add a subtle shadow */
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background-color: #97abd3; /* Light gray background */
    cursor: pointer;
  }

  .card-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .toggle-icon {
    font-size: 1.25rem;
    transition: transform 0.3s ease;
  }

  .card-content {
    padding: 1rem;
    transition: all 0.3s ease;
  }

  .button {
    width: 100%;
    padding: 0.375rem 5rem; /* Adjusted padding for consistency */
    font-weight: 600;
    color: #fff;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.2s ease;
  }

  .disconnect-button {
    background-color: #dc2626; /* Red */
  }

  .disconnect-button:hover {
    background-color: #b91c1c;
  }

  .confirm-button {
    background-color: #16a34a; /* Green */
    font-size: 1rem;
  }

  .confirm-button:hover {
    background-color: #15803d;
  }

  .button:active {
    transform: scale(0.98);
  }

</style>