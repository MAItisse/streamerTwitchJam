<script setup lang="ts">
type StatusMessage = {
    Status: string,
    Message: string
};

defineProps<{
    statusMessage: StatusMessage
}>()

</script>

<template>
    <div class="w-full margin-auto text-green-500 text-center font-weight-800 text-xl">
        <div v-if="statusMessage.Status == 'success'" class="text-green-500">
            {{ statusMessage.Message }}
        </div>
        <div v-else-if="statusMessage.Status == 'error'" class="text-rose-500">
            {{ statusMessage.Message }}
        </div>
    </div>
</template>

<style scoped></style>
