<template>
  <div :id="mapId" class="my-map-div" />
</template>

<script lang="ts">
import {Vue, Component, Emit, Prop} from 'vue-property-decorator';
import MapApp from '@/plugin/gis-viewer/MapAppArcgis3D';
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
  IDrawOverlayParameter,
  IDrawOverlaysDelete,
  IPolylineRangingParameter,
  ISelectRouteHitTest,
  IDefinitionParameter,
  ITrackParameter, IPOISearch, IPOIDelete, IBoundary, IRoadNetwork, IMultiBoundary
} from '@/types/map';
import POISearchBD from "@/plugin/gis-viewer/widgets/POISearch/bd/POISearchBD";

@Component({
  name: 'MapContainerArcgisThreeD'
})
export default class MapContainerArcgis3D extends Vue implements IMapContainer {
  private mapApp!: MapApp;

  private mapId: string = 'divArcGISMap3D' + (Math.random() * 10000).toFixed(0);
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
  public showJurisdiction() {}
  public hideJurisdiction() {}
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
  public setMapStyle(param: string) {}
  public async routeSearch(params: routeParameter): Promise<IResult> {
    return {status: 0, message: ''};
  }
  public clearRouteSearch() {}
  public async startTrackPlayback() :Promise<any>{}
  public async startRealTrackPlayback() :Promise<any>{}
  public pausePlayback(){}
  public goOnPlayback(){}
  // public async startDrawOverlays():Promise<any>{}
  public async showTooltip():Promise<any>{}
  public closeTooltip() :Promise<IResult> {
    return this.mapApp.closeTooltip();
  }
  public showMonitorArea():any{}
  public showRoutePoint(params: any) {}
  public clearRoutePoint() {}

  public async addDrawLayer(params: any): Promise<IResult> {
    return await this.mapApp.addDrawLayer(params);
  }
  public clearDrawLayer(params: any) {
    this.mapApp.clearDrawLayer(params);
  }
  public addHeatImage2D(params: IHeatImageParameter) {
    this.mapApp.addHeatImage2D(params);
  }
  public addHeatImage3D(params: IHeatImageParameter) {
      this.mapApp.addHeatImage3D(params);
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
  public showCircleOutline(params:any):any{}
  public createPlaceFence(params:any):any{}
  public createLineFence(params:any):any{}
  public createElectFenceByEndPtsConnection(params:any):any{}
  public showEditingLabel(params:any):any{}
  public showBarChart(params: any) {
    this.mapApp.showBarChart(params);
  }
  public hideBarChart() {
    this.mapApp.hideBarChart();
  }
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
  public showCustomTip(params: ICustomTip) {
    this.mapApp.showCustomTip(params);
  }
  public showDgeneOutPoint(params: any) {}
  public changeDgeneOut() {}

  public async initializeRouteSelect(params: ISelectRouteParam) {}
  public async showSelectedRoute(params: ISelectRouteResult) {}
  public async startDrawOverlays(params: IDrawOverlays): Promise<any> {}
  public async stopDrawOverlays(): Promise<IResult> {
    return {status:0, message:''}
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

  public async startTrackPlay(params: ITrackParameter): Promise<void> {
    return await this.mapApp.startTrackPlay(params);
  }

  public async searchPOI(params:IPOISearch): Promise<any> {}
  public async searchBoundary(params:IBoundary): Promise<any> {}
  public async searchRoadNetwork(params:IRoadNetwork): Promise<any> {}
  public async clearPOIResults(params:IPOIDelete): Promise<any> {}
  public async closeAllTooltips():Promise<any> {}
  public async closeTooltips():Promise<any> {}
  public async searchMultiBoundary(params:IMultiBoundary):Promise<any> {}
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
