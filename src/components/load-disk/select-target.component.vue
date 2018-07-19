<template>
    <div class="card">
        <div class="card-body" v-if="!targetFolder">
            <h5 class="card-title">Target installation</h5>
            <h6 class="card-subtitle mb-2 text-muted">
                Please select the folder where the offline catalog should be built. This
                can be a local folder or a folder on an external disk.
            </h6>
            <p class="card-text strong">
                <strong>
                    If you wish to install the catalog on an external disk please 
                    ensure it is plugged in your computer. If not, plug it in now.
                </strong>
            </p>
            <select-folder-component name='setFolderPath'></select-folder-component>
        </div>
        <div class="card-body" v-if="targetFolder">
            <div class="row">
                <div class="col-10">
                    <h6 class="card-title center-text align-middle">
                        Install folder: {{targetFolder}}
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
import SelectFolderComponent from "../select-folder.component.vue";
export default {
    computed: {
        targetFolder() {
            return this.$store.state.folderDataLoad.path;
        }
    },
    components: {
        SelectFolderComponent
    },
    methods: {
        reset() {
            this.$store.commit("resetFolderPathSelection");
        }
    }
};
</script>

<style scoped>
.center-text {
    padding-top: 9px;
}
</style>
