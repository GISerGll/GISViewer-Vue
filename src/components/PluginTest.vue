<template>
  <div id="gisDiv">
    <div id="test" style="display:block">
      <button @click="btn_test1">test1</button>
      <button @click="btn_test2">test2</button>
      <button @click="btn_test3">test3</button>
    </div>
    <gis-viewer
      ref="gisViewer"
      platform="arcgis2d"
      :map-config="mapConfig"
      @map-loaded="mapLoaded"
      @marker-click="showGisDeviceInfo"
      @map-click="mapClick"
      @select-route-finished="selectRouteFinished"
      @into-signal="intoSignal"
      @outof-signal="outofSignal"
      @layer-loaded="layerLoaded"
    />
  </div>
</template>
<script lang="ts">
import {Vue, Component, Prop} from 'vue-property-decorator';
import axios from 'axios';
import MapConfig from './MapConfig';
import PluginGd from './PluginGD.vue';
import PluginTest3d from './PluginTest3D.vue';
import Test from './Test.vue';
@Component
export default class PluginTest extends Vue {
  private cg = new MapConfig();
  private mapConfig = this.cg.mapConfig;
  private mapConfig2 = this.cg.mapConfig;
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
  private layerLoaded() {
    console.log('layer loaded');
  }
  private showGisDeviceInfo(type: string, id: string, detail: any) {
    console.log(type, id, detail);
    if (type == 'model3d') {
      (this.$refs.gisViewer as any).showDgene({
        duration: 0,
        callback: (e: any) => {
          //console.log(e);
        }
      });
    }
    // (this.$refs.gisViewer as any).showCustomTip({
    //   prop: {vue: PluginTest3d},
    //   geometry: detail.geometry
    // });
  }
  private mapClick(pt: any) {
    console.log(pt);
  }

  private selectRouteFinished(routeInfo: any) {
    console.log(routeInfo);
  }

  private intoSignal(id: string) {
    console.log('Into: ' + id);
  }

  private outofSignal(id: string) {
    console.log('Outof: ' + id);
  }
}
</script>

<style scoped>
#gisDiv {
  position: relative;
  width: 100%;
  height: 100%;
  margin: 0 auto;
  background: rgb(2, 24, 25);
}
#test {
  position: absolute;
  z-index: 999999;
  display: block;
}
</style>
