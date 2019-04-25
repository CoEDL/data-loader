<template>
    <div class="alert alert-info p-4">
        <div class="row style-alert">
            <div class="col-1 px-5">
                <i class="fas fa-lightbulb fa-3x"></i>
            </div>
            <div class="col">
                If there is some content you don't wish to have loaded, remove it from the source
                data folder before loading the device. However, be aware that an error will be logged given the
                mismatch between the content referenced in the CAT xml file and that available
                in the data folder. You can ignore those errors; but keep an eye out for others. The
                loaders try to log issues with the data.
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            expandText: false
        };
    }
};
</script>

<style lang="scss" scoped>
.style-alert {
    font-size: 14px;
}
</style>


 