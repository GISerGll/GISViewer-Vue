import {
  IOverlayParameter,
  IPointSymbol,
  IPolylineSymbol,
  IResult,
  IPopUpTemplate,
  IOverlayClusterParameter,
  IOverlayDelete,
  IFindParameter,
  IPicChangeParameter
} from '@/types/map';
import TooltipPGIS from "@/plugin/gis-viewer/widgets/Overlays/pgis-ls/TooltipPGIS";
import {loadModules} from "esri-loader";

export default class OverlayPGIS {
  private static intances: Map<string, any>;

  private view!: any;
  private overlays = new Array();

  private tooltip:any;
  private popupTypes: Map<string, any> = new Map<string, any>();
  private tooltipTypes:Map<string, any> = new Map<string, any>();

  private popup:any;

  private layerGroups: Map<string, any> = new Map<     //所有覆盖物的图层组
      string,
      any
      >();
  private overlayLayer!: any;                          //一次添加覆盖物的图层组

  private constructor(view: any) {
    this.view = view;
  }

  public static getInstance(view: any) {
    let id = view.getContainer().id;
    if (!OverlayPGIS.intances) {
      OverlayPGIS.intances = new Map();
    }
    let intance = OverlayPGIS.intances.get(id);
    if (!intance) {
      intance = new OverlayPGIS(view);
      OverlayPGIS.intances.set(id, intance);
    }
    return intance;
  }
  private async getOverlayLayer(type: string) {
    let group = this.layerGroups.get(type);
    if (!group) {
      group = await this.createOverlayLayer(type);
    }
    return group;
  }
  private async createOverlayLayer(
      type: string
  ): Promise<any> {

    // let overlayLayer: __esri.GraphicsLayer = new GraphicsLayer();
    // this.view.map.add(overlayLayer);
    // this.overlayGroups.set(type, overlayLayer);
    // return overlayLayer;
  }
  public async addOverlays(params: IOverlayParameter): Promise<IResult> {
    const defaultSymbol = params.defaultSymbol;
    const defaultType = params.type;
    const defaultButtons = params.defaultButtons;
    //默认弹窗样式
    const defaultInfoTemplate = params.defaultInfoTemplate;
    //自定义vue弹窗样式
    /************auto/move/show-popup/tooltip*****************/
    const showPopup = params.showPopup;
    const showTooltip = params.showTooltip;
    const moveTooltip = params.moveTooltip;
    const movePopup = params.movePopup;
    const autoPopup = params.autoPopup;
    const autoTooltip = params.autoTooltip;

    const tooltipComponent = params.tooltipComponent;
    const popupComponent = params.popupComponent;

    const popupAndTooltip = {
      showPopup,
      showTooltip,
      moveTooltip,
      movePopup,
      autoPopup,
      autoTooltip
    };

    const componentsObj = {
      tooltipComponent,
      popupComponent
    }

    let addCount = 0;

    return {
      status: 0,
      message: 'ok',
      result: `成功添加${params.overlays.length}中的${addCount}个覆盖物`
    };
  }
}