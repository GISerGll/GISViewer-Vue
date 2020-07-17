import {
    IDrawOverlayParameter,
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

    public async startDrawOverlays(params: IDrawOverlayParameter) {
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
        const showPopup = params.showPopup;
        const drawType = params.drawType;
        const generateId = params.id;
        const type = params.type;
        const boolean = params.clearLastResults;

        let drawCount = 0;
        if(!drawType){
            throw new Error("please input the drawType!")
        }

        let drawAction = this.draw.create(drawType);

        drawAction.on("cursor-update", (evt) => {
            this.createGraphic(evt.vertices);
        });
        drawAction.on("draw-complete", (evt) => {
            drawCount++;
            this.createGraphic(evt.vertices);
        });

        drawAction.on("vertex-add", (evt)=>{
            this.createGraphic(evt.vertices);
        });

        // Fires when the "Z" key is pressed to undo the last added point
        drawAction.on("vertex-remove", (evt)=>{
            this.createGraphic(evt.vertices);
        });
    }

    private async createGraphic(vertices: any):Promise<Graphic> {
        this.view.graphics.removeAll();
        const [Graphic,Multipoint] = await loadModules([
            'esri/Graphic',
            'esri/geometry/Multipoint'
        ]);

        var multipoint = new Multipoint({
            points: vertices,
            spatialReference: this.view.spatialReference
        });
        var graphic = new Graphic({
            geometry: multipoint,
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
        return graphic;
    }



}