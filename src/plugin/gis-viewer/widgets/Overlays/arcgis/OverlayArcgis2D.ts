import {
  IOverlayParameter,
  IPointSymbol,
  IResult,
  IOverlayDelete,
  IFindParameter,
  IPolylineSymbol,
  IPolygonSymbol
} from '@/types/map';
import {loadModules} from 'esri-loader';
import ToolTip2D from './ToolTip2D';
import ToolTip from './ToolTip';
import HighFeauture from './HighFeauture3D';
import HighFeauture2D from './HighFeauture2D';
import {Vue} from 'vue-property-decorator';
import {type} from 'jquery';
import {Utils} from '@/plugin/gis-viewer/Utils';

export class OverlayArcgis2D {
  private static intances: Map<string, any>;

  private overlayGroups: Map<string, __esri.GraphicsLayer> = new Map<
    string,
    __esri.GraphicsLayer
  >();
  private overlayLayer!: __esri.GraphicsLayer;
  private view!: __esri.MapView;
  private tooltip:any;
  private popupTypes: Map<string, any> = new Map<string, any>();
    private tooltipTypes:Map<string, any> = new Map<string, any>();
  private popup:any;

  private static primitive2D = [
    'circle',
    'cross',
    'diamond',
    'square',
    'triangle',
    'x'
  ];

  private constructor(view: __esri.MapView) {
    this.view = view;
  }

  public static getInstance(view: __esri.MapView) {
    let id = view.container.id;
    //init instance
    if (!OverlayArcgis2D.intances) {
      OverlayArcgis2D.intances = new Map();
    }
    let instance = OverlayArcgis2D.intances.get(id);
    if (!instance) {
      instance = new OverlayArcgis2D(view);
      OverlayArcgis2D.intances.set(id, instance);
    }
    return instance;
  }
  public static destroy() {
    (OverlayArcgis2D.intances as any) = null;
  }
  private async getOverlayLayer(type: string) {
    let group = this.overlayGroups.get(type);
    if (!group) {
      group = await this.createOverlayLayer(type);
    }
    return group;
  }
  private async createOverlayLayer(
    type: string
  ): Promise<__esri.GraphicsLayer> {
    type MapModules = [typeof import('esri/layers/GraphicsLayer')];
    const [GraphicsLayer] = await (loadModules([
      'esri/layers/GraphicsLayer'
    ]) as Promise<MapModules>);
    let overlayLayer: __esri.GraphicsLayer = new GraphicsLayer();
    this.view.map.add(overlayLayer);
    this.overlayGroups.set(type, overlayLayer);
    return overlayLayer;
  }

  public static makeSymbol(symbol: any): Object | undefined {
    if(!symbol) return undefined;
    if(symbol.type.toLowerCase() === "point-2d"){
      return this.makeMarkerSymbol(symbol);
    }else if(symbol.type.toLowerCase() === "line-2d"){
      return this.makePolylineSymbol(symbol);
    }else if(symbol.type.toLowerCase() === "polygon-2d"){
      return this.makePolygonSymbol(symbol);
    }else {
      return undefined;
    }
  }

  private MoveToolTip(type: string, content: string) {
        const view = this.view;
        const moveLayer = this.overlayGroups.get(type);
        let parent = this;
        let tip!: any;
        view.on('pointer-move', function(event) {
            view.hitTest(event).then((response) => {
                if (response.results.length > 0) {
                    response.results.forEach((result) => {
                        if (result.graphic.layer === moveLayer) {
                            if (!tip) {
                                tip = new ToolTip(
                                    view,
                                    {
                                        title: '',
                                        content: parent.getToolTipContent(result.graphic, content)
                                    },
                                    result.graphic
                                );
                            }
                        }
                    });
                } else {
                    if (tip) {
                        tip.remove();
                        tip = null;
                    }
                }
            });
        });
    }

  private static makeMarkerSymbol(symbol: IPointSymbol | undefined): Object | undefined{
    if (!symbol || symbol.type.toLowerCase() !== 'point-2d') return undefined;
    let result;

    if (symbol.primitive) {
      if (!this.primitive2D.includes(symbol.primitive)) {
        return undefined;
      }

      result = {
        type: 'simple-marker',
        style: symbol.primitive,
        color: symbol.color,
        size: symbol.size,
        xoffset: symbol.xoffset ? symbol.xoffset : null,
        yoffset: symbol.yoffset ? symbol.yoffset : null,
        angle: symbol.rotation ? symbol.rotation : null,
        outline: {
          color: symbol.outline?.color,
          width: symbol.outline?.size
        }
      };
    } else if (symbol.url) {
      result = {
        type: 'picture-marker',
        url: symbol.url,
        width: symbol.size instanceof Array && symbol.size[0] ? symbol.size[0] : 12,
        height: symbol.size instanceof Array && symbol.size[0] ? symbol.size[1] : 12,
        xoffset: symbol.xoffset ? symbol.xoffset : null,
        yoffset: symbol.yoffset ? symbol.yoffset : null,
        angle: symbol.rotation ? symbol.rotation : null
      };
    }

    return result;
  }

  private static makePolylineSymbol(symbol: IPolylineSymbol | undefined): Object | undefined{
    if (!symbol || symbol.type.toLowerCase() !== 'line-2d') return undefined;

    let result = {
      type: "simple-line", //line-2d/line-3d
      color: symbol.color? symbol.color: "black",
      // opacity: symbol.opacity,
      width: symbol.width ? symbol.width : 0.75,
      style: symbol.style ? symbol.style : "solid",
      cap : symbol.lineCap ? symbol.lineCap : "round",
      join : symbol.lineJoin ? symbol.lineJoin : "round",
    }

    return result;
  }

  private static makePolygonSymbol(symbol: IPolygonSymbol | undefined): Object | undefined{
    if (!symbol || symbol.type.toLowerCase() !== 'polygon-2d') return undefined;
    return {
      type: "simple-fill",
      outline: symbol.outline,
      color: symbol.color,
      opacity: symbol.opacity,
    }
  }
  /**根据graphic的属性生成弹出框**/
  private getInfoWindowContent(graphic: any): any {
      debugger;
    let content = '';
    //键值对
    for (let fieldName in graphic.attributes) {
      if (graphic.attributes.hasOwnProperty(fieldName)) {
        content +=
          '<b>' + fieldName + ': </b>' + graphic.attributes[fieldName] + '<br>';
      }
    }
    //去掉最后的<br>
    content = content.substring(0, content.lastIndexOf('<br>'));
    if (graphic.buttons !== undefined) {
      content += '<hr>';
      graphic.buttons.forEach((buttonConfig: {type: string; label: string}) => {
        content +=
          "<button type='button' class='btn btn-primary btn-sm' onclick='mapFeatureClicked(" +
          '"' +
          buttonConfig.type +
          '", "' +
          graphic.id +
          '"' +
          ")'>" +
          buttonConfig.label +
          '</button>  ';
      });
    }
    let divContent = document.createElement('div');
    divContent.innerHTML = content;
    return divContent;
  }
  //使popup中的content,支持html.
  private getPopUpHtml(graphic: any, content: string): any {
    let tipContent = content;
    for (let fieldName in graphic.attributes) {
      if (graphic.attributes.hasOwnProperty(fieldName)) {
        tipContent = tipContent.replace(
          '{' + fieldName + '}',
          graphic.attributes[fieldName]
        );
      }
    }
    let divContent = document.createElement('div');
    divContent.innerHTML = tipContent;
    return divContent;
  }
  //使toolTip中支持{字段}的形式
  private getToolTipContent(graphic: any, content: string): string {
    let tipContent = content;
    if (content) {
      //键值对
      for (let fieldName in graphic.attributes) {
        if (graphic.attributes.hasOwnProperty(fieldName)) {
          tipContent = tipContent.replace(
            '{' + fieldName + '}',
            graphic.attributes[fieldName]
          );
        }
      }
    } else {
      tipContent = this.getInfoWindowContent(graphic).innerHTML;
    }
    return tipContent;
  }

  public async addOverlays(params: IOverlayParameter): Promise<IResult> {
    let overlayLayer = (await this.getOverlayLayer(
      params.type || 'default'
    )) as __esri.GraphicsLayer;

    const [
      Graphic,
      geometryJsonUtils,
      PopupTemplate,
      SpatialReference,
      WebMercatorUtils
    ] = await loadModules([
      'esri/Graphic',
      'esri/geometry/support/jsonUtils',
      'esri/PopupTemplate',
      'esri/geometry/SpatialReference',
      'esri/geometry/support/webMercatorUtils'
    ]);

    const defaultSymbol = OverlayArcgis2D.makeSymbol(params.defaultSymbol);

    const defaultInfoTemplate = params.defaultInfoTemplate;

    const defaultButtons = params.defaultButtons;
    const defaultVisible = params.defaultVisible !== false;
    const iswgs = params.iswgs !== false;
    const zooms = params.defaultZooms || [0, 0];
    if (params.defaultZooms) {
      overlayLayer.minScale = Utils.getScale(this.view, zooms[0]);
      overlayLayer.maxScale = Utils.getScale(this.view, zooms[1]);
    }

      let showPopup = params.showPopup;
      let showToolTip = params.showTooltip;
      let moveToolTip = params.moveTooltip;
      let movePopup = params.movePopup;
      let autoPopup = params.autoPopup;
      let autoToolTip = params.autoTooltip;

      let tooltipComponent = params.tooltipComponent;
      let popupComponent = params.popupComponent;

      let popupAndTooltip = {
          showPopup,
          showToolTip,
          moveToolTip,
          movePopup,
          autoPopup,
          autoToolTip
      };

      let componentsObj = {
          tooltipComponent,
          popupComponent
      }


    let addCount = 0;
    for (let i = 0; i < params.overlays.length; i++) {
      const overlay = params.overlays[i];
      if ((overlay.geometry as any).x) {
        (overlay.geometry as any).x = Number((overlay.geometry as any).x);
        (overlay.geometry as any).y = Number((overlay.geometry as any).y);
      }
      if (!iswgs) {
        (overlay.geometry as any).spatialReference = this.view.spatialReference;
      }
      let geometry = geometryJsonUtils.fromJSON(overlay.geometry);
      if (overlay.symbol && !overlay.symbol.type) {
        overlay.symbol.type = geometry.type;
      }
      const overlaySymbol = OverlayArcgis2D.makeSymbol(overlay.symbol);
      //TODO: 加入更详细的参数是否合法判断
      if (!defaultSymbol && !overlaySymbol) {
        continue;
      }
      const fields = overlay.fields;
      fields.type = params.type;
      fields.id = overlay.id;
      const buttons = overlay.buttons;

      let graphic = new Graphic({
        geometry,
        symbol: overlaySymbol || defaultSymbol,
        attributes: fields || {}
      });

      graphic.visible = defaultVisible;
      graphic.type = params.type
      graphic.id = overlay.id;
      graphic.buttons = buttons || defaultButtons;

      if(defaultInfoTemplate){
          graphic.popupTemplate = {
              title: defaultInfoTemplate.title,
              content: this.getPopUpHtml(graphic, defaultInfoTemplate.content)
          };
      }
      overlayLayer.add(graphic);
      addCount++;
    }

      //处理弹窗逻辑,弹窗优先级popup->tooltip,动作优先级show->move->auto
      //冲突关系：同类冲突，例如autpPopup和movePopup冲突，autoTooltip和moveTooltip冲突
      //示意：假如同时存在autoPopup和showPopup为true，认为两者冲突，则autoPopup为false
      await this.processPopupAndTooltip(popupAndTooltip,componentsObj);
    
    return {
      status: 0,
      message: 'ok',
      result: `成功添加${params.overlays.length}中的${addCount}个覆盖物`
    };
  }

  public async deleteOverlays(params: IOverlayDelete,overlayLayer?:__esri.GraphicsLayer): Promise<IResult> {
    let types = params.types || [];
    let ids = params.ids || [];
    let delcount = 0;
    const searchLayer = overlayLayer ? overlayLayer : this.overlayLayer;
    for (let i = 0; i < searchLayer.graphics.length; i++) {
      let graphic: any = searchLayer.graphics.getItemAt(i);
      if (
        //只判断type
        (types.length > 0 &&
          ids.length === 0 &&
          types.indexOf(graphic.type) >= 0) ||
        //只判断id
        (types.length === 0 &&
          ids.length > 0 &&
          ids.indexOf(graphic.id) >= 0) ||
        //type和id都要判断
        (types.length > 0 &&
          ids.length > 0 &&
          types.indexOf(graphic.type) >= 0 &&
          ids.indexOf(graphic.id) >= 0)
      ) {
        searchLayer.remove(graphic);
        delcount++;
        i--;
      }
    }
    return {
      status: 0,
      message: 'ok',
      result: `成功删除${delcount}个覆盖物`
    };
  }
  public async deleteAllOverlays(): Promise<IResult> {
    this.overlayGroups.forEach((overlay, key) => {
      overlay.removeAll();
    });
    return {
      status: 0,
      message: 'ok'
    };
  }
  public async findFeature(params: IFindParameter,overlaysLayer?:__esri.GraphicsLayer): Promise<IResult> {
    let type = params.layerName;
    let ids = params.ids || [];
    let level = params.level || this.view.zoom;
    let overlays = overlaysLayer ? overlaysLayer.graphics : this.overlayLayer.graphics;
    let centerResult = params.centerResult !== false;

    //根据网上资料,forEach内函数无法采用异步，除非重写原型。
    //此处graphics能访问的属性只有length，访问其items属性会提示错误
    let lengthOfOverlays = overlays.length;

    for(let i = 0;i<lengthOfOverlays;i++){
      let overlay = overlays.getItemAt(i);
      await this.goToView(overlay, type, ids, centerResult, level);
      if(i == lengthOfOverlays - 1){
        console.log("finish animating");
      }
    }

    return {
      status: 0,
      message: '完成定位居中',
    };
  }
  private async startJumpPoint(graphics: any[]) {
    let high = HighFeauture2D.getInstance(this.view);
    await high.startup(graphics);
  }
  private async goToView(overlay: any,type: any,ids:any[],centerResult:boolean,level:number){
    if (type == overlay.type && ids.indexOf(overlay.id) >= 0) {
      if (centerResult) {
        var opts = {
          duration: 5000  // Duration of animation will be 5 seconds
        };
        await this.view.goTo({target: overlay, zoom: level},opts).then(
            async ()=> {
              await this.startJumpPoint([overlay])
            }).catch((err)=>{
          console.log(err);
        });
      }
      else{
        await this.startJumpPoint([overlay]);
      }
    }
  }

    private async showPopup(popup:Vue.Component) :Promise<IResult>{
        if(!popup && (this.popup)){
            await this.closePopup();
        }
        const view:__esri.MapView = this.view;

        view.on('click', async (event) =>{
            const response = await view.hitTest(event);
            if (response.results.length > 0) {
                response.results.forEach((result) => {
                    if(result.graphic.attributes && result.graphic.attributes.hasOwnProperty("popupWindow")){
                        let content = result.graphic.attributes.popupWindow;
                        if (this.popup) {
                            this.popup.remove();
                            this.popup = null;
                        }
                        this.popup = new ToolTip2D(
                            view,
                            popup,
                            content,
                            result.graphic
                        );
                    }
                });
            } else {
                if (this.popup) {
                    this.popup.remove();
                    this.popup = null;
                }
            }
        });


        return {
            status:0,
            message:'ok',
            result:'方法调用成功，但无法保证可以正确显示弹窗'
        }
    }

    private async showTooltip(tooltip:Vue.Component) :Promise<IResult>{
        if(!tooltip && (this.tooltip)){
            await this.closePopup();
        }
        const view = this.view;

        view.on('click', async (event) =>{
            const response = await view.hitTest(event);
            if (response.results.length > 0) {
                response.results.forEach((result) => {
                    if(result.graphic.geometry.type === "point"){
                        if(result.graphic.attributes && result.graphic.attributes.hasOwnProperty("tooltipWindow")){
                            let content = result.graphic.attributes.popupWindow;
                            if (this.tooltip) {
                                this.tooltip.remove();
                                this.tooltip = null;
                            }
                            this.tooltip = new ToolTip2D(
                                view,
                                tooltip,
                                content,
                                result.graphic
                            );
                        }
                    }
                });
            } else {
                if (this.tooltip) {
                    this.tooltip.remove();
                    this.tooltip = null;
                }
            }
        });


        return {
            status:0,
            message:'ok',
            result:'方法调用成功，但无法保证可以正确显示弹窗'
        }
    }

    private async movePopup(popup:Vue.Component){
        if(!popup && (this.popup)){
            await this.closePopup();
        }
        const view = this.view;

        view.on('click', async (event) =>{
            const response = await view.hitTest(event);
            if (response.results.length > 0) {
                response.results.forEach((result) => {
                    if(result.graphic.geometry.type === "point"){
                        if(result.graphic.attributes && result.graphic.attributes.hasOwnProperty("popupWindow")){
                            let content = result.graphic.attributes.popupWindow;
                            if (this.popup) {
                                this.popup.remove();
                                this.popup = null;
                            }
                            this.popup = new ToolTip2D(
                                view,
                                popup,
                                content,
                                result.graphic
                            );
                        }
                    }
                });
            } else {
                if (this.popup) {
                    this.popup.remove();
                    this.popup = null;
                }
            }
        });


        return {
            status:0,
            message:'ok',
            result:'方法调用成功，但无法保证可以正确显示弹窗'
        }
    }

    private async moveToolTip(tooltip:Vue.Component){
        if(!tooltip && (this.tooltip)){
            await this.closePopup();
        }
        const view = this.view;

        view.on('pointer-move', async (event) =>{
            const response = await view.hitTest(event);
            if (response.results.length > 0) {
                response.results.forEach((result) => {
                    if(result.graphic.geometry.type === "point"){
                        if(result.graphic.attributes && result.graphic.attributes.hasOwnProperty("tooltipWindow")){
                            let content = result.graphic.attributes.popupWindow;
                            if (this.tooltip) {
                                this.tooltip.remove();
                                this.tooltip = null;
                            }
                            this.tooltip = new ToolTip2D(
                                view,
                                tooltip,
                                content,
                                result.graphic
                            );
                        }
                    }
                });
            } else {
                if (this.tooltip) {
                    this.tooltip.remove();
                    this.tooltip = null;
                }
            }
        });


        return {
            status:0,
            message:'ok',
            result:'方法调用成功，但无法保证可以正确显示弹窗'
        }
    }

    private async autoPopup(popup:Vue.Component,type?:string) :Promise<IResult>{
        const view = this.view;

        if(type){
            let popupLayer = await this.getOverlayLayer(type);

            if(!popupLayer){                   //输入type就必须存在该图层
                return {
                    status:0,
                    message:`there is no such layer of ${type}`
                }
            }else {
                let popupOfType:ToolTip2D[] = this.popupTypes.get(type);   //首先检查该图层是否已经显示Popup
                if(popupOfType){
                    this.popupTypes.delete(type);   //如果存在改类型的弹窗，则遍历数组，删除所有改类弹窗
                    for(let popup of popupOfType){
                        popup.remove();
                    }
                }

                let graphics = popupLayer.graphics;
                if(!graphics.length){
                    return {
                        status:0,
                        message:`no graphic in the graphicLayer of ${type}!`
                    }
                }
                let popupCount = 0;
                let popups:ToolTip2D[] = [];
                graphics.forEach((graphic)=>{
                    let content = graphic.attributes.popupWindow;

                    let _popup = new ToolTip2D(
                        view,
                        popup,
                        content,
                        graphic
                    );
                    popupCount++;
                    popups.push(_popup);
                })
                this.popupTypes.set(type,popups);

                return {
                    status:0,
                    message:`finish autoPopup`,
                    result:`the layer of ${type} with ${popupCount}popups!`
                }
            }
        }else {
            debugger;
            this.tooltipTypes.clear();
            console.log(this.overlayGroups);

            let popups:ToolTip2D[] = [];

            for(let key of this.overlayGroups.keys()){
                let graphicLayer = this.overlayGroups.get(key);

                if(!graphicLayer){
                    break;
                }
                let graphics = graphicLayer.graphics;
                graphics.forEach((graphic)=>{
                    if(graphic.geometry.type === 'point'){
                        if(graphic.attributes.hasOwnProperty('popupWindow')){
                            let content = graphic.attributes.popupWindow;

                            let _popup = new ToolTip2D(
                                view,
                                popup,
                                content,
                                graphic
                            );
                            popups.push(_popup);
                        }
                    }
                })

                this.popupTypes.set(key,popups);
            }

            return {
                status:0,
                message:"all overlays have popups now!"
            }
        }
    }

    private async autoTooltip(tooltip:Vue.Component,type?:string){
        const view = this.view;

        if(type){
            let tooltipLayer = await this.getOverlayLayer(type);

            if(!tooltipLayer){                   //输入type就必须存在该图层
                return {
                    status:0,
                    message:`there is no such layer of ${type}`
                }
            }else {
                let tooltipOfType:ToolTip2D[] = this.tooltipTypes.get(type);   //首先检查该图层是否已经显示Popup
                if(tooltipOfType){
                    this.tooltipTypes.delete(type);   //如果存在改类型的弹窗，则遍历数组，删除所有改类弹窗
                    for(let tooltip of tooltipOfType){
                        tooltip.remove();
                    }
                }

                let graphics = tooltipLayer.graphics;
                if(!graphics.length){
                    return {
                        status:0,
                        message:`no graphic in the graphicLayer of ${type}!`
                    }
                }
                let tooltipCount = 0;
                let tooltips:ToolTip2D[] = [];
                graphics.forEach((graphic)=>{
                    let content = graphic.attributes.popupWindow;

                    let _tooltip = new ToolTip2D(
                        view,
                        tooltip,
                        content,
                        graphic
                    );
                    tooltipCount++;
                    tooltips.push(_tooltip);
                })
                this.popupTypes.set(type,tooltips);

                return {
                    status:0,
                    message:`finish autoPopup`,
                    result:`the layer of ${type} with ${tooltipCount}popups!`
                }
            }
        }else {
            this.tooltipTypes.clear();

            let tooltips:ToolTip2D[] = [];

            for(let key of this.overlayGroups.keys()){
                let graphicLayer = this.overlayGroups.get(key);

                if(!graphicLayer){
                    break;
                }
                let graphics = graphicLayer.graphics;
                graphics.forEach((graphic)=>{
                    if(graphic.geometry.type === 'point'){
                        if(graphic.attributes.hasOwnProperty('popupWindow')){
                            let content = graphic.attributes.popupWindow;

                            let _tooltip = new ToolTip2D(
                                view,
                                tooltip,
                                content,
                                graphic
                            );
                            tooltips.push(_tooltip);
                        }
                    }
                })

                this.popupTypes.set(key,tooltips);
            }

            return {
                status:0,
                message:"all overlays have popups now!"
            }
        }
    }

    public async closePopup() :Promise<IResult>{
        let close = false;
        if(this.tooltip){
            this.tooltip.remove();
            this.tooltip = null;
            close = true;
        }

        return {
            status:0,
            message:'ok',
            result:close ? '成功关闭VUE弹窗': '未存在VUE弹窗'
        }
    }

    private async processPopupAndTooltip(popAndTip:any,componentsObj:any){
        let showPopup = popAndTip.showPopup;
        let showTooltip = popAndTip.showToolTip;
        let moveTooltip = popAndTip.moveToolTip;
        let movePopup = popAndTip.movePopup;
        let autoPopup = popAndTip.autoPopup;
        let autoTooltip = popAndTip.autoToolTip;

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
            await this.showPopup(popupComponent);
        }else if(movePopup && popupComponent){
            await this.movePopup(popupComponent);
        }else if(autoPopup && popupComponent){
            await this.autoPopup(popupComponent);
        }else {
            console.log('no overlays popup');
        }

        if(showTooltip && tooltipComponent){
            await this.showTooltip(tooltipComponent);
        }else if(moveTooltip && tooltipComponent){
            await this.moveToolTip(tooltipComponent);
        }else if(autoTooltip && tooltipComponent){
            await this.autoTooltip(tooltipComponent);
        }
    }
}
