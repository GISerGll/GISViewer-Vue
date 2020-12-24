import {Vue} from 'vue-property-decorator';
export interface IResult {
  //本次接口调用状态，如果成功返回0，如果失败返回其他数字。
  status: number;
  //对接口调用状态值的英文说明，如果成功返回"ok"，并返回结果字段，如果失败返回错误说明。
  message: string;
  //接口调用结果
  result?: any;
}

export enum Platforms {
  ArcGIS3D = 'arcgis3d',
  ArcGIS2D = 'arcgis2d',
  BDMap = 'bd',
  AMap = 'gd',
  PGIS_LS = 'pgis_ls'
}

export interface ILayerConfig {
  type?: string;
  label?: string;
  url?: string;
  visible?: boolean;
  expression?: string[] | Object[];
  subDomains?: Array<string>;
}

export interface IPointSymbol {
  type: string; //point-2d/point-3d
  //2D时为图片地址
  //3D时为模型地址
  url?: string;
  //使用图元时的图元类型
  //2D图元
  //"circle" | "square" | "cross" | "x" | "kite" | "triangle"
  //3D图元
  //"sphere" | "cylinder" | "cube" | "cone" | "inverted-cone" | "diamond" | "tetrahedron"
  primitive?: string;
  color?: number | string | number[]; //使用图元时的图元颜色
  outline?: {
    //使用图元时的图元边框
    size?: number;
    color?: number | string;
  };
  //[width, height, depth], number单位默认为pt, 可以使用'pt'或'px'
  //depth在point-3D时可用
  //size = 14; size = ["12pt", "14pt"]
  size?: Array<number | string> | number | string;
  //锚点
  //"center" | "left" | "right" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right"
  anchor?: string;
  //旋转角度，在point-3d时代表[x轴角度, y轴角度, z轴角度]
  //在point-2d时代表中心旋转角度
  rotation?: Array<number> | number;
  width?: number | string;
  height?: number | string;
  xoffset?: number | string;
  yoffset?: number | string;
}

export interface IPolylineSymbol {
  type: string; //line-2d/line-3d
  isoutline?: boolean;
  outlineColor?: string;
  borderWeight?: number;
  color?: string;
  opacity?: number;
  width?: number;
  style?: 'solid' | 'dashed' | undefined;
  dashArray?: [number, number] | [number, number, number, number] | undefined;
  lineJoin?: 'miter' | 'bevel' | 'round' | undefined;
  lineCap?: 'round' | 'butt' | 'square' | undefined;
  zIndex?: number;
}

export interface IPolygonSymbol {
  type: string;
  outline: IPolylineSymbol;
  color?: string;
  opacity?: number;
  zIndex?: number;
}

export interface IPointGeometry {
  x: number;
  y: number;
  z?: number;
}

export interface IPolylineGeometry {
  path: Array<IPointGeometry>;
}

export interface IPolygonGeometry {
  ring: Array<IPointGeometry>;
}

export interface ICenterLevel {
  x: number;
  y: number;
  level?: number;
}

export interface IOverlay {
  id?: string; //覆盖物编号, 用于按编号/类型删除
  type?: string; //覆盖物类型, 用于按编号/类型删除
  symbol: IPointSymbol | IPolylineSymbol;
  geometry: IPointGeometry | IPolylineGeometry | IPolygonGeometry;
  fields: any;
  zooms?: [number, number];
  buttons: string[];
}

export interface IOverlayParameter {
    defaultType?: string;
    type?: string;
    defaultSymbol?: IPointSymbol | IPolylineSymbol;
    defaultZoom?: number;          //添加单个覆盖物默认缩放等级
    defaultZooms?: [number, number];
    overlays: Array<IOverlay>;
    autoPopup?: boolean;  //自动显示弹窗
    autoTooltip?:boolean; //自动显示小提示
    showPopup?: boolean;  //点击显示弹窗
    showTooltip?: boolean; //点击显示小提示
    movePopup?:boolean;   //移到点位显示弹窗
    moveTooltip?:boolean; //移动点位显示小提示
    defaultInfoTemplate?: IPopUpTemplate;
    defaultButtons?: Object[];
    tooltipContent?: string; //悬浮窗内容
    defaultVisible?: boolean;
    tooltipComponent?: Vue.Component
    popupComponent?: Vue.Component
    iswgs?: boolean;
    custom: {content: string; zooms: [number, number]; visible: true};
    centerResult?: boolean;
  showToolTip?: boolean; //鼠标移到该点位是，是否显示悬浮窗
  toolTipContent?: string; //悬浮窗内容
  showRegion?: boolean;
}
export interface IOverlayClusterParameter {
  points?: Array<IOverlay>;
  overlays?: Array<IOverlay>;
  type?: string;
  zoom: number;
  custom: any;
  ispic: boolean;
  distance: number;
  defaultSymbol?: IPointSymbol;
  clusterSymbol?: IPointSymbol;
  defaultVisible: boolean;
  defaultTooltip: string;
  subType: string;
}

export interface IDrawOverlayParameter {
  drawType: string;
  defaultSymbol?: IPointSymbol | IPolylineSymbol | IPolygonSymbol;
  showPopup?: boolean;
  showTooltip?: boolean;
  type?: string;               //覆盖物类型, 用于按编号/类型删除
  generateId?: boolean;                 //是否随机生成覆盖物编号, 用于按编号/类型删除
  clearLastResult?: boolean;  //清除上一次绘画结果（调用一次方法只能存在一个graphic）
  onlyOnce?:boolean;
  callback?: boolean
}
export interface IMapContainer {
  // addLayer: (param:ILayerConfig) => Promise<IResult>;
  // deleteLayer: (param:ILayerConfig) => Promise<IResult>;
  // layerDefinition: (param:ILayerConfig) => Promise<IResult>;
  addOverlays: (param: IOverlayParameter) => Promise<IResult>;
  // showTooltip: (param:Vue.Component) => Promise<IResult>;
  closeTooltip: () => Promise<IResult>;
  addHeatMap: (param: IHeatParameter) => void;
  addOverlaysCluster: (param: IOverlayClusterParameter) => void;
  deleteOverlays: (param: IOverlayDelete) => Promise<IResult>;
  deleteOverlaysCluster: (param: IOverlayDelete) => void;
  deleteAllOverlays: () => void;
  deleteAllOverlaysCluster: () => void;
  deleteHeatMap: () => void;
  showLayer: (param: ILayerConfig) => Promise<IResult>;
  hideLayer: (param: ILayerConfig) => Promise<IResult>;
  hideOverlays: (param: IDrawOverlaysDelete) => Promise<IResult>;
  showOverlays: (param: IDrawOverlaysDelete) => Promise<IResult>;
  setMapCenter: (param: IPointGeometry) => void;
  setMapCenterAndLevel: (param: ICenterLevel) => void;
  showJurisdiction: () => void;
  hideJurisdiction: () => void;
  showDistrictMask: (param: IDistrictParameter) => void;
  hideDistrictMask: () => void;
  findFeature: (param: IFindParameter) => any;
  findOverlays: (param: IFindParameter) => Promise<IResult>;
  showRoad: (param: { ids: string[] }) => void;
  hideRoad: () => void;
  showStreet: () => void;
  hideStreet: () => void;
  locateStreet: (param: IStreetParameter) => void;
  startDrawOverlays: (param: IDrawOverlays) => Promise<IResult>
  startTrackPlayback: (param: ITrackPlaybackParameter) => Promise<IResult>
  startRealTrackPlayback: (param: ITrackPlaybackParameter) => Promise<IResult>
  pausePlayback: () => void;
  goOnPlayback: () => void;
  setMapStyle: (style: string) => void;
  routeSearch: (param: any) => Promise<IResult>;
  clearRouteSearch: () => void;
  showRoutePoint: (params: any) => void;
  clearRoutePoint: () => void;
  addDrawLayer: (params: any) => Promise<IResult>;
  clearDrawLayer: (params: ILayerConfig) => void;
  showMigrateChart: (params: any) => void;
  hideMigrateChart: () => void;
  addHeatImage2D: (params: IHeatImageParameter) => void;
  addHeatImage3D: (params: IHeatImageParameter) => void;
  deleteHeatImage: () => void;
  startGeometrySearch: (params: IGeometrySearchParameter) => Promise<IResult>;
  clearGeometrySearch: () => void;
  showDgene: (params: any) => Promise<IResult>;
  hideDgene: () => void;
  showMonitorArea: (param: IMonitorAreaParameter) => Promise<IResult>;
  showCircleOutline: (param: ICircleOutline) => Promise<IResult>;
  createPlaceFence: (param: IElectronicFenceParameter) => Promise<IResult>;
  createLineFence: (param: IElectronicFenceParameter) => Promise<IResult>;
  createElectFenceByEndPtsConnection: (param: IElectronicFenceParameter) => Promise<IResult>;
  showEditingLabel: (param: IEditFenceLabel) => Promise<IResult>;
  addDgeneFusion: (params: any) => Promise<IResult>;
  restoreDegeneFsion: () => Promise<IResult>;
  showBarChart: (params: any) => void;
  hideBarChart: () => void;
  showCustomTip: (params: ICustomTip) => void;
  showDgeneOutPoint: (params: any) => void;
  changeDgeneOut: () => void;
  initializeRouteSelect: (params: ISelectRouteParam) => Promise<void>;
  showSelectedRoute: (params: ISelectRouteResult) => Promise<void>;
  stopDrawOverlays: (params: any) => Promise<IResult>;
  deleteDrawOverlays: (params: IDrawOverlaysDelete) => Promise<IResult>;
  playSelectedRoute: (speed: number) => Promise<void>;
  stopPlaySelectedRoute: () => void;
  routeHitArea: (params: ISelectRouteHitTest) => Promise<IResult>;
  areaHitRoute: (params: ISelectRouteHitTest) => Promise<IResult>;
  getDrawOverlays: () => Promise<IResult>;
  arcgisLoadGDLayer: () => void;
  backgroundGeometrySearch: (params: IGeometrySearchParameter) => Promise<IResult>;
  polylineRanging: (params: IPolylineRangingParameter) => Promise<IResult>;
  changePicById: (params: IPicChangeParameter) => Promise<IResult>;
  searchPOI: (params: IPOISearch) => Promise<IResult>;
  clearPOIResults: (params: IPOIDelete) => Promise<IResult>;
  searchBoundary: (params: IBoundary) => Promise<IResult>;
  searchRoadNetwork: (params: IRoadNetwork) => Promise<IResult>;
  closeAllTooltips: () => Promise<IResult>;
  closeTooltips: (params:IOverlayDelete) => Promise<IResult>;
  searchMultiBoundary: (params: IMultiBoundary) => Promise<IResult>;
}

export interface IPicChangeParameter {
  id:string,
  pictureUrl:string,
  callback?:boolean,
  isSelected?:boolean,
}
export interface IPolylineRangingParameter {
  lineSymbol?:IPolylineSymbol,        //测距线符号样式
  callback?:boolean,                  //是否后台返回测距结果
  unit?:string,                       //测距单位
  secSymbol?:any                      //转折点symbol
  closeSymbol?:any                    //结尾关闭点symbol
  startLayerSearch: (params: IGeometrySearchParameter) => Promise<IResult>;
  startLayerDefinition: (params: IDefinitionParameter) => Promise<void>;
  startTrackPlay: (params: ITrackParameter) => Promise<void>;
}
export interface IPopUpTemplate {
  title?: string;
  content: string;
}
export interface IHeatParameter {
  points: Array<IHeatPoint>;
  options: IHeatOptions;
}
export interface IHeatImageParameter {
  points?: Array<IHeatPoint>;
  options?: IHeatOptions;
  images?: {
    url: string;
    width: number;
    heigth: number;
    center: {x: number; y: number}; //图片中心位置
    factor: number; //图片显示倍率
    scale?: number; //图片显示比例
    geometry: {x: number; y: number};
  };
}
export interface IHeatOptions {
  field: string;
  radius?: number;
  colors?: Array<string>;
  maxValue?: number;
  zoom?: number;
  renderer?: any;
}
export interface IHeatPoint {
  fields: any;
  geometry: IPointGeometry;
}
export interface IFindParameter {
  layerName: string;
  ids: Array<string>;
  level?: number;
  centerResult?: boolean;
  showPopUp?: boolean;
  layerIds?: Array<string>;
  callback?: boolean
}
export interface IDefinitionParameter {
  layerName: string;
  searchNames: Array<string>;
  url?: string;
}
export interface IOverlayDelete {
  types?: Array<string>;
  ids?: Array<string>;
  exceptId?:string                         //用于排除某一个id
}
export interface IDistrictParameter {
  name: string;
  city?: string;
  showMask?: boolean;
}
export interface IStreetParameter {
  id: string;
  name: string;
  hideStreet: boolean; //是否隐藏其他街道
  reset: boolean; //重置,清除选择
}
export interface ITrackPlayback {
  features?:__esri.Graphic[],
  startId?:number,
  endId?:number,
  movingLength?:number,
  time:number,
  speed:number,                  //小车实际速度，单位m/s
  speedToString?:string,         //速度字符串形式，取三位小数
  speedRatio?:number,            //各路段小车速度与最小速度的比率
  path:number[][],
  stage?:string
}
export interface ITrackPlaybackParameter {
  trackPoints:[{
    id?:string
    from:number[],
    to:number[],
    time?:number,
    stage?:string
  }]
  moverType?:string                     //"constant" || "bySecond"
  trackLineSymbol?:IPolylineSymbol
  autoStart?:Boolean
  loop?:Boolean
  repeatCount?:number
  clearBefore?:Boolean
  isCenter?:Boolean
  isZoom?:Boolean
  routeUrl?:string
  canSuspend?:Boolean
}
export interface ITrackPlaybackBDParameter {
  trackPoints:{
    path:number[][],                        //该段路程坐标
    time:number,                            //该段路程用时，单位s
    trackLineSymbol?:IPolylineSymbol             //该段路的样式
  }[],
  moverType?:string                     //"constant" || "bySecond"
  defaultLineSymbol?:IPolylineSymbol
  defaultCarSymbol?:IPointSymbol
  loopTimes?:number
  autoStart?:Boolean
  loop?:Boolean
  repeatCount?:number
  clearBefore?:Boolean
  isCenter?:Boolean
  isZoom?:Boolean
  routeUrl?:string
  canSuspend?:Boolean
  adjustPicRotation?:number               //在计算角度的基础上，适当调整图片的旋转角度
}
export interface routeParameter {
  start: IPointGeometry;
  end: IPointGeometry;
  waypoints: IPointGeometry[];
  model: string; //"car","ride","walk"
}
export interface IGeometrySearchParameter {
  radius: number; //搜索半径,单位米
  layerName?: string; //搜索图层
  drawType?: string; //作画方式,
  center?: Array<number>; //搜索中心
  types?: Array<string>; //搜索点位类型,默认搜索全部
  showResult?: boolean; //是否显示搜索结果
  showGeometry?: boolean; //是否显示搜素区域
  clickHandle?: any; //点击回调方法
  repeat?: boolean; //是否重复点击画圆
  geometry?: any;
}
export interface ICustomTip {
  prop: any;
  clear: boolean;
  geometry: IPointGeometry;
}
export interface IElectronicFenceParameter {
  pointsGeometry:number[][],
  fenceId:string | number,
  fenceType?:"placeFence" | "lineFence"
  centerResults?:boolean,
}
export interface IMonitorAreaParameter {
  geometry:{
    rings?:number[][][],
    path?:number[][][],
    x?:number,
    y?:number
  }
  buffers:number[],
  id?:string,
  type?:string,
  defaultZoom?:number
}
export interface IElectronicFence {
  geometry:{
    rings?:number[][][],
    path?:number[][][],
    x?:number,
    y?:number
  }
  buffers:number[],
  id?:string,
  type?:string
}
export interface IEditFenceLabel {
  fenceId:number | string
  labelGeometry:number[]
  clearOtherLabels?:boolean
  isEditable?:boolean
  endEditing?:boolean
}
export interface IFenceDelete {
  ids?:string[],
  types?:string[],
  message?:string
}
export interface ICircleOutline {
  outlineSymbol?:{
    colorAndTransp:number[],
    width:number[],
    style:string
  },
  circleId?:string,
  circleType?:string,
  geometry:number[],
  radius:number
}
export interface IDrawOverlays {
  drawType: string;
  model?: string;
  id?: string;
  type?: string;
  symbol?: any;
  callback?: any;
  update?: boolean; //画完的图形是否可以编辑,
  repeat?: boolean; //画完是否继续画
}
export interface ISelectRouteParam {
  enableXHJ?: boolean;
  roadUrl?: string;
  trafficSignalUrl?: string;
  symbol?: any;
  showRoad?: boolean;
  showSignal?: boolean;
}
export interface IDrawOverlaysDelete {
  ids?:string[],
  types?:string[],
}
export interface ISelectRouteResult {
  autoStart?: boolean; // 显示选路结果时是否自动开始轨迹演示
  routeInfo: {
    // 路段信息
    ids: Array<string>;
    length?: number;
    startPoint?: [number, number];
    endPoint?: [number, number];
  };
  signalInfo?: {
    // 信号机信息
    signals: Array<{
      id: string;
      name?: string;
      x?: number;
      y?: number;
      distance?: number;
    }>;
  };
}
export interface IPOISearch {
  searchType:string,                  // 查询方式 rectangle/circle/region
  searchName:string,                  // 查询名称
  searchTag?:string,                  // 查询分类，用于筛选查询结果
  searchPage?:number,                 // 当查询结果较多时，可以设置查询页面继续查询
  city?:string,
  district?:string,
  location?:number[],                 // circle search center
  radius?:number,                     // circle search radius
  region?:string,                     // region search cityName
  bounds?:number[],                   // rectangle search bounds coordinates
  scope?:boolean,                     // 是否显示详细信息
  addResults?:boolean                 // 是否将结果添加到地图上
  resultsUrl?:string                  // 显示结果图片的url地址
  type?:string                       // 显示结果点位的type值
}
export interface IRoutePlan {
  origin: number[],
  destination: number[],
  midPoints?: number[][],
  changeRoute?: string,            // shortest time/shortest distance
  avoidArea?: {
    areaType:string,
    center?:number[],
    radius?:number,
    coordinates:number[]
  },            // 圆：[x,y,radius]/矩形：[x1,y1,x2,y2]
  mode?:string                     //CAR,BICYCLE,WALK
}
export interface IRoadNetwork {
  searchName:string,
  province?:string,
  city?:string,
  addResults?:boolean,
  symbol?:{
    color:string,
    width:number
  }
  type?:string,
  id?:string
}
export interface IBoundary {
  searchName:string,
  adcode?:number | string,
  addResults?:boolean,
  color?:string,
  id?:string,
  type?:string,
  outline?:{
    color:string,
    width:number
  },
  defaultZoom?:number //默认缩放等级
}
export interface IMultiBoundary {
  searchNames:string[],
}
export interface IGeocode {
  location:number[],
  radius?:number,
  poiTypes?:string[],           //hotel,road...
}
export interface ISelectRouteHitTest {
  showRoute?: boolean;
  routes: [
    {
      id?: string;
      routeIds: Array<string>;
    }
  ];
  showArea?: boolean;
  areas: [
    {
      id?: string;
      name?: string;
      points: Array<Array<number>>;
    }
  ];
}
export interface ITrackParameter {
  id: string;
}
export interface IPOIDelete {
  types?:string[],
  ids?:string[],
  exceptId?:string
}
