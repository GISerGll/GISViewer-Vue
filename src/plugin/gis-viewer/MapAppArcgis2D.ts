import {setDefaultOptions, loadCss, loadModules} from 'esri-loader';
import {
  ILayerConfig,
  IOverlayParameter,
  IResult,
  IPointGeometry,
  ICenterLevel,
  IOverlayDelete,
  IFindParameter,
  IStreetParameter,
  IHeatParameter,
  IDrawOverlayParameter,
  ITrackPlaybackParameter,
  IOverlayClusterParameter,
  IHeatImageParameter,
  routeParameter,
  IElectronicFenceParameter,
  ICircleOutline,
  IMonitorAreaParameter
} from '@/types/map';

import {Draw2D} from "@/plugin/gis-viewer/widgets/draw2D";
import TrackPlayback from "@/project/WuLuMuQi/TrackPlayback.ts";
import ElectronicFence from "@/project/WuLuMuQi/ElectronicFence";
import {OverlayArcgis2D} from '@/plugin/gis-viewer/widgets/Overlays/arcgis/OverlayArcgis2D';
import {FindFeature} from './widgets/FindFeature/arcgis/FindFeature';
import {HeatMap} from './widgets/HeatMap/arcgis/HeatMap';
import {blendColors} from 'esri/Color';
import {TextSymbol} from 'esri/symbols';
import {Cluster} from './widgets/Cluster/arcgis/Cluster';
import {DrawLayer} from './widgets/DrawLayer/arcgis/DrawLayer';
import {MigrateChart} from './widgets/MigrateChart/arcgis/MigrateChart';
import {HeatImage} from './widgets/HeatMap/arcgis/HeatImage';

export default class MapAppArcGIS2D {
  public view!: __esri.MapView;
  public showGisDeviceInfo: any;
  public mapClick: any;

  public async initialize(mapConfig: any, mapContainer: string): Promise<void> {
    const apiUrl =
      mapConfig.arcgis_api || mapConfig.apiUrl || 'https://js.arcgis.com/4.15/';
    setDefaultOptions({
      url: `${apiUrl}/init.js`
    });

    const cssFile: string = mapConfig.theme
      ? `themes/${mapConfig.theme}/main.css`
      : 'css/main.css';
    loadCss(`${apiUrl}/esri/${cssFile}`);

    type MapModules = [
      typeof import('esri/views/MapView'),
      typeof import('esri/Basemap'),
      typeof import('esri/Map'),
      typeof import('esri/layers/TileLayer'),
      typeof import('esri/layers/WebTileLayer'),
      typeof import('esri/core/Collection'),
      typeof import('esri/config')
    ];
    const [
      MapView,
      Basemap,
      Map,
      TileLayer,
      WebTileLayer,
      Collection,
      esriConfig
    ] = await (loadModules([
      'esri/views/MapView',
      'esri/Basemap',
      'esri/Map',
      'esri/layers/TileLayer',
      'esri/layers/WebTileLayer',
      'esri/core/Collection',
      'esri/config'
    ]) as Promise<MapModules>);
    esriConfig.fontsUrl = '/font/';
    const baseLayers: __esri.Collection = new Collection();
    baseLayers.addMany(
      mapConfig.baseLayers.map((layerConfig: ILayerConfig) => {
        if (layerConfig.type === 'tiled') {
          delete layerConfig.type;
          return new TileLayer(layerConfig);
        } else if (layerConfig.type === 'webtiled') {
          return new WebTileLayer({
            urlTemplate: layerConfig.url,
            subDomains: layerConfig.subDomains || undefined
          });
        }
      })
    );
    this.destroy();
    const basemap: __esri.Basemap = new Basemap({
      baseLayers
    });

    const view: __esri.MapView = new MapView({
      map: new Map({
        basemap
      }),
      container: mapContainer,
      ...mapConfig.options,
      constraints: {
        rotationEnabled: false
      }
    });
    view.ui.remove('attribution');
    view.ui.remove('zoom');
    view.ui.remove('compass');
    if (mapConfig.operationallayers) {
      this.createLayer(view.map, mapConfig.operationallayers);
    }

    view.on('click', async (event) => {
      if (event.mapPoint) {
        let mp = event.mapPoint;
        this.mapClick({
          x: mp.longitude,
          y: mp.latitude,
          lat: mp.x,
          lnt: mp.y,
          wkid: mp.spatialReference.wkid
        });
      } else {
        this.mapClick(event);
      }
      const response = await view.hitTest(event);
      if (response.results.length > 0) {
        response.results.forEach((result) => {
          const graphic = result.graphic;
          let {type, id} = graphic.attributes;
          if (
            graphic.layer.type == 'feature' ||
            graphic.layer.type == 'graphics'
          ) {
            id =
              graphic.attributes['DEVICEID'] ||
              graphic.attributes['FEATUREID'] ||
              graphic.attributes['id'] ||
              graphic.attributes['ID'] ||
              undefined;
            type =
              graphic.attributes['DEVICETYPE'] ||
              graphic.attributes['FEATURETYPE'] ||
              graphic.attributes['FEATURETYP'] ||
              graphic.attributes['type'] ||
              graphic.attributes['TYPE'] ||
              undefined;
          }
          if (type && id) {
            this.showGisDeviceInfo(type, id, graphic.toJSON());
          }
        });
      } else {
        this.doIdentifyTask(event.mapPoint).then((results: any) => {
          if (results.length > 0) {
            let result = results[0];
            let type = result.layerName;
            let layerid = result.layerId;
            let id =
              result.feature.attributes['DEVICEID'] ||
              result.feature.attributes['FEATUREID'] ||
              result.feature.attributes[result.displayFieldName];
            this.showGisDeviceInfo(type, id, result.feature.attributes);
            let selectLayer = this.getLayerByName(type);
            if (selectLayer.popupTemplates) {
              let popup = selectLayer.popupTemplates[layerid];
              if (popup) {
                this.view.popup.open({
                  title: popup.title,
                  content: this.getContent(
                    result.feature.attributes,
                    popup.content
                  ),
                  location: event.mapPoint
                });
              }
            }
          }
        });
      }
    });
    await view.when();
    this.view = view;

    (this.view.popup as any).visibleElements = {
      featureNavigation: false,
      closeButton: false
    };
  }
  private destroy() {
    OverlayArcgis2D.destroy();
    Cluster.destroy();
    HeatMap.destroy();
    FindFeature.destroy();
    MigrateChart.destroy();
    DrawLayer.destroy();
    HeatImage.destroy();
  }
  //使toolTip中支持{字段}的形式
  private getContent(attr: any, content: string): string {
    let tipContent = content;
    if (content) {
      //键值对
      for (let fieldName in attr) {
        if (attr.hasOwnProperty(fieldName)) {
          tipContent = tipContent.replace(
            '{' + fieldName + '}',
            attr[fieldName]
          );
        }
      }
    }
    return tipContent;
  }
  private getLayerIds(layer: any): any[] {
    let layerids = [];
    if (layer.type == 'feature') {
      //featurelayer查询
      layerids.push(layer.layerId);
    } else if (layer.type == 'map-image') {
      let sublayers = (layer as __esri.MapImageLayer).sublayers;
      sublayers.forEach((sublayer) => {
        if (sublayer.visible) {
          layerids.push(sublayer.id);
        }
      });
    }
    return layerids.reverse();
  }
  private getLayerByName(layername: string): any {
    let selLayer;
    let layers = this.view.map.allLayers.toArray().forEach((layer: any) => {
      if (layer.type == 'imagery' || layer.type == 'map-image') {
        let sublayers = (layer as __esri.MapImageLayer).sublayers;
        sublayers.forEach((sublayer) => {
          if (sublayer.title == layername) {
            selLayer = layer;
          }
        });
      }
      return false;
    });
    return selLayer;
  }
  private async doIdentifyTask(clickpoint: any) {
    let layers = this.view.map.allLayers.filter((layer: any) => {
      if (
        layer.visible &&
        (layer.type == 'imagery' || layer.type == 'map-image')
      ) {
        return true;
      }
      return false;
    });
    let that = this;
    type MapModules = [
      typeof import('esri/Graphic'),
      typeof import('esri/tasks/IdentifyTask'),
      typeof import('esri/tasks/support/IdentifyParameters')
    ];
    const [Graphic, IdentifyTask, IdentifyParameters] = await (loadModules([
      'esri/Graphic',
      'esri/tasks/IdentifyTask',
      'esri/tasks/support/IdentifyParameters'
    ]) as Promise<MapModules>);
    let promises: any = layers.toArray().map((layer: any) => {
      return new Promise((resolve, reject) => {
        let identify = new IdentifyTask(layer.url); //创建属性查询对象

        let identifyParams = new IdentifyParameters(); //创建属性查询参数
        identifyParams.tolerance = 3;
        identifyParams.layerIds = that.getLayerIds(layer);
        identifyParams.layerOption = 'visible'; //"top"|"visible"|"all"
        identifyParams.width = that.view.width;
        identifyParams.height = that.view.height;
        identifyParams.geometry = clickpoint;
        identifyParams.mapExtent = that.view.extent;

        // 执行查询对象
        identify.execute(identifyParams).then((data: any) => {
          let results = data.results;
          if (results.length < 1) return [];
          resolve(results[0]);
        });
      });
    });
    return new Promise((resolve) => {
      Promise.all(promises).then((e: any) => {
        resolve(e);
      });
    });
  }
  private async createLayer(map: __esri.Map, layers: any) {
    type MapModules = [
      typeof import('esri/layers/FeatureLayer'),
      typeof import('esri/layers/WebTileLayer'),
      typeof import('esri/layers/MapImageLayer'),
      typeof import('esri/layers/WMSLayer'),
      typeof import('esri/layers/Layer'),
      typeof import('esri/layers/support/LabelClass'),
      typeof import('esri/Color'),
      typeof import('esri/symbols/Font'),
      typeof import('esri/symbols/TextSymbol')
    ];
    const [
      FeatureLayer,
      WebTileLayer,
      MapImageLayer,
      WMSLayer,
      Layer,
      LabelClass,
      Color,
      Font,
      TextSymbol
    ] = await (loadModules([
      'esri/layers/FeatureLayer',
      'esri/layers/WebTileLayer',
      'esri/layers/MapImageLayer',
      'esri/layers/WMSLayer',
      'esri/layers/Layer',
      'esri/layers/support/LabelClass',
      'esri/Color',
      'esri/symbols/Font',
      'esri/symbols/TextSymbol'
    ]) as Promise<MapModules>);
    map.addMany(
      layers.map((layerConfig: any) => {
        let layer: any;
        let type = layerConfig.type.toLowerCase();
        delete layerConfig.type;
        switch (type) {
          case 'feature':
            layer = new FeatureLayer(layerConfig);
            layer.labelingInfo = layerConfig.labelingInfo;
            break;
          case 'dynamic':
            layer = new MapImageLayer(layerConfig);
            break;
          case 'wms':
            layer = new WMSLayer(layerConfig);
            break;
          case 'webtiled':
            layer = new WebTileLayer({
              urlTemplate: layerConfig.url,
              subDomains: layerConfig.subDomains || undefined
            });
            break;
        }
        layer.id = layerConfig.id || layerConfig.label;
        return layer;
      })
    );
  }
  public async addOverlays(params: IOverlayParameter): Promise<IResult> {
    const overlay = OverlayArcgis2D.getInstance(this.view);
    return await overlay.addOverlays(params);
  }
  public async addOverlaysCluster(params: IOverlayClusterParameter) {
    const cluster = Cluster.getInstance(this.view);
    cluster.showGisDeviceInfo = this.showGisDeviceInfo;
    await cluster.addOverlaysCluster(params);
  }
  public async deleteOverlays(params: IOverlayDelete) {
    const overlay = OverlayArcgis2D.getInstance(this.view);
    return await overlay.deleteOverlays(params);
  }
  public async deleteAllOverlays() {
    const overlay = OverlayArcgis2D.getInstance(this.view);
    return await overlay.deleteAllOverlays();
  }
  public async deleteOverlaysCluster(params: IOverlayDelete) {
    const cluster = Cluster.getInstance(this.view);
    return await cluster.deleteOverlaysCluster(params);
  }
  public async deleteAllOverlaysCluster() {
    const cluster = Cluster.getInstance(this.view);
    return await cluster.deleteAllOverlaysCluster();
  }
  public async findFeature(params: IFindParameter) {
    const overlay = OverlayArcgis2D.getInstance(this.view);
    return await overlay.findFeature(params);
  }
  public async findLayerFeature(params: IFindParameter) {
    const find = FindFeature.getInstance(this.view);
    return await find.findLayerFeature(params);
  }
  public async showToolTip(){
    const tooltip = OverlayArcgis2D.getInstance(this.view);
    await tooltip.showToolTip();
  }
  public async showLayer(params: ILayerConfig) {
    this.view.map.allLayers.forEach((baselayer: ILayerConfig) => {
      if (params.label && baselayer.label === params.label) {
        if (!baselayer.visible) {
          baselayer.visible = true;
        }
      }
    });
  }
  public async hideLayer(params: ILayerConfig) {
    this.view.map.allLayers.forEach((baselayer: ILayerConfig) => {
      if (params.label && baselayer.label === params.label) {
        if (baselayer.visible) {
          baselayer.visible = false;
        }
      }
    });
  }
  public async setMapCenter(params: IPointGeometry) {
    let x = params.x;
    let y = params.y;

    if (!isNaN(x) && !isNaN(y)) {
      await this.view.goTo({
        center: [x, y]
      });
    }
  }
  public async setMapCenterAndLevel(params: ICenterLevel) {
    let x = params.x;
    let y = params.y;
    let level: number = params.level || this.view.zoom;

    if (!isNaN(x) && !isNaN(y) && !isNaN(level) && level >= 0) {
      await this.view.goTo({
        zoom: level,
        center: [x, y]
      });
    }
  }
  public async showRoad() {}
  public async hideRoad() {}
  public async showStreet() {}
  public async hideStreet() {}
  public async locateStreet(param: IStreetParameter) {}
  public async addHeatMap(params: IHeatParameter) {
    const heatmap = HeatMap.getInstance(this.view);
    return await heatmap.addHeatMap(params);
  }
  public async deleteHeatMap() {
    const heatmap = HeatMap.getInstance(this.view);
    return await heatmap.deleteHeatMap();
  }
  public async startDrawOverlays(params: IDrawOverlayParameter):Promise<IResult>{
    const drawOverlay = Draw2D.getInstance(this.view);
    return await drawOverlay.startDrawOverlays(params);
  }
  public async startTrackPlayback(params: ITrackPlaybackParameter):Promise<IResult>{
      const trackPlayback = TrackPlayback.getInstance(this.view);
      return await trackPlayback.startTrackPlayback(params);
  }
  public async startRealTrackPlayback(params: ITrackPlaybackParameter):Promise<IResult>{
    const trackPlayback = TrackPlayback.getInstance(this.view);
    return await trackPlayback.startRealTrackPlayback(params);
  }
  public pausePlayback(){
    const trackPlayback = TrackPlayback.getInstance(this.view);
    trackPlayback.pausePlayback();
  }
  public goOnPlayback(){
    const trackPlayback = TrackPlayback.getInstance(this.view);
    trackPlayback.goOnPlayback();
  }
  public setMapStyle(param: string) {}
  public async routeSearch(params: routeParameter): Promise<IResult> {
    return {status: 0, message: ''};
  }
  public clearRouteSearch() {}
  public showRoutePoint(params: any) {}
  public clearRoutePoint() {}
  public async addDrawLayer(params: any): Promise<IResult> {
    const drawlayer = DrawLayer.getInstance(this.view);
    return await drawlayer.addDrawLayer(params);
  }
  public clearDrawLayer(params: any) {
    const drawlayer = DrawLayer.getInstance(this.view);
    drawlayer.clearDrawLayer(params);
  }
  public showMigrateChart(params: any) {
    const chart = MigrateChart.getInstance(this.view);
    chart.showMigrateChart(params);
  }
  public hideMigrateChart() {
    const chart = MigrateChart.getInstance(this.view);
    chart.hideMigrateChart();
  }
  public addHeatImage(params: IHeatImageParameter) {
    const heat = HeatImage.getInstance(this.view);
    heat.addHeatImage(params);
  }
  public deleteHeatImage() {
    const heat = HeatImage.getInstance(this.view);
    heat.deleteHeatImage();
  }
  public async showMonitorArea(params:IMonitorAreaParameter) {
    const electronicFence = ElectronicFence.getInstance(this.view);
    return await electronicFence.showMonitorArea(params);
  }

  public async showCircleOutline(param:ICircleOutline):Promise<IResult> {
    const electronicFence = ElectronicFence.getInstance(this.view);
    return await electronicFence.showCircleOutline(param);
  }

  public async createPlaceFence(param:IElectronicFenceParameter):Promise<IResult> {
    const electronicFence = ElectronicFence.getInstance(this.view);
    return await electronicFence.createPlaceFence(param);
  }
}
