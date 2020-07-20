import {
    IDrawOverlayParameter, IPointSymbol,
    IResult
} from '@/types/map';
import {loadModules} from 'esri-loader';
import {OverlayArcgis2D} from "@/plugin/gis-viewer/widgets/OverlayArcgis2D";
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
        this.overlayLayer = new GraphicsLayer();
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
            generateId:params.id,
            type:params.type,
            boolean:params.clearLastResults
        }

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

        var point = {
            type: "point", // autocasts as /Point
            x: coordinates[0],
            y: coordinates[1],
            spatialReference: this.view.spatialReference
        };

        var graphic = new Graphic({
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

    private async addPtsGraphics(coordinates: [number,number],drawProperties:IDrawOverlayParameter):Promise<Graphic>{
        const [Graphic] = await loadModules([
            'esri/Graphic',
        ]);

        var point = {
            type: "point", // autocasts as /Point
            x: coordinates[0],
            y: coordinates[1],
            spatialReference: this.view.spatialReference
        };

        var graphic = new Graphic({
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

        await this.overlayLayer.add(graphic);
        return graphic;
    }

    private async drawPoints(drawProperties:IDrawOverlayParameter):Promise<IResult>{
        let drawCount = 0;
        let pts:any[] = [];

        //用view.on实现调用一次方法添加多个点
        let promiseObj = new Promise(resolve => {
            this.drawHandler = this.view.on("click",  ()=>{
                let drawAction = this.draw.create(drawProperties.drawType as any);

                drawAction.on([
                    "draw-complete"
                ], (evt) => {
                    drawCount++;
                    let promiseGraphic = this.addPtsGraphics(evt.coordinates,drawProperties);
                    promiseGraphic.then((value => {
                        pts.push(value);
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

        return {
            status:0,
            message:"ok",
            result:"polylines"
        }
    }

    private async drawPolygons(drawProperties:IDrawOverlayParameter):Promise<IResult>{

        return {
            status:0,
            message:"ok",
            result:"polygons"
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