<script setup lang="ts">
import { onMounted, PropType, ref, watch } from 'vue';
import { BoundaryWithKey } from '../types';


const localBoundaries = ref<BoundaryWithKey[]>([]);

const props = defineProps({
    uniqueBoundaries: {
        type: Array as PropType<BoundaryWithKey[]>,
        required: true,
        default: [],
    },
});

onMounted(() => {

});

// Note: I've seen plenty of examples where this isn't needed
//       so I'm not sure why it's necessary here, but it is...
watch(props.uniqueBoundaries, (newUniques) => {
    localBoundaries.value = [];
    newUniques.forEach((b) => {
        localBoundaries.value.push(b);
    })
});


const emit = defineEmits(['add:boundary', 'update:uniqueBoundaries', 'remove:boundary']);

watch(localBoundaries, (newBoundaries) => {
    emit('update:uniqueBoundaries', newBoundaries);
}, { deep: true });


const emitAdd = () => {
    emit('add:boundary');
}
const emitRemove = (index: number) => {
    emit('remove:boundary', index);
};

</script>

<template>
    <section>
        <div class="p-4">
            <div class="flex flex-col mt-3 items-center justify-center p-6 bg-gray-100 rounded-lg shadow-lg mx-auto">
                <div class="w-full">
                    <div>
                        <div class="overflow-x-auto">
                            <h1 class="mb-4 text-xl font-extrabold">Setup Screen Boundaries <small
                                    class="m-4 font-semibold text-gray-500 dark:text-gray-400">Users can't move OBS
                                    Sources outside of
                                    their
                                    assigned boundaries</small></h1>
                            <div>
                                <button type="button" @click="emitAdd"
                                    class="m-4 px-4 py-2 font-semibold text-white bg-green-500 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition active:scale-[.95]">
                                    Add new Boundary
                                </button>
                                <table class="min-w-full bg-white">
                                    <thead>
                                        <tr>
                                            <th
                                                class="px-6 py-3 w-1/6 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                                                #</th>
                                            <th
                                                class="px-6 py-3 w-1/6 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                                                Top</th>
                                            <th
                                                class="px-6 py-3 w-1/6 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                                                Left</th>
                                            <th
                                                class="px-6 py-3 w-1/6 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                                                Right</th>
                                            <th
                                                class="px-6 py-3 w-1/6 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                                                Bottom</th>
                                            <th
                                                class="px-6 py-3 w-1/6 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                                            </th>
                                        </tr>
                                    </thead>
                                    <transition-group name="fade" tag="tbody">
                                        <tr v-for="(boundary, ind) in localBoundaries" :key="boundary.key"
                                            class="hover:bg-gray-50 fade-row">

                                            <td class="px-6 py-4 text-lg font-bold border-b border-gray-200">
                                                {{ ind + 1 }}
                                            </td>

                                            <!-- Position -->
                                            <td class="px-6 py-4 border-b border-gray-200">
                                                <input type="number" min="0" max="1" step="0.001"
                                                    v-model.number="boundary.top"
                                                    class="px-2 py-2 w-32 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            </td>
                                            <td class="px-6 py-4 border-b border-gray-200">
                                                <input type="number" min="0" max="1" step="0.001"
                                                    v-model.number="boundary.left"
                                                    class="px-2 py-2 w-32 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            </td>
                                            <td class="px-6 py-4 border-b border-gray-200">
                                                <input type="number" min="0" max="1" step="0.001"
                                                    v-model.number="boundary.right"
                                                    class="px-2 py-2 w-32 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            </td>
                                            <td class="px-6 py-4 border-b border-gray-200">
                                                <input type="number" min="0" max="1" step="0.001"
                                                    v-model.number="boundary.bottom"
                                                    class="px-2 py-2 w-32 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            </td>
                                            <td class="px-6 py-4 border-b border-gray-200">
                                                <button type="button" v-if="uniqueBoundaries.length > 1"
                                                    @click="emitRemove(ind)"
                                                    class="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-md px-2.5 py-1 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900 transition active:scale-[.95]">X</button>
                                            </td>
                                        </tr>
                                    </transition-group>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped lang="sass">

</style>