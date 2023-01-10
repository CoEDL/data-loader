<template>
    <el-button type="primary" @click="selectFolder">
        <i class="fas fa-folder-open"></i>&nbsp; Select folder
    </el-button>
</template>

<script setup>
import { useStore } from "vuex"
const $store = useStore()

const props = defineProps({
    name: {
        type: String,
        required: true
    }
})
const $emit = defineEmits(["selected-folder"])
async function selectFolder() {
    const folder = await window.api.selectFolder()
    if (folder) {
        $store.commit(props.name, folder)
    }
}
</script>
