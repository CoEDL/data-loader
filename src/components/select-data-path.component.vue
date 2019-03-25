<template>
    <div class="card">
        <div class="card-body" v-if="!dataPath">
            <h5 class="card-title">Data Path</h5>
            <h6
                class="card-subtitle mb-2 text-muted"
            >Please select the folder containing the data you wish to load.</h6>
            <select-folder-component name="setLocalDataPath"></select-folder-component>
        </div>
        <div class="card-body" v-if="dataPath">
            <div class="row">
                <div class="col-10">
                    <h6 class="card-title center-text align-middle">Data Path: {{dataPath}}</h6>
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
import SelectFolderComponent from "./select-folder.component.vue";
export default {
    computed: {
        dataPath() {
            return this.$store.state.localDataPath;
        }
    },
    components: {
        SelectFolderComponent
    },
    methods: {
        reset() {
            this.$store.commit("resetDataPathSelection");
        }
    }
};
</script>

<style scoped>
.center-text {
    padding-top: 9px;
}
</style>
