export let GisConfig = {
  arcgis_api: 'http://localhost:8090/arcgis_js_api/library/4.14',
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
      label: '国展中心面',
      url:
        'http://10.31.214.197:6080/arcgis/rest/services/JinBoHui/ShangHai_Exhibition/MapServer',
      type: 'dynamic',
      outFields: ['*'],
      popupTemplates: {
        0: {
          title: '',
          content: '客流：{FSTR_VOLUME}'
        }
      }
    },
    {
      type: 'image',
      label: 'gzzx',
      url: 'assets/mapIcons/JinBoHui/gzzx.svg',
      geometry: {x: -16153.035409974027, y: -4814.447401502329},
      width: 430,
      height: 430,
      minScale: 8000
    },
    {
      type: 'image',
      label: 'flower',
      url: 'assets/mapIcons/JinBoHui/flower.png',
      geometry: {x: -16173.035409974027, y: -4834.447401502329},
      width: 282,
      height: 282,
      minScale: 64000,
      maxScale: 16000
    },
    {
      label: '国展中心点',
      url:
        'http://10.31.214.197:6080/arcgis/rest/services/JinBoHui/ShangHai_Parking/MapServer/2',
      type: 'feature',
      outFields: ['*'],
      maxScale: 128000,
      popupTemplate: {
        title: '',
        content: '客流：{FSTR_VOLUME}'
      },
      renderer: {
        type: 'simple',
        symbol: {
          type: 'picture-marker',
          url: 'assets/mapIcons/JinBoHui/flower.png',
          width: 32,
          height: 32
        }
      }
    }
  ],
  options: {
    center: [-0.14532287775028, -0.0435806907338],
    zoom: 7,
    constraints: {
      rotationEnabled: false,
      minZoom: 0
    }
  }
};
