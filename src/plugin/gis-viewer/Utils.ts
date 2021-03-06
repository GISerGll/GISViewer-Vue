export class Utils {
  constructor() {}
  public static async loadScripts(scriptUrls: string[]): Promise<any> {
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
  public static async loadCss(cssUrls: string[]): Promise<any> {
    let promises = cssUrls.map((cssUrl) => {
      return new Promise(resolve => {
        const link = document.createElement('link');
        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.href = cssUrl;
        const head = document.getElementsByTagName('head')[0];
        head.appendChild(link);
        resolve();
      })
    })

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
  public static resetMap(view: any) {
    let mapOption = view.mapOptions.options;
    view.goTo({
      zoom: mapOption.zoom || 0,
      center: mapOption.center
    });
  }
  public static getGeometryPoint(geometry: any) {
    if (geometry.type == 'point') {
      return geometry;
    } else if (geometry.type == 'polyline') {
      let len = geometry.paths[0].length;
      let index = Math.floor(len / 2);
      return geometry.getPoint(0, index);
    } else if (geometry.type == 'polygon') {
      return geometry.centroid;
    }
  }
  public static getMostScale(
    view: __esri.MapView | __esri.SceneView,
    maxScale: number,
    minSacle: number
  ) {
    let most: number = 0;
    if (maxScale == 0 && minSacle == 0) {
      return 0;
    }
    let last: number = 0;
    let layer: any = view.map.allLayers.getItemAt(0);
    if (layer.tileInfo && layer.tileInfo.lods) {
      let lods = (view.map.allLayers.getItemAt(0) as any).tileInfo.lods;
      for (let i = 0; i < lods.length; i++) {
        let lod = lods[i];
        if (maxScale != 0) {
          if (lod.scale < maxScale) {
            most = last;
            break;
          }
        } else if (minSacle != 0 && lod.scale < minSacle) {
          most = lod.scale;
          break;
        }
        last = lod.scale;
      }
    }

    console.log(most);
    return most;
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
  public static getContent(attr: any, content: string) {
    let tipContent = content;
    if (content) {
      //键值对
      for (let fieldName in attr) {
        if (attr.hasOwnProperty(fieldName)) {
          tipContent = tipContent.replace(
            '{' + fieldName + '}',
            attr[fieldName]
          );
        }
      }
    }
    return tipContent;
  }
}
