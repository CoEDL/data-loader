<template>
    <div>
        <el-form ref="form" :model="data.form" label-position="top">
            <el-form-item label="Target Device">
                <el-radio-group v-model="data.form.target" @change="saveSelection">
                    <el-radio-button label="Raspberry Pi" name="rpi"></el-radio-button>
                    <el-radio-button label="USB Disk" name="usb"></el-radio-button>
                </el-radio-group>
            </el-form-item>
            <el-form-item label>
                <div v-if="data.form.target === 'Raspberry Pi'">
                    <div>
                        The wireless network will be set to:
                        <strong>{{ data.wifi }}</strong>
                    </div>
                    <div>
                        Users will access the site at:
                        <strong>http://{{ data.hostname }}</strong>
                    </div>
                </div>
            </el-form-item>
        </el-form>
    </div>
</template>

<script setup>
import { reactive } from "vue"
import { useStore } from "vuex"

const $store = useStore()

const data = reactive({
    form: {
        target: "Raspberry Pi"
    },
    wifi: $store.state.ssid,
    hostname: $store.state.hostname
})
function saveSelection() {
    $store.commit("setTargetDevice", data.form.target)
}
</script>
