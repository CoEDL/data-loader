<template>
    <el-button type="primary" v-on:click="open">
        <i class="fas fa-folder-open"></i>
        Select folder
    </el-button>
</template>

<script>
const { dialog } = require("electron").remote;
export default {
    props: ["name"],
    data: function() {
        return {
            folder: ""
        };
    },
    methods: {
        open() {
            this.folder = dialog.showOpenDialog({
                properties: ["openDirectory"]
            });
            if (this.folder) {
                this.$store.commit(this.name, this.folder[0]);
            }
        }
    }
};
</script>
