<script setup lang="ts">
import { onMounted } from 'vue';
import { useConfigStore } from '../store/configStore';
import LoginPage from './LoginPage.vue';
import BoundaryTable from '../components/BoundaryTable.vue';
import SceneItemTable from '../components/SceneItemTable.vue';
import BoundaryViewer from '../components/BoundaryViewer.vue';
import SceneItemPopupEditor from '../components/SceneItemPopupEditor.vue';
import { useAppStore } from '../store/appStore';

const appStore = useAppStore();
const configStore = useConfigStore();


onMounted(() => {
    console.log("DashboardPage: onMounted()");
    configStore.loadAllFromLocalStorage();
});

const saveConfig = () => {
    console.log("DashboardPage: saveConfig()");

    // Persist current settings to storage
    configStore.saveSettingsToLocalStorage();

    // Adapt current configStore settings to expected server format and send them out
    appStore.broadcastCurrentSettings();
}


</script>

<template>
    <section class="flex justify-center">
        <div class="flex flex-col justify-center max-w-[450px]">
            <div class="card-collection">
                <div>
                    <LoginPage></LoginPage>
                </div>
                <div>
                    <BoundaryTable></BoundaryTable>
                </div>
                <div>
                    <BoundaryViewer></BoundaryViewer>
                </div>
                <div>
                    <SceneItemTable></SceneItemTable>
                </div>
                <div>
                    <SceneItemPopupEditor></SceneItemPopupEditor>
                </div>
                <div>
                    <button type="button" @click="saveConfig"
                        class="w-full py-2 font-bold text-2xl text-white bg-green-600 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 active:bg-green-800 transition active:scale-[.98]">
                        Save Config!
                    </button>
                    <!-- TODO: add "save" confirmation messages -->
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped lang="scss">
.card-collection {
    div {
        // margin-top: 16px;
        margin-bottom: 16px;
    }
}
</style>