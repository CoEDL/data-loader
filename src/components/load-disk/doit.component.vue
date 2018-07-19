<template>
    <div v-if="targetPath && localDataPath">
        <div class="row my-3">
            <div class="col">
                <div class="form-check">
                   <input class="form-check-input" type="checkbox" value="" v-model="doit" id="doitCheck1">
                   <label class="form-check-label" for="doitCheck1">
                       Is this correct?
                   </label>
                </div>
            </div>
        </div>
        <div class="row my-6">
            <div class="col">
                <button
                    class="btn btn-default btn-block"
                    v-on:click="loadTheData"
                    :disabled="loading || !doit">
                        <i class="fas fa-cog" v-bind:class="{'fa-spin': loading}"></i>
                        Load the Data
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState } from "vuex";
import {
    buildDataTree,
    readCatalogFile,
    buildIndex,
    prepareTarget,
    installTheData,
    writeIndexFile,
    verifyTargetLibraryBoxDisk,
    installCollectionViewer,
    updateLibraryBoxConfigurationFiles
} from "../../services/data-service";

export default {
    data() {
        return {
            doit: false,
            loading: false
        };
    },
    computed: mapState({
        targetPath: state => state.folderDataLoad.path,
        localDataPath: state => state.localDataPath
    }),
    components: {},
    methods: {
        logInfo(msg) {
            this.$store.commit("setInfoMessage", msg);
        },
        logError(msg) {
            this.$store.commit("setErrorMessage", msg);
        },
        logComplete(msg) {
            this.$store.commit("setCompleteMessage", msg);
        },
        getLoggers() {
            return {
                logInfo: this.logInfo,
                logComplete: this.logComplete,
                logError: this.logError
            };
        },
        async loadTheData() {
            this.loading = true;
            setTimeout(async () => {
                try {
                    let errors, result, index;
                    this.logInfo("Processing the data to be loaded.");
                    result = await buildDataTree(this.localDataPath);
                    this.logError(result.errors);
                    this.logComplete("Data processed");

                    this.logInfo("Building the index.");
                    index = buildIndex(result.items);
                    this.logComplete("Index built");
                    this.loading = false;
                } catch (error) {
                    this.logError(error.message);
                    this.loading = false;
                }
            }, 100);
        }
    }
};
</script>
