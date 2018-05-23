<template>
    <div>
        <div class="row">
            <div class="col">
                {{usbMountPoint}} {{localDataPath}}
            </div>
        </div>
    </div>
</template>

<script>
import {mapState} from 'vuex';

export default {
    computed: mapState({
        usbMountPoint: state => state.libraryBoxDataLoad.usbMountPoint,
        localDataPath: state => state.libraryBoxDataLoad.localDataPath
    }),
    components: {}
};
</script>
