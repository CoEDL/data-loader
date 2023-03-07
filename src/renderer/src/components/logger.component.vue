<template>
    <div>
        <div ref="container" class="overflow-scroll" :style="{ height: props.height }">
            <ul class="fa-ul" v-if="props.messages.length">
                <li v-for="(m, idx) in props.messages" :key="idx">
                    <span class="fa-li">
                        <i class="fas fa-angle-right" v-if="m.level === 'info'"></i>
                        <i
                            class="fas fa-check-square text-green-500"
                            v-if="m.level === 'complete'"
                        ></i>
                        <i class="fas fa-times text-red-600" v-if="m.level === 'error'"></i>
                    </span>
                    <span
                        v-bind:class="{
                            infoMessageStyle: m.level === 'complete',
                            errorMessageStyle: m.level === 'error'
                        }"
                        >{{ m.text }}</span
                    >
                </li>
            </ul>
            <div ref="bottom"></div>
        </div>
    </div>
</template>

<script setup>
import VueScrollTo from "vue-scrollto"
import { ref, watch } from "vue"

const bottom = ref(null)
const container = ref(null)
const props = defineProps({
    messages: {
        type: Array,
        required: true
    },
    height: {
        type: String,
        required: true
    }
})
watch(
    () => props.messages.length,
    () => {
        VueScrollTo.scrollTo(bottom.value, 0, {
            container: container.value
        })
    }
)
</script>
