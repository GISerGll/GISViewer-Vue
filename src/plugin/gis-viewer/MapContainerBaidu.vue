<template>
  <div :id="mapId" class="my-map-div" />
</template>
<script lang="ts">
import {Vue, Component, Emit, Prop} from 'vue-property-decorator';
import MapApp from '@/plugin/gis-viewer/MapAppBaidu';
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
  ITrackPlaybackParameter,
  ITrackPlaybackBDParameter,
  IPicChangeParameter,
  IPOISearch,
  ISelectRouteHitTest,
  IDefinitionParameter,
  ITrackParameter, IPOIDelete, IMonitorAreaParameter, IBoundary, IMultiBoundary
} from '@/types/map';
@Component({
  name: 'MapAppBaidu'
})
export default class MapContainerBaidu extends Vue implements IMapContainer {
  private mapApp!: MapApp;

  private mapId: string = 'divBMap' + (Math.random() * 10000).toFixed(0);
  //地图配置
  @Prop({type: Object}) readonly mapConfig!: Object;

  @Emit('map-loaded')
  async mounted() {
    this.mapApp = new MapApp();
    await this.mapApp.initialize(this.mapConfig, this.mapId);
    this.mapApp.showGisDeviceInfo = this.showGisDeviceInfo;
    this.mapApp.mapClick = this.mapClick;
  }
  @Emit('layer-loaded')
  public layerLoaded() {}
  @Emit('map-click')
  public mapClick(point: object) {}
  @Emit('marker-click')
  public showGisDeviceInfo(results:any) {}
  @Emit('marker-mouse')
  public mouseGisDeviceInfo(
    event: any,
    type: string,
    id: string,
    detail: any
  ) {}
  @Emit('draw-complete')
  public drawCallback(result:any) {}

  public async addOverlays(params: IOverlayParameter): Promise<IResult> {
    return await this.mapApp.addOverlays(params);
  }
  public addOverlaysCluster(params: IOverlayClusterParameter) {
    this.mapApp.addOverlaysCluster(params);
  }
  public addHeatMap(params: IHeatParameter) {
    this.mapApp.addHeatMap(params);
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
  public async showLayer(params: ILayerConfig) :Promise<any>{
    await this.mapApp.showLayer(params);
  }
  public async hideLayer(params: ILayerConfig) :Promise<any>{
    await this.mapApp.hideLayer(params);
  }
  public setMapCenter(params: IPointGeometry) {
    this.mapApp.setMapCenter(params);
  }
  public setMapCenterAndLevel(params: ICenterLevel) {
    this.mapApp.setMapCenterAndLevel(params);
  }
  public showJurisdiction() {
    this.mapApp.showJurisdiction();
  }
  public hideJurisdiction() {
    this.mapApp.hideJurisdiction();
  }
  public showDistrictMask(param: IDistrictParameter) {}
  public hideDistrictMask() {}
  public findFeature(params: IFindParameter) {
    this.mapApp.findFeature(params);
  }
  public showRoad() {}
  public hideRoad() {}
  public showStreet() {}
  public hideStreet() {}
  public locateStreet(param: IStreetParameter) {}
  public setMapStyle(param: string) {
    this.mapApp.setMapStyle(param);
  }
  public async routeSearch(params: routeParameter): Promise<IResult> {
    return {status: 0, message: ''};
  }
  public clearRouteSearch() {}
  public async startTrackPlayback(params:ITrackPlaybackParameter) :Promise<any>{
    return await this.mapApp.startTrackPlayback(params);
  }
  public async startRealTrackPlayback() :Promise<any>{}
  public pausePlayback(){}
  public goOnPlayback(){}

  public async showTooltip(param:Vue.Component):Promise<any>{
    return this.mapApp.showTooltip(param);
  }
  public closeTooltip() :Promise<IResult> {
    return this.mapApp.closeTooltip();
  }
  public async findLayerFeature():Promise<any>{}
  public async showMonitorArea(params:IMonitorAreaParameter):Promise<IResult>{
    return await this.mapApp.showMonitorArea(params);
  }
  public showRoutePoint(params: any) {}
  public clearRoutePoint() {}
  public async addDrawLayer(params: any): Promise<IResult> {
    return {status: 0, message: ''};
  }
  public clearDrawLayer(params: ILayerConfig) {}
  public addHeatImage2D(params: IHeatImageParameter) {}
    public addHeatImage3D(params: IHeatImageParameter) {}
  public deleteHeatImage() {}
  public showMigrateChart(params: any) {}
  public hideMigrateChart() {}
  public showBarChart(params: any) {}
  public hideBarChart() {}
  public showCircleOutline(params:any):any{}
  public createPlaceFence(params:any):any{}
  public createLineFence(params:any):any{}
  public createElectFenceByEndPtsConnection(params:any):any{}
  public showEditingLabel(params:any):any{}
  public async startGeometrySearch(
    params: IGeometrySearchParameter
  ): Promise<IResult> {
    return this.mapApp.startGeometrySearch(params);
  }
  public clearGeometrySearch() {}
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
    public async arcgisLoadGDLayer(){}

  public async initializeRouteSelect(params: ISelectRouteParam) {}
  public async showSelectedRoute(params: ISelectRouteResult) {}
  public async startDrawOverlays(params: IDrawOverlays): Promise<IResult> {
    this.mapApp.drawCallback = this.drawCallback;
    return this.mapApp.startDrawOverlays(params);
  }
  public async stopDrawOverlays(params:any): Promise<IResult> {
    return await this.mapApp.stopDrawOverlays(params);
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
    return await this.mapApp.getDrawOverlays();
  }
  public async deleteDrawOverlays(params:IDrawOverlaysDelete): Promise<IResult> {
    return this.mapApp.deleteDrawOverlays(params)
  }
  public async hideOverlays(params:IDrawOverlaysDelete): Promise<IResult> {
    return this.mapApp.hideOverlays(params)
  }
  public async showOverlays(params:IDrawOverlaysDelete): Promise<IResult> {
    return this.mapApp.showOverlays(params)
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
  public async findOverlays(params:IDrawOverlaysDelete): Promise<IResult> {
    return this.mapApp.findOverlays(params)
  }
  public async backgroundGeometrySearch(params:IGeometrySearchParameter): Promise<IResult> {
    return await this.mapApp.backgroundGeometrySearch(params);
  }
  public async polylineRanging(params:IPolylineRangingParameter): Promise<IResult> {
    return await this.mapApp.polylineRanging(params);
  }
  public async changePicById(params:IPicChangeParameter): Promise<IResult> {
    return await this.mapApp.changePicById(params);
  }
  public async searchPOI(params: IPOISearch): Promise<IResult> {
    return await this.mapApp.searchPOI(params);
  }
  public async clearPOIResults(params: IPOIDelete): Promise<IResult> {
    return await this.mapApp.clearPOIResults(params);
  }
  public async searchBoundary(params: IBoundary): Promise<IResult> {
    return await this.mapApp.searchBoundary(params);
  }
  public async searchRoadNetwork(params: IBoundary): Promise<IResult> {
    return await this.mapApp.searchRoadNetwork(params);
  }
  public async closeAllTooltips():Promise<any> {}
  public async closeTooltips():Promise<any> {}
  public async searchMultiBoundary(params:IMultiBoundary):Promise<any> {
    return await this.mapApp.searchMultiBoundary(params);
  }
}
</script>

<style scoped>
.my-map-div {
  padding: 0;
  margin: 0;
  width: 100%;
  height: 100%;
}
</style>
