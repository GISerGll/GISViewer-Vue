import {
  IResult,
  ISelectRouteHitTest,
  ISelectRouteParam,
  ISelectRouteResult,
} from "@/types/map";
import { loadModules } from "esri-loader";
import along from "@turf/along";
import length from "@turf/length";
import distance from "@turf/distance";
import lineSlice from "@turf/line-slice";
import * as turf from "@turf/helpers";
import { debounce } from "ts-debounce-throttle";

export default class SelectRoute2D {
  private static intances: Map<string, SelectRoute2D>;

  private view!: __esri.MapView;

  private geometryEngineAsync!: __esri.geometryEngineAsync;

  /** 显示全部路网的图层 */
  private allLinkLayer!: __esri.FeatureLayer;
  private allLinkGraphicArray!: Array<__esri.Graphic>;
  /** 显示已选定Link的图层 */
  private selectedLinkLayer!: __esri.GraphicsLayer;
  /** 显示待选Link的图层 */
  private candidateLinkLayer!: __esri.GraphicsLayer;
  /** 搜索候选link时的起点link id */
  private startLinkId: string = "";
  private iteratorLinkGraphicArray: Array<Array<__esri.Graphic>> = [];
  /** 已选定的Link graphic */
  private selectedLinkGraphicArray: Array<__esri.Graphic> = [];

  /** 显示全部信号机的图层 */
  private allTrafficSignalLayer!: __esri.FeatureLayer;
  private allTrafficSignalGraphicArray!: Array<__esri.Graphic>;
  /** 显示已选定信号机的图层 */
  private selectedTrafficSignalLayer!: __esri.GraphicsLayer;
  /** 已选定的信号机编号 */
  private selectedTrafficSignalIdArray: Array<string> = [];
  private selectedTrafficSignalSymbol: any;

  /** 轨迹回放图层 */
  private playRouteLayer!: __esri.GraphicsLayer;

  private mouseMoveHandler: any;

  /** 搜索信号机的缓冲距离 */
  private readonly bufferDistance = 30;

  /** HistTest图层 */
  private hitTestLayer!: __esri.GraphicsLayer;

  /** 将Link设为路径起点 */
  private beginRouteButton = {
    title: "开始",
    id: "beginRoute",
    className: "esri-icon-play",
  } as __esri.ActionButton;

  /** 待选路段上的终点按钮 */
  private endRouteInCandidateLinkButton = {
    title: "结束",
    id: "endRouteInCandidateLink",
    className: "esri-icon-check-mark",
  } as __esri.ActionButton;

  /** 已选路段上的终点按钮 */
  private endRouteInSelectedLinkButton = {
    title: "结束",
    id: "endRouteInSelectedLink",
    className: "esri-icon-check-mark",
  } as __esri.ActionButton;

  /** 将Link添加到路径中 */
  private addLinkButton = {
    title: "添加",
    id: "addLink",
    className: "esri-icon-plus",
  } as __esri.ActionButton;

  /** 重设此Link的后续 */
  private reSelectNextLinkButton = {
    title: "重选",
    id: "reSelectNextLink",
    className: "esri-icon-forward",
  } as __esri.ActionButton;

  /** 重置全部路径 */
  private resetRouteButton = {
    title: "重设",
    id: "resetRoute",
    className: "esri-icon-close",
  } as __esri.ActionButton;

  private popupTemplate = {
    title: "{RNAME}",
    content: [
      {
        type: "fields",
        fieldInfos: [
          {
            fieldName: "LANENUM",
            label: "车道数",
          },
          {
            fieldName: "LENGTH",
            label: "长度",
          },
        ],
      },
    ],
  };

  /** 选择路径结束后的回调事件 */
  public selectRouteFinished!: (routeInfo: ISelectRouteResult) => void;
  /** 轨迹回放时，车辆进入信号机范围回调事件 */
  public intoSignal!: (signalId: string) => void;
  /** 轨迹回放时，车辆离开信号机范围回调事件 */
  public outofSignal!: (signalId: string) => void;

  public static getInstance(view: __esri.MapView) {
    const id = view.container.id;
    if (!SelectRoute2D.intances) {
      SelectRoute2D.intances = new Map();
    }
    let instance = SelectRoute2D.intances.get(id);
    if (!instance) {
      instance = new SelectRoute2D(view);
      SelectRoute2D.intances.set(id, instance);
    }
    return instance;
  }

  private constructor(view: __esri.MapView) {
    this.view = view;

    this.view.popup.on("trigger-action", async (event) => {
      this.view.popup.close();
      if (this.allLinkLayer) {
        switch (event.action.id) {
          case "beginRoute": {
            // 选好起点后路网不再能点击，只能点击候选link
            if (this.allLinkLayer) {
              this.allLinkLayer.popupEnabled = false;
            }
            if (this.mouseMoveHandler) {
              this.mouseMoveHandler.remove();
            }

            // popup.selectedFeature.attributes只包含popupTemplate中配置的字段
            // 只能用FID来查找ID
            const { FID } = this.view.popup.selectedFeature.attributes;
            const selectedGraphic = await this.getLinkGraphicByFID(FID);
            if (selectedGraphic) {
              const clonedGraphic = selectedGraphic.clone();
              this.iteratorLinkGraphicArray = [[clonedGraphic]];
              this.addSelectedLink(clonedGraphic);
            }

            break;
          }

          case "addLink": {
            const { FID } = this.view.popup.selectedFeature.attributes;
            const selectedGraphic = await this.getLinkGraphicByFID(FID);
            if (selectedGraphic) {
              this.addSelectedLink(selectedGraphic.clone());
            }
            break;
          }

          case "reSelectNextLink": {
            const { FID } = this.view.popup.selectedFeature.attributes;
            const selectedGraphic = await this.getLinkGraphicByFID(FID);

            //从已选定link中移除当前及之后link
            if (selectedGraphic) {
              this.reSelectLink(selectedGraphic.attributes["ID"]);
            }

            break;
          }

          case "endRouteInCandidateLink": {
            const { FID } = this.view.popup.selectedFeature.attributes;
            const selectedGraphic = await this.getLinkGraphicByFID(FID);
            if (selectedGraphic) {
              await this.addSelectedLink(selectedGraphic.clone(), true);
            }

            await this.view.goTo(this.selectedLinkGraphicArray);
            this.view.zoom -= 1;

            this.emitRouteResult();
            break;
          }

          case "endRouteInSelectedLink": {
            const { FID } = this.view.popup.selectedFeature.attributes;
            const selectedGraphic = await this.getLinkGraphicByFID(FID);
            if (selectedGraphic) {
              this.reSelectLink(selectedGraphic.attributes["ID"], true);
              this.candidateLinkLayer.removeAll();

              await this.view.goTo(this.selectedLinkGraphicArray);
              this.view.zoom -= 1;

              this.emitRouteResult();
            }

            break;
          }
        }
      }
    });
  }

  /** 向父组件回传本次路径选择结果 */
  private async emitRouteResult() {
    const firstPoint = this.getRouteBeginPoint();
    const lastPoint = this.getRouteEndPoint();

    let routeLength = 0;
    this.selectedLinkGraphicArray.forEach((linkGraphic) => {
      const linkLength = linkGraphic.attributes["LENGTH"] * 1000;
      routeLength += linkLength;
    });

    const totalPath = this.mergeLink(this.selectedLinkGraphicArray);

    const signals = [];
    // 上一个信号机的坐标
    let lastSignalX = 0,
      lastSignalY = 0;
    for (let i = 0; i < this.selectedTrafficSignalIdArray.length; i++) {
      const id = this.selectedTrafficSignalIdArray[i];
      const signalGraphic = await this.getTrafficSignalById(id);
      if (signalGraphic) {
        const { FSTR_DESC: name } = signalGraphic.attributes;
        const signalX = (signalGraphic.geometry as __esri.Point).x;
        const signalY = (signalGraphic.geometry as __esri.Point).y;

        const signalDistance =
          i === 0 // 第一个信号机计算与路径起点的距离
            ? this.calcuteSignalDistance(
                [firstPoint.x, firstPoint.y],
                [signalX, signalY],
                totalPath
              )
            : this.calcuteSignalDistance(
                [lastSignalX, lastSignalY],
                [signalX, signalY],
                totalPath
              );

        signals.push({
          id,
          name,
          x: signalX,
          y: signalY,
          distance: Number(signalDistance.toFixed(2)),
        });
        lastSignalX = signalX;
        lastSignalY = signalY;
      }
    }

    if (this.selectRouteFinished) {
      const linkIds = this.selectedLinkGraphicArray.map(
        (linkGraphic: __esri.Graphic) => linkGraphic.attributes["ID"]
      );
      this.selectRouteFinished({
        routeInfo: {
          ids: linkIds,
          startPoint: [firstPoint.x, firstPoint.y],
          endPoint: [lastPoint.x, lastPoint.y],
          length: routeLength,
        },
        signalInfo: {
          signals,
        },
      });
    }
  }

  private calcuteSignalDistance(
    point1: Array<number>,
    point2: Array<number>,
    path: Array<Array<number>>
  ): number {
    const start = turf.point(point1);
    const stop = turf.point(point2);
    const line = turf.lineString(path);
    const sliced = lineSlice(start, stop, line);
    const signalDistance = length(sliced, { units: "meters" });
    return signalDistance;
  }

  /** 读取link数据，并显示link */
  public async initializeRoute(params: ISelectRouteParam) {
    const roadNetworkUrl =
      params?.roadUrl ??
      "http://115.28.88.187:6080/arcgis/rest/services/ZhongZhi/RoadNetwork/MapServer/1";
    const trafficSignalUrl =
      params?.trafficSignalUrl ??
      "http://115.28.88.187:6080/arcgis/rest/services/ZhongZhi/RoadNetwork/MapServer/0";
    this.selectedTrafficSignalSymbol = params?.symbol?.selectedSignal ?? {
      type: "simple-marker",
      style: "circle",
      color: "gold",
      size: "12px",
      outline: {
        color: "white",
        width: 1,
      },
    };
    type MapModules = [
      typeof import("esri/layers/GraphicsLayer"),
      typeof import("esri/layers/FeatureLayer"),
      typeof import("esri/geometry/geometryEngineAsync")
    ];
    const [
      GraphicsLayer,
      FeatureLayer,
      geometryEngineAsync,
    ] = await (loadModules([
      "esri/layers/GraphicsLayer",
      "esri/layers/FeatureLayer",
      "esri/geometry/geometryEngineAsync",
    ]) as Promise<MapModules>);
    this.geometryEngineAsync = geometryEngineAsync;

    if (this.hitTestLayer) {
      this.hitTestLayer.removeAll();
    } else {
      this.hitTestLayer = new GraphicsLayer();
      this.view.map.add(this.hitTestLayer);
    }

    if (this.allLinkLayer) {
      this.allLinkLayer.popupEnabled = true;
    } else {
      this.allLinkLayer = new FeatureLayer({
        url: roadNetworkUrl,
        visible: params?.showRoad ?? true,
        popupTemplate: {
          ...this.popupTemplate,
          actions: [this.beginRouteButton],
        },
        renderer: {
          type: "simple",
          symbol: {
            type: "simple-line",
            color: "lightblue",
            width: 2,
          },
        } as any,
      });
      this.view.map.add(this.allLinkLayer);

      const query = this.allLinkLayer.createQuery();
      query.where = "1=1";
      query.outFields = ["*"];
      query.returnGeometry = true;
      const results = await this.allLinkLayer.queryFeatures(query);
      this.allLinkGraphicArray = results.features;
    }

    if (this.selectedLinkLayer) {
      this.selectedLinkLayer.removeAll();
    } else {
      this.selectedLinkLayer = new GraphicsLayer();
      this.view.map.add(this.selectedLinkLayer);
    }

    if (this.candidateLinkLayer) {
      this.candidateLinkLayer.removeAll();
    } else {
      this.candidateLinkLayer = new GraphicsLayer();
      this.view.map.add(this.candidateLinkLayer);
    }

    if (!this.allTrafficSignalLayer) {
      this.allTrafficSignalLayer = new FeatureLayer({
        url: trafficSignalUrl,
        visible: params?.showSignal ?? true,
        renderer: {
          type: "simple",
          symbol: {
            type: "simple-marker",
            style: "circle",
            color: "lawngreen",
            size: "8px",
            outline: {
              color: "white",
              width: 1,
            },
          },
        } as any,
      });
      this.view.map.add(this.allTrafficSignalLayer);

      const query = this.allTrafficSignalLayer.createQuery();
      query.where = "1=1";
      query.outFields = ["*"];
      query.returnGeometry = true;
      const results = await this.allTrafficSignalLayer.queryFeatures(query);
      this.allTrafficSignalGraphicArray = results.features;
    }

    if (this.selectedTrafficSignalLayer) {
      this.selectedTrafficSignalLayer.removeAll();
    } else {
      this.selectedTrafficSignalLayer = new GraphicsLayer();
      this.view.map.add(this.selectedTrafficSignalLayer);
    }

    if (this.playRouteLayer) {
      this.playRouteLayer.removeAll();
    } else {
      this.playRouteLayer = new GraphicsLayer();
      this.view.map.add(this.playRouteLayer);
    }

    this.selectedLinkGraphicArray = [];
    this.selectedTrafficSignalIdArray = [];

    /** 不要频繁触发MouseOver事件，使用防抖函数，每300ms触发一次 */
    this.mouseMoveHandler = this.view.on(
      "pointer-move",
      debounce(async (event: any) => {
        await this.onPointerMoveHandler(event);
      }, 300)
    );
  }

  private async onPointerMoveHandler(event: any) {
    // 当前有弹框显示时，不再打开新弹框
    if (this.view.popup.visible) {
      return;
    }
    const result = await this.view.hitTest(event, {
      include: [this.allLinkLayer],
    });
    if (result.results.length > 0) {
      const graphic = result.results[0].graphic;
      const point = this.view.toMap(event);
      this.view.popup.open({
        location: point,
        features: [graphic],
      });
    }
  }

  /** 根据FID查找link Graphic */
  private async getLinkGraphicByFID(
    fid: string
  ): Promise<__esri.Graphic | undefined> {
    // const query = this.allLinkLayer.createQuery();
    // query.where = `FID=${fid}`;
    // const results = await this.allLinkLayer.queryFeatures(query);
    // return results.features[0];

    return this.allLinkGraphicArray.find((graphic) =>
      graphic ? graphic.attributes["FID"] === Number(fid) : false
    );
  }

  /** 根据ID查找link Graphic */
  private async getLinkGraphicByLinkId(
    linkId: string
  ): Promise<__esri.Graphic | undefined> {
    // const query = this.allLinkLayer.createQuery();
    // query.where = `ID='${linkId}'`;
    // const results = await this.allLinkLayer.queryFeatures(query);
    // return results.features[0];

    return this.allLinkGraphicArray.find((graphic) =>
      graphic ? graphic.attributes["ID"] === linkId : false
    );
  }

  /** 根据信号机id查找graphic */
  private async getTrafficSignalById(
    signalId: string
  ): Promise<__esri.Graphic | void> {
    // const query = this.allTrafficSignalLayer.createQuery();
    // query.where = `FSTR_SCATS='${signalId}'`;
    // const results = await this.allTrafficSignalLayer.queryFeatures(query);
    // if (results.features.length > 0) {
    //   return results.features[0];
    // } else {
    //   return;
    // }

    const results = this.allTrafficSignalGraphicArray.filter(
      (graphic) => graphic.attributes["FSTR_SCATS"] === signalId
    );
    if (results.length > 0) {
      return results[0];
    } else {
      return;
    }
  }

  /** 搜索指定点周边的信号机 */
  private async searchTrafficSignal(center: __esri.Geometry) {
    // 生成缓冲区
    const buffer = (await this.geometryEngineAsync.geodesicBuffer(
      center,
      this.bufferDistance,
      "meters"
    )) as __esri.Polygon;

    const query = this.allTrafficSignalLayer.createQuery();
    query.geometry = buffer;
    query.spatialRelationship = "contains";
    query.returnGeometry = true;
    query.outFields = ["*"];
    const results = await this.allTrafficSignalLayer.queryFeatures(query);
    results.features.forEach((graphic) => {
      const signalGraphic = graphic.clone();
      const signalId: string = signalGraphic.attributes["FSTR_SCATS"];
      if (!this.selectedTrafficSignalIdArray.includes(signalId)) {
        signalGraphic.symbol = this.selectedTrafficSignalSymbol;
        this.selectedTrafficSignalLayer.add(signalGraphic);
        this.selectedTrafficSignalIdArray.push(signalId);
      }
    });
  }

  /**
   * 显示当前已选定的link
   * @param isLastLink 是否为最后一个link
   * */
  private async addSelectedLink(
    clickedGraphic: __esri.Graphic,
    isLastLink: boolean = false
  ) {
    const geometryToUnion: Array<__esri.Geometry> = [];

    for (let i = 0; i < this.iteratorLinkGraphicArray.length; i++) {
      const routeLinkGraphicArray = this.iteratorLinkGraphicArray[i];
      if (
        routeLinkGraphicArray[routeLinkGraphicArray.length - 1].attributes[
          "ID"
        ] === clickedGraphic.attributes["ID"]
      ) {
        routeLinkGraphicArray.forEach((graphic) => {
          graphic.symbol = {
            type: "simple-line",
            color: "red",
            width: 4,
          } as any;
          graphic.popupTemplate = {
            ...this.popupTemplate,
            actions: [
              this.reSelectNextLinkButton,
              this.endRouteInSelectedLinkButton,
            ],
          } as any;
          this.selectedLinkLayer.add(graphic);
          this.selectedLinkGraphicArray.push(graphic);
          geometryToUnion.push(graphic.geometry);
        });

        break;
      }
    }

    const unionedGeometry = await this.geometryEngineAsync.union(
      geometryToUnion
    );

    const center = (unionedGeometry as __esri.Polyline).extent.center;
    this.view.goTo(center);

    // 在快速路上不搜索周边信号机
    if (!this.isExpressway(clickedGraphic.attributes["KIND"])) {
      await this.searchTrafficSignal(unionedGeometry);
    }

    // 显示候选link
    this.candidateLinkLayer.removeAll();
    if (!isLastLink) {
      this.startLinkId = clickedGraphic.attributes["ID"];
      this.iteratorLinkGraphicArray = [];
      this.showNextLink(clickedGraphic);
    }
  }

  /** 删除此link后的选定link，重新显示待选lilnk */
  private reSelectLink(linkId: string, isLast: boolean = false) {
    let linkIndex = 0;
    for (let i = 0; i < this.selectedLinkGraphicArray.length; i++) {
      const linkGraphic = this.selectedLinkGraphicArray[i];
      if (linkGraphic.attributes["ID"] === linkId) {
        linkIndex = i;
        break;
      }
    }

    if (!isLast) {
      // 继续选择后续，把当前点击的link移除
      // 要删除的link
      const removeGraphics = this.selectedLinkGraphicArray.slice(linkIndex);
      this.selectedLinkGraphicArray = this.selectedLinkGraphicArray.slice(
        0,
        linkIndex
      );
      this.selectedLinkLayer.removeMany(removeGraphics);
      // 重新添加用户点击的link，显示待选link
      this.addSelectedLink(removeGraphics[0]);
    } else if (linkIndex !== this.selectedLinkGraphicArray.length - 1) {
      // 不继续选择，不用移除当前点击的link
      const removeGraphics = this.selectedLinkGraphicArray.slice(linkIndex + 1);
      this.selectedLinkGraphicArray = this.selectedLinkGraphicArray.slice(
        0,
        linkIndex
      );
      this.selectedLinkLayer.removeMany(removeGraphics);
    }
  }

  /**
   * 显示多条待选link
   * @param currentGraphic 当前Graphic
   * @param isIterator 是否迭代
   * */
  private async showNextLink(
    currentGraphic: __esri.Graphic,
    isIterator: boolean = false
  ) {
    let linkIds: string = currentGraphic.attributes["EROADID"];
    // 去掉最后的逗号，否则split时会多一个空元素
    if (linkIds.endsWith(",")) {
      linkIds = linkIds.substring(0, linkIds.length - 1);
    }
    const linkIdArray = linkIds.split(",");

    const linkGraphicArray: Array<__esri.Graphic> = [];
    for (let i = 0; i < linkIdArray.length; i++) {
      const linkId = linkIdArray[i];
      if (
        this.candidateLinkLayer.graphics.find(
          (graphic) => graphic.attributes["ID"] === linkId
        )
      ) {
        continue;
      }
      const linkGraphic = await this.getLinkGraphicByLinkId(linkId);
      if (linkGraphic) {
        // 如果此路段的所有后续路段都已在待选路段中，说明这个分支进入了循环，跳过
        let endLinkIds: string = linkGraphic.attributes["EROADID"];
        if (endLinkIds.endsWith(",")) {
          endLinkIds = endLinkIds.substring(0, endLinkIds.length - 1);
        }
        const endLinkIdArray = endLinkIds.split(",");
        let isAllCandidate = true;
        for (let i = 0; i < endLinkIdArray.length; i++) {
          const endLinkId = endLinkIdArray[i];
          if (
            !this.candidateLinkLayer.graphics.find(
              (graphic) => graphic.attributes["ID"] === endLinkId
            )
          ) {
            isAllCandidate = false;
            break;
          }
        }
        if (!isAllCandidate) {
          linkGraphicArray.push(linkGraphic);
        } else {
          continue;
        }
      }
    }

    const selfLinkId: string = currentGraphic.attributes["ID"];
    this.saveRouteInCross(selfLinkId, linkGraphicArray);

    const geometryToUnion: Array<__esri.Geometry> = [];
    if (!isIterator && linkGraphicArray.length === 1) {
      // 用户选择的（非迭代）的情况下，如果只有一个后续link直接添加
      // 迭代的情况下，需要用户选择分支，不能直接添加
      const linkGraphic = linkGraphicArray[0];
      this.addSelectedLink(linkGraphic);
    } else {
      // 有多个后续link时需要同时显示，让用户选择
      linkGraphicArray.forEach((linkGraphic) => {
        const candidateLink = linkGraphic.clone();
        const linkKind: string = linkGraphic.attributes["KIND"];
        const isInCross = this.isCrossLink(linkKind);

        candidateLink.symbol = {
          type: "simple-line",
          style: isInCross ? "short-dot" : "solid",
          color: "dodgerblue",
          width: 4,
        } as any;
        if (!isInCross) {
          candidateLink.popupTemplate = {
            ...this.popupTemplate,
            actions: [this.addLinkButton, this.endRouteInCandidateLinkButton],
          } as any;
        }

        this.candidateLinkLayer.add(candidateLink);
        geometryToUnion.push(candidateLink.geometry);

        // 路口中的link需要迭代，直到走出路口
        // 让用户选择主路link，而不是路口中过渡link
        if (isInCross) {
          this.showNextLink(linkGraphic, true);
        }
      });

      // 调整地图显示范围，能显示全部候选link
      if (geometryToUnion.length > 0) {
        const unionGeometry = (await this.geometryEngineAsync.union(
          geometryToUnion
        )) as __esri.Polyline;
        const center = unionGeometry.extent.center;
        this.view.goTo(center);
      }
    }
  }

  /** 保存路口内递归的路径 */
  private async saveRouteInCross(
    selfLinkId: string,
    endLinkGraphicArray: Array<__esri.Graphic>
  ) {
    for (let i = 0; i < this.iteratorLinkGraphicArray.length; i++) {
      const routeGraphicArray = this.iteratorLinkGraphicArray[i];
      if (
        routeGraphicArray[routeGraphicArray.length - 1].attributes["ID"] ===
        selfLinkId
      ) {
        const newRouteLinks = endLinkGraphicArray.map((linkGraphic) =>
          routeGraphicArray.concat([linkGraphic])
        );
        this.iteratorLinkGraphicArray.splice(i, 1, ...newRouteLinks);
        return;
      }
    }

    // 新link
    this.iteratorLinkGraphicArray = this.iteratorLinkGraphicArray.concat(
      endLinkGraphicArray.map((linkGraphic) => [linkGraphic])
    );
  }

  /**
   * 是否为交叉点内link
   * @param linkKind 道路属性
   */
  private isCrossLink(linkKind: string): boolean {
    // 每个属性为四位16进制，2位道路等级+2位道路属性
    // 交叉点内link的道路属性是0x04
    // 交叉点内link会有两个属性，属性1|属性2
    // 属性1继承主路的属性，属性2是把属性1的最后两位改为0x04
    const kindArray = linkKind.split("|");
    for (let i = 0; i < kindArray.length; i++) {
      const kind = kindArray[i];
      if (kind.endsWith("04")) {
        return true;
      }
    }
    return false;
  }

  /**
   * 是否为快速路
   * @param linkKind 道路属性
   */
  private isExpressway(linkKind: string): boolean {
    // 快速路的道路等级为0x01
    const kindArray = linkKind.split("|");
    for (let i = 0; i < kindArray.length; i++) {
      const kind = kindArray[i];
      if (kind.startsWith("01")) {
        return true;
      }
    }
    return false;
  }

  /** 显示选择好的道路 */
  public async showSelectedRoute(
    params: ISelectRouteResult,
    showRoute: boolean = true,
    moveMapCenter: boolean = true
  ) {
    if (this.allLinkLayer) {
      this.allLinkLayer.popupEnabled = false;
    }
    if (this.mouseMoveHandler) {
      this.mouseMoveHandler.remove();
    }

    const linkIds = params.routeInfo.ids;

    // this.selectedLinkLayer.removeAll();
    this.selectedLinkGraphicArray = [];
    for (let i = 0; i < linkIds.length; i++) {
      const linkId = linkIds[i];
      const linkGraphic = await this.getLinkGraphicByLinkId(linkId);
      if (linkGraphic) {
        linkGraphic.symbol = {
          type: "simple-line",
          color: "red",
          width: 4,
        } as any;
        if (showRoute) {
          this.selectedLinkLayer.add(linkGraphic);
        }
        this.selectedLinkGraphicArray.push(linkGraphic);
      }
    }
    if (showRoute) {
      // 显示起点和终点
      const firstPoint = this.getRouteBeginPoint();
      const lastPoint = this.getRouteEndPoint();

      type MapModules = [typeof import("esri/Graphic")];
      const [Graphic] = await (loadModules(["esri/Graphic"]) as Promise<
        MapModules
      >);
      const firstGraphic = new Graphic({
        geometry: firstPoint,
        symbol: {
          type: "picture-marker",
          url:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAF8AAABtCAYAAADH/r1TAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTMyIDc5LjE1OTI4NCwgMjAxNi8wNC8xOS0xMzoxMzo0MCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTUuNSAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MDlFRDZGNjU5NzRBMTFFQTg4MjJCOEU1NDkyNjM0QzEiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MDlFRDZGNjY5NzRBMTFFQTg4MjJCOEU1NDkyNjM0QzEiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDowOUVENkY2Mzk3NEExMUVBODgyMkI4RTU0OTI2MzRDMSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDowOUVENkY2NDk3NEExMUVBODgyMkI4RTU0OTI2MzRDMSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PhyFSHMAACl8SURBVHja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",
          width: "47px",
          height: "54px",
          yoffset: "20px",
        } as any,
      });
      this.selectedLinkLayer.add(firstGraphic);

      const lastGraphic = new Graphic({
        geometry: lastPoint,
        symbol: {
          type: "picture-marker",
          url:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAF8AAABtCAYAAADH/r1TAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTMyIDc5LjE1OTI4NCwgMjAxNi8wNC8xOS0xMzoxMzo0MCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTUuNSAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RTc5RDlGNEU5NzQ5MTFFQTk5MURFRDlGRTZERTA2RkMiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RTc5RDlGNEY5NzQ5MTFFQTk5MURFRDlGRTZERTA2RkMiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpFNzlEOUY0Qzk3NDkxMUVBOTkxREVEOUZFNkRFMDZGQyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpFNzlEOUY0RDk3NDkxMUVBOTkxREVEOUZFNkRFMDZGQyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PhyIx18AACu0SURBVHja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",
          width: "47px",
          height: "54px",
          yoffset: "20px",
        } as any,
      });
      this.selectedLinkLayer.add(lastGraphic);

      if (moveMapCenter) {
        await this.view.goTo(this.selectedLinkGraphicArray);
        this.view.zoom -= 1;
      }
    }

    if (params.signalInfo && showRoute) {
      const signalIds = params.signalInfo.signals.map((signal) => signal.id);
      this.selectedTrafficSignalLayer.removeAll();
      for (let i = 0; i < signalIds.length; i++) {
        const signalId = signalIds[i];
        const signalGraphic = await this.getTrafficSignalById(signalId);
        if (signalGraphic) {
          signalGraphic.symbol = {
            type: "simple-marker",
            style: "circle",
            color: "gold",
            size: "12px",
            outline: {
              color: "white",
              width: 1,
            },
          } as any;
          this.selectedTrafficSignalLayer.add(signalGraphic);
        }
      }
    }
  }

  /** 获取link的起点 */
  private getPolylineFirstPoint(line: __esri.Polyline): __esri.Point {
    return line.getPoint(0, 0);
  }

  /** 获取link的终点 */
  private getPolylineLastPoint(line: __esri.Polyline): __esri.Point {
    const path = line.paths[0];
    return line.getPoint(0, path.length - 1);
  }

  /** 获取路径的起点 */
  private getRouteBeginPoint(): __esri.Point {
    const lineGraphic = this.selectedLinkGraphicArray[0];
    // direction=3时，反向link，起止点交换
    const firstPoint =
      lineGraphic.attributes["DIRECTION"] === "3"
        ? this.getPolylineLastPoint(lineGraphic.geometry as __esri.Polyline)
        : this.getPolylineFirstPoint(lineGraphic.geometry as __esri.Polyline);
    return firstPoint;
  }

  /** 获取路径的终点 */
  private getRouteEndPoint(): __esri.Point {
    const lineGraphic = this.selectedLinkGraphicArray[
      this.selectedLinkGraphicArray.length - 1
    ];

    // direction=3时，反向车道
    const lastPoint =
      lineGraphic.attributes["DIRECTION"] === "3"
        ? this.getPolylineFirstPoint(lineGraphic.geometry as __esri.Polyline)
        : this.getPolylineLastPoint(lineGraphic.geometry as __esri.Polyline);
    return lastPoint;
  }

  private playInterval: any;

  /** 将几个link的path合并到一个path中 */
  private mergeLink(graphics: Array<__esri.Graphic>): Array<Array<number>> {
    const totalPath: Array<Array<number>> = [];
    graphics.forEach((graphic) => {
      let path = (graphic.geometry as __esri.Polyline).paths[0];
      // 反向link，坐标倒序
      if (graphic.attributes["DIRECTION"] === "3") {
        path.reverse();
      }
      // 如果前一段的最后一个点和这段的第一个点重合，去掉一个点
      if (
        totalPath.length &&
        totalPath[totalPath.length - 1][0] === path[0][0] &&
        totalPath[totalPath.length - 1][1] === path[0][1]
      ) {
        path.shift();
      }
      totalPath.push(...path);
    });
    return totalPath;
  }

  /**
   * 播放车辆移动动画
   */
  public async playSelectedRoute(speed: number) {
    if (!this.selectedLinkGraphicArray.length) {
      return;
    }

    // 每秒帧数
    const framePerSecond = 20;
    // 公里/小时 -> 米/秒
    const speedInSeconds = (speed * 1000) / 3600;
    // 每帧前进距离
    const lengthPerFrame = speedInSeconds / framePerSecond;

    // 将几个link的path合并到一个path中
    const totalPath = this.mergeLink(this.selectedLinkGraphicArray);

    const line = turf.lineString(totalPath);
    let currentLength = lengthPerFrame;
    const totalLength = length(line, { units: "meters" });
    const pointArray: Array<Array<number>> = [totalPath[0]];
    // 使用turf.along，将path按照每帧前进距离分割
    while (currentLength < totalLength) {
      const point = along(line, currentLength, {
        units: "meters",
      });
      pointArray.push(point.geometry.coordinates);
      currentLength += lengthPerFrame;
    }

    type MapModules = [
      typeof import("esri/Graphic"),
      typeof import("esri/geometry/Point")
    ];
    const [Graphic, Point] = await (loadModules([
      "esri/Graphic",
      "esri/geometry/Point",
    ]) as Promise<MapModules>);
    let currentIndex = 0;
    const carGraphic = new Graphic({
      geometry: new Point({
        x: pointArray[currentIndex][0],
        y: pointArray[currentIndex][1],
      }),
      symbol: {
        type: "simple-marker",
        style: "circle",
        color: "mediumblue",
        size: "15px",
        outline: {
          color: "white",
          width: 1,
        },
      } as any,
    });
    this.playRouteLayer.add(carGraphic);

    let nearSignalPoint: __esri.Point | null;
    let nearSignalId: string;

    // 开始移动点位
    this.playInterval = setInterval(() => {
      currentIndex++;
      carGraphic.geometry = new Point({
        x: pointArray[currentIndex][0],
        y: pointArray[currentIndex][1],
      });

      // 车辆进入和离开信号机周边时发出警报
      if (!nearSignalPoint) {
        // 不在信号机范围内时检测和所有信号机的距离
        this.selectedTrafficSignalLayer.graphics.forEach((graphic) => {
          const signalPoint = graphic.geometry as __esri.Point;
          const distance = length(
            turf.lineString([
              pointArray[currentIndex],
              [signalPoint.x, signalPoint.y],
            ]),
            { units: "meters" }
          );
          // 触发进入报警
          if (distance < this.bufferDistance) {
            nearSignalPoint = signalPoint;
            nearSignalId = graphic.attributes["FSTR_SCATS"];
            this.intoSignal(nearSignalId);
          }
        });
      } else {
        // 在信号机范围内时只检测和当前信号机的距离
        const distance = length(
          turf.lineString([
            pointArray[currentIndex],
            [nearSignalPoint.x, nearSignalPoint.y],
          ]),
          { units: "meters" }
        );
        // 触发离开报警
        if (distance > this.bufferDistance) {
          nearSignalPoint = null;
          this.outofSignal(nearSignalId);
        }
      }

      // 到达最后一个点位，停止计时
      if (currentIndex === pointArray.length - 1) {
        clearInterval(this.playInterval);
      }
    }, 1000 / framePerSecond);
  }

  /** 停止播放 */
  public stopPlaySelectedRoute() {
    if (this.playInterval) {
      clearInterval(this.playInterval);
    }
    this.playRouteLayer.removeAll();
  }

  /** 测试路线经过了哪些区域 */
  public async routeHitArea(params: ISelectRouteHitTest): Promise<IResult> {
    const showRoute = !!params.showRoute;
    const showArea = !!params.showArea;

    this.hitTestLayer.removeAll();
    // this.selectedLinkLayer.removeAll();

    const routeIds = params.routes[0].routeIds;
    // 显示路径
    await this.showSelectedRoute(
      { routeInfo: { ids: routeIds } },
      showRoute,
      false
    );
    const routeLine = await this.geometryEngineAsync.union(
      this.selectedLinkGraphicArray.map((graphic) => graphic.geometry)
    );

    // 显示区域
    type MapModules = [
      typeof import("esri/Graphic"),
      typeof import("esri/geometry/Polygon")
    ];
    const [Graphic, Polygon] = await (loadModules([
      "esri/Graphic",
      "esri/geometry/Polygon",
    ]) as Promise<MapModules>);

    const hittedAreaIdArray: Array<string> = [];
    for (let i = 0; i < params.areas.length; i++) {
      const area = params.areas[i];
      const areaPolygon = new Polygon({ rings: [area.points] });

      const hit = await this.geometryEngineAsync.intersects(
        routeLine,
        areaPolygon
      );
      if (hit) {
        hittedAreaIdArray.push(area.id || "");

        if (showArea) {
          const areaGraphic = new Graphic({
            geometry: areaPolygon,
            attributes: { id: area.id },
            symbol: {
              type: "simple-fill",
              color: [3, 169, 244, 0.5],
              style: "solid",
              outline: {
                style: "dash",
                color: [3, 169, 244],
                width: 2,
              },
            } as any,
          });
          this.hitTestLayer.add(areaGraphic);

          if (area.name) {
            const areaLabel = new Graphic({
              geometry: areaPolygon.centroid,
              attributes: {},
              symbol: {
                type: "text",
                text: area.name,
                color: "white",
                font: {
                  // family: "微软雅黑",
                  size: 12,
                },
              } as any,
            });
            this.hitTestLayer.add(areaLabel);
          }
        }
      }
    }

    return { status: 0, message: "", result: hittedAreaIdArray };
  }

  /** 测试区域中有哪些路线 */
  public async areaHitRoute(params: ISelectRouteHitTest): Promise<IResult> {
    const showRoute = !!params.showRoute;
    const showArea = !!params.showArea;

    this.hitTestLayer.removeAll();
    // this.selectedLinkLayer.removeAll();

    type MapModules = [
      typeof import("esri/Graphic"),
      typeof import("esri/geometry/Polygon")
    ];
    const [Graphic, Polygon] = await (loadModules([
      "esri/Graphic",
      "esri/geometry/Polygon",
    ]) as Promise<MapModules>);

    const area = params.areas[0];
    const areaPolygon = new Polygon({ rings: [area.points] });
    if (showArea) {
      const areaGraphic = new Graphic({
        geometry: areaPolygon,
        attributes: { id: area.id },
        symbol: {
          type: "simple-fill",
          color: [3, 169, 244, 0.5],
          style: "solid",
          outline: {
            style: "dash",
            color: [3, 169, 244],
            width: 2,
          },
        } as any,
      });
      this.hitTestLayer.add(areaGraphic);
      if (area.name) {
        const areaLabel = new Graphic({
          geometry: areaPolygon.centroid,
          attributes: {},
          symbol: {
            type: "text",
            text: area.name,
            color: "white",
            font: {
              // family: "yahei",
              size: 12,
            },
          } as any,
        });
        this.hitTestLayer.add(areaLabel);
      }
    }

    const hittedRouteIdArray: Array<string> = [];
    for (let i = 0; i < params.routes.length; i++) {
      const route = params.routes[i];
      await this.showSelectedRoute(
        { routeInfo: { ids: route.routeIds } },
        showRoute,
        false
      );
      const routeLine = await this.geometryEngineAsync.union(
        this.selectedLinkGraphicArray.map((graphic) => graphic.geometry)
      );
      const hit = await this.geometryEngineAsync.intersects(
        routeLine,
        areaPolygon
      );
      if (hit) {
        hittedRouteIdArray.push(route.id || "");
        this.hitTestLayer.addMany(this.selectedLinkLayer.graphics.toArray());
      }
      // this.selectedLinkLayer.removeAll();
    }

    return {
      status: 0,
      message: "",
      result: hittedRouteIdArray,
    };
  }
}