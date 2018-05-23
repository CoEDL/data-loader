<template>
    <div>
        <div class="row my-1">
            <div class="col">
                Library Box Data Loader
            </div>
        </div>
        <div class="row my-1">
            <div class="col">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">Library Box USB Disk</h5>
                        <h6 class="card-subtitle mb-2 text-muted">
                            Please select the folder where the LibraryBox USB disk is mounted.
                        </h6>
                        <p class="card-text">
                            Ensure the LibraryBox disk is plugged in to your computer. If it's not,
                            please plug it in now.
                        </p>
                        <select-folder-component
                            name='setLibraryBoxUsbPath'>
                        </select-folder-component>
                    </div>
                </div>
            </div>
        </div>
        <div class="row my-1">
            <div class="col">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">Data path</h5>
                        <h6 class="card-subtitle mb-2 text-muted">
                            Please select the folder containing the data you wish to load.
                        </h6>
                        <select-folder-component
                            name='setLocalDataPath'>
                        </select-folder-component>
                    </div>
                </div>
            </div>
        </div>
        <div class="row my-1">
            <div class="col">
                <librarybox-load-data-doit-component></librarybox-load-data-doit-component>
            </div>
            <div class="col">
                <librarybox-load-data-logger-component></librarybox-load-data-logger-component>
            </div>
        </div>
    </div>
</template>

<script>
import SelectFolderComponent from './select-folder.component.vue';
import LibraryboxLoadDataLoggerComponent from './librarybox-load-data-logger.component.vue';
import LibraryboxLoadDataDoitComponent from './librarybox-load-data-doit.component.vue';
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
    components: {
        SelectFolderComponent,
        LibraryboxLoadDataLoggerComponent,
        LibraryboxLoadDataDoitComponent
    }
};
</script>
