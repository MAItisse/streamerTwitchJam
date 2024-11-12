<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import BoundaryEditor from '../components/BoundaryTable.vue';
import BoundaryViewer from '../components/BoundaryViewer.vue';
import { useConfigStore } from '../store/configStore';
import { Boundary, BoundaryWithKey } from '../types';
import LoginPage from './LoginPage.vue';
import { generateKey } from '../utils';

const configStore = useConfigStore();

const uniqueBoundaries = reactive<BoundaryWithKey[]>([...getUniqueBoundaries(configStore.boundaries)]);

// TODO: fix these stubs to real values
let obsScreenshot = '';
let baseWidth = 1920;
let baseHeight = 1080;

onMounted(() => {
    console.log("DashboardPage: onMounted()")
    if (uniqueBoundaries.values.length == 0) {
        addBoundary();
    }
});

function getUniqueBoundaries(boundaries: { [key: string]: Boundary }): BoundaryWithKey[] {
    const values = Object.values(boundaries);

    const uniqueValues: Boundary[] = values.filter((value, index, self) =>
        index === self.findIndex((v) =>
            v.left === value.left &&
            v.right === value.right &&
            v.bottom === value.bottom &&
            v.top === value.top
        )
    );

    // Add a unique "key" field for use later
    const keyedBoundaries = uniqueValues.map(bound => ({
        ...bound,
        key: generateKey(),
    }));

    console.log("BoundaryEditor: getUniqueBoundaries() returning: ", keyedBoundaries);
    return keyedBoundaries;
}

function addBoundary() {
    console.log("DashboardPage: addBoundary()");
    const newBound: BoundaryWithKey = {
        key: generateKey(),
        left: 0.25,
        top: 0.25,
        right: 0.75,
        bottom: 0.75
    }
    uniqueBoundaries.push(newBound);
    console.log("boundaries = ", uniqueBoundaries);
}

// TODO: Remove this?
// const updateBoundary = (newBounds: object) => {
//     console.log("Updating boundaries... ", newBounds)
//     //   uniqueBoundaries.value = newBounds;
// };

function removeBoundary(index: number) {
    uniqueBoundaries.splice(index, 1);
}

const saveConfig = () => {
    console.log("DashboardPage: saveConfig()");

    // TODO 

}

</script>

<template>
    <section>
        <LoginPage></LoginPage>
    </section>
    <section>
        <div class="flex justify-center">
            <BoundaryEditor :uniqueBoundaries="uniqueBoundaries" @add:boundary="addBoundary"
                @remove:boundary="removeBoundary">
            </BoundaryEditor>
        </div>
        <div class="flex justify-center">
            <BoundaryViewer :videoWidth="baseWidth" :videoHeight="baseHeight" :boundaries="uniqueBoundaries"
                :bgImage="obsScreenshot"></BoundaryViewer>
        </div>
    </section>
    <section>
        <div class="w-50 pl-32 pr-32 mb-12">
            <button type="button" @click="saveConfig"
                class="w-full m-2 px-4 py-4 font-bold text-2xl text-white bg-green-600 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 active:bg-green-800 transition active:scale-[.98]">
                Save Config!
            </button>
            <!-- TODO: add "save" confirmation messages -->
        </div>
    </section>
</template>

<style scoped lang="sass">

</style>