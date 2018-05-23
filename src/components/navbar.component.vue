<template>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <back-button-component v-show="showBackButton"></back-button-component>
        <a class="navbar-brand" href="#">Paradisec Data Loader</a>
    </nav>
</template>

<script>
import BackButtonComponent from './back-button.component.vue';

export default {
    data() {
        return {
            showBackButton: this.$router.currentRoute.name !== 'introduction'
        };
    },
    watch: {
        $route(to, from) {
            this.showBackButton = to.name !== 'introduction';
        }
    },
    components: {
        BackButtonComponent
    }
};
</script>
