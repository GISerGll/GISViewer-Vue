<template>
  <normal-tooltip v-if="type==='normal'" ref="normal" ></normal-tooltip>
  <alarm-tooltip v-else-if="type==='alarm'" ref="alarm"></alarm-tooltip>
  <SuspiciousTooltip v-else-if="type==='suspicious'" ref="suspicious"></SuspiciousTooltip>
  <normal-tooltip v-else></normal-tooltip>
</template>

<script>
    import NormalTooltip from "@/components/tooltips/NormalTooltip";
    import AlarmTooltip from "@/components/tooltips/AlarmTooltip";
    import SuspiciousTooltip from "@/components/tooltips/SuspiciousTooltip";

    export default {
        name: "Parent.vue",
        components:{
            NormalTooltip,
            AlarmTooltip,
            SuspiciousTooltip
        },
        props:{
            type:{
                type:String,
                default:"normal"
            },
            value1:{
                type:String,
                default:"no value"
            },
            value2:{
                type:String,
                default:"no value"
            }
        },
        mounted() {

        }
    }
</script>

<style scoped>

</style>