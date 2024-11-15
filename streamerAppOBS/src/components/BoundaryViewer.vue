<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useConfigStore } from '../store/configStore';
import { useAppStore } from '../store/appStore';
import { Boundary } from '../types';
import interact from 'interactjs';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';


const appStore = useAppStore();

const previewWidth = 320; // Set a fixed width for the preview window
const previewHeight = computed(() => {
    const baseWidth = configStore.videoSettings?.baseWidth || 1980;
    const baseHeight = configStore.videoSettings?.baseHeight || 1080;

    return (baseHeight / baseWidth) * previewWidth;
});

const configStore = useConfigStore();
const previewSceneItemSelect = ref("");
const previewBackgroundImage = ref("");

// calculate boundary style based on video dimensions
const calculateBoundaryStyle = (boundary: Boundary) => {
    return {
        left: `${Math.max(0, boundary.left * previewWidth)}px`,
        top: `${Math.max(0, boundary.top * previewHeight.value)}px`,
        width: `${Math.max(0, (boundary.right - boundary.left) * previewWidth)}px`,
        height: `${Math.max(0, (boundary.bottom - boundary.top) * previewHeight.value)}px`,
    };
};

const roundToThousandths = (num: number) => {
    return Math.round(num * 1000) / 1000;
}

// Setup interact.js dragging/resizing handlers
const setupInteract = () => {
    Object.keys(configStore.bounds).forEach(key => {
        const selector = `.boundary[data-index="${key}"]`;
        const element = document.querySelector(selector);

        // Check if the element has already been initialized
        if (element && element.getAttribute('data-interact-initialized')) {
            return; // skip this element if already initialized
        }

        // mark the element as initialized
        if (element) {
            element.setAttribute('data-interact-initialized', 'true');
        }

        interact(`.boundary[data-index="${key}"]`)
            .draggable({
                modifiers: [
                    interact.modifiers.restrictSize({
                        min: { width: 20, height: 20 },
                        max: { width: previewWidth, height: previewHeight.value },
                    }),
                    interact.modifiers.restrictEdges({
                        outer: "parent",
                    }),
                ],
                onmove(event) {
                    const { target, dx, dy } = event;
                    const x = (parseFloat(target.style.left) || 0) + dx;
                    const y = (parseFloat(target.style.top) || 0) + dy;

                    // Set the new position while restricting to the preview window
                    target.style.left = `${Math.max(0, Math.min(x, previewWidth - target.offsetWidth))}px`;
                    target.style.top = `${Math.max(0, Math.min(y, previewHeight.value - target.offsetHeight))}px`;

                },
                onend(event) {
                    const { target } = event;
                    const index = target.getAttribute('data-index');
                    configStore.bounds[index].left = roundToThousandths(parseFloat(target.style.left) / previewWidth);
                    configStore.bounds[index].top = roundToThousandths(parseFloat(target.style.top) / previewHeight.value);
                    configStore.bounds[index].right = roundToThousandths((parseFloat(target.style.left) + parseFloat(target.style.width)) / previewWidth);
                    configStore.bounds[index].bottom = roundToThousandths((parseFloat(target.style.top) + parseFloat(target.style.height)) / previewHeight.value);
                    // emit('update:uniqueBounds', props.boundaries);
                    return true;
                },
            })
            .resizable({
                edges: { left: true, right: true, top: true, bottom: true },
                modifiers: [
                    interact.modifiers.restrictSize({
                        min: { width: 20, height: 20 },
                        max: { width: previewWidth, height: previewHeight.value },
                    }),
                    interact.modifiers.restrictEdges({
                        outer: "parent",
                    }),
                ],
                onmove(event) {
                    const { target, deltaRect } = event;

                    // Calculate new width and height
                    const newWidth = parseFloat(target.style.width) + deltaRect.width;
                    const newHeight = parseFloat(target.style.height) + deltaRect.height;

                    // Set the new size
                    target.style.width = `${newWidth}px`;
                    target.style.height = `${newHeight}px`;

                    // Adjust position based on which edge is being resized
                    if (event.edges.top) {
                        const newTop = parseFloat(target.style.top) - deltaRect.height;
                        target.style.top = `${Math.max(0, newTop)}px`;
                    }
                    if (event.edges.left) {
                        const newLeft = parseFloat(target.style.left) - deltaRect.width;
                        target.style.left = `${Math.max(0, newLeft)}px`;
                    }

                },
                onend(event) {
                    const { target } = event;
                    const index = target.getAttribute('data-index');
                    configStore.bounds[index].left = roundToThousandths(parseFloat(target.style.left) / previewWidth);
                    configStore.bounds[index].top = roundToThousandths(parseFloat(target.style.top) / previewHeight.value);
                    configStore.bounds[index].right = roundToThousandths((parseFloat(target.style.left) + parseFloat(target.style.width)) / previewWidth);
                    configStore.bounds[index].bottom = roundToThousandths((parseFloat(target.style.top) + parseFloat(target.style.height)) / previewHeight.value);
                    // emit('update:uniqueBounds', props.boundaries);
                    return null;
                },
            });
    });
};

// Initialize interact on mount and when preview dimensions change
onMounted(() => {

    // TODO: finish implementing this...

    // Make a best-guess at the pre-selected preview source dropdown
    getMostLikelyMainDisplay();

    setupInteract();
});

const getMostLikelyMainDisplay = () => {
    // let currentMaxScore = 0;
    let currentSceneItemId = 0;

    Object.keys(configStore.obsSceneItems).forEach(() => {

    });

    return currentSceneItemId;
}

watch(() => configStore.bounds, () => {
    console.log("BoundaryViewer: watch props.boundaries fired.")
    setupInteract();
}, { deep: true });

const loadPreviewScreenshot = async () => {
    console.log("BoundaryViewer: loadPreviewScreenshot:", previewSceneItemSelect.value);
    try {
        let res = await appStore.getSourceScreenshot(previewSceneItemSelect.value);
        previewBackgroundImage.value = res;
    } catch (e) {
        console.log("BoundaryViewer: loadPreviewScreenshot() error:", e);
    }
}
</script>

<template>
    <div class="w-full">
        <div class="flex justify-center items-center">
            <select v-model="previewSceneItemSelect"
                class="border-gray-300 py-1  rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                <option disabled value="">Select Source</option>
                <option v-for="source in configStore.obsSceneItems" :key="source.sceneItemId"
                    :value="source.sourceName">
                    {{ source.sourceName }}
                </option>
            </select>
            <button type="button" @click="loadPreviewScreenshot"
                class="m-2 px-4 py-0.5 font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition active:scale-[.95]">
                Load
                <FontAwesomeIcon icon="download"></FontAwesomeIcon>
            </button>
            <FontAwesomeIcon class="ml-1 text-gray-600 text-xl" icon="question-circle"
                v-tooltip="'Select your primary screen source to help line up your boundaries'">
            </FontAwesomeIcon>
        </div>
        <div class="flex justify-center">
            <div class="preview-window select-none"
                :style="{ backgroundImage: 'url(' + previewBackgroundImage + ')', backgroundSize: 'cover', aspectRatio: configStore.videoSettings.baseWidth + '/' + configStore.videoSettings.baseHeight }">
                <div v-for="(boundary, key, index) in configStore.bounds" :key="key" :data-index="key" class="boundary"
                    :style="calculateBoundaryStyle(boundary)">
                    <div
                        class="w-full h-full text-yellow-500 flex items-center justify-center text-3xl drop-shadow-[0_0px_5.2px_rgba(0,0,0,1)]">
                        {{ index + 1 }}</div>
                </div>
                <div class="select-none">
                    {{ configStore.videoSettings.baseWidth }} x {{ configStore.videoSettings.baseHeight }}
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.preview-window {
    width: 320px;
    border: 2px solid #333;
    position: relative;
    background-color: #fafafa;
    overflow: hidden;
}

.boundary {
    position: absolute;
    border: 2px dashed #007bff;
    background-color: rgba(0, 123, 255, 0.2);
    cursor: move;

    &:hover {
        background-color: rgba(0, 123, 255, 0.5);
    }
}
</style>