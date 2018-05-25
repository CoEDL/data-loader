<template>
    <div class="card">
        <div class="card-body">
            <h5 class="card-title">Wireless Network Name</h5>
            <h6 class="card-subtitle mb-2 text-muted">
                Name of the wireless network users will connect to.
            </h6>
            <div class="input-group mb-2">
                <div class="input-group-prepend">
                    <div class="input-group-text">
                        <i class="fas fa-wifi"></i>
                    </div>
                </div>
                <input type="text" class="form-control"
                    aria-describedby="ssidHelp" placeholder=""
                    v-model="newSsid"
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
            newSsid: this.$store.state.libraryBoxDataLoad.ssid
        };
    },
    computed: {
        ssid() {
            return this.$store.state.libraryBoxDataLoad.ssid;
        }
    },
    components: {
        SelectFolderComponent
    },
    methods: {
        save() {
            this.$store.commit('setLibraryBoxSsid', this.newSsid);
        }
    }
};
</script>

<style scoped>
.center-text {
    padding-top: 9px;
}
</style>
