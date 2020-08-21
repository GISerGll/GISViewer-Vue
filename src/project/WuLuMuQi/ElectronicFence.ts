import {
  IResult,
  IElectronicFence,
  IEditFenceLabel,
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
  private editingPtsLayer!:__esri.GraphicsLayer
  private onHandlerObj:{
    onClick:any,
    onMouseMove:any,
    onDblClick:any
  }
  private editingId!:string
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
    this.onHandlerObj = {
      onClick: null,
      onMouseMove: null,
      onDblClick: null
    }
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

    this.editingPtsLayer = new GraphicsLayer({
      id:"electronicFence_editingPtsLayer"
    })

    this.view.map.addMany([this.fenceLayer,this.editingPtsLayer]);
  }
  //四色围栏
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
  //搜索圆边界
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
    lineGraphic.attributes = {
      id:circleId,
      type:circleType
    };

    this.fenceLayer.add(lineGraphic);

    return {
      message:"调用成功！",
      status:0,
      result:lineGraphic
    }
  }
  //删除搜索圆边界
  public async deleteCircleOutline(params:IFenceDelete):Promise<IResult>{
    if(!params.ids && !params.types){
      //不输入参数删除默认类型值为"circleOultine"的圆边界
      const result = await this.clearMonitorArea({types:["circleOutline"]});
      return {
        status:0,
        message:"clear the circle Outline of default type 'circleOutline'",
        result:result.result
      }
    }
    else {
      const result = await this.clearMonitorArea({types:params.types,ids:params.ids});

      return {
        status:0,
        message:`clear the circle Outline of type:${params.types},ids:${params.ids}`,
        result:result.result
      }
    }
  }
  //场所围栏
  public async createPlaceFence(params:IElectronicFenceParameter):Promise<IResult>{
    if(!this.fenceLayer){
      await this.createOverlayLayer();
    }

    type MapModules = [
      typeof import('esri/Graphic'),
      typeof import('esri/geometry/Point'),
      typeof import('esri/geometry/support/webMercatorUtils')
    ];
    const [Graphic,Point,WebMercatorUtils] = await (loadModules([
      'esri/Graphic',
      'esri/geometry/Point',
      'esri/geometry/support/webMercatorUtils',
    ]) as Promise<MapModules>);

    //场所围栏初始坐标
    let ptsGeometry = params.pointsGeometry;
    //场所围栏id
    if(typeof params.fenceId === "string"){
      this.fenceId = parseInt(params.fenceId,10);
    }
    else {
      if(!this.fenceId){
        return {
          message:"invalidate placeFence ID,input only number!",
          status:0
        };
      }

      this.fenceId = params.fenceId
    }

    let centerResults = params.centerResults;
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
  //线路围栏
  public async createLineFence(params:IElectronicFenceParameter):Promise<IResult>{
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
      'esri/geometry/support/webMercatorUtils'
    ]) as Promise<MapModules>);

    //场所围栏初始坐标
    let ptsGeometry = params.pointsGeometry;
    //场所围栏id
    if(typeof params.fenceId === "string"){
      this.fenceId = parseInt(params.fenceId,10);
    }
    else {
      if(!this.fenceId){
        return {
          message:"invalidate placeFence ID,input only number!",
          status:0
        };
      }

      this.fenceId = params.fenceId
    }
    let centerResults = params.centerResults;

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
        return {
          status:0,
          message:"there is nothing road between the given points..."
        };
      }
      else {
        this.endPtsGeometryArray = results;
        // this.endPtsGeometryArray = paths[0];
        await this.createPolylineGraphics();
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
      message:"not finish",
      status:0
    }
  }
  //按端点生成直线围栏
  public async createElectFenceByEndPtsConnection(params:IElectronicFenceParameter):Promise<IResult>{
    this.endPtsGeometryArray = params.pointsGeometry;
    //场所围栏id
    if(typeof params.fenceId === "string"){
      this.fenceId = parseInt(params.fenceId,10);
    }
    else {
      if(!this.fenceId){
        return {
          message:"invalidate placeFence ID,input only number!",
          status:0
        };
      }

      this.fenceId = params.fenceId
    }
    let centerResults = params.centerResults;
    //场所类型,默认为场所围栏
    let fenceType = params.fenceType || "placeFence";

    await this.clearMonitorArea({ids:[this.fenceId.toString()]});
    if(this.endPtsGeometryArray.length <= 2){
      return {
        status:0,
        message:"Clear fences with the same ID attribute because of the pts' length no longer than 2"
      };
    }

    if(fenceType === "placeFence"){
      await this.createPolygonGraphics();
    }
    else if(fenceType === "lineFence"){
      await this.createPolylineGraphics();
    }
    else {
      return {
        status:0,
        message:"please check out the fenceType attribute"
      }
    }

    this.fenceLayer.add(this.fenceGraphic);
    if(centerResults){
      await this.view.goTo(this.fenceGraphic.geometry.extent.expand(2));
    }

    await this.afterOneFenceFinished();
    return {
      status:0,
      message:"finish createElectFenceByEndptsConnection",
    }
  }
  //展示编辑label
  public async showEditingLabel(params:IEditFenceLabel):Promise<IResult>{
    let geometry = params.labelGeometry;
    let isClearOtherLabels = params.clearOtherLabels === true;
    let isEditable = params.isEditable;
    let endDeleting = params.endEditing;
    let editingFenceId:string;

    if(typeof params.fenceId === "number"){
      editingFenceId = params.fenceId.toString();
    }
    else {
      if(!params.fenceId){
        return {
          message:"invalidate fence ID,input string or number!",
          status:0
        };
      }
      editingFenceId = params.fenceId
    }
    //如果上一个监听事件还在执行，则关闭
    if(this.onHandlerObj.onClick){
      this.onHandlerObj.onClick.remove();
      this.onHandlerObj.onMouseMove.remove();
      this.onHandlerObj.onDblClick.remove();
    }
    //引入模块作为promise对象
    type MapModules = [
      typeof import('esri/geometry/support/webMercatorUtils')
    ];
    const [WebMercatorUtils] = await (loadModules([
      'esri/geometry/support/webMercatorUtils',
    ]) as Promise<MapModules>);

    if(!this.fenceLayer){
      await this.createOverlayLayer();
    }
    if(isClearOtherLabels){
      this.editingPtsLayer.removeAll();
    }
    //初始化生成一个label
    await this.createSimpleAndLabelPt(editingFenceId,geometry);

    if(isEditable){
      //获取将要编辑的围栏
      let editingFence = this.getElectFence(editingFenceId);
      if(!editingFence){
        return {
          status:0,
          message:"there is no electronic fence"
        }
      }
      let geoFenceGeometry:any = WebMercatorUtils.webMercatorToGeographic(editingFence.geometry);
      let fencePtsArray:any;
      let fenceType = editingFence.type;
      if(fenceType === "placeFence"){
        fencePtsArray = geoFenceGeometry.rings[0];
      }
      else if(fenceType === "lineFence"){
        fencePtsArray = geoFenceGeometry.paths[0];
      }else {
        return {
          status:0,
          message:"can't get the electronic fence type!"
        }
      }

      //监控事件联动条件
      let canStart = false;
      let canStop = false;
      //标注点图层注册监听事件
      this.onHandlerObj.onClick = this.view.on('click',async (event)=>{
        const response = await this.view.hitTest(event);
        if (response.results.length > 0) {
          response.results.forEach((result) => {
            const graphic: any = result.graphic;
            if (graphic.type === "labelText" || graphic.type === "labelMarker") {
              canStart = true;
              this.editingId = graphic.id;
            }
          })
        }

        if(canStop && event.x){
          canStart = false;
          canStop = false;
          let pointGeometry = this.view.toMap({x: event.x, y: event.y});
          fencePtsArray[parseInt(this.editingId,10) - 1] = [pointGeometry.longitude,pointGeometry.latitude];
          await this.createElectFenceByEndPtsConnection({
            pointsGeometry:fencePtsArray,
            fenceId:editingFenceId,
            fenceType:fenceType,
            centerResults: false
          })
          await this.createSimpleAndLabelPt(this.editingId,[pointGeometry.longitude,pointGeometry.latitude]);

          if(endDeleting){
            await this.removeEditingLabel();
          }
        }
      })

      this.onHandlerObj.onMouseMove = this.view.on('pointer-move',async (event) =>{
        if(canStart){
          canStop = true;
          let pointGeometry = this.view.toMap({x: event.x, y: event.y});
          if (event.pointerId) {
            fencePtsArray[parseInt(this.editingId,10) - 1] = [pointGeometry.longitude,pointGeometry.latitude];
          }

          await this.createElectFenceByEndPtsConnection({
            pointsGeometry:fencePtsArray,
            fenceId:editingFenceId,
            fenceType:fenceType,
            centerResults: false
          })

          await this.createSimpleAndLabelPt(this.editingId,[pointGeometry.longitude,pointGeometry.latitude]);
        }
      })
    }

    return {
      message:"not finish",
      status:0
    }
  }
  //移除编辑label
  public async removeEditingLabel():Promise<any>{
    this.editingPtsLayer.removeAll();
  }

  private async clearMonitorArea(params:IFenceDelete,overlayLayer?:__esri.GraphicsLayer):Promise<IResult> {
    let ids = params.ids || [];
    let types = params.types || [];
    let message = params.message;
    let delCount = 0;
    const searchLayer = overlayLayer ? overlayLayer : this.fenceLayer;

    if (!ids.length && !types.length) {
      this.fenceLayer.removeAll();
    }
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

  private async createPolylineGraphics() {
    type MapModules = [
      typeof import('esri/Graphic'),
      typeof import('esri/geometry/Polyline'),
      typeof import('esri/geometry/support/webMercatorUtils')
    ];
    const [Graphic,Polyline,WebMercatorUtils] = await (loadModules([
      'esri/Graphic',
      'esri/geometry/Polyline',
      'esri/geometry/support/webMercatorUtils'
    ]) as Promise<MapModules>);

    let polylineGeometry = new Polyline({
      paths: [this.endPtsGeometryArray]
    });
    let webMercatorPolygon = WebMercatorUtils.geographicToWebMercator(polylineGeometry);
    let polylineSymbol = {
      type: "simple-line",  // autocasts as SimpleLineSymbol()
      color: [8, 146, 251, 255],
      width: 10
    };

    this.fenceGraphic = new Graphic({
      geometry:polylineGeometry,
      symbol:polylineSymbol,
    });

    this.fenceGraphic.attributes = {
      id:this.fenceId,
      type:"lineFence"
    };
    this.fenceGraphic.type = "lineFence";
    this.fenceGraphic.id = this.fenceId;
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
    this.fenceGraphic.attributes = {
      id:this.fenceId,
      type:"lineFence"
    };

    this.fenceGraphic.type = "placeFence";
    this.fenceGraphic.id = this.fenceId.toString();
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

  private async createSimpleAndLabelPt(id:string,geometry:number[]){
    type MapModules = [
      typeof import('esri/Graphic'),
      typeof import('esri/geometry/Point'),
      typeof import('esri/geometry/support/webMercatorUtils'),
      typeof import('esri/symbols/Font'),
      typeof import('esri/symbols/TextSymbol'),
    ];
    const [Graphic,Point,WebMercatorUtils,Font,TextSymbol] = await (loadModules([
      'esri/Graphic',
      'esri/geometry/Point',
      'esri/geometry/support/webMercatorUtils',
      'esri/symbols/Font',
      'esri/symbols/TextSymbol'
    ]) as Promise<MapModules>);

    //获取并删除前一个
    await this.getLabelPointAndRemove(id);

    let font = new Font({
      size:"20px",
      weight:"bolder"
    });

    let textSymbol = new TextSymbol(
      {
        text:id,
        font:font,
        color:"red",
      });

    let idLength = id.length;
    textSymbol.set({
      xoffset:15+(idLength-1)*5,
      yoffset:-6.5
    });

    let labelPtGeometry = new Point({
      longitude:geometry[0],
      latitude:geometry[1]
    })

    let webMercatorLabelPtGeometry = WebMercatorUtils.geographicToWebMercator(labelPtGeometry);
    let labelPointGraphic = new Graphic({
      geometry:webMercatorLabelPtGeometry,
      symbol:textSymbol
    }) as any;
    labelPointGraphic.id = id;
    labelPointGraphic.type = "labelText"

    let simplePointGraphic = new Graphic({
      geometry:labelPtGeometry,
      symbol:{
        type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
        style: "circle",
        color: "orange",
        size: "16px",  // pixels
        outline: {  // autocasts as new SimpleLineSymbol()
          color: [ 0, 0, 0 ],
          width: 0.5  // points
        }
      } as any
    }) as any;
    simplePointGraphic.id = id;
    simplePointGraphic.type = "labelMarker"

    this.editingPtsLayer.add(simplePointGraphic);
    // add the label point graphic to the map
    this.editingPtsLayer.add(labelPointGraphic);
  }

  private getLabelPointAndRemove(id:string){
    return this.clearMonitorArea({ids:[id]},this.editingPtsLayer);
  }

  private getElectFence(graphicId:string){
    for(let j = 0;j<this.fenceLayer.graphics.length;j++){
      let electFence:any = this.fenceLayer.graphics.getItemAt(j);
      if(graphicId){
        if(electFence.id === graphicId){
          return electFence;
        }
      }
      else{
        if(electFence.id === this.fenceId){
          return electFence;
        }
      }
    }
    return null;
  }
}