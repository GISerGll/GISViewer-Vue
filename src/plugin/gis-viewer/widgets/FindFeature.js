import { loadModules } from 'esri-loader';
export class FindFeature {
    constructor(view) {
        this.view = view;
    }
    static getInstance(view) {
        if (!FindFeature.findFeature) {
            FindFeature.findFeature = new FindFeature(view);
        }
        return FindFeature.findFeature;
    }
    async findLayerFeature(params) {
        let type = params.layerName;
        let ids = params.ids || [];
        let level = params.level || this.view.zoom;
        this.view.map.allLayers.forEach((layer) => {
            if (params.layerName && layer.label === params.layerName) {
                if (layer.visible) {
                    console.log(layer);
                    this.doFindTask({
                        url: layer.url,
                        layer: layer,
                        layerIds: this.getLayerIds(layer),
                        ids: ids
                    });
                }
            }
        });
        return {
            status: 0,
            message: 'ok'
        };
    }
    getLayerIds(layer) {
        let layerids = [];
        if (layer.type == 'feature') {
            //featurelayer查询
            layerids.push(layer.layerId);
        }
        else if (layer.type == 'map-image') {
            let sublayers = layer.sublayers;
            sublayers.forEach((sublayer) => {
                if (sublayer.visible) {
                    layerids.push(sublayer.id);
                }
            });
        }
        return layerids;
    }
    async doFindTask(options) {
        const [Graphic, FindTask, FindParameters] = await loadModules([
            'esri/Graphic',
            'esri/tasks/FindTask',
            'esri/tasks/support/FindParameters'
        ]);
        let ids = options.ids;
        let symbol = ''; //options.layer.renderer.symbol;
        let that = this;
        let promises = ids.map((searchText) => {
            return new Promise((resolve, reject) => {
                let findTask = new FindTask(options.url); //创建属性查询对象
                let findParams = new FindParameters(); //创建属性查询参数
                findParams.returnGeometry = true; // true 返回几何信息
                // findParams.layerIds = [0, 1, 2]; // 查询图层id
                findParams.layerIds = options.layerIds; // 查询图层id
                findParams.searchFields = ['DEVICEID', 'BM_CODE', 'FEATUREID']; // 查询字段 artel
                findParams.searchText = searchText; // 查询内容 artel = searchText
                // 执行查询对象
                findTask.execute(findParams).then((data) => {
                    let results = data.results;
                    if (results.length < 1)
                        return [];
                    console.log(results);
                    let graphics = [];
                    const feats = results.map((item) => {
                        let gra = item.feature;
                        gra.symbol = symbol;
                        graphics.push(gra);
                        return item.feature.attributes;
                    });
                    //that.startJumpPoint(graphics);
                    resolve(feats);
                });
            });
        });
        return new Promise((resolve) => {
            Promise.all(promises).then((e) => {
                resolve(e);
            });
        });
    }
    async startJumpPoint(graphics) {
    }
}
//# sourceMappingURL=FindFeature.js.map