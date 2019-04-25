<template>
    <div>
        <alert-component/>
        <target-selection-component/>
        <select-data-path-component/>
        <select-usb-component/>
        <do-it-component/>
        <logger-component v-if="messages.length"/>
    </div>
</template>

<script>
import AlertComponent from "./alert.component.vue";
import TargetSelectionComponent from "./target-selection.component.vue";
import SelectDataPathComponent from "./select-data-path.component.vue";
import SelectUsbComponent from "./select-usb.component.vue";
import DoItComponent from "./doit.component.vue";
import LoggerComponent from "./logger/logger.component.vue";

export default {
    components: {
        AlertComponent,
        TargetSelectionComponent,
        SelectDataPathComponent,
        SelectUsbComponent,
        DoItComponent,
        LoggerComponent
    },
    data() {
        return {};
    },
    computed: {
        messages: function() {
            return this.$store.state.messages;
        }
    }
};
</script>

<style lang="scss" scoped>
</style>


