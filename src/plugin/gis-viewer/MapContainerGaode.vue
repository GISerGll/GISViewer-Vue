<template>
  <div :id="mapId" class="my-map-div" />
</template>

<script lang="ts">
import {Vue, Component, Emit, Prop} from 'vue-property-decorator';
import MapApp from '@/plugin/gis-viewer/MapAppGaode';
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
  routeParameter,
  IHeatImageParameter,
  IGeometrySearchParameter,
  ICustomTip,
  ISelectRouteParam,
  ISelectRouteResult,
  IDrawOverlays,
  IDrawOverlaysDelete,
  IPolylineRangingParameter,
  ISelectRouteHitTest,
  IDefinitionParameter,
  ITrackParameter, IPOISearch, IPOIDelete, IBoundary, IRoadNetwork, IMultiBoundary
} from '@/types/map';
import OverlayPGIS from "@/plugin/gis-viewer/widgets/Overlays/pgis-ls/OverlayPGIS";

@Component({
  name: 'MapContainerGaode'
})
export default class MapContainerGd extends Vue implements IMapContainer {
  private mapApp!: MapApp;

  private mapId: string = 'divAMap' + (Math.random() * 10000).toFixed(0);
  //地图配置
  @Prop({type: Object}) readonly mapConfig!: Object;

  @Emit('map-loaded')
  async mounted() {
    this.mapApp = new MapApp();
    await this.mapApp.initialize(this.mapConfig, this.mapId);

    this.mapApp.showGisDeviceInfo = this.showGisDeviceInfo;
    this.mapApp.mouseGisDeviceInfo = this.mouseGisDeviceInfo;
    this.mapApp.mapClick = this.mapClick;
  }
  @Emit('layer-loaded')
  public layerLoaded() {}
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

  public deleteOverlays(params: IOverlayDelete) :Promise<IResult>{
    return this.mapApp.deleteOverlays(params);
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
  public async showLayer(params: ILayerConfig) :Promise<IResult>{
    return await this.mapApp.showLayer(params);
  }
  public async hideLayer(params: ILayerConfig) :Promise<IResult>{
    return await this.mapApp.hideLayer(params);
  }

  public setMapCenter(params: IPointGeometry) {
    this.mapApp.setMapCenter(params);
  }

  public setMapCenterAndLevel(params: ICenterLevel) {
    this.mapApp.setMapCenterAndLevel(params);
  }

  public showJurisdiction() {}

  public hideJurisdiction() {}
  public showDistrictMask(param: IDistrictParameter) {
    this.mapApp.showDistrictMask(param);
  }
  public hideDistrictMask() {
    this.mapApp.hideDistrictMask();
  }
  public findFeature(params: IFindParameter) {
    this.mapApp.findFeature(params);
  }
  public showRoad(params: {ids: string[]}) {
    this.mapApp.showRoad(params);
  }
  public hideRoad() {
    this.mapApp.hideRoad();
  }
  public showStreet() {
    this.mapApp.showStreet();
  }
  public hideStreet() {
    this.mapApp.hideStreet();
  }
  public locateStreet(param: IStreetParameter) {
    this.mapApp.locateStreet(param);
  }
  public setMapStyle(param: string) {
    this.mapApp.setMapStyle(param);
  }
  public async routeSearch(params: routeParameter): Promise<IResult> {
    return await this.mapApp.routeSearch(params);
  }
  public clearRouteSearch() {
    this.mapApp.clearRouteSearch();
  }
  public showRoutePoint(params: any) {
    this.mapApp.showRoutePoint(params);
  }
  public clearRoutePoint() {
    this.mapApp.clearRoutePoint();
  }
  public async addDrawLayer(params: any): Promise<IResult> {
    return {status: 0, message: ''};
  }
  public clearDrawLayer(params: ILayerConfig) {}
  public addHeatImage2D(params: IHeatImageParameter) {}
    public addHeatImage3D(params: IHeatImageParameter) {}
  public deleteHeatImage() {}
  public showMigrateChart(params: any) {}
  public hideMigrateChart() {}
  public async startTrackPlayback() :Promise<any>{}
  public async startRealTrackPlayback() :Promise<any>{}
  public pausePlayback(){}
  public goOnPlayback(){}
  // public async startDrawOverlays():Promise<any>{}
  public showTooltip(param:Vue.Component):Promise<IResult>{
      return this.mapApp.showTooltip(param);
  }
  public closeTooltip() :Promise<IResult> {
    return this.mapApp.closeTooltip();
  }
  public async findLayerFeature():Promise<any>{}
  public showMonitorArea():any{}
  public showCircleOutline(params:any):any{}
  public createPlaceFence(params:any):any{}
  public createLineFence(params:any):any{}
  public createElectFenceByEndPtsConnection(params:any):any{}
  public showEditingLabel(params:any):any{}
  public showBarChart(params: any) {}
  public hideBarChart() {}

  public async startGeometrySearch(
    params: IGeometrySearchParameter
  ): Promise<IResult> {
    return await this.mapApp.startGeometrySearch(params);
  }
  public clearGeometrySearch() {
    this.mapApp.clearGeometrySearch();
  }
  public async showDgene(params: any): Promise<IResult> {
    return {status: 0, message: ''};
  }
  public hideDgene() {}

  public async addDgeneFusion(params: any): Promise<IResult> {
    return {status: 0, message: ''};
  }
  public async restoreDegeneFsion(): Promise<IResult> {
    return {status: 0, message: ''};
  }
  public showCustomTip(params: ICustomTip) {}
  public showDgeneOutPoint(params: any) {}
  public changeDgeneOut() {}

  public async initializeRouteSelect(params: ISelectRouteParam) {}
  public async showSelectedRoute(params: ISelectRouteResult) {}
  public async startDrawOverlays(params: IDrawOverlays): Promise<any> {}
  public async stopDrawOverlays(): Promise<IResult> {
    return {status: 0, message: ''};
  }
  public async playSelectedRoute(speed: number) {}
  public stopPlaySelectedRoute() {}
  public async routeHitArea(params: ISelectRouteHitTest): Promise<IResult> {
    return {status: -1, message: ''};
  }
  public async areaHitRoute(params: ISelectRouteHitTest): Promise<IResult> {
    return {status: -1, message: ''};
  }
  public async getDrawOverlays(): Promise<IResult> {
    return {status: 0, message: ''};
  }
  public async arcgisLoadGDLayer(){}
  public async hideOverlays(params:IDrawOverlaysDelete):Promise<IResult> {
    return {status:0, message:''}
  }
  public async showOverlays(params:IDrawOverlaysDelete):Promise<IResult> {
    return {status:0, message:''}
  }
  public async deleteDrawOverlays(params:IDrawOverlaysDelete):Promise<IResult> {
    return this.mapApp.deleteOverlays(params)
  }
  public async findOverlays(params:IFindParameter): Promise<IResult> {
    return this.mapApp.findOverlays(params)
  }
  public async backgroundGeometrySearch(params:IGeometrySearchParameter): Promise<IResult> {
    return await this.mapApp.backgroundGeometrySearch(params);
  }
  public async polylineRanging(params:IPolylineRangingParameter): Promise<IResult>{
    return await this.mapApp.polylineRanging(params);
  }
  public async changePicById(params:any): Promise<IResult> {
    return await this.mapApp.changePicById(params);
  }
  public async startLayerSearch(
    params: IGeometrySearchParameter
  ): Promise<IResult> {
    return {status: 0, message: ''};
  }
  public async startLayerDefinition(
    params: IDefinitionParameter
  ): Promise<void> {}
  public async startTrackPlay(params: ITrackParameter): Promise<void> {}
  public async searchPOI(params: IPOISearch): Promise<any> {}
  public async clearPOIResults(params: IPOIDelete): Promise<any> {}
  public async searchBoundary(params:IBoundary): Promise<any> {}
  public async searchRoadNetwork(params:IRoadNetwork): Promise<any> {}
  public async closeAllTooltips():Promise<any> {}
  public async closeTooltips():Promise<any> {}
  public async searchMultiBoundary(params:IMultiBoundary):Promise<any> {}
}
</script>

<style scoped>
@import 'styles/main.css';
.my-map-div {
  padding: 0;
  margin: 0;
  width: 100%;
  height: 100%;
}
</style>
