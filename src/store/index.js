'use strict';

import {isArray} from 'lodash';

export default {
    state: {
        libraryBoxDataLoad: {
            usbMountPoint: undefined,
            hostname: 'catalog.paradisec.offline',
            ssid: 'PARADISEC Catalog'
        },
        messages: [],
        localDataPath: undefined
    },
    mutations: {
        resetLibraryBoxMessages(state) {
            state.messages = [];
        },
        resetUsbDiskSelection(state) {
            state.libraryBoxDataLoad.usbMountPoint = undefined;
        },
        resetDataPathSelection(state) {
            state.localDataPath = undefined;
        },
        setLibraryBoxUsbPath(state, path) {
            state.libraryBoxDataLoad.usbMountPoint = path;
        },
        setLibraryBoxHostname(state, hostname) {
            state.libraryBoxDataLoad.hostname = hostname;
        },
        setLibraryBoxSsid(state, ssid) {
            state.libraryBoxDataLoad.ssid = ssid;
        },
        setInfoMessage(state, msgs) {
            if (!isArray(msgs)) msgs = [msgs];
            state.messages = [
                ...state.messages,
                ...msgs.map(m => {
                    return {type: 'info', msg: m};
                })
            ];
        },
        setCompleteMessage(state, msgs) {
            if (!isArray(msgs)) msgs = [msgs];
            state.messages = [
                ...state.messages,
                ...msgs.map(m => {
                    return {type: 'infoComplete', msg: m};
                })
            ];
        },
        setErrorMessage(state, msgs) {
            if (!isArray(msgs)) msgs = [msgs];
            state.messages = [
                ...state.messages,
                ...msgs.map(m => {
                    return {type: 'error', msg: m};
                })
            ];
        },
        setLocalDataPath(state, path) {
            state.localDataPath = path;
        }
    }
};
