<template>
    <div class="card">
        <div class="card-body" v-if="!usbDisk">
            <h5 class="card-title">Library Box USB Disk</h5>
            <h6 class="card-subtitle mb-2 text-muted">
                Please select the folder where the LibraryBox USB disk is mounted.
            </h6>
            <p class="card-text">
                Ensure the LibraryBox disk is plugged in to your computer. If it's not,
                please plug it in now.
            </p>
            <select-folder-component name='setLibraryBoxUsbPath'></select-folder-component>
        </div>
        <div class="card-body" v-if="usbDisk">
            <div class="row">
                <div class="col-10">
                    <h6 class="card-title center-text align-middle">
                        Library Box USB Disk: {{usbDisk}}
                    </h6>
                </div>
                <div class="col">
                    <button class="btn float-right" v-on:click="reset">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import SelectFolderComponent from '../select-folder.component.vue';
export default {
    computed: {
        usbDisk() {
            return this.$store.state.libraryBoxDataLoad.usbMountPoint;
        }
    },
    components: {
        SelectFolderComponent
    },
    methods: {
        reset() {
            this.$store.commit('resetUsbDiskSelection');
        }
    }
};
</script>

<style scoped>
.center-text {
    padding-top: 9px;
}
</style>
