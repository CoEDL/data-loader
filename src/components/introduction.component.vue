<template>
    <div>
        <div class="row mb-3">
            <div class="col">
                Welcome to the PARADISEC LibraryBox Installer. This application will
                help you configure your LibraryBox so that it can operate as an
                offline Catalog.
            </div>
        </div>
        <div class="row mb-3">
            <div class="col">
                <router-link class="nav-link" to="/loadLibraryBox">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Install Data onto a Library Box</h5>
                            <h6 class="card-subtitle mb-2 text-muted">
                                Do this to install data onto a Library Box. If you wish to add
                                data be sure to add it to your local data path. Running this
                                repeatedly does not keep adding to the data on the LibraryBox.
                            </h6>
                        </div>
                    </div>
                </router-link>
                <router-link class="nav-link" to="/configureLibraryBox">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Configure your Library Box</h5>
                            <h6 class="card-subtitle mb-2 text-muted">
                                This only needs to done once when you first set it up.
                            </h6>

                        </div>
                    </div>
                </router-link>
            </div>
        </div>
    </div>
</template>

<script>
</script>
