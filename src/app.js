"use strict";

import fontawesome from "@fortawesome/fontawesome";
fontawesome.config.autoReplaceSvg = "nest";

import Vue from "vue";
import VueRouter from "vue-router";
import Vuex from "vuex";
import AsyncComputed from "vue-async-computed";
Vue.use(VueRouter);
Vue.use(Vuex);
Vue.use(AsyncComputed);

import IntroductionComponent from "./components/introduction.component.vue";
import LibraryBoxLoadDataComponent from "./components/librarybox-load-data/load-data.component.vue";
import LibraryBoxConfigureComponent from "./components/librarybox-configure/librarybox-configure.component.vue";
import LoggerComponent from "./components/logger/logger.component.vue";
import LoadDiskComponent from "./components/load-disk/LoadDiskComponent.vue";
import storeConfiguration from "./store";
const routes = [
  {
    path: "/introduction",
    name: "introduction",
    component: IntroductionComponent
  },
  {
    path: "/loadLibraryBox",
    name: "loadLibraryBox",
    component: LibraryBoxLoadDataComponent
  },
  {
    path: "/configureLibraryBox",
    name: "configureLibraryBox",
    component: LibraryBoxConfigureComponent
  },
  {
    path: "loadDisk",
    name: "loadDisk",
    component: LoadDiskComponent
  },
  {
    path: "/logs",
    name: "viewLogs",
    component: LoggerComponent
  }
];

const router = new VueRouter({ routes });
const store = new Vuex.Store(storeConfiguration);

import App from "./components/app";
App.router = router;
App.store = store;
new Vue(App);
