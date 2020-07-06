import {ICenterLevel, IPointGeometry} from "@/types/map";

export class MapManager{
    private static view2D: MapManager
    private view!: __esri.MapView;

    private constructor(view: __esri.MapView) {
        this.view = view;
    }

    public static getInstance(view: __esri.MapView) {
        if (!MapManager.view2D) {
            MapManager.view2D = new MapManager(view);
        }

        return MapManager.view2D;
    }

    public setMapCenter(params: IPointGeometry) {
        const mapCenter = MapManager.getInstance(this.view);
        mapCenter.view.set({
            center:params
        })
        console.log(mapCenter);
    }

    public setMapCenterAndLevel(params: ICenterLevel) {
        const mapCenter = MapManager.getInstance(this.view);
        mapCenter.view.set({
            center:[params.x,params.y],
            zoom:params.level
        })
    }
}