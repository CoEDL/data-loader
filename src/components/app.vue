<template>
    <div>
        <navbar-component/>
        <div class="container-fluid">
            <router-view></router-view>
        </div>
    </div>
</template>

<script>
import NavbarComponent from "./navbar.component.vue";
export default {
    el: "#app",
    components: {
        NavbarComponent
    },
    data() {
        return {};
    },
    mounted() {
        this.$router.push({ path: "/" });
    }
};
</script>

<style scoped>
</style>
