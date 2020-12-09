import {loadScript, ILoadScriptOptions} from 'esri-loader';
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
  ITrackPlaybackParameter, IPicChangeParameter, IPOISearch, IPOIDelete, IMonitorAreaParameter,
} from '@/types/map';
import {OverlayBaidu} from '@/plugin/gis-viewer/widgets/Overlays/bd/OverlayBaidu';
import {HeatMapBD} from './widgets/HeatMap/bd/HeatMapBD';
import {JurisdictionPolice} from './widgets/JurisdictionPolice/bd/JurisdictionPolice';
import {Utils} from '@/plugin/gis-viewer/Utils';
import DrawOverlaysBD from "@/plugin/gis-viewer/widgets/DrawOverlays/bd/DrawOverlaysBD";
import GeometrySearchBD from "@/plugin/gis-viewer/widgets/GeometrySearch/bd/GeometrySearchBD";
import TrackPlaybackBD from "@/plugin/gis-viewer/widgets/TrackPlayback/bd/TrackPlaybackBD";
import POISearchBD from "@/plugin/gis-viewer/widgets/POISearch/bd/POISearchBD";
import ElectronicFence from "@/plugin/gis-viewer/widgets/ElectronicFence/bd/ElectronicFence";


declare let BMap: any;

export default class MapAppBaidu implements IMapContainer {
  public view!: any;
  public baseLayers: Array<any> = [];
  public layerLoaded: any;
  public showGisDeviceInfo: any;
  public mapClick: any;
  public drawCallback: any;

  public async initialize(mapConfig: any, mapContainer: string): Promise<any> {
    const apiUrl = mapConfig.baidu_api; //"http://localhost:8090/baidu/BDAPI.js";
    let view: any;
    // const apiRoot = mapConfig.baidu_api.substring(0, apiUrl.lastIndexOf('/'));
    const mapV = apiUrl.substring(0, apiUrl.lastIndexOf('/')) + '/mapv.js';
    const heatMap = apiUrl.substring(0, apiUrl.lastIndexOf('/')) + '/Heatmap_min.js';
    const drawManager = apiUrl.substring(0, apiUrl.lastIndexOf('/')) + '/DrawingManager_min.js';
    const cluster1 = apiUrl.substring(0, apiUrl.lastIndexOf('/')) + '/TextIconOverlay.js'
    const cluster2 = apiUrl.substring(0, apiUrl.lastIndexOf('/')) + '/MarkerClusterer.js';
    const geometryUtil = apiUrl.substring(0, apiUrl.lastIndexOf('/')) + '/GeoUtils.js';
    const rangingUtil = apiUrl.substring(0, apiUrl.lastIndexOf('/')) + '/DistanceTool.js';
    const lushu = apiUrl.substring(0, apiUrl.lastIndexOf('/')) + '/LuShu.js'

    await Utils.loadScripts([
      apiUrl,
      mapV,
    ]).then(()=>{               //heatMap需要BMap
      Utils.loadScripts([
        heatMap,
        cluster1,
        cluster2,
        drawManager,
        geometryUtil,
        rangingUtil,
          lushu
      ]).then(()=>{
        console.log('scripts Loaded!');
      });
    })

    view = new BMap.Map(mapContainer);

    let mapLoadPromise = new Promise(resolve => {
      view.addEventListener("tilesloaded",(results:any)=>{
        resolve(results);
      });
    })

    let gisUrl = mapConfig.gisServer
        ? mapConfig.gisServer
        : this.getIpPort(apiUrl);
    if (mapConfig.theme === 'dark') {
      view.setMapStyle({style: 'midnight'});
    }

    if (mapConfig.baseLayers) {
      mapConfig.baseLayers.forEach((element: any) => {
        this.createLayer(view, element);
      });
    }
    let zoom = 12;
    let center = new BMap.Point(102.267713, 27.881396);
    if (mapConfig.options.zoom) {
      zoom = mapConfig.options.zoom;
    }
    if (mapConfig.options.center) {
      center = new BMap.Point(
          mapConfig.options.center[0],
          mapConfig.options.center[1]
      );
    }

    console.log(`center:(${center.lng},${center.lat}),zoom:${zoom}`);
    view.centerAndZoom(center, zoom);
    view.enableScrollWheelZoom();

    await mapLoadPromise.then(async ()=>{
      console.log('map Loaded!');
      await view.removeEventListener("tilesLoaded");
      await view.addEventListener('click',(e:any)=>{
        if(e.overlay){
          //e.overlay.id,e.overlay.type,JSON.stringify(e.overlay.type)
          const geometry = JSON.parse(JSON.stringify(e.overlay.points || e.overlay.point))
          this.showGisDeviceInfo(e.overlay.id,e.overlay.type,e.overlay.attributes,geometry);
        }
        this.mapClick(JSON.parse(JSON.stringify(e.point)));
      });
    })

    this.view = view;
    this.view.gisServer = gisUrl;
  }
  //得到url中的ip和port
  private getIpPort(url: string): string {
    let urls = url.split('/');
    let ip: string = '';
    for (let el in urls) {
      if (el.indexOf(':') > 0 || el.indexOf('.') > 0) {
        ip = el;
        break;
      }
    }
    if (ip === '') {
      ip = urls[2];
    }
    return ip;
  }
  public createLayer(view: any, layer: any) {
    switch (layer.type) {
      case 'traffic':
        let trafficlayer = new BMap.TrafficLayer();
        if (layer.visible !== false) {
          view.addTileLayer(trafficlayer);
        }
        this.baseLayers.push({
          label: layer.label || '',
          type: layer.type || '',
          layer: trafficlayer,
          visible: layer.visible !== false
        });
        break;
      case '百度标准地图':
        var tilelayer = new BMap.TileLayer();         // 创建地图层实例
        tilelayer.getTilesUrl=function (point:any, level:any) {
          if (!point || level < 0) {
            return null;
          }
          var row = point.x;
          var col = point.y;
          // var url = '//mapsv0.bdimg.com/tile/?udt=' + '20190102'
          //     + '&qt=tile&styles=' + 'pl' + '&x=' + row + '&y=' + col + '&z=' + level;
          var url = '//maponline0.bdimg.com/tile/?udt=' + '20190102'
              + '&qt=tile&styles=' + 'pl' + '&x=' + row + '&y=' + col + '&z=' + level;
          // var url_ = 'http://maponline0.bdimg.com/tile/?qt=vtile&x=394&y=146&z=11&styles=pl&scaler=2&udt=20201022&from=jsapi2_0'
          return url;
        };
        view.addTileLayer(tilelayer);
        break;
      case 'styleJson':
        debugger;
        const jsonStyle = layer.url
        view.setMapStyle({
          styleJson:jsonStyle
        });
        break;
        default:
          break;
    }
  }
  public setMapStyle(param: string) {
    //this.view.setMapStyle(param);
  }
  public async addOverlays(params: IOverlayParameter): Promise<IResult> {
    const overlay = OverlayBaidu.getInstance(this.view);
    // overlay.showGisDeviceInfo = this.showGisDeviceInfo;
    return await overlay.addOverlays(params);
  }
  public async findFeature(params: IFindParameter):Promise<any> {
    const overlay = OverlayBaidu.getInstance(this.view);
    await overlay.findFeature(params);
  }
  public async findLayerFeature(params: IFindParameter) {}
  public async addOverlaysCluster(params: IOverlayClusterParameter) {
    const overlay = OverlayBaidu.getInstance(this.view);
    // overlay.showGisDeviceInfo = this.showGisDeviceInfo;
    await overlay.addOverlaysCluster(params);
  }

  public async addHeatMap(params: IHeatParameter) {
    const heatmap = HeatMapBD.getInstance(this.view);
    await heatmap.addHeatMap(params);
  }

  public async deleteOverlays(params: IOverlayDelete) {
    const overlay = OverlayBaidu.getInstance(this.view);
    return await overlay.deleteOverlays(params);
  }
  public async deleteOverlaysCluster(params: IOverlayDelete) {
    const overlay = OverlayBaidu.getInstance(this.view);
    await overlay.deleteOverlaysCluster(params);
  }
  public async deleteAllOverlays() {
    const overlay = OverlayBaidu.getInstance(this.view);
    overlay.showGisDeviceInfo = this.showGisDeviceInfo;
    await overlay.deleteAllOverlays();
  }
  public async deleteAllOverlaysCluster() {
    const overlay = OverlayBaidu.getInstance(this.view);
    overlay.showGisDeviceInfo = this.showGisDeviceInfo;
    await overlay.deleteAllOverlaysCluster();
  }
  public async deleteHeatMap() {
    const heatmap = HeatMapBD.getInstance(this.view);
    await heatmap.deleteHeatMap();
  }
  public async setMapCenter(params: IPointGeometry) {
    let x = params.x;
    let y = params.y;
    let center = new BMap.Point(x, y);
    this.view.panTo(center);
  }
  public async setMapCenterAndLevel(params: ICenterLevel) {
    let x = params.x;
    let y = params.y;
    let level = params.level || this.view.getZoom();
    let center = new BMap.Point(x, y);
    this.view.centerAndZoom(center, level);
  }

  public showLayer(params: ILayerConfig):any {
    this.baseLayers.forEach((baselayer) => {
      if (
        (params.label && baselayer.label === params.label) ||
        (params.type && baselayer.type === params.type)
      ) {
        if (!baselayer.visible) {
          this.view.addTileLayer(baselayer.layer);
          baselayer.visible = true;
        }
      }
    });
  }
  public hideLayer(params: ILayerConfig):any {
    this.baseLayers.forEach((baselayer) => {
      if (
        (params.label && baselayer.label === params.label) ||
        (params.type && baselayer.type === params.type)
      ) {
        if (baselayer.visible) {
          this.view.removeTileLayer(baselayer.layer);
          baselayer.visible = false;
        }
      }
    });
  }

  public async showJurisdiction() {
    const police = JurisdictionPolice.getInstance(this.view);
    await police.showJurisdiction();
  }
  public async hideJurisdiction() {
    const police = JurisdictionPolice.getInstance(this.view);
    await police.hideJurisdiction();
  }
  public async showDistrictMask(param: IDistrictParameter) {}
  public async hideDistrictMask() {}
  public async showRoad() {}
  public async hideRoad() {}
  public async showStreet() {}
  public async hideStreet() {}
  public async locateStreet(param: IStreetParameter) {}
  public async routeSearch(params: routeParameter): Promise<IResult> {
    return {status: 0, message: ''};
  }
  public clearRouteSearch() {}

  public showRoutePoint(params: any) {}
  public clearRoutePoint() {}
  public async addDrawLayer(params: any): Promise<IResult> {
    return {status: 0, message: ''};
  }
  public clearDrawLayer(params: ILayerConfig) {}

  public showMigrateChart(params: any) {}
  public hideMigrateChart() {}
  public async startTrackPlayback(params:ITrackPlaybackParameter) :Promise<any>{
    const trackPlayBack = TrackPlaybackBD.getInstance(this.view);
    return await trackPlayBack.startTrackPlayback(params);
  }
  public async startRealTrackPlayback() :Promise<any>{}
  public pausePlayback(){}
  public goOnPlayback(){}
  // public async startDrawOverlays():Promise<any>{}
  public async showTooltip(param:Vue.Component):Promise<any>{
    const overlay = OverlayBaidu.getInstance(this.view);
    return await overlay.showToolTip(param);
  }
  public async closeTooltip():Promise<any>{
    const overlay = OverlayBaidu.getInstance(this.view);
    return await overlay.closeTooltip();
  }
  public async showMonitorArea(params:IMonitorAreaParameter):Promise<IResult>{
    const monitor = ElectronicFence.getInstance(this.view);
    return await monitor.showMonitorArea(params);
  }
  public showCircleOutline():any{}
  public createPlaceFence():any{}
  public createLineFence(params:any):any{}
  public createElectFenceByEndPtsConnection(params:any):any{}
  public showBarChart(params: any) {}
  public hideBarChart() {}
  public addHeatImage2D(params: IHeatImageParameter) {}
  public addHeatImage3D(params: IHeatImageParameter) {}
  public deleteHeatImage() {}

  public async startGeometrySearch(
    params: IGeometrySearchParameter
  ): Promise<IResult> {
    const geometrySearch = GeometrySearchBD.getInstance(this.view);
    return await geometrySearch.startGeometrySearch(params);
  }
  public clearGeometrySearch() {}
  public async showDgene(params: any): Promise<IResult> {
    return {status: 0, message: ''};
  }
  public hideDgene() {}
  public showEditingLabel(params:any):any{}
  public async addDgeneFusion(params: any): Promise<IResult> {
    return {status: 0, message: ''};
  }
  public async restoreDegeneFsion(): Promise<IResult> {
    return {status: 0, message: ''};
  }
    public async arcgisLoadGDLayer(){}
  public showCustomTip(params: ICustomTip) {}
  public showDgeneOutPoint(params: any) {}
  public changeDgeneOut() {}

  public async initializeRouteSelect(params: ISelectRouteParam) {}
  public async showSelectedRoute(params: ISelectRouteResult) {}
  public async playSelectedRoute(speed: number) {}
  public stopPlaySelectedRoute() {}
  public async routeHitArea(params: ISelectRouteHitTest): Promise<IResult> {
    return {status: -1, message: ''};
  }
  public async areaHitRoute(params: ISelectRouteHitTest): Promise<IResult> {
    return {status: -1, message: ''};
  }

  public async startDrawOverlays(params: IDrawOverlays): Promise<IResult> {
    const drawOverlays = DrawOverlaysBD.getInstance(this.view);
    drawOverlays.drawCallback = this.drawCallback;
    return await drawOverlays.startDrawOverlays(params);
  }
  public async stopDrawOverlays(params:any): Promise<IResult> {
    const drawOverlays = DrawOverlaysBD.getInstance(this.view);
    return await drawOverlays.stopDrawOverlays(params);
  }
  public async getDrawOverlays(): Promise<IResult> {
    const drawOverlays = DrawOverlaysBD.getInstance(this.view);
    return await drawOverlays.getDrawOverlays();
  }
  public async deleteDrawOverlays(params:IDrawOverlaysDelete): Promise<IResult> {
    const drawOverlays = DrawOverlaysBD.getInstance(this.view);
    return await drawOverlays.deleteDrawOverlays(params);
  }
  public async hideOverlays(params:IDrawOverlaysDelete): Promise<IResult> {
    const overlays = OverlayBaidu.getInstance(this.view);
    return await overlays.hideOverlays(params);
  }
  public async showOverlays(params:IDrawOverlaysDelete): Promise<IResult> {
    const overlays = OverlayBaidu.getInstance(this.view);
    return await overlays.showOverlays(params);
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
    const overlays = OverlayBaidu.getInstance(this.view);
    return await overlays.findOverlays(params);
  }
  public async backgroundGeometrySearch(params:IGeometrySearchParameter): Promise<IResult> {
    const geometrySearch = GeometrySearchBD.getInstance(this.view);
    return await geometrySearch.backgroundGeometrySearch(params);
  }
  public async polylineRanging(params:IPolylineRangingParameter): Promise<IResult> {
    const drawOverlays = DrawOverlaysBD.getInstance(this.view);
    return await drawOverlays.polylineRanging(params);
  }
  public async changePicById(params:IPicChangeParameter): Promise<IResult> {
    const overlays = OverlayBaidu.getInstance(this.view);
    return await overlays.changePicById(params);
  }

  public async searchPOI(params:IPOISearch): Promise<IResult> {
    const poi = POISearchBD.getInstance(this.view);
    return await poi.searchPOI(params);
  }

  public async clearPOIResults(params:IPOIDelete): Promise<IResult> {
    const poi = POISearchBD.getInstance(this.view);
    return await poi.clearPOIResults(params);
  }

}
