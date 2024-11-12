<script setup lang="ts">
import StatusIndicator from './components/StatusIndicator.vue';

</script>

<template>
  <div class="view">
    <header class="bg-white mb-1 py-1 shadow-md">
      <div class="max-w-lg mx-auto text-center">
        <h1
          class="inline-block px-3 bg-gray-100 rounded-full text-xl font-extrabold text-gray-800 tracking-wide shadow-sm">
          Chat Plays <span class="text-blue-600">OBS</span>
        </h1>
      </div>
    </header>
    <main>
      <StatusIndicator></StatusIndicator>
      <router-view />
    </main>
  </div>
</template>

<style scoped lang="scss">
main {
  padding: 8px;
}
</style>