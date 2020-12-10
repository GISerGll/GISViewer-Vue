import bdWebAPIRequest from "@/plugin/gis-viewer/widgets/WebAPI/bd/bdWebAPIRequest";
import {OverlayBaidu} from "@/plugin/gis-viewer/widgets/Overlays/bd/OverlayBaidu";

import {
  IPOISearch,
  IResult,
  IPOIDelete
} from '@/types/map';

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
      console.log(requestResults);
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

    const imagesContext = require.context('@/assets/images/POISearch/', false, /\.png$/);

    if(addResults){
      const overlaysBD = OverlayBaidu.getInstance(this.view);
      overlaysBD.deleteOverlays({
        types:["POISearch"]
      })

      const overlays = [] as any;
      results.forEach((result:any,index:number) => {
        const overlayObj:any = {};
        const ptCoordinate = result.location;
        overlayObj.geometry = {x:ptCoordinate.lng,y:ptCoordinate.lat};
        overlayObj.id = `poi` + `${(this.searchPage-1) * 10 + index + 1}`;
        overlayObj.fields = result;

        // debugger;
        const imgName = `./red${index+1}.png`;
        const imgUrl = imagesContext(imgName);
        overlayObj.symbol = {
          type: 'point',
          url: picUrl ? picUrl : imgUrl,
          size: [24, 35],
        }

        overlays.push(overlayObj);
      })

      await overlaysBD.addOverlays({
        type:'POISearch',
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
    const overlays = this.view.getOverlays();

    overlays.forEach((overlay:any) => {
      if(overlay.type === "POISearch" && overlay.id !== exceptId){
        this.view.removeOverlay(overlay);
      }
    })

    return {
      status:0,
      message:'成功调用该方法！'
    }
  }

}