<template>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <back-button-component v-show="showBackButton"></back-button-component>
        <a class="navbar-brand">{{title}}</a>
    </nav>
</template>

<script>
import BackButtonComponent from './back-button.component.vue';

export default {
    data() {
        return {
            title: 'PARADISEC Data Loader',
            showBackButton: this.$router.currentRoute.name !== 'introduction'
        };
    },
    watch: {
        $route(to, from) {
            if (to.name === 'loadLibraryBox') {
                this.title = 'PARADISEC Library Box Data Loader';
            } else if (to.name === 'configureLibraryBox') {
                this.title = 'PARADISEC Library Box Setup';
            }
            this.showBackButton = to.name !== 'introduction';
        }
    },
    components: {
        BackButtonComponent
    }
};
</script>
