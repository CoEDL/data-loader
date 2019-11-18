<template>
    <div class="style-logs-container" id="logs-container">
        <ul class="fa-ul" v-if="messages.length">
            <li v-for="(m, idx) in messages" :key="idx">
                <span class="fa-li">
                    <i class="fas fa-angle-right" v-if="m.type === 'info'"></i>
                    <i class="fas fa-check-square" v-if="m.type === 'infoComplete'"></i>
                    <i class="fas fa-times" v-if="m.type === 'error'"></i>
                </span>
                <span
                    v-bind:class="{
                    infoMessageStyle: m.type === 'infoComplete',
                    errorMessageStyle: m.type === 'error'
                }"
                >{{m.msg}}</span>
            </li>
        </ul>
        <div ref="bottom"></div>
    </div>
</template>

<script>
import { mapState } from "vuex";
import VueScrollTo from "vue-scrollto";
import { clearTimeout } from "timers";
import { throttle } from "lodash";

export default {
    data() {
        return {
            timeoutHandler: undefined,
            sliceSize: 20,
            scrollToBottom: throttle(() => {
                VueScrollTo.scrollTo(this.$refs["bottom"], 0, {
                    container: "#logs-container"
                });
            }, 1000)
        };
    },
    computed: {
        messages: function() {
            this.scrollToBottom();
            return this.$store.state.messages;
        }
    }
};
</script>

<style scoped>
.style-logs-container {
    height: 300px;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 15px;
    overflow: scroll;
}

.infoMessageStyle {
    color: green;
}

.errorMessageStyle {
    color: red;
}
</style>
