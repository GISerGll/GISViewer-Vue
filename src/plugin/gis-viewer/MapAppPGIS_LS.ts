import {Vue} from "vue-property-decorator";
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
  ISelectRouteHitTest,
  IDefinitionParameter,
  ITrackParameter,
  IDrawOverlaysDelete,
  IPolylineRangingParameter,
  ITrackPlaybackParameter,
  IPicChangeParameter,
  IPOISearch,
  IPOIDelete,
  IMonitorAreaParameter,
  IBoundary,
  IRoadNetwork, IMultiBoundary,
} from '@/types/map';
import {Utils} from '@/plugin/gis-viewer/Utils';
import OverlayPGIS from "@/plugin/gis-viewer/widgets/Overlays/pgis-ls/OverlayPGIS";

declare let FMap: any;
declare let ol: any;
declare let FDataService: any;
export default class MapAppPGIS_LS implements IMapContainer{
  public fmap!: any;   //pgis基于ol的封装
  public view!: any;
  public baseLayers: Array<any> = [];
  public layerLoaded: any;
  public showGisDeviceInfo: any;
  public mapClick: any;
  public drawCallback: any;

  private hlLayer: any;

  public async initialize(mapConfig: any,mapContainer:string): Promise<any>{
    const apiUrl = mapConfig.pgis_api || mapConfig.api_url;
    const olConfig = apiUrl + '/olConfig.js';
    const olUrl = apiUrl + '/ol.js';
    const fMap_ol = apiUrl + '/FMap-OpenLayers.js';
    const olCss = apiUrl + '/ol.css';

    await Utils.loadScripts([
      olConfig,
      olUrl,
    ]).then(async ()=>{
      await Utils.loadScripts([fMap_ol]);
      await Utils.loadCss([olCss]);
      console.log('css and scripts loaded!')

    });

    const options = mapConfig.options;
    const fmap = new FMap();
    this.fmap = fmap;
    //此view在二维模式下指openlayers实例的map对象
    const view = fmap.initMap(mapContainer, options);
    this.view = view;
    //处理baseLayers
    if(mapConfig.baseLayers && mapConfig.baseLayers.length){
      const baseLayers = mapConfig.baseLayers;
      await this.processBaseLayers(baseLayers);
    }
    //处理optionalLayers
    if(mapConfig.optionalLayers && mapConfig.optionalLayers.length){

    }
    //处理图标选中事件
    if(mapConfig.highlightClick){
      OverlayPGIS.hlFeatures = true;
    }
    //地图图层加载
    let mapLoadPromise = new Promise(resolve => {
      view.once('postrender',(results:any)=>{
        resolve(results);
      });
    })
    //加载完成
    await mapLoadPromise.then(async ()=>{
      console.log('map Loaded!');
      view.on('singleclick',(results:any)=>{
        this.mapClick(JSON.parse(JSON.stringify(results.coordinate)));
      });
    })
  }

  private async processBaseLayers(params:any[]): Promise<any>{
    params.forEach((baseLayer:any)=> {
      if(baseLayer.type === "tiled"){
        const url = baseLayer.url;
        const platform = baseLayer.platform;
        if(platform === "arcgis"){
          const tileLayer =  new ol.layer.Tile({
            source:new ol.source.TileArcGISRest({
              projection:'EPSG:4326',
              url:url
            })
          })

          const baseLayers = this.fmap.basisMapService.basemaplayers;   //现有底图数组
          baseLayers.push(tileLayer);
          this.view.addLayer(tileLayer);
        }
      }
    })
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

  public async addOverlays(param: IOverlayParameter): Promise<any> {
    const overlay = OverlayPGIS.getInstance(this.view,this.fmap);
    return await overlay.addOverlays(param);
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

  public async hideOverlays(param: IOverlayDelete): Promise<any> {
    const overlays = OverlayPGIS.getInstance(this.view,this.fmap)
    return await overlays.hideOverlays(param);
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

  searchRoadNetwork(params: IRoadNetwork): Promise<any> {
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

  public async showOverlays(param: IOverlayDelete): Promise<any> {
    const overlays = OverlayPGIS.getInstance(this.view,this.fmap)
    return await overlays.showOverlays(param);
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

  clearPOIResults(): Promise<any>{
    return Promise.resolve(undefined);
  }

  public async closeAllTooltips():Promise<IResult> {
    const tooltips = OverlayPGIS.getInstance(this.view,this.fmap);
    return await tooltips.closeAllTooltips();
  }

  public async closeTooltips():Promise<IResult> {
    const tooltips = OverlayPGIS.getInstance(this.view,this.fmap);
    return await tooltips.closeTooltips();
  }

  public async searchMultiBoundary(params:IMultiBoundary):Promise<any> {}
}