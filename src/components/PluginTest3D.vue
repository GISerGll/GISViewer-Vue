<template>
  <div id="gisDiv">
    <div id="test">
      <button @click="btn_test1">test1</button>
      <button @click="btn_test2">test2</button>
      <button @click="btn_test3">test3</button>
    </div>
    <gis-viewer
      ref="gisViewer"
      platform="arcgis3d"
      :map-config="mapConfig"
      @map-loaded="mapLoaded"
      @marker-click="showGisDeviceInfo"
      @map-click="mapClick"
    />
  </div>
</template>
<script lang="ts">
import {Vue, Component, Prop} from 'vue-property-decorator';
import axios from 'axios';
import MapConfig from '@/config/config_arcgis';
@Component
export default class PluginTest3D extends Vue {
  private cg = new MapConfig();
  private mapConfig = this.cg.mapConfig;
  private async mapLoaded() {
    this.cg.mapLoaded(this.$refs.gisViewer);
  }
  private btn_test1() {
    this.cg.btn_test1(this.$refs.gisViewer);
  }
  private async btn_test2() {
    this.cg.btn_test2(this.$refs.gisViewer);
  }
  private btn_test3() {
    this.cg.btn_test3(this.$refs.gisViewer);
  }
  private showGisDeviceInfo(type: string, id: string, detail: any) {
    console.log(type, id, detail);
  }
  private mapClick(pt: object) {
    console.log(pt);
  }
}
</script>

<style scoped>
#gisDiv {
  position: absolute;
  width: 100%;
  height: 100%;
  float: right;
  margin: 0 auto;
}
#test {
  position: absolute;
  z-index: 99;
  display: block;
}
</style>
