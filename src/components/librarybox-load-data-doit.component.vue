<template>
    <div>
        <div class="row my-3">
            <div class="col">
                Data path: {{localDataPath}}
            </div>
        </div>
        <div class="row my-3">
            <div class="col">
                LibraryBox USB Mount Point: {{usbMountPoint}}
            </div>
        </div>
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
    </div>
</template>

<script>
import {mapState} from 'vuex';
import {
    buildDataTree,
    readCatalogFile,
    buildIndex,
    prepareTarget,
    installTheData,
    writeIndexFile,
    verifyTargetLibraryBoxDisk,
    installCollectionViewer
} from '../services/data-service';

export default {
    data() {
        return {
            doit: false,
            loading: false
        };
    },
    computed: mapState({
        usbMountPoint: state => state.libraryBoxDataLoad.usbMountPoint,
        localDataPath: state => state.localDataPath
    }),
    components: {},
    methods: {
        logInfo(msg) {
            this.$store.commit('setLibraryBoxInfoMessage', msg);
        },
        logError(msg) {
            this.$store.commit('setLibraryBoxErrorMessage', msg);
        },
        logComplete(msg) {
            this.$store.commit('setLibraryBoxCompleteMessage', msg);
        },
        async loadTheData() {
            this.loading = true;
            const installationTarget = `${this.usbMountPoint}/LibraryBox`;
            let index;
            setTimeout(async () => {
                this.$store.commit('resetLibraryBoxMessages');
                this.logInfo('Verifying the target disk.');
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
                this.logComplete('DiskVerified');

                this.logInfo('Preparing the target disk.');
                prepareTarget(installationTarget);
                this.logComplete('Disk verified');

                this.logInfo('Installing the viewer.');
                installCollectionViewer(installationTarget);
                this.logComplete('Viewer installed');

                let errors, result;
                this.logInfo('Processing the data to be loaded.');
                result = await buildDataTree(this.localDataPath);
                this.logError(result.errors);
                this.logComplete('Data processed');

                this.logInfo('Building the index.');
                index = buildIndex(result.items);
                this.logComplete('Index built');

                this.logInfo('Installing the data (this can take some time).');
                setTimeout(() => {
                    result = installTheData(
                        this.localDataPath,
                        installationTarget,
                        index
                    );
                    this.logError(result.errors);
                    this.logComplete('Data installed');
                    this.loading = false;

                    this.logInfo('Writing the index file.');
                    writeIndexFile(installationTarget, index);
                    this.logComplete('Index file written.');
                }, 1000);
            }, 10);
        }
    }
};
</script>
