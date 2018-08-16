<template>
    <div v-if="usbMountPoint && hostname && ssid && localDataPath">
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
        usbMountPoint: state => state.libraryBoxDataLoad.usbMountPoint,
        hostname: state => state.libraryBoxDataLoad.hostname,
        ssid: state => state.libraryBoxDataLoad.ssid,
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
            this.$store.commit("resetMessages");
            const installationTarget = `${this.usbMountPoint}/LibraryBox`;
            let index;
            setTimeout(async () => {
                try {
                    this.logInfo("Verifying the target disk.");
                    if (!await verifyTargetLibraryBoxDisk(installationTarget)) {
                        this.logError(
                            `${
                                this.usbMountPoint
                            } doesn't look like a LibraryBox disk;`
                        );
                        this.logError(
                            `I was expecting to find a folder '${installationTarget}' but it doesn't exist.`
                        );
                    }
                    this.logComplete("DiskVerified");

                    this.logInfo("Preparing the target disk.");
                    prepareTarget(installationTarget);
                    this.logComplete("Disk prepared");

                    this.logInfo("Installing the viewer.");
                    installCollectionViewer(installationTarget);
                    this.logComplete("Viewer installed");

                    this.logInfo("Configuring the system.");
                    updateLibraryBoxConfigurationFiles({
                        target: this.usbMountPoint,
                        hostname: this.hostname,
                        ssid: this.ssid
                    });
                    this.logComplete("System configured");

                    let errors, result;
                    this.logInfo("Processing the data to be loaded.");
                    result = await buildDataTree(this.localDataPath);
                    this.logError(result.errors);
                    this.logComplete("Data processed");

                    this.logInfo("Building the index.");
                    index = buildIndex({
                        items: result.items,
                        loggers: this.getLoggers()
                    });
                    this.logComplete("Index built");

                    this.logInfo("Loading the data (this can take some time).");
                    setTimeout(async () => {
                        result = await installTheData({
                            dataPath: this.localDataPath,
                            target: installationTarget,
                            index: index,
                            loggers: this.getLoggers()
                        });
                        // this.logError(result.errors);
                        this.logComplete("Data loaded");
                        this.loading = false;

                        this.logInfo("Writing the index file.");
                        writeIndexFile(installationTarget, result.index);
                        this.logComplete("Index file written.");
                        this.logComplete(
                            "Done. You can now plug the disk into the LibraryBox."
                        );
                    }, 1000);
                } catch (error) {
                    this.logError(error.message);
                    this.loading = false;
                }
            }, 100);
        }
    }
};
</script>
