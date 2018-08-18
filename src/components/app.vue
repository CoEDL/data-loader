
<template>
    <div>
      <navbar-component></navbar-component>
      <div class="container-fluid container-background">
          <router-view></router-view>
      </div>
    </div>
</template>

<script>
import Vue from "vue";
import NavbarComponent from "./navbar.component.vue";

export default {
    el: "#app",
    name: "test",
    data() {
        return {};
    },
    mounted() {
        this.$router.push("introduction");
    },
    components: {
        NavbarComponent
    }
};
</script>

<style scoped>
</style>
