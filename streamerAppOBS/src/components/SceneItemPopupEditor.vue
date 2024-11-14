<script setup lang="ts">
import { computed } from 'vue';
import { useConfigStore } from '../store/configStore';
import { marked } from 'marked';

const configStore = useConfigStore();

const enabledSceneItems = computed(() => {
    return configStore.obsSceneItems.filter((item: any) => item.twitch_movable == true);
});

const renderMarkdown = (title: string, description: string) => {
    let markdownData = `
## ${title}

${description}`;
    return marked.parse(markdownData || "");
}

</script>

<template>
    <div>
        <div class="mb-2">
            <h1 class="mb-0 text-lg font-extrabold">Setup Info Cards</h1>
            <span class="font-semibold text-gray-500 text-sm">
                These info cards only appear when a viewer hovers over a
                movable source on your stream
            </span>
        </div>
        <table v-for="(item, key) in enabledSceneItems" :key="key" class="mb-4 w-full rounded-2xl">
            <thead>
                <tr>
                    <th class="p-2 text-left border border-gray-300">
                        <div class="card-title">
                            {{ item.sourceName }}
                        </div>
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr class="border-b border-gray-200 fade-row">
                    <td class="p-2 pb-6 space-y-2 bg-gray-200 border border-gray-400">
                        <!-- Info Card Title -->
                        <div class="flex flex-col">
                            <label class="mb-1 text-sm font-medium text-gray-700">
                                Title:
                            </label>
                            <input v-model="item.info_title" type="text"
                                placeholder="Enter your OBS WebSocket Password" />
                        </div>

                        <!-- Info Card Description Textarea -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea v-model="item.info_description" class="w-full p-2 border border-gray-300 rounded"
                                rows="4" placeholder="Enter description in Markdown"></textarea>
                        </div>
                        <div>
                            Preview (approximately):
                        </div>

                        <div v-html="renderMarkdown(item.info_title || '', item.info_description || '')"
                            class="ml-4 w-64 p-4 bg-white border bg-gray-100 border-gray-300 rounded-lg shadow-xl markdown-content prose prose-sm max-w-none">
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style scoped lang="scss">
.card-title {
    font-size: 16px;
    font-weight: 800;

}

table {
    border-radius: 8px; // TODO: this isn't working for some reason
}

th,
td {
    border-bottom-width: 2px;
    border-left-width: 1px;
    border-right-width: 2px;
    border-top-width: 2px;
    border-collapse: collapse;
    border-color: rgb(209, 213, 219);
    border-style: solid;

    height: 36px;
    padding: 4px px;
    vertical-align: middle;

    box-sizing: border-box;
    color: rgb(55, 65, 81);
    font-size: 14px;
    font-weight: 600;
    line-height: 12px;
    text-align: left;
    text-indent: 4px;
}

input {
    // width: 48px;
    padding: 8px;
    padding-left: 8px;
    appearance: auto;
    background-color: rgb(255, 255, 255);
    border-collapse: collapse;
    border-color: rgb(209, 213, 219);
    border-style: solid;
    border-width: 2px;
    // border-radius: 16px;
    box-sizing: border-box;
}

textarea,
input {
    border-radius: 10px;
}
</style>