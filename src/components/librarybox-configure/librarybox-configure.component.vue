<template>
    <div>
        <div class="row my-1">
            <div class="col">
                <p class="card-text strong">
                    <strong>
                        Before continuing ensure that you have completed the following:
                        <ol>
                            <li>The USB disk is plugged in to the Library Box;</li>
                            <li>the Library Box is turned on; and,</li>
                            <li>you've connected to the Library Box WIFI.</li>
                        </ol>
                    </strong>
                </p>
            </div>
        </div>
        <div class="row my-1">
            <div class="col">
                <div class="form-group">
                    <label for="deviceIpAddress">Device IP Address</label>
                    <input type="text" class="form-control" id="deviceIpAddress"
                           aria-describedby="deviceIpAddressHelp" placeholder=""
                           v-model="deviceIpAddress">
                    <small id="deviceIpAddressHelp" class="form-text text-muted">
                        IP Address of the LibraryBox Device.
                    </small>
                </div>
            </div>
        </div>
        <div class="row my-1">
            <div class="col">
                <div class="form-group">
                    <label for="rootPassword">Administrator Password</label>
                    <input type="text" class="form-control" id="rootPassword"
                           aria-describedby="rootPasswordHelp" placeholder=""
                           v-model="rootPassword">
                    <small id="rootPasswordHelp" class="form-text text-muted">
                        If this is the first time configuring the device then this can
                        be anything you like. Otherwise, if you're running this step
                        again it must be what you set the first time.
                    </small>
                </div>
            </div>
        </div>
        <div class="row my-1">
            <div class="col-5">
                <button class="btn"
                        v-on:click="configure"
                        :disabled="!rootPassword || configuring">
                    <i class="fas fa-cog" v-bind:class="{'fa-spin': configuring}"></i>
                    Configure my Library Box
                </button>
            </div>
            <div class="col-7">
                <data-logger-component></data-logger-component>
            </div>
        </div>
    </div>
</template>

<script>
import DataLoggerComponent from "../logger/logger.component.vue";

import {
  setDeviceRootPassword,
  canLoginOverSSH,
  checkTelnetAccessible,
  reconfigureLibraryBox
} from "../../services/librarybox-mgr-service.js";
export default {
  data() {
    return {
      configuring: false,
      libraryBoxConfigured: false,
      unableToLogin: undefined,
      deviceIpAddress: "192.168.1.1",
      rootPassword: undefined
    };
  },
  beforeMount() {
    this.$store.commit("resetMessages");
  },
  beforeDestroy() {
    this.$store.commit("resetMessages");
  },
  components: {
    DataLoggerComponent
  },
  methods: {
    async configure() {
      this.configuring = true;
      this.$store.commit("setInfoMessage", "Configuring the device.");

      setTimeout(async () => {
        const conf = {
          rootPassword: this.rootPassword,
          deviceIpAddress: this.deviceIpAddress
        };
        if (await checkTelnetAccessible(conf)) {
          this.$store.commit(
            "setInfoMessage",
            "Setting the administrator password."
          );
          await setDeviceRootPassword(conf);
          this.$store.commit(
            "setCompleteMessage",
            "Administrator password set."
          );
        }
        if (await canLoginOverSSH(conf)) {
          await reconfigureLibraryBox(conf);
          this.libraryBoxConfigured = true;
          this.$store.commit("setCompleteMessage", "Device configured.");
        } else {
          this.$store.commit(
            "setErrorMessage",
            `That password is not correct. I'm to unable to login to the device with it.`
          );
          this.unableToLogin = true;
        }
        this.configuring = false;
      }, 100);
    }
  }
};
</script>
