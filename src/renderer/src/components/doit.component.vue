<template>
    <div>
        <el-form ref="form" :model="data.form" label-position="top">
            <el-form-item>
                <div class="flex flex-col">
                    <div class="flex flex-row">
                        <el-button
                            type="primary"
                            @click="loadTheData"
                            :disabled="data.loading || !canLoad"
                        >
                            <i class="fas fa-cog" v-bind:class="{ 'fa-spin': data.loading }"></i
                            >&nbsp; Load the data
                        </el-button>
                        <!-- <el-button type="danger" @click="stopDataLoad" :disabled="!data.loading">
                            <i class="fas fa-ban" v-bind:class="{ 'fa-spin': data.loading }"></i
                            >&nbsp; Stop data load
                        </el-button> -->
                        <el-button type="danger" @click="reset" :disabled="!canLoad">
                            <i class="fas fa-ban"></i>
                            &nbsp; reset
                        </el-button>
                    </div>
                    <div class="text-lg text-red-600">
                        **This will wipe any other content currently on the Disk**
                    </div>
                </div>
            </el-form-item>
        </el-form>
    </div>
</template>

<script setup>
import { reactive, computed } from "vue"
import { useStore } from "vuex"
const $store = useStore()

const $emit = defineEmits(["reset"])
const data = reactive({
    doit: false,
    form: {},
    progress: 0
})
let canLoad = computed(() => {
    return $store.state.localDataPath && $store.state.usbMountPoint
})
let loadProgress = computed(() => {
    return $store.state.loadProgress || 100
})
async function loadTheData() {
    $emit("reset")
    window.api.loadData({
        localDataPath: $store.state.localDataPath,
        usbMountPoint: $store.state.usbMountPoint,
        targetDevice: $store.state.targetDevice
    })
}
function reset() {
    $emit("reset")
    $store.commit("resetDataPathSelection")
    $store.commit("resetUsbDiskSelection")
}
</script>
