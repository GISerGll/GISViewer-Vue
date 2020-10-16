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
  ICustomTip
} from '@/types/map';
import {OverlayBaidu} from '@/plugin/gis-viewer/widgets/Overlays/bd/OverlayBaidu';
import {HeatMapBD} from './widgets/HeatMap/bd/HeatMapBD';
import {JurisdictionPolice} from './widgets/JurisdictionPolice/bd/JurisdictionPolice';
import {Utils} from '@/plugin/gis-viewer/Utils';

declare let BMap: any;

export default class MapAppBaidu implements IMapContainer {
  public view!: any;
  public baseLayers: Array<any> = [];
  public showGisDeviceInfo: any;
  public mapClick: any;

  public async initialize(mapConfig: any, mapContainer: string): Promise<any> {
      const apiUrl = mapConfig.baidu_api; //"http://localhost:8090/baidu/BDAPI.js";
      let view: any;
      // const apiRoot = mapConfig.baidu_api.substring(0, apiUrl.lastIndexOf('/'));
      const mapV = apiUrl.substring(0, apiUrl.lastIndexOf('/')) + '/mapv.js';
      await Utils.loadScripts([
          apiUrl,
          mapV
      ])

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
                  this.showGisDeviceInfo(e.overlay.id,e.overlay.type);
              }
          });
      })

      this.view = view;
      this.view.gisServer = gisUrl;
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
        default:

            break;

    }
  }
  public setMapStyle(param: string) {
    //this.view.setMapStyle(param);
  }
  public async addOverlays(params: IOverlayParameter): Promise<IResult> {
    const overlay = OverlayBaidu.getInstance(this.view);
    overlay.showGisDeviceInfo = this.showGisDeviceInfo;
    return await overlay.addOverlays(params);
  }
  public async findFeature(params: IFindParameter):Promise<any> {
    const overlay = OverlayBaidu.getInstance(this.view);
    await overlay.findFeature(params);
  }
  public async findLayerFeature(params: IFindParameter) {}
  public async addOverlaysCluster(params: IOverlayClusterParameter) {
    const overlay = OverlayBaidu.getInstance(this.view);
    overlay.showGisDeviceInfo = this.showGisDeviceInfo;
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
  public async startTrackPlayback() :Promise<any>{}
  public async startRealTrackPlayback() :Promise<any>{}
  public pausePlayback(){}
  public goOnPlayback(){}
  public async startDrawOverlays():Promise<any>{}
  public async showToolTip(param:Vue.Component):Promise<any>{
    const overlay = OverlayBaidu.getInstance(this.view);
    return await overlay.showToolTip(param);
  }
  public async closeToolTip():Promise<any>{
    const overlay = OverlayBaidu.getInstance(this.view);
    return await overlay.closeToolTip();
  }
  public showMonitorArea():any{}
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
    return {status: 0, message: ''};
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
}
