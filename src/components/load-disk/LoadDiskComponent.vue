<template>
    <div>
        <div class="row my-1">
            <div class="col">
                <index-generator-component component="loadDisk"></index-generator-component>
            </div>
        </div>
        <div class="row my-1">
            <div class="col">
                <select-target-component></select-target-component>
            </div>
        </div>
        <div class="row my-1">
            <div class="col">
                <select-data-path-component></select-data-path-component>
            </div>
        </div>
        <div class="row my-1">
            <div class="col">
                <doit-component></doit-component>
            </div>
        </div>
        <div class="row my-1">
            <div class="col">
                <last-message-logger-component target="folderDataLoad"></last-message-logger-component>
            </div>
            <router-link class="nav-link" to="/logs/loaddisk-logs">
                View the complete data load logs
            </router-link>
        </div>
    </div>
</template>

<script>
import { mapState } from "vuex";
import SelectTargetComponent from "./select-target.component.vue";
import SelectDataPathComponent from "../select-data-path.component.vue";
import IndexGeneratorComponent from "../index-generator.component.vue";
import DoitComponent from "./doit.component.vue";
import LastMessageLoggerComponent from "../logger/last-message-logger.component.vue";

export default {
    data() {
        return {
            loading: false
        };
    },
    components: {
        SelectTargetComponent,
        SelectDataPathComponent,
        IndexGeneratorComponent,
        DoitComponent,
        LastMessageLoggerComponent
    }
};
</script>

<style lang="scss" scoped>
</style>
