import {
  IOverlayParameter,
  IResult,
  IHeatParameter,
  IGeometrySearchParameter
} from '@/types/map';
import {resolve, reject} from 'esri/core/promiseUtils';
import {loadModules, utils} from 'esri-loader';
import {Utils} from '@/plugin/gis-viewer/Utils';
import {DrawOverlays} from '../../DrawOverlays/arcgis/DrawOverlays';
export class LayerSearch {
  private static intances: Map<string, any>;
  private view!: any;
  private searchOverlays: any;
  private _mapClick: any;

  private constructor(view: any) {
    this.view = view;
  }
  public static getInstance(view: __esri.MapView | __esri.SceneView) {
    let id = view.container.id;
    if (!LayerSearch.intances) {
      LayerSearch.intances = new Map();
    }
    let intance = LayerSearch.intances.get(id);
    if (!intance) {
      intance = new LayerSearch(view);
      LayerSearch.intances.set(id, intance);
    }
    return intance;
  }
  public static destroy() {
    (LayerSearch.intances as any) = null;
  }
  public async startLayerSearch(
    params: IGeometrySearchParameter
  ): Promise<IResult> {
    type MapModules = [
      typeof import('esri/geometry/Point'),
      typeof import('esri/geometry/Circle'),
      typeof import('esri/geometry/Geometry'),
      typeof import('esri/Graphic'),
      typeof import('esri/geometry/support/webMercatorUtils')
    ];
    const [
      Point,
      Circle,
      Geometry,
      Graphic,
      webMercatorUtils
    ] = await (loadModules([
      'esri/geometry/Point',
      'esri/geometry/Circle',
      'esri/geometry/Geometry',
      'esri/Graphic',
      'esri/geometry/support/webMercatorUtils'
    ]) as Promise<MapModules>);

    let radius = params.radius || 1000; //搜索半径,单位米
    let center = (params.center as number[]) || undefined; //搜索中心

    let layerName = params.layerName || '';

    let layer = this.getLayer(layerName);
    if (layer === undefined) {
      return {status: 0, message: '', result: []};
    }

    let searchGeometry = params.geometry || undefined;
    let centerGeo: any;
    if (center) {
      centerGeo = new Point({
        longitude: center[0],
        latitude: center[1],
        spatialReference: {wkid: 4326}
      });
      searchGeometry = new Circle({
        center: centerGeo,
        radius: radius,
        radiusUnit: 'meters'
      });
      let circleGraphic = new Graphic({
        geometry: searchGeometry,
        symbol: {
          type: 'simple-fill',
          style: 'solid',
          color: [23, 145, 252, 0.4],
          outline: {
            style: 'dash',
            color: [255, 0, 0, 0.8],
            width: 2
          }
        } as any
      });
      this.view.graphics.add(circleGraphic);
    }
    return new Promise((resolve, reject) => {
      this.doQueryLayer({
        layer: layer,
        geometry: searchGeometry
      }).then((result: any) => {
        resolve(result);
      });
    });
  }
  private getLayer(layerName: string): any {
    if (layerName == '' || layerName == undefined) {
      return undefined;
    }
    let selLayer;
    this.view.map.allLayers.toArray().forEach((layer: any) => {
      if (layer.type == 'imagery' || layer.type == 'map-image') {
        if (layer.label == layerName) {
          selLayer = layer;
        }
      }
    });
    return selLayer;
  }
  private async doQueryLayer(option: any): Promise<any> {
    let layer = option.layer;
    let _this = this;
    if (layer.type == 'feature') {
    } else if (layer.type == 'map-image') {
      let promises: any = layer.allSublayers.toArray().map((layer: any) => {
        return _this.doQueryTask({
          layer: layer,
          geometry: option.geometry,
          distance: option.distance
        });
      });
      return new Promise((resolve) => {
        Promise.all(promises).then((e: any) => {
          resolve(e);
        });
      });
    }
  }
  private async doQueryTask(option: {
    layer: any;
    geometry: any;
    distance: number;
  }): Promise<any> {
    type MapModules = [
      typeof import('esri/Graphic'),
      typeof import('esri/tasks/QueryTask'),
      typeof import('esri/tasks/support/Query')
    ];
    const [Graphic, QueryTask, Query] = await (loadModules([
      'esri/Graphic',
      'esri/tasks/QueryTask',
      'esri/tasks/support/Query'
    ]) as Promise<MapModules>);

    return new Promise((resolve, reject) => {
      var queryTask = new QueryTask({
        url: option.layer.url
      });
      var query = new Query();
      query.geometry = option.geometry;
      query.spatialRelationship = 'intersects'; // this is the default
      query.returnGeometry = true;
      query.outFields = ['*'];

      // 执行查询对象
      queryTask.execute(query).then((data: any) => {
        let features = data.features;
        if (features) {
          let results = features.map((graphic: any) => {
            return graphic.attributes;
          });
          resolve({
            layerid: option.layer.id,
            name: option.layer.title,
            feature: results
          });
        } else {
          resolve(undefined);
        }
      });
    });
  }
}
