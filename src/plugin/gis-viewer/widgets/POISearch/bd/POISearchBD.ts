import bdWebAPIRequest from "@/plugin/gis-viewer/widgets/WebAPI/bd/bdWebAPIRequest";
import {OverlayBaidu} from "@/plugin/gis-viewer/widgets/Overlays/bd/OverlayBaidu";
import red1 from "@/assets/images/POISearch/red1.png";
import red2 from "@/assets/images/POISearch/red2.png";
import red3 from "@/assets/images/POISearch/red3.png";
import red4 from "@/assets/images/POISearch/red4.png";
import red5 from "@/assets/images/POISearch/red5.png";
import red6 from "@/assets/images/POISearch/red6.png";
import red7 from "@/assets/images/POISearch/red7.png";
import red8 from "@/assets/images/POISearch/red8.png";
import red9 from "@/assets/images/POISearch/red9.png";
import red10 from "@/assets/images/POISearch/red10.png";


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

    if(addResults){
      const overlaysBD = OverlayBaidu.getInstance(this.view);
      overlaysBD.deleteOverlays({
        types:["POISearch"]
      })

      const overlays = [] as any;
      const picUrlArray = [red1,red2,red3,red4,red5,red6,red7,red8,red9,red10];
      results.forEach((result:any,index:number) => {
        const overlayObj:any = {};
        const ptCoordinate = result.location;
        overlayObj.geometry = {x:ptCoordinate.lng,y:ptCoordinate.lat};
        overlayObj.id = `poi` + `${(this.searchPage-1) * 10 + index + 1}`;
        overlayObj.fields = result;

        overlayObj.symbol = {
          type: 'point',
          url: picUrl ? picUrl : picUrlArray[index],
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