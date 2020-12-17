import {
  IResult,
  IDrawOverlaysDelete,
  IDrawOverlayParameter,
  IFindParameter,
  IPolylineRangingParameter
} from '@/types/map';

declare let BMapLib: any;
declare let BMap: any;

export default class DrawOverlaysBD{
  private static intances: Map<string, any>;

  private view!: any;
  private generateId:Boolean = false;
  private overlaysType!:String;
  private clearLastResult:Boolean = false;
  private drawOverlays:Map<string,any> = new Map<string, any>();
  private drawingType!:any;
  private drawingManager!:any;
  private drawCallback!:any;
  private drawingPromise!:any

  public static defaultLineSymbol:Object = {
    strokeColor:'rgb(255,0,0)',    //边线颜色。
    fillColor:'rgb(0,144,255)',      //填充颜色。当参数为空时，圆形将没有填充效果。
    strokeWeight: 0.5,       //边线的宽度，以像素为单位。
    strokeOpacity: 0.8,	   //边线透明度，取值范围0 - 1。
    fillOpacity: 0.6,      //填充的透明度，取值范围0 - 1。
    strokeStyle: 'solid' //边线的样式，solid或dashed。
  };
  public static defaultPolygonSymbol:Object = {
    strokeColor:"red",    //边线颜色。
    fillColor:"red",      //填充颜色。当参数为空时，圆形将没有填充效果。
    strokeWeight: 1,       //边线的宽度，以像素为单位。
    strokeOpacity: 0.8,	   //边线透明度，取值范围0 - 1。
    fillOpacity: 0.6,      //填充的透明度，取值范围0 - 1。
    strokeStyle: 'solid' //边线的样式，solid或dashed。
  };
  public static defaultPicMarkerSymbol:any = {
    icon:{},
    enableDragging:false,
    offset: {
      width:0,
      height:0
    },
    rotation:{},
    shadow:null,
    title:""
  };
  public static defaultSimpleMarkerSymbol:Object = {
    icon:{
      anchor:{
        width:0,
        height:0
      },
      size:{
        width:24,
        height:36
      },
      imageUrl:""
    },
    enableDragging:false,
    offset: {
      width:0,
      height:0
    },
    // rotation:{},
    // shadow:null,
    // title:""
  }

  // private dataJsonMap: Map<string, any> = new Map();

  private constructor(view: any) {
    this.view = view;
  }

  public static getInstance(view:any) {
    let id = view.container.id;
    if (!DrawOverlaysBD.intances) {
      DrawOverlaysBD.intances = new Map();
    }
    let intance = DrawOverlaysBD.intances.get(id);
    if (!intance) {
      intance = new DrawOverlaysBD(view);
      DrawOverlaysBD.intances.set(id, intance);
    }
    return intance;
  }

  public async startDrawOverlays(params:IDrawOverlayParameter):Promise<IResult>{
    const drawType:string = params.drawType;
    this.drawingType = drawType;
    const defaultSymbol = params.defaultSymbol;
    this.overlaysType = (typeof params.type === "string") ?  params.type : "drawOverlays";
    this.generateId = (typeof params.generateId === "boolean") ?  params.generateId : false;
    this.clearLastResult = (typeof params.clearLastResult === "boolean") ?  params.clearLastResult : false;
    const once = params.onlyOnce || false;
    const callback = params.callback;

    let resultObj = null;
    resultObj = await this.processDefaultSymbol(drawType,defaultSymbol);

    const drawSymbol = resultObj.symbolOption;
    const drawMode = resultObj.drawingMode;

    const drawingManager = new BMapLib.DrawingManager(this.view,{
      isOpen: false, //是否开启绘制模式
      drawingType:drawMode,
      markerOptions: drawSymbol, //点的样式
      circleOptions: drawSymbol, //圆的样式
      polylineOptions: drawSymbol, //线的样式
      polygonOptions: drawSymbol, //多边形的样式
      rectangleOptions: drawSymbol //矩形的样式
    });

    drawingManager.setDrawingMode(drawMode);
    drawingManager.open();

    drawingManager.addEventListener('overlaycomplete', async (results:any)=>{
      const result = await this.onDrawComplete(results);
      if(callback){
        this.drawCallback(result);
      }
      if(once){
        await this.stopDrawOverlays();
      }
    });

    if(this.drawingType === "point"){
      this.view.addEventListener('rightclick',(event:any) => {
        this.stopDrawOverlays();
      })
    }

    this.drawingManager = drawingManager;
    return {
      status:0,
      message:'成功调用该方法!获取覆盖物请调用getDrawOverlays'
    }
  }

  public async deleteDrawOverlays(params:IDrawOverlaysDelete):Promise<IResult>{
    await this.stopDrawOverlays();
    let types:string[],ids:string[];
    let delCount:number = 0;
    if(!params){
      this.drawOverlays.forEach((overlaysArray)=>{
        overlaysArray.forEach((overlay:any)=>{
          this.view.removeOverlay(overlay);
          delCount++;
        })
      });
      this.drawOverlays.clear();
    }else {
      types = params.types || [];
      ids = params.ids || [];
      delCount = 0;

      this.drawOverlays.forEach((overlaysArray,key)=>{
        overlaysArray.forEach((overlay:any,index:number)=>{
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
          ){
            this.view.removeOverlay(overlay);
            delCount++;

            overlaysArray.splice(index,1);
            if(!overlaysArray.length){
              this.drawOverlays.delete(key);
            }
          }
        })
      });
    }


    return {
      status:0,
      message:'成功调用该方法！',
      result:`删除了${delCount}个覆盖物`
    }
  }

  public async stopDrawOverlays():Promise<IResult>{
    if(this.drawingManager){
      this.drawingManager.close();
    }
    if(this.drawingType === "point"){
      this.view.removeEventListener('rightclick')
    }
    this.drawingType = null;

    return {
      status: 0,
      message: '成功调用该方法！'
    }
  }

  public async getDrawOverlays():Promise<IResult>{
    let result:any = {};

    this.drawOverlays.forEach((overlaysGroup,key)=>{
      let overlays:any[] = [];
      result[key] = overlays;

      if(key === "point"){
        overlaysGroup.forEach((overlay:any) =>{
          let ptObj:any= {};
          ptObj.geometry = {
            x:overlay.point.lng,
            y:overlay.point.lat
          };
          ptObj.attributes = overlay.attributes;
          ptObj.id = overlay.id;
          ptObj.type = overlay.type;
          overlays.push(ptObj);
        })
      }else{
        overlaysGroup.forEach((overlay:any)=>{
          let exceptPtObj:any = {};
          let points = [];
          for(let point of overlay.points){
            points.push([point.lng,point.lat]);
          }
          exceptPtObj.geometry = {
            points
          }
          exceptPtObj.type = overlay.type;
          exceptPtObj.id = overlay.id ? overlay.id : null
          exceptPtObj.attributes = overlay.attributes

          overlays.push(exceptPtObj);
        })
      }

    });

    return {
      status:0,
      message:'成功调用改方法！',
      result:JSON.stringify(result)
    }
  }

  private async processDefaultSymbol(drawType:string,defaultSymbol:any):Promise<any>{
    let symbolOption:any = null;
    let drawingMode = "";
    switch (drawType) {
      case "point":
        symbolOption = DrawOverlaysBD.defaultPicMarkerSymbol;
        // if(defaultSymbol && defaultSymbol.hasOwnProperty('url')){
        //   symbolOption.icon.imageUrl = defaultSymbol.url;
        // }
        if(defaultSymbol && defaultSymbol.hasOwnProperty('size') &&
            defaultSymbol.size instanceof Array){
          let size = new BMap.Size(
              defaultSymbol.size[0],
              defaultSymbol.size[1]
          );
          let icon = new BMap.Icon(defaultSymbol.url, size, {
            imageSize: size
          });

          symbolOption.icon = icon;
        }

        drawingMode = "marker";
        break;
      case "polyline":
        symbolOption = DrawOverlaysBD.defaultLineSymbol;
        if(defaultSymbol && defaultSymbol.hasOwnProperty('color')){
          symbolOption.strokeColor = defaultSymbol.color;
        }
        if(defaultSymbol && defaultSymbol.hasOwnProperty('width')){
          symbolOption.strokeWeight = defaultSymbol.width;
        }
        if(defaultSymbol && defaultSymbol.hasOwnProperty('style')){
          symbolOption.strokeStyle = defaultSymbol.style;
        }

        drawingMode = "polyline";
        break;
      case "polygon":
      case "freehandPolygon":
      case "circle":
      case "rectangle":
        drawingMode = drawType;
        symbolOption = DrawOverlaysBD.defaultPolygonSymbol;
        if(defaultSymbol && defaultSymbol.hasOwnProperty('outline')){
          symbolOption.strokeStyle = defaultSymbol.outline.style ?
              defaultSymbol.outline.style : "solid" ;
          symbolOption.strokeColor = defaultSymbol.outline.color ?
              defaultSymbol.outline.color : "red" ;
          symbolOption.strokeOpacity = defaultSymbol.outline.opacity ?
              defaultSymbol.outline.opacity : 0.8 ;
          symbolOption.strokeWeight = defaultSymbol.outline.width ?
              defaultSymbol.outline.width : 1 ;
        }
        if(defaultSymbol && defaultSymbol.hasOwnProperty('color')){
          symbolOption.fillColor = defaultSymbol.color;
        }
        if(defaultSymbol && defaultSymbol.hasOwnProperty('opacity')){
          symbolOption.fillOpacity = defaultSymbol.opacity;
        }
        break;
      default:
        console.error("please input the correct drawType!")
        break;
    }

    return {
      drawingMode,
      symbolOption
    };
  }

  private async onDrawComplete(results:any){
    const overlay = results.overlay;
    const returnObj:any = {};
    if(overlay instanceof BMap.Overlay) {
      const attributes: any = {};
      if (this.generateId) {
        let id = Math.random().toFixed(6);
        attributes.id = id;
        overlay.id = id;
      }
      overlay.type = attributes.type = this.overlaysType;
      overlay.attributes = attributes;

      const drawingType = this.drawingType.toString();
      let thisTypeOverlays:any = this.drawOverlays.get(drawingType);
      if(!thisTypeOverlays){
        thisTypeOverlays = [];
      }
      if (this.clearLastResult){
        let thisTypeOverlays:any = this.drawOverlays.get(drawingType);
        if(thisTypeOverlays && thisTypeOverlays.length){
          let lastOverlay = thisTypeOverlays.pop();
          this.view.removeOverlay(lastOverlay);
          this.drawOverlays.set(drawingType,thisTypeOverlays);
        }
      }

      thisTypeOverlays.push(overlay);
      this.drawOverlays.set(drawingType,thisTypeOverlays);
    }

    returnObj.id = overlay.id;
    returnObj.type = overlay.type;
    returnObj.attributes = overlay.attributes;
    returnObj.geometry = JSON.parse(JSON.stringify(overlay.point || overlay.points));

    return returnObj;
  }

  public async findOverlays(params:IFindParameter): Promise<IResult> {
    let type = params.layerName;
    let ids = params.ids || [];
    let level = params.level || this.view.getZoom();
    let overlays = this.view.getOverlays();
    let findCount = 0;

    let centerResult = params.centerResult;
    let _this = this;

    for(let overlay of overlays){
      await overlayAnimation(overlay);
    }

    async function overlayAnimation(overlay:any) {
      if (type == overlay.type && ids.indexOf(overlay.id) >= 0) {
        if (centerResult) {
          let center = overlay.getPosition();
          if (center.lat !== null && center.lng !== null) {
            await _this.view.centerAndZoom(overlay.getPosition(), level);
          }
        }
        overlay.setAnimation(2);
        await sleep();
        overlay.setAnimation(0);
        findCount++;
      }
    }

    async function sleep() {
      return new Promise((resolve)=>{
        setTimeout(()=>{
          resolve();
        },3000)
      })
    }

    return {
      message:'成功调用该方法！',
      status:0,
      result:`成功发现${findCount}个覆盖物`
    }
  }

  public async polylineRanging(params:IPolylineRangingParameter): Promise<IResult> {
    const unit = params ? params.unit : undefined;
    const lineSymbol = params ? params.lineSymbol : undefined;
    const callback = params ?  params.callback : undefined;

    let lineStroke,lineColor,opacity,lineStyle;
    if(lineSymbol){
      ({
        width:lineStroke,
        color:lineColor,
        opacity:opacity,
          style:lineStyle,
      } = lineSymbol);
    }

    const pathStart = require('../../../../../assets/images/start.png')
    const pathMid = require('../../../../../assets/images/mid.png');
    const pathEnd = require('../../../../../assets/images/end.png')
    const imageSize = new BMap.Size(19,30)                  //图片长宽
    const imageExtend = new BMap.Size(19,60)
    const myDistanceToolObject = new BMapLib.DistanceTool(this.view, {
      lineStroke:lineStroke || 4,
      lineColor:lineColor || '#87CEEB',
      opacity:opacity || 1 ,
      lineStyle:lineStyle || 'dashed',

      secIcon:new BMap.Icon(pathMid,imageExtend,{
        imageSize:imageSize
      }),
      startIcon:new BMap.Icon(pathStart,imageExtend,{
        imageSize:imageSize
      })
    });

    myDistanceToolObject.open();
    myDistanceToolObject.addEventListener("addpoint", (e:any)=>{
      this.onPointAdded(e);
    });
    myDistanceToolObject.addEventListener("drawend", (e:any)=>{
      let ptOverlays = myDistanceToolObject._dots;
      ptOverlays[ptOverlays.length-1].setIcon(new BMap.Icon(pathEnd,imageExtend,{
        imageSize:imageSize
      }));
    })

    return {
      status:0,
      message:'not complete'
    }
  }

  private async onPointAdded(params:any): Promise<any>{

  }
}