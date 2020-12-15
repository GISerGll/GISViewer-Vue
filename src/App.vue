<template>
  <div id="app">
    <home></home>
    <router-view />
  </div>
</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator';
import Home from '@/components/Home.vue';
import PluginTest3D from '@/components/PluginTest3D.vue';
import PluginTest from '@/components/PluginTest.vue';
import PluginGD from '@/components/PluginGD.vue';
import PluginPGIS_LS from "@/components/PluginPGIS_LS.vue";

@Component({
  components: {
    Home,
    PluginTest,
    PluginTest3D,
    PluginGD,
    PluginPGIS_LS
  }
})
export default class App extends Vue {}
</script>

<style>
body {
  padding: 0;
  margin: 0;
  height: 100%;
  width: 100%;
}
#app {
  height: 100vh;
}
</style>
