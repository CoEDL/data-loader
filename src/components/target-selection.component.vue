<template>
    <div>
        <el-form ref="form" :model="form" label-width="200px">
            <el-form-item label="Target Device">
                <el-radio-group v-model="target" @change="saveSelection">
                    <el-radio-button label="Raspberry Pi"></el-radio-button>
                    <!-- <el-radio-button label="LibraryBox" :disabled="true"></el-radio-button> -->
                    <el-radio-button label="USB Disk"></el-radio-button>
                </el-radio-group>
            </el-form-item>
            <el-form-item label>
                <div v-if="target !== 'USB Disk'">
                    <div>
                        The wireless network will be set to:
                        <strong>{{wifi}}</strong>
                    </div>
                    <div>
                        Users will access the site at:
                        <strong>http://{{hostname}}</strong>
                    </div>
                </div>
            </el-form-item>
        </el-form>
    </div>
</template>

<script>
export default {
    data() {
        return {
            form: {},
            target: "Raspberry Pi"
        };
    },
    computed: {
        wifi: function() {
            return this.$store.state.ssid;
        },
        hostname: function() {
            return this.$store.state.hostname;
        }
    },
    mounted() {
        this.saveSelection();
    },
    methods: {
        saveSelection() {
            this.$store.commit("setTargetDevice", this.target);
        }
    }
};
</script>

<style lang="scss" scoped>
</style>


