export let GisConfig = {
  arcgis_api: 'http://localhost:8090/arcgis_js_api/library/4.14',
  theme: 'custom', //dark,vec
  baseLayers: [
    {
      label: '深色底图',
      type: 'tiled',
      url:
        'http://10.31.214.201:6080/arcgis/rest/services/ShangHai/ShangHai_base_PurplishBlue/MapServer',
      visible: true
    }
  ],
  operationallayers: [
    {
      label: '国展中心面',
      url:
        'http://10.31.214.201:6080/arcgis/rest/services/JinBoHui/ShangHai_Exhibition/MapServer',
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
      geometry: {x: 13502790.77925912, y: 3657732.182986842},
      width: 520,
      height: 520,
      minScale: 9028
    },
    {
      type: 'image',
      label: 'flower',
      url: 'assets/mapIcons/JinBoHui/flower.png',
      geometry: {x: 13502776.148697566, y: 3657684.599002632},
      width: 350,
      height: 350,
      minScale: 72224,
      maxScale: 9029
    },
    {
      label: '国展中心点',
      url:
        'http://10.31.214.201:6080/arcgis/rest/services/JinBoHui/ShangHai_Parking/MapServer/2',
      type: 'feature',
      outFields: ['*'],
      maxScale: 144448,
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
    center: [121.2974, 31.1916],
    scale: 9028,
    constraints: {
      rotationEnabled: false,
      minZoom: 0
    }
  }
};
