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
        async open() {
            this.folder = await dialog.showOpenDialog({
                properties: ["openDirectory"]
            });
            if (!this.folder.canceled && this.folder.filePaths) {
                this.$store.commit(this.name, this.folder.filePaths[0]);
            }
        }
    }
};
</script>
