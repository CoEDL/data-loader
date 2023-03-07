<template>
    <div class="flex flex-col">
        <navbar-component class="bg-blue-200 p-4" />
        <div class="flex flex-row">
            <div class="flex flex-col space-y-2 w-3/5 px-4 py-2">
                <div class="p-4">
                    <messages-component />
                </div>
                <target-selection-component />
                <select-data-path-component />
                <select-usb-component />
                <do-it-component @reset="data.logs = []" />
                <logger-component
                    :messages="data.errors"
                    height="100px"
                    v-if="data.errors.length"
                ></logger-component>
            </div>
            <div class="flex flex-col space-y-2 px-10 pt-2 border-l-2">
                <logger-component :messages="data.logs" :height="loggerHeight"></logger-component>
            </div>
        </div>
    </div>
</template>

<script setup>
import NavbarComponent from "./components/navbar.component.vue"
import MessagesComponent from "./components/messages.component.vue"
import TargetSelectionComponent from "./components/target-selection.component.vue"
import SelectDataPathComponent from "./components/select-data-path.component.vue"
import SelectUsbComponent from "./components/select-usb.component.vue"
import DoItComponent from "./components/doit.component.vue"
import LoggerComponent from "./components/logger.component.vue"
import { reactive, ref } from "vue"

const data = reactive({
    errors: [],
    logs: []
})
let loggerHeight = ref(`${window.innerHeight - 110}px`)

window.api.receiveMessage("message", (msg) => {
    data.logs = [...data.logs, ...msg]
    if (msg[0].level === "error") {
        data.errors.push(...msg)
        console.log(msg[0])
    }
})
window.api.receiveMessage("progress", (msg) => {
    data.progress = parseInt(msg.n) / parseInt(msg.total)
})
</script>
