<template>
    <div>

        <button class="btn btn-default" v-on:click="home">
            <i class="fas fa-home"></i>
        </button>
        <button class="btn btn-default" v-on:click="back">
            <i class="fas fa-arrow-left"></i>
        </button>
    </div>
</template>

<script>
export default {
    methods: {
        home() {
            this.$router.push("/introduction");
        },
        back() {
            this.$router.go(-1);
        }
    }
};
</script>
