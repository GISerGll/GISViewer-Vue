import {
  IOverlayParameter,
  IPointSymbol,
  IResult,
  ITrackPlayback,
  IOverlayDelete,
  IFindParameter, IPolylineSymbol, IPolygonSymbol, IPointGeometry
} from '@/types/map';
import {loadModules} from "esri-loader";

export default class TrackPlayback {
  private static trackPlayback:TrackPlayback
  private movingPtLayer!: __esri.GraphicsLayer
  private trackLineLayer!: __esri.GraphicsLayer
  private view!: __esri.MapView
  //小车行进步长设定
  private stepLength: number;

    private defaultLineSymbol = {
        type: "simple-line", //line-2d/line-3d
        color: [70, 235, 255],
        // opacity: symbol.opacity,
        width: 4
    }


    constructor(view: __esri.MapView) {
        this.view = view
      this.stepLength = 0.0005
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
        this.view.map.addMany([this.movingPtLayer,this.trackLineLayer]);
    }

    public async startTrackPlayback(params:ITrackPlayback):Promise<IResult>{
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

      const lineGraphic = new Graphic({
        geometry:lineGeometry,
        symbol: lineSymbol || this.defaultLineSymbol,
      });

      if (!this.movingPtLayer) {
        await this.createOverlayLayer();
      }
      await this.trackLineLayer.add(lineGraphic);

        //start moving the vehicle
      await this.movingPt(trackPts);
        return {
            status:0,
            message:"ok",
            result:"not implement"
        }
    }

    public async startRealTrackPlayback(params:ITrackPlayback):Promise<IResult>{
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
      await this.calculateMovingPoints(trackPoints,orderAndNum).then(async value => {
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
            await this.movingPtLayer.add(pictureGraphic);
          }
        }
      });

      console.log(this.movingPtLayer.graphics);
      let numOfCars = this.movingPtLayer.graphics.length;
      console.log(numOfCars);
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
      },50)
    }

    private async calculateMovingPoints(trackPoints:Array<Array<number>>,orderAndNum:any):Promise<any>{
      var movingPointsCoordinates = [];
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
}