<template>
    <div>
        <el-form ref="form" :model="data.form" label-position="top">
            <el-form-item label="Data Path">
                <span v-if="!dataPath">
                    <select-folder-component name="setLocalDataPath"></select-folder-component>
                    <p class="text-sm text-gray-600">
                        Please specify the folder that contains the data you wish to load onto the
                        device.
                    </p>
                </span>
                <span v-if="dataPath">
                    {{ dataPath }}
                    <span class="px-4">
                        <el-button type="danger" @click="reset">
                            <i class="fas fa-trash fa-fw"></i>
                        </el-button>
                    </span>
                </span>
            </el-form-item>
        </el-form>
    </div>
</template>

<script setup>
import SelectFolderComponent from "./select-folder.component.vue"
import { reactive, computed } from "vue"
import { useStore } from "vuex"
const $store = useStore()

const data = reactive({
    form: {}
})
let dataPath = computed(() => $store.state.localDataPath)
function reset() {
    $store.commit("resetDataPathSelection")
}
</script>
