import {
  IOverlayParameter,
  IPointSymbol,
  IResult,
  IOverlayDelete,
  IFindParameter,
  ILayerConfig,
  IDrawOverlays
} from '@/types/map';
import axios from 'axios';
import {loadModules} from 'esri-loader';
import {resolve} from 'esri/core/promiseUtils';

export class DrawOverlays {
  private static intances: Map<string, any>;

  private drawlayer!: any;
  private view!: __esri.MapView | __esri.SceneView;
  private dataJsonMap: Map<string, any> = new Map();
  private sketchVM: any;
  private _polySym: any;
  private _lineSym: any;
  private _id: string | undefined = undefined;
  private _type: string | undefined = undefined;
  private _callback: any;

  private constructor(view: __esri.MapView | __esri.SceneView) {
    this.view = view;
  }

  public static getInstance(view: __esri.MapView | __esri.SceneView) {
    let id = view.container.id;
    if (!DrawOverlays.intances) {
      DrawOverlays.intances = new Map();
    }
    let intance = DrawOverlays.intances.get(id);
    if (!intance) {
      intance = new DrawOverlays(view);
      DrawOverlays.intances.set(id, intance);
    }
    return intance;
  }
  public clear() {
    if (this.drawlayer) {
      this.drawlayer.removeAll();
    }
  }
  public stopDrawOverlays() {
    if (this.drawlayer) {
      this.drawlayer.removeAll();
      this.view.map.remove(this.drawlayer);
      this.drawlayer = undefined;
    }
    if (this.sketchVM) {
      this.sketchVM.destroy();
      this.sketchVM = undefined;
    }
  }
  public async startDrawOverlays(params: IDrawOverlays): IPromise<void> {
    let repeat = params.repeat !== false;
    let symbol = params.symbol || {};
    let model = params.model || 'add';
    this._callback = params.callback || undefined;

    this._id = params.id || undefined;
    this._type = params.type || 'drawOverlays';
    this._polySym = {
      type: 'simple-fill', // autocasts as new SimpleMarkerSymbol()
      color: symbol.color || [23, 145, 252, 0.4],
      outline: {
        style: symbol.outline ? symbol.outline.style || 'dash' : 'dash',
        color: symbol.outline
          ? symbol.outline.color || [255, 0, 0, 0.8]
          : [255, 0, 0, 0.8],
        width: symbol.outline ? symbol.outline.width || 2 : 2
      }
    };
    this._lineSym = {
      type: 'simple-line',
      color: symbol.color || [255, 0, 0],
      width: 2
    };
    if (!repeat) {
      this.clear();
    }
    if (!this.sketchVM) {
      await this.createSketch(params);
    }
    if (model == 'add') {
      this.sketchVM.create(params.drawType || 'polygon');
    }
  }
  public async createSketch(params: any) {
    let update = params.update !== false;

    type MapModules = [
      typeof import('esri/widgets/Sketch/SketchViewModel'),
      typeof import('esri/geometry/support/webMercatorUtils')
    ];
    const [SketchViewModel, WebMercatorUtils] = await (loadModules([
      'esri/widgets/Sketch/SketchViewModel',
      'esri/geometry/support/webMercatorUtils'
    ]) as Promise<MapModules>);
    let drawlayer = await this.createOverlaysLayer();
    this.drawlayer = drawlayer;
    this.sketchVM = new SketchViewModel({
      layer: this.drawlayer,
      view: this.view,
      updateOnGraphicClick: false,
      defaultUpdateOptions: {
        toggleToolOnClick: true,
        enableRotation: true,
        multipleSelectionEnabled: true
      },
      polygonSymbol: {
        type: 'simple-fill', // autocasts as new SimpleMarkerSymbol()
        color: [23, 145, 252, 0.4],
        outline: {
          style: 'dash',
          color: [255, 0, 0, 0.8],
          width: 2
        }
      },
      polylineSymbol: {
        type: 'simple-line',
        color: [255, 0, 0],
        width: 2
      },
      pointSymbol: {
        type: 'simple-marker',
        style: 'circle',
        size: 16,
        color: [255, 0, 0],
        outline: {
          color: [255, 255, 255],
          width: 2
        }
      }
    });
    let _this = this;
    // listen to create event, only respond when event's state changes to complete
    this.sketchVM.on('create', (event: any) => {
      if (event.state === 'complete') {
        event.graphic.attributes = {id: _this._id, type: _this._type};
        event.graphic.id = _this._id;
        event.graphic.type = _this._type;
        if (event.graphic.geometry.type == 'polygon') {
          event.graphic.symbol = _this._polySym;
        } else if (event.graphic.geometry.type == 'polyline') {
          event.graphic.symbol = _this._lineSym;
        }
        if (_this._callback) {
          let polygoncenter =
            event.graphic.geometry.centroid || event.graphic.geometry.center;
          if (polygoncenter) {
            polygoncenter = [polygoncenter.longitude, polygoncenter.latitude];
          }
          _this._callback({
            geometry: event.graphic.geometry,
            center: polygoncenter,
            data: {
              type: 'drawOverlays',
              overlays: [
                {
                  geometry: event.graphic.geometry,
                  fields: {
                    id: event.graphic.attributes.id || undefined,
                    type: event.graphic.attributes.type || 'drawOverlays'
                  },
                  id: event.graphic.attributes.id,
                  symbol: event.graphic.symbol
                }
              ]
            }
          });
        }
      }
    });

    let _view = this.view;
    if (update) {
      this.view.on('click', async (event) => {
        const response = await _view.hitTest(event);
        if (!_this.sketchVM) {
          return;
        }
        if (_this.sketchVM.state === 'active') {
          return;
        }
        if (response.results.length > 0) {
          let geometry = response.results[0].graphic.geometry;
          if (this.view.spatialReference.isWebMercator) {
            if (geometry.spatialReference.isWGS84) {
              geometry = WebMercatorUtils.geographicToWebMercator(geometry);
            }
          }
          response.results[0].graphic.geometry = geometry;
          _this.sketchVM.update([response.results[0].graphic], 'reshape');
        }
      });
    }
  }
  private async createOverlaysLayer() {
    type MapModules = [typeof import('esri/layers/GraphicsLayer')];
    const [GraphicsLayer] = await (loadModules([
      'esri/layers/GraphicsLayer'
    ]) as Promise<MapModules>);

    let layer = this.view.map.allLayers.find((baselayer: any) => {
      return baselayer.label === 'drawOverlays';
    });
    if (!layer) {
      let drawlayer = new GraphicsLayer();
      (drawlayer as any).label = 'drawOverlays';
      this.view.map.add(drawlayer, 0);
      layer = drawlayer;
    }
    return layer;
  }
  public async deleteDrawOverlays(params: IOverlayDelete): Promise<void> {
    let _this = this;
    let types = params.types || [];
    let ids = params.ids || [];
    return new Promise((resolve: any, reject: any) => {
      if (params) {
        let layer = _this.view.map.allLayers.find((baselayer: any) => {
          return (
            baselayer.type == 'graphics' && baselayer.label === 'drawOverlays'
          );
        });
        if (!layer) {
          resolve({status: 0, message: '', result: {}});
        }
        let overlayLayer = layer as __esri.GraphicsLayer;
        for (let i = 0; i < overlayLayer.graphics.length; i++) {
          let graphic: any = overlayLayer.graphics.getItemAt(i);
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
            overlayLayer.remove(graphic);
            i--;
          }
        }
        resolve({status: 0, message: '', result: {}});
      } else {
        _this.sketchVM.delete();
      }
    });
  }
  public async getDrawOverlays(): Promise<IResult> {
    let _this = this;
    return new Promise((resolve: any, reject: any) => {
      let layer = _this.view.map.allLayers.find((baselayer: any) => {
        return (
          baselayer.type == 'graphics' && baselayer.label === 'drawOverlays'
        );
      });
      if (!layer) {
        resolve({status: 0, message: '', result: {}});
      }
      let overlays: any[] = [];
      (layer as __esri.GraphicsLayer).graphics.forEach(
        (graphic: __esri.Graphic, index: number) => {
          let symbol = graphic.symbol as any;
          if (graphic.geometry.type == 'polyline') {
            symbol = {
              type: symbol.type,
              color: symbol.color,
              width: symbol.width
            };
          } else if (graphic.geometry.type == 'polygon') {
            symbol = {
              type: symbol.type,
              color: symbol.color
                ? [
                    symbol.color.r,
                    symbol.color.g,
                    symbol.color.b,
                    symbol.color.a
                  ]
                : [23, 145, 252, 0.4],
              outline: {
                type: symbol.outline.type,
                style: symbol.outline.style,
                color: symbol.outline.color
                  ? [
                      symbol.outline.color.r,
                      symbol.outline.color.g,
                      symbol.outline.color.b,
                      symbol.outline.color.a
                    ]
                  : [23, 145, 252, 0.4],
                width: symbol.outline.width
              }
            };
          } else {
            //point
            symbol = {
              type: 'simple-marker',
              style: 'circle',
              size: 16,
              color: [255, 0, 0],
              outline: {
                color: [255, 255, 255],
                width: 2
              }
            };
          }
          overlays.push({
            geometry: graphic.geometry,
            fields: {
              id: graphic.attributes.id || 'drawoverlay' + index.toString(),
              type: graphic.attributes.type || 'drawOverlays'
            },
            id: graphic.attributes.id,
            symbol: symbol
          });
        }
      );
      let result = {type: 'drawOverlays', overlays: overlays};
      resolve({
        status: 0,
        message: '',
        result: {dataJson: JSON.stringify(result), data: result}
      });
    });
  }
}
