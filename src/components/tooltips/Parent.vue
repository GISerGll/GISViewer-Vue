<template>
        <test-child1 v-if="value"></test-child1>
        <test-child2 v-else></test-child2>
</template>

<script>
    import TestChild1 from "@/components/tooltips/TestChild1";
    import TestChild2 from "@/components/tooltips/TestChild2";
    export default {
        name: "Parent.vue",
        components:{
            TestChild1,
            TestChild2
        },
        data:function () {
            return{
                value:0
            }
        }
    }
</script>

<style scoped>

</style>