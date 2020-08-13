import {
  IResult,
  IElectronicFence,
  IElectronicFenceParameter
} from '@/types/map';
import {loadModules} from "esri-loader";

export default class ElectronicFence {
  private static electronicFence:ElectronicFence
  private view!: __esri.MapView
  private fenceLayer!: __esri.GraphicsLayer

  constructor(view: __esri.MapView) {
    this.view = view
  }

  public static getInstance(view: __esri.MapView){
    if (!ElectronicFence.electronicFence) {
      ElectronicFence.electronicFence = new ElectronicFence(view);
    }

    return ElectronicFence.electronicFence;
  }

  private async createOverlayLayer(){
    type MapModules = [typeof import('esri/layers/GraphicsLayer')];
    const [GraphicsLayer] = await (loadModules([
      'esri/layers/GraphicsLayer'
    ]) as Promise<MapModules>);

    this.fenceLayer = new GraphicsLayer({
      id:"electronicFence_fenceLayer"
    });

    this.view.map.add(this.fenceLayer);
  }


}