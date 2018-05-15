'use strict';

import Vue from 'vue';
import VueRouter from 'vue-router';
Vue.use(VueRouter);

import IntroductionComponent from './components/introduction.component.vue';
import Step1Component from './components/step1.component.vue';
import Step2Component from './components/step2.component.vue';
const routes = [
    {
        path: '/introduction',
        name: 'introduction',
        component: IntroductionComponent
    },
    {path: '/step1', name: 'step1', component: Step1Component},
    {path: '/step2', name: 'step2', component: Step2Component}
];

const router = new VueRouter({
    routes
});

import App from './components/app';
App.router = router;
const app = new Vue(App);
