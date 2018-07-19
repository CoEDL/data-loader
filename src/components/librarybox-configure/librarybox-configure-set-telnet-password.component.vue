<template>
    <div>
        <div class="row my-1">
            <div class="col">
                <div class="form-group">
                    <label for="rootPassword">Password</label>
                    <input type="text" class="form-control" id="rootPassword"
                      aria-describedby="rootPasswordHelp" placeholder=""
                      v-model="rootPassword">
                    <small id="rootPasswordHelp" class="form-text text-muted">
                        Administrator password to set on the device.
                    </small>
                </div>
            </div>
        </div>
        <div class="row my-1">
            <div class="col">
                <button class="btn btn-default" v-on:click="setRootPassword">
                    <i class="fas fa-key"></i>
                    Set Administrator Password
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import {
    setDeviceRootPassword,
    checkTelnetAccessible
} from '../services/librarybox-mgr-service.js';
export default {
    props: ['deviceIpAddress'],
    data() {
        return {
            rootPassword: ''
        };
    },
    methods: {
        async setRootPassword() {
            const response = await setDeviceRootPassword({
                rootPassword: this.rootPassword,
                deviceIpAddress: this.deviceIpAddress
            });
            this.$emit('password-set');
        }
    }
};
</script>
