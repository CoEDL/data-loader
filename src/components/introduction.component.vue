<template>
    <div>
        <div class="row mb-3">
            <div class="col">
                <!-- <p>
                This application will help you configure your Library Box
                so that it can operate as an offline Catalog or you can use
                it to create a totally standalone, offline catalog on any external
                disk.
                </p> -->

            </div>
        </div>
        <div class="row mb-3">
            <div class="col">
                <router-link class="nav-link" to="/loadLibraryBox">
                    <div class="card librarybox-loader-panel-style d-flex justify-content-center align-items-center hvr-sweep-to-right">
                        <div class="card-body">
                            <h4 class="card-title">Install Data onto a Library Box USB Disk</h4>
                            <p>
                                There are two aspects to this process:
                                <ul>
                                    <li>Loading data onto the USB disk. This can be done repeatedly
                                        though be aware that each time you run this
                                        process the existing data on the disk will
                                        be replaced with your new data load.
                                    </li>
                                    <li>Configuring the device. This only needs to be done once when
                                        the device is first configured.
                                    </li>
                                </ul>
                            </p>
                        </div>
                    </div>
                </router-link>
            </div>
        </div>

        <div class="row mb-3">
            <div class="col">
                <router-link class="nav-link" to="/loadDisk">
                    <div class="card usb-loader-panel-style d-flex justify-content-center align-items-center hvr-sweep-to-right">
                        <div class="card-body">
                            <h4 class="card-title">Install Data onto a USB Disk</h4>
                            <p>
                                Select this option to create a statically generated, offline
                                catalog on any USB disk or in any folder. Note that this
                                version has reduced functionality compared to the viewer installed 
                                with Nabu.
                            </p>
                        </div>
                    </div>
                </router-link>
            </div>
        </div>
    </div>
</template>

<script>
</script>

<style scoped>
.librarybox-loader-panel-style {
    height: 300px;
}

.usb-loader-panel-style {
    height: 300px;
}

/* Sweep To Right */
.hvr-sweep-to-right {
    display: inline-block;
    vertical-align: middle;
    -webkit-transform: perspective(1px) translateZ(0);
    transform: perspective(1px) translateZ(0);
    box-shadow: 0 0 1px rgba(0, 0, 0, 0);
    position: relative;
    -webkit-transition-property: color;
    transition-property: color;
    -webkit-transition-duration: 0.3s;
    transition-duration: 0.3s;
}
.hvr-sweep-to-right:before {
    content: "";
    position: absolute;
    z-index: -1;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #2c3e50;
    -webkit-transform: scaleX(0);
    transform: scaleX(0);
    -webkit-transform-origin: 0 50%;
    transform-origin: 0 50%;
    -webkit-transition-property: transform;
    transition-property: transform;
    -webkit-transition-duration: 0.3s;
    transition-duration: 0.3s;
    -webkit-transition-timing-function: ease-out;
    transition-timing-function: ease-out;
}
.hvr-sweep-to-right:hover,
.hvr-sweep-to-right:focus,
.hvr-sweep-to-right:active {
    color: white;
}
.hvr-sweep-to-right:hover:before,
.hvr-sweep-to-right:focus:before,
.hvr-sweep-to-right:active:before {
    -webkit-transform: scaleX(1);
    transform: scaleX(1);
}
</style>

<style>
.card-body {
    flex: unset;
}
</style>