import bdWebAPIRequest from "@/plugin/gis-viewer/widgets/WebAPI/bd/bdWebAPIRequest";
import {OverlayBaidu} from "@/plugin/gis-viewer/widgets/Overlays/bd/OverlayBaidu";
import rebObj from "./picUrlBase64";
import {
  IPOISearch,
  IResult,
  IPOIDelete,
  IRoadNetwork,
  IBoundary, IMultiBoundary
} from '@/types/map';

declare let BMap:any
export default class POISearchBD {
  private view!: any;
  private static intances: Map<string, any>;
  private searchPage: number = 0;

  private constructor(view: any) {
    this.view = view;
  }

  public static getInstance(view:any) {
    let id = view.container.id;
    if (!POISearchBD.intances) {
      POISearchBD.intances = new Map();
    }
    let intance = POISearchBD.intances.get(id);
    if (!intance) {
      intance = new POISearchBD(view);
      POISearchBD.intances.set(id, intance);
    }
    return intance;
  }

  public async searchPOI(params:IPOISearch): Promise<IResult>{
    const searchType = params.searchType || "circle";
    const query = params.searchName;
    const searchTag = params.searchTag || "";
    this.searchPage = params.searchPage || 1;
    //region
    const city = params.city || "";           //目前只支持京津冀
    const district = params.district || "";
    //circle
    const location = params.location || [];
    const radius = params.radius || 1000;
    const addResults = params.addResults || true;
    const picUrl = params.resultsUrl;
    const type = params.type || "poiSearch";

    let requestResults = null;
    if(searchType === "circle"){
      const results = await bdWebAPIRequest.requestPOI({
        searchType:searchType,
        searchName:query,
        searchTag:searchTag,
        location:location,
        radius:radius,
        searchPage:this.searchPage
      });

      requestResults = results.result;
    }else if(searchType === "region"){
      const results = await bdWebAPIRequest.requestPOI({
        searchType:searchType,
        searchName:query,
        city:city,
        district:district,
        searchPage:this.searchPage
      });

      requestResults = results.result;
    }else if(searchType === "roadCross"){
      const results = await bdWebAPIRequest.requestPOI({
        searchType:searchType,
        searchName:query,
        searchPage:this.searchPage
      });

      requestResults = results.result;
    }else {
      return {
        status:0,
        message:`不支持的搜索类型！`
      }
    }

    const results = requestResults.results;
    if(!results){
      return {
        status:0,
        message:`获取数据错误！`
      }
    }

    if(addResults){
      const overlaysBD = OverlayBaidu.getInstance(this.view);
      overlaysBD.deleteOverlays({
        types:[type]
      })

      const overlays = [] as any;
      // const picUrlArray = [red1,red2,red3,red4,red5,red6,red7,red8,red9,red10];
      results.forEach((result:any,index:number) => {
        const overlayObj:any = {};
        const ptCoordinate = result.location;
        overlayObj.geometry = {x:ptCoordinate.lng,y:ptCoordinate.lat};
        overlayObj.id = `poi` + `${(this.searchPage-1) * 10 + index + 1}`;
        overlayObj.fields = result;
        overlayObj.fields.id = overlayObj.id;
        overlayObj.fields.type = type;

        overlayObj.symbol = {
          type: 'point',
          url: picUrl ? picUrl : rebObj[index],
          size: [24, 35],
        }

        overlays.push(overlayObj);
      })

      await overlaysBD.addOverlays({
        type:type,
        overlays:overlays
      })
    }

      return {
      status:0,
      message:`成功调用该方法！`,
    }
  }

  public async clearPOIResults(params:IPOIDelete): Promise<IResult>{
    const exceptId = params.exceptId || "";
    const types = params.types || [];
    const ids = params.ids || [];

    const overlays = this.view.getOverlays();
    let delCount = 0;
    overlays.forEach((overlay:any) => {
      if (
          //只判断type
          (types.length > 0 &&
              ids.length === 0 &&
              types.indexOf(overlay.type) >= 0 &&
                  overlay.id !== exceptId)  ||
          //只判断id
          (types.length === 0 &&
              ids.length > 0 &&
              ids.indexOf(overlay.id) >= 0) ||
          //type和id都要判断
          (types.length > 0 &&
              ids.length > 0 &&
              types.indexOf(overlay.type) >= 0 &&
              ids.indexOf(overlay.id) >= 0)
      ) {
        this.view.removeOverlay(overlay);
        if (overlay.isOpenInfo === true) {
          this.view.closeInfoWindow();
        }
        delCount++;
        return false;
      }
    })

    return {
      status:0,
      message:'成功调用该方法！',
      result:`成功删除了${delCount}个覆盖物！`
    }
  }

  public async searchRoadNetwork(params:IRoadNetwork): Promise<IResult>{
    const roadName = params.searchName;
    const province = params.province || "四川省";
    const city = params.city || "凉山彝族自治州";
    const addResults = params.addResults || true;
    const type = params.type || "roadNetwork";
    const id = params.id;
    const lineSymbol = params.symbol;

    const requestResult = await bdWebAPIRequest.requestRoadNetwork({
      searchName:roadName,
      province:province,
      city:city
    });
    const resultData = requestResult.result;
    if(!resultData){
      return {
        status:0,
        message:"百度数据接口请求错误！"
      }
    }

    const overlays:any = [];
    if(addResults){
      const roadResults = resultData.results;
      const allRoadsGeometryArray:number[][][][] = [];
      roadResults.forEach((roadResult:any) => {
        const geoString:string = roadResult.location;
        const twoPtsStringArray = geoString.split(";");//["x1,y1,x2,y2",""...]
        const ptsCoordsArray:number[][][] = [];
        twoPtsStringArray.forEach((twoPtsString:string) => {
          const twoPtsGeo = twoPtsString.split(",");   //["x1","y1","x2","y2"]
          const aPartRoad:number[][] = []
          for(let i=0;i<twoPtsGeo.length;i+=2){
            let pt:number[] = [parseFloat(twoPtsGeo[i]),parseFloat(twoPtsGeo[i+1])];
            aPartRoad.push(pt);
          }
          ptsCoordsArray.push(aPartRoad);
        })
        allRoadsGeometryArray.push(ptsCoordsArray);
      })

      allRoadsGeometryArray.forEach((roadsGeometry:number[][][],index:number) => {
        roadsGeometry.forEach((roadGeometry:number[][]) => {
          const overlayObj:any = {};
          overlayObj.geometry = {paths:roadGeometry};
          overlayObj.id = id ? id : "roadNetwork" + Math.random().toFixed(5).toString()
          overlayObj.fields = roadResults[index];
          overlayObj.fields.id = overlayObj.id;
          overlayObj.fields.type = type ? type : "roadNetwork";
          delete overlayObj.fields.location;
          overlayObj.symbol = lineSymbol ? {
            type:"polyline",
            color:lineSymbol.color || 'blue',
            width: lineSymbol.width || 5
          } : {
            type: 'polyline',
            color: 'blue',
            width: 5
          }
          overlays.push(overlayObj);
        })
      })
      const overlaysBD = OverlayBaidu.getInstance(this.view);
      await overlaysBD.deleteOverlays({
        types:["roadNetwork"],
      })
      await overlaysBD.addOverlays({
        type:"roadNetwork",
        overlays:overlays
      })
    }

    return {
      status:0,
      message:"成功调用该方法！",
      result:addResults ? JSON.stringify(overlays) : resultData
    }
  }

  public async searchBoundary(params:IBoundary): Promise<IResult>{
    const searchName = params.searchName;
    const adcode = params.adcode || "";
    const addResults = params.addResults !== false;
    const areaColor = params.color || 'rgba(37,122,251,0.5)';
    const boundaryColor = params.outline?.color || 'blue';
    const boundaryWidth = params.outline?.width || 5;
    const areaId = params.id;
    const areaType = params.type;
    const centerResult = params.centerResult !== false;
    const defaultZoom = params.defaultZoom || 12;

    const requestResults = await bdWebAPIRequest.requestBoundary({
      searchName:searchName,
      adcode:adcode
    });
    if(!requestResults.result){
      return {
        status:0,
        message:"数据请求错误！"
      }
    }
    const boundaryResults = requestResults.result.results;
    const boundaryCoords:any = [];
    boundaryResults.forEach((boundaryResult:any) => {
      const boundaryStr:string = boundaryResult.boundary;
      const boundaryArray:any[] = boundaryStr.split(";");
      boundaryArray.forEach((coordinateStr:any,index:number) => {
        const coordinateArray:any[] = coordinateStr.split(",");
        coordinateArray.forEach((xOrY:any,index) => {
          coordinateArray[index] = parseFloat(xOrY);
        })
        boundaryArray[index] = coordinateArray;
      })

      boundaryCoords.push(boundaryArray);
    })

    const overlays:any = [];
    if(addResults){
      boundaryCoords.forEach((boundaryCoord:number[][],index:number) => {
        const overlayObj:any = {};
        overlayObj.geometry = {rings:boundaryCoord};
        overlayObj.id = areaId ? areaId : "boundary" + Math.random().toFixed(5).toString()
        overlayObj.fields = boundaryResults[index];
        overlayObj.fields.id = overlayObj.id;
        overlayObj.fields.type = areaType ? areaType : "boundary";
        delete overlayObj.fields.boundary;
        overlayObj.symbol = {
          type: 'polygon',
          color: areaColor,
          outline: {
            color: boundaryColor,
            width: boundaryWidth
          }
        }
        overlays.push(overlayObj);
      })

      const overlaysBD = OverlayBaidu.getInstance(this.view);
      await overlaysBD.deleteOverlays({
        types:["boundary"],
      })
      await overlaysBD.addOverlays({
        type:"boundary",
        overlays:overlays,
        centerResult:centerResult,
        defaultZoom:defaultZoom
      })
    }
    return {
      status:0,
      message:"成功调用该方法！",
      result:addResults ? JSON.stringify(overlays) : JSON.stringify(boundaryResults)
    }
  }

  public async searchMultiBoundary(params:IMultiBoundary): Promise<IResult>{
    const searchNames = params.searchNames;
    const defaultZoom = params.defaultZoom || 12;
    const colors = [
      'rgb(207,252,228)',
      'rgb(239,252,187)',
      'rgb(191,179,252)',
      'rgb(252,216,187)',
      'rgb(182,211,252)',
      'rgb(182,252,186)',
      'rgb(182,226,252)',
      'rgb(252,179,210)',
      'rgb(244,182,252)',
      'rgb(207,252,228)',
      'rgb(239,252,187)',
      'rgb(191,179,252)',
      'rgb(252,216,187)',
      'rgb(182,211,252)',
      'rgb(182,252,186)',
      'rgb(182,226,252)',
      'rgb(252,179,210)',
      'rgb(244,182,252)',
    ]

    const requests:any = []
    const overlays:any = []
    searchNames.forEach((searchName:string) => {
      const request= bdWebAPIRequest.requestBoundary({
        searchName:searchName,
      });
      requests.push(request);
    })

    await Promise.all(requests).then((results) => {
      results.forEach((resultObj:any,index) => {
        const boundaryStr = resultObj.result.results[0].boundary;
        const boundaryName = resultObj.result.results[0].district;
        const attr = resultObj.result.results[0];
        const boundaryArray:any[] = boundaryStr.split(";");
        boundaryArray.forEach((coordinateStr:any,index:number) => {
          const coordinateArray:any[] = coordinateStr.split(",");
          coordinateArray.forEach((xOrY:any,index) => {
            coordinateArray[index] = parseFloat(xOrY);
          })
          boundaryArray[index] = coordinateArray;
        })

        const overlayObj:any = {};
        overlayObj.geometry = {rings:boundaryArray};
        overlayObj.id = boundaryName ? boundaryName : "multiBoundary" + Math.random().toFixed(5).toString();
        overlayObj.type = "multiBoundary";
        overlayObj.fields = attr;
        overlayObj.fields.id = overlayObj.id;
        overlayObj.fields.type = overlayObj.type;
        delete overlayObj.fields.boundary;
        overlayObj.symbol = {
          type: 'polygon',
          color: colors[index],
          outline: {
            color: colors[index],
            width: 1
          }
        }
        overlays.push(overlayObj);

        const polygon = new BMap.Polyline(this.getPtGeometry(boundaryArray));
        const plBounds = polygon.getBounds();
        const center = plBounds.getCenter();
        const opts = {
          position : center,    // 指定文本标注所在的地理位置
          offset   : new BMap.Size(30, -30)    //设置文本偏移量
        }
        const label = new BMap.Label(boundaryName, opts);  // 创建文本标注对象
        label.setStyle({
          border:"none",
          color : "black",
          fontSize : "12px",
          height : "20px",
          lineHeight : "20px",
          fontFamily:"黑体",
          background: 'rgba(240,240,240, 0.1)',
          marginLeft: `${-12 * boundaryName.length}px`,
          marginTop: "12px",
        });

        this.view.addOverlay(label);
      })
    });
    const overlaysBD = OverlayBaidu.getInstance(this.view);
    await overlaysBD.deleteOverlays({
      types:["multiBoundary"],
    })

    await overlaysBD.addOverlays({
      type:"multiBoundary",
      overlays:overlays,
      defaultZoom:defaultZoom
    })

    const centerCoordinate = [102.458255,27.70151];
    const centerPt = new BMap.Point(centerCoordinate[0],centerCoordinate[1]);

    await this.view.centerAndZoom(centerPt, 8);
    return {
      status:0,
      message:'not complete'
    }
  }

  private getPtGeometry(points: number[][]): object[] {
    let features: object[] = [];
    for (let i = 0; i < points.length; i++) {
      let pt: number[] = points[i];
      let point = new BMap.Point(pt[0], pt[1]);
      features.push(point);
    }
    return features;
  }
}