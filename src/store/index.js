"use strict";

import { isArray, last } from "lodash";

export default {
    state: {
        libraryBoxDataLoad: {
            usbMountPoint: undefined,
            hostname: "catalog.paradisec.offline",
            ssid: "PARADISEC Catalog",
            index: {
                type: "id",
                speakerRoles: []
            },
            messages: [],
            lastMessage: ""
        },
        folderDataLoad: {
            path: undefined,
            index: {
                type: "id",
                speakerRoles: []
            },
            messages: [],
            lastMessage: ""
        },
        localDataPath: undefined
    },
    getters: {
        libraryBoxLoadingComplete: state => {
            if (state.libraryBoxDataLoad.lastMessage.msg) {
                return state.libraryBoxDataLoad.lastMessage.msg.match(/Done/);
            }
            return false;
        }
    },
    mutations: {
        resetMessages(state) {
            state.libraryBoxDataLoad.messages = [];
            state.libraryBoxDataLoad.lastMessage = "";
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
        setLibraryBoxIndexType(state, configuration) {
            state.libraryBoxDataLoad.index = { ...configuration };
        },
        setFolderPath(state, path) {
            state.folderDataLoad.path = path;
        },
        setFolderIndexType(state, configuration) {
            state.folderDataLoad.index = { ...configuration };
        },
        setInfoMessage(state, payload) {
            let msgs = payload.msg;
            if (!isArray(msgs)) msgs = [msgs];
            state[payload.target].messages = [
                ...state[payload.target].messages,
                ...msgs.map(m => {
                    return { type: "info", msg: m };
                })
            ];
            state[payload.target].lastMessage = last(
                state[payload.target].messages
            );
        },
        setCompleteMessage(state, payload) {
            let msgs = payload.msg;
            if (!isArray(msgs)) msgs = [msgs];
            state[payload.target].messages = [
                ...state[payload.target].messages,
                ...msgs.map(m => {
                    return { type: "infoComplete", msg: m };
                })
            ];
            state[payload.target].lastMessage = last(
                state[payload.target].messages
            );
        },
        setErrorMessage(state, payload) {
            let msgs = payload.msg;
            if (!isArray(msgs)) msgs = [msgs];
            state[payload.target].messages = [
                ...state[payload.target].messages,
                ...msgs.map(m => {
                    return { type: "error", msg: m };
                })
            ];
            state[payload.target].lastMessage = last(
                state[payload.target].messages
            );
        },
        setLocalDataPath(state, path) {
            state.localDataPath = path;
        }
    }
};
