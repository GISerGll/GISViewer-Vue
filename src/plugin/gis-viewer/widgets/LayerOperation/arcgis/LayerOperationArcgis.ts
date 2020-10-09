import {
  ILayerConfig
} from '@/types/map';
import {loadModules} from 'esri-loader';
export default class LayerOperationArcGIS {
    private static intances: Map<string, any>;
    private view!: __esri.MapView;

    private constructor(view: any) {
        this.view = view;
    }
    public static getInstance(view: __esri.MapView) {
        let id = view.container.id;
        if (!LayerOperationArcGIS.intances) {
            LayerOperationArcGIS.intances = new Map();
        }
        let instance = LayerOperationArcGIS.intances.get(id);
        if (!instance) {
            instance = new LayerOperationArcGIS(view);
            LayerOperationArcGIS.intances.set(id, instance);
        }
        return instance;
    }

    // public async arcgisLoadGDLayer() {
    //     type MapModules = [
    //         typeof import("esri/config"),
    //         typeof import("esri/request"),
    //         typeof import("esri/Color"),
    //         typeof import("esri/widgets/LayerList"),
    //         typeof import("esri/layers/BaseTileLayer")
    //     ];
    //     const [
    //         config,
    //         esriRequest,
    //         Color,
    //         LayerList,
    //         BaseTileLayer
    //     ] = await (loadModules([
    //         "esri/config",
    //         "esri/request",
    //         "esri/Color",
    //         "esri/widgets/LayerList",
    //         "esri/layers/BaseTileLayer"
    //     ]) as Promise<MapModules>);
    //
    //     // @ts-ignore
    //     let TintLayer = BaseTileLayer.createSubclass({
    //         properties: {
    //             urlTemplate: null,
    //             tint: {
    //                 value: null,
    //                 type: Color
    //             }
    //         },
    //
    //         // generate the tile url for a given level, row and column
    //         getTileUrl: function(level:any, row:any, col:any) {
    //             return this.urlTemplate
    //                 .replace("{z}", level)
    //                 .replace("{x}", col)
    //                 .replace("{y}", row);
    //         },
    //
    //         // override fetchTile() method to process the data returned
    //         // from the server.
    //         fetchTile: function (level:any, row:any, col:any, options:any) {
    //             // call getTileUrl method to construct the Url for the image
    //             // for given level, row and column
    //             let url = this.getTileUrl(level, row, col);
    //
    //             // request for the tile based on the url returned from getTileUrl() method.
    //             // the signal option ensures that obsolete requests are aborted.
    //             return esriRequest(url, {
    //                 responseType: "image",
    //                 signal: options && options.signal
    //             })
    //                 .then(function (response:any) {
    //                     // when esriRequest resolves successfully,
    //                     // process the image that is returned
    //                     var image = response.data;
    //                     // @ts-ignore
    //                     var width = this.tileInfo.size[0];
    //                     // @ts-ignore
    //                     var height = this.tileInfo.size[0];
    //
    //                     // create a canvas with a filled rectangle
    //                     var canvas = document.createElement("canvas");
    //                     var context:any = canvas.getContext("2d");
    //                     canvas.width = width;
    //                     canvas.height = height;
    //
    //                     // Apply the color provided the the layer to the fill rectangle
    //                     // @ts-ignore
    //                     if (this.tint) {
    //                         // @ts-ignore
    //                         context.fillStyle = this.tint.toCss();
    //                         context.fillRect(0, 0, width, height);
    //                         // apply multiply blend mode to canvas' fill color and the tile
    //                         // returned from the server to darken the tile
    //                         context.globalCompositeOperation = "multiply";
    //                     }
    //                     context.drawImage(image, 0, 0, width, height);
    //                     return canvas;
    //                 }.bind(this));
    //         }
    //     });
    //
    //     let stamenTileLayer = new TintLayer({
    //         urlTemplate: "http://webst01.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}",
    //         // tint: new Color("#004FBB"),
    //         title: "高德"
    //     });
    //
    //     this.view.map.add(stamenTileLayer);
    //     ///
    // }
    public async arcgisLoadGDLayer() {
        type MapModules = [
            typeof import("esri/config"),
            typeof import("esri/request"),
            typeof import("esri/Color"),
            typeof import("esri/widgets/LayerList"),
            typeof import("esri/layers/BaseTileLayer")
        ];
        const [
            config,
            esriRequest,
            Color,
            LayerList,
            BaseTileLayer
        ] = await (loadModules([
            "esri/config",
            "esri/request",
            "esri/Color",
            "esri/widgets/LayerList",
            "esri/layers/BaseTileLayer"
        ]) as Promise<MapModules>);

        // @ts-ignore
        let TintLayer = BaseTileLayer.createSubclass({
            properties: {
                urlTemplate: null,
                tint: {
                    value: null,
                    type: Color
                }
            },

            // generate the tile url for a given level, row and column
            getTileUrl: function(level:any, row:any, col:any) {
                var zoom = level - 1;
                var offsetX = Math.pow(2, zoom);
                var offsetY = offsetX - 1;
                var numX = col - offsetX;
                var numY = (-row) + offsetY;
                zoom = level + 1;
                var url = "http://online1.map.bdimg.com/tile/?qt=tile&x=" + numX + "&y=" + numY + "&z=" + zoom + "&styles=pl";
                return url;
            },

            // override fetchTile() method to process the data returned
            // from the server.
            fetchTile: function (level:any, row:any, col:any, options:any) {
                // call getTileUrl method to construct the Url for the image
                // for given level, row and column
                let url = this.getTileUrl(level, row, col);

                // request for the tile based on the url returned from getTileUrl() method.
                // the signal option ensures that obsolete requests are aborted.
                return esriRequest(url, {
                    responseType: "image",
                    signal: options && options.signal
                })
                    .then(function (response:any) {
                        // when esriRequest resolves successfully,
                        // process the image that is returned
                        var image = response.data;
                        // @ts-ignore
                        var width = this.tileInfo.size[0];
                        // @ts-ignore
                        var height = this.tileInfo.size[0];

                        // create a canvas with a filled rectangle
                        var canvas = document.createElement("canvas");
                        var context:any = canvas.getContext("2d");
                        canvas.width = width;
                        canvas.height = height;

                        // Apply the color provided the the layer to the fill rectangle
                        // @ts-ignore
                        if (this.tint) {
                            // @ts-ignore
                            context.fillStyle = this.tint.toCss();
                            context.fillRect(0, 0, width, height);
                            // apply multiply blend mode to canvas' fill color and the tile
                            // returned from the server to darken the tile
                            context.globalCompositeOperation = "multiply";
                        }
                        context.drawImage(image, 0, 0, width, height);
                        return canvas;
                    }.bind(this));
            }
        });

        let stamenTileLayer = new TintLayer({
            urlTemplate: "http://webst01.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}",
            // tint: new Color("#004FBB"),
            title: "高德"
        });

        this.view.map.add(stamenTileLayer);
    }
}