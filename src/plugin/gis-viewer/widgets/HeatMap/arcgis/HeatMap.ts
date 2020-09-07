import {
  IOverlayParameter,
  IResult,
  IHeatParameter,
  IHeatPoint
} from '@/types/map';
import {loadModules} from 'esri-loader';
import {Point} from 'esri/geometry';
export class HeatMap {
  private static intances: Map<string, any>;
  private view!: any;
  private heatlayer: any;

  private constructor(view: any) {
    this.view = view;
  }
  public static getInstance(view: __esri.MapView) {
    let id = view.container.id;
    if (!HeatMap.intances) {
      HeatMap.intances = new Map();
    }
    let intance = HeatMap.intances.get(id);
    if (!intance) {
      intance = new HeatMap(view);
      HeatMap.intances.set(id, intance);
    }
    return intance;
  }
  public static destroy() {
    (HeatMap.intances as any) = null;
  }

  public async deleteHeatMap() {
    this.clear();
  }
  private clear() {
    if (this.heatlayer) {
      this.view.map.remove(this.heatlayer);
    }
  }
  public async addHeatMap(params: IHeatParameter) {
    // Create featurelayer from client-side graphics
    this.clear();
    type MapModules = [
      typeof import('esri/Graphic'),
      typeof import('esri/layers/FeatureLayer')
    ];
    const [Graphic, FeatureLayer] = await (loadModules([
      'esri/Graphic',
      'esri/layers/FeatureLayer',
    ]) as Promise<MapModules>);

    let points = params.points;

    // let defaultOptions = {
    //   field: 'totalSpace',
    //   radius: '1',
    //   colors: [
    //     { ratio: 0, color: "rgba(255,140,0,0)" },
    //     { ratio: 0.4, color: 'rgba(63, 63, 191,0.8)' },
    //     { ratio: 0.5, color: 'rgba(117,211,248,0.8)' },
    //     { ratio: 0.6, color: 'rgba(0, 255, 0,0.8)' },
    //     { ratio: 0.75, color: 'rgba(255,234,0,0.8)' },
    //     { ratio: 0.9, color: "rgba(255,0,0,0.6)" }
    //   ],
    //   maxValue: 1000,
    //   minValue: 1,
    //   zoom: 19,
    //   renderer: {
    //     type: 'simple',
    //     symbol: {
    //       type: 'esriSMS',
    //       url: 'assets/image/Anchor.png',
    //       width: 64,
    //       height: 66,
    //       yoffset: 16
    //     }
    //   }
    // }
    let options = params.options || {
      field: 'totalSpace',
      radius: '1',
      colors: [
        { ratio: 0, color: "rgba(255,140,0,0)" },
        { ratio: 0.4, color: 'rgba(63, 63, 191,0.8)' },
        { ratio: 0.5, color: 'rgba(117,211,248,0.8)' },
        { ratio: 0.6, color: 'rgba(0, 255, 0,0.8)' },
        { ratio: 0.75, color: 'rgba(255,234,0,0.8)' },
        { ratio: 0.9, color: "rgba(255,0,0,0.6)" }
      ],
      maxValue: 1000,
      minValue: 1,
      zoom: 19,
      renderer: {
        type: 'simple',
        symbol: {
          type: 'esriSMS',
          url: 'assets/image/Anchor.png',
          width: 64,
          height: 66,
          yoffset: 16
        }
      }
    };
    let graphics: any[] = [];
    let fields: any[] = [
      {
        name: 'ObjectID',
        alias: 'ObjectID',
        type: 'oid'
      }
    ];
    let fieldName = points[0].fields;
    for (let str in fieldName) {
      let fieldtype = 'string';
      if(options && options.field){
        if (str == options.field) {
          fieldtype = 'double';
        }
      }

      fields.push({name: str, alias: str, type: fieldtype});
    }
    graphics = points.map((point: IHeatPoint) => {
      return new Graphic({
        geometry: {
          type: 'point',
          x: point.geometry.x,
          y: point.geometry.y
        } as any,
        attributes: point.fields
      });
    });
    this.heatlayer = new FeatureLayer({
      source: graphics,
      fields: fields,
      objectIdField: 'ObjectID',
      geometryType: 'point'
    });
    let layer = this.heatlayer;
    let maxzoom = options.zoom || 0;

    let simpleRenderer = this.getRender(options.renderer);
    let heatmapRenderer = {
      type: 'heatmap',
      field: options.field || undefined,
      colorStops: options.colors,
      minPixelIntensity: 0,
      maxPixelIntensity: options.maxValue || 100
    } as any;
    layer.renderer =
      this.view.zoom > maxzoom ? simpleRenderer : heatmapRenderer;
    this.view.map.add(layer);
    this.view.watch('zoom', (newValue: number) => {
      layer.renderer = newValue > maxzoom ? simpleRenderer : heatmapRenderer;
    });

    console.log(layer);
  }
  private getRender(renderer: any): any {
    let newrender = renderer;
    if (newrender.symbol) {
      newrender.symbol.type = newrender.symbol.type
        .replace('esriPMS', 'picture-marker')
        .replace('esriSMS', 'simple-marker');
    }
    return newrender;
  }

}
