<template>
  <div>
      <div class="row my-1">
          <div class="col">
              <select-target-component></select-target-component>
          </div>
      </div>
      <div class="row my-1">
          <div class="col">
              <select-data-path-component></select-data-path-component>
          </div>
      </div>
  </div>
</template>

<script>
import SelectTargetComponent from "./select-target.component.vue";
import SelectDataPathComponent from "../select-data-path.component.vue";

export default {
    data() {
        return {};
    },
    components: {
        SelectTargetComponent,
        SelectDataPathComponent
    }
};
</script>

<style lang="scss" scoped>
</style>
