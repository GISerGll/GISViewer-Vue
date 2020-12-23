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
import {loadModules} from "esri-loader";
import TooltipPGIS from "@/plugin/gis-viewer/widgets/Overlays/pgis-ls/TooltipPGIS";
import {Vue} from "vue-property-decorator";

declare let ol:any;
declare let FMap: any;

export default class OverlayPGIS {
  private static intances: Map<string, any>;

  private view!: any;
  private fmap!: any;
  private overlays = new Array();
  //控制showPopup,showTooltip单个弹窗
  private popup:any;
  private tooltip:any;
  //控制有autoTooltip,autoPopup多个弹窗
  private popupTypes: Map<string, TooltipPGIS[]> = new Map<string, TooltipPGIS[]>();
  private tooltipTypes:Map<string, TooltipPGIS[]> = new Map<string, TooltipPGIS[]>();
  private tooltips:TooltipPGIS[] = []


  private layerGroups: Map<string, any> = new Map<     //所有覆盖物的图层组
      string,
      any
      >();
  private overlayLayers: any[] = [];                          //一次添加覆盖物的图层组
  public static hlFeatures:boolean;


  private constructor(view: any,fmap: any) {
    this.view = view;
    this.fmap = fmap;
  }

  public static getInstance(view: any,fmap: any) {
    let id = view.getTarget();
    if (!OverlayPGIS.intances) {
      OverlayPGIS.intances = new Map();
    }
    let intance = OverlayPGIS.intances.get(id);
    if (!intance) {
      intance = new OverlayPGIS(view,fmap);
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
    //存储原始矢量点、线、面
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
    vectorLayer.title = "addOverlays_layer";
    this.overlayLayers.push(vectorLayer);     //获取当前加点后的图层
    this.view.addLayer(vectorLayer)
    this.layerGroups.set(type, vectorLayer);
    if(OverlayPGIS.hlFeatures){
      await this.highlightFeatures();
    }

    return vectorLayer;
  }

  public async addOverlays(params: IOverlayParameter): Promise<IResult> {
    const defaultSymbol = params.defaultSymbol;
    const defaultType = params.type || params.overlays[0].type || "overlays";
    const defaultButtons = params.defaultButtons;
    const centerResult = params.centerResult || true;
    const defaultZoom = params.defaultZoom || 14;
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
    const features:any[] = []
    for(let overlayObj of params.overlays){
      const overlaySymbol = overlayObj.symbol || defaultSymbol || {};
      overlaySymbol.type = overlaySymbol.type ? overlaySymbol.type :
          defaultSymbol && defaultSymbol.type ? defaultSymbol.type :
              "unknown" ;
      const style = this.getStyle(overlaySymbol);
      if(!style){
        break;
      }
      const overlayGeo = overlayObj.geometry;
      const feature = this.getFeature(overlaySymbol.type,overlayGeo)
      feature.setStyle(style);

      feature.attributes = overlayObj.fields || {};
      feature.buttons = overlayObj.buttons || defaultButtons;
      feature.id = overlayObj.id;
      feature.type = overlayObj.type || defaultType;

      features.push(feature);
      overlayLayer.getSource().addFeature(feature);
      addCount++;

      if(params.overlays.length === 1 && centerResult){
        this.view.getView().fit(feature.getGeometry(),{
          duration:1000,
        });
      }
    }
    //处理弹窗逻辑,弹窗优先级popup->tooltip,动作优先级show->move->auto
    //冲突关系：同类冲突，例如autpPopup和movePopup冲突，autoTooltip和moveTooltip冲突
    //示意：假如同时存在autoPopup和showPopup为true，认为两者冲突，则autoPopup为false
    if(!defaultInfoTemplate){
      await this.processPopupAndTooltip(features,popupAndTooltip,componentsObj);
    }
    return {
      status: 0,
      message: 'ok',
      result: `成功添加${params.overlays.length}中的${addCount}个覆盖物`
    };
  }

  private getStyle(params:any): any {
    const symbol = params;
    let vectorStyle:any = null;
    switch (symbol.type) {
      case "point":
        if(symbol.primitive){
          const radius = symbol.size || 5;
          const color = symbol.color || '#c0ad00';
          vectorStyle = new ol.style.Style({
            image:new ol.style.Circle({
              radius: radius,
              fill: new ol.style.Fill({
                color: color
              })
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
          const img = new ol.style.Icon({
            src:src
          })
          vectorStyle = new ol.style.Style({})
          if(size.length && typeof size[0] === "number"){
            let picSize = img.getSize();
            picSize = size;
            vectorStyle.setImage(img);
          }
          if(offset.length && typeof offset[0] === "number"){
            img.offset = offset;
            vectorStyle.setImage(img);
          }
        }
        break;
      case "polyline":
        const color = symbol.color;
        const width = symbol.width;
        const plStroke = new ol.style.Stroke({
          color:'rgb(0,253,50)',
          width:5
        });
        vectorStyle = new ol.style.Style({
          stroke: new ol.style.Stroke({
            color:'rgb(0,253,50)',
            width:5
          }),
        })
        if(color){
          plStroke.setColor(color);
          vectorStyle.setStroke(plStroke);
        }
        if(width){
          plStroke.setWidth(width);
          vectorStyle.setStroke(plStroke);
        }
        break;
      case "polygon":
        const polygonColor = symbol.color;
        const outline = symbol.outline;
        vectorStyle = new ol.style.Style({});
        const olStroke = new ol.style.Stroke({
          color:'rgb(0,0,0)',
          width:0.1
        });
        const fill = new ol.style.Fill({
          color: 'rgba(0,208,254,0.5)'
        });
        if(outline && outline.color){
          olStroke.setColor(outline.color);
          vectorStyle.setStroke(olStroke);
        }
        if(outline && outline.width){
          olStroke.setWidth(outline.width);
          vectorStyle.setStroke(olStroke);
        }
        if(polygonColor){
          fill.setColor(polygonColor);
          vectorStyle.setFill(fill);
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

  private async listenOverlayClick(popupType:string,popup:Vue.Component,overlays:any[]):Promise<IResult>{
    if(!popupType){
      return {
        status:0,
        message:'error!please input type of popup/tooltip',
      }
    }
    if(!popup){
      return {
        status:0,
        message:'error!please input vue popup/tooltip component',
      }
    }

    switch (popupType) {
      case "showPopup":
        const select=new ol.interaction.Select({
          layers:this.overlayLayers,
        });
        select.on("select",async (e:any) => {
          const features=e.selected;
          const feature=features[0];

          const picSize = feature.getStyle().getImage().getSize();
          const geometryType=feature.getGeometry().getType();
          if(geometryType === "Point"){
            const fields = feature.attributes;
            if(!fields){
              return;
            }
            const content = fields.popupWindow;
            const center = feature.getGeometry().getCoordinates();
            if (this.popup) {
              this.popup.remove();
              this.popup = null;
            }
            if(content.hasOwnProperty('valuePromise')){
              content.valuePromise = await content.valuePromise;
            }

            const tooltipObj = {
              view: this.view,
              component:popup,
              props:content,
              position:center,
              picSize:picSize
            }
            this.popup = new TooltipPGIS(tooltipObj);
          }

        });
        this.view.addInteraction(select);
        break;
      case "showTooltip":
        // overlays.forEach((ptOverlay:any) => {
        //   ptOverlay.addEventListener('click',async (e:any) => {
        //     let fields = e.target.attributes;
        //     let content = null;
        //     if(!fields){
        //       return ;
        //     }
        //     content = fields.tooltipWindow;
        //     let center = e.target.getPosition();
        //
        //     if (this.tooltip) {
        //       this.tooltip.remove();
        //       this.tooltip = null;
        //     }
        //     if(content.hasOwnProperty('valuePromise')){
        //       content.valuePromise = await content.valuePromise;
        //     }
        //     this.tooltip = new TooltipPGIS(
        //         this.view,
        //         popup,
        //         content,
        //         center
        //     );
        //   })
        // });
        break;
      default:
        break;
    }

    return {
      status:0,
      message:'成功调用该方法！'
    }

  }

  private async listenOverlayMouseOver(popupType:string,popup:Vue.Component,overlays:any[]):Promise<any>{
    if(!popupType){
      return {
        status:0,
        message:'error!please input type of popup/tooltip',
      }
    }
    if(!popup){
      return {
        status:0,
        message:'error!please input vue popup/tooltip component',
      }
    }

    switch (popupType) {
      case "movePopup":
        // overlays.forEach((ptOverlay:any) =>{
        //   ptOverlay.addEventListener('mouseover',async (e:any) => {
        //     let fields = e.target.attributes;
        //     let content = null;
        //     if(!fields){
        //       return ;
        //     }
        //     content = fields.popupWindow;
        //     let center = e.target.getPosition();
        //
        //     if (this.popup) {
        //       this.popup.remove();
        //       this.popup = null;
        //     }
        //     if(content.hasOwnProperty('valuePromise')){
        //       content.valuePromise = await content.valuePromise;
        //     }
        //     this.popup = new TooltipPGIS(
        //         this.view,
        //         popup,
        //         content,
        //         center
        //     );
        //   })
        //
        //   ptOverlay.addEventListener('mouseout',async (e:any) => {
        //     if (this.popup) {
        //       this.popup.remove();
        //       this.popup = null;
        //     }
        //   })
        // });
        // this.view.addEventListener('mousemove',async (e:any)=>{
        //   if(e.overlay && e.overlay.attributes && e.overlay.attributes.popupWindow){
        //     let overlay = e.overlay;
        //     let content = overlay.attributes.popupWindow;
        //     let center = e.overlay.getPosition();
        //
        //     if (this.popup) {
        //       this.popup.remove();
        //       this.popup = null;
        //     }
        //     if(content.hasOwnProperty('valuePromise')){
        //       content.valuePromise = await content.valuePromise;
        //     }
        //     this.popup = new TooltipPGIS(
        //         this.view,
        //         popup,
        //         content,
        //         center
        //     );
        //   }else{
        //     if (this.popup) {
        //       this.popup.remove();
        //       this.popup = null;
        //     }
        //   }
        // });
        break;
      case "moveTooltip":
        // overlays.forEach((ptOverlay:any) =>{
        //   ptOverlay.addEventListener('mouseover',async (e:any) => {
        //     let fields = e.target.attributes;
        //     let content = null;
        //     if(!fields){
        //       return ;
        //     }
        //     content = fields.tooltipWindow;
        //     let center = e.target.getPosition();
        //
        //     if (this.tooltip) {
        //       this.tooltip.remove();
        //       this.tooltip = null;
        //     }
        //     if(content.hasOwnProperty('valuePromise')){
        //       content.valuePromise = await content.valuePromise;
        //     }
        //     this.tooltip = new TooltipPGIS(
        //         this.view,
        //         popup,
        //         content,
        //         center
        //     );
        //   })

        //   ptOverlay.addEventListener('mouseout',async (e:any) => {
        //     if (this.tooltip) {
        //       this.tooltip.remove();
        //       this.tooltip = null;
        //     }
        //   })
        // });

        // this.view.addEventListener('mousemove',async (e:any)=>{
        //   if(e.overlay && e.overlay.attributes && e.overlay.attributes.tooltipWindow){
        //     let overlay = e.overlay;
        //     let content = overlay.attributes.tooltipWindow;
        //     let center = e.overlay.getPosition();
        //
        //     if (this.tooltip) {
        //       this.tooltip.remove();
        //       this.tooltip = null;
        //     }
        //     if(content.hasOwnProperty('valuePromise')){
        //       content.valuePromise = await content.valuePromise;
        //     }
        //
        //     this.tooltip = new TooltipPGIS(
        //         this.view,
        //         popup,
        //         content,
        //         center
        //     );
        //   }else{
        //     if (this.tooltip) {
        //       this.tooltip.remove();
        //       this.tooltip = null;
        //     }
        //   }
        // });
        break;
      default:
        break;
    }
  }

  public async showTooltip(tooltip:Vue.Component):Promise<IResult>{
    if(!tooltip && this.tooltip){
      await this.closeTooltip();
    }
    let overlays:any = this.view.getOverlays();

    // overlays.forEach((ptOverlay:any) => {
    //   ptOverlay.addEventListener('click',async (e:any) => {
    //     let fields = e.target.attributes;
    //     let center = e.target.getPosition();
    //     let infoWindow;
    //
    //     if(fields){
    //       infoWindow = fields.infoWindow;
    //     }
    //     if(infoWindow){
    //       if (this.tooltip) {
    //         this.tooltip.remove();
    //         this.tooltip = null;
    //       }
    //       this.tooltip = new TooltipPGIS(
    //           this.view,
    //           tooltip,
    //           infoWindow,
    //           center
    //       );
    //     }
    //   })
    // })
    return {
      status:0,
      message:'ok',
      result:'成功调用方法，但无法保证可以正确显示弹窗'
    }
  }

  public async closeTooltip():Promise<IResult>{
    let close = false;
    if(this.tooltip){
      this.tooltip.remove();
      this.tooltip = null;
      close = true;
    }

    if(this.popup){
      this.popup.remove();
      this.popup = null;
      close = true
    }

    return {
      status:0,
      message:'ok',
      result:close ? '成功关闭VUE弹窗': '未存在VUE弹窗'
    }
  }

  public async closeTooltips(params:IOverlayDelete):Promise<IResult>{
    const tooltips = this.view.getOverlays();
    return {
      status:0,
      message:'not complete'
    }
  }

  public async closeAllTooltips(): Promise<IResult>{
    await this.closeTooltip();
    if(this.tooltips.length){
      this.tooltips.forEach(tooltip => {
        tooltip.remove();
      })
    }
    if(this.tooltipTypes.size){
      this.tooltipTypes.forEach(tooltips => {
        tooltips.forEach(tooltip => {
          tooltip.remove();
        })
      })
      this.tooltipTypes.clear();
    }
    if(this.popupTypes.size){
      this.popupTypes.forEach(popups => {
        popups.forEach(popup => {
          popup.remove();
        })
      })
      this.popupTypes.clear();
    }

    return {
      status:0,
      message:'成功调用该方法',
    }
  }

  private async autoPopup(popup:Vue.Component,type?:string) :Promise<IResult>{
    if(!this.overlays.length){
      return {
        status:0,
        message:'there is no overlays,add first!'
      }
    }

    let popupCount = 0;
    let popups:TooltipPGIS[] = [];

    if(type && (typeof type === 'string')){               //有type情况
      let popupOfType:TooltipPGIS[] | undefined = this.popupTypes.get(type);   //首先检查该图层是否已经显示Popup
      if(popupOfType){
        this.popupTypes.delete(type);   //如果存在改类型的弹窗，则遍历数组，删除所有改类弹窗
        for(let popup of popupOfType){
          popup.remove();
        }
      }

      for(const overlay of this.overlays){
        if(overlay.type !== type){
          continue;
        }

        let content = overlay.attributes.popupWindow;
        if(!content){
          continue;
        }

        let center =  overlay.getPosition();
        if(content.hasOwnProperty('valuePromise')){
          content.valuePromise = await content.valuePromise;
        }

        // let _popup = new TooltipPGIS(
        //     this.view,
        //     popup,
        //     content,
        //     center
        // );
        // popups.push(_popup);
        popupCount++;
      }
      this.popupTypes.set(type,popups);

      return {
        status:0,
        message:`finish autoPopup`,
        result:`the layer of ${type} with ${popupCount}popups!`
      }
    }else {
      for(const overlay of this.overlays){
        let content = overlay.attributes.popupWindow;
        if(!content){
          continue;
        }

        let center = overlay.getPosition();
        if(content.hasOwnProperty('valuePromise')){
          content.valuePromise = await content.valuePromise;
        }
        // let _popup = new TooltipPGIS(
        //     this.view,
        //     popup,
        //     content,
        //     center
        // );
        // popups.push(_popup);
        popupCount++;
      }

      return {
        status:0,
        message:`finish autoPopup`,
        result:`add the number of${popupCount}popups!`
      }
    }
  }

  private async autoTooltip(tooltip:Vue.Component,overlays:any[]){
    debugger;
    if(!overlays.length){
      return {
        status:0,
        message:'there is no overlays,add first!'
      }
    }

    let tooltipCount = 0;
    let tooltips:TooltipPGIS[] = [];

    const type = overlays[0].type
    if(type && (typeof type === 'string')){
      let tooltipOfType:TooltipPGIS[] | undefined = this.tooltipTypes.get(type);   //首先检查该图层是否已经显示Popup
      if(tooltipOfType){
        this.tooltipTypes.delete(type);   //如果存在改类型的弹窗，则遍历数组，删除所有改类弹窗
        for(let popup of tooltipOfType){
          popup.remove();
        }
      }

      for(const overlay of overlays){
        if(overlay.type !== type){
          continue;
        }

        let content = overlay.attributes.tooltipWindow;
        if(!content){
          continue;
        }

        const center = overlay.getGeometry().getCoordinates();
        let popup_:any;
        //等待数据准备完毕后再渲染弹窗
        if(content.hasOwnProperty('valuePromise')){
          content.valuePromise.then(() => {
            popup_ = new TooltipPGIS({
              view: this.view,
              component:tooltip,
              props:content,
              position:center,
            });
          })
        }else {
          popup_ = new TooltipPGIS({
            view: this.view,
            component:tooltip,
            props:content,
            position:center,
          });
        }
        tooltips.push(popup_);
        tooltipCount++;
      }
      this.popupTypes.set(type,tooltips);

      return {
        status:0,
        message:`finish autoPopup`,
        result:`the layer of ${type} with ${tooltipCount}popups!`
      }
    }else {
      for(const overlay of overlays){
        let content = overlay.attributes.popupWindow;
        if(!content){
          continue;
        }

        let center =  overlay.getPosition();
        let popup_:any;
        //等待数据准备完毕后再渲染弹窗
        if(content.hasOwnProperty('valuePromise')){
          content.valuePromise.then(() => {
            popup_ = new TooltipPGIS({
              view: this.view,
              component:tooltip,
              props:content,
              position:center,
            });
          })
        }else {
          popup_ = new TooltipPGIS({
            view: this.view,
            component:tooltip,
            props:content,
            position:center,
          });
        }
        this.tooltips.push(popup_);
        tooltipCount++;
      }

      return {
        status:0,
        message:`finish autoPopup`,
        result:`add the number of${tooltipCount}popups!`
      }
    }
  }

  private async processPopupAndTooltip(overlays:any[],popAndTip:any,componentsObj:any){
    let showPopup = popAndTip.showPopup;
    let showTooltip = popAndTip.showTooltip;
    let moveTooltip = popAndTip.moveTooltip;
    let movePopup = popAndTip.movePopup;
    let autoPopup = popAndTip.autoPopup;
    let autoTooltip = popAndTip.autoTooltip;

    const tooltipComponent = componentsObj.tooltipComponent;
    const popupComponent = componentsObj.popupComponent;

    if(showPopup){
      autoPopup = false;
      movePopup = false;
    }else if(movePopup){
      autoPopup = false;
    }else {
      if(autoPopup){
        console.log('autoPopup')
      }
    }

    if(showTooltip){
      autoTooltip = false;
      moveTooltip = false;
    }else if(moveTooltip){
      autoTooltip = false;
    }else {
      if(autoTooltip){
        console.log('autoTooltip')
      }
    }

    if(showPopup && popupComponent){
      await this.listenOverlayClick('showPopup',popupComponent,overlays);
    }else if(movePopup && popupComponent){
      await this.listenOverlayMouseOver('movePopup',popupComponent,overlays);
    }else if(autoPopup && popupComponent){
      await this.autoPopup(popupComponent);
    }else {
      console.log('no overlays popup');
    }

    if(showTooltip && tooltipComponent){
      await this.listenOverlayClick('showTooltip',tooltipComponent,overlays)
    }else if(moveTooltip && tooltipComponent){
      await this.listenOverlayMouseOver('moveTooltip',tooltipComponent,overlays)
    }else if(autoTooltip && tooltipComponent){
      await this.autoTooltip(tooltipComponent,overlays);
    }
  }

  private async styleFunction(feature:any,isSelect:boolean) {
    const geometry = feature.getGeometry();
    const geometryType = geometry.getType();
    if(geometryType === "Point"){
      const event = geometry.getExtent();
      console.log(event);
    }
    return  new ol.style.Style({
      fill: new ol.style.Fill({ //矢量图层填充颜色，以及透明度
        color:'rgba(201,253,1,0.8)'
      }),
      stroke: new ol.style.Stroke({ //边界样式
        color: '#319FD3',
        width: 1
      }),
    });
  }

  public async highlightFeatures():Promise<any> {
    const select=new ol.interaction.Select({
      layers:this.overlayLayers,
    });
    select.on("select",async (e:any) => {
      const features=e.selected;
      const feature=features[0];
      const geometryType=feature.getGeometry().getType();
      if(geometryType === "Point"){
        const curStyle = feature.getStyle();
        const noStyle = new ol.style.Style({
          image:new ol.style.Circle({
            radius: 5,
            fill: new ol.style.Fill({
              color: 'rgba(0,0,0,0)'
            })
          })
        })

        feature.setStyle(noStyle);
        for(let i=0;i<3;i++){
          await sleep(250);
          feature.setStyle(curStyle);
          await sleep(250);
          feature.setStyle(noStyle);
        }
        feature.setStyle(curStyle);
      }
    });
    this.view.addInteraction(select);

    function sleep(params:number) {
      let promise = new Promise(resolve => {
        setTimeout(()=>{
          resolve();
        },params)
      })

      return promise;
    }
  }
}