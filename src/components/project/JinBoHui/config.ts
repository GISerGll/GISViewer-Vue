export let GisConfig = {
  arcgis_api:
    'http://10.31.214.203:8994/arcgis_js_v414_api/arcgis_js_api/library/4.14',
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
      url: 'assets/mapIcons/JinBoHui/flower.png',
      geometry: {x: 13502204.92578, y: 3658256.1152},
      width: 564,
      height: 564,
      minScale: 72224
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
    },
    {
      label: '虹桥商务区',
      url:
        'http://10.31.214.201:6080/arcgis/rest/services/JinBoHui/ShangHai_Parking/MapServer/3',
      type: 'feature',
      visible: true,
      showLabels: true,
      outFields: ['*']
    },
    {
      label: '停车场-面',
      url:
        'http://10.31.214.201:6080/arcgis/rest/services/JinBoHui/ShangHai_Parking/MapServer',
      type: 'dynamic',
      visible: true
    },
    {
      label: '地铁线',
      url:
        'http://10.31.214.201:6080/arcgis/rest/services/JinBoHui/ShangHai_Subway/MapServer/2',
      type: 'feature',
      visible: true,
      outFields: ['*']
    },
    {
      label: '停车场-点',
      url:
        'http://10.31.214.201:6080/arcgis/rest/services/JinBoHui/ShangHai_Parking/MapServer/1',
      type: 'feature',
      popupTemplate: {
        title: '',
        content:
          '描述：{PARK_DESC}<br/>总泊位数（大车）：{B_PARKNUM}<br/>总泊位数（小车）：{S_PARKNUM}<br/>总剩余泊位数（大车）：{B_REMAIN_PARKNUM}<br/>总剩余泊位数（小车）：{S_REMAIN_PARKNUM}<br/>泊位占用率（大车）：{B_PARKRATE}<br/>泊位占用率（小车）：{S_PARKRATE}<br/>预约到达率（大车）：{B_APPOINT_INRATE}<br/>预约到达率（小车）：{S_APPOINT_INRATE}'
      },
      visible: true,
      refreshInterval: 5,
      outFields: ['*'],
      renderer: {
        type: 'unique-value',
        field: 'JWPT.PARK_STATUS_VW.STATUS',
        defaultSymbol: {
          type: 'picture-marker',
          url: 'assets/mapIcons/JinBoHui/icon_P_green.png',
          width: 24,
          height: 33,
          yoffset: 17
        },
        uniqueValueInfos: [
          {
            value: 'free',
            symbol: {
              type: 'picture-marker',
              url: 'assets/mapIcons/JinBoHui/icon_P_green.png',
              width: 24,
              height: 33,
              yoffset: 17
            }
          },
          {
            value: 'crowd',
            symbol: {
              type: 'picture-marker',
              url: 'assets/mapIcons/JinBoHui/icon_P_green.png',
              width: 24,
              height: 33,
              yoffset: 17
            }
          },
          {
            value: 'jam',
            symbol: {
              type: 'picture-marker',
              url: 'assets/mapIcons/JinBoHui/icon_P_green.png',
              width: 24,
              height: 33,
              yoffset: 17
            }
          },
          {
            value: 'saturation',
            symbol: {
              type: 'picture-marker',
              url: 'assets/mapIcons/JinBoHui/icon_P_green.png',
              width: 24,
              height: 33,
              yoffset: 17
            }
          }
        ]
      }
    },
    {
      label: '小停车场-点',
      url:
        'http://10.31.214.201:6080/arcgis/rest/services/JinBoHui/ShangHai_Parking/MapServer/5',
      type: 'feature',
      popupTemplate: {
        title: '',
        content:
          '描述：{PARK_DESC}<br/>总泊位数（小车）：{S_PARKNUM}<br/>总剩余泊位数（小车）：{S_REMAIN_PARKNUM}<br/>泊位占用率（小车）：{S_PARKRATE}<br/>预约到达率（小车）：{S_APPOINT_INRATE}'
      },
      visible: true,
      refreshInterval: 5,
      outFields: ['*'],
      renderer: {
        type: 'unique-value',
        field: 'JWPT.PARK_STATUS_VW.STATUS',
        defaultSymbol: {
          type: 'picture-marker',
          url: 'assets/mapIcons/JinBoHui/icon_P_green.png',
          width: 24,
          height: 33,
          yoffset: 17
        },
        uniqueValueInfos: [
          {
            value: 'free',
            symbol: {
              type: 'picture-marker',
              url: 'assets/mapIcons/JinBoHui/icon_P_green.png',
              width: 24,
              height: 33,
              yoffset: 17
            }
          },
          {
            value: 'crowd',
            symbol: {
              type: 'picture-marker',
              url: 'assets/mapIcons/JinBoHui/icon_P_green.png',
              width: 24,
              height: 33,
              yoffset: 17
            }
          },
          {
            value: 'jam',
            symbol: {
              type: 'picture-marker',
              url: 'assets/mapIcons/JinBoHui/icon_P_green.png',
              width: 24,
              height: 33,
              yoffset: 17
            }
          },
          {
            value: 'saturation',
            symbol: {
              type: 'picture-marker',
              url: 'assets/mapIcons/JinBoHui/icon_P_green.png',
              width: 24,
              height: 33,
              yoffset: 17
            }
          }
        ]
      }
    },
    {
      label: '大停车场-点',
      url:
        'http://10.31.214.201:6080/arcgis/rest/services/JinBoHui/ShangHai_Parking/MapServer/4',
      type: 'feature',
      popupTemplate: {
        title: '',
        content:
          '描述：{PARK_DESC}<br/>总泊位数（大车）：{B_PARKNUM}<br/>总剩余泊位数（大车）：{B_REMAIN_PARKNUM}<br/>泊位占用率（大车）：{B_PARKRATE}<br/>预约到达率（大车）：{B_APPOINT_INRATE}'
      },
      visible: true,
      refreshInterval: 5,
      outFields: ['*'],
      renderer: {
        type: 'unique-value',
        field: 'JWPT.PARK_STATUS_VW.STATUS',
        defaultSymbol: {
          type: 'picture-marker',
          url: 'assets/mapIcons/JinBoHui/icon_P_green.png',
          width: 24,
          height: 33,
          yoffset: 17
        },
        uniqueValueInfos: [
          {
            value: 'free',
            symbol: {
              type: 'picture-marker',
              url: 'assets/mapIcons/JinBoHui/icon_P_green.png',
              width: 24,
              height: 33,
              yoffset: 17
            }
          },
          {
            value: 'crowd',
            symbol: {
              type: 'picture-marker',
              url: 'assets/mapIcons/JinBoHui/icon_P_green.png',
              width: 24,
              height: 33,
              yoffset: 17
            }
          },
          {
            value: 'jam',
            symbol: {
              type: 'picture-marker',
              url: 'assets/mapIcons/JinBoHui/icon_P_green.png',
              width: 24,
              height: 33,
              yoffset: 17
            }
          },
          {
            value: 'saturation',
            symbol: {
              type: 'picture-marker',
              url: 'assets/mapIcons/JinBoHui/icon_P_green.png',
              width: 24,
              height: 33,
              yoffset: 17
            }
          }
        ]
      }
    },
    {
      label: 'P8',
      url:
        'http://10.31.214.201:6080/arcgis/rest/services/JinBoHui/ShangHai_Parking/MapServer/6',
      type: 'feature',
      popupTemplate: {
        title: '',
        content:
          '描述：{PARK_DESC}<br/>累计进场车次（大车）：{B_STAT_INNUM}<br/>累计进场车次（小车）：{S_STAT_INMUM}<br/>预约进场率（大车）：{B_APPOINT_INRATE}%<br/>预约进场率（小车）：{S_APPOINT_INRATE}%'
      },
      visible: true,
      refreshInterval: 5,
      outFields: ['*'],
      renderer: {
        type: 'unique-value',
        field: 'JWPT.PARK_STATUS_VW.STATUS',
        defaultSymbol: {
          type: 'picture-marker',
          url: 'assets/mapIcons/JinBoHui/icon_P_green.png',
          width: 24,
          height: 33,
          yoffset: 17
        },
        uniqueValueInfos: [
          {
            value: 'free',
            symbol: {
              type: 'picture-marker',
              url: 'assets/mapIcons/JinBoHui/icon_P_green.png',
              width: 24,
              height: 33,
              yoffset: 17
            }
          },
          {
            value: 'crowd',
            symbol: {
              type: 'picture-marker',
              url: 'assets/mapIcons/JinBoHui/icon_P_green.png',
              width: 24,
              height: 33,
              yoffset: 17
            }
          },
          {
            value: 'jam',
            symbol: {
              type: 'picture-marker',
              url: 'assets/mapIcons/JinBoHui/icon_P_green.png',
              width: 24,
              height: 33,
              yoffset: 17
            }
          },
          {
            value: 'saturation',
            symbol: {
              type: 'picture-marker',
              url: 'assets/mapIcons/JinBoHui/icon_P_green.png',
              width: 24,
              height: 33,
              yoffset: 17
            }
          }
        ]
      }
    },
    {
      label: '测温点',
      url:
        'http://10.31.214.201:6080/arcgis/rest/services/JinBoHui/ShangHai_Parking/MapServer/7',
      type: 'feature',
      visible: false,
      outFields: ['*'],
      renderer: {
        type: 'simple',
        symbol: {
          type: 'picture-marker',
          url: 'assets/mapIcons/JinBoHui/icon_cewen.png',
          width: 24,
          height: 33,
          yoffset: 16
        }
      }
    }
  ],
  options: {
    center: [121.2974, 31.1956],
    scale: 18056,
    constraints: {
      rotationEnabled: false,
      minZoom: 0
    }
  }
};
