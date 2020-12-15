<template>
  <div :id="mapId" class="my-map-div" />
</template>

<script lang="ts">
  import {Vue, Component, Emit, Prop} from 'vue-property-decorator';
  import MapApp from '@/plugin/gis-viewer/MapAppPGIS_LS';
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
    ITrackParameter, IPOIDelete, IMonitorAreaParameter, IBoundary
  } from '@/types/map';
  @Component({
    name: 'MapAppPGIS_LS'
  })
  export default class MapContainerPGIS_LS extends Vue implements IMapContainer{
    private mapApp!: MapApp;
    private mapId: string = 'divBMap' + (Math.random() * 10000).toFixed(0);
    @Prop({type: Object}) readonly mapConfig!: Object;
    async mounted() {
      this.mapApp = new MapApp();
      await this.mapApp.initialize(this.mapConfig, this.mapId);
    }

    addDgeneFusion(params: any): Promise<any> {
      return Promise.resolve(undefined);
    }

    addDrawLayer(params: any): Promise<any> {
      return Promise.resolve(undefined);
    }

    addHeatImage2D(params: IHeatImageParameter): void {
    }

    addHeatImage3D(params: IHeatImageParameter): void {
    }

    addHeatMap(param: IHeatParameter): void {
    }

    addOverlays(param: IOverlayParameter): Promise<any> {
      return Promise.resolve(undefined);
    }

    addOverlaysCluster(param: IOverlayClusterParameter): void {
    }

    arcgisLoadGDLayer(): void {
    }

    areaHitRoute(params: ISelectRouteHitTest): Promise<any> {
      return Promise.resolve(undefined);
    }

    backgroundGeometrySearch(params: IGeometrySearchParameter): Promise<any> {
      return Promise.resolve(undefined);
    }

    changeDgeneOut(): void {
    }

    changePicById(params: IPicChangeParameter): Promise<any> {
      return Promise.resolve(undefined);
    }

    clearDrawLayer(params: ILayerConfig): void {
    }

    clearGeometrySearch(): void {
    }

    clearPOanys(params: IPOIDelete): Promise<any> {
      return Promise.resolve(undefined);
    }

    clearRoutePoint(): void {
    }

    clearRouteSearch(): void {
    }

    closeTooltip(): Promise<any> {
      return Promise.resolve(undefined);
    }

    createElectFenceByEndPtsConnection(param: any): Promise<any> {
      return Promise.resolve(undefined);
    }

    createLineFence(param: any): Promise<any> {
      return Promise.resolve(undefined);
    }

    createPlaceFence(param: any): Promise<any> {
      return Promise.resolve(undefined);
    }

    deleteAllOverlays(): void {
    }

    deleteAllOverlaysCluster(): void {
    }

    deleteDrawOverlays(params: IDrawOverlaysDelete): Promise<any> {
      return Promise.resolve(undefined);
    }

    deleteHeatImage(): void {
    }

    deleteHeatMap(): void {
    }

    deleteOverlays(param: IOverlayDelete): Promise<any> {
      return Promise.resolve(undefined);
    }

    deleteOverlaysCluster(param: IOverlayDelete): void {
    }

    findFeature(param: IFindParameter): any {
    }

    findOverlays(param: IFindParameter): Promise<any> {
      return Promise.resolve(undefined);
    }

    getDrawOverlays(): Promise<any> {
      return Promise.resolve(undefined);
    }

    goOnPlayback(): void {
    }

    hideBarChart(): void {
    }

    hideDgene(): void {
    }

    hideDistrictMask(): void {
    }

    hideJurisdiction(): void {
    }

    hideLayer(param: ILayerConfig): Promise<any> {
      return Promise.resolve(undefined);
    }

    hideMigrateChart(): void {
    }

    hideOverlays(param: IDrawOverlaysDelete): Promise<any> {
      return Promise.resolve(undefined);
    }

    hideRoad(): void {
    }

    hideStreet(): void {
    }

    initializeRouteSelect(params: ISelectRouteParam): Promise<void> {
      return Promise.resolve(undefined);
    }

    locateStreet(param: IStreetParameter): void {
    }

    pausePlayback(): void {
    }

    playSelectedRoute(speed: number): Promise<void> {
      return Promise.resolve(undefined);
    }

    polylineRanging(params: IPolylineRangingParameter): Promise<any> {
      return Promise.resolve(undefined);
    }

    restoreDegeneFsion(): Promise<any> {
      return Promise.resolve(undefined);
    }

    routeHitArea(params: ISelectRouteHitTest): Promise<any> {
      return Promise.resolve(undefined);
    }

    routeSearch(param: any): Promise<any> {
      return Promise.resolve(undefined);
    }

    searchBoundary(params: IBoundary): Promise<any> {
      return Promise.resolve(undefined);
    }

    searchPOI(params: IPOISearch): Promise<any> {
      return Promise.resolve(undefined);
    }

    searchRoadNetwork(params: any): Promise<any> {
      return Promise.resolve(undefined);
    }

    setMapCenter(param: IPointGeometry): void {
    }

    setMapCenterAndLevel(param: ICenterLevel): void {
    }

    setMapStyle(style: string): void {
    }

    showBarChart(params: any): void {
    }

    showCircleOutline(param: any): Promise<any> {
      return Promise.resolve(undefined);
    }

    showCustomTip(params: ICustomTip): void {
    }

    showDgene(params: any): Promise<any> {
      return Promise.resolve(undefined);
    }

    showDgeneOutPoint(params: any): void {
    }

    showDistrictMask(param: IDistrictParameter): void {
    }

    showEditingLabel(param: any): Promise<any> {
      return Promise.resolve(undefined);
    }

    showJurisdiction(): void {
    }

    showLayer(param: ILayerConfig): Promise<any> {
      return Promise.resolve(undefined);
    }

    showMigrateChart(params: any): void {
    }

    showMonitorArea(param: IMonitorAreaParameter): Promise<any> {
      return Promise.resolve(undefined);
    }

    showOverlays(param: IDrawOverlaysDelete): Promise<any> {
      return Promise.resolve(undefined);
    }

    showRoad(param: { ids: string[] }): void {
    }

    showRoutePoint(params: any): void {
    }

    showSelectedRoute(params: ISelectRouteResult): Promise<void> {
      return Promise.resolve(undefined);
    }

    showStreet(): void {
    }

    startDrawOverlays(param: IDrawOverlays): Promise<any> {
      return Promise.resolve(undefined);
    }

    startGeometrySearch(params: IGeometrySearchParameter): Promise<any> {
      return Promise.resolve(undefined);
    }

    startRealTrackPlayback(param: ITrackPlaybackParameter): Promise<any> {
      return Promise.resolve(undefined);
    }

    startTrackPlayback(param: ITrackPlaybackParameter): Promise<any> {
      return Promise.resolve(undefined);
    }

    stopDrawOverlays(params: any): Promise<any> {
      return Promise.resolve(undefined);
    }

    stopPlaySelectedRoute(): void {
    }

    clearPOIResults(): any{}
    
  }
  
</script>

<style scoped>

</style>