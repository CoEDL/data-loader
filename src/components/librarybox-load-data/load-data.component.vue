<template>
    <div>
        <div class="row my-1">
            <div class="col">
                <select-usb-component></select-usb-component>
            </div>
        </div>
        <div class="row my-1">
            <div class="col">
                <select-data-path-component></select-data-path-component>
            </div>
        </div>
        <div class="row my-1">
            <div class="col">
                <set-hostname></set-hostname>
            </div>
        </div>
        <div class="row my-1">
            <div class="col">
                <set-ssid></set-ssid>
            </div>
        </div>
        <div class="row my-1">
            <div class="col-4">
                <doit-component></doit-component>
            </div>
            <div class="col-8">
                <data-logger-component></data-logger-component>
            </div>
        </div>
    </div>
</template>

<script>
import SelectFolderComponent from '../select-folder.component.vue';
import DataLoggerComponent from '../logger.component.vue';
import DoitComponent from './doit.component.vue';
import SelectUsbComponent from './select-usb.component.vue';
import SelectDataPathComponent from '../select-data-path.component.vue';
import SetHostname from './set-hostname.component.vue';
import SetSsid from './set-ssid.component.vue';

export default {
    data() {
        return {
            hostname: 'catalog.paradisec.offline',
            ssid: 'PARADISEC Catalog'
        };
    },
    beforeMount() {
        this.$store.commit('resetMessages');
    },
    components: {
        SelectFolderComponent,
        DataLoggerComponent,
        DoitComponent,
        SelectUsbComponent,
        SelectDataPathComponent,
        SetHostname,
        SetSsid
    }
};
</script>
