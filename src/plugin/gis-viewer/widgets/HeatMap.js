import { loadModules } from 'esri-loader';
export class HeatMap {
    constructor(view) {
        this.view = view;
    }
    static getInstance(view) {
        if (!HeatMap.heatMap) {
            HeatMap.heatMap = new HeatMap(view);
        }
        return HeatMap.heatMap;
    }
    static destroy() {
        HeatMap.heatMap = null;
    }
    async deleteHeatMap() {
        this.clear();
    }
    clear() {
        if (this.heatlayer) {
            this.view.map.remove(this.heatlayer);
        }
    }
    async addHeatMap(params) {
        // Create featurelayer from client-side graphics
        this.clear();
        const [Graphic, FeatureLayer, HeatmapRenderer] = await loadModules([
            'esri/Graphic',
            'esri/layers/FeatureLayer',
            'esri/renderers/HeatmapRenderer'
        ]);
        let points = params.points;
        let options = params.options;
        let graphics = [];
        let fields = [
            {
                name: 'ObjectID',
                alias: 'ObjectID',
                type: 'oid'
            }
        ];
        let fieldName = points[0].fields;
        for (let str in fieldName) {
            let fieldtype = 'string';
            if (str == options.field) {
                fieldtype = 'double';
            }
            fields.push({ name: str, alias: str, type: fieldtype });
        }
        graphics = points.map((point) => {
            return new Graphic({
                geometry: {
                    type: 'point',
                    x: point.geometry.x,
                    y: point.geometry.y
                },
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
        let colors = params.options.colors || [
            'rgb(255, 255, 255)',
            'rgb(255, 140, 0)',
            'rgb(255, 140, 0)',
            'rgb(255, 0, 0)'
        ];
        let simpleRenderer = this.getRender(options.renderer);
        let heatmapRenderer = {
            type: 'heatmap',
            field: options.field,
            colorStops: this.getHeatColor(colors),
            minPixelIntensity: 0,
            maxPixelIntensity: options.maxValue
        };
        layer.renderer =
            this.view.zoom > maxzoom ? simpleRenderer : heatmapRenderer;
        this.view.map.add(layer);
        this.view.watch('zoom', (newValue) => {
            layer.renderer = newValue > maxzoom ? simpleRenderer : heatmapRenderer;
        });
    }
    getRender(renderer) {
        let newrender = renderer;
        if (newrender.symbol) {
            newrender.symbol.type = newrender.symbol.type
                .replace('esriPMS', 'picture-marker')
                .replace('esriSMS', 'simple-marker');
        }
        return newrender;
    }
    getHeatColor(colors) {
        let obj = [
            { ratio: 0, color: 'rgba(255, 255, 255, 0)' },
            { ratio: 0.2, color: 'rgba(255, 255, 255, 1)' },
            { ratio: 0.5, color: 'rgba(255, 140, 0, 1)' },
            { ratio: 0.8, color: 'rgba(255, 140, 0, 1)' },
            { ratio: 1, color: 'rgba(255, 0, 0, 1)' }
        ]; //默认值
        if (colors && colors.length >= 4) {
            //"rgba(30,144,255,0)","rgba(30,144,255)","rgb(0, 255, 0)","rgb(255, 255, 0)", "rgb(254,89,0)"
            let steps = [0.2, 0.5, 0.8, 1];
            let colorStops = [{ ratio: 0, color: 'rgba(255, 255, 255, 0)' }];
            steps.forEach((element, index) => {
                colorStops.push({ ratio: element, color: colors[index] });
            });
            console.log(colorStops);
            return colorStops;
        }
        return obj;
    }
    async addOverlays(params) { }
}
//# sourceMappingURL=HeatMap.js.map