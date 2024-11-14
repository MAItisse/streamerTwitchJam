<script setup lang="ts">
import { useStatusStore } from '../store/statusStore';

const statusStore = useStatusStore();
</script>

<template>
    <div class="flex flex-col mt-2 items-center justify-center p-2 bg-gray-100 rounded-lg shadow-lg mx-auto">
        <div class="w-full">
            <div class="flex justify-between items-center mb-2">
                <span>OBS:</span>
                <span :class="statusStore.isObsConnected ? 'text-green-500' : 'text-rose-500'">
                    <span v-if="statusStore.isObsConnected" class="flex items-center space-x-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path
                                d="M12 2a10 10 0 100 20 10 10 0 000-20zm-2.93 9.34L7 12.41l-1.41-1.41L4.22 13l2.78 2.78L12 10.78 9.07 7.84z" />
                        </svg>
                        <span>Connected</span>
                    </span>
                    <span v-else class="flex items-center space-x-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path
                                d="M12 2a10 10 0 100 20 10 10 0 000-20zm-2.93 6.07l1.41-1.41 3.16 3.17 3.17-3.17 1.41 1.41-3.17 3.17 3.17 3.17-1.41 1.41-3.17-3.17-3.16 3.17-1.41-1.41 3.17-3.17z" />
                        </svg>
                        <span>Disconnected</span>
                    </span>
                </span>
            </div>
            <div class="flex justify-between items-center">
                <span>Web:</span>
                <span :class="statusStore.isProxyConnected ? 'text-green-500' : 'text-rose-500'">
                    <span v-if="statusStore.isProxyConnected" class="flex items-center space-x-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path
                                d="M12 2a10 10 0 100 20 10 10 0 000-20zm-2.93 9.34L7 12.41l-1.41-1.41L4.22 13l2.78 2.78L12 10.78 9.07 7.84z" />
                        </svg>
                        <span>Connected</span>
                    </span>
                    <span v-else class="flex items-center space-x-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path
                                d="M12 2a10 10 0 100 20 10 10 0 000-20zm-2.93 6.07l1.41-1.41 3.16 3.17 3.17-3.17 1.41 1.41-3.17 3.17 3.17 3.17-1.41 1.41-3.17-3.17-3.16 3.17-1.41-1.41 3.17-3.17z" />
                        </svg>
                        <span>Disconnected</span>
                    </span>
                </span>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Additional styling can be added if needed */
</style>
