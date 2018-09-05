<template>
    <div>
        <ul class="fa-ul">
            <li>
                <span class="fa-li">
                    <i class="fas fa-angle-right" v-if="last.type === 'info'"></i>
                    <i class="fas fa-check-square" v-if="last.type === 'infoComplete'"></i>
                    <i class="fas fa-times" v-if="last.type === 'error'"></i>
                </span>
                <span v-bind:class="{
                    infoMessageStyle: last.type === 'infoComplete',
                    errorMessageStyle: last.type === 'error'
                }">
                    {{last.msg}}
                </span>
            </li>
        </ul>
    </div>
</template>

<script>
import { mapState } from "vuex";

export default {
    props: {
        target: String
    },
    data() {
        return {};
    },
    computed: {
        last: function() {
            return this.$store.state[this.target].lastMessage;
        }
    },
    methods: {}
};
</script>

<style scoped>
.infoMessageStyle {
    color: green;
}

.errorMessageStyle {
    color: red;
}
</style>
