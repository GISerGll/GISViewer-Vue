import {
  IResult,
  ITrackPlaybackParameter,
  ITrackPlayback,
    ITrackPlaybackBDParameter
} from '@/types/map';
import DrawOverlaysBD from "@/plugin/gis-viewer/widgets/DrawOverlays/bd/DrawOverlaysBD";
import {loadModules} from "esri-loader";
import {OverlayArcgis2D} from "@/plugin/gis-viewer/widgets/Overlays/arcgis/OverlayArcgis2D";


declare let BMap:any;
declare let BMapLib:any;

export default class TrackPlaybackBD {
  private static intances: Map<string, any>;
  private view!: any;
  private stepLength: number = 0.0005;
  private movingMsgObj: {
    sumOfRoads:number,
    sumOfIds:number,
    currentId:number,
    currentRoad:number,
    currentStatus:string,
    currentSpeed:number,
    tempCache:any
  } = {
    sumOfRoads:0,
    sumOfIds:0,
    currentId:0,
    currentRoad:0,
    currentStatus:"normal",
    currentSpeed:0,
    tempCache:{}
  };
  private allGraphics:any = []
  private intervalTime: number = 100
  private canGo: Boolean = true

  private constructor(view: any) {
    this.view = view;
  }

  public static getInstance(view:any) {
    let id = view.container.id;
    if (!TrackPlaybackBD.intances) {
      TrackPlaybackBD.intances = new Map();
    }
    let intance = TrackPlaybackBD.intances.get(id);
    if (!intance) {
      intance = new TrackPlaybackBD(view);
      TrackPlaybackBD.intances.set(id, intance);
    }
    return intance;
  }

  public async startRealTrackPlayback(params:ITrackPlaybackParameter):Promise<IResult>{

    return {
      message:'not complete',
      status:0
    }
  }

  public async startTrackPlayback(params:ITrackPlaybackBDParameter):Promise<IResult>{
    const allPathsObj = params.trackPoints;
    //处理调用者输入的lineSymbol
    let defaultLineSymbol:any = params.defaultLineSymbol;
    if(!defaultLineSymbol){
      defaultLineSymbol = DrawOverlaysBD.defaultLineSymbol
    }else {
      defaultLineSymbol = this.processDefaultLineSymbol(defaultLineSymbol);
    }
    //处理调用者输入的carSymbol
    let defaultCarSymbol:any = params.defaultCarSymbol;
    if(!defaultCarSymbol){
      let size = new BMap.Size(24,24);

      let defaultIcon = DrawOverlaysBD.defaultPicMarkerSymbol.icon;
      defaultIcon = new BMap.Icon(require('../../../../../../public/assets/image/car_blue.png'),size,{
          imageSize: size
      })

      console.log(defaultIcon);
      // defaultIcon.setImageUrl();
      defaultCarSymbol = {
        icon:defaultIcon,
      }
    }else {
      defaultCarSymbol = this.processDefaultCarSymbol(defaultCarSymbol);
    }
    const moveType = params.moverType || "constant";
    const moveTimes = params.moveTimes || 1000;

    if(!allPathsObj.length){
      return {
        message:'请输入正确的坐标数组',
        status:0
      }
    }

    const allPathObj_processed:any = [];
    allPathsObj.forEach((pathObj:any,index:number) => {
      let pathCoordinates = pathObj.path;
      let pathSymbol = pathObj.trackSymbol;
      if(!pathCoordinates.length){
        console.error(`请检查第${index}段路径坐标格式是否正确！`)
        return;
      }

      //添加该段路径到地图
      this.addTrackLine(pathCoordinates,pathSymbol || defaultLineSymbol)
      let carCoordinates = this.calculateAPartRoad(pathCoordinates);
      //添加该段小车到地图
      this.addTrackCar(carCoordinates,defaultCarSymbol);

      let pathObj_processed:any = {};
      //该短路的行驶时间，用于计算小车速度
      pathObj_processed.pathTime = pathObj.time;
      //加密后的坐标，即小车实际移动的坐标
      pathObj_processed.coordinates = carCoordinates;
      //该段路的总长，用于计算小车速度
      pathObj_processed.pathLength = this.calculateLength(pathObj_processed);
      allPathObj_processed.push(pathObj_processed);

      this.movingMsgObj.sumOfIds += carCoordinates.length;
      this.movingMsgObj.sumOfRoads++;
    })
    this.movingMsgObj.tempCache = allPathObj_processed;

    await this.movingIteration();

    return {
      message:'not complete',
      status:0
    }
  }

  private calculateAPartRoad(params:number[][]):number[][]{
    let trackCoordinates = params;
    //轨迹上每条线段需要移动的次数
    let numOfSegmentPoints = null;
    //[i,numOfSegmentPoints]
    let orderAndNum = [];
    //每条线段的长度
    let segmentDistance = 0;

    for(let i=0;i<trackCoordinates.length-1;i++){
      segmentDistance = Math.sqrt(Math.pow(trackCoordinates[i][0]-trackCoordinates[i+1][0],2)+Math.pow(trackCoordinates[i][1]-trackCoordinates[i+1][1],2));
      //线段长度小于步长，则此条线段只需要移动一次，即从上一个点直接移动到下一个点
      if(segmentDistance <= this.stepLength){
        numOfSegmentPoints = 1;
        orderAndNum.push(1);
      }
      else{
        numOfSegmentPoints = Math.ceil(segmentDistance/this.stepLength);
        orderAndNum.push(numOfSegmentPoints);
      }
    }

    //计算得出每条线段中小车移动的准确坐标
    const pointsCoordinates = this.calculateMovingPoints(trackCoordinates,orderAndNum)
    return pointsCoordinates;
  }

  private calculateMovingPoints(trackPoints:number[][],orderAndNum:any) {
    let movingPointsCoordinates = [];
    debugger;
    for(let j=0;j<orderAndNum.length;j++){
      let num = orderAndNum[j];

      let y2 = trackPoints[j+1][1];
      let y1 = trackPoints[j][1];
      let x2 = trackPoints[j+1][0];
      let x1 = trackPoints[j][0];

      let p = (y2 - y1)/(x2 - x1);

      let segmentStartPoint:any = {};

      let angle = this.calculateAngle(x1,y1,x2,y2);

      segmentStartPoint.coordinate = trackPoints[j];
      segmentStartPoint.angle = angle;
      movingPointsCoordinates.push(segmentStartPoint);
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
          movingPointsCoordinates.push(obj);
        }
      }
    }

    return movingPointsCoordinates;
  }

  private calculateAngle(x1:number,y1:number,x2:number,y2:number) {
    var tan =
        (Math.atan(Math.abs((y2 - y1) / (x2 - x1))) * 180) / Math.PI + 90;
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

  private sleep(ms:number):Promise<any>{
    return new Promise((resolve)=>setTimeout(()=>{
      resolve();
    },ms));
  }
  //小车在每段路上的行进速度
  private calculateLength(params:any):number{
    let pathLength = 0;
    const pathCoordinates = params.coordinates;

    for(let i=0;i<pathCoordinates.length;i++){
      for(let j=0;j<pathCoordinates[i].length-1;j++){

        let preCoordinate = pathCoordinates[i][j].coordinate;
        let curCoordinate = pathCoordinates[i][j+1].coordinate;

        let BMapPt1 = new BMap.Point(preCoordinate[0],preCoordinate[1]);
        let BMapPt2 = new BMap.Point(curCoordinate[0],curCoordinate[1]);
        let partLength = this.view.getDistance(BMapPt1,BMapPt2);
        pathLength += partLength;
      }
    }
    return pathLength;
  }

  private async processDefaultLineSymbol(defaultSymbol:any):Promise<any>{
    let symbolOption:any = null;

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

    return symbolOption;
  }

  private async processDefaultCarSymbol(defaultSymbol:any):Promise<any>{
    const symbolOption = DrawOverlaysBD.defaultPicMarkerSymbol;
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
  }

  private addTrackLine(path:number[][],symbol:any) {
    const lineGraphic = new BMap.Polyline(this.getGeometry(path), symbol);
    this.view.addOverlay(lineGraphic);
  }

  private addTrackCar(path:any,symbol:any) {
    path.forEach((coordinateObj:any,coordinateIndex:number)=>{
      let coordinate = coordinateObj.coordinate;
      let angel = coordinateObj.angle
      let carGraphic:any = new BMap.Marker(new BMap.Point(coordinate[0],coordinate[1]),symbol);
      carGraphic.id = "trackPlaybackCar_carOrder: " + coordinateIndex;
      carGraphic.type = "trackPlayback";
      carGraphic.setRotation(angel);
      carGraphic.hide();
      this.view.addOverlay(carGraphic);

      this.allGraphics.push(carGraphic);
    })

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

  private async movingIteration(){
    if(this.movingMsgObj.currentId === this.movingMsgObj.sumOfIds-1){
      this.movingMsgObj.currentId = 0;
      this.movingMsgObj.currentRoad = 0;
    }

    let movingStatus:string = "normal";

    let start = 0;
    let end = 0;

    for(let i=0;i<this.movingMsgObj.tempCache.length;i++){
      let aPartRoad = this.movingMsgObj.tempCache[i]
      this.movingMsgObj.currentRoad = i;
      let speed = aPartRoad.pathLength/aPartRoad.time
      this.movingMsgObj.currentSpeed = speed;

      end += this.movingMsgObj.tempCache[i].coordinates.length-1;

      await this.showAPartRoad(start,end).then((value)=>{
        start = end;
        //value = "pause",处理暂停情况
        if(value < end){
          console.log("pause playback");
          return ;
        }
        else {
          if(i === this.movingMsgObj.tempCache.length -1){
            //隐藏最后一辆小车
            this.allGraphics[this.allGraphics.length-1].visible = false;
            i=0;
            start = end = 0;
          }
        }
      });
    }

    return movingStatus;
  }
  //展示从当前id到终点的一段路
  private async showAPartRoad(start:number,end:number) {
    debugger;
    for(let i=start;i<=end;i++){
      if(this.canGo){
        this.movingMsgObj.currentId = i;
        await this.showOneMovingCar(i)
      }
      else {
        return i
      }
    }

    return end;
  }
  //展示一段路中的某一点
  private async showOneMovingCar(startId:number) {
    debugger;
    let graphicLast:any;
    let graphicCur:any = this.allGraphics[startId];

    if(startId){
      graphicLast = this.allGraphics[startId-1];
      let stage = graphicLast.type;
      await this.sleep(this.intervalTime);
      graphicLast.hide();
    }
    graphicCur.show();
  }
}