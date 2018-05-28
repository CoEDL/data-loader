<template>
    <div>
        <div class="row mb-3">
            <div class="col">
                <p>
                This application will help you configure your LibraryBox
                so that it can operate as an offline Catalog.
                </p>
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
                            <strong>The one caveat is that you must have loaded data
                            onto the disk before performing this step.</strong>
                        </li>
                    </ul>
                </p>
            </div>
        </div>
        <div class="row mb-3">
            <div class="col">
                <router-link class="nav-link" to="/loadLibraryBox">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Install Data onto a Library Box USB Disk</h5>
                        </div>
                    </div>
                </router-link>
                <router-link class="nav-link" to="/configureLibraryBox">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Configure your Library Box</h5>
                        </div>
                    </div>
                </router-link>
            </div>
        </div>
    </div>
</template>

<script>
</script>
