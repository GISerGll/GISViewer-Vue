import {ITrackParameter} from '@/types/map';
import {loadModules} from 'esri-loader';
import TrackPlayRender from './TrackPlayRender';

export default class TrackPlay {
  private view!: __esri.SceneView;
  private static intances: Map<string, TrackPlay>;

  private constructor(view: __esri.SceneView) {
    this.view = view;
  }
  public static getInstance(view: __esri.SceneView) {
    const id = view.container.id;
    if (!TrackPlay.intances) {
      TrackPlay.intances = new Map();
    }
    let instance = TrackPlay.intances.get(id);
    if (!instance) {
      instance = new TrackPlay(view);
      TrackPlay.intances.set(id, instance);
    }
    return instance;
  }
  public async startTrackPlay(params: ITrackParameter) {
    const [
      webMercatorUtils,
      externalRenderers,
      GraphicsLayer,
      watchUtils,
      promiseUtils
    ] = await loadModules([
      'esri/geometry/support/webMercatorUtils',
      'esri/views/3d/externalRenderers',
      'esri/layers/GraphicsLayer',
      'esri/core/watchUtils',
      'esri/core/promiseUtils'
    ]);
    let graphics = [];
    graphics.push(
      {
        geometry: {
          // Los Angeles
          x: 120.311,
          y: 24.315,
          type: 'point',
          spatialReference: {
            wkid: 4326
          }
        },
        timestamp: new Date('2008-02-02 13:34:25').getTime()
      },
      {
        geometry: {
          // Los Angeles
          x: 121.205,
          y: 30.425,
          type: 'point',
          spatialReference: {
            wkid: 4326
          }
        },
        timestamp: new Date('2008-02-02 13:35:25').getTime()
      },
      {
        geometry: {
          // Los Angeles
          x: 121.125,
          y: 31.415,
          type: 'point',
          spatialReference: {
            wkid: 4326
          }
        },
        timestamp: new Date('2008-02-02 13:36:25').getTime()
      }
    );

    let tp = new TrackPlayRender(this.view, graphics, {});
    externalRenderers.add(this.view, tp);
  }
}
