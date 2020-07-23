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
  private static stepLength: 0.01;

    private overlayLayer!: __esri.GraphicsLayer
    private view!: __esri.MapView

    private defaultLineSymbol = {
        type: "simple-line", //line-2d/line-3d
        color: [70, 235, 255],
        // opacity: symbol.opacity,
        width: 4
    }


    constructor(view: __esri.MapView) {
        this.view = view
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
        this.overlayLayer = new GraphicsLayer({
            id:"trackPlayback"
        });
        this.view.map.add(this.overlayLayer);
    }

    public async startTrackPlayback(params:ITrackPlayback):Promise<IResult>{
      //solve the parameter
      let trackPts = params.trackPoints;
      if(!trackPts.length){
        throw new Error("please check out the trackPoints!")
      }
      let lineSymbol = params.trackLineSymbol;

      //put the line on the screen
      const [Graphic, geometryJsonUtils,Polyline] = await loadModules([
        'esri/Graphic',
        'esri/geometry/support/jsonUtils',
        'esri/geometry/Polyline'
      ]);

      let onePath = [trackPts];
      let lineGeometry = new Polyline({
        paths: onePath,
        spatialReference: { wkid:4326 }
      });

      const lineGraphic = new Graphic({
        geometry:lineGeometry,
        symbol: lineSymbol || this.defaultLineSymbol,
      });

      if (!this.overlayLayer) {
        await this.createOverlayLayer();
      }
      await this.overlayLayer.add(lineGraphic);

        //start moving the vehicle
      await TrackPlayback.movingPt(trackPts);
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

    private static async movingPt(params:Array<Array<number>>):Promise<IResult>{
      let trackPoints = params;
      //轨迹上每条线段需要移动的次数
      let numOfSegmentPoints = null;
      //[i,numOfSegmentPoints]
      let orderAndNum = [];
      //每条线段的长度
      let segmentDistance = null;
      //收集trackPoints在每条线段所需要移动的次数[2.3,3.4,...2.1];
      let lineDistance = 0;
      //小车行进步长设定
      let stepLength = 0.01

      for(let i=0;i<trackPoints.length-1;i++){
        segmentDistance = Math.sqrt(Math.pow(trackPoints[i][0]-trackPoints[i+1][0],2)+Math.pow(trackPoints[i][1]-trackPoints[i+1][1],2));
        //线段长度小于步长，则此条线段只需要移动一次，即从上一个点直接移动到下一个点
        if(segmentDistance <= stepLength){
          numOfSegmentPoints = 1;
          orderAndNum.push(1);
        }
        else{
          numOfSegmentPoints = Math.ceil(segmentDistance/stepLength);
          orderAndNum.push(numOfSegmentPoints);
        }
        lineDistance += segmentDistance;
      }


      return {
        status:0,
        message:"ok",
        result:"not implement"
      }
    }

    private static async caculateMovingPoints(trackPoints:Array<Array<number>>,orderAndNum:any):Promise<IResult>{
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

        let angle = TrackPlayback.calculateAngle(x1,y1,x2,y2);

        segmentStartPoint.coordinate = trackPoints[j];
        segmentStartPoint.angle = angle;
        segmentPoints.push(segmentStartPoint);
        if(num === 1){
          console.log("jump!");
        }
        else{
          var midx = segmentStartPoint.coordinate[0];
          var midy = segmentStartPoint.coordinate[1];
          for(var i=0;i<num-1;i++){
            if (Math.abs(p) === Number.POSITIVE_INFINITY) {
              midy += this.stepLength;
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
            var obj:any = {};
            obj.coordinate = [midx,midy];
            obj.angle = angle;
            segmentPoints.push(obj);
          }
        }
        movingPointsCoordinates.push(segmentPoints);
      }

      return {
        status:0,
        message:"ok",
        result:movingPointsCoordinates
      }
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