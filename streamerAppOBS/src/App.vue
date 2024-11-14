<script setup lang="ts">
import TitleBar from './components/TitleBar.vue';
import { onMounted } from 'vue';
import { useConfigStore } from './store/configStore';
import { useAppStore } from './store/appStore';
import { useStatusStore } from './store/statusStore';

const configStore = useConfigStore();

onMounted(() => {
  console.log("App: onMounted()");
  useAppStore();
  useStatusStore();
  useConfigStore().loadAllFromLocalStorage();
  configStore.loadAllFromLocalStorage();
});

</script>

<template>
  <div class="view">
    <header>
      <TitleBar></TitleBar>
    </header>
    <main>
      <router-view v-slot="{ Component }">
        <transition name="pagefade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>
