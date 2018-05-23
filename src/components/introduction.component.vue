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
                Please select one of the following options:
                <nav class="nav flex-column mb-3">
                    <router-link class="nav-link" to="/loadLibraryBox">
                        Installing your data onto a LibraryBox
                    </router-link>
                    <router-link class="nav-link" to="/configureLibraryBox">
                        Configuring a new LibraryBox
                    </router-link>
                </nav>
            </div>
        </div>
    </div>
</template>

<script>
</script>
