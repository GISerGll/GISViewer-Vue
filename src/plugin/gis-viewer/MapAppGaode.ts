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
  IGeometrySearchParameter
} from '@/types/map';
import {OverlayGaode} from '@/plugin/gis-viewer/widgets/Overlays/gd/OverlayGaode';
import {JurisdictionPoliceGD} from './widgets/JurisdictionPolice/gd/JurisdictionPoliceGD';
import {HeatMapGD} from './widgets/HeatMap/gd/HeatMapGD';
import {ClusterGD} from './widgets/Cluster/gd/ClusterGD';
import '@amap/amap-jsapi-types';
import AMapLoader from '@amap/amap-jsapi-loader';
import {DrawSteet} from './widgets/DrawStreet/gd/DrawStreet';
import Route from './widgets/Route/Route';
import RoutePoint from './widgets/XinKong/RoutePoint';
import {GeometrySearchGD} from './widgets/GeometrySearch/gd/GeometrySearchGD';

export default class MapAppGaode implements IMapContainer {
  public view!: AMap.Map;
  public baseLayers: Array<any> = [];
  public showGisDeviceInfo: any;
  public mouseGisDeviceInfo: any;
  public mapClick: any;

  public async initialize(mapConfig: any, mapContainer: string) {
    let apiUrl = mapConfig.gaode_api || mapConfig.api_url;
    let plugins = [
      'AMap.DistrictSearch',
      'AMap.CustomLayer',
      'AMap.ControlBar',
      'AMap.MarkerClusterer',
      'AMap.Driving',
      'AMap.Walking',
      'AMap.Riding'
    ];
    let version = '1.0';
    if (apiUrl.indexOf('v=2') > -1) {
      plugins.push('AMap.HeatMap');
      version = '2.0';
    } else {
      plugins.push('AMap.Heatmap');
    }

    let reg = /webapi.amap.com/ig;
    //匹配正则表达式执行高德自己loader
    if(reg.test(apiUrl)){
      let key = this.getQueryString(apiUrl, 'key');
      let v = this.getQueryString(apiUrl, 'v');
      await AMapLoader.load({
        key: key,
        version: v,
        plugins: plugins
      });
    }else{    //不匹配则将执行本地方法，实现<script>标签写入
      await this.loadOtherScripts([
        apiUrl,
      ]).then(function(e: any) {
        console.log("Load Scripts");
      });
    }

    this.destroy();
    this.view = new AMap.Map(mapContainer, mapConfig.options);
    (this.view as any).version = version;
    (this.view as any).mapOptions = mapConfig.options;
    this.view.on('click', async (evt) => {
      let mp = evt.lnglat;
      this.mapClick({x: mp.lng, y: mp.lat, lng: mp.lng, lat: mp.lat});
    });
    return new Promise((resole) => {
      this.view.on('complete', () => {
        if (mapConfig.baseLayers) {
          mapConfig.baseLayers.forEach((element: any) => {
            this.createLayer(this.view, element);
          });
        }
        resole();
      });
    });
  }
  private getQueryString(url: string, name: string): string {
    let reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)'); //构造一个含有目标参数的正则表达式对象
    let search = url.split('?')[1];
    let r = search.match(reg); //匹配目标参数
    if (r != null) {
      return decodeURIComponent(r[2]);
    }
    return ''; //返回参数值
  }
  public createLayer(view: any, layer: any) {
    switch (layer.type) {
      case 'traffic':
        let trafficlayer = new AMap.TileLayer.Traffic({
          autoRefresh: true, //是否自动刷新，默认为false
          interval: layer.interval || 60, //刷新间隔，默认180s
          zooms: layer.zooms || [3, 17],
          opacity: layer.opacity || 1,
          zIndex: layer.zIndex || 4
        });
        if (layer.visible !== false) {
          view.add(trafficlayer);
        }
        this.baseLayers.push({
          label: layer.label || '',
          type: layer.type || '',
          layer: trafficlayer,
          visible: layer.visible !== false
        });
        break;
    }
  }
  private destroy() {
    OverlayGaode.destroy();
    ClusterGD.destroy();
    HeatMapGD.destroy();
    JurisdictionPoliceGD.destroy();
    DrawSteet.destroy();
    Route.destroy();
    RoutePoint.destroy();
    GeometrySearchGD.destroy();
  }
  public async addOverlays(params: IOverlayParameter): Promise<IResult> {
    const overlay = OverlayGaode.getInstance(this.view);
    overlay.showGisDeviceInfo = this.showGisDeviceInfo;
    overlay.mouseGisDeviceInfo = this.mouseGisDeviceInfo;
    return await overlay.addOverlays(params);
  }
  public async findFeature(params: IFindParameter): Promise<IResult> {
    const overlay = OverlayGaode.getInstance(this.view);
    return await overlay.findFeature(params);
  }
  public async findLayerFeature(params: IFindParameter) {}
  public async addOverlaysCluster(params: IOverlayClusterParameter) {
    const cluster = ClusterGD.getInstance(this.view);
    cluster.showGisDeviceInfo = this.showGisDeviceInfo;
    await cluster.addOverlaysCluster(params);
  }
  public async addHeatMap(params: IHeatParameter) {
    const heatmap = HeatMapGD.getInstance(this.view);
    await heatmap.addHeatMap(params);
  }
  public async deleteOverlays(params: IOverlayDelete) :Promise<IResult>{
    const overlay = OverlayGaode.getInstance(this.view);
    return await overlay.deleteOverlays(params);
  }
  public async deleteOverlaysCluster(params: IOverlayDelete) {
    const cluster = ClusterGD.getInstance(this.view);
    await cluster.deleteOverlaysCluster(params);
  }
  public async deleteAllOverlays() {
    const overlay = OverlayGaode.getInstance(this.view);
    await overlay.deleteAllOverlays();
  }
  public async deleteAllOverlaysCluster() {
    const cluster = ClusterGD.getInstance(this.view);
    await cluster.deleteAllOverlaysCluster();
  }
  public async deleteHeatMap() {
    const overlay = HeatMapGD.getInstance(this.view);
    await overlay.deleteHeatMap();
  }
  public async setMapCenter(params: IPointGeometry) {
    let x = params.x;
    let y = params.y;
    let center = new AMap.LngLat(x, y);
    this.view.setCenter(center);
  }
  public async setMapCenterAndLevel(params: ICenterLevel) {
    let x = params.x;
    let y = params.y;
    let center = new AMap.LngLat(x, y);
    let level = params.level || this.view.getZoom();
    this.view.setZoomAndCenter(level, center);
  }
  public async showLayer(params: ILayerConfig) :Promise<IResult>{
    let showResult = false;
    this.baseLayers.forEach((baselayer) => {
      if (
        (params.label && baselayer.label === params.label) ||
        (params.type && baselayer.type === params.type)
      ) {
        if (!baselayer.visible) {
          this.view.add(baselayer.layer);
          baselayer.visible = true;
          showResult = true;
        }
      }
    });

    return {
      status:0,
      message:'ok',
      result:showResult ? `成功显示${params.label}图层` : '未找到该图层或该图层已处于显示状态'
    }
  }
  public async hideLayer(params: ILayerConfig) :Promise<IResult>{
    let hideResult = false;
    this.baseLayers.forEach((baselayer) => {
      if (
        (params.label && baselayer.label === params.label) ||
        (params.type && baselayer.type === params.type)
      ) {
        if (baselayer.visible) {
          this.view.remove(baselayer.layer);
          baselayer.visible = false;
          hideResult = true;
        }
      }
    });

    return {
      status:0,
      message:'ok',
      result:hideResult ? `成功显示${params.label}图层` : '未找到该图层或该图层已处于隐藏状态'
    }
  }

  public async showJurisdiction() {}
  public async hideJurisdiction() {}

  public async showDistrictMask(param: IDistrictParameter) {
    const jurisdiction = JurisdictionPoliceGD.getInstance(this.view);
    await jurisdiction.showDistrictMask(param);
  }
  public async hideDistrictMask() {
    const jurisdiction = JurisdictionPoliceGD.getInstance(this.view);
    await jurisdiction.hideDistrictMask();
  }
  public async showRoad(param: {ids: string[]}) {
    const road = DrawSteet.getInstance(this.view);
    await road.showRoad(param);
  }
  public async hideRoad() {
    const road = DrawSteet.getInstance(this.view);
    await road.hideRoad();
  }
  public async showStreet() {
    const jurisdiction = JurisdictionPoliceGD.getInstance(this.view);
    await jurisdiction.showStreet();
  }
  public async hideStreet() {
    const jurisdiction = JurisdictionPoliceGD.getInstance(this.view);
    await jurisdiction.hideStreet();
  }
  public async locateStreet(param: IStreetParameter) {
    const jurisdiction = JurisdictionPoliceGD.getInstance(this.view);
    await jurisdiction.locateStreet(param);
  }
  public setMapStyle(param: string) {
    this.view.setMapStyle(param);
  }
  public async routeSearch(params: routeParameter): Promise<IResult> {
    const route = Route.getInstance(this.view);
    return await route.routeSearch(params);
  }
  public clearRouteSearch() {
    const route = Route.getInstance(this.view);
    route.clearRouteSearch();
  }
  public showRoutePoint(params: any) {
    const rtp = RoutePoint.getInstance(this.view);
    rtp.showRoutePoint(params);
  }
  public clearRoutePoint() {
    const rtp = RoutePoint.getInstance(this.view);
    rtp.clearRoutePoint();
  }

  public async addDrawLayer(params: any): Promise<IResult> {
    return {status: 0, message: ''};
  }
  public clearDrawLayer(params: ILayerConfig) {}
  public showMigrateChart(params: any) {}
  public hideMigrateChart() {}
  public async startTrackPlayback() :Promise<any>{}
  public async startRealTrackPlayback() :Promise<any>{}
  public pausePlayback(){}
  public goOnPlayback(){}
  public async startDrawOverlays():Promise<any>{}
  public async showToolTip(param:Vue.Component):Promise<any>{
      const tooltip = OverlayGaode.getInstance(this.view);
      return await tooltip.showToolTip(param);
  }
  public async closeToolTip():Promise<any>{
    const tooltip = OverlayGaode.getInstance(this.view);
    return await tooltip.closeToolTip();
  }
  public showMonitorArea():any{}
  public showCircleOutline():any{}
  public createPlaceFence():any{}
  public createLineFence(params:any):any{}
  public createElectFenceByEndPtsConnection(params:any):any{}
  public addHeatImage(params: IHeatImageParameter) {}
  public deleteHeatImage() {}
  public async startGeometrySearch(
    params: IGeometrySearchParameter
  ): Promise<IResult> {
    let geometrySearch = GeometrySearchGD.getInstance(this.view);
    return await geometrySearch.startGeometrySearch(params);
  }
  public clearGeometrySearch() {
    let geometrySearch = GeometrySearchGD.getInstance(this.view);
    geometrySearch.clearGeometrySearch();
  }
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
  private async loadOtherScripts(scriptUrls: string[]): Promise<any> {
    let promises = scriptUrls.map((url) => {
      return new Promise((resolve, reject) => {
        const scriptElement = document.createElement('script');
        scriptElement.src = url;
        scriptElement.onload = resolve;
        document.body.appendChild(scriptElement);
      });
    });
    return new Promise((resolve) => {
      Promise.all(promises).then((e) => {
        resolve(e);
      });
    });
  }
}
