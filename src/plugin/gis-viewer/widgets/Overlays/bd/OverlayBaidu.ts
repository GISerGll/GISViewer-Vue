import {
  IOverlayParameter,
  IPointSymbol,
  IPolylineSymbol,
  IResult,
  IPopUpTemplate,
  IOverlayClusterParameter,
  IOverlayDelete,
  IFindParameter
} from '@/types/map';
import {Vue} from "vue-property-decorator";
import ToolTipBaiDu from "@/plugin/gis-viewer/widgets/Overlays/bd/ToolTipBaiDu";
import ToolTip2D from "@/plugin/gis-viewer/widgets/Overlays/arcgis/ToolTip2D";
declare let BMap: any;
declare let BMapLib: any;

export class OverlayBaidu {
  private static intances: Map<string, any>;

  private view!: any;
  private overlays = new Array();
  private markerClustererLayer = new Array();

  private tooltip:any;
  private popupTypes: Map<string, any> = new Map<string, any>();
  private tooltipTypes:Map<string, any> = new Map<string, any>();
  private popup:any;

  private constructor(view: any) {
    this.view = view;
  }

  public static getInstance(view: any) {
    let id = view.getContainer().id;
    if (!OverlayBaidu.intances) {
      OverlayBaidu.intances = new Map();
    }
    let intance = OverlayBaidu.intances.get(id);
    if (!intance) {
      intance = new OverlayBaidu(view);
      OverlayBaidu.intances.set(id, intance);
    }
    return intance;
  }
  public static destroy() {
    (OverlayBaidu.intances as any) = null;
  }
  private async createOverlayLayer() {}
  private getMarker(overlay: any, symbol: any, type?:string): any {
    let marker: any;
    let geometry = overlay.geometry;
    if(!type){
      type = symbol.type
    }

    switch (type) {
      case 'polyline':
        marker = new BMap.Polyline(this.getGeometry(geometry.paths), symbol);
        console.log(marker);
        break;
      case 'polygon':
        marker = new BMap.Polygon(this.getGeometry(geometry.rings), symbol);
        break;
      case 'extent':
        break;
      case 'circle':
        marker = new BMap.Circle(
          new BMap.Point(geometry.x, geometry.y),
          geometry.radius,
          {strokeColor: 'blue', strokeWeight: 2, strokeOpacity: 0.5}
        ); //创建圆
        break;
      case 'point' || 'marker':
        marker = new BMap.Marker(
            new BMap.Point(geometry.x, geometry.y),
            symbol
        );
      default:
        break;
    }
    return marker;
  }
  private getGeometry(points: number[][]): object[] {
    let features: object[] = [];
    for (let i = 0; i < points.length; i++) {
      let pt: number[] = points[i];
      let point = new BMap.Point(pt[0], pt[1]);
      features.push(point);
    }
    return features;
  }
  private makeSymbol(symbol: IPointSymbol | undefined,defaultSymbol?:any): object | undefined {
    if (!symbol) {
      return undefined;
    }

    let overlaySymbol;
    let myIcon;
    let size;
    let xoffset;
    let yoffset;

    if(!symbol.type && !defaultSymbol.type){
      console.error('either defaultSymbol or overlay.symbol must exits!')
      return undefined;
    }else if(!symbol.type && defaultSymbol.type){
      symbol.type = defaultSymbol.type
    }

    switch (symbol.type) {
      case 'polyline':
        overlaySymbol = {strokeColor: symbol.color, strokeWeight: symbol.width};
        break;
      case 'polygon' || 'extent' || 'circle':
        if (!symbol.outline) return undefined;
        overlaySymbol = {
          strokeColor: symbol.outline.color,
          strokeWeight: symbol.outline.size,
          fillColor: symbol.color
        };
        break;
      case 'point' || 'marker':
        if (symbol.size) {
          size = new BMap.Size(
              symbol.size instanceof Array ? symbol.size[0] : symbol.size,
              symbol.size instanceof Array ? symbol.size[1] : symbol.size
          );
        }
        if (symbol.width) {
          size = new BMap.Size(symbol.width, symbol.height);
        }
        xoffset = symbol.xoffset || 0;
        yoffset = symbol.yoffset || 0;

        myIcon = new BMap.Icon(symbol.url || defaultSymbol.url, size, {
          imageSize: size
        });
        overlaySymbol = {icon: myIcon, offset: new BMap.Size(xoffset, yoffset)};
      default:
        break;
    }
    return overlaySymbol;
  }
  /**根据graphic的属性生成弹出框*/
  private getInfoWindowContent(graphic: any): any {
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
    return content;
  }

  private getPopUpHtml(graphic: any, content: string): any {
    let tipContent = content;
    for (let fieldName in graphic.attributes) {
      if (graphic.attributes.hasOwnProperty(fieldName)) {
        tipContent = tipContent.replace(
          new RegExp('{' + fieldName + '}', 'g'),
          graphic.attributes[fieldName]
        );
      }
    }
    return tipContent;
  }

  public async addOverlays(params: IOverlayParameter): Promise<IResult> {
    const defaultSymbol = params.defaultSymbol;
    const defaultType = params.type;
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
    for (let i = 0; i < params.overlays.length; i++) {
      const overlay = params.overlays[i];
      const overlaySymbol = this.makeSymbol(overlay.symbol || defaultSymbol,defaultSymbol);
      const fields = overlay.fields;
      const buttons = overlay.buttons || defaultButtons;

      const type = overlay.symbol && overlay.symbol.type ? overlay.symbol.type :
          defaultSymbol && defaultSymbol.type ? defaultSymbol.type : undefined;
      if(!type){
        break ;
      }
      let graphic = this.getMarker(overlay, overlaySymbol,type);
      if(!graphic){
        return {
          message:'请检查overlay输入是否正确!',
          status:0
        }
      }
      graphic.attributes = fields;
      graphic.buttons = buttons;
      graphic.id = overlay.id;
      graphic.type = overlay.type || defaultType;

      let mapView = this.view;
      let title: any;
      let content: string = '';

      this.overlays.push(graphic);
      this.view.addOverlay(graphic);
      addCount++;

      if (defaultInfoTemplate) {
        title = defaultInfoTemplate.title;
        content = this.getPopUpHtml(graphic, defaultInfoTemplate.content);

        graphic.addEventListener('click', function(e: any) {
          let infoWindow = new BMap.InfoWindow(content, {
            width: 0, // 信息窗口宽度
            height: 0, // 信息窗口高度
            title: title, // 信息窗口标题
            enableMessage: true, //设置允许信息窗发送短息
            message: ''
          }); // 创建信息窗口对象
          e.target.isOpenInfo = true;
          mapView.openInfoWindow(infoWindow, e.point);
          // _this._showGisDeviceInfo(e.target.type, e.target.id);
        });
      }


      if (params.overlays.length == 1) {
        this.view.panTo(graphic.getPosition());
      }
    }

    //处理弹窗逻辑,弹窗优先级popup->tooltip,动作优先级show->move->auto
    //冲突关系：同类冲突，例如autpPopup和movePopup冲突，autoTooltip和moveTooltip冲突
    //示意：假如同时存在autoPopup和showPopup为true，认为两者冲突，则autoPopup为false
    if(!defaultInfoTemplate){
      await this.processPopupAndTooltip(popupAndTooltip,componentsObj);
    }

    return {
      status: 0,
      message: 'ok',
      result: `成功添加${params.overlays.length}中的${addCount}个覆盖物`
    };
  }
  public async findFeature(params: IFindParameter) {
    let type = params.layerName;
    let ids = params.ids || [];
    let level = params.level || this.view.getZoom();
    let overlays = this.overlays;
    let centerResult = params.centerResult;
    const callback = params.callback || false;
    const callbackResults = [];
    let _this = this;

    for(let overlay of overlays){
      if (type == overlay.type && ids.indexOf(overlay.id) >= 0) {
        await overlayAnimation(overlay);
        let geometry = overlay.point ? overlay.point : overlay.points ?
            overlay.points : null;
        if(callback){
          let result:any = {};
          ({
            attributes:result.attributes,
            id:result.id,
            type:result.type
          } = overlay)

          result.geometry = geometry;
          callbackResults.push(result);
        }
      }
    }

    async function overlayAnimation(overlay:any) {
        if(overlay instanceof BMap.Marker){
          if (centerResult) {
            let center = overlay.getPosition();
            if (center.lat !== null && center.lng !== null) {
              await _this.view.centerAndZoom(center, level);
            }
          }
          overlay.setAnimation(2);
          await sleep();
          overlay.setAnimation(0);
        }else {
          if(centerResult){
            let center = overlay.getBounds().getCenter();
            if (center.lat !== null && center.lng !== null) {
              await _this.view.centerAndZoom(center, level);
            }
          }
        }
    }
    async function sleep() {
      return new Promise((resolve)=>{
        setTimeout(()=>{
          resolve();
        },3000)
      })
    }

    console.log(callbackResults);
    return {
      message:'成功调用改方法',
      status:0,
      result:`${JSON.stringify(callbackResults)}`
    }
  }
  public async hideOverlays(params:IOverlayDelete): Promise<IResult> {
    const overlays = this.view.getOverlays();
    let types = params.types || [];
    let ids = params.ids || [];

    let hideCount = 0;
    overlays.forEach((overlay:any) => {
      if (
          //只判断type
          (types.length > 0 &&
              ids.length === 0 &&
              types.indexOf(overlay.type) >= 0) ||
          //只判断id
          (types.length === 0 &&
              ids.length > 0 &&
              ids.indexOf(overlay.id) >= 0) ||
          //type和id都要判断
          (types.length > 0 &&
              ids.length > 0 &&
              types.indexOf(overlay.type) >= 0 &&
              ids.indexOf(overlay.id) >= 0)
      ) {
        overlay.hide();
        if (overlay.isOpenInfo === true) {
          this.view.closeInfoWindow();
        }
        hideCount++;
      }
    });
    return {
      status:0,
      message:'成功调用改方法！',
      result:`成功隐藏${hideCount}个覆盖物`
    }
  }
  public async showOverlays(params:IOverlayDelete): Promise<IResult> {
    const overlays = this.view.getOverlays();
    let types = params.types || [];
    let ids = params.ids || [];

    let showCount = 0;
    overlays.forEach((overlay:any) => {
      if (
          //只判断type
          (types.length > 0 &&
              ids.length === 0 &&
              types.indexOf(overlay.type) >= 0) ||
          //只判断id
          (types.length === 0 &&
              ids.length > 0 &&
              ids.indexOf(overlay.id) >= 0) ||
          //type和id都要判断
          (types.length > 0 &&
              ids.length > 0 &&
              types.indexOf(overlay.type) >= 0 &&
              ids.indexOf(overlay.id) >= 0)
      ) {
        overlay.show();
        showCount++;
      }
    });
    return {
      status:0,
      message:'成功调用改方法！',
      result:`成功隐藏${showCount}个覆盖物`
    }
  }
  public async addOverlaysCluster(params: IOverlayClusterParameter): Promise<IResult> {
    const _this = this;

    const defaultType = params.type;
    const zoom = params.zoom;
    const distance = params.distance;
    const defaultSymbol:any = this.makeSymbol(params.defaultSymbol);
    const defaultVisible = params.defaultVisible;
    const defaultTooltip = params.defaultTooltip;

    const clusterSymbol = params.clusterSymbol;
    const clusterImage = clusterSymbol
      ? clusterSymbol.url
      : 'assets/image/m0.png';
    const clusterSize =
      clusterSymbol && clusterSymbol.width
        ? new BMap.Size(clusterSymbol.width, clusterSymbol.height)
        : new BMap.Size(53, 53);

    const points = params.points || params.overlays || [];
    let mapView = this.view;

    let markers = new Array();

    for (let i = 0; i < points.length; i++) {
      const overlay = points[i];
      const overlaySymbol = this.makeSymbol(overlay.symbol);
      const fields = overlay.fields;
      let graphic = this.getMarker(overlay, overlaySymbol || defaultSymbol);

      graphic.attributes = fields;
      graphic.id = overlay.id;
      graphic.type = overlay.type || defaultType;
      if(defaultTooltip){
        let content = this.getPopUpHtml(graphic, defaultTooltip);

        graphic.addEventListener('click', function(e: any) {
          let infoWindow = new BMap.InfoWindow(content, {
            width: 0, // 信息窗口宽度
            height: 0, // 信息窗口高度
            title: '', // 信息窗口标题
            enableMessage: true, //设置允许信息窗发送短息
            message: ''
          }); // 创建信息窗口对象
          mapView.openInfoWindow(infoWindow, e.point);
          // _this._showGisDeviceInfo(e.target.type, e.target.id);
        });
      }

      markers.push(graphic);
    }

    let markerClusterer = new BMapLib.MarkerClusterer(this.view, {
      markers: markers,
      styles: [{url: clusterImage, size: clusterSize}],
      maxZoom: zoom,
      gridSize: distance
    });
    markerClusterer.type = defaultType;
    this.markerClustererLayer.push(markerClusterer);
    return {
      status: 0,
      message: 'ok'
    };
  }
  public async deleteAllOverlays() {
    if (this.overlays.length > 0) {
      for (let i = 0; i < this.overlays.length; i++) {
        this.view.removeOverlay(this.overlays[i]);
      }
      this.overlays = [];
    }
    this.view.closeInfoWindow();
  }
  public async deleteOverlays(params: IOverlayDelete) {
    if(!params){
      console.error('no ids or types input,call "deleteAllOverlays" if you want!');
      return ;
    }
    let types = params.types || [];
    let ids = params.ids || [];
    let delCount = 0;
    this.overlays = this.overlays.filter((graphic) => {
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
        this.view.removeOverlay(graphic);
        if (graphic.isOpenInfo === true) {
          this.view.closeInfoWindow();
        }
        delCount++;
        return false;
      }
      return true;
    });
  }
  public async deleteOverlaysCluster(params: IOverlayDelete):Promise<IResult> {
    let types = params.types || [];
    if (this.markerClustererLayer && this.markerClustererLayer.length > 0) {
      this.markerClustererLayer.forEach((layer) => {
        if (types.indexOf(layer.type) >= 0) {
          layer.clearMarkers();
        }
      });
    }
    this.view.closeInfoWindow();

    return {
      status:0,
      message:'成功调用该方法',
      result:types.length ? `成功删除${types}类型的聚合点` : `请输入types或删除所有聚合点`
    }
  }
  public async deleteAllOverlaysCluster():Promise<IResult> {
    if (this.markerClustererLayer && this.markerClustererLayer.length > 0) {
      this.markerClustererLayer.forEach((layer) => {
        layer.clearMarkers();
      });
    }
    this.view.closeInfoWindow();

    return {
      status:0,
      message:'成功删除所有聚合点'
    }
  }
  private async listenOverlayClick(popupType:string,popup:Vue.Component):Promise<IResult>{
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

    this.view.removeEventListener('click');
    switch (popupType) {
      case "showPopup":
        this.view.addEventListener('click',(e:any)=>{
          if(e.overlay && e.overlay.attributes && e.overlay.attributes.popupWindow){
            let overlay = e.overlay;
            let content = overlay.attributes.popupWindow;
            let center = e.overlay.getPosition();

            if (this.popup) {
              this.popup.remove();
              this.popup = null;
            }
            this.popup = new ToolTipBaiDu(
                this.view,
                popup,
                content,
                center
            );
          }
        });

        break;
      case "showTooltip":
        this.view.addEventListener('click',(e:any)=>{
          if(e.overlay&& e.overlay.attributes && e.overlay.attributes.tooltipWindow){
            let overlay = e.overlay;
            let content = overlay.attributes.popupWindow;
            let center = e.overlay.getPosition();

            if (this.tooltip) {
              this.tooltip.remove();
              this.tooltip = null;
            }
            this.tooltip = new ToolTipBaiDu(
                this.view,
                popup,
                content,
                center
            );
          }
        });
        break;
      default:
        break;
    }

    return {
      status:0,
      message:'成功调用该方法！'
    }

  }
  private async listenOverlayMouseOver(popupType:string,popup:Vue.Component):Promise<any>{
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

    this.view.removeEventListener('mousemove');
    switch (popupType) {
      case "movePopup":
        this.view.addEventListener('mousemove',(e:any)=>{
          if(e.overlay && e.overlay.attributes && e.overlay.attributes.popupWindow){
            let overlay = e.overlay;
            let content = overlay.attributes.popupWindow;
            let center = e.overlay.getPosition();

            if (this.popup) {
              this.popup.remove();
              this.popup = null;
            }
            this.popup = new ToolTipBaiDu(
                this.view,
                popup,
                content,
                center
            );
          }else{
            if (this.popup) {
              this.popup.remove();
              this.popup = null;
            }
          }
        });

        break;
      case "moveTooltip":
        this.view.addEventListener('mousemove',(e:any)=>{
          if(e.overlay && e.overlay.attributes && e.overlay.attributes.tooltipWindow){
            let overlay = e.overlay;
            let content = overlay.attributes.tooltipWindow;
            let center = e.overlay.getPosition();

            if (this.tooltip) {
              this.tooltip.remove();
              this.tooltip = null;
            }
            this.tooltip = new ToolTipBaiDu(
                this.view,
                popup,
                content,
                center
            );
          }else{
            if (this.tooltip) {
              this.tooltip.remove();
              this.tooltip = null;
            }
          }
        });
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

    overlays.forEach((ptOverlay:any) => {
      ptOverlay.addEventListener('click',async (e:any) => {
        let fields = e.target.attributes;
        let center = e.target.getPosition();
        let infoWindow;

        if(fields){
          infoWindow = fields.infoWindow;
        }
        if(infoWindow){
          if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
          }
          this.tooltip = new ToolTipBaiDu(
              this.view,
              tooltip,
              infoWindow,
              center
          );
        }
      })
    })
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
  private async autoPopup(popup:Vue.Component,type?:string) :Promise<IResult>{
    if(!this.overlays.length){
      return {
        status:0,
        message:'there is no overlays,add first!'
      }
    }

    let popupCount = 0;
    let popups:ToolTipBaiDu[] = [];

    if(type && (typeof type === 'string')){               //有type情况
      let popupOfType:ToolTip2D[] = this.popupTypes.get(type);   //首先检查该图层是否已经显示Popup
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
        let _popup = new ToolTipBaiDu(
            this.view,
            popup,
            content,
            center
        );
        popups.push(_popup);
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

        let center =  overlay.getPosition();
        let _popup = new ToolTipBaiDu(
            this.view,
            popup,
            content,
            center
        );
        popups.push(_popup);
        popupCount++;
      }

      return {
        status:0,
        message:`finish autoPopup`,
        result:`add the number of${popupCount}popups!`
      }
    }
  }
  private async autoTooltip(tooltip:Vue.Component,type?:string){
    if(!this.overlays.length){
      return {
        status:0,
        message:'there is no overlays,add first!'
      }
    }

    let tooltipCount = 0;
    let tooltips:ToolTipBaiDu[] = [];

    if(type && (typeof type === 'string')){               //有type情况
      let tooltipOfType:ToolTip2D[] = this.tooltipTypes.get(type);   //首先检查该图层是否已经显示Popup
      if(tooltipOfType){
        this.tooltipTypes.delete(type);   //如果存在改类型的弹窗，则遍历数组，删除所有改类弹窗
        for(let popup of tooltipOfType){
          popup.remove();
        }
      }

      for(const overlay of this.overlays){
        if(overlay.type !== type){
          continue;
        }

        let content = overlay.attributes.tooltipWindow;
        if(!content){
          continue;
        }

        let center =  overlay.getPosition();
        let _popup = new ToolTipBaiDu(
            this.view,
            tooltip,
            content,
            center
        );
        tooltips.push(_popup);
        tooltipCount++;
      }
      this.popupTypes.set(type,tooltips);

      return {
        status:0,
        message:`finish autoPopup`,
        result:`the layer of ${type} with ${tooltipCount}popups!`
      }
    }else {
      for(const overlay of this.overlays){
        let content = overlay.attributes.popupWindow;
        if(!content){
          continue;
        }

        let center =  overlay.getPosition();
        let _tooltip = new ToolTipBaiDu(
            this.view,
            tooltip,
            content,
            center
        );
        tooltips.push(_tooltip);
        tooltipCount++;
      }

      return {
        status:0,
        message:`finish autoPopup`,
        result:`add the number of${tooltipCount}popups!`
      }
    }
  }
  private async processPopupAndTooltip(popAndTip:any,componentsObj:any){
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
      await this.listenOverlayClick('showPopup',popupComponent);
    }else if(movePopup && popupComponent){
      await this.listenOverlayMouseOver('movePopup',popupComponent);
    }else if(autoPopup && popupComponent){
      await this.autoPopup(popupComponent);
    }else {
      console.log('no overlays popup');
    }

    if(showTooltip && tooltipComponent){
      await this.listenOverlayClick('showTooltip',tooltipComponent)
    }else if(moveTooltip && tooltipComponent){
      await this.listenOverlayMouseOver('moveTooltip',tooltipComponent)
    }else if(autoTooltip && tooltipComponent){
      await this.autoTooltip(tooltipComponent);
    }
  }
}
