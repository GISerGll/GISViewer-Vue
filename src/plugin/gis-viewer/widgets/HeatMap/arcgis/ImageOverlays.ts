import {IHeatImageParameter} from '@/types/map';
import {loadModules} from 'esri-loader';
import {resolve, reject} from 'esri/core/promiseUtils';
import {param} from 'jquery';
export default class ImageOverlays {
  private static intances: Map<string, any>;
  public view: any;
  private overlayGroups: Map<string, __esri.GraphicsLayer> = new Map<
    string,
    __esri.GraphicsLayer
  >();
  private scale: number = 8000;
  private heatDivs: Array<any> = new Array<any>();

  private constructor(view: __esri.MapView | __esri.SceneView) {
    // Geometrical transformations that must be recomputed
    // from scratch at every frame.
    this.view = view;
  }
  public static getInstance(view: any) {
    let id = view.container.id;
    if (!ImageOverlays.intances) {
      ImageOverlays.intances = new Map();
    }
    let intance = ImageOverlays.intances.get(id);
    if (!intance) {
      intance = new ImageOverlays(view);
      ImageOverlays.intances.set(id, intance);
    }
    return intance;
  }
  private clear() {}
  public async addImage(params: any) {
    console.log(params);
    let customLayer = (await this.getOverlayLayer(
      params.label || 'image'
    )) as __esri.GraphicsLayer;
    const [
      Graphic,
      geometryJsonUtils,
      PopupTemplate,
      SpatialReference,
      WebMercatorUtils
    ] = await loadModules([
      'esri/Graphic',
      'esri/geometry/support/jsonUtils',
      'esri/PopupTemplate',
      'esri/geometry/SpatialReference',
      'esri/geometry/support/webMercatorUtils'
    ]);

    let point = params.geometry;
    point.spatialReference = this.view.spatialReference;
    let url = params.url;
    let scale = params.scale || this.scale;
    let geometry = geometryJsonUtils.fromJSON(point);
    let step = this.scale / this.view.scale;
    let symbol = {
      type: 'picture-marker',
      width: params.width * step,
      height: params.height * step,
      url: params.url
    };
    let highGraphic = new Graphic({
      geometry: geometry,
      symbol: symbol as any
    });
    highGraphic.isclick = false;
    customLayer.minScale = params.minScale || 0;
    customLayer.maxScale = params.maxScale || 0;
    customLayer.add(highGraphic);

    let _this = this;
    this.view.watch('scale', (newValue: any) => {
      let step = _this.scale / newValue;
      let symbol2 = {
        type: 'picture-marker',
        width: Math.floor(params.width * step),
        height: Math.floor(params.height * step),
        url: params.url
      };
      highGraphic.symbol = symbol2;
      highGraphic.visible = false;
      highGraphic.visible = true;
    });
  }
  private async getOverlayLayer(label: string) {
    let group = this.overlayGroups.get(label);
    if (!group) {
      group = await this.createOverlayLayer(label);
    }
    return group;
  }
  private async createOverlayLayer(
    label: string
  ): Promise<__esri.GraphicsLayer> {
    type MapModules = [typeof import('esri/layers/GraphicsLayer')];
    const [GraphicsLayer] = await (loadModules([
      'esri/layers/GraphicsLayer'
    ]) as Promise<MapModules>);
    let overlayLayer: __esri.GraphicsLayer = new GraphicsLayer();
    (overlayLayer as any).label = label;
    this.view.map.add(overlayLayer, 0);
    this.overlayGroups.set(label, overlayLayer);
    return overlayLayer;
  }
  public async adds(opt: any) {}
}
