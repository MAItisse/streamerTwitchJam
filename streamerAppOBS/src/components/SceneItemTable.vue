<script setup lang="ts">
import { watch } from 'vue';
import { computed } from 'vue';
import { useConfigStore } from '../store/configStore';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const configStore = useConfigStore();

const numSceneItems = computed(() => {
    return Object.keys(configStore.obsSceneItems).length;
});

function onMovableChange(item: any) {
  // When the item becomes movable and has no boundary set, default to 'none'
  if (item.twitch_movable && !item.boundary_key && !item.allowList_key) {
    item.boundary_key = 'none';
    item.allowList_key = 'everyone';
  }
}

// watch(() => configStore., (newValue, _) => {
//   // console.log("AllowList: watch props.allowList fired.");
//   if (timeoutId) {
//     clearTimeout(timeoutId);
//   }
//   // Set a new timeout to trigger the function after 1 second
//   timeoutId = setTimeout(() => {
//     handleTypingDone(newValue, configStore.addStreamerToAllLists);
//   }, 1000);
// }, { deep: true });

</script>

<template>
    <!-- Choose Sources -->
    <div class="w-full">
        <div v-if="numSceneItems > 0">
            <div class="overflow-x-auto">
                <h1 class="mb-0 text-md font-extrabold">
                    <FontAwesomeIcon class="mr-1 text-xl" icon="object-group"></FontAwesomeIcon>
                    Choose Sources
                </h1>
                <div class="font-semibold text-gray-500 text-sm">
                    Choose which OBS Sources that users will be able to move
                </div>
                <div class="pt-2">
                    <table class="w-full bg-white">
                        <thead>
                            <tr class="bg-gray-300">
                                <th>Source Name</th>
                                <th>Movable?</th>
                                <th>Boundary</th>
                                <th>Allow List</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in configStore.obsSceneItems" :key="item.sceneItemId"
                                :class="{ 'hover:bg-gray-50': true, 'bg-blue-200': item.twitch_movable, 'hover:bg-blue-400': item.twitch_movable }">

                                <!-- Source Name -->
                              <td class="sourceNames">{{ item.sourceName }}</td>

                                <!-- Enabled Checkbox -->
                                <td>
                                    <input type="checkbox" v-model="item.twitch_movable" @change="onMovableChange(item)"
                                           class="form-checkbox checkbox-lg scale-150 ml-4 h-5 w-5 text-blue-600 transition active:scale-[.95]" />
                                </td>
                                <!-- Boundary Dropdown -->
                                <td>
                                    <select v-if="item.twitch_movable" v-model="item.boundary_key"
                                        class="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                                        <!-- <option disabled value="">Select Boundary</option> -->
                                        <option value="none" selected>None</option>
                                        <option value="locked">Locked</option>
                                        <option v-for="(_, key, ind) in configStore.bounds" :key="key" :value="key">
                                            #{{ ind + 1 }}
                                        </option>
                                    </select>
                                </td>
                                <!-- Allow List Dropdown -->
                              <td>
                                <select
                                    v-if="item.twitch_movable"
                                    v-model="item.allowList_key"
                                    class="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50">

                                  <option value="everyone" selected>Everyone</option>
                                  <option v-for="(listData, key, ind) in configStore.allowList" :key="key" :value="key">
                                    {{ key }}
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
</template>

<style scoped lang="scss">
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
    padding: 4px 0px;
    vertical-align: middle;

    box-sizing: border-box;
    color: rgb(55, 65, 81);
    font-size: 12px;
    font-weight: 600;
    line-height: 12px;
    text-align: justify;
    text-indent: 4px;
}

input {
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
    align-items: center;
}

.sourceNames {
  text-align: center;
}
</style>