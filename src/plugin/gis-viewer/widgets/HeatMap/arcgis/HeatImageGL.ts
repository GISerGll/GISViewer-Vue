import {loadModules} from 'esri-loader';
import {resolve, reject} from 'esri/core/promiseUtils';
export default class HeatImageGL {
  private static intances: Map<string, any>;
  public view: any;
  private heatmapInstance: any;
  private customLayer: any;
  private heat: any;
  private scale: number = 144447;
  private allImage: any;
  private heatData: any;

  private constructor(view: __esri.MapView | __esri.SceneView) {
    // Geometrical transformations that must be recomputed
    // from scratch at every frame.
    this.view = view;
  }
  public static getInstance(view: __esri.MapView | __esri.SceneView) {
    let id = view.container.id;
    if (!HeatImageGL.intances) {
      HeatImageGL.intances = new Map();
    }
    let intance = HeatImageGL.intances.get(id);
    if (!intance) {
      intance = new HeatImageGL(view);
      HeatImageGL.intances.set(id, intance);
    }
    return intance;
  }
  private clear() {
    if (this.customLayer) {
      this.view.map.remove(this.customLayer);
    }
    if (this.heat) {
      this.heat.parentNode.removeChild(this.heat);
      this.heat = null;
    }
  }
  public async startup() {
    this.clear();
    const [h337] = await loadModules(['libs/heatmap.min.js']);
    let heatDiv = document.createElement('div');
    heatDiv.style.width = this.view.width + 'px';
    heatDiv.style.height = this.view.height + 'px';
    heatDiv.setAttribute('id', 'heatmapdiv');
    heatDiv.style.position = 'absolute';
    heatDiv.style.top = '0px';
    heatDiv.style.left = '0px';
    let parent = document.getElementsByClassName('esri-overlay-surface')[0];
    parent.appendChild(heatDiv);
    this.heat = heatDiv;

    let heatmapInstance = h337.create({
      // only container is required, the rest will be defaults
      container: heatDiv,
      radius: 23
    });
    let pdata = [];
    for (let i = 0; i < 400; i++) {
      var temp = Math.floor(Math.random() * 1000) % 2 == 0 ? 1 : -1;
      var temp2 = Math.floor(Math.random() * 1000) % 3 == 0 ? 1 : -1;
      var x1 = 1 + (1 * (Math.random() * 500 - 1)) / 1;
      var y1 = 1 + (1 * (Math.random() * 500 - 1)) / 1;
      var value = Math.floor(1000 * Math.random() + 1);
      pdata.push({
        x: Math.floor(x1),
        y: Math.floor(y1),
        value: value
      });
    }
    var data = {
      max: 1000,
      min: 0,
      data: pdata
    };
    let step = this.scale / this.view.scale;
    this.heatData = pdata;
    heatmapInstance.setData(data);
    this.heatmapInstance = heatmapInstance;
    heatDiv.style.display = 'none';
    let image = new Image();
    image.src = 'http://localhost/vc.png';
    image.width = 500;
    image.height = 300;
    this.allImage = image;
    image.onload = (e: any) => {
      this.adds();
    };
  }
  public async adds() {
    let _that = this;
    let pt = [121.43, 31.15];
    await loadModules([
      'esri/layers/BaseDynamicLayer',
      'esri/views/2d/layers/BaseLayerView2D',
      'esri/geometry/Point',
      'esri/geometry/SpatialReference',
      'esri/layers/GraphicsLayer',
      'esri/layers/Layer',
      'esri/Graphic',
      'esri/core/watchUtils',
      'libs/heatmap.min.js'
    ]).then(
      ([
        BaseDynamicLayer,
        BaseLayerView2D,
        Point,
        SpatialReference,
        GraphicsLayer,
        Layer,
        Graphic,
        watchUtils,
        h337
      ]) => {
        let TileBorderLayerView2D = BaseLayerView2D.createSubclass({
          render: (renderParameters: any) => {
            var context = renderParameters.context;
            let step = _that.scale / _that.view.scale;
            let point = new Point({
              x: pt[0],
              y: pt[1],
              spatialReference: new SpatialReference({wkid: 4326})
            });
            let pcc = _that.view.toScreen(point);
            _that.heat.innerHTML = '';
            let heatmapInstance = h337.create({
              // only container is required, the rest will be defaults
              container: _that.heat,
              radius: 23 * step
            });
            let pdata = _that.heatData;
            let pdata2 = pdata.map((dt: any) => {
              return {
                x: Math.floor(dt.x * step),
                y: Math.floor(dt.y * step),
                value: dt.value
              };
            });

            var resdata = {
              max: 1000,
              min: 0,
              data: pdata2
            };
            heatmapInstance.setData(resdata);
            // setTimeout((e: any) => {

            // }, 100);
            let canvas = _that.heat.firstChild;
            // _that.allImage.width = 500 * step;
            // _that.allImage.height = 300 * step;
            let cts = canvas.getContext('2d');
            cts.globalCompositeOperation = 'destination-atop';
            cts.drawImage(_that.allImage, 100, 200, 500 * step, 300 * step);
            //console.log(canvas.width + ',' + canvas.height);
            context.drawImage(canvas, pcc.x, pcc.y, 500 * step, 300 * step);
          }
        });
        let CustomTileLayer = Layer.createSubclass({
          createLayerView: (view: any) => {
            if (view.type === '2d') {
              return new TileBorderLayerView2D({
                view: view,
                layer: this
              });
            }
          }
        });
        let wmsLayer = new CustomTileLayer();
        _that.customLayer = wmsLayer;
        _that.view.map.layers.add(wmsLayer);
      }
    );
  }
}