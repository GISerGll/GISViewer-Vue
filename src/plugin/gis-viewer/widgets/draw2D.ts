import {
    IDrawOverlayParameter, IPointSymbol,
    IResult
} from '@/types/map';
import {loadModules} from 'esri-loader';
import {OverlayArcgis2D} from "@/plugin/gis-viewer/widgets/Overlays/arcgis/OverlayArcgis2D";
import Graphic = __esri.Graphic;
export class Draw2D {
    private static draw2D: Draw2D;

    private overlayLayer!: __esri.GraphicsLayer;
    private view!: __esri.MapView;
    private draw!: __esri.Draw;
    private drawHandler: any

    private constructor(view: __esri.MapView) {
        this.view = view;
    }

    public static getInstance(view: __esri.MapView) {
        if (!Draw2D.draw2D) {
            Draw2D.draw2D = new Draw2D(view);
        }

        return Draw2D.draw2D;
    }
    //store the graphics you have drawn
    private async createOverlayLayer() {
        type MapModules = [typeof import('esri/layers/GraphicsLayer')];
        const [GraphicsLayer] = await (loadModules([
            'esri/layers/GraphicsLayer'
        ]) as Promise<MapModules>);
        this.overlayLayer = new GraphicsLayer({
            id:"draw2D"
        });
        this.view.map.add(this.overlayLayer);
    }

    public async startDrawOverlays(params: IDrawOverlayParameter){
        if (!this.overlayLayer) {
            await this.createOverlayLayer();
        }

        const [Draw] = await loadModules([
            'esri/views/draw/Draw',
        ]);
        this.draw = new Draw({
            view: this.view
        });

        const defaultSymbol = OverlayArcgis2D.makeSymbol(params.defaultSymbol);
        const drawType = params.drawType;
        const drawPropObj = {
            defaultSymbol:defaultSymbol,
            showPopup:params.showPopup,
            drawType:drawType,
            generateId:params.generateId,
            type:params.type,
            clearLastResults:params.clearLastResults
        }
        console.log(drawPropObj);

        if(!drawType){
            throw new Error("please input the drawType!")
        }
        switch (drawType) {
            case "point":
                return this.drawPoints(drawPropObj as any)
            case "polyline":
                return await this.drawPolylines(drawPropObj as any)
            case "polygon":
                return await this.drawPolygons(drawPropObj as any)
            case "circle":
                return await this.drawCircles(drawPropObj as any)
            default:
                return await this.drawPoints(drawPropObj as any)
        }
    }

    private async showPtGraphic(coordinates: [number,number]) {
        this.view.graphics.removeAll();
        const [Graphic] = await loadModules([
            'esri/Graphic',
        ]);

        let point = {
            type: "point", // autocasts as /Point
            x: coordinates[0],
            y: coordinates[1],
            spatialReference: this.view.spatialReference
        };

        let graphic = new Graphic({
            geometry: point,
            symbol: {
                type: "simple-marker", // autocasts as SimpleMarkerSymbol
                style: "square",
                color: "red",
                size: "16px",
                outline: { // autocasts as SimpleLineSymbol
                    color: [255, 255, 0],
                    width: 3
                }
            }
        });

        this.view.graphics.add(graphic);
    }

    private async addPtsGraphics(coordinates: number[],drawProperties:IDrawOverlayParameter):Promise<Graphic>{
        const [Graphic] = await loadModules([
            'esri/Graphic',
        ]);

        let point = {
            type: "point", // autocasts as /Point
            x: coordinates[0],
            y: coordinates[1],
            spatialReference: this.view.spatialReference
        };

        let defaultPtSymbol = {
            type: "simple-marker", // autocasts as SimpleMarkerSymbol
            style: "square",
            color: "red",
            size: "16px",
            outline: { // autocasts as SimpleLineSymbol
                color: [255, 255, 0],
                width: 3
            }
        }

        let ptSymbol:any;
        if(drawProperties.defaultSymbol){
            ptSymbol = OverlayArcgis2D.makeSymbol(drawProperties.defaultSymbol);
        }

        const isGenerateId = drawProperties.generateId;
        const type = drawProperties.type || "points";
        const clearLastResults = drawProperties.clearLastResults || false;

        let graphic = new Graphic({
            geometry: point,
            symbol:ptSymbol || defaultPtSymbol
        });

        if(isGenerateId){
            graphic.id = Math.random();
        }
        graphic.type = type;

        const fields = {
            id:graphic.id,
            type:graphic.type
        }
        graphic.attributes = fields;

        if(clearLastResults){
            const overlays2D = OverlayArcgis2D.getInstance(this.view);
            await overlays2D.deleteOverlays({
                types:[type]
            },this.overlayLayer);
        }

        await this.overlayLayer.add(graphic);
        return graphic;
    }

    private async addPolylineGraphic(vertices:any,drawProperties:IDrawOverlayParameter):Promise<Graphic>{
        this.overlayLayer.graphics.removeAll();
        let polyline = {
            type: "polyline", // autocasts as Polyline
            paths: vertices,
            spatialReference: this.view.spatialReference
        };

        const [Graphic] = await loadModules([
            'esri/Graphic',
        ]);

        let defaultLineSymbol = {
            type: "simple-line", // autocasts as SimpleLineSymbol
            color: [4, 90, 141],
            width: 3,
            cap: "round",
            join: "round"
        }

        let lineSymbol:any;
        if(drawProperties.defaultSymbol){
            lineSymbol = OverlayArcgis2D.makeSymbol(drawProperties.defaultSymbol);
        }

        let graphic = new Graphic({
            geometry: polyline,
            symbol: lineSymbol || defaultLineSymbol
        });

        await this.overlayLayer.add(graphic);
        return graphic;
    }

    private async addPolygonGraphic(vertices:any,drawProperties:IDrawOverlayParameter):Promise<Graphic>{
        this.view.graphics.removeAll();
        let polygon = {
            type: "polygon", // autocasts as Polygon
            rings: vertices,
            spatialReference: this.view.spatialReference
        };

        const [Graphic] = await loadModules([
            'esri/Graphic',
        ]);

        let defaultPolygonSymbol = {
            type: "simple-fill", // autocasts as SimpleFillSymbol
            color: "purple",
            style: "solid",
            outline: {  // autocasts as SimpleLineSymbol
                color: "white",
                width: 1
            }
        }
        let polygonSymbol:any;
        if(drawProperties.defaultSymbol){
            polygonSymbol = OverlayArcgis2D.makeSymbol(drawProperties.defaultSymbol);
        }

        var graphic = new Graphic({
            geometry: polygon,
            symbol: polygonSymbol || defaultPolygonSymbol
        });
        this.view.graphics.add(graphic);
        return graphic;
    }

    private async drawPoints(drawProperties:IDrawOverlayParameter):Promise<IResult>{
        let drawCount = 0;
        let pts:any[] = [];

        const [WebMercatorUtils] = await loadModules([
        'esri/geometry/support/webMercatorUtils'
      ]);
        //用view.on实现调用一次方法添加多个点
        let promiseObj = new Promise(resolve => {
            this.drawHandler = this.view.on("click",  ()=>{
                let drawAction = this.draw.create("point");

                drawAction.on([
                    "draw-complete"
                ], (evt) => {
                    drawCount++;
                    let promiseGraphic = this.addPtsGraphics(evt.coordinates,drawProperties);
                    promiseGraphic.then((value => {
                      value.geometry = WebMercatorUtils.webMercatorToGeographic(value.geometry);
                        pts.push(value);
                        drawCount++;
                    }))
                });
            })

            let handler = this.view.on("double-click",  ()=>{
                this.drawHandler.remove();
                handler.remove()

                resolve(pts);
            })
        })

        return {
            status:0,
            message:"ok",
            result:promiseObj
        }
    }

    private async drawPolylines(drawProperties:IDrawOverlayParameter):Promise<IResult>{
        let pts:any[] = [];

        //用view.on实现调用一次方法添加多个点
        let promiseObj = new Promise(resolve => {
            let drawAction = this.draw.create("polyline");
            console.log(drawAction)

            drawAction.on([
                "vertex-add",
                "vertex-remove",
                "cursor-update",
            ], (evt) => {
                this.addPolylineGraphic(evt.vertices,drawProperties);
            });

            drawAction.on([
                "draw-complete"
            ], (evt) => {
                console.log(drawAction);
                this.addPolylineGraphic(evt.vertices,drawProperties).then((value:Graphic) => {
                    pts.push(value);
                    resolve(pts);
                })
                // pts.push(this.addPolylineGraphic(evt.vertices));
            });
        })

        return {
            status:0,
            message:"ok",
            result:promiseObj
        }
    }

    private async drawPolygons(drawProperties:IDrawOverlayParameter):Promise<IResult>{
        let pts:any[] = [];

        //用view.on实现调用一次方法添加多个点
        let promiseObj = new Promise(resolve => {
            let drawAction = this.draw.create("polyline");
            console.log(drawAction)

            drawAction.on([
                "vertex-add",
                "vertex-remove",
                "cursor-update",
            ], (evt) => {
                this.addPolygonGraphic(evt.vertices,drawProperties);
            });

            drawAction.on([
                "draw-complete"
            ], (evt) => {
                console.log(drawAction);
                this.addPolygonGraphic(evt.vertices,drawProperties).then((value:Graphic) => {
                    pts.push(value);
                    resolve(pts);
                })
                // pts.push(this.addPolylineGraphic(evt.vertices));
            });
        })

        return {
            status:0,
            message:"ok",
            result:promiseObj
        }
    }

    private async drawRectangle(drawProperties:IDrawOverlayParameter):Promise<IResult>{
        return {
            status:0,
            message:"ok",
            result:"rectangles"
        }
    }

    private async drawCircles(drawProperties:IDrawOverlayParameter):Promise<IResult>{
        return {
            status:0,
            message:"ok",
            result:"rectangles"
        }
    }

    private async drawEllipses(drawProperties:IDrawOverlayParameter):Promise<IResult>{
        return {
            status:0,
            message:"ok",
            result:"ellipses"
        }
    }
}