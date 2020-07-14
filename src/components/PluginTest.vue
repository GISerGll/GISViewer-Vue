<template>
  <div id="gisDiv">
    <div id="test">
<!--      <button @click="btn_loadMap">加载地图</button>-->
      <button @click="btn_setMapCenter">居中</button>
      <button @click="btn_setMapCenterAndLevel">放大居中</button>
        <button @click="btn_findFeature">定位居中</button><br>
      <button @click="btn_addOverlays_pt">添加点</button>
      <button @click="btn_addOverlays_line">添加线</button>
      <button @click="btn_addOverlays_polygon">添加面</button>
      <button @click="btn_deleteOverlays">删除</button><br>
      <button @click="btn_drawPoints">撒点</button>
      <button @click="btn_drawLines">画线</button>
      <button @click="btn_drawPolygons">画多边形</button>
      <button @click="btn_drawCircles">画圆</button>
      <button @click="btn_drawRects">画矩形</button>
<!--      <button @click="btn_">删除</button><br>-->
<!--      <button @click="btn_addHeatMap">添加热力图</button>-->
<!--      <button @click="btn_deleteHeatMap">删除热力图</button>-->
    </div>
    <gis-viewer
      ref="gisViewer"
      platform="arcgis2d"
      :map-config="mapConfig"
      @map-loaded="mapLoaded"
      @marker-click="showGisDeviceInfo"
    />
  </div>
</template>
<script lang="ts">
import {Vue, Component} from 'vue-property-decorator';
import axios from 'axios';
@Component
export default class PluginTest extends Vue {
  private mapConfig = {
    arcgis_api: 'http://128.64.151.217:8000/web-gis/scripts/arcgis_js_api/library/4.15',
    theme: 'light', //dark,vec
    baseLayers: [
      {
        url:"http://map.geoq.cn/arcgis/rest/services/ChinaOnlineCommunity/MapServer",
        type: 'tiled',
        visible: true,
      }
    ],
    gisServer: 'http://128.64.151.245:6080',
    options: {
      //for arcgis-2d
      center: [87.597, 43.824],
      zoom: 15,
    },
    bookmarks: [
      {
        name: 'china',
        camera: {
          heading: 0,
          tilt: 9.15,
          position: {
            x: 105.508849,
            y: 22.581284,
            z: 7000000
          }
        }
      }
    ]
  };

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
      map.findFeature({
          layerName:"police",
          level:18,
          ids:["test001","test002"],
          centerResult:true
      })
  }
  private async btn_addOverlays_pt() {
      let map = this.$refs.gisViewer as any;
      const img = await this.loadImageAsync("assets/image/Anchor.png");
      await map.addOverlays({
      type: 'police',
      defaultSymbol: {
        //symbol for 2d
        type: 'point-2d',
        // primitive: "square",
        url: 'assets/image/Anchor.png',
        size: img? [img.width,img.height] : [12,12],
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
          geometry: {x: 87.597, y: 43.814},
          fields: {name: '测试2', featureid: '0002'}
        },
        {
          id: 'test002',
          geometry: {x: 87.587, y: 43.814},
          fields: {name: '测试3', featureid: '0003'}
        },
        {
          id: 'test003',
          geometry: {x: 87.577, y: 43.814},
          fields: {name: '测试4', featureid: '0001'}
        }
      ],
      showPopup: true,
      autoPopup: false,
      defaultInfoTemplate: {
        title: '1212',
        content: '<div>name:{name}<br/><button>{name}</button></div>'
      },
      defaultButtons: [{label: '确认报警', type: 'confirmAlarm'}]
    });
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
      await map.deleteOverlays({
          types:["police"],
          ids:["test001"]
      })
  }
  private async btn_drawPoints(){

  }
  private async btn_drawLines(){

  }
  private async btn_drawPolygons(){

  }
  private async btn_drawCircles(){

  }
  private async btn_drawRects(){

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
    console.log('Map Loaded.');
    let map = this.$refs.gisViewer as any;
    const result = await map.addOverlays({
      type: 'police',
      defaultSymbol: {
        //symbol for 2d
        type: 'point-2d',
        // primitive: "square",
        url: 'assets/image/Anchor.png',
        size: [25, 25],
        anchor: 'center'
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
          fields: {name: '测试2', featureid: '0002'}
        },
        {
          id: 'test002',
          geometry: {x: 87.587, y: 43.824},
          fields: {name: '测试3', featureid: '0003'}
        },
        {
          id: 'test003',
          geometry: {x: 87.577, y: 43.824},
          fields: {name: '测试4', featureid: '0001'}
        }
      ],
      showPopup: false,
      autoPopup: false,
      defaultInfoTemplate: {
        title: '1212',
        content: '<div>name:{name}<br/><button>{name}</button></div>'
      },
      defaultButtons: [{label: '确认报警', type: 'confirmAlarm'}]
    });

    let html='<div class="lightingTreePop">\n' +
        '        <p class="title">路灯信息</p>\n' +
        '        <p class="fa fa-close"></p>\n' +
        '        <ul class="main">\n' +
        '            <li>\n' +
        '                <p>路灯标号</p>\n' +
        '                <div>成都雄飞中心</div>\n' +
        '            </li>\n' +
        '            <li>\n' +
        '                <p>路灯名称</p>\n' +
        '                <div>成都雄飞中心</div>\n' +
        '            </li>\n' +
        '            <li>\n' +
        '                <p>路灯状态</p>\n' +
        '                <div> <span class="green">在线</span></div>\n' +
        '            </li>\n' +
        '            <li>\n' +
        '                <p>开灯状态</p>\n' +
        '                <!-- fa-toggle-off -->\n' +
        '                <div> <span class="fa fa-toggle-on"></span> </div>\n' +
        '            </li>\n' +
        '            <li>\n' +
        '                <p>路灯状态</p>\n' +
        '                <div>成都雄飞中心成都雄飞中心成都雄飞中心成都雄飞中心成都雄飞中心成都雄飞中心成都雄飞中心成都雄飞中心成都雄飞中心</div>\n' +
        '            </li>\n' +
        '        </ul>\n' +
        '    </div>'
    map.showToolTip(html);
  }
  private showGisDeviceInfo(type: string, id: string, detail: any) {
    console.log(type, id, detail);
  }
}
</script>

<style scoped>
#gisDiv {
  position: relative;
  width: 100%;
  height: 100%;
  margin: 0 auto;
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

.fa-close{
    position: absolute;
    top: 10px;
    right: 10px;
    cursor: pointer;
    color: #7d98bf;
}
</style>
