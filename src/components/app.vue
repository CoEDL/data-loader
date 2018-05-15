
<template>
    <div>
      <navbar-component></navbar-component>
      <div class="container-fluid container-background">
          <!-- <nav class="nav flex-column mb-5">
              <router-link class="nav-link" to="/step1">
                  Configuring a new LibraryBox
              </router-link>
              <router-link class="nav-link" to="/step2">
                  Installing your data onto a LibraryBox
              </router-link>
            </nav> -->
          <introduction-component></introduction-component>
          <router-view></router-view>
      </div>
    </div>
</template>

<script>
import Vue from 'vue';
import NavbarComponent from './navbar.component.vue';
import IntroductionComponent from './introduction.component.vue';

export default {
    el: '#app',
    name: 'test',
    data() {
        return {};
    },
    components: {
        NavbarComponent,
        IntroductionComponent
    }
};
</script>

<style scoped>
.container-background {
    /* background-color: red; */
    height: 100vh;
    width: 100vw;
}
</style>
