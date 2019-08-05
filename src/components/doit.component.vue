<template>
    <div>
        <el-form ref="form" :model="form" label-width="200px">
            <el-form-item>
                <el-button type="primary" v-on:click="loadTheData" :disabled="loading || !canLoad">
                    <i class="fas fa-cog" v-bind:class="{'fa-spin': loading}"></i>
                    Load the data
                </el-button>
                <el-button type="danger" v-on:click="stopDataLoad" :disabled="!loading">
                    <i class="fas fa-ban" v-bind:class="{'fa-spin': loading}"></i>
                    Stop data load
                </el-button>
                <p class="text-muted">This will wipe any other content currently on the Disk.</p>
                <el-progress :percentage="loadProgress" class="style-progress-bar" />
            </el-form-item>
        </el-form>
    </div>
</template>

<script>
import { DataLoader } from "../services/data-service";

export default {
    data() {
        return {
            doit: false,
            loading: false,
            form: {}
        };
    },
    computed: {
        canLoad: function() {
            let keys = Object.keys(this.$store.state);
            let data = keys.map(key => this.$store.state[key]);
            return data.includes(undefined) ? false : true;
        },
        loadProgress: function() {
            return this.$store.state.loadProgress || 100;
        }
    },
    methods: {
        loadTheData() {
            this.loading = true;
            const params = { ...this.$store.state };
            this.$store.commit("resetMessages");
            setTimeout(async () => {
                const dataloader = new DataLoader({
                    store: this.$store,
                    params
                });
                await dataloader.load();
                this.loading = false;
            }, 200);
        },
        stopDataLoad() {
            this.$store.commit("stopDataLoad");
            this.loading = false;
        }
    }
};
</script>

<style lang="scss" scoped>
.btn-style {
    font-size: 16px;
    min-height: 50px;
}

.style-progress-bar {
    width: 350px;
}
</style>