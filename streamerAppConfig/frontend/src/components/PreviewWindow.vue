<template>
    <div ref="previewWindow" class="preview-window"
        :style="{ backgroundImage: 'url(' + bgImage + ')', backgroundSize: 'cover', aspectRatio: videoWidth + '/' + videoHeight }">
        <div v-for="(boundary, index) in boundaries" :key="index" :data-index="index" class="boundary"
            :style="calculateBoundaryStyle(boundary)">
            <div
                class="w-full h-full flex items-center justify-center text-3xl drop-shadow-[0_0px_5.2px_rgba(255,255,255,1)]">
                {{ index + 1 }}</div>
        </div>
        {{ videoWidth }} x {{ videoHeight }}
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, type PropType } from 'vue';
import interact from 'interactjs';

// Props
const props = defineProps({
    videoWidth: {
        type: Number,
        required: true,
    },
    videoHeight: {
        type: Number,
        required: true,
    },
    boundaries: {
        type: Array as PropType<Bound[]>,
        required: true,
        default: [],
    },
    bgImage: {
        type: String,
        required: true
    }
});

// Emit changes to the parent component
const emit = defineEmits(['update:uniqueBounds']);

// Refs and Computed Dimensions
const previewWindow = ref(null);
const previewWidth = 640; // Set a fixed width for the preview window
const previewHeight = (props.videoHeight / props.videoWidth) * previewWidth;

type Bound = {
    key?: string,
    left: number,
    top: number,
    right: number,
    bottom: number
}

// Calculate boundary style based on video dimensions
const calculateBoundaryStyle = (boundary: Bound) => {
    return {
        left: `${Math.max(0, boundary.left * previewWidth)}px`,
        top: `${Math.max(0, boundary.top * previewHeight)}px`,
        width: `${Math.max(0, (boundary.right - boundary.left) * previewWidth)}px`,
        height: `${Math.max(0, (boundary.bottom - boundary.top) * previewHeight)}px`,
    };
};

function roundToHundredths(num: number) {
    return Math.round(num * 100) / 100;
}

// Setup interact.js for draggable and resizable functionality
const setupInteract = () => {
    props.boundaries.forEach((_, index) => {
        const selector = `.boundary[data-index="${index}"]`;
        const element = document.querySelector(selector);

        // Check if the element has already been initialized
        if (element && element.getAttribute('data-interact-initialized')) {
            return; // Skip this element if already initialized
        }

        // Mark the element as initialized
        if (element) {
            element.setAttribute('data-interact-initialized', 'true');
        }

        interact(`.boundary[data-index="${index}"]`)
            .draggable({
                modifiers: [
                    interact.modifiers.restrict({
                        restriction: "parent",
                    }),
                ],
                onmove(event) {
                    const { target, dx, dy } = event;
                    const x = (parseFloat(target.style.left) || 0) + dx;
                    const y = (parseFloat(target.style.top) || 0) + dy;

                    // Set the new position while restricting to the preview window
                    target.style.left = `${Math.max(0, Math.min(x, previewWidth - target.offsetWidth))}px`;
                    target.style.top = `${Math.max(0, Math.min(y, previewHeight - target.offsetHeight))}px`;
                },
                onend(event) {
                    const { target } = event;
                    const index = target.getAttribute('data-index');
                    props.boundaries[index].left = roundToHundredths(parseFloat(target.style.left) / previewWidth);
                    props.boundaries[index].top = roundToHundredths(parseFloat(target.style.top) / previewHeight);
                    props.boundaries[index].right = roundToHundredths((parseFloat(target.style.left) + parseFloat(target.style.width)) / previewWidth);
                    props.boundaries[index].bottom = roundToHundredths((parseFloat(target.style.top) + parseFloat(target.style.height)) / previewHeight);
                    emit('update:uniqueBounds', [...props.boundaries]);
                    return null;
                },
            })
            .resizable({
                edges: { left: true, right: true, top: true, bottom: true },
                modifiers: [
                    interact.modifiers.restrictSize({
                        min: { width: 20, height: 20 },
                        max: { width: previewWidth, height: previewHeight },
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
                    props.boundaries[index].left = roundToHundredths(parseFloat(target.style.left) / previewWidth);
                    props.boundaries[index].top = roundToHundredths(parseFloat(target.style.top) / previewHeight);
                    props.boundaries[index].right = roundToHundredths((parseFloat(target.style.left) + parseFloat(target.style.width)) / previewWidth);
                    props.boundaries[index].bottom = roundToHundredths((parseFloat(target.style.top) + parseFloat(target.style.height)) / previewHeight);
                    emit('update:uniqueBounds', [...props.boundaries]);
                    return null;
                },
            });
    });
};

// Initialize interact on mount and when preview dimensions change
onMounted(() => {
    setupInteract();
});

watch(() => props.boundaries, () => {
    setupInteract();
}, { deep: true });

</script>

<style scoped lang="scss">
.preview-window {
    width: 640px;
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