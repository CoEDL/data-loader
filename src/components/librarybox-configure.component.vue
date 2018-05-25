<template>
    <div>
        <div class="row my-1">
            <div class="col">
                Library Box Configuration Tool
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
                    <label for="rootPassword">Password</label>
                    <input type="text" class="form-control" id="rootPassword"
                      aria-describedby="rootPasswordHelp" placeholder=""
                      v-model="rootPassword">
                    <small id="rootPasswordHelp" class="form-text text-muted">
                        Administrator password.
                    </small>
                </div>
            </div>
        </div>
        <div class="row my-1">
            <div class="col">
                <button class="btn" v-on:click="configure" :disabled="!rootPassword">
                    Configure my Library Box
                </button>
            </div>
        </div>
        <div class="row my-1">
            <librarybox-load-data-logger-component></librarybox-load-data-logger-component>
        </div>
    </div>
</template>

<script>
import LibraryboxLoadDataLoggerComponent from './logger.component.vue';

import {
    setDeviceRootPassword,
    canLoginOverSSH,
    checkTelnetAccessible,
    reconfigureLibraryBox
} from '../services/librarybox-mgr-service.js';
export default {
    data() {
        return {
            libraryBoxConfigured: false,
            unableToLogin: undefined,
            deviceIpAddress: '192.168.1.1',
            rootPassword: undefined
        };
    },
    components: {
        LibraryboxLoadDataLoggerComponent
    },
    methods: {
        async configure() {
            const conf = {
                rootPassword: this.rootPassword,
                deviceIpAddress: this.deviceIpAddress
            };
            if (await checkTelnetAccessible(conf)) {
                this.$store.commit(
                    'setLibraryBoxInfoMessage',
                    'Setting the administrator password.'
                );
                await setDeviceRootPassword(conf);
                this.$store.commit(
                    'setLibraryBoxCompleteMessage',
                    'Administrator password set.'
                );
            }
            if (await canLoginOverSSH(conf)) {
                this.$store.commit(
                    'setLibraryBoxInfoMessage',
                    'Configuring the device.'
                );
                await reconfigureLibraryBox(conf);
                this.libraryBoxConfigured = true;
                this.$store.commit(
                    'setLibraryBoxCompleteMessage',
                    'Device configured.'
                );
            } else {
                this.$store.commit(
                    'setLibraryBoxErrorMessage',
                    `That password is not correct. I'm to unable to login to the device with it.`
                );
                this.unableToLogin = true;
            }
        }
    }
};
</script>
