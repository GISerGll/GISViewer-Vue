export class Utils {
  private constructor() {}
  public static async loadScripts(scriptUrls: string[]): Promise<any> {
    console.log(scriptUrls);
    let promises = scriptUrls.map((url) => {
      return new Promise((resolve, reject) => {
        const scriptElement = document.createElement('script');
        scriptElement.src = url;
        scriptElement.onload = resolve;
        document.body.appendChild(scriptElement);
      });
    });
    return new Promise((resolve) => {
      Promise.all(promises).then((e) => {
        resolve(e);
      });
    });
  }
  public static copyObject(obj: object) {
    return JSON.parse(JSON.stringify(obj));
  }
  public static getZoom(
    view: __esri.MapView | __esri.SceneView,
    scale: number
  ): number {
    if (scale == 0) {
      return 0;
    }
    let zoom: number = 0;
    (view.map.allLayers.getItemAt(0) as any).tileInfo.lods.forEach(
      (lod: any) => {
        if (lod.scale == scale) {
          zoom = lod.level;
        }
      }
    );
    return zoom;
  }
  public static getGeometryPoint(geometry: any) {
    if (geometry.type == 'point') {
      return geometry;
    } else if (geometry.type == 'polyline') {
      return geometry.getPoint(0, 0);
    } else if (geometry.type == 'polygon') {
      return geometry.centroid;
    }
  }
  public static getScale(
    view: __esri.MapView | __esri.SceneView,
    zoom: number
  ): number {
    let scale: number = 0;
    if (zoom == 0) {
      return 0;
    }
    let layer: any = view.map.allLayers.getItemAt(0);
    if (layer.tileInfo && layer.tileInfo.lods) {
      (view.map.allLayers.getItemAt(0) as any).tileInfo.lods.forEach(
        (lod: any) => {
          if (lod.level == zoom) {
            scale = lod.scale;
          }
        }
      );
    }
    return scale;
  }
}
