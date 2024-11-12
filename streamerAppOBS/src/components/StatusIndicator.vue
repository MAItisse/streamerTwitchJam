<script setup lang="ts">
import { useStatusStore } from '../store/statusStore';

const statusStore = useStatusStore();

</script>

<template>
    <div class="w-full margin-auto text-center font-weight-800 text-xl">
        Status:
        <div v-if="statusStore.isObsConnected" class="text-green-500">
            Connected to OBS
        </div>
        <div v-else class="text-rose-500">
            Disconnected from OBS
        </div>
    </div>
    <div class="w-full margin-auto text-green-500 text-center font-weight-800 text-xl">
        <div v-if="statusStore.isProxyConnected" class="text-green-500">
            Connected to Proxy
        </div>
        <div v-else class="text-rose-500">
            Disconnected from Proxy
        </div>
    </div>
</template>

<style scoped></style>
