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
import Axios from 'axios';
import ToolTip from '../../Overlays/arcgis/ToolTip';
export class LayerDefinition {
  private static intances: Map<string, any>;
  private view!: any;
  private className: string = 'layerdefinition';
  private queryUrl: string =
    'http://139.224.210.229:9093/yangpu-api/traffic/getList';
  private labels: Array<string> = new Array<string>();

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
    let layerName = params.layerName || '';

    let searchNames = params.searchNames || [];
    let url = params.url || this.queryUrl;

    let layer = this.getLayer(layerName);
    if (layer === undefined) {
      return;
    }
    let _this = this;
    this.queryLayerData(url).then((data: any) => {
      _this.doLayerDefinition({
        layer: layer,
        searchNames: searchNames,
        data: data
      });
    });
  }
  public queryLayerData(url: string | undefined): Promise<any> {
    let data = [];
    return new Promise((resolve, reject) => {
      if (url) {
        Axios.post(url, {}).then((res: any) => {
          //todo
          let obj: any = {};
          res.data.data.forEach((item: any) => {
            obj[item['deptName']] = item.totalScore;
          });
          resolve(obj);
        });
      } else {
        resolve([]);
      }
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
    this.showLabel(results.features, option.data);
    this.view.goTo({target: results.features});
  }
  private async clearLabel() {
    this.labels.forEach((id: string) => {
      ToolTip.clear(this.view, id);
    }, this);
  }
  private async showLabel(featues: any[], data: any) {
    this.clearLabel();
    featues.forEach((graphic: any, index: number) => {
      let name = graphic.attributes.Name;
      let customtool = new ToolTip(
        this.view,
        {
          id: index,
          className: this.className,
          content:
            '<span style=\'color:white;font-size:14px;font-weight:bold;font-family:"Microsoft YaHei"\' >' +
            name +
            '</span><br/>' +
            '<span style=\'color:white;font-size:14px;font-weight:bold;font-family:"Microsoft YaHei"\' >' +
            data[name] +
            '</span>'
        },
        graphic
      );
      this.labels.push(index.toString());
    }, this);
  }
}
