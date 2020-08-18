import {
  IResult,
  IElectronicFence,
  IElectronicFenceParameter,
  IMonitorAreaParameter,
  IFenceDelete,
  ICircleOutline, ITrackPlayback
} from '@/types/map';
import {loadModules} from "esri-loader";

export default class ElectronicFence {
  private static electronicFence:ElectronicFence
  private view!: __esri.MapView
  private fenceLayer!: __esri.GraphicsLayer
  private fenceId!: number
  private fenceGraphic!: any
  // private currentInfo:{
  //   fenceId: number
  //   fenceGraphic: __esri.Graphic
  //   endPtsGeometryArray:number[][]
  // }
  //依次按级别分为1,2,3,4级,颜色分别为红,橙,黄,绿
  private bufferColors = [
    [255, 0, 0, 0.6],
    [255, 165, 0, 0.5],
    [255, 225, 0, 0.4],
    [0, 255, 0, 0.3]
  ]
  //针对正在操作的图形端点的坐标数组
  private endPtsGeometryArray:number[][]

  constructor(view: __esri.MapView) {
    this.view = view
    this.fenceId = -1;
    this.endPtsGeometryArray = [];
  }

  public static getInstance(view: __esri.MapView){
    if (!ElectronicFence.electronicFence) {
      ElectronicFence.electronicFence = new ElectronicFence(view);
    }

    return ElectronicFence.electronicFence;
  }

  private async createOverlayLayer(){
    type MapModules = [typeof import('esri/layers/GraphicsLayer')];
    const [GraphicsLayer] = await (loadModules([
      'esri/layers/GraphicsLayer'
    ]) as Promise<MapModules>);

    this.fenceLayer = new GraphicsLayer({
      id:"electronicFence_fenceLayer"
    });

    this.view.map.add(this.fenceLayer);
  }

  public async MonitorControl(params:IElectronicFenceParameter):Promise<IResult>{

    return {
      message:"not finish",
      status:0
    }
  }

  public async clearMonitorControl(params:IFenceDelete):Promise<IResult>{
    return {
      message:"not finish",
      status:0
    }
  }

  public async showMonitorArea(params:IMonitorAreaParameter):Promise<IResult>{
    if(!this.fenceLayer){
      await this.createOverlayLayer();
    }

    type MapModules = [
      typeof import('esri/Graphic'),
      typeof import('esri/geometry/support/jsonUtils'),
      typeof import('esri/geometry/support/webMercatorUtils')
    ] ;
    const [Graphic,geometryJsonUtils,WebMercatorUtils]  = await (loadModules([
      'esri/Graphic',
      'esri/geometry/support/jsonUtils',
      'esri/geometry/support/webMercatorUtils',
    ]) as Promise<MapModules>);

    let id = params.id || "";
    let type = params.type || "monitorAreas";
    let geometryObj = params.geometry;
    let resultBuffers:any = [];

    await this.clearMonitorArea({ids:[id],types:[type],message:"移除重复布控区域！数量："})

    let buffers = params.buffers || [10000];
    let geometry = geometryJsonUtils.fromJSON(geometryObj);

    let fields:{
      id?:string
      type?:string
    } = {
      id:id,
      type:type
    };

    let monitorGraphic  = new Graphic({
      geometry: geometry,
      symbol: {
        type: "simple-fill" , // autocasts as SimpleFillSymbol
        color: "purple",
        style: "solid",
        outline: {  // autocasts as SimpleLineSymbol
          color: "white",
          width: 1
        }
      } as any
    }) as any;
    monitorGraphic.id = id;
    monitorGraphic.type = type;
    monitorGraphic.attributes = fields;

    for (let j = buffers.length - 1; j > -1; j--) {
      this._doBuffer(monitorGraphic, buffers[j], j).then((value:__esri.Polygon) => {
        if(value.spatialReference.isWebMercator){
          let geoCoordinateBuffer;
          geoCoordinateBuffer = WebMercatorUtils.webMercatorToGeographic(value);
          resultBuffers.push(geoCoordinateBuffer);
        }
        else {
          resultBuffers.push(value);
        }

        let bufferGraphic = new Graphic({
          geometry: value,
          symbol: {
            type: "simple-fill", // autocasts as SimpleFillSymbol
            color: "purple",
            style: "solid",
            outline: {  // autocasts as SimpleLineSymbol
              color: "white",
              width: 1
            }
          }as any
        }) as any;
        bufferGraphic.attributes = fields;
        bufferGraphic.symbol.color = this.bufferColors[j];

        bufferGraphic.id = id + j;
        bufferGraphic.pid = id;
        bufferGraphic.type = type;

        this.fenceLayer.add(bufferGraphic);
      });
    }

    return {
      message:"not finish",
      status:0,
      result:resultBuffers
    }
  }

  public async showCircleOutline(params:ICircleOutline):Promise<IResult>{
    if(!this.fenceLayer){
      await this.createOverlayLayer();
    }

    const [Graphic,Point,Circle,WebMercatorUtils] = await loadModules([
      'esri/Graphic',
      'esri/geometry/Point',
      'esri/geometry/Circle',
      'esri/geometry/support/webMercatorUtils',
    ]);

    var outlineSymbol = params.outlineSymbol;
    var circleId = params.circleId || "circleOutline";
    var circleType = params.circleType || "circleOutline";
    var centerPtGeometry = params.geometry;
    var radius = params.radius || [10000];
    //清除已有的相同id圆边界
    await this.clearMonitorArea({ids:[circleId]});

    //4326->102100
    let centerPt = new Point(centerPtGeometry);
    let webMercatorPt = WebMercatorUtils.geographicToWebMercator(centerPt);

    //create Circle Geometry
    let circleGeometry = new Circle(webMercatorPt,{
      "radius": radius
    });

    //create LineGeometry
    let polyline = {
      type: "polyline",  // autocasts as new Polyline()
      paths: circleGeometry.rings,
      spatialReference:{"wkid":102100}
    };

    //create line symbol
    let lineType = "simple-line";
    let lineColor = outlineSymbol?.colorAndTransp || [30, 144, 255, 0.6];
    let lineWidth = outlineSymbol?.width || 2;
    let lineStyle = outlineSymbol?.style || "dash";
    let lineSymbol = {
      type:lineType,
      color:lineColor,
      width:lineWidth,
      style:lineStyle
    }

    let lineGraphic = new Graphic({
      geometry:polyline,
      symbol:lineSymbol
    });
    lineGraphic.id = circleId;
    lineGraphic.type = circleType;
    let field = {
      id:circleId,
      type:circleType
    }
    lineGraphic.attributes = field

    this.fenceLayer.add(lineGraphic);

    return {
      message:"调用成功！",
      status:0,
      result:lineGraphic
    }
  }

  public async deleteCircleOutline(params:IFenceDelete):Promise<IResult>{
    return await this.clearMonitorArea(params);
  }

  public async createPlaceFence(params:IElectronicFenceParameter):Promise<IResult>{
    if(!this.fenceLayer){
      await this.createOverlayLayer();
    }

    type MapModules = [
      typeof import('esri/Graphic'),
      typeof import('esri/geometry/Point'),
      typeof import('esri/geometry/support/jsonUtils'),
      typeof import('esri/geometry/support/webMercatorUtils')
    ];
    const [Graphic,Point,geometryJsonUtils,WebMercatorUtils] = await (loadModules([
      'esri/Graphic',
      'esri/geometry/Point',
      'esri/geometry/support/jsonUtils',
      'esri/geometry/support/webMercatorUtils',
    ]) as Promise<MapModules>);

    //场所围栏初始坐标
    var ptsGeometry = params.pointsGeometry;
    //场所围栏id
    if(typeof params.placeFenceId === "string"){
      this.fenceId = parseInt(params.placeFenceId,10);
    }
    else {
      this.fenceId = params.placeFenceId
    }

    let centerResults = params.centerResults;
    if(!this.fenceId){
      return {
        message:"invalidate placeFence ID,input only number!",
        status:0
      };
    }

    //判断是否存在id值为placeFenceId的围栏,有则删除
    await this.clearMonitorArea({ids:[this.fenceId.toString()]});

    let trackFeatures:__esri.Graphic[] = [];
    let featuresCount = 0;

    ptsGeometry.forEach((ptGeometry)=>{
      //点位加载
      let point = new Point({
        x:ptGeometry[0],
        y:ptGeometry[1]
      }) as any;
      //判断点位是否需要进行投影
      if (this.view.spatialReference.isWebMercator) {
        point = WebMercatorUtils.geographicToWebMercator(point);
      }
      //点位生成覆盖物
      let graphic:any = new Graphic(point);
      graphic.id = "trackPoint" + featuresCount++;
      graphic.type = "trackPoints";
      //加载点位覆盖物
      trackFeatures.push(graphic);
    })

    let routeUrl = "http://128.64.151.245:6080/arcgis/rest/services/WuLuMuQi/wlmq_road_analyst/NAServer/Route";
    await this.solveRoute(routeUrl,trackFeatures).then(async (results)=>{
      if(!results){
        console.log("cannot solve the routes!","color: blue;font-size:13px");
        return false;
      }
      else {
        this.endPtsGeometryArray = results;
        // this.endPtsGeometryArray = paths[0];
        await this.createPolygonGraphics();
        if(this.fenceGraphic){
          console.log(this.fenceGraphic);
          this.fenceLayer.add(this.fenceGraphic);
          if(centerResults){
            await this.view.goTo(this.fenceGraphic.geometry.extent.expand(2));
          }
        }
        await this.afterOneFenceFinished();
      }
    })

    return {
      message:"finish on place fence",
      status:0
    }
  }

  public async createLineFence(params:IElectronicFenceParameter):Promise<IResult>{
    return {
      message:"not finish",
      status:0
    }
  }

  public async createElectFenceByEndptsConnection(params:IElectronicFenceParameter):Promise<IResult>{
    return {
      message:"not finish",
      status:0
    }
  }

  public async showEditingLabel(params:IElectronicFenceParameter):Promise<IResult>{
    return {
      message:"not finish",
      status:0
    }
  }

  public async removeEditingLabel(params:IFenceDelete):Promise<IResult>{
    return {
      message:"not finish",
      status:0
    }
  }

  private async clearMonitorArea(params:IFenceDelete,overlayLayer?:__esri.GraphicsLayer):Promise<IResult> {
    let ids = params.ids || [];
    let types = params.types || [];
    let message = params.message;
    let delCount = 0;
    if (!ids && !types) {
      this.fenceLayer.removeAll();
    }

    const searchLayer = overlayLayer ? overlayLayer : this.fenceLayer;
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
        delCount++;
        i--;
      }
    }
    return {
      status: 0,
      message: 'ok',
      result: message? message+delCount:`成功删除${delCount}个布控区域`
    }
  }

  private async _doBuffer(graphic:any, bufferDistance:number, level:number):Promise<__esri.Polygon>{
    const [GeometryEngine,GeometryService] = await loadModules([
      'esri/geometry/geometryEngine',
      'esri/tasks/GeometryService'
    ]);

    //this.bufferLayer.add(new Graphic(geometry), new SimpleMarkerSymbol());
    let geometry = graphic.geometry;

    let bufferPolygon;
    if (bufferDistance > 0 && geometry) {
      //如果是 WGS-84或Web Mercator坐标系，使用geodesicBuffer。其他坐标系使用buffer
      bufferPolygon =
        this.view.spatialReference.wkid === 4326 || 102100
          ? GeometryEngine.geodesicBuffer(
          geometry,
          bufferDistance,
          GeometryService.UNIT_METER
          )
          : GeometryEngine.buffer(geometry, bufferDistance, GeometryService.UNIT_METER);
    } else {
      bufferPolygon = geometry;
    }

    return bufferPolygon;
  }

  private async solveRoute(url:string,features:__esri.Graphic[]):Promise<any>{
    let onePath:any = [];

    if(!features){
      throw new Error("error,missing features!");
    }
    await this.requireRoute(url,features).then((value:any)=>{
      let paths = value.routeResults[0].route.geometry.paths;
      //处理结果有两条路径情况（较少,通常paths.length = 1）
      if(paths.length == 1){
        onePath = paths[0];
      }else if(paths.length > 1){
        for(let path of paths){
          for(let pathArray of path){
            onePath.push(pathArray);
          }
        }
      }else {
        console.log("error in route value!");
      }
    }).catch((err:any)=>{
      console.log(err);
    })

    return onePath;
  }

  //向服务器请求数据
  private async requireRoute(url:string,features:__esri.Graphic[]):Promise<__esri.RouteResult>{
    const [RouteTask,RouteParameters,FeatureSet] = await loadModules([
      "esri/tasks/RouteTask",
      "esri/tasks/support/RouteParameters",
      "esri/tasks/support/FeatureSet",
    ]);

    let routeTask = new RouteTask(url);
    let featureSet = new FeatureSet();
    let routeParams = new RouteParameters({
      stops: featureSet,
      outSpatialReference: {
        // autocasts as new SpatialReference()
        wkid: 4326
      },
      returnRoutes:true,
      returnStops:true
    });

    routeParams.stops.features = features;
    return await routeTask.solve(routeParams);
  }
  //根据点坐标按直线首尾连接生成场所
  private async createPolygonGraphics() {
    type MapModules = [
      typeof import('esri/Graphic'),
      typeof import('esri/geometry/Polygon'),
      typeof import('esri/geometry/support/webMercatorUtils'),
    ];
    const [Graphic,Polygon,WebMercatorUtils] = await (loadModules([
      'esri/Graphic',
      'esri/geometry/Polygon',
      'esri/geometry/support/webMercatorUtils',
    ]) as Promise<MapModules>);

    let polygon = new Polygon({
      rings:[this.endPtsGeometryArray]
    });
    let webMercatorPolygon = WebMercatorUtils.geographicToWebMercator(polygon);
    let sfs = {
      type: "simple-fill",  // autocasts as new SimpleFillSymbol()
      color: this.bufferColors[this.fenceId-1],
      style: "solid",
      outline: {  // autocasts as new SimpleLineSymbol()
        color: "white",
        width: 1
      }
    }
    this.fenceGraphic = new Graphic({
      geometry:webMercatorPolygon,
      symbol:sfs,
    });
    this.fenceGraphic.type = "placeFence";
    this.fenceGraphic.id = this.fenceId;
  }
  //单个围栏完成之后的操作
  private async afterOneFenceFinished() {
    //针对正在操作的图形上面的端点重置
    // this.endPointGraphicsArray = [];
    //端点坐标重置
    this.endPtsGeometryArray = [];
    //当前围栏id还原
    this.fenceId = -1;
    this.fenceGraphic = null;
    //重排序围栏
    await this.reorderGraphics();
  }

  //对地图上的围栏进行重排序
  private async reorderGraphics () {
    function compare(value1:any,value2:any){
      if (value1.id < value2.id){
        return -1;
      }else if (value1.id > value2.id){
        return 1;
      }else{
        return 0;
      }
    }
    if(this.fenceLayer.graphics.length <= 1){
      return;
    }
    else{
      this.fenceLayer.graphics.sort(compare);
    }
  }

}