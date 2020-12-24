import {
  IGeocode,
  IPOISearch,
  IResult,
  IRoutePlan,
  IRoadNetwork, IBoundary
} from '@/types/map';

import axios from 'axios';
export default class bdWebAPIRequest {
  constructor() {}

  public static async requestPOI(params:IPOISearch): Promise<IResult>{
    const searchType = params.searchType || "circle";
    const query = params.searchName;
    const searchTag = params.searchTag || "";
    const requestPage = params.searchPage || 1;
    let resultDate = null;

    if(!query){
      return {
        status:0,
        message:'please input search name first!'
      }
    }

    let city:string,
        district:string,
        bounds:number[],
        location:number[],
        radius:number;
    if(searchType === "region"){
      city = params.city || "";           //目前只支持京津冀
      district = params.district || "";

      const requestUrl = `http://api.jiaotong.baidu.com/dugis/search?` +
          `q=${query}` +
          // `region=${city}` +
          `&city=${city}` +
          `&district=${district}` +
          `&output=json` +
          `&tag=${searchTag}` +
          '&city_limit=true' +
          `&page_num=${requestPage}` +
          `&page_size=10`;

      await axios.get(requestUrl,
      )
          .then(function (response) {
            resultDate = response.data;
          })
          .catch(function (error) {
            console.log(error);
          });
    }else if(searchType === "rectangle"){
      bounds = params.bounds || [];

    }else if(searchType === "circle"){
      location = params.location || [];
      radius = params.radius || 1000;

      const requestUrl = `http://api.jiaotong.baidu.com/dugis/search?` +
          `location=${location[1]},${location[0]}` +
          `&q=${query}` +
          `&radius=${radius}` +
          `&sort_rule=0` +
          `&output=json` +
          `&tag=${searchTag}` +
          '&radius_limit=true' +
          `&page_num=${requestPage}` +
          `&page_size=10`
      await axios.get(requestUrl,
      )
          .then(function (response) {
            resultDate = response.data;
          })
          .catch(function (error) {
            console.log(error);
          });

    }else if(searchType === "roadCross"){
      const requestUrl = `http://api.jiaotong.baidu.com/dugis/search?` +
          `query_type=roadcross` +
          `&q=${query}` +
          `&output=json` +
          `&scope=2` +
          `&radius_limit=true` +
          `page_num=${requestPage}` +
          `page_size=10`;
      await axios.get(requestUrl,
      )
          .then(function (response) {
            resultDate = response.data;
          })
          .catch(function (error) {
            console.log(error);
          });

    }else {
      return {
        status:0,
        message:"check out the value of searchType!"
      }
    }

    return {
      status:0,
      result:resultDate,
      message:'成功调用！'
    }
  }

  public static async requestRoadPlan(params:IRoutePlan): Promise<IResult>{
    const destination = params.destination;
    const origin = params.origin;
    const midPoints = params.midPoints;
    const route = params.changeRoute || "ordinary";
    const mode = params.mode || "CAR";
    const avoidArea = params.avoidArea;

    const tactics = route === "shortest time" ? 1 :
            route === "shortest distance" ? 2 : 1;

    let midPointsToString = ``
    if(midPoints && midPoints.length){
      midPoints.forEach((midPt:number[]) => {
        midPointsToString += `${midPt[1]},${midPt[0]}|`
      })
    }

    const requestObj = {
      url: 'http://api.jiaotong.baidu.com/dugis/cloudsearch',
      dataType: 'json',
      data: {
        action: "route",
        destination: `${destination[1]},${destination[0]}`,
        details: "true",
        index: "direction",
        mode: "CAR",
        origin: `${origin[1]},${origin[0]}`,
        output: "json",
        tactics: `${tactics}`,
        waypoints: midPointsToString
      }
    }

    $.ajax(requestObj).then((value:any) => {
      console.log(requestObj);

    }).fail((err:any) => {
      console.log(requestObj);

    })

    return {
      status:0,
      message:'not complete'
    }
  }
  //用处有限，参数模糊
  public static async requestGeocode(params:IGeocode): Promise<IResult>{
    const location = params.location;
    const radius = params.radius || 500;
    const poi_types = params.poiTypes || [];

    let poiTypes:string = "";
    if(poi_types.length){
      poi_types.forEach((poi_type:string,index:number) => {
        if(index < poi_type.length -1){
          poiTypes += poi_type + "|";
        }else {
          poiTypes += poi_type;
        }
      })
    }
    const requestObj = {
      url: 'http://api.jiaotong.baidu.com/dugis/geocoding?poi_types=酒店&location=39.904844,116.382225',
      dataType: 'json',
      data: {
        location: `${location[1]},${location[0]}`,
        radius: `${radius}`,
        // poi_types: `${poiTypes}`,
        // poi_types: `酒店`,
        extensions_road: `${poi_types.indexOf("道路") > -1}`,
        extensions_poi: `${poi_types.length > 0 ? 1 : 0}`,
        output: "json"
      }
    }

    $.ajax(requestObj).then((value:any) => {

    }).fail((err:any) => {

    })

    return {
      status:0,
      message:'not complete'
    }
  }

  public static async requestPOIByUID():Promise<IResult>{

    return {
      status:0,
      message:'not complete'
    }
  }

  public static async requestRoadNetwork(params:IRoadNetwork): Promise<IResult>{
    const searchName = params.searchName;
    if(!searchName || typeof searchName !== "string"){
      return {
        status:0,
        message:"searchName is required and must be type of string!"
      }
    }
    const province = params.province || "四川省";
    const city = params.city || "凉山彝族自治州";
    let resultDate = null;
    const requestUrl = `http://api.jiaotong.baidu.com/dugis/road?` +
        `q=${searchName}` +
        `&province=${province}` +
        `&city=${city}` +
        `&output=json`
    await axios.get(requestUrl,
    )
        .then(function (response) {
          resultDate = response.data;
        })
        .catch(function (error) {
          console.log(error);
        });
    return {
      status:0,
      message:'成功调用改方法！',
      result:resultDate
    }
  }

  public static async requestBoundary(params:IBoundary): Promise<IResult>{
    const queryName = params.searchName;
    const adcode = params.adcode || "";

    const requestUrl = `http://api.jiaotong.baidu.com/dugis/boundary?` +
        `adcode=${adcode}` +
        `&q=${queryName}` +
        `&output=json`;
    let resultDate = null;
    await axios.get(requestUrl,
    )
        .then(function (response) {
          resultDate = response.data;
        })
        .catch(function (error) {
          console.log(error);
        });
    return {
      status:0,
      message:"成功调用该方法！",
      result:resultDate
    }
  }
}