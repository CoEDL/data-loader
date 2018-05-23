<template>
    <button class="btn btn-default" v-on:click="back">
        <i class="fas fa-arrow-left"></i>
    </button>
</template>

<script>
export default {
    methods: {
        back() {
            this.$router.push('introduction');
        }
    }
};
</script>
