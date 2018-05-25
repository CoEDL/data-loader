'use strict';

import Vue from 'vue';
import VueRouter from 'vue-router';
import Vuex from 'vuex';
import AsyncComputed from 'vue-async-computed';
Vue.use(VueRouter);
Vue.use(Vuex);
Vue.use(AsyncComputed);

import IntroductionComponent from './components/introduction.component.vue';
import LibraryBoxLoadDataComponent from './components/librarybox-load-data/load-data.component.vue';
import LibraryBoxConfigureComponent from './components/librarybox-configure.component.vue';
import storeConfiguration from './store';
const routes = [
    {
        path: '/introduction',
        name: 'introduction',
        component: IntroductionComponent
    },
    {
        path: '/loadLibraryBox',
        name: 'loadLibraryBox',
        component: LibraryBoxLoadDataComponent
    },
    {
        path: '/configureLibraryBox',
        name: 'configureLibraryBox',
        component: LibraryBoxConfigureComponent
    }
];

const router = new VueRouter({routes});
const store = new Vuex.Store(storeConfiguration);

import App from './components/app';
App.router = router;
App.store = store;
const app = new Vue(App);
