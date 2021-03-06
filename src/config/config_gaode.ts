import axios from 'axios';
import Parent from "@/components/tooltips/Parent.vue";
export default class MapConfig {
    public constructor() {}
    public mapConfig: any = {
        gaode_api: 'http://localhost:8080/arcgis_js_api/library/4.15',
        //arcgis_api:
        //  'https://webapi.amap.com/maps?v=1.4.15&key=29dd04daa39aa33a7e2cdffa37ebec4d',
        //arcgis_api: 'http://128.64.130.247:8219/baidumap/jsapi/api.js',
        //arcgis_api: "http://128.64.151.245:8019/baidumap/jsapi/api.js",
        //arcgis_api: "http://localhost:8090/baidu/BDAPI.js",
        theme: 'dark', //dark,vec
        baseLayers: [
            {
                type: 'tiled',
                url:
                  'https://map.geoq.cn/arcgis/rest/services/ChinaOnlineStreetPurplishBlue/MapServer',
                visible: true
            }
        ],
        operationallayers: [
            {
                label: 'fbd1333',
                url: './config/fbd/六大队.json',
                type: 'json',
                visible: false,
                renderer: {
                    type: 'simple', // autocasts as new SimpleRenderer()
                    symbol: {
                        type: 'simple-fill', // autocasts as new SimpleMarkerSymbol()
                        color: 'rgba(12,12,255,0.5)',
                        outline: {
                            // autocasts as new SimpleLineSymbol()
                            width: 2,
                            color: 'red'
                        }
                    }
                }
            },
            {
                label: 'fbd123',
                url: './config/fbd/morph_ksl.json',
                type: 'json',
                visible: true,
                refreshInterval: 1,
                renderer: {
                    type: 'unique-value', // autocasts as new UniqueValueRenderer()
                    field: 'STATE',
                    defaultSymbol: {
                        type: 'simple-fill',
                        color: 'rgba(100, 210, 121, 255)',
                        outline: {color: '#696969', width: 1}
                    }, // autocasts as new SimpleFillSymbol()
                    uniqueValueInfos: [
                        {
                            value: 'free',
                            symbol: {
                                type: 'simple-fill', // autocasts as new SimpleFillSymbol()
                                color: 'rgba(100, 210, 121, 255)'
                            }
                        },
                        {
                            // All features with value of "East" will be green
                            value: 'jam',
                            symbol: {
                                type: 'simple-fill', // autocasts as new SimpleFillSymbol()
                                color: 'red'
                            }
                        },
                        {
                            value: 'crowd',
                            symbol: {
                                type: 'simple-fill', // autocasts as new SimpleFillSymbol()
                                color: 'yellow'
                            }
                        }
                    ]
                }
            },
            {
                label: 'fbd',
                url:
                  'http://172.30.30.1:6080/arcgis/rest/services/ShangHai/FBD_GD/MapServer',
                type: 'dynamic',
                visible: true
            },
            {
                label: '地铁1',
                url: 'http://localhost:8090/TGISViewer_v200/images/guozhanzhongxin.svg',
                type: 'picture',
                visible: true
            },
            {
                label: '地铁',
                url:
                  'http://172.30.30.1:6080/arcgis/rest/services/ShangHaiHarbour/ShangHai_transportation/MapServer',
                type: 'dynamic',
                visible: false,
                popupTemplates: {
                    2: {
                        title: '12',
                        content: '<div class="acc">{Name}1212---{SubwayName}</div>'
                    },
                    5: {
                        title: '12',
                        content: '<div class="acc">{Name}</div>'
                    },
                    10: {
                        title: '12',
                        content: '<div class="acc">{Name}</div>'
                    },
                    12: {
                        title: '12',
                        content: '<div class="acc">{Name}</div>'
                    }
                }
            },
            {
                label: '发布段0000',
                url:
                  'http://172.30.30.1:6080/arcgis/rest/services/ShangHaiHarbour/shanghai_xzqh_simple/MapServer/0',
                type: 'feature',
                visible: false,
                labelsVisible: true,
                outFields: ['*'],
                renderer: {
                    type: 'unique-value',
                    field: 'Name',
                    defaultSymbol: {
                        type: 'simple-fill',
                        style: 'solid',
                        color: [255, 0, 0, 0.5],
                        outline: {
                            type: 'simple-line',
                            style: 'solid',
                            color: [110, 110, 110, 255],
                            width: 2
                        }
                    },
                    uniqueValueInfos: [
                        {
                            value: '闵行区',
                            symbol: {
                                type: 'simple-fill',
                                style: 'solid',
                                color: [0, 255, 51, 0.3],
                                outline: {
                                    type: 'simple-line',
                                    style: 'solid',
                                    color: [110, 110, 110, 0.5],
                                    width: 2
                                }
                            }
                        },
                        {
                            value: '普陀区',
                            symbol: {
                                type: 'simple-fill',
                                style: 'solid',
                                color: [34, 255, 122, 0.6],
                                outline: {
                                    type: 'simple-line',
                                    style: 'solid',
                                    color: [110, 110, 110, 255],
                                    width: 2
                                }
                            }
                        },
                        {
                            value: '奉贤区',
                            symbol: {
                                type: 'simple-fill',
                                style: 'solid',
                                color: [128, 0, 68, 0.4],
                                outline: {
                                    type: 'simple-line',
                                    style: 'solid',
                                    color: [110, 110, 110, 255],
                                    width: 2
                                }
                            }
                        }
                    ]
                },
                labelingInfo: [
                    {
                        //labelExpressionInfo: {expression: '$feature.Name'},
                        labelExpression: '[Name]',
                        useCodedValues: true,
                        labelPlacement: 'always-horizontal',
                        symbol: {
                            type: 'text',
                            rightToLeft: false,
                            color: [255, 255, 0, 0.85],
                            verticalAlignment: 'baseline',
                            horizontalAlignment: 'left',
                            font: {
                                size: 100,
                                weight: 'bold'
                            }
                        }
                    }
                ]
            }
            ,
            {
                label: '匝道灯',
                url:
                  'http://172.30.30.1:6080/arcgis/rest/services/ShangHaiHarbour/KuaiSuLu_device/MapServer/0',
                type: 'feature',
                visible: true,
                refreshInterval: 0.5,
                outFields: ['*'],
                popupTemplate: {
                    title: '12',
                    content:
                      '<div><div class="acc">{BM_CODE}1212---{DEVICETYPE }</div></div>'
                },
                featureReduction: {
                    type: 'cluster',
                    clusterRadius: '100px',
                    // {cluster_count} is an aggregate field containing
                    // the number of features comprised by the cluster
                    popupTemplate: {
                        content: 'This cluster represents {cluster_count} earthquakes.',
                        fieldInfos: [
                            {
                                fieldName: 'cluster_count',
                                format: {
                                    places: 0,
                                    digitSeparator: true
                                }
                            }
                        ]
                    },
                    clusterMinSize: '24px',
                    clusterMaxSize: '60px',
                    labelingInfo: [
                        {
                            deconflictionStrategy: 'none',
                            labelExpressionInfo: {
                                expression: '$feature.cluster_count'
                            },
                            symbol: {
                                type: 'text',
                                color: '#004a5d',
                                font: {
                                    weight: 'bold',
                                    family: 'Noto Sans',
                                    size: '12px'
                                }
                            },
                            labelPlacement: 'center-center'
                        }
                    ]
                }
            }
            ,
            {
                url: 'http://localhost:8888/geoserver/myMap/wms',
                type: 'wms',
                label: 'ceshi',
                sublayers: [
                    {
                        name: 'myMap:zadao' // name of the sublayer
                    }
                ],
                imageFormat: 'image/png',
                version: '1.1.1'
            }
        ],
        //gisServer: 'http://128.64.151.245:8019',
        options: {
            //for arcgis-2d
            center: [121.415, 31.174],
            zoom: 14,
            //viewingMode: 'local'
            // ground: {opacity: 0},
            // alphaCompositingEnabled: true,
            // environment: {
            //   background: {
            //     type: 'color',
            //     color: [255, 0, 0, 0.5]
            //   },
            //   starsEnabled: false,
            //   atmosphereEnabled: false
            // }
            //viewMode: '3D',
            constraints: {
                rotationEnabled: false,
                maxzoom: 16
            },
            mapStyle: 'amap://styles/darkblue' //设置地图的显示样式
            //for arcgis-3d
            // camera: {
            //   heading: 0,
            //   tilt: 9.15,
            //   position: {
            //     x: 105.508849,
            //     y: 22.581284,
            //     z: 7000000
            //   }
            // }
        }
    };
    public gdConfig: any = {
        // gaode_api:
        //   'https://webapi.amap.com/maps?v=1.4.15&key=ec85d3648154874552835438ac6a02b2',
        gaode_api:
            'http://localhost:8080/gaode/gaode_js_api.js',
        theme: 'vec', //dark,vec
        baseLayers: [{type: 'traffic', label: '路况', visible: false}],

        options: {
            center: [87.597, 43.824],
            zoom: 13,
            viewMode: '3D',
            mapStyle: 'amap://styles/blue', //设置地图的显示样式
            showBuildingBlock:true
        }
    };
    public async mapLoaded(map: any) {
        //map.showLayer({label: 'fbd1333'});
        // console.log('Map Loaded.');
        // map.showDistrictMask({
        //   name: '徐汇区',
        //   showMask: true
        // });
        // map.showStreet();
        // map.showJurisdiction();
        let points = {
            type: 'police',
            defaultVisible: true,
            defaultSymbol: {
                //symbol for 2d
                type: 'point-2d',
                // primitive: "square",
                url: 'assets/image/Anchor.png',
                size: [50, 50],
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
                    geometry: {x: 121.448924, y: 31.157101},
                    fields: {name: '测试2', featureid: '0002'},
                    infoWindow: {
                        type:"normal" ,
                        value1:"这是一个信息弹窗",
                        value2:"随意测试一下",
                        infoWindow: { type:"normal" ,value1:"这是一个信息弹窗",value2:"随意测试一下"}
                    }
                },
                {
                    id: 'test002',
                    geometry: {x: 121.418924, y: 31.157101},
                    fields: {
                        name: '测试3',
                        featureid: '0003',
                        infoWindow: { type:"alarm" ,value1:"这是一个信息弹窗",value2:"随意测试一下"}
                    },

                },
                {
                    id: 'test003',
                    geometry: {x: 121.418924, y: 31.257101},
                    fields: {
                        name: '测试4',
                        featureid: '0001',
                        infoWindow: { type:"suspicious" ,value1:"这是一个信息弹窗",value2:"随意测试一下"}
                    }
                }
            ],
            showPopup: false,
            autoPopup: false,
            defaultInfoTemplate: {
                title: '1212',
                content: '<div class="accc">name:{name}</div>'
            },
            defaultButtons: [{label: '确认报警', type: 'confirmAlarm'}]
        };
        const result = await map.addOverlays(points);
        map.showToolTip(Parent);
    }
    public btn_test1(map: any) {
        var points = [];
        var x = 121.43;
        var y = 31.15;
        for (var i = 0; i < 1000; i++) {
            var x1 = x + (Math.random() * 2 - 1) / 10;
            var y1 = y + (Math.random() * 2 - 1) / 10;
            var value = Math.floor(1000 * Math.random() + 1);
            var a = i % 2 == 0 ? '1' : '0';
            points.push({
                geometry: {x: x1, y: y1},
                fields: {desc: '上海体育馆停车场', totalSpace: value, type: a}
            });
        }
        var json = {
            points: points,
            images: {geometry: {x: x - 0.1, y: y + 0.1}, width: 500, height: 500},
            options: {
                field: 'totalSpace',
                radius: '20',
                colors: [
                    'rgb(255, 255, 255)',
                    'rgba(206, 199, 25,0.9)',
                    'rgba(255, 140, 27,0.9)',
                    'rgba(246, 64, 64,0.9)'
                ],
                maxValue: 1000,
                minValue: 1,
                zoom: 15,
                renderer: {
                    type: 'simple',
                    symbol: {
                        type: 'esriPMS',
                        url: 'assets/image/Anchor.png',
                        width: 64,
                        height: 66,
                        yoffset: 16
                    }
                }
            }
        };
        map.addHeatImage(json);
        // map.startGeometrySearch({
        //   radius: 12000,
        //   showResult: true,
        //   clickHandle: (e: any) => {
        //     console.log(e);
        //   }
        // });
        //map.showMigrateChart();
        // map.addDrawLayer({
        //   layerUrls: './config/fbd/morph_ksl.json',
        //   label: '快速路'
        // });
        // map.addDrawLayer({
        //   layerUrls: './config/fbd/morph_fbd.json',
        //   label: '发布段'
        // });
        // map
        //   .routeSearch({
        //     start: {x: 121.31, y: 31.46}, //开始坐标
        //     end: {x: 121.65, y: 31.125}, //终点坐标
        //     model: 'car' //'walk',行走，'ride',骑行，'car',驾车
        //   })
        //   .then((e: any) => {
        //     console.log(e); //返回结果
        //   });
        //map.showRoutePoint();
        //let map = this.$refs.gisViewer as any;
        // axios.get('config/point1.json').then((res: any) => {
        //   map.addOverlaysCluster(res.data);
        // });
        // axios.get('config/point2.json').then((res: any) => {
        //   map.addOverlaysCluster(res.data);
        // });
        //axios.get("config/Jurisdiction/bsga_v2.geo.json").then((res: any) => {
        //map.addOverlaysCluster(res.data);
        //  console.log(res.data);
        //});
        //map.hideLayer({label: '匝道灯'});
        // map.findFeature({
        //   layerName: 'police',
        //   level: 16,
        //   ids: ['test003'],
        //   centerResult: true
        // });
        // map.hideLayer({type: 'traffic'});
        // map.showRoad({ids: [1]});
        // map.showDistrictMask({
        //   name: '徐汇区',
        //   showMask: true
        // });
    }
    public btn_test2(map: any) {
        //map.showLayer({label: 'fbd123'});
        //let map = this.$refs.gisViewer as any;
        var points = [];
        var x = 121.43;
        var y = 31.15;
        for (var i = 0; i < 100; i++) {
            var x1 = x + (Math.random() * 2 - 1) / 20;
            var y1 = y + (Math.random() * 2 - 1) / 20;
            var value = Math.floor(1000 * Math.random() + 1);
            var a = i % 2 == 0 ? '1' : '0';
            points.push({
                geometry: {x: x1, y: y1},
                fields: {desc: '上海体育馆停车场', totalSpace: value, type: a}
            });
        }
        var json = {
            points: points,
            options: {
                field: 'totalSpace',
                radius: '20',
                colors: [
                    'rgb(255, 255, 255)',
                    'rgba(206, 199, 25,0.5)',
                    'rgba(255, 140, 27,0.5)',
                    'rgba(246, 64, 64,0.5)'
                ],
                maxValue: 1000,
                minValue: 1,
                zoom: 15,
                renderer: {
                    type: 'simple',
                    symbol: {
                        type: 'esriPMS',
                        url: 'assets/image/Anchor.png',
                        width: 64,
                        height: 66,
                        yoffset: 16
                    }
                }
            }
        };
        map.addHeatMap(json);
        // map.addOverlays({
        //   type: 'police',
        //   defaultSymbol: {
        //     //symbol for 2d
        //     type: 'point-2d',
        //     // primitive: "square",
        //     url: 'assets/image/Anchor.png',
        //     size: [50, 50],
        //     anchor: 'center'
        //   },
        //   defaultZooms: [10, 20],
        //   overlays: [
        //     {
        //       id: 'test001',
        //       geometry: {x: 121.448924, y: 31.137101},
        //       fields: {name: '测试2', featureid: '0002'}
        //     },
        //     {
        //       id: 'test002',
        //       geometry: {x: 121.318924, y: 31.157101},
        //       fields: {name: '测试3', featureid: '0003'}
        //     },
        //     {
        //       id: 'test003',
        //       geometry: {x: 121.418924, y: 31.257101},
        //       fields: {name: '测试4', featureid: '0001'}
        //     }
        //   ],
        //   showPopup: true,
        //   autoPopup: false,
        //   defaultInfoTemplate: {
        //     title: '1212',
        //     content: '<div>name:{name}<br/><button>{name}</button></div>'
        //   },
        //   defaultButtons: [{label: '确认报警', type: 'confirmAlarm'}]
        // });
        //map.showLayer({label: 'ceshi'});
        // map.hideLayer({type: 'traffic'});
        // // map.showDistrictMask({
        // //   name: '徐汇区',
        // //   showMask: true
        // // });
        // map.locateStreet({id: '10003'});
        //map.deleteAllOverlaysCluster();
        // map.findFeature({
        //   layerName: 'sxj1',
        //   level: 16,
        //   ids: ['31011300001310000003'],
        //   centerResult: true
        // });

        // map
        //   .startGeometrySearch({
        //     radius: 5000,
        //     showResult: true,
        //     clickHandle: (e: any) => {
        //       console.log(e);
        //     }
        //   })
        //   .then((res: any) => {
        //     console.log(res.result);
        //   });
    }
    public btn_test3(map: any) {
        map.showLayer({label: 'fbd1333'});
        //map.clearGeometrySearch();
        //map.deleteHeatImage();
        //map.hideMigrateChart();
        //map.clearRouteSearch(); //清除
        //map.setMapStyle('amap://styles/darkblue');
        //map.locateStreet({id: '10013'});
        // map.showLayer({type: 'traffic'});
        // map.findLayerFeature({
        //   layerName: '地铁',
        //   level: 16,
        //   ids: ['12'],
        //   centerResult: true
        // });
        //map.hideLayer({label: '匝道灯'});
        //map.deleteHeatMap();
        //map.deleteOverlaysCluster({types: ['sxj1']});
        //map.deleteAllOverlays();
        // map.deleteOverlays({ids: ['test001']});
        //map.hideLayer({label: 'ceshi'});
        //map.setMapCenter({x: 121.12, y: 31.23});
        //map.setMapCenterAndLevel({
        //   x: 121.12,
        //   y: 31.23,
        //   level: 15
        // });
        //map.hideJurisdiction();
        //map.hideDistrictMask();
        // map.addOverlays({
        //   type: 'police',
        //   defaultSymbol: {
        //     url: 'assets/images/a.png',
        //     size: [32, 41],
        //     type: 'point'
        //   },
        //   overlays: [
        //     {
        //       id: 'test001',
        //       {geometry: {
        //         x: 121.418924,
        //         y: 31.157101
        //       },
        //       fields: {
        //         name: '测试2',
        //         featureid: '0002'
        //       }
        //     },
        //     {
        //       id: 'abc',
        //       {geometry: {
        //         path: [
        //           [121.31, 31.01],
        //           [121.2, 31.22],
        //           [121.1, 31.33],
        //           [121.45, 30.89]
        //         ]
        //       },
        //       fields: {
        //         name: '测试2',
        //         featureid: '0002'
        //       },
        //       symbol: {
        //         color: 'red'
        //       }
        //     },
        //     {
        //       id: 'abc22',
        //       {geometry: {
        //         ring: [
        //           [121.31, 31.01],
        //           [121.2, 31.22],
        //           [121.1, 31.33],
        //           [121.45, 30.89]
        //         ]
        //       },
        //       fields: {
        //         name: '测试2',
        //         featureid: '0002'
        //       },
        //       symbol: {
        //         color: 'red'
        //       }
        //     },
        //     {
        //       id: 'abc112',
        //       {geometry: {
        //         center: [121.36, 31.45],
        //         radius: 10000
        //       },
        //       fields: {
        //         name: '测试3',
        //         featureid: '00044'
        //       },
        //       symbol: {
        //         color: 'red',
        //         outline: {color: 'blue', width: 8}
        //       }
        //     },
        //     {
        //       id: 'test002',
        //       {geometry: {
        //         x: 121.318924,
        //         y: 31.157101
        //       },
        //       fields: {
        //         name: '测试3',
        //         featureid: '0003'
        //       }
        //     },
        //     {
        //       id: 'test003',
        //       {geometry: {
        //         x: 121.418924,
        //         y: 31.257101
        //       },
        //       fields: {
        //         name: '测试4',
        //         featureid: '0001'
        //       }
        //     }
        //   ],
        //   showPopup: true,
        //   autoPopup: false,
        //   defaultInfoTemplate: {
        //     title: '1212',
        //     content: 'name:{name}<br/><button>{name}</button>'
        //   },
        //   showToolTip: true,
        //   toolTipOption: {
        //     content: '{featureid}',
        //     xoffset: 0,
        //     yoffset: -6
        //   }
        // });
    }
}
