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
                <!-- <data-logger-component></data-logger-component> -->
                <last-message-logger-component></last-message-logger-component>
            </div>
        </div>
        <div class="row my-1" v-if="done">
            <div class="col">
                <router-link class="nav-link" to="/configureLibraryBox">
                    Next Step: Configure your Library Box if you haven't already done so
                    (This step only needs to be done once when you first use it)
                </router-link>
                <router-link class="nav-link" to="/logs">
                    View the complete data load logs
                </router-link>
            </div>
        </div>
    </div>
</template>

<script>
import SelectFolderComponent from "../select-folder.component.vue";
import DataLoggerComponent from "../logger/logger.component.vue";
import LastMessageLoggerComponent from "../logger/last-message-logger.component.vue";
import DoitComponent from "./doit.component.vue";
import SelectUsbComponent from "./select-usb.component.vue";
import SelectDataPathComponent from "../select-data-path.component.vue";
import SetHostname from "./set-hostname.component.vue";
import SetSsid from "./set-ssid.component.vue";

export default {
  data() {
    return {
      hostname: "catalog.paradisec.offline",
      ssid: "PARADISEC Catalog"
    };
  },
  computed: {
    done() {
      return this.$store.getters.loadingComplete;
    }
  },
  components: {
    SelectFolderComponent,
    DataLoggerComponent,
    LastMessageLoggerComponent,
    DoitComponent,
    SelectUsbComponent,
    SelectDataPathComponent,
    SetHostname,
    SetSsid
  }
};
</script>
