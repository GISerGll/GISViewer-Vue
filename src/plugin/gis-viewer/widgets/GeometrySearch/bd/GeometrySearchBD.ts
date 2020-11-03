import {
  IResult,
  IGeometrySearchParameter
} from '@/types/map';
import DrawOverlaysBD from '../../DrawOverlays/bd/DrawOverlaysBD';
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import * as turf from "@turf/helpers";
export default class GeometrySearchBD {
  private static intances: Map<string, any>;
  private view!: any;
  private searchTypes!:any;
  private searchGeometry!:number[][];

  private constructor(view: any) {
    this.view = view;
  }
  public static getInstance(view: any) {
    let id = view.container.id;
    if (!GeometrySearchBD.intances) {
      GeometrySearchBD.intances = new Map();
    }
    let intance = GeometrySearchBD.intances.get(id);
    if (!intance) {
      intance = new GeometrySearchBD(view);
      GeometrySearchBD.intances.set(id, intance);
    }
    return intance;
  }
  public async clearGeometrySearch():Promise<IResult>{
    const drawOverlays = DrawOverlaysBD.getInstance(this.view);
    await drawOverlays.deleteDrawOverlays({types:["geometrySearch"]});

    this.searchTypes = [];
    this.searchGeometry = [];
    return {
      message:'成功调用该方法！',
      status:0,
    }
  }
  public async backgroundGeometrySearch(params:IGeometrySearchParameter):Promise<IResult>{
    await this.clearGeometrySearch();

    const searchGeometry = params.geometry;
    if(!Array.isArray(searchGeometry)){
      return {
        message:'坐标必须为二维数组！',
        status:0
      }
    }
    if(!(searchGeometry[0][0] === searchGeometry[searchGeometry.length-1][0] &&
        searchGeometry[0][1] === searchGeometry[searchGeometry.length-1][1])
    ) { //首尾点不等情况，默认将第一个点推进数组
      searchGeometry.push([searchGeometry[0][0],searchGeometry[0][1]])
    }
    this.searchGeometry = searchGeometry;

    const returnResults = await this.booleanContains();

    return {
      message:'no complete',
      status:0,
      result:returnResults.length ? returnResults : null
    }
  }
  public async startGeometrySearch(params:IGeometrySearchParameter):Promise<IResult>{
    const drawType = params.drawType || "polygon";
    const pointsType = params.types || [];
    this.searchTypes = pointsType;
    const drawOverlays = DrawOverlaysBD.getInstance(this.view);
    await drawOverlays.deleteDrawOverlays({types:["geometrySearch"]});
    await drawOverlays.startDrawOverlays({
      drawType:drawType,
      type:'geometrySearch',
      clearLastResult:true
    });
    const results = await drawOverlays.getDrawOverlays();
    const resultGeometry = JSON.parse(results.result)[drawType][0].geometry.points;
    if(!(resultGeometry[0][0] === resultGeometry[resultGeometry.length-1][0] &&
        resultGeometry[0][1] === resultGeometry[resultGeometry.length-1][1])
    ) { //首尾点不等可能为直线
      return {
        message:'the drawType cannot be polyline,correct and call again',
        status:0
      }
    }
    this.searchGeometry = resultGeometry;

    const returnResults = await this.booleanContains();
    return {
      message:'成功调用该方法！',
      status:0,
      result:returnResults.length ? JSON.stringify(returnResults) : null
    }
  }

  private async booleanContains():Promise<any>{
    const allOverlays = this.view.getOverlays();
    const turfPolygon = turf.polygon([this.searchGeometry]);
    const inPolygonOverlays = allOverlays.filter((overlay:any)=>{
      if(!overlay.point){
        return false;
      }
      if(this.searchTypes.length){
        if(!(this.searchTypes.indexOf(overlay.type) > -1 ||
            this.searchTypes.indexOf(overlay.attributes.type) > -1)
        ){
          return false;
        }}
      let ptGeometry = [overlay.point.lng,overlay.point.lat];
      let turfPoint = turf.point(ptGeometry);
      return booleanPointInPolygon(turfPoint, turfPolygon);
    })

    const returnResults:any = [];
    inPolygonOverlays.forEach((overlay:any)=>{
      let returnOverlay:any = {};
      returnOverlay.attributes = overlay.attributes;
      returnOverlay.type = overlay.type || overlay.attributes.type || undefined;
      returnOverlay.id = overlay.id || overlay.attributes.id || undefined;
      returnOverlay.geometry = overlay.point;

      returnResults.push(returnOverlay);
      overlay.setAnimation(2);
      setTimeout(()=>{
        overlay.setAnimation(0);
      },2500)
    })

    return returnResults;
  }
}