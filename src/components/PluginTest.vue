<template>
  <div id="gisDiv">
    <div id="test">
<!--      <button @click="btn_loadMap">加载地图</button>-->
      <button @click="btn_setMapCenter">居中</button>
      <button @click="btn_setMapCenterAndLevel">放大居中</button>
        <button @click="btn_findFeature">定位居中</button><br>
      <button @click="btn_showLayer1">显示GD图层1</button>
      <button @click="btn_showLayer2">显示GD图层2</button>
      <button @click="btn_hideLayer">隐藏图层</button>
      <button @click="btn_switchLayer">切换底图</button><br>
      <button @click="btn_addOverlays_pt">添加点</button>
      <button @click="btn_addOverlays_line">添加线</button>
      <button @click="btn_addOverlays_polygon">添加面</button>
      <button @click="btn_deleteOverlays">删除覆盖物</button><br>
      <button @click="btn_showToolTip">开启VUE弹窗</button>
      <button @click="btn_closeToolTip">关闭VUE弹窗</button><br>
      <button @click="btn_drawPoints">撒点</button>
      <button @click="btn_drawLines">画线</button>
      <button @click="btn_drawPolygons">画多边形</button>
      <button @click="btn_drawCircles">画圆</button>
      <button @click="btn_drawRects">画矩形</button><br>
      <button @click="btn_startTrackPlayback">轨迹回放</button><br>
      <button @click="btn_startRealTrackPlayback">实际轨迹回放</button>
      <button @click="btn_pausePlayback">暂停</button>
      <button @click="btn_goOnPlayback">继续</button><br>
      <button @click="btn_showMonitorArea">四色围栏</button>
      <button @click="btn_createPlaceFence">场所围栏</button>
      <button @click="btn_createLineFence">线路围栏</button>
      <button @click="btn_createElectFenceByEndPtsConnection">直线围栏</button>
      <button @click="btn_showCircleOutline">圆边界</button>
      <button @click="btn_showEditingLabel">编辑围栏</button>
      <button @click="btn_addHeatMap">热力图</button><br>
      <button @click="btn_addGDLayer">加载高德地图</button>
<!--      <button @click="btn_">删除</button><br>-->
<!--      <button @click="btn_addHeatMap">添加热力图</button>-->
<!--      <button @click="btn_deleteHeatMap">删除热力图</button>-->
    </div>
    <div
      style="width:100%;height:100%; position: absolute;pointer-events:none"
    ></div>
    <gis-viewer
      ref="gisViewer"
      platform="arcgis2d"
      :map-config="mapConfig"
      @map-loaded="mapLoaded"
      @marker-click="showGisDeviceInfo"
      @map-click="mapClick"
      @select-route-finished="selectRouteFinished"
      @into-signal="intoSignal"
      @outof-signal="outofSignal"
      @layer-loaded="layerLoaded"
    />
  </div>
</template>
<script lang="ts">
import {Vue, Component} from 'vue-property-decorator';
import MapConfig from "@/config/config_arcgis";
import Parent from "@/components/tooltips/Parent.vue";
@Component
export default class PluginTest extends Vue {
    private arcgisConfig = new MapConfig();
    private mapConfig = this.arcgisConfig.mapConfig;
    private async btn_showLayer1() {
        let map = this.$refs.gisViewer as any;
        const result = await map.showLayer({
            label:"GDLayer1"
        })
      console.log(result);
    }
    private async btn_showLayer2() {
        let map = this.$refs.gisViewer as any;
        const result = await map.showLayer({
            label:"GDLayer2"
        })
        console.log(result);
    }
  private layerLoaded() {
    console.log('layer loaded');
  }
    private async btn_switchLayer() {
        let map = this.$refs.gisViewer as any;
        const result1 = await map.hideLayer({
            label:"浅色底图"
        })
      console.log(result1);

        const result2 = await map.showLayer({
            label:"深色底图"
        })
      console.log(result2);
    }
    private async btn_hideLayer() {
        let map = this.$refs.gisViewer as any;
        await map.hideLayer({
            label:"GDLayer1"
        })
        await map.hideLayer({
            label:"GDLayer2"
        })
    }
    private btn_setMapCenter(){
        let map = this.$refs.gisViewer as any;
        map.setMapCenter({
            x:87.597,
            y:43.824
        })
    }
    private btn_setMapCenterAndLevel() {
        let map = this.$refs.gisViewer as any;
        map.setMapCenterAndLevel({
            x:87.597,
            y:43.824,
            level:7
        })
    }
    private async btn_findFeature(){
        let map = this.$refs.gisViewer as any;
        const result = await map.findFeature({
            layerName:"police",
            level:18,
            ids:["test001","test002"],
            centerResult:true
        })
        console.log(result);
    }
    private async btn_addOverlays_pt() {
        let map = this.$refs.gisViewer as any;
        // const img= await this.loadImageAsync("assets/image/Anchor.png");
        const img = {
            width:12,
            height:12
        }
        const obj =  await map.addOverlays({
            type: 'police',
            defaultSymbol: {
                //symbol for 2d
                type: 'point-2d',
                // primitive: "square",
                url: 'assets/image/Anchor.png',
                size:  (img as Object)? [(img as any).width,(img as any).height] : [12,12],
                // color: "red",
                // outline: {
                //   color: "white",
                //   size: 4
                // },
                // anchor: "top"

                //symbol for 3d
                //type: "point-3d",
                //primitive: "cube",
                //color: "red",
                //size: 20000,
                //anchor: "bottom",
            },
            overlays: [
                {
                    id: 'test001',
                    geometry: {x: 104.07604340359372, y: 30.660031729032898},
                    fields: {name: '雄飞中心ArcGIS', featureid: '0002',istip:true}
                },
                {
                    id: 'test002',
                    geometry: {x: 87.577, y: 43.814},
                    fields: {name: '测试4', featureid: '0001',istip:true}
                }
            ],
            custom:{
                zoom:15,
                content:'<div>12345<div>'
            },
            // showPopup: true,

            autoPopup: true,
            defaultInfoTemplate: {
                title: '1212',
                content: '<div>name:{name}<br/><button>{name}</button></div>'
            },
            // defaultButtons: [{label: '确认报警', type: 'confirmAlarm'}]
        });
        console.log(obj)
    }
    private async btn_addOverlays_line() {

        let path1 = [  // first path
            [87.597,43.817],
            [87.597,43.824],
            [87.597,43.834]
        ];

        let path2 = [
            [87.577,43.817],
            [87.577,43.824],
            [87.577,43.834]];
        let map = this.$refs.gisViewer as any;
        await map.addOverlays({
            type: 'simpleLine',
            defaultSymbol: {
                //symbol for 2d
                type: 'line-2d',
                // primitive: "square",
                color:[255,0,0,0.5],
                width:2
                // width: 10
            },
            overlays: [
                {
                    id: 'testPath001',
                    geometry: {paths:path1},
                    fields: {name: '测试1', featureid: '0002'}
                },
                {
                    id: 'testPath002',
                    geometry: {paths:path2},
                    fields: {name: '测试2', featureid: '0002'}
                }
            ],
            showPopup: true,
            autoPopup: false,
            defaultInfoTemplate: {
                title: '1212',
                content: '<div>name:{name}<br/><button>{name}</button></div>'
            },
            defaultButtons: [{label: '确认报警', type: 'confirmAlarm'}]
        })

    }
    private async btn_addOverlays_polygon(){
        let rings1 = [[
            [87.597,43.824],
            [87.617,43.824],
            [87.617,43.814],
            [87.597,43.814]]];
        let rings2 = [[[87.716, 43.842],[87.716, 43.839],[87.715, 43.836],[87.714, 43.833],[87.713, 43.830],[87.711, 43.827],[87.708, 43.824],
            [87.705, 43.822],[87.702, 43.819],[87.699, 43.817],[87.695, 43.816],[87.691, 43.814],[87.687, 43.813],[87.683, 43.812],
            [87.678, 43.812],[87.674, 43.812],[87.670, 43.812],[87.665, 43.812],[87.661, 43.813],[87.657, 43.814],[87.653, 43.816],
            [87.649, 43.817],[87.646, 43.819],[87.643, 43.822],[87.640, 43.824],[87.638, 43.827],[87.636, 43.830],[87.634, 43.833],
            [87.633, 43.836],[87.632, 43.839],[87.632, 43.842],[87.632, 43.845],[87.633, 43.848],[87.634, 43.851],[87.636, 43.854],
            [87.638, 43.857],[87.640, 43.860],[87.643, 43.862],[87.646, 43.865],[87.649, 43.867],[87.653, 43.868],[87.657, 43.870],
            [87.661, 43.871],[87.665, 43.872],[87.670, 43.872],[87.674, 43.872],[87.678, 43.872],[87.683, 43.872],[87.687, 43.871],
            [87.691, 43.870],[87.695, 43.868],[87.699, 43.867],[87.702, 43.865],[87.705, 43.862],[87.708, 43.860],[87.711, 43.857],
            [87.713, 43.854],[87.714, 43.851],[87.715, 43.848],[87.716, 43.845],[87.716, 43.842]]]
        let map = this.$refs.gisViewer as any;

        await map.addOverlays({
            type: 'simplePolygon',
            defaultSymbol: {
                type: 'polygon-2d',
                color:[255,0,0,0.5],
            },
            overlays: [
                {
                    id: 'testPplygon001',
                    geometry: {rings:rings1},
                    fields: {name: '测试1', featureid: '0001'}
                },
                {
                    id: 'testPolygon002',
                    geometry: {rings:rings2},
                    fields: {name: '测试2', featureid: '0002'}
                }
            ],
            showPopup: true,
            autoPopup: false,
            defaultInfoTemplate: {
                title: '1212',
                content: '<div>name:{name}<br/><button>{name}</button></div>'
            },
            defaultButtons: [{label: '确认报警', type: 'confirmAlarm'}]
        })
    }
    private async btn_deleteOverlays(){
        let map = this.$refs.gisViewer as any;
        const obj = await map.deleteOverlays({
            types:["police"],
            ids:["test001"]
        })
        console.log(obj);
    }
  private async btn_showToolTip(){
    let map = this.$refs.gisViewer as any;
    map.showToolTip(Parent);
  }
  private async btn_closeToolTip(){
    let map = this.$refs.gisViewer as any;
    map.closeToolTip();
  }
    private async btn_drawPoints(){
        let map = this.$refs.gisViewer as any;
        const img:any = await this.loadImageAsync("assets/image/Anchor.png");
        const result = await map.startDrawOverlays({
            defaultSymbol: {
                //symbol for 2d
                type: 'point-2d',
                // primitive: "square",
                url: 'assets/image/Anchor.png',
                size:  img ? [0.5 * img.width,0.5 * img.height] : [12,12],
            },
            drawType:"point",
            type:"points",
            generateId:true,
            clearLastResults:true,
            showPopup:true
        })

        let resultArray = result.result;
        resultArray.then((value:any) =>{
            console.log(value);
        })
    }
    private async btn_drawLines(){
        let map = this.$refs.gisViewer as any;
        const result = await map.startDrawOverlays({
            drawType:"polyline",
            type:"lines",
            id:true,
            showPopup:true
        })

        var resultArray = result.result;
        resultArray.then((value:any) =>{
            console.log(value);
        })
    }
    private async btn_drawPolygons(){
        let map = this.$refs.gisViewer as any;
        const result = await map.startDrawOverlays({
            drawType:"polygon",
            type:"polygons",
            id:true,
            showPopup:true
        })

        var resultArray = result.result;
        resultArray.then((value:any) =>{
            console.log(value);
        })
    }
    private async btn_drawCircles(){

    }
    private async btn_drawRects(){

    }
    private async btn_startTrackPlayback(){
        let map = this.$refs.gisViewer as any;
        let trackPts = [
            [87.633314	,	43.887925],
            [87.633242	,	43.867131],
            [87.60694	,	43.87012],
            [87.602538	,	43.881778]]
        await map.startTrackPlayback({
            trackPoints:trackPts
        })
    }
    private async btn_startRealTrackPlayback(){
        let map = this.$refs.gisViewer as any;
        let trackPts = [
            [87.633314	,	43.887925],
            [87.633242	,	43.867131],
            [87.60694	,	43.87012],
            [87.602538	,	43.881778]]

        let trackPts_ = [
            {
                from:[87.633314	,	43.887925],
                to:  [87.633242	,	43.867131],
                time: 100
            },
            {
                from:[87.633242	,	43.867131],
                to:  [87.60694	,	43.87012],
                time: 200,
                stage: "alarm"
            },
            {
                from:[87.60694	,	43.87012],
                to:  [87.602538	,	43.881778],
                time: 200
            },
            {
                from:[87.602538	,	43.881778],
                to:  [87.632538	,	43.781778],
                time: 800
            }
        ]
        await map.startRealTrackPlayback({
            trackPoints:trackPts_,
            routeUrl:"http://128.64.151.245:6080/arcgis/rest/services/WuLuMuQi/wlmq_road_analyst/NAServer/Route"
        })
    }
    private async btn_pausePlayback(){
        let map = this.$refs.gisViewer as any;
        await map.pausePlayback();
    }
    private async btn_goOnPlayback(){
        let map = this.$refs.gisViewer as any;
        await map.goOnPlayback();
    }
    private async btn_showMonitorArea(){
        let map = this.$refs.gisViewer as any;
        const result = await map.showMonitorArea({
            geometry:{
                rings:[[[87.716, 43.842],[87.716, 43.839],[87.715, 43.836],[87.714, 43.833],[87.713, 43.830],[87.711, 43.827],[87.708, 43.824],
                    [87.705, 43.822],[87.702, 43.819],[87.699, 43.817],[87.695, 43.816],[87.691, 43.814],[87.687, 43.813],[87.683, 43.812],
                    [87.678, 43.812],[87.674, 43.812],[87.670, 43.812],[87.665, 43.812],[87.661, 43.813],[87.657, 43.814],[87.653, 43.816],
                    [87.649, 43.817],[87.646, 43.819],[87.643, 43.822],[87.640, 43.824],[87.638, 43.827],[87.636, 43.830],[87.634, 43.833],
                    [87.633, 43.836],[87.632, 43.839],[87.632, 43.842],[87.632, 43.845],[87.633, 43.848],[87.634, 43.851],[87.636, 43.854],
                    [87.638, 43.857],[87.640, 43.860],[87.643, 43.862],[87.646, 43.865],[87.649, 43.867],[87.653, 43.868],[87.657, 43.870],
                    [87.661, 43.871],[87.665, 43.872],[87.670, 43.872],[87.674, 43.872],[87.678, 43.872],[87.683, 43.872],[87.687, 43.871],
                    [87.691, 43.870],[87.695, 43.868],[87.699, 43.867],[87.702, 43.865],[87.705, 43.862],[87.708, 43.860],[87.711, 43.857],
                    [87.713, 43.854],[87.714, 43.851],[87.715, 43.848],[87.716, 43.845],[87.716, 43.842]]]},
            buffers:[1000,2000,3000,4000],
            id:"四色围栏"});
    }
    private async btn_showCircleOutline(){
        let map = this.$refs.gisViewer as any;
        await map.showCircleOutline({
            geometry:[87.597,43.824],
            radius:1000
        })
    }
    private async btn_createPlaceFence(){
        let map = this.$refs.gisViewer as any;
        let fenceParamsObj:any = {};
        fenceParamsObj.pointsGeometry = [[87.611,43.799],[87.608,43.799],[87.609,43.801],[87.612,43.801]];
        fenceParamsObj.fenceId = "1";
        fenceParamsObj.centerResults = true;
        await map.createPlaceFence(fenceParamsObj);
    }
    private async btn_createLineFence(){
        let map = this.$refs.gisViewer as any;
        let fenceParamsObj:any = {};
        fenceParamsObj.pointsGeometry = [[87.611,43.799],[87.608,43.799],[87.609,43.801],[87.612,43.801]];
        fenceParamsObj.fenceId = "2";
        fenceParamsObj.centerResults = true;
        await map.createLineFence(fenceParamsObj);
    }
    private async btn_createElectFenceByEndPtsConnection(){
        let map = this.$refs.gisViewer as any;
        let fenceParamsObj:any = {};
        fenceParamsObj.pointsGeometry = [[87.611,43.799],[87.608,43.799],[87.609,43.801],[87.612,43.801]];
        fenceParamsObj.fenceId = "3";
        fenceParamsObj.centerResults = true;
        await map.createElectFenceByEndPtsConnection(fenceParamsObj);
    }
    private async btn_showEditingLabel(){
        let map = this.$refs.gisViewer as any;
        map.showEditingLabel({
            //编辑点坐标
            labelGeometry:[87.611,43.799],
            //编辑点数值
            fenceId:"1",
            //是否保留其他编辑点（多点同时编辑操作）
            clearOtherLabels:true,
            //是否开启编辑
            isEditable:true,
            //编辑围栏id
            editingFenceId:"1",
            //编辑结束后自动删除
            endEditing:false,
        })
    }
    private async btn_addHeatMap(){
      let map = this.$refs.gisViewer as any;
      var points = [];
      var x = 87.597;
      var y = 43.824;
      for (var i = 0; i < 5000; i++) {
        var x1 = x + (Math.random() * 2 - 1) / 20;
        var y1 = y + (Math.random() * 2 - 1) / 20;
        var value = Math.floor(100 * Math.random() + 1);
        var a = i % 2 == 0 ? '1' : '0';
        points.push({
          geometry: {x: x1, y: y1},
          fields: {desc: '上海体育馆停车场', totalSpace: value, type: a}
        });
      }
      var json = {
        points: points,
        // options: {
        //   field: 'totalSpace',
        //   radius: '20',
        //   colors: [
        //     'rgb(255, 255, 255)',
        //     'rgba(206, 199, 25,0.5)',
        //     'rgba(255, 140, 27,0.5)',
        //     'rgba(246, 64, 64,0.5)'
        //   ],
        //   maxValue: 1000,
        //   minValue: 1,
        //   zoom: 13,
        //   renderer: {
        //     type: 'simple',
        //     symbol: {
        //       type: 'esriSMS',
        //       url: 'assets/image/Anchor.png',
        //       width: 64,
        //       height: 66,
        //       yoffset: 16
        //     }
        //   }
        // }
      };
      map.addHeatMap(json);
    }
    private async btn_addGDLayer(){
        let map = this.$refs.gisViewer as any;
        map.arcgisLoadGDLayer();
    }

    private async loadImageAsync(url:string) {
        return new Promise(function(resolve, reject) {
            const image = new Image();

            image.onload = function() {
                resolve(image);
            };

            image.onerror = function() {
                reject(new Error('Could not load image at ' + url));
            };

            image.src = url;
        });
    }
    private async mapLoaded() {
        let map = this.$refs.gisViewer as any;
        const result = await map.addOverlays({
            type: 'police',
            defaultSymbol: {
                //symbol for 2d
                type: 'point-2d',
                // primitive: "square",
                url: 'assets/image/Anchor.png',
                size: [25, 25],
                // anchor: 'center'
                // color: "red",
                // outline: {
                //   color: "white",
                //   size: 4
                // },
                // anchor: "top"

                //symbol for 3d
                //type: "point-3d",
                //primitive: "cube",
                //color: "red",
                //size: 20000,
                //anchor: "bottom",
            },
            overlays: [
                {
                    id: 'test001',
                    geometry: {x: 87.597, y: 43.824},
                    fields: {
                        tooltipWindow: { type:"normal" ,value1:"这是一个信息弹窗",value2:"随意测试一下"},
                        popupWindow: { type:"normal" ,value1:"这是一个信息弹窗",value2:"随意测试一下" }
                    }
                },
                {
                    id: 'test002',
                    geometry: {x: 87.587, y: 43.824},
                    fields: {
                        popupWindow: { type:"alarm" ,value1:"这是一个警告弹窗",value2:"随意测试一下"},
                        tooltipWindow: {},
                    }
                },
                {
                    id: 'test003',
                    geometry: {x: 87.577, y: 43.824},
                    fields: {
                        name: '测试4',
                        featureid: '0001',
                        popupWindow: { type:"suspicious",value1:"这是一个正常弹窗",value2:"这是一个正常弹窗"}
                    }
                }
            ],
            autoPopup:false,
            tooltipComponent:Parent,
            popupComponent:Parent,
            custom: {
                title: '1212',
                content: '<div>name:{name}<br/><button>{name}</button></div>'
            },
            defaultButtons: [{label: '确认报警', type: 'confirmAlarm'}]
        });

        // await map.showToolTip(Parent);
    }
    private showGisDeviceInfo(type: string, id: string, detail: any) {
        console.log(type, id, detail);
    }
    private moveGisDeviceInfo(type: string, id: string, detail: any) {
        console.log(type, id, detail);
    }
    private mapClick(pt: object) {
        console.log(pt);
    }
  private selectRouteFinished(routeInfo: any) {
    console.log(routeInfo);
  }

  private intoSignal(id: string) {
    console.log('Into: ' + id);
  }

  private outofSignal(id: string) {
    console.log('Outof: ' + id);
  }
}
</script>

<style scoped>
#gisDiv {
  position: relative;
  width: 100%;
  height: 100%;
  margin: 0 auto;
  background: rgb(2, 24, 25);
}
#test {
  position: absolute;
  right: 20px;
  top: 100px;
  width: 400px;
  height: 300px;
  z-index: 100;
  background: #ffffff;
  color: #777777;
  padding: 5px;
  border: 2px solid #666666;
  -webkit-border-radius: 5px;
  -moz-border-radius: 5px;
  border-radius: 5px;
  font-size: 12px;
}
.TextDiv {
  border: 1.5px solid #666666;
  background: #666666;
}

.fa-close{
    position: absolute;
    top: 10px;
    right: 10px;
    cursor: pointer;
    color: #7d98bf;
}
</style>
