import "./assets/index.css"
import "element-plus/theme-chalk/index.css"
import "@fortawesome/fontawesome-free/js/all"
import { config } from "@fortawesome/fontawesome-svg-core"
config.autoReplaceSvg = "nest"

import { createApp } from "vue"
import App from "./App.vue"
import ElementPlus from "element-plus"

import { store } from "./store.js"
import { createRouter, createWebHistory } from "vue-router"

const router = createRouter({
    history: createWebHistory("/"),
    routes: [
        {
            path: "/",
            name: "root",
            component: App
        }
    ]
})
const app = createApp(App)
app.use(router)
app.use(store)
app.use(ElementPlus)
app.mount("#app")
