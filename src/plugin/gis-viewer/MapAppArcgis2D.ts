import {setDefaultOptions, loadCss, loadModules} from 'esri-loader';
import {Component, Emit, Prop, PropSync} from 'vue-property-decorator';
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
  routeParameter,
  IHeatImageParameter,
  IElectronicFenceParameter,
  ICircleOutline,
  IMonitorAreaParameter,
  IEditFenceLabel,
  IGeometrySearchParameter,
  ICustomTip,
  ISelectRouteParam,
  ISelectRouteResult,
  IDrawOverlays,
  ISelectRouteHitTest,
  IDefinitionParameter,
  ITrackParameter,
  IPolylineRangingParameter,
  IPicChangeParameter, IPOISearch, IPOIDelete, IBoundary, IRoadNetwork, IMultiBoundary
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
import {SubwayLine} from './widgets/MigrateChart/arcgis/SubwayLine';
import {HeatImage} from './widgets/HeatMap/arcgis/HeatImage';
import HeatImage2D from './widgets/HeatMap/arcgis/HeatImage2D';
import HeatImageGL from './widgets/HeatMap/arcgis/HeatImageGL';
import {GeometrySearchGD} from './widgets/GeometrySearch/gd/GeometrySearchGD';
import {GeometrySearch} from './widgets/GeometrySearch/arcgis/GeometrySearch';
import {DgeneFusion} from './widgets/DgeneFusion/arcgis/DgeneFusion';
import {Vue} from 'vue-property-decorator';
import LayerOperationArcGIS from "@/plugin/gis-viewer/widgets/LayerOperation/arcgis/LayerOperationArcgis";
import {ChengDiLayer} from './widgets/ChengDi/ChengDiLayer';
import AnimateLine from './widgets/MigrateChart/AnimateLine';
import {Bar3DChart} from './widgets/MigrateChart/arcgis/Bar3DChart';
import {Utils} from './Utils';
import ToolTip from './widgets/Overlays/arcgis/ToolTip';
import {Cluster2D} from './widgets/Cluster/arcgis/Cluster2D';
import SelectRoute2D from '@/plugin/gis-viewer/widgets/SelectRoute/arcgis/SelectRoute2D';
import {DrawOverlays} from './widgets/DrawOverlays/arcgis/DrawOverlays';
import {LayerSearch} from './widgets/GeometrySearch/arcgis/LayerSearch';
import ImageOverlays from './widgets/HeatMap/arcgis/ImageOverlays';
import {LayerDefinition} from './widgets/LayerDefinition/arcgis/LayerDefinition';
import GeometrySearchBD from "@/plugin/gis-viewer/widgets/GeometrySearch/bd/GeometrySearchBD";
import POISearchBD from "@/plugin/gis-viewer/widgets/POISearch/bd/POISearchBD";
import OverlayPGIS from "@/plugin/gis-viewer/widgets/Overlays/pgis-ls/OverlayPGIS";

export default class MapAppArcGIS2D {
  public view!: __esri.MapView;

  /** 触发后向父组件传参的函数 */
  public showGisDeviceInfo!: (type: string, id: string, detail: any) => void;
  public mouseGisDeviceInfo!: (
    event: any,
    type: string,
    id: string,
    detail: any
  ) => void;
  public mouseoverlay: any = undefined;
  public mapClick!: (point: object) => void;
  public selectRouteFinished!: (routeInfo: object) => void;
  public intoSignal!: (signalId: string) => void;
  public outofSignal!: (signalId: string) => void;
  public layerLoaded: any;

  public showFlow: boolean = false;
  private tolerance: number = 3;
  private HighlightLayer!: __esri.GraphicsLayer;

  public async initialize(gisConfig: any, mapContainer: string): Promise<void> {
    //路由跳转是delete mapConfig属性导致报错
    let mapConfig = Utils.copyObject(gisConfig);
    const apiUrl =
      mapConfig.arcgis_api || mapConfig.apiUrl || 'https://js.arcgis.com/4.15/';
    setDefaultOptions({
      url: `${apiUrl}/init.js`
    });
    const cssFile: string = mapConfig.theme
      ? `themes/${mapConfig.theme}/main.css`
      : 'css/main.css';
    loadCss(`${apiUrl}/esri/${cssFile}`);

    if (mapConfig.theme == 'custom') {
      this.loadCustomCss();
    }
    type MapModules = [
      typeof import('esri/views/MapView'),
      typeof import('esri/Basemap'),
      typeof import('esri/Map'),
      typeof import('esri/Graphic'),
      typeof import('esri/layers/TileLayer'),
      typeof import('esri/layers/WebTileLayer'),
      typeof import('esri/layers/MapImageLayer'),
      typeof import('esri/core/Collection'),
      typeof import('esri/config')
    ];
    const [
      MapView,
      Basemap,
      Map,
      Graphic,
      TileLayer,
      WebTileLayer,
      MapImageLayer,
      Collection,
      esriConfig
    ] = await (loadModules([
      'esri/views/MapView',
      'esri/Basemap',
      'esri/Map',
      'esri/Graphic',
      'esri/layers/TileLayer',
      'esri/layers/WebTileLayer',
      'esri/layers/MapImageLayer',
      'esri/core/Collection',
      'esri/config'
    ]) as Promise<MapModules>);
    // esriConfig.fontsUrl = apiUrl + "/fonts/";
    let baseLayers: __esri.Collection = new Collection();
    if (mapConfig.baseLayers) {
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
          } else if (layerConfig.type === 'dynamic') {
            delete layerConfig.type;
            if ((layerConfig as any).showFlow) {
              this.showFlow = true;
            }
            return new MapImageLayer(layerConfig);
          }
        })
      );
    }

    //this.destroy();
    let basemap: __esri.Basemap = new Basemap({
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
    view.popup.watch('visible', async (newValue) => {
      if (newValue) {
        let content = view.popup.content;
        if (view.popup.selectedFeature) {
          var attributes = view.popup.selectedFeature.attributes;
          var newAttr: any = new Object();
          for (let field in attributes) {
            let fieldArr: string[] = field.toString().split('.');
            let newfield = fieldArr.pop() as string;
            attributes[newfield] =
              attributes[field] !== undefined && attributes[field] !== null
                ? attributes[field].toString().replace('Null', '')
                : '';
          }
        } else {
          //dynamic
          if (
            typeof content === 'string' &&
            content.toString().indexOf('Null') > -1
          ) {
            content = content.toString().replace(/Null/g, '');
            view.popup.content = content;
          }
        }
        if (content == 'Null' || content == '' || content == null) {
          view.popup.close();
        }
      }
    });
    view.on(['pointer-move'], async (event: any) => {
      const response = await view.hitTest(event);
      if (response.results.length > 0) {
        let result = response.results[0];

        const graphic = result.graphic;
        if (!graphic.attributes) {
          graphic.attributes = {};
        }
        let {type, id} = graphic.attributes;
        let label = graphic.layer ? (graphic.layer as any).label : '';
        if (
          graphic.layer &&
          (graphic.layer.type == 'feature' || graphic.layer.type == 'graphics')
        ) {
          id =
            graphic.attributes['DEVICEID'] ||
            graphic.attributes['FEATUREID'] ||
            graphic.attributes['SECTIONID'] ||
            graphic.attributes['id'] ||
            graphic.attributes['ID'] ||
            undefined;
          type =
            graphic.attributes['DEVICETYPE'] ||
            graphic.attributes['FEATURETYPE'] ||
            graphic.attributes['FEATURETYP'] ||
            graphic.attributes['type'] ||
            graphic.attributes['TYPE'] ||
            label ||
            undefined;
        }
        //if (id) {
        if (
          graphic.attributes &&
          (graphic.attributes.isCluster || graphic.attributes.isClusterText)
        ) {
          return;
        }
        if (!this.mouseoverlay) {
          event.type = 'mouseover';
          this.mouseGisDeviceInfo(event, type, id, graphic.toJSON());
          this.mouseoverlay = {
            event,
            type,
            id,
            graphic: graphic.toJSON()
          };
        } else {
          if (
            this.mouseoverlay &&
            this.mouseoverlay.id !== id &&
            this.mouseoverlay.type !== type
          ) {
            event.type = 'mouseout';
            this.mouseGisDeviceInfo(
              event,
              this.mouseoverlay.type,
              this.mouseoverlay.id,
              this.mouseoverlay.graphic
            );
            this.mouseoverlay = undefined;
          }
        }
      } else {
        if (this.mouseoverlay) {
          event.type = 'mouseout';
          this.mouseGisDeviceInfo(
            event,
            this.mouseoverlay.type,
            this.mouseoverlay.id,
            this.mouseoverlay.graphic
          );
          this.mouseoverlay = undefined;
        }
      }
    });
    view.on('click', async (event) => {
      this.hideBarChart();
      this.showSubwayChart();
      if (this.HighlightLayer) {
        this.HighlightLayer.removeAll();
      }
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
      if (
        response.results.length > 0 &&
        (response.results[0].graphic as any).isclick !== false
      ) {
        // response.results.forEach((result) => {
        //   //}
        // });
        let result = response.results[0];
        const graphic = result.graphic;
        if (!graphic.attributes) {
          return;
        }
        let {type, id} = graphic.attributes;
        let label = graphic.layer ? (graphic.layer as any).label : '';
        if (
          graphic.layer &&
          (graphic.layer.type == 'feature' || graphic.layer.type == 'graphics')
        ) {
          id =
            graphic.attributes['DEVICEID'] ||
            graphic.attributes['FEATUREID'] ||
            graphic.attributes['SECTIONID'] ||
            graphic.attributes['id'] ||
            graphic.attributes['ID'] ||
            undefined;
          type =
            graphic.attributes['DEVICETYPE'] ||
            graphic.attributes['FEATURETYPE'] ||
            graphic.attributes['FEATURETYP'] ||
            graphic.attributes['type'] ||
            graphic.attributes['TYPE'] ||
            label ||
            undefined;
        }
        //if (id) {
        if (
          graphic.attributes &&
          (graphic.attributes.isCluster || graphic.attributes.isClusterText)
        ) {
          return;
        }
        this.showGisDeviceInfo(type, id, graphic.toJSON());
        this.showSubBar(graphic.layer, event.mapPoint, graphic);
        this.showSubwayChart(graphic.layer, graphic);
      } else {
        this.doIdentifyTask(event.mapPoint).then((results: any) => {
          if (results.length > 0) {
            let res = results.filter((item: any) => {
              if (item != undefined) {
                return true;
              } else {
                return false;
              }
            })[0];
            if (!res) {
              return;
            }
            let layername = res.layerName;
            let layerid = res.layerId;
            let id =
              res.feature.attributes['DEVICEID'] ||
              res.feature.attributes['FEATUREID'] ||
              res.feature.attributes['SECTIONID'] ||
              res.feature.attributes[res.displayFieldName];
            this.showGisDeviceInfo(layername, id, res.feature);
            this.HighFeature(res.feature.geometry);
            let selectLayer = this.getLayerByName(layername, layerid);
            if (selectLayer.popupTemplates) {
              this.showSubBar(selectLayer, event.mapPoint, res.feature);
              let popup = selectLayer.popupTemplates[layerid];
              if (popup) {
                this.view.popup.open({
                  title: popup.title,
                  content: this.getContent(
                    res.feature.attributes,
                    popup.content
                  ),
                  location: event.mapPoint
                });
              }
            }
          } else {
            ToolTip.clear(this.view, undefined, 'custom-popup');
          }
        });
      }
    });
    await view.when();
    this.view = view;
    if (mapConfig.operationallayers) {
      this.createLayer(view, mapConfig.operationallayers);
    }
    (this.view as any).mapOptions = mapConfig.options;
    if (mapConfig.options && mapConfig.options.tolerance) {
      this.tolerance = mapConfig.options && mapConfig.options.tolerance;
    }
    (this.view.popup as any).visibleElements = {
      featureNavigation: false,
      closeButton: false
    };
    if (this.showFlow) {
      this.showSubwayFlow();
    }
  }
  private showSubBar(layer: any, point: any, feature: any) {
    if (layer && layer.showBar) {
      this.view.popup.alignment = 'bottom-center';
      let inField;
      let outField;
      if (layer.barFields) {
        inField = layer.barFields.inField;
        outField = layer.barFields.outField;
      }
      this.showBarChart({
        points: [
          {
            geometry: {
              x: point.x,
              y: point.y,
              spatialReference: this.view.spatialReference
            },
            fields: {
              inflow:
                feature.attributes[inField] ||
                feature.attributes['IN_FLX_NR'] ||
                feature.attributes['VOLUME_YESTERDAY'] ||
                feature.attributes['YJZH.STAT_METROLINEFLOW.VOLUME_YESTERDAY'],
              outflow:
                feature.attributes[outField] ||
                feature.attributes['OUT_FLX_NR'] ||
                feature.attributes['VOLUME_TODAY'] ||
                feature.attributes['YJZH.STAT_METROLINEFLOW.VOLUME_TODAY']
            }
          }
        ],
        name: '地铁线路图'
      });
    } else {
      this.view.popup.alignment = 'auto';
    }
  }
  private showSubwayChart(layer?: any, feature?: any) {
    if (layer && layer.showMigrate) {
      let attr = feature.attributes;
      let id = '';
      for (let field in attr) {
        if (
          field.indexOf('FEATUREID') > -1 ||
          field.indexOf('DEVICEID') > -1 ||
          field.indexOf('SECTIONID') > -1
        ) {
          id = attr[field];
        }
      }
      this.showSubwayMigrateChart({
        id: id,
        type: 'd',
        url: layer.url + '/' + layer.layerId
      });
    } else {
      this.showSubwayMigrateChart(undefined);
    }
  }
  private loadCustomCss() {
    require('./styles/custom.css');
  }
  private destroy() {}
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
  private getLayerByName(layername: string, id: string): any {
    let selLayer;
    this.view.map.allLayers.toArray().forEach((layer: any) => {
      if (layer.type == 'imagery' || layer.type == 'map-image') {
        let sublayers = (layer as __esri.MapImageLayer).allSublayers;
        sublayers.forEach((sublayer) => {
          if (sublayer.title == layername && sublayer.id.toString() == id) {
            selLayer = layer;
          }
        });
      }
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
        identifyParams.tolerance = this.tolerance;
        identifyParams.layerIds = that.getLayerIds(layer);
        identifyParams.layerOption = 'visible'; //"top"|"visible"|"all"
        identifyParams.width = that.view.width;
        identifyParams.height = that.view.height;
        identifyParams.geometry = clickpoint;
        identifyParams.returnGeometry = true;
        identifyParams.mapExtent = that.view.extent;

        // 执行查询对象
        identify.execute(identifyParams).then((data: any) => {
          let results = data.results;
          if (results.length < 1) {
            resolve(undefined);
          } else {
            resolve(results[0]);
          }
        });
      });
    });
    return new Promise((resolve) => {
      Promise.all(promises).then((e: any) => {
        resolve(e);
      });
    });
  }
  private async createLayer(view: __esri.MapView, layers: any) {
    type MapModules = [
      typeof import('esri/layers/FeatureLayer'),
      typeof import('esri/layers/GraphicsLayer'),
      typeof import('esri/layers/WebTileLayer'),
      typeof import('esri/layers/MapImageLayer'),
      typeof import('esri/layers/WMSLayer'),
      typeof import('esri/layers/Layer'),
      typeof import('esri/layers/support/LabelClass'),
      typeof import('esri/Color'),
      typeof import('esri/symbols/Font'),
      typeof import('esri/symbols/TextSymbol'),
      typeof import('esri/core/watchUtils')
    ];
    const [
      FeatureLayer,
      GraphicsLayer,
      WebTileLayer,
      MapImageLayer,
      WMSLayer,
      Layer,
      LabelClass,
      Color,
      Font,
      TextSymbol,
      watchUtils
    ] = await (loadModules([
      'esri/layers/FeatureLayer',
      'esri/layers/GraphicsLayer',
      'esri/layers/WebTileLayer',
      'esri/layers/MapImageLayer',
      'esri/layers/WMSLayer',
      'esri/layers/Layer',
      'esri/layers/support/LabelClass',
      'esri/Color',
      'esri/symbols/Font',
      'esri/symbols/TextSymbol',
      'esri/core/watchUtils'
    ]) as Promise<MapModules>);
    let map = view.map;

    map.addMany(
      layers
        .map((layerConfig: any) => {
          let layer: any;
          let type = layerConfig.type.toLowerCase();
          delete layerConfig.type;
          switch (type) {
            case 'feature':
              layer = new FeatureLayer(layerConfig);
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
              layer.label = layerConfig.label;
              if(layerConfig.visible === false){
                    layer.visible = false;
              }
              break;
            case 'chengdi':
              const cd = ChengDiLayer.getInstance(view);
              cd.addChengDiLayer(layerConfig);
              break;
            case 'json':
              const drawlayer = DrawLayer.getInstance(view);
              drawlayer.addDrawLayer(layerConfig);
              break;
            case 'image':
              const heat = ImageOverlays.getInstance(view);
              heat.addImage(layerConfig);
              // const heat = HeatImage2D.getInstance(view);
              // heat.addImage({images: layerConfig, points: []});
              break;
          }
          layerConfig.type = type;
          return layer;
        })
        .filter((layer: any) => {
          return layer !== undefined;
        })
    );

    this.HighlightLayer = new GraphicsLayer();
    this.view.map.add(this.HighlightLayer);
    let _this = this;
    watchUtils.whenNotOnce(this.view, 'updating', (n: any, o: any) => {
      _this.layerLoaded();
    });
  }

  public async showSubwayFlow() {
    const flow = SubwayLine.getInstance(this.view);
    flow.showSubwayFlow();
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
  public async HighFeature(geometry?: any) {
    // const overlay = OverlayArcgis2D.getInstance(this.view);
    // return await overlay.findFeature(params);
    const findfeature = FindFeature.getInstance(this.view);
    findfeature.startHighlightOverlays(geometry);
  }
  public async showTooltip(param:Vue.Component) :Promise<IResult>{
    const tooltip = OverlayArcgis2D.getInstance(this.view);
    return await tooltip.showToolTip(param);
  }
  public closeTooltip() :Promise<IResult>{
    const tooltip = OverlayArcgis2D.getInstance(this.view);
    return tooltip.closeToolTip();
  }
  public async showLayer(params: ILayerConfig) :Promise<IResult>{
    let showResult = false;
    this.view.map.allLayers.forEach((baselayer:any) => {
      if (params.label && baselayer.label === params.label) {
        if (!baselayer.visible && baselayer.isResolved()) {
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
    this.view.map.allLayers.forEach((baselayer:any) => {

      if (params.label && baselayer.label === params.label) {
        if (baselayer.visible && baselayer.isResolved()) {
          baselayer.visible = false;
          hideResult = true;
        }
      }
    });

    return {
      status:0,
      message:'ok',
      result:hideResult ? `成功隐藏${params.label}图层` : '未找到该图层或该图层已处于隐藏状态'
    }
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
  // public async startDrawOverlays(params: IDrawOverlayParameter):Promise<IResult>{
  //   const drawOverlay = Draw2D.getInstance(this.view);
  //   return await drawOverlay.startDrawOverlays(params);
  // }
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
  public async showSubwayMigrateChart(params: any) {
    const chart = MigrateChart.getInstance(this.view);
    chart.showSubwayChart(params);
  }
  public showMigrateChart(params: any) {
    const chart = MigrateChart.getInstance(this.view);
    chart.showPathChart(params);
  }
  public hideMigrateChart() {
    const chart = MigrateChart.getInstance(this.view);
    chart.hideMigrateChart();
  }
  public showBarChart(params: any) {
    const chart = Bar3DChart.getInstance(this.view);
    chart.showBarChart(params);
  }
  public hideBarChart() {
    const chart = Bar3DChart.getInstance(this.view);
    chart.hideBarChart();
  }
  public addHeatImage2D(params: IHeatImageParameter) {
    const heat = HeatImageGL.getInstance(this.view);
    heat.addHeatImage(params);
  }
  public deleteHeatImage() {
    const heat = HeatImageGL.getInstance(this.view);
    heat.deleteHeatImage();
  }
  public async startGeometrySearch(
    params: IGeometrySearchParameter
  ): Promise<IResult> {
    let geometrySearch = GeometrySearch.getInstance(this.view);
    return await geometrySearch.startGeometrySearch(params);
  }
  public clearGeometrySearch() {
    let geometrySearch = GeometrySearch.getInstance(this.view);
    geometrySearch.clearGeometrySearch();
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

  public async createLineFence(param:IElectronicFenceParameter):Promise<IResult> {
    const electronicFence = ElectronicFence.getInstance(this.view);
    return await electronicFence.createLineFence(param);
  }

  public async createElectFenceByEndPtsConnection(param:IElectronicFenceParameter):Promise<IResult> {
    const electronicFence = ElectronicFence.getInstance(this.view);
    return await electronicFence.createElectFenceByEndPtsConnection(param);
  }

  public async showEditingLabel(param:IEditFenceLabel):Promise<IResult> {
    const electronicFence = ElectronicFence.getInstance(this.view);
    return await electronicFence.showEditingLabel(param);
  }
    public async arcgisLoadGDLayer(){
        const gdLayer = LayerOperationArcGIS.getInstance(this.view);
        await gdLayer.arcgisLoadGDLayer();
    }
  public async addDgeneFusion(params: any): Promise<IResult> {
    const dgene = DgeneFusion.getInstance(this.view);
    return await dgene.addDgeneFusion(params);
  }
  public async restoreDegeneFsion(): Promise<IResult> {
    const dgene = DgeneFusion.getInstance(this.view);
    return await dgene.restoreDegeneFsion();
  }
  public async showDgene(params: any): Promise<IResult> {
    let dgene = DgeneFusion.getInstance(this.view);
    return await dgene.showDgene(params);
  }
  public hideDgene() {
    let dgene = DgeneFusion.getInstance(this.view);
    dgene.hideDgene();
  }
  public showCustomTip(params: ICustomTip) {
    let className: string = 'custom-popup';
    if (params == undefined || (params && params.clear !== false)) {
      ToolTip.clear(this.view, undefined, className);
    }
    if (params && params.geometry) {
      params.prop.className = className;
      let ctip = new ToolTip(this.view, params.prop, params.geometry);
    }
  }
  public showDgeneOutPoint(params: any) {
    let dgene = DgeneFusion.getInstance(this.view);
    dgene.showDgeneOutPoint(params);
  }
  public changeDgeneOut() {
    let dgene = DgeneFusion.getInstance(this.view);
    dgene.changeDgeneOut();
  }

  /** 初始化特勤线路基础数据，并进入路段选择状态 */
  public async initializeRouteData(params: ISelectRouteParam) {
    const selectRoute = SelectRoute2D.getInstance(this.view);
    selectRoute.selectRouteFinished = this.selectRouteFinished;
    await selectRoute.initializeRoute(params);
  }

  public async showSelectedRoute(params: ISelectRouteResult) {
    const selectRoute = SelectRoute2D.getInstance(this.view);
    await selectRoute.showSelectedRoute(params);
  }

  public async playSelectedRoute(speed: number) {
    const selectRoute = SelectRoute2D.getInstance(this.view);
    selectRoute.intoSignal = this.intoSignal;
    selectRoute.outofSignal = this.outofSignal;
    await selectRoute.playSelectedRoute(speed);
  }

  public stopPlaySelectedRoute() {
    const selectRoute = SelectRoute2D.getInstance(this.view);
    selectRoute.stopPlaySelectedRoute();
  }

  public async routeHitArea(params: ISelectRouteHitTest): Promise<IResult> {
    const selectRoute = SelectRoute2D.getInstance(this.view);
    return await selectRoute.routeHitArea(params);
  }

  public async areaHitRoute(params: ISelectRouteHitTest) {
    const selectRoute = SelectRoute2D.getInstance(this.view);
    return await selectRoute.areaHitRoute(params);
  }

  public async startDrawOverlays(params: IDrawOverlays): Promise<void> {
    const drawoverlay = DrawOverlays.getInstance(this.view);
    return await drawoverlay.startDrawOverlays(params);
  }
  public async stopDrawOverlays(): Promise<IResult> {
    const drawoverlay = DrawOverlays.getInstance(this.view);
    return await drawoverlay.stopDrawOverlays();
  }
  public async deleteDrawOverlays(params: IOverlayDelete): Promise<void> {
    const drawoverlay = DrawOverlays.getInstance(this.view);
    return await drawoverlay.deleteDrawOverlays(params);
  }
  public async getDrawOverlays(): Promise<IResult> {
    const drawoverlay = DrawOverlays.getInstance(this.view);
    return await drawoverlay.getDrawOverlays();
  }
  public async hideOverlays(params:IDrawOverlayParameter):Promise<any> {}
  public async showOverlays(params:IDrawOverlayParameter):Promise<any> {}
  public async findOverlays(params:IFindParameter):Promise<any> {}
  public async backgroundGeometrySearch(params:IGeometrySearchParameter): Promise<IResult> {
    return {message:'',status:0}
  }
  public async polylineRanging(params:IPolylineRangingParameter): Promise<any>{}
  public async changePicById(params:IPicChangeParameter): Promise<any> {}
  public async startLayerSearch(
    params: IGeometrySearchParameter
  ): Promise<IResult> {
    const layersearch = LayerSearch.getInstance(this.view);
    return await layersearch.startLayerSearch(params);
  }
  public async startLayerDefinition(
    params: IDefinitionParameter
  ): Promise<void> {
    const definition = LayerDefinition.getInstance(this.view);
    return await definition.startLayerDefinition(params);
  }
  public async startTrackPlay(params: ITrackParameter): Promise<void> {}
  public async searchPOI(params:IPOISearch): Promise<any> {}
  public async searchBoundary(params:IBoundary): Promise<any> {}
  public async searchRoadNetwork(params:IRoadNetwork): Promise<any> {}
  public async clearPOIResults(params:IPOIDelete): Promise<any> {}
  public async closeAllTooltips():Promise<any> {}
  public async closeTooltips():Promise<any> {}
  public async searchMultiBoundary(params:IMultiBoundary):Promise<any> {}
}
