<template>
    <div>
        <el-form ref="form" :model="data.form" label-position="top">
            <el-form-item label="USB Disk">
                <span v-if="!usbDisk">
                    <select-folder-component name="setUsbPath"></select-folder-component>
                    <p class="text-sm text-gray-600">
                        Please specify the folder where the USB disk is mounted
                        <em>on your computer</em>. This applies to all devices.
                    </p>
                </span>
                <span v-if="usbDisk">
                    {{ usbDisk }}
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
let usbDisk = computed(() => $store.state.usbMountPoint)
function reset() {
    $store.commit("resetUsbDiskSelection")
}
</script>
