'use strict';

import {isArray} from 'lodash';

export default {
    state: {
        libraryBoxDataLoad: {
            usbMountPoint: '/Volumes/LB',
            messages: []
        },
        localDataPath: '/Users/mlarosa/src/librarybox/data2'
    },
    mutations: {
        resetLibraryBoxMessages(state) {
            state.libraryBoxDataLoad.messages = [];
        },
        setLibraryBoxUsbPath(state, path) {
            state.libraryBoxDataLoad.usbMountPoint = path;
        },
        setLibraryBoxInfoMessage(state, msgs) {
            if (!isArray(msgs)) msgs = [msgs];
            state.libraryBoxDataLoad.messages = [
                ...state.libraryBoxDataLoad.messages,
                ...msgs.map(m => {
                    return {type: 'info', msg: m};
                })
            ];
        },
        setLibraryBoxCompleteMessage(state, msgs) {
            if (!isArray(msgs)) msgs = [msgs];
            state.libraryBoxDataLoad.messages = [
                ...state.libraryBoxDataLoad.messages,
                ...msgs.map(m => {
                    return {type: 'infoComplete', msg: m};
                })
            ];
        },
        setLibraryBoxErrorMessage(state, msgs) {
            if (!isArray(msgs)) msgs = [msgs];
            state.libraryBoxDataLoad.messages = [
                ...state.libraryBoxDataLoad.messages,
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
