import {
  IResult,
  ITrackPlaybackParameter,
  ITrackPlayback
} from '@/types/map';
import {loadModules} from "esri-loader";
import Geometry = __esri.geometry.Geometry;
import Graphic = __esri.Graphic;
import {OverlayArcgis2D} from "@/plugin/gis-viewer/widgets/Overlays/arcgis/OverlayArcgis2D"

export default class TrackPlayback {
  private static trackPlayback:TrackPlayback
  private movingPtLayer!: __esri.GraphicsLayer
  private trackLineLayer!: __esri.GraphicsLayer
  private view!: __esri.MapView
  private interval!: any
  //小车行进步长设定
  private stepLength: number
  private movingMsgObj: {
    sumOfRoads:number,
    sumOfIds:number,
    currentId:number,
    currentRoad:number,
    currentStatus:string,
    tempCache:any
  }
  private intervalTime: number
  private canGo: Boolean

  private defaultDotSymbol = {
    type: "simple-line", //line-2d/line-3d
    style:"short-dot",
    color: [8, 146, 251],
    // opacity: symbol.opacity,
    width: 2,
    cap:"square"
  }
  private defaultLineSymbol = {
    type: "simple-line", //line-2d/line-3d
    style:"solid",
    color: [8, 146, 251],
    // opacity: symbol.opacity,
    width: 4
  }
  private alarmDotSymbol = {
    type: "simple-line", //line-2d/line-3d
    style:"short-dot",
    color: [244, 26, 26],
    // opacity: symbol.opacity,
    width: 2,
    cap:"square"
  }
  private alarmLineSymbol = {
    type: "simple-line", //line-2d/line-3d
    style:"solid",
    color: [244, 26, 26],
    // opacity: symbol.opacity,
    width: 4
  }

  constructor(view: __esri.MapView) {
    this.view = view
    this.stepLength = 0.0005
    this.movingMsgObj = {
      sumOfRoads:0,
      sumOfIds:0,
      currentId:0,
      currentRoad:0,
      currentStatus:"normal",
      tempCache:{}
    }
    this.intervalTime = 100;
    this.canGo = true;
  }

  public static getInstance(view: __esri.MapView){
    if (!TrackPlayback.trackPlayback) {
      TrackPlayback.trackPlayback = new TrackPlayback(view);
    }

    return TrackPlayback.trackPlayback;
  }

  private async createOverlayLayer(){
    type MapModules = [typeof import('esri/layers/GraphicsLayer')];
    const [GraphicsLayer] = await (loadModules([
      'esri/layers/GraphicsLayer'
    ]) as Promise<MapModules>);

    this.movingPtLayer = new GraphicsLayer({
      id:"trackPlayback_movingPt"
    });
    this.trackLineLayer = new GraphicsLayer({
      id:"trackPlayback_trackLine"
    });
    this.view.map.addMany([this.trackLineLayer,this.movingPtLayer]);
  }
  //实际路径轨迹回放，根据一组点坐标通过NAServer服务分析路径得出路线回放
  public async startRealTrackPlayback(params:ITrackPlaybackParameter):Promise<IResult>{
    const [Graphic] = await loadModules([
      'esri/Graphic',
    ]);

    let url = params.routeUrl;
    if(!url){
      throw new Error("url address required!");
    }
    let trackPoints = params.trackPoints;
    let pathObjArray:ITrackPlayback[] = [];
    //因为arcgis server版本或者网络数据集原因，目前返回的结果只能是单一路径，所以采用多次请求的方式
    //trackPoints => loop(require date from network => route result) =>
    // combined and return one
    for(let trackPoint of trackPoints){
      let pathObj:any= {
        time:0,
        path:[],
        speed:0,
        features:[]
      };
      if(Object.prototype.toString.call(trackPoint) === '[object Object]'){
        let fromPtGeometry = trackPoint.from;
        let toPtGeometry = trackPoint.to;
        let fromGraphic = new Graphic({
          geometry:{
            type:"point",
            longitude:fromPtGeometry[0],
            latitude:fromPtGeometry[1]
          }
        });

        let toGraphic = new Graphic({
          geometry:{
            type:"point",
            longitude:toPtGeometry[0],
            latitude:toPtGeometry[1]
          }
        });
        let features = [fromGraphic,toGraphic]
        // let path = await this.solveRoute(routeTask,routeParams);
        // pathObj.path = await this.solveRoute(url,features);
        pathObj.features = features;
        pathObj.time = trackPoint.time || 0;
        if(trackPoint.stage){
          pathObj.stage = trackPoint.stage;
        }
        pathObjArray.push(pathObj);
      }
    }

    let promises = [];
    for(let pathObj of pathObjArray){
      promises.push(this.solveRoute(url,pathObj));
    }

    Promise.all(promises).then(async () => {
      //根据time分析得出每段行进速率
      // input:[{path:[coordinate...],time:number}...]
      // return:[{path:[coordinate...],time:number,speed:number}...]
      pathObjArray = await this.calculateSpeed(pathObjArray);
      //获取每段路径小车需要移动的次数 & 展示小车轨迹
      //input:[{path:[coordinate...],time:number,speed:number}...]
      //output:[{path:[coordinate...],time:number,speed:number,movingLength:number}...]
      for(let pathObj of pathObjArray){
        //展示小车移动轨迹
        await this.showTrackLine(pathObj);
        //获取每段路径小车需要移动的次数，为小车移动做准备
        pathObj = await this.prepareForCarMove(pathObj);
      }

      //得出小车每段的起点id和终点id
      //input:[{path:[coordinate...],time:number,speed:number,movingLength:number}...]
      //output:[{path:[coordinate...],time:number,speed:number,startId:number,endId:number,movingLength:number}...]
      pathObjArray = await this.calculateId(pathObjArray);
      //分段展示小车移动
      // await this.showMovingCar(pathObjArray[0])
      await this.movingIteration(pathObjArray);
    });

    return {
      status:0,
      message:"ok",
      result:"not implement"
    }
  }
  //直线轨迹回放，根据一组点坐标直接连成直线回放
  public async startTrackPlayback(params:ITrackPlaybackParameter):Promise<IResult>{
    //solve the parameter
    let trackPts = params.trackPoints;
    if(!trackPts.length){
      throw new Error("please check out the trackPoints!")
    }
    let lineSymbol = params.trackLineSymbol;

    //put the line on the screen
    const [Graphic, Polyline] = await loadModules([
      'esri/Graphic',
      'esri/geometry/Polyline'
    ]);

    let lineGeometry = new Polyline({
      paths: trackPts,
      spatialReference: { wkid:4326 }
    });

    let lineGraphic = new Graphic({
      geometry:lineGeometry,
      symbol: lineSymbol || this.defaultLineSymbol,
    });

    if (!this.trackLineLayer) {
      await this.createOverlayLayer();
    }
    await this.trackLineLayer.add(lineGraphic);

    //start moving the vehicle
    let trackPointsArray = [];
    for(let trackPoint of trackPts){
      trackPointsArray.push(trackPoint.from,trackPoint.to);
    }
    await this.movingPt(trackPointsArray);
    return {
      status:0,
      message:"ok",
      result:"not implement"
    }
  }

  private async movingPt(params:Array<Array<number>>){
    let trackPoints = params;
    //轨迹上每条线段需要移动的次数
    let numOfSegmentPoints = null;
    //[i,numOfSegmentPoints]
    let orderAndNum = [];
    //每条线段的长度
    let segmentDistance = null;
    //收集trackPoints在每条线段所需要移动的次数[2.3,3.4,...2.1];
    let lineDistance = 0;
    const [Graphic] = await loadModules([
      'esri/Graphic'
    ]);

    for(let i=0;i<trackPoints.length-1;i++){
      segmentDistance = Math.sqrt(Math.pow(trackPoints[i][0]-trackPoints[i+1][0],2)+Math.pow(trackPoints[i][1]-trackPoints[i+1][1],2));
      //线段长度小于步长，则此条线段只需要移动一次，即从上一个点直接移动到下一个点
      if(segmentDistance <= this.stepLength){
        numOfSegmentPoints = 1;
        orderAndNum.push(1);
      }
      else{
        numOfSegmentPoints = Math.ceil(segmentDistance/this.stepLength);
        orderAndNum.push(numOfSegmentPoints);
      }
      lineDistance += segmentDistance;
    }

    //计算得出每条线段中小车移动的准确坐标
    await this.calculateMovingPoints(trackPoints,orderAndNum).then(value => {
      for(let i=0;i<value.length;i++){
        let testArray = value[i];
        for( let j=0;j<testArray.length;j++){
          let symbol = {
            type: "picture-marker",  // autocasts as new PictureMarkerSymbol()
            url:"assets/image/icon_car_blue.png",
            width: "17px",
            height: "23px",
            angle:testArray[j].angle
          };
          let pictureGraphic = new Graphic({
              geometry:{
                type:"point",
                longitude:testArray[j].coordinate[0],
                latitude:testArray[j].coordinate[1]
              },
              symbol:symbol
            },
          );
          //将所有小车隐藏
          pictureGraphic.visible = false;
          this.movingPtLayer.add(pictureGraphic);
        }
      }
    });

    let numOfCars = this.movingPtLayer.graphics.length;
    let count = 0;

    let interval = await setInterval(()=>{
      //先隐藏前一个
      if(count){
        this.movingPtLayer.graphics.getItemAt(count-1).visible = false;
      }

      if(count === numOfCars){
        count = 0;
      }
      this.movingPtLayer.graphics.getItemAt(count).visible = true;
      count++;
    },20)
  }
  //向服务器发送
  private async requireRoute(url:string,features:__esri.Graphic[]):Promise<__esri.RouteResult>{
    const [RouteTask,RouteParameters,FeatureSet,urlUtils] = await loadModules([
      "esri/tasks/RouteTask",
      "esri/tasks/support/RouteParameters",
      "esri/tasks/support/FeatureSet",
      "esri/core/urlUtils"
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
    return routeTask.solve(routeParams);
    // await this.solveRoute(routeTask,routeParams);
  }

  private async solveRoute(url:string,params:ITrackPlayback):Promise<any>{
    let onePath:any = [];
    let features = params.features;
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

    params.path = onePath;
  }

  private async prepareForCarMove(params:ITrackPlayback):Promise<ITrackPlayback>{
    let trackPoints = params.path;
    let stage = params.stage;
    //轨迹上每条线段需要移动的次数
    let numOfSegmentPoints = null;
    //[i,numOfSegmentPoints]
    let orderAndNum = [];
    //每条线段的长度
    let segmentDistance = null;
    //收集trackPoints在每条线段所需要移动的次数[2.3,3.4,...2.1];
    let lineDistance = 0;
    const [Graphic] = await loadModules([
      'esri/Graphic'
    ]);

    for(let i=0;i<trackPoints.length-1;i++){
      segmentDistance = Math.sqrt(Math.pow(trackPoints[i][0]-trackPoints[i+1][0],2)+Math.pow(trackPoints[i][1]-trackPoints[i+1][1],2));
      //线段长度小于步长，则此条线段只需要移动一次，即从上一个点直接移动到下一个点
      if(segmentDistance <= this.stepLength){
        numOfSegmentPoints = 1;
        orderAndNum.push(1);
      }
      else{
        numOfSegmentPoints = Math.ceil(segmentDistance/this.stepLength);
        orderAndNum.push(numOfSegmentPoints);
      }
      lineDistance += segmentDistance;
    }

    let trackPlaybackObj = params;
    let movingLength = 0;
    //计算得出每条线段中小车移动的准确坐标
    await this.calculateMovingPoints(trackPoints,orderAndNum).then(value => {
      for(let i=0;i<value.length;i++){
        let testArray = value[i];
        for( let j=0;j<testArray.length;j++){
          let symbol = {
            type: "picture-marker",  // autocasts as new PictureMarkerSymbol()
            url:"assets/image/icon_car_blue.png",
            width: "17px",
            height: "23px",
            angle:testArray[j].angle
          };
          let pictureGraphic = new Graphic({
              geometry:{
                type:"point",
                longitude:testArray[j].coordinate[0],
                latitude:testArray[j].coordinate[1]
              },
              symbol:symbol
            },
          );

          movingLength++;
          //将所有小车隐藏
          pictureGraphic.visible = false;
          pictureGraphic.type = stage;
          this.movingPtLayer.add(pictureGraphic);
        }
      }
    });
    trackPlaybackObj.movingLength = movingLength;
    return trackPlaybackObj;
  }
  //展示完整轨迹
  private async showTrackLine(params:ITrackPlayback){
    let paths = params.path;
    const [Graphic, Polyline] = await loadModules([
      'esri/Graphic',
      'esri/geometry/Polyline'
    ]);

    let lineGeometry = new Polyline({
      paths: paths,
      spatialReference: { wkid:4326 }
    });

    let stage = params.stage;
    let symbol:any;
    switch (stage) {
      case "normal":
        symbol = this.defaultDotSymbol;
        break;
      case "alarm":
        symbol = this.alarmDotSymbol;
        break;
      default:
        symbol = this.defaultDotSymbol;
    }
    let lineGraphic = new Graphic({
      geometry:lineGeometry,
      symbol: symbol,
    });

    if (!this.trackLineLayer) {
      await this.createOverlayLayer();
    }
    await this.trackLineLayer.add(lineGraphic);
  }
  //展示移动轨迹
  private async showMovingTrackLine(paths:number[][],symbolType:string){
    const [Graphic, Polyline] = await loadModules([
      'esri/Graphic',
      'esri/geometry/Polyline'
    ]);

    let lineGeometry = new Polyline({
      paths: paths,
      spatialReference: { wkid:4326 }
    });
    let symbol:any;
    switch (symbolType) {
      case "normal":
        symbol = this.defaultLineSymbol;
        break;
      case "alarm":
        symbol = this.alarmLineSymbol;
        break;
      default:
        symbol = this.defaultLineSymbol;
    }
    let lineGraphic = new Graphic({
      geometry:lineGeometry,
      symbol: symbol,
    });

    if(symbol === this.alarmLineSymbol){
      lineGraphic.type = "alarm";
    }else if(symbol === this.defaultLineSymbol){
      lineGraphic.type = "normal";
    }
    if (!this.trackLineLayer) {
      await this.createOverlayLayer();
    }
    await this.trackLineLayer.add(lineGraphic);
  }
  //展示从当前id到终点的一段路
  private async showAPartRoad() {
    let numOfCars = this.movingMsgObj.sumOfIds;

    for(let i=this.movingMsgObj.currentId;i<numOfCars;i++){
      if(this.canGo){
        this.movingMsgObj.currentId = i;
        await this.showOneMovingCar(i)
      }
      else {
        return "pause"
      }
    }
  }
  //展示一段路中的某一点
  private async showOneMovingCar(startId:number) {
    // let intervalTime = sleepTime || 100;
    let path;
    if(startId){
      let graphic1:any = this.movingPtLayer.graphics.getItemAt(startId-1);
      let graphic2:any = this.movingPtLayer.graphics.getItemAt(startId);
      let stage = graphic1.type;
      path = [[graphic1.geometry.x, graphic1.geometry.y],[graphic2.geometry.x, graphic2.geometry.y]]
      await this.showMovingTrackLine(path,stage);
      await this.sleep(this.intervalTime);
      this.movingPtLayer.graphics.getItemAt(startId-1).visible = false;
    }
    this.movingPtLayer.graphics.getItemAt(startId).visible = true;
  }
  //promise+setTimeout =>sleep
  private sleep(ms:number):Promise<any>{
    return new Promise((resolve)=>setTimeout(()=>{
      resolve();
    },ms));
  }
  //小车循环移动函数
  private async movingIteration(params:ITrackPlayback[]){
    let length = this.movingPtLayer.graphics.length;
    if(this.movingMsgObj.currentId === this.movingMsgObj.sumOfIds-1){
      //id>0,已经运行过
      this.movingMsgObj.currentId = 0;
      this.movingMsgObj.currentRoad = 0;
    }
    else {
      //id=0,未运行过
      this.movingMsgObj.sumOfIds = length;
      this.movingMsgObj.sumOfRoads = params.length;
      this.movingMsgObj.tempCache = params
    }

    let movingStatus:string = "normal";

    await this.showAPartRoad().then((value)=>{
      //value = "pause",处理暂停情况
      if(value === "pause"){
        movingStatus = value;
        console.log("pause playback");
      }
      else {
          //删除最后一辆小车
          this.movingPtLayer.graphics.getItemAt(length-1).visible = false;
          //删除运动轨迹
          const overlay = OverlayArcgis2D.getInstance(this.view);
          overlay.deleteOverlays({types:["alarm","normal"]},this.trackLineLayer);
          //继续迭代
          this.movingIteration(this.movingMsgObj.tempCache);
      }
    });

    return movingStatus;
  }

  private async goOnMovingIteration(){
    let movingStatus:string = "normal";

    await this.showAPartRoad().then((value)=>{
      //value = "pause",处理暂停情况
      if(value === "pause"){
        movingStatus = value;
        console.log("pause playback");
      }
      else {
        this.movingMsgObj.currentRoad = 0;
        this.movingMsgObj.currentId = 0;
        this.movingPtLayer.graphics.getItemAt(length-1).visible = false;

        const overlay = OverlayArcgis2D.getInstance(this.view);
        overlay.deleteOverlays({types:["alarm","normal"]},this.trackLineLayer);

        this.goOnMovingIteration();
      }
    });

    return movingStatus;
  }
  //小车行进速度
  private async calculateSpeed(params:ITrackPlayback[]):Promise<ITrackPlayback[]>{
    const [Polyline] = await loadModules([
      'esri/geometry/Polyline'
    ]);

    //accpet params[{path,time}],target return value[{path,time,speed}]
    let pathObjArray = params;
    //get every path average speed;
    for(let pathObj of pathObjArray){
      let path = pathObj.path;
      let lineGeometry = new Polyline({
        paths: path,
        spatialReference: { wkid:4326 }
      });
      let pathLength = await this.calculatePolylineLength(lineGeometry);
      let pathTime = pathObj.time;
      let tempSpeed = pathLength/pathTime;
      pathObj.speed = tempSpeed;
      pathObj.speedToString = ((pathObj.speed).toFixed(3)).toString();
    }
    let pathMinSpeed:number = pathObjArray[0].speed;
    //get the min speed
    for(let pathObj of pathObjArray){
      if(pathMinSpeed > pathObj.speed){
        pathMinSpeed = pathObj.speed
      }
    }
    //get speed/minSpeed
    for(let pathObj of pathObjArray){
      pathObj.speed = pathObj.speed/pathMinSpeed;
    }

    return pathObjArray;
  }

  private async calculatePolylineLength(params:Geometry):Promise<number>{
    const [geometryEngine] = await loadModules([
      'esri/geometry/geometryEngine'
    ]);

    return geometryEngine.geodesicLength(params,"miles");
  }

  private async calculateMovingPoints(trackPoints:Array<Array<number>>,orderAndNum:any):Promise<any>{
    let movingPointsCoordinates = [];
    for(let j=0;j<orderAndNum.length;j++){
      let num = orderAndNum[j];

      let y2 = trackPoints[j+1][1];
      let y1 = trackPoints[j][1];
      let x2 = trackPoints[j+1][0];
      let x1 = trackPoints[j][0];

      let p = (y2 - y1)/(x2 - x1);

      let segmentPoints = [];
      let segmentStartPoint:any = {};

      let angle = await TrackPlayback.calculateAngle(x1,y1,x2,y2).then(value => value);

      segmentStartPoint.coordinate = trackPoints[j];
      segmentStartPoint.angle = angle;
      segmentPoints.push(segmentStartPoint);
      if(num === 1){
        console.log("jump!");
      }
      else{
        let midx = segmentStartPoint.coordinate[0];
        let midy = segmentStartPoint.coordinate[1];
        for(let i=0;i<num-1;i++){
          if (Math.abs(p) === Number.POSITIVE_INFINITY) {
            if(y2>y1){
              midy += this.stepLength;
            }
            else {
              midy -= this.stepLength;
            }
          } else {
            if (x2 < x1) {
              midx -= (1 / Math.sqrt(1 + p * p)) * this.stepLength;
            } else {
              midx =
                midx + (1 / Math.sqrt(1 + p * p)) * this.stepLength;
            }

            if (y2 < y1) {
              midy -= (Math.abs(p) / Math.sqrt(1 + p * p)) * this.stepLength;
            } else {
              midy += (Math.abs(p) / Math.sqrt(1 + p * p)) * this.stepLength;
            }
          }
          let obj:any = {};
          obj.coordinate = [midx,midy];
          obj.angle = angle;
          segmentPoints.push(obj);
        }
      }
      movingPointsCoordinates.push(segmentPoints);
    }

    return movingPointsCoordinates;
  }

  private static async calculateAngle(x1:number,y1:number,x2:number,y2:number) {
    var tan =
      (Math.atan(Math.abs((y2 - y1) / (x2 - x1))) * 180) / Math.PI + 95;
    //第一象限
    if (x2 > x1 && y2 > y1) {
      return -tan + 180;
    }
    //第二象限
    else if (x2 > x1 && y2 < y1) {
      return tan;
    }
    //第三象限
    else if (x2 < x1 && y2 > y1) {
      return tan - 180;
    }
    //第四象限
    else {
      return -tan;
    }
  }

  private async calculateId(params:ITrackPlayback[]):Promise<ITrackPlayback[]>{
    let startId = 0;
    let endId = 0;

    for(let pathObj of params){
      if(pathObj.movingLength){
        if(endId){
          startId = endId + 1;
        }
        else {
          startId += endId;
        }
        endId = startId + pathObj.movingLength -1;
      }

      pathObj.startId = startId;
      pathObj.endId = endId;
    }

    return params;
  }

  public adjustPlaybackSpeed(rate:number){
    if(rate >= 2){
      rate = 2;
    }else if(rate<2 && rate >= 1.5){
      rate = 1.5
    }else if(rate <1.5 && rate>= 1){
      rate = 1
    }else if(rate <1){
      rate = 0.5
    }
    this.intervalTime = this.intervalTime * (1/rate);
  }

  public pausePlayback() {
    this.canGo = false;
  }

  public goOnPlayback() {
    if(this.canGo){
      console.log("该播放在执行！")
      return;
    }
    this.canGo = true;
    let result = this.movingIteration(this.movingMsgObj.tempCache);
  }

  public nextRoad(){

  }
  public lastRoad(){

  }

}