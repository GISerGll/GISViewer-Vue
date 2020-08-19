<template>
  <div id="divArcGISMap2D" />
</template>

<script lang="ts">
import {Vue, Component, Emit, Prop} from 'vue-property-decorator';
import MapApp from '@/plugin/gis-viewer/MapAppArcgis2D';
import {
  IMapContainer,
  IOverlayParameter,
  IHeatParameter,
  IOverlayClusterParameter,
  IOverlayDelete,
  ILayerConfig,
  IPointGeometry,
  ICenterLevel,
  IFindParameter,
  IResult,
  IDistrictParameter,
  IStreetParameter,
  IHeatImageParameter,
  IDrawOverlayParameter,
  ITrackPlaybackParameter,
  routeParameter,
  IElectronicFenceParameter,
  ICircleOutline,
  IMonitorAreaParameter
} from '@/types/map';
import TrackPlayback from "@/project/WuLuMuQi/TrackPlayback";

@Component({
  name: 'MapContainerArcgisTwoD'
})
export default class MapContainerArcgis extends Vue implements IMapContainer {
  private mapApp!: MapApp;

  //地图配置
  @Prop({type: Object}) readonly mapConfig!: Object;

  @Emit('map-loaded')
  async mounted() {
    this.mapApp = new MapApp();
    await this.mapApp.initialize(this.mapConfig, 'divArcGISMap2D');
    this.mapApp.showGisDeviceInfo = this.showGisDeviceInfo;
    this.mapApp.mapClick = this.mapClick;
  }
  @Emit('map-click')
  public mapClick(point: object) {}
  @Emit('marker-click')
  public showGisDeviceInfo(type: string, id: string, detail: any) {}
  @Emit('marker-mouse')
  public mouseGisDeviceInfo(
    event: any,
    type: string,
    id: string,
    detail: any
  ) {}

  public async addOverlays(params: IOverlayParameter): Promise<IResult> {
    return await this.mapApp.addOverlays(params);
  }
  public addHeatMap(params: IHeatParameter) {
    this.mapApp.addHeatMap(params);
  }
  public addOverlaysCluster(params: IOverlayClusterParameter) {
    this.mapApp.addOverlaysCluster(params);
  }
  public deleteOverlays(params: IOverlayDelete) {
    this.mapApp.deleteOverlays(params);
  }
  public deleteOverlaysCluster(params: IOverlayDelete) {
    this.mapApp.deleteOverlaysCluster(params);
  }
  public deleteAllOverlays() {
    this.mapApp.deleteAllOverlays();
  }
  public deleteAllOverlaysCluster() {
    this.mapApp.deleteAllOverlaysCluster();
  }
  public deleteHeatMap() {
    this.mapApp.deleteHeatMap();
  }
  public showLayer(params: ILayerConfig) {
    this.mapApp.showLayer(params);
  }
  public hideLayer(params: ILayerConfig) {
    this.mapApp.hideLayer(params);
  }
  public setMapCenter(params: IPointGeometry) {
    this.mapApp.setMapCenter(params);
  }
  public setMapCenterAndLevel(params: ICenterLevel) {
    this.mapApp.setMapCenterAndLevel(params);
  }
  public showJurisdiction() {}
  public hideJurisdiction() {}
  public showDistrictMask(param: IDistrictParameter) {}
  public hideDistrictMask() {}
  public async findFeature(params: IFindParameter) {
    return await this.mapApp.findFeature(params);
  }
  public showToolTip(){
    this.mapApp.showToolTip();
  }
  public showRoad() {}
  public hideRoad() {}
  public showStreet() {}
  public hideStreet() {}
  public locateStreet(param: IStreetParameter) {}
  public setMapStyle(param: string) {}
  public async routeSearch(params: routeParameter): Promise<IResult> {
    return {status: 0, message: ''};
  }
  public clearRouteSearch() {}
  public showRoutePoint(params: any) {}
  public clearRoutePoint() {}
  public async addDrawLayer(params: any): Promise<IResult> {
    return await this.mapApp.addDrawLayer(params);
  }
  public clearDrawLayer(params: any) {
    this.mapApp.clearDrawLayer(params);
  }
  public addHeatImage(params: IHeatImageParameter) {
    this.mapApp.addHeatImage(params);
  }
  public deleteHeatImage() {
    this.mapApp.deleteHeatImage();
  }
  public showMigrateChart(params: any) {
    this.mapApp.showMigrateChart(params);
  }
  public hideMigrateChart() {
    this.mapApp.hideMigrateChart();
  }
  public async startDrawOverlays(params:IDrawOverlayParameter):Promise<IResult> {
    return await this.mapApp.startDrawOverlays(params);
  }
  public async startTrackPlayback(params: ITrackPlaybackParameter):Promise<IResult>{
        return await this.mapApp.startTrackPlayback(params);
  }
  public async startRealTrackPlayback(params: ITrackPlaybackParameter):Promise<IResult>{
    return await this.mapApp.startRealTrackPlayback(params);
  }
  public pausePlayback(){
    this.mapApp.pausePlayback();
  }
  public goOnPlayback(){
    this.mapApp.goOnPlayback();
  }

  public async showMonitorArea(params:IMonitorAreaParameter){
    return await this.mapApp.showMonitorArea(params);
  }
  public async showCircleOutline(param:ICircleOutline):Promise<IResult> {
    return await this.mapApp.showCircleOutline(param);
  }
  public async createPlaceFence(param:IElectronicFenceParameter):Promise<IResult> {
    return await this.mapApp.createPlaceFence(param);
  }
}
</script>

<style scoped>
/* @import './styles/map.css'; */
@import './styles/cluter.css';
#divArcGISMap2D {
  padding: 0;
  margin: 0;
  width: 100%;
  height: 100%;
}

.esri-view .esri-view-surface--inset-outline:focus::after {
  content: '';
  box-sizing: border-box;
  position: absolute;
  z-index: 999;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  outline: auto 2px Highlight;
  outline: auto 5px -webkit-focus-ring-color;
  outline-offset: -9px;
  pointer-events: none;
  overflow: hidden;
}
</style>
