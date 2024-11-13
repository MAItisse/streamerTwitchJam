<script setup lang="ts">
import { onMounted } from 'vue';
import { useConfigStore } from '../store/configStore';
import { generateKey } from '../utils';

const configStore = useConfigStore();


onMounted(() => {
    if (Object.keys(configStore.bounds).length == 0) {
        addBoundary();
    }
});

function addBoundary() {
    console.log("DashboardPage: addBoundary()");
    const key = generateKey()
    configStore.bounds[key] = {
        left: 0.25,
        top: 0.25,
        right: 0.75,
        bottom: 0.75
    }
    console.log("boundaries = ", configStore.bounds.values);
}

function removeBoundary(key: string) {
    delete configStore.bounds[key];
}

</script>

<template>
    <section>
        <div>
            <div class="flex flex-col mt-2 items-center justify-center p-2 bg-gray-100 rounded-lg shadow-lg mx-auto">
                <div class="w-full">
                    <div>
                        <div class="overflow-x-auto">
                            <h1 class="mb-0 text-md font-extrabold">Setup Screen Boundaries
                            </h1>
                            <span class="font-semibold text-gray-500 text-sm">Users can't move OBS
                                Sources outside of
                                their
                                assigned boundaries</span>
                            <div>

                                <table class="min-w-full bg-white">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Top</th>
                                            <th>Left</th>
                                            <th>Right</th>
                                            <th>Bottom</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <transition-group name="fade" tag="tbody">
                                        <tr v-for="(boundary, key, ind) in configStore.bounds" :key="key"
                                            class="hover:bg-gray-50 fade-row">

                                            <td>
                                                {{ ind + 1 }}
                                            </td>

                                            <!-- Position -->
                                            <td>
                                                <input type="number" min="0" max="1" step="0.001"
                                                    v-model.number="boundary.top">
                                            </td>
                                            <td>
                                                <input type="number" min="0" max="1" step="0.001"
                                                    v-model.number="boundary.left">
                                            </td>
                                            <td>
                                                <input type="number" min="0" max="1" step="0.001"
                                                    v-model.number="boundary.right">
                                            </td>
                                            <td>
                                                <input type="number" min="0" max="1" step="0.001"
                                                    v-model.number="boundary.bottom">
                                            </td>
                                            <td>
                                                <button type="button" v-if="Object.keys(configStore.bounds).length > 1"
                                                    @click="removeBoundary(key as string)"
                                                    class="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-md px-2.5 py-1 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900 transition active:scale-[.95]">X</button>
                                            </td>
                                        </tr>
                                    </transition-group>
                                </table>
                                <div class="flex flex-row-reverse">
                                    <button type="button" @click="addBoundary"
                                        class="m-2 px-2.5 py-0.5 font-semibold text-white bg-green-500 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition active:scale-[.95]">
                                        Add new Boundary
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<!-- <td class="px-6 py-4 border-b border-gray-200"> -->
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
    padding: 4px px;
    vertical-align: middle;

    box-sizing: border-box;
    color: rgb(55, 65, 81);
    font-size: 14px;
    font-weight: 600;
    line-height: 12px;
    text-align: center;
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