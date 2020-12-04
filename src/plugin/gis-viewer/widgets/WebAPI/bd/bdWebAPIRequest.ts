import {
  IGeocode,
  IPOISearch,
  IResult,
  IRoutePlan
} from '@/types/map';
import $ from 'jquery';
import axios from 'axios';
export default class bdWebAPIRequest {
  constructor() {}

  public static async requestPOI(params:IPOISearch): Promise<IResult>{
    const searchType = params.searchType || "region";
    const query = params.searchName;
    const searchTag = params.searchTag || "";
    const requestPage = 1;

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

      axios({
        method: 'post',
        url: 'http://api.jiaotong.baidu.com/dugis/search',
        data: `query_type=placepoi&
q=${query}&
output=json&
city=${city}&
district=${district}& 
tag=${searchTag}&
scope=2&
city_limit=true&
page_num=${requestPage}&
page_size=20`,
      })
          .then(function (response) {
            console.log(response);
          })
          .catch(function (error) {
            console.log(error);
          });

//       const searchObj = {
//         url: 'http://api.jiaotong.baidu.com/dugis/search',
//         dataType: 'json',
//         data: `query_type=placepoi&
// q=${query}&
// output=json&
// city=${city}&
// district=${district}&
// tag=${searchTag}&
// scope=2&
// city_limit=true&
// page_num=${requestPage}&
// page_size=20`,
//       }
//
//       $.ajax(searchObj).then((value:any) => {
//         console.log(searchObj);
//         console.log(value);
//       }).fail((err:any) => {
//         console.log(searchObj);
//         console.log(err);
//       })
    }else if(searchType === "rectangle"){
      bounds = params.bounds || [];

    }else if(searchType === "circle"){
      location = params.location || [];
      radius = params.radius || 1000;

      const searchObj:any = {
        method:'get',
        url: 'http://api.jiaotong.baidu.com/dugis/search',
        // dataType: 'json',
        data: `query_type=placepoi&
q=${query}&
output=json&
location=${location[1]},${location[0]}&
radius=${radius}&
tag=${searchTag}&
scope=2&
radius_limit=true&
page_num=${requestPage}&
page_size=20`,
      }

      axios({
        method:'get',
        url: 'http://api.jiaotong.baidu.com/dugis/search',
        // dataType: 'json',
        params: {
          query_type:"placepoi",
          q:query,

        }
      })
          .then(function (response) {
            console.log(searchObj);
            console.log(response);
          })
          .catch(function (error) {
            console.log(error);
          });

      $.ajax(searchObj).then((value:any) => {
        console.log(searchObj);
        console.log(value);
      }).fail((err:any) => {
        console.log(searchObj);
        console.log(err);
      })
    }else if(searchType === "roadCross"){

      const searchObj = {
        url: 'http://api.jiaotong.baidu.com/dugis/search',
        dataType: 'json',
        data: `query_type=roadcross&
q=${query}&
output=json&
scope=2&
radius_limit=true&
page_num=${requestPage}&
page_size=20`,
      }

      $.ajax(searchObj).then((value:any) => {
        console.log(searchObj);
        console.log(value);
      }).fail((err:any) => {
        console.log(searchObj);
        console.log(err);
      })
    }else {
      return {
        status:0,
        message:"check out the value of searchType!"
      }
    }


    return {
      status:0,
      message:'not complete'
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
      console.log(value);
    }).fail((err:any) => {
      console.log(requestObj);
      console.log(err);
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
      console.log(requestObj);
      console.log(value);
    }).fail((err:any) => {
      console.log(requestObj);
      console.log(err);
    })

    return {
      status:0,
      message:'not complete'
    }
  }

}