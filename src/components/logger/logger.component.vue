<template>
    <div>
        <ul class="fa-ul">
            <li v-for="m in messages" :key="m.id">
                <span class="fa-li">
                    <i class="fas fa-angle-right" v-if="m.type === 'info'"></i>
                    <i class="fas fa-check-square" v-if="m.type === 'infoComplete'"></i>
                    <i class="fas fa-times" v-if="m.type === 'error'"></i>
                </span>
                <span v-bind:class="{
                    infoMessageStyle: m.type === 'infoComplete',
                    errorMessageStyle: m.type === 'error'
                }">
                    {{m.msg}}
                </span>
            </li>
        </ul>
    </div>
</template>

<script>
import { mapState } from "vuex";

export default {
    data() {
        return {};
    },
    computed: {
        messages: function() {
            const target =
                this.$route.name === "viewLibraryBoxLogs"
                    ? "libraryBoxDataLoad"
                    : "folderDataLoad";
            return this.$store.state[target].messages;
        }
    }
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
