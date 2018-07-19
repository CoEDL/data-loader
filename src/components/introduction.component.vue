<template>
    <div>
        <div class="row mb-3">
            <div class="col">
                <p>
                This application will help you configure your Library Box
                so that it can operate as an offline Catalog or you can use
                it to create a totally standlone, offline catalog on any external
                disk.
                </p>

            </div>
        </div>
        <div class="row mb-3">
            <div class="col">
                <router-link class="nav-link" to="/loadLibraryBox">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Install Data onto a Library Box USB Disk</h5>
                            <p>
                                There are two aspects to this process:
                                <ul>
                                    <li>Loading data onto the USB disk. This can be done repeatedly
                                        though <strong>be aware that each time you run this
                                        process the existing data on the disk will
                                        be replaced with your new data load.</strong>
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
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Install Data onto a USB Disk</h5>
                        </div>
                    </div>
                </router-link>
            </div>
        </div>
    </div>
</template>

<script>
</script>
