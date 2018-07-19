"use strict";

import { isArray, last } from "lodash";

export default {
    state: {
        libraryBoxDataLoad: {
            usbMountPoint: undefined,
            hostname: "catalog.paradisec.offline",
            ssid: "PARADISEC Catalog"
        },
        folderDataLoad: {
            path: undefined
        },
        messages: [],
        lastMessage: {},
        localDataPath: undefined
    },
    getters: {
        loadingComplete: state => {
            if (state.lastMessage.msg) {
                return state.lastMessage.msg.match(/Done/);
            }
            return false;
        }
    },
    mutations: {
        resetMessages(state) {
            state.messages = [];
            state.lastMessage = {};
        },
        resetUsbDiskSelection(state) {
            state.libraryBoxDataLoad.usbMountPoint = undefined;
        },
        resetFolderPathSelection(state) {
            state.folderDataLoad.path = undefined;
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
        setFolderPath(state, path) {
            state.folderDataLoad.path = path;
        },
        setInfoMessage(state, msgs) {
            if (!isArray(msgs)) msgs = [msgs];
            state.messages = [
                ...state.messages,
                ...msgs.map(m => {
                    return { type: "info", msg: m };
                })
            ];
            state.lastMessage = last(state.messages);
        },
        setCompleteMessage(state, msgs) {
            if (!isArray(msgs)) msgs = [msgs];
            state.messages = [
                ...state.messages,
                ...msgs.map(m => {
                    return { type: "infoComplete", msg: m };
                })
            ];
            state.lastMessage = last(state.messages);
        },
        setErrorMessage(state, msgs) {
            if (!isArray(msgs)) msgs = [msgs];
            state.messages = [
                ...state.messages,
                ...msgs.map(m => {
                    return { type: "error", msg: m };
                })
            ];
            state.lastMessage = last(state.messages);
        },
        setLocalDataPath(state, path) {
            state.localDataPath = path;
        }
    }
};
