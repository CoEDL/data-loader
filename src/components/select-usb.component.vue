<template>
    <div>
        <el-form ref="form" :model="form" label-width="200px">
            <el-form-item label="USB Disk">
                <span v-if="!usbDisk">
                    <select-folder-component name="setUsbPath"></select-folder-component>
                    <p class="text-muted">
                        Please specify the folder where the USB disk is mounted
                        <em>on your computer</em>. This applies to all devices.
                    </p>
                </span>
                <span v-if="usbDisk">
                    {{usbDisk}}
                    <span class="px-4">
                        <el-button type="danger" v-on:click="reset" circle size="mini">
                            <i class="fas fa-times fa-fw"></i>
                        </el-button>
                    </span>
                </span>
            </el-form-item>
        </el-form>
    </div>
</template>

<script>
import SelectFolderComponent from "./select-folder.component.vue";
export default {
    data() {
        return {
            form: {}
        };
    },
    computed: {
        targetDevice: function() {
            return this.$store.state.targetDevice;
        },
        usbDisk() {
            return this.$store.state.usbMountPoint;
        }
    },
    components: {
        SelectFolderComponent
    },
    methods: {
        reset() {
            this.$store.commit("resetUsbDiskSelection");
        }
    }
};
</script>

<style scoped>
</style>
