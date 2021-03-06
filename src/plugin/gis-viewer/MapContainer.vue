<template>
  <div id="divMap">
    <map-container-arcgis-three-d
      ref="containerArcgis3D"
      v-if="this.platform === 'arcgis3d'"
      :map-config="this.mapConfig"
      @map-loaded="mapLoaded"
      @map-click="mapClick"
      @marker-click="showGisDeviceInfo"
    />
    <map-container-arcgis-two-d
      ref="containerArcgis2D"
      v-if="this.platform === 'arcgis2d'"
      :map-config="this.mapConfig"
      @map-loaded="mapLoaded"
      @map-click="mapClick"
      @marker-click="showGisDeviceInfo"
      @marker-mouse="mouseGisDeviceInfo"
      @select-route-finished="selectedRouteFinished"
      @into-signal="intoSignal"
      @outof-signal="outofSignal"
      @layer-loaded="layerLoaded"
    />
    <map-container-baidu
      ref="containerBaidu"
      v-if="this.platform === 'bd'"
      :map-config="this.mapConfig"
      @map-loaded="mapLoaded"
      @map-click="mapClick"
      @marker-click="showGisDeviceInfo"
      @draw-complete="drawCallback"
    />
    <map-container-gaode
      ref="containerGaode"
      v-if="this.platform === 'gd'"
      :map-config="this.mapConfig"
      @map-loaded="mapLoaded"
      @marker-click="showGisDeviceInfo"
      @map-click="mapClick"
      @marker-mouse="mouseGisDeviceInfo"
    />
    <map-container-p-g-i-s
      ref="containerPGIS"
      v-if="this.platform === 'pgis_ls'"
      :map-config="this.mapConfig"
      @map-loaded="mapLoaded"
      @map-click="mapClick"
    />
  </div>
</template>

<script lang="ts">
import {Vue, Component, Prop, Ref, Emit} from 'vue-property-decorator';
import MapContainerArcgisThreeD from '@/plugin/gis-viewer/MapContainerArcgis3D.vue';
import MapContainerArcgisTwoD from '@/plugin/gis-viewer/MapContainerArcgis2D.vue';
import MapContainerBaidu from '@/plugin/gis-viewer/MapContainerBaidu.vue';
import MapContainerGaode from '@/plugin/gis-viewer/MapContainerGaode.vue';
import MapContainerPGIS from "@/plugin/gis-viewer/MapContainerPGIS_LS.vue";
import {
  Platforms,
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
  IDrawOverlayParameter,
  ITrackPlaybackParameter,
  IStreetParameter,
  IElectronicFenceParameter,
  ICircleOutline,
  IMonitorAreaParameter,
  routeParameter,
  IHeatImageParameter,
  IGeometrySearchParameter,
  ICustomTip,
  ISelectRouteParam,
  ISelectRouteResult,
  IDrawOverlays,
  IEditFenceLabel,
  IDrawOverlaysDelete,
  IPolylineRangingParameter,
  IPicChangeParameter,
  IPOISearch,
  IRoutePlan,
  IGeocode,
  ISelectRouteHitTest,
  IDefinitionParameter,
  ITrackParameter,
  IPOIDelete,
  IRoadNetwork,
  IBoundary,
    IMultiBoundary
} from '@/types/map';
import bdWebAPIRequest from "@/plugin/gis-viewer/widgets/WebAPI/bd/bdWebAPIRequest";

@Component({
  components: {
    MapContainerArcgisThreeD,
    MapContainerArcgisTwoD,
    MapContainerBaidu,
    MapContainerGaode,
    MapContainerPGIS
  }
})
export default class MapContainer extends Vue implements IMapContainer {
  //平台类型 高德/百度/arcgis
  @Prop({default: Platforms.BDMap, type: String})
  readonly platform!: string;

  //地图配置
  @Prop({type: Object}) readonly mapConfig!: Object;

  @Ref() readonly containerArcgis3D!: MapContainerArcgisThreeD;
  @Ref() readonly containerArcgis2D!: MapContainerArcgisTwoD;
  @Ref() readonly containerBaidu!: MapContainerBaidu;
  @Ref() readonly containerGaode!: MapContainerGaode;
  @Ref() readonly containerPGIS!: MapContainerPGIS;

  //当前的地图容器
  get mapContainer(): IMapContainer {
    switch (this.platform) {
      case Platforms.ArcGIS2D:
        return this.containerArcgis2D;
      case Platforms.ArcGIS3D:
        return this.containerArcgis3D;
      case Platforms.BDMap:
        return this.containerBaidu;
      case Platforms.AMap:
        return this.containerGaode;
      case Platforms.PGIS_LS:
        return this.containerPGIS;
      default:
        return this.containerArcgis2D;
    }
  }
  async created() {
    //console.log(this.mapConfig);
    if (
      (this.mapConfig as any).arcgis_api &&
      (this.mapConfig as any).arcgis_api.indexOf('arcgis') > -1
    ) {
      (window as any).dojoConfig = {
        async: true,
        tlmSiblingOfDojo: false,
        baseUrl: (this.mapConfig as any).arcgis_api + '/dojo/',
        packages: [
          {
            name: 'libs',
            location: 'libs'
          }
        ],
        has: {
          'esri-promise-compatibility': 1
        }
      };
    }
  }
  @Emit('map-loaded')
  private mapLoaded() {}
  @Emit('layer-loaded')
  public layerLoaded() {}
  @Emit('map-click')
  public mapClick(point: object) {}
  @Emit('marker-click')
  private showGisDeviceInfo(type: string, id: string) {}
  @Emit('marker-mouse')
  public mouseGisDeviceInfo(
    event: any,
    type: string,
    id: string,
    detail: any
  ) {}
  @Emit('select-route-finished')
  public selectedRouteFinished(routeInfo: object) {}
  @Emit('draw-complete')
  private drawCallback(results:any) {}

  @Emit('into-signal')
  public intoSignal(signalId: string) {}

  @Emit('outof-signal')
  public outofSignal(signalId: string) {}

  public async addOverlays(params: IOverlayParameter): Promise<IResult> {
    return await this.mapContainer.addOverlays(params);
  }

  public addOverlaysCluster(params: IOverlayClusterParameter) {
    this.mapContainer.addOverlaysCluster(params);
  }
  public addHeatMap(params: IHeatParameter) {
    this.mapContainer.addHeatMap(params);
  }
  public deleteOverlays(params: IOverlayDelete) :Promise<IResult>{
    return this.mapContainer.deleteOverlays(params);
  }
  public deleteOverlaysCluster(params: IOverlayDelete) {
    this.mapContainer.deleteOverlaysCluster(params);
  }

  public deleteAllOverlays() {
    this.mapContainer.deleteAllOverlays();
  }
  public deleteAllOverlaysCluster() {
    this.mapContainer.deleteAllOverlaysCluster();
  }
  public deleteHeatMap() {
    this.mapContainer.deleteHeatMap();
  }
  public showLayer(params: ILayerConfig):Promise<IResult> {
    return this.mapContainer.showLayer(params);
  }
  public hideLayer(params: ILayerConfig):Promise<IResult> {
    return this.mapContainer.hideLayer(params);
  }
  public setMapCenter(params: IPointGeometry) {
    this.mapContainer.setMapCenter(params);
  }
  public setMapCenterAndLevel(params: ICenterLevel) {
    this.mapContainer.setMapCenterAndLevel(params);
  }
  public showJurisdiction() {
    this.mapContainer.showJurisdiction();
  }
  public hideJurisdiction() {
    this.mapContainer.hideJurisdiction();
  }
  public showDistrictMask(params: IDistrictParameter) {
    this.mapContainer.showDistrictMask(params);
  }
  public hideDistrictMask() {
    this.mapContainer.hideDistrictMask();
  }
  public async findFeature(params: IFindParameter) {
    return await this.mapContainer.findFeature(params);
  }
  public showRoad(param: {ids: string[]}) {
    this.mapContainer.showRoad(param);
  }
  public hideRoad() {
    this.mapContainer.hideRoad();
  }
  public showStreet() {
    this.mapContainer.showStreet();
  }
  public hideStreet() {
    this.mapContainer.hideStreet();
  }
  public locateStreet(param: IStreetParameter) {
    this.mapContainer.locateStreet(param);
  }
  // public async showTooltip(param: Vue.Component) :Promise<IResult>{
  //   return await this.mapContainer.showTooltip(param);
  // }
  public async closeTooltip() :Promise<IResult>{
    return await this.mapContainer.closeTooltip();
  }
  // public async startDrawOverlays(param: IDrawOverlayParameter):Promise<IResult>{
  //   return this.mapContainer.startDrawOverlays(param)
  // }
  public async startTrackPlayback(params: ITrackPlaybackParameter):Promise<IResult>{
    return await this.mapContainer.startTrackPlayback(params);
  }
  public async startRealTrackPlayback(params: ITrackPlaybackParameter):Promise<IResult>{
    return await this.mapContainer.startRealTrackPlayback(params);
  }
  public pausePlayback(){
    this.mapContainer.pausePlayback();
  }
  public goOnPlayback(){
    this.mapContainer.goOnPlayback();
  }
  public setMapStyle(param: string) {
    this.mapContainer.setMapStyle(param);
  }
  public async routeSearch(params: routeParameter): Promise<IResult> {
    return await this.mapContainer.routeSearch(params);
  }
  public clearRouteSearch() {
    this.mapContainer.clearRouteSearch();
  }
  public async showMonitorArea(params:IMonitorAreaParameter) {
    return await this.mapContainer.showMonitorArea(params);
  }
  public showRoutePoint(params: any) {
    this.mapContainer.showRoutePoint(params);
  }
  public clearRoutePoint() {
    this.mapContainer.clearRoutePoint();
  }
  public async addDrawLayer(params: any): Promise<IResult> {
    return await this.mapContainer.addDrawLayer(params);
  }
  public clearDrawLayer(params: ILayerConfig) {
    this.mapContainer.clearDrawLayer(params);
  }
  public addHeatImage2D(params: IHeatImageParameter) {
    this.mapContainer.addHeatImage2D(params);
  }
  public addHeatImage3D(params: IHeatImageParameter) {
        this.mapContainer.addHeatImage3D(params);
  }
  public deleteHeatImage() {
    this.mapContainer.deleteHeatImage();
  }
  public showMigrateChart(params: any) {
    this.mapContainer.showMigrateChart(params);
  }
  public hideMigrateChart() {
    this.mapContainer.hideMigrateChart();
  }
  public showBarChart(params: any) {
    this.mapContainer.showBarChart(params);
  }
  public hideBarChart() {
    this.mapContainer.hideBarChart();
  }
  public async showCircleOutline(param:ICircleOutline):Promise<IResult> {
    return await this.mapContainer.showCircleOutline(param);
  }
  public async createPlaceFence(param:IElectronicFenceParameter):Promise<IResult> {
    return await this.mapContainer.createPlaceFence(param);
  }
  public async createLineFence(param:IElectronicFenceParameter):Promise<IResult> {
    return await this.mapContainer.createLineFence(param);
  }
  public async createElectFenceByEndPtsConnection(param:IElectronicFenceParameter):Promise<IResult> {
    return await this.mapContainer.createElectFenceByEndPtsConnection(param);
  }
  public async showEditingLabel(param:IEditFenceLabel):Promise<IResult> {
    return await this.mapContainer.showEditingLabel(param);
  }
  public async startGeometrySearch(
    params: IGeometrySearchParameter
  ): Promise<IResult> {
    return await this.mapContainer.startGeometrySearch(params);
  }
  public clearGeometrySearch() {
    this.mapContainer.clearGeometrySearch();
  }
  public async showDgene(params: any): Promise<IResult> {
    return await this.mapContainer.showDgene(params);
  }
  public hideDgene() {
    this.mapContainer.hideDgene();
  }
  public async addDgeneFusion(params: any): Promise<IResult> {
    return await this.mapContainer.addDgeneFusion(params);
  }
  public async restoreDegeneFsion(): Promise<IResult> {
    return await this.mapContainer.restoreDegeneFsion();
  }

  public async arcgisLoadGDLayer(){
      await this.mapContainer.arcgisLoadGDLayer();
  }
  public showCustomTip(params: ICustomTip) {
    this.mapContainer.showCustomTip(params);
  }
  public showDgeneOutPoint(params: any) {
    this.mapContainer.showDgeneOutPoint(params);
  }
  public changeDgeneOut() {
    this.mapContainer.changeDgeneOut();
  }

  public async initializeRouteSelect(params: ISelectRouteParam) {
    await this.mapContainer.initializeRouteSelect(params);
  }

  public async showSelectedRoute(params: ISelectRouteResult) {
    await this.mapContainer.showSelectedRoute(params);
  }

  public async playSelectedRoute(speed: number) {
    await this.mapContainer.playSelectedRoute(speed);
  }

  public stopPlaySelectedRoute() {
    this.mapContainer.stopPlaySelectedRoute();
  }

  public async routeHitArea(params: ISelectRouteHitTest): Promise<IResult> {
    return await this.mapContainer.routeHitArea(params);
  }
  public async areaHitRoute(params: ISelectRouteHitTest): Promise<IResult> {
    return this.mapContainer.areaHitRoute(params);
  }
  public async startDrawOverlays(params: IDrawOverlays): Promise<IResult> {
    return await this.mapContainer.startDrawOverlays(params);
  }
  public async stopDrawOverlays(params:any): Promise<IResult> {
    return this.mapContainer.stopDrawOverlays(params);
  }
  public async getDrawOverlays(): Promise<IResult> {
    return await this.mapContainer.getDrawOverlays();
  }
  public async deleteDrawOverlays(params:IDrawOverlaysDelete): Promise<IResult> {
    return await this.mapContainer.deleteDrawOverlays(params);
  }
  public async hideOverlays(params:IDrawOverlaysDelete): Promise<IResult> {
    return await this.mapContainer.hideOverlays(params);
  }
  public async showOverlays(params:IDrawOverlaysDelete): Promise<IResult> {
    return await this.mapContainer.showOverlays(params);
  }
  public async findOverlays(params:IFindParameter): Promise<IResult> {
    return await this.mapContainer.findOverlays(params);
  }
  public async backgroundGeometrySearch(params:IGeometrySearchParameter): Promise<IResult> {
    return await this.mapContainer.backgroundGeometrySearch(params);
  }
  public async polylineRanging(params:IPolylineRangingParameter): Promise<IResult> {
    return await this.mapContainer.polylineRanging(params);
  }
  public async changePicById(params:IPicChangeParameter): Promise<IResult> {
    return await this.mapContainer.changePicById(params);
  }
  public async bdPOIQuery(params:IPOISearch): Promise<IResult> {
    return await bdWebAPIRequest.requestPOI(params);
  }
  public async bdRouteSearch(params:IRoutePlan): Promise<IResult> {
    return await bdWebAPIRequest.requestRoadPlan(params);
  }
  public async bdGeocode(params:IGeocode): Promise<IResult> {
    return await bdWebAPIRequest.requestGeocode(params);
  }
  public async searchPOI(params:IPOISearch): Promise<IResult> {
    return await this.mapContainer.searchPOI(params);
  }
  public async clearPOIResults(params:IPOIDelete): Promise<IResult> {
    return await this.mapContainer.clearPOIResults(params);
  }
  public async searchRoadNetwork(params:IRoadNetwork): Promise<IResult> {
    return await this.mapContainer.searchRoadNetwork(params);
  }
  public async searchBoundary(params:IBoundary): Promise<IResult> {
    return await this.mapContainer.searchBoundary(params);
  }
  public async searchMultiBoundary(params:IMultiBoundary): Promise<IResult> {
    return await this.mapContainer.searchMultiBoundary(params);
  }
  public async closeAllTooltips(): Promise<IResult> {
    return await this.mapContainer.closeAllTooltips();
  }
  // public async closeTooltips(params:IOverlayDelete): Promise<IResult> {
  //   return await this.mapContainer.closeTooltips(params);
  // }
  // public async startLayerSearch(
  //   params: IGeometrySearchParameter
  // ): Promise<IResult> {
  //   return await this.mapContainer.startLayerSearch(params);
  // }
  // public async startLayerDefinition(
  //   params: IDefinitionParameter
  // ): Promise<void> {
  //   return await this.mapContainer.startLayerDefinition(params);
  // }
  // public async startTrackPlay(params: ITrackParameter): Promise<void> {
  //   return await this.mapContainer.startTrackPlay(params);
  // }
}
</script>

<style scoped>
#divMap {
  padding: 0;
  margin: 0;
  width: 100%;
  height: 100%;
}
</style>
