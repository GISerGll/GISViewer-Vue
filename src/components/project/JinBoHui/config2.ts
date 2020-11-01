export let GisConfig = {
  arcgis_api:
    'http://10.31.214.203:8992/arcgis_js_v414_api/arcgis_js_api/library/4.14',
  theme: 'custom', //dark,vec
  baseLayers: [
    {
      label: '深色底图',
      type: 'tiled',
      url: 'https://10.31.214.248/server/rest/services/bj_dmd/MapServer',
      visible: true
    }
  ],
  operationallayers: [
    {
      label: '发布段',
      type: 'dynamic',
      url:
        'http://10.31.214.197:6080/arcgis/rest/services/JinBoHui/Kuaisulu_fbd/MapServer',
      refreshInterval: 1,
      visible: false,
      outFields: ['*']
    },
    {
      label: '情报板',
      url:
        'http://10.31.214.201:6080/arcgis/rest/services/JinBoHui/ShangHai_devices_new/MapServer/0',
      type: 'feature',
      visible: true,
      outFields: ['*'],
      renderer: {
        type: 'simple',
        symbol: {
          type: 'picture-marker',
          url: 'assets/mapIcons/JinBoHui/icon_qbb_green.png',
          width: 12,
          height: 14,
          yoffset: 7
        }
      }
    },
    {
      label: '摄像机',
      url:
        'http://10.31.214.201:6080/arcgis/rest/services/JinBoHui/ShangHai_devices_new/MapServer/1',
      type: 'feature',
      visible: true,
      outFields: ['*'],
      renderer: {
        type: 'simple',
        symbol: {
          type: 'picture-marker',
          url: 'assets/mapIcons/JinBoHui/icon_gis_sxj02.png',
          width: 12,
          height: 14,
          yoffset: 7
        }
      }
    },
    {
      label: '匝道灯',
      url:
        'http://10.31.214.201:6080/arcgis/rest/services/JinBoHui/ShangHai_devices_new/MapServer/2',
      type: 'feature',
      visible: true,
      outFields: ['*'],
      renderer: {
        type: 'simple',
        symbol: {
          type: 'picture-marker',
          url: 'assets/mapIcons/ZaDaoDeng-open.png',
          width: 12,
          height: 14,
          yoffset: 7
        }
      }
    }
  ],
  options: {
    center: [-0.09426, -0.0552],
    zoom: 4,
    constraints: {
      rotationEnabled: false,
      minZoom: 0
    }
  }
};
