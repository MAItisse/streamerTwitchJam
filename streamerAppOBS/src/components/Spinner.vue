<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
</script>

<template>
    <div class="inline w-4 h-4 me-3 text-white fa-spin">
        <FontAwesomeIcon icon="spinner"></FontAwesomeIcon>
    </div>
    <span class="sr-only">Loading...</span>
</template>