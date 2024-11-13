<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useConfigStore } from '../store/configStore';


const configStore = useConfigStore();

onMounted(() => {

});

const numSceneItems = computed(() => {
    return Object.keys(configStore.obsSceneItems).length;
})

const toggleSceneItem = (sceneItem: any) => {
    if (!('twitch_movable' in sceneItem)) {
        // nothing to toggle? should never happen
        return;
    }
    if (sceneItem.twitch_movable == true) {

    }
}
</script>

<template>
    <!-- Choose Sources -->
    <div>
        <div class="flex flex-col items-center justify-center p-2 bg-gray-100 rounded-lg shadow-lg mx-auto">
            <div class="w-full">
                <div v-if="numSceneItems > 0">
                    <div class="overflow-x-auto">
                        <h1 class="mb-0 text-md font-extrabold">
                            Choose Sources
                        </h1>
                        <div class="font-semibold text-gray-500 text-sm">
                            Choose which OBS Sources that users will be able to move
                        </div>
                        <div class="pt-2">
                            <table class="min-w-full bg-white">
                                <thead>
                                    <tr>
                                        <th>
                                            Source Name
                                        </th>
                                        <th>
                                            Movable?
                                        </th>
                                        <th class="w-[180px]">
                                            Boundary
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="item in configStore.obsSceneItems" :key="item.sceneItemId"
                                        :class="{ 'hover:bg-gray-50': true, 'bg-amber-100': item.twitch_movable, 'hover:bg-amber-50': item.twitch_movable }">

                                        <!-- Source Name -->
                                        <td>
                                            {{ item.sourceName }}
                                        </td>

                                        <!-- Enabled Checkbox -->
                                        <td>
                                            <!-- @change="toggleSceneItem(item)" -->

                                            <input type="checkbox" v-model="item.twitch_movable"
                                                class="form-checkbox checkbox-lg scale-150 ml-4 h-5 w-5 text-blue-600 transition active:scale-[.95]" />
                                        </td>

                                        <!-- Boundary Dropdown -->
                                        <td>
                                            <select v-if="item.twitch_movable" v-model="item.boundary_key"
                                                class="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                                                <option disabled value="">Select Boundary</option>
                                                <option value="none" selected>None</option>
                                                <option v-for="(_, key, ind) in configStore.bounds" :key="key"
                                                    :value="key">
                                                    #{{ ind + 1 }}
                                                </option>
                                            </select>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
th {
    background-color: #d8d8d8;
}

th,
td {
    border-bottom-width: 2px;
    border-left-width: 1px;
    border-right-width: 0px;
    border-top-width: 0px;
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
    text-align: justify;
    text-indent: 4px;
}

input {
    width: 48px;
    padding: 0px;
    padding-left: 0px;
    appearance: auto;
    background-color: rgb(255, 255, 255);
    border-collapse: collapse;
    border-color: rgb(209, 213, 219);
    border-style: solid;
    border-width: 2px;
    border-radius: 8px;
    box-sizing: border-box;
}
</style>