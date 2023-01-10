"use strict"

import { createStore } from "vuex"

import { isArray, round } from "lodash"

const mutations = {
    setTargetDevice(state, device) {
        state.targetDevice = device
    },
    setUsbPath(state, path) {
        state.usbMountPoint = path
    },
    setLocalDataPath(state, path) {
        state.localDataPath = path
    },
    resetDataPathSelection(state) {
        state.localDataPath = undefined
    },
    resetUsbDiskSelection(state) {
        state.usbMountPoint = undefined
    }
}

const actions = {}

export const store = new createStore({
    state: resetState(),
    mutations,
    actions,
    modules: {}
})

function resetState() {
    return {
        targetDevice: "Raspberry Pi",
        localDataPath: undefined,
        usbMountPoint: undefined,
        hostname: "catalog.net",
        ssid: "PARADISEC"
    }
}
