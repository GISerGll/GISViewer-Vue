import {
  IResult,
  IElectronicFence,
  IEditFenceLabel,
  IElectronicFenceParameter,
  IMonitorAreaParameter,
  IFenceDelete,
  ICircleOutline, ITrackPlayback
} from '@/types/map';
import turfBuffer from "@turf/buffer";
import * as turf from "@turf/helpers";
import {OverlayBaidu} from "@/plugin/gis-viewer/widgets/Overlays/bd/OverlayBaidu";
export default class ElectronicFenceBD {
  private view!:any
  private fenceId!: number
  private static intances: Map<string, any>;
  private bufferColors = [
    'rgba(255, 0, 0, 0.6)',
    'rgba(255, 165, 0, 0.5)',
    'rgba(255, 225, 0, 0.4)',
    'rgba(0, 255, 0, 0.3)'
  ]
  constructor(view:any) {
    this.view = view;
    this.fenceId = 0;
  }

  public static getInstance(view: __esri.MapView){
    let id = view.container.id;
    if (!ElectronicFenceBD.intances) {
      ElectronicFenceBD.intances = new Map();
    }
    let intance = ElectronicFenceBD.intances.get(id);
    if (!intance) {
      intance = new ElectronicFenceBD(view);
      ElectronicFenceBD.intances.set(id, intance);
    }
    return intance;
  }

  public async showMonitorArea(params:IMonitorAreaParameter):Promise<IResult>{
    const geometry = params.geometry;
    if(!geometry || typeof geometry !== "object"){
      return {
        message:'geometry object is required!',
        status:0
      }
    }
    const rings = geometry.rings || [];
    const path = geometry.path || [];
    const ptCoordinateX = geometry.x;
    const ptCoordinateY = geometry.y;
    const radiusArray = params.buffers;
    const id = params.id || "monitorId" + Math.random().toFixed(5).toString();
    const type = params.type || "monitorType" + Math.random().toFixed(5).toString();

    const bufferedArray:any = [];

    let turfObj:turf.Feature;
    if(rings.length){                 //区域加buffer
      turfObj = turf.polygon(rings);
    }else if(path.length){
      turfObj = turf.lineString(path[0]);
    }else if(ptCoordinateX && ptCoordinateY){
      turfObj = turf.point([ptCoordinateX,ptCoordinateY]);
    }else {
      return {
        status:0,
        message:"check out the geometry attributes!"
      }
    }

    radiusArray.forEach(radius => {
      const buffered = turfBuffer(turfObj, radius, {units: 'meters'});
      if(buffered && buffered.geometry){
        bufferedArray.push(buffered.geometry.coordinates);
      }
    })
    const overlaysObj = [];
    for(let i = bufferedArray.length-1;i >= 0;i--){
      const overlayObj:any = {};
      overlayObj.geometry = {
        rings:bufferedArray[i][0]
      }
      overlayObj.id = id;
      overlayObj.fields = {
        id,
        type
      }
      overlayObj.symbol = {
        type: 'polygon',
        color: this.bufferColors[i],
        outline:{
          color:'black',
          width:0.1
        }
      }
      overlaysObj.push(overlayObj);
    }

    const overlaysBD = OverlayBaidu.getInstance(this.view);
    await overlaysBD.deleteOverlays({
      types:[type],
      ids:[id]
    })
    await overlaysBD.addOverlays({
      type:type,
      overlays:overlaysObj
    })
    return {
      status:0,
      message:'not complete',
      result:JSON.parse(JSON.stringify(overlaysObj))
    }
  }

  private async clearMonitorArea(params:IFenceDelete):Promise<IResult> {
    let ids = params.ids || [];
    let types = params.types || [];
    let message = params.message;
    let delCount = 0;

    return {
      status: 0,
      message: 'ok',
      result: message? message+delCount:`成功删除${delCount}个布控区域`
    }
  }
}