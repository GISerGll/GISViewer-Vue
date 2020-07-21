import {Vue, Component} from 'vue-property-decorator';
export default class WuLuMuQiConfig{
    public static mapConfig = {
        arcgis_api: 'http://localhost:8080/arcgis_js_api/library/4.15',
        // arcgis_api: 'https://js.arcgis.com/4.15',
        theme: 'light', //dark,vec
        baseLayers: [
            {
                url:"http://map.geoq.cn/arcgis/rest/services/ChinaOnlineCommunity/MapServer",
                type: 'tiled',
                label: "浅色底图",
                visible: true,
            },
            {
                url:"http://map.geoq.cn/arcgis/rest/services/ChinaOnlineStreetPurplishBlue/MapServer",
                type: 'tiled',
                label: "深色底图",
                visible: false,
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
    }
}
