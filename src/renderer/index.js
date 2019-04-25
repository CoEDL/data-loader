"use strict";

import "bootstrap/dist/css/bootstrap.css";
import "element-ui/lib/theme-chalk/index.css";
import "assets/main.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import fontawesome from "@fortawesome/fontawesome-pro/js/all";
config.autoReplaceSvg = "nest";

import Vue from "vue";
import VueRouter from "vue-router";
import ElementUI from "element-ui";
import locale from "element-ui/lib/locale/lang/en";
import VueScrollTo from "vue-scrollto";
import Vuex from "vuex";
Vue.use(VueRouter);
Vue.use(Vuex);
Vue.use(ElementUI, { locale });
Vue.use(VueScrollTo);

import App from "components/app";
import routes from "./routes";
import store from "./store";
App.router = new VueRouter({ routes });
App.store = new Vuex.Store(store);
new Vue(App);
