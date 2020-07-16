import {loadModules} from 'esri-loader';
export class Draw2D {
    private static draw2D: Draw2D;

    private overlayLayer!: __esri.GraphicsLayer;
    private view!: __esri.MapView;

    private constructor(view: __esri.MapView) {
        this.view = view;
    }

    public static getInstance(view: __esri.MapView) {
        if (!Draw2D.draw2D) {
            Draw2D.draw2D = new Draw2D(view);
        }

        return Draw2D.draw2D;
    }


}