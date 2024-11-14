<script setup lang="ts">
import { computed } from 'vue';
import { useStatusStore } from '../store/statusStore';

const statusStore = useStatusStore();

const obsConnectionColor = computed(() => {
    return statusStore.isObsConnected ? 'text-green-600' : 'text-rose-600';
});
const proxyConnectionColor = computed(() => {
    return statusStore.isProxyConnected ? 'text-green-600' : 'text-rose-600';
});

const obsTooltip = computed(() => {
    return statusStore.isObsConnected ? 'Connected to OBS' : 'Disconnected from OBS';
});

const proxyTooltip = computed(() => {
    return statusStore.isProxyConnected ? 'Connected to Web' : 'Disconnected from Web';
})

</script>

<template>
    <div class="fixed w-full top-0 left-0">
        <div class="title-bar mb-1 py-1 shadow-md">
            <div class="max-w-lg mx-auto flex items-center justify-between px-4">
                <!-- Logo -->
                <h1
                    class="inline-block bg-gray-100 rounded-full text-xl font-extrabold text-gray-800 tracking-wide shadow-sm px-3">
                    Chat Plays <span class="text-blue-600">OBS</span>
                </h1>

                <!-- Status Indicators -->
                <div class="flex space-x-1">
                    <div v-tooltip="obsTooltip"
                        class="flex items-center space-x-0.5 px-3 bg-gray-100 rounded-full shadow-inner border border-gray-300">
                        <!-- OBS Status -->
                        <span>OBS:</span>
                        <div class="flex items-center space-x-1" :class="obsConnectionColor">
                            <span v-if="statusStore.isObsConnected">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor"
                                    viewBox="0 0 24 24">
                                    <path
                                        d="M12 2a10 10 0 100 20 10 10 0 000-20zm-2.93 9.34L7 12.41l-1.41-1.41L4.22 13l2.78 2.78L12 10.78 9.07 7.84z" />
                                </svg>
                                <span></span>
                            </span>
                            <span v-else>
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor"
                                    viewBox="0 0 24 24">
                                    <path
                                        d="M12 2a10 10 0 100 20 10 10 0 000-20zm-2.93 9.34L7 12.41l-1.41-1.41L4.22 13l2.78 2.78L12 10.78 9.07 7.84z" />
                                </svg>
                                <span></span>
                            </span>
                        </div>
                    </div>

                    <div v-tooltip="proxyTooltip"
                        class="flex items-center space-x-0.5 px-3 bg-gray-100 rounded-full shadow-inner border border-gray-300">
                        <!-- Proxy Status -->
                        <span>Web:</span>
                        <div class="flex items-center space-x-1" :class="proxyConnectionColor">
                            <span v-if="statusStore.isProxyConnected">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor"
                                    viewBox="0 0 24 24">
                                    <path
                                        d="M12 2a10 10 0 100 20 10 10 0 000-20zm-2.93 9.34L7 12.41l-1.41-1.41L4.22 13l2.78 2.78L12 10.78 9.07 7.84z" />
                                </svg>
                                <span></span>
                            </span>
                            <span v-else>
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor"
                                    viewBox="0 0 24 24">
                                    <path
                                        d="M12 2a10 10 0 100 20 10 10 0 000-20zm-2.93 9.34L7 12.41l-1.41-1.41L4.22 13l2.78 2.78L12 10.78 9.07 7.84z" />
                                </svg>
                                <span></span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
