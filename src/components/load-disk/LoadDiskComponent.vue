<template>
  <div>
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
            <div class="col-4">
                <doit-component></doit-component>
            </div>
            <div class="col-8">
                <last-message-logger-component></last-message-logger-component>
            </div>
            <router-link class="nav-link" to="/logs" v-if="messages.length">
                View the complete data load logs
            </router-link>
        </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import SelectTargetComponent from "./select-target.component.vue";
import SelectDataPathComponent from "../select-data-path.component.vue";
import DoitComponent from "./doit.component.vue";
import LastMessageLoggerComponent from "../logger/last-message-logger.component.vue";

export default {
    data() {
        return {
            loading: false
        };
    },
    computed: {
        ...mapState({
            messages: state => state.messages
        })
    },
    components: {
        SelectTargetComponent,
        SelectDataPathComponent,
        DoitComponent,
        LastMessageLoggerComponent
    }
};
</script>

<style lang="scss" scoped>
</style>
