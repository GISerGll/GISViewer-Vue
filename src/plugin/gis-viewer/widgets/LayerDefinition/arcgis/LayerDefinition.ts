import {
  IOverlayParameter,
  IResult,
  IHeatParameter,
  IGeometrySearchParameter,
  IDefinitionParameter
} from '@/types/map';
import {resolve, reject} from 'esri/core/promiseUtils';
import {loadModules, utils} from 'esri-loader';
import {Utils} from '@/plugin/gis-viewer/Utils';
import {FindFeature} from '../../FindFeature/arcgis/FindFeature';
export class LayerDefinition {
  private static intances: Map<string, any>;
  private view!: any;
  private searchOverlays: any;
  private _mapClick: any;

  private constructor(view: any) {
    this.view = view;
  }
  public static getInstance(view: __esri.MapView | __esri.SceneView) {
    let id = view.container.id;
    if (!LayerDefinition.intances) {
      LayerDefinition.intances = new Map();
    }
    let intance = LayerDefinition.intances.get(id);
    if (!intance) {
      intance = new LayerDefinition(view);
      LayerDefinition.intances.set(id, intance);
    }
    return intance;
  }
  public static destroy() {
    (LayerDefinition.intances as any) = null;
  }
  public async startLayerDefinition(
    params: IDefinitionParameter
  ): Promise<void> {
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

    let layerName = params.layerName || '';

    let searchNames = params.searchNames || [];

    let layer = this.getLayer(layerName);
    if (layer === undefined) {
      return;
    }
    this.doLayerDefinition({
      layer: layer,
      searchNames: searchNames
    });
  }
  private getLayer(layerName: string): any {
    if (layerName == '' || layerName == undefined) {
      return undefined;
    }
    let selLayer;
    this.view.map.allLayers.toArray().forEach((layer: any) => {
      if (
        layer.type == 'imagery' ||
        layer.type == 'map-image' ||
        layer.type == 'feature'
      ) {
        if (layer.label == layerName) {
          selLayer = layer;
        }
      }
    });
    return selLayer;
  }
  private async doLayerDefinition(option: any): Promise<any> {
    let layer = option.layer;
    let queryLayer;
    let searchNames = option.searchNames;
    let express = '1=1';
    let searchStr = '';
    if (searchNames.length > 0) {
      searchNames.forEach((name: string, index: number) => {
        if (index === 0) {
          searchStr = searchStr + "(Name='" + name + "' ";
        } else {
          searchStr = searchStr + " or Name='" + name + "' ";
        }
      });
      searchStr += ')';
      express = searchStr;
    }

    if (layer.type == 'feature') {
      layer.definitionExpression = express;
      queryLayer = layer;
    } else if (layer.type == 'map-image') {
      var sublayer = layer.findSublayerById(0);
      queryLayer = sublayer;
      sublayer.definitionExpression = express;
    }
    const query = queryLayer.createQuery();
    query.where = express;
    const results = await queryLayer.queryFeatures(query);
    this.view.goTo({target: results.features});
  }
}
