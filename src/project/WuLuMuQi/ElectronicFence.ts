import {
  IResult,
  IElectronicFence,
  IElectronicFenceParameter,
  IFenceDelete
} from '@/types/map';
import {loadModules} from "esri-loader";

export default class ElectronicFence {
  private static electronicFence:ElectronicFence
  private view!: __esri.MapView
  private fenceLayer!: __esri.GraphicsLayer
  //依次按级别分为1,2,3,4级,颜色分别为红,橙,黄,绿
  private bufferColors = [
    [255, 0, 0, 0.6],
    [255, 165, 0, 0.5],
    [255, 225, 0, 0.4],
    [0, 255, 0, 0.3]
  ]

  constructor(view: __esri.MapView) {
    this.view = view
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

  public async showMonitorArea(params:IElectronicFenceParameter):Promise<IResult>{
    if(!this.fenceLayer){
      await this.createOverlayLayer();
    }

    const [Graphic,geometryEngine,geometryJsonUtils,WebMercatorUtils] = await loadModules([
      'esri/Graphic',
      'esri/geometry/geometryEngine',
      'esri/geometry/support/jsonUtils',
      'esri/geometry/support/webMercatorUtils',
    ]);

    let id = params.id || "";
    let type = params.type || "monitorAreas";
    let geometryObj = params.geometry;
    let resultBuffers = [];

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

    let monitorGraphic = new Graphic({
      geometry: geometry,
      symbol: {
        type: "simple-fill", // autocasts as SimpleFillSymbol
        color: "purple",
        style: "solid",
        outline: {  // autocasts as SimpleLineSymbol
          color: "white",
          width: 1
        }
      }
    });
    monitorGraphic.id = id;
    monitorGraphic.type = type;
    monitorGraphic.attributes = fields;

    for (let j = buffers.length - 1; j > -1; j--) {
      let buffer = await this._doBuffer(monitorGraphic, buffers[j], j);

      if(buffer.spatialReference.isWebMercator){
        let geoCoordinateBuffer:__esri.Polygon;
        geoCoordinateBuffer = WebMercatorUtils.webMercatorToGeographic(buffer);
        resultBuffers.push(geoCoordinateBuffer);
      }
      else {
        resultBuffers.push(buffer);
      }

      let bufferGraphic = new Graphic({
        geometry: buffer,
        symbol: {
          type: "simple-fill", // autocasts as SimpleFillSymbol
          color: "purple",
          style: "solid",
          outline: {  // autocasts as SimpleLineSymbol
            color: "white",
            width: 1
          }
        }
      });
      bufferGraphic.attributes = fields;
      bufferGraphic.symbol.color = this.bufferColors[j];

      bufferGraphic.id = id + j;
      bufferGraphic.pid = id;
      bufferGraphic.type = type;
      this.fenceLayer.add(bufferGraphic);
    }

    return {
      message:"not finish",
      status:0,
      result:resultBuffers
    }
  }

  public async showCircleOutline(params:IElectronicFenceParameter):Promise<IResult>{
    return {
      message:"not finish",
      status:0
    }
  }

  public async deleteCircleOutline(params:IFenceDelete):Promise<IResult>{
    return {
      message:"not finish",
      status:0
    }
  }

  public async createPlaceFence(params:IElectronicFenceParameter):Promise<IResult>{
    return {
      message:"not finish",
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
    const [Graphic,GeometryEngine,geometryJsonUtils,GeometryService] = await loadModules([
      'esri/Graphic',
      'esri/geometry/geometryEngine',
      'esri/geometry/support/jsonUtils',
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


}