import {
  IOverlayParameter,
  IPointSymbol,
  IPolylineSymbol,
  IResult,
  IPopUpTemplate,
  IOverlayClusterParameter,
  IOverlayDelete,
  IFindParameter,
  IPicChangeParameter
} from '@/types/map';
import TooltipPGIS from "@/plugin/gis-viewer/widgets/Overlays/pgis-ls/TooltipPGIS";
import {loadModules} from "esri-loader";

declare let ol:any;
declare let FMap: any;

export default class OverlayPGIS {
  private static intances: Map<string, any>;

  private view!: any;
  private overlays = new Array();

  private tooltip:any;
  private popupTypes: Map<string, any> = new Map<string, any>();
  private tooltipTypes:Map<string, any> = new Map<string, any>();

  private popup:any;

  private layerGroups: Map<string, any> = new Map<     //所有覆盖物的图层组
      string,
      any
      >();
  private overlayLayer!: any;                          //一次添加覆盖物的图层组

  private constructor(view: any) {
    this.view = view;
  }

  public static getInstance(view: any) {
    let id = view.getTarget();
    if (!OverlayPGIS.intances) {
      OverlayPGIS.intances = new Map();
    }
    let intance = OverlayPGIS.intances.get(id);
    if (!intance) {
      intance = new OverlayPGIS(view);
      OverlayPGIS.intances.set(id, intance);
    }
    return intance;
  }
  private async getOverlayLayer(type: string) {
    let group = this.layerGroups.get(type);
    if (!group) {
      group = await this.createOverlayLayer(type);
    }
    return group;
  }
  //一次性添加的覆盖物创建一个vectorLayer
  private async createOverlayLayer(type: string): Promise<any> {
    const vectorLayer = new ol.layer.Vector({
      source:new ol.source.Vector({}),
      style:new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'rgba(37,122,251,0.5)',
        }),
        stroke: new ol.style.Stroke({
          color: 'rgb(126,251,37)'
        }),
        image: new ol.style.Circle({
          radius: 7,
          fill: new ol.style.Fill({
            color: '#c00000'
          })
        })

      })
    });
    this.view.addLayer(vectorLayer)
    this.layerGroups.set(type, vectorLayer);
    return vectorLayer;
  }
  public async addOverlays(params: IOverlayParameter): Promise<IResult> {
    const defaultSymbol = params.defaultSymbol;
    const defaultType = params.type || "overlays";
    const defaultButtons = params.defaultButtons;
    //默认弹窗样式
    const defaultInfoTemplate = params.defaultInfoTemplate;
    //自定义vue弹窗样式
    /************auto/move/show-popup/tooltip*****************/
    const showPopup = params.showPopup;
    const showTooltip = params.showTooltip;
    const moveTooltip = params.moveTooltip;
    const movePopup = params.movePopup;
    const autoPopup = params.autoPopup;
    const autoTooltip = params.autoTooltip;

    const tooltipComponent = params.tooltipComponent;
    const popupComponent = params.popupComponent;

    const popupAndTooltip = {
      showPopup,
      showTooltip,
      moveTooltip,
      movePopup,
      autoPopup,
      autoTooltip
    };

    const componentsObj = {
      tooltipComponent,
      popupComponent
    }

    let addCount = 0;
    if(!params.overlays.length){
      return {
        status: 0,
        message: '无覆盖物参数输入！',
      }
    }

    const overlayLayer = await this.createOverlayLayer(defaultType);
    for(let overlayObj of params.overlays){
      const overlaySymbol = overlayObj.symbol || defaultSymbol || {};
      overlaySymbol.type = overlaySymbol.type ? overlaySymbol.type :
          defaultSymbol && defaultSymbol.type ? defaultSymbol.type :
              "unknown" ;
      const style = this.getStyle(overlaySymbol);
      const overlayGeo = overlayObj.geometry;
      const feature = this.getFeature(overlaySymbol.type,overlayGeo)
      feature.setStyle(style);
      overlayLayer.getSource().addFeature(feature);
    }
    return {
      status: 0,
      message: 'ok',
      result: `成功添加${params.overlays.length}中的${addCount}个覆盖物`
    };
  }

  private getGeometry(params:any): any {

  }

  private getStyle(params:any): any {
    const symbol = params;
    let vectorStyle:any = null;
    switch (symbol.type) {
      case "point":
        if(symbol.primitive){
          const radius = symbol.size || 5;
          const color = symbol.color || '#c0ad00';
          vectorStyle = new ol.style.Circle({
            radius: radius,
            fill: new ol.style.Fill({
              color: color
            })
          })
        }else {
          const src = symbol.url;
          const size:any = symbol.size || []
          const offset:any = [symbol.xoffset,symbol.yoffset] || []
          if(!src || typeof src !== "string"){
            return {
              status:0,
              message:"点url属性错误！"
            }
          }
          vectorStyle = new ol.style.Style({
            image: new ol.style.Icon({
              src:src,
              // size:size.length ? size : null,
              // offset:offset.length ? offset : [0,0]
            })
          })
          console.log(vectorStyle);
          if(size.length){
            let imgSize = vectorStyle.getImage().getImageSize();
            imgSize = size;
          }
          if(offset.length){
            vectorStyle.getImage().offset = offset;
          }
        }
        break;
      case "polyline":
        const color = symbol.color;
        const width = symbol.width;
        vectorStyle = new ol.style.Stroke({
          color: 'rgb(126,251,37)',
          width: 2
        })
        if(color){
          vectorStyle.setColor(color);
        }
        if(width){
          vectorStyle.setWidth(width);
        }
        break;
      case "polygon":
        const polygonColor = symbol.color;
        const outline = symbol.outline;
        vectorStyle = new ol.style.Stroke();
        if(outline && outline.color){
          vectorStyle.setColor(outline.color);
        }
        if(outline && outline.width){
          vectorStyle.setWidth(outline.width);
        }
        if(polygonColor){
          vectorStyle = new ol.style.Fill({
            color: polygonColor
          })
        }

        break;
      default:
        break;
    }
    return vectorStyle;
  }


  private getFeature(geoType:any,params:any): any {
    const feature = new ol.Feature();
    const geometry = params;
    if(geoType === "point"){
      const geom = new ol.geom.Point([geometry.x,geometry.y])
      feature.setGeometry(geom);
    }else if(geoType === "polyline"){
      const geom = new ol.geom.LineString(geometry.paths)
      feature.setGeometry(geom);
    }else if(geoType === "polygon"){
      const geom = new ol.geom.Polygon([geometry.rings])
      feature.setGeometry(geom);
    }else {
      console.error('请检查输入的symbol或defaultSymbol是否正确!')
      return false
    }
    return feature;
  }

  private getSource(params:any): any {

  }
}