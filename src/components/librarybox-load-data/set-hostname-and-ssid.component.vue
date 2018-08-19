<template>
    <div class="card">
        <div class="card-body">
            <h5 class="card-title">Set the Website and Wireless Network Names</h5>
            <div class="row">
                <div class="col">
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
                <div class="col">
                    <h6 class="card-subtitle mb-2 text-muted">
                        The wireless network users will connect to is called:
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

        </div>
    </div>
</template>

<script>
import SelectFolderComponent from "../select-folder.component.vue";
export default {
    data() {
        return {
            newHostname: this.$store.state.libraryBoxDataLoad.hostname,
            newSsid: this.$store.state.libraryBoxDataLoad.ssid
        };
    },
    computed: {
        hostname() {
            return this.$store.state.libraryBoxDataLoad.hostname;
        },
        ssid() {
            return this.$store.state.libraryBoxDataLoad.ssid;
        }
    },
    components: {
        SelectFolderComponent
    },
    methods: {
        save() {
            this.$store.commit("setLibraryBoxHostname", this.newHostname);
            this.$store.commit("setLibraryBoxSsid", this.newSsid);
        }
    }
};
</script>

<style scoped>
.center-text {
    padding-top: 9px;
}
</style>
