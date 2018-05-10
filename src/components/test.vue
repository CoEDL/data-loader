<template>
  <div>
    <h2>Hello from {{text}}</h2>
    <demo-component></demo-component>
  </div>
</template>

<script>
import DemoComponent from './demo.component.vue';
export default {
    name: 'test',
    data() {
        return {
            text: ''
        };
    },
    components: {
        DemoComponent
    }
};
console.log(DemoComponent);
</script>
