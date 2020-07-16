import { loadModules } from 'esri-loader';
export default class HighFeauture3D {
    constructor(view, graphics) {
        // Geometrical transformations that must be recomputed
        // from scratch at every frame.
        this.view = view;
        this.graphics = graphics;
    }
    static getInstance(view, graphics) {
        if (!HighFeauture3D.highfeature) {
            HighFeauture3D.highfeature = new HighFeauture3D(view, graphics);
        }
        return HighFeauture3D.highfeature;
    }
    async startup() {
        let that = this;
        loadModules(['esri/views/3d/externalRenderers']).then(([externalRenderers]) => {
            if (that.jumpRender) {
                externalRenderers.remove(this.view, this.jumpRender);
                that.jumpRender.clear();
                that.jumpRender = null;
            }
            that.jumpRender = new HighFeautureRender(that.view, that.graphics);
            externalRenderers.add(this.view, this.jumpRender);
        });
    }
}
class HighFeautureRender {
    constructor(view, graphics) {
        this.isUp = true;
        this.upDis = 25;
        this.currentDis = 0;
        this.upCount = 1;
        // Geometrical transformations that must be recomputed
        // from scratch at every frame.
        this.view = view;
        this.graphics = graphics;
    }
    // Called once a custom layer is added to the map.layers collection and this layer view is instantiated.
    async setup(context) {
        this.graphicsClone = [];
        await loadModules([
            'esri/views/3d/externalRenderers',
            'esri/layers/GraphicsLayer',
            'esri/Graphic'
        ]).then(([externalRenderers, GraphicsLayer, Graphic]) => {
            this.externalRenderers = externalRenderers;
            this.GraphicsLayer = GraphicsLayer;
            this.Graphic = Graphic;
            this.overlayer = new GraphicsLayer();
            this.graphics.forEach((graphic, index) => {
                graphic.visible = false;
                this.upDis = Math.min(Math.round(graphic.symbol.symbolLayers.getItemAt(0).size / 2.0), 25);
                var g = new this.Graphic({
                    geometry: graphic.geometry,
                    symbol: graphic.symbol.clone(),
                    attributes: { id: index }
                });
                this.graphicsClone.push(g);
            }, this);
            this.view.map.add(this.overlayer);
        });
    }
    async clear() {
        this.overlayer.removeAll();
        this.view.map.remove(this.overlayer);
        this.graphics.forEach((graphic) => {
            graphic.visible = true;
        }, this);
        this.upDis == 0;
    }
    // Called every time a frame is rendered.
    async render(context) {
        if (this.upDis == 0) {
            this.overlayer.removeAll();
            this.view.map.remove(this.overlayer);
            this.graphics.forEach((graphic) => {
                graphic.visible = true;
            }, this);
            return;
        }
        this.graphicsClone.forEach((graphic) => {
            graphic.symbol.symbolLayers.getItemAt(0).anchor = 'relative';
            if (this.isUp) {
                if (graphic.symbol.symbolLayers.getItemAt(0).anchorPosition == undefined) {
                    graphic.symbol.symbolLayers.getItemAt(0).anchorPosition = {
                        x: 0,
                        y: 0
                    };
                }
                graphic.symbol.symbolLayers.getItemAt(0).anchorPosition.y += 0.1;
                if (this.currentDis >= this.upDis) {
                    //切换弹跳方向
                    this.currentDis = 0;
                    this.isUp = false;
                }
            }
            else {
                graphic.symbol.symbolLayers.getItemAt(0).anchorPosition.y -= 0.1;
                if (this.currentDis >= this.upDis) {
                    //切换弹跳方向
                    this.currentDis = 0;
                    this.isUp = true;
                    this.upCount += 0.1;
                    this.upDis = Math.round(this.upDis / this.upCount);
                }
            }
            this.currentDis += 2;
            //this.overlayer.remove(gra);
            var gra = new this.Graphic({
                geometry: graphic.geometry,
                symbol: graphic.symbol.clone(),
                attributes: graphic.attributes
            });
            this.removeGraphic(graphic.attributes.id);
            this.overlayer.add(gra);
        }, this);
        if (this.upDis > 0) {
            this.externalRenderers.requestRender(this.view);
        }
    }
    removeGraphic(id) {
        if (this.overlayer && this.overlayer.graphics.length > 0) {
            for (let i = 0; i < this.overlayer.graphics.length; i++) {
                let g = this.overlayer.graphics.getItemAt(i);
                if (g && g.attributes.id == id) {
                    console.log(id);
                    this.overlayer.remove(g);
                    break;
                }
            }
        }
    }
}
//# sourceMappingURL=HighFeauture3D.js.map