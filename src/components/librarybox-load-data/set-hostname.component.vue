<template>
    <div class="card">
        <div class="card-body">
            <h5 class="card-title">Website Name</h5>
            <h6 class="card-subtitle mb-2 text-muted">
                Users will access this site at:
            </h6>
            <div class="input-group mb-2">
                <div class="input-group-prepend">
                    <div class="input-group-text">http://</div>
                </div>
                <input type="text" class="form-control"
                    aria-describedby="hostnameHelp" placeholder=""
                    v-model="newHostname"
                    v-on:change="save">
            </div>
        </div>
    </div>
</template>

<script>
import SelectFolderComponent from '../select-folder.component.vue';
export default {
    data() {
        return {
            newHostname: this.$store.state.libraryBoxDataLoad.hostname
        };
    },
    computed: {
        hostname() {
            return this.$store.state.libraryBoxDataLoad.hostname;
        }
    },
    components: {
        SelectFolderComponent
    },
    methods: {
        save() {
            this.$store.commit('setLibraryBoxHostname', this.newHostname);
        }
    }
};
</script>

<style scoped>
.center-text {
    padding-top: 9px;
}
</style>
