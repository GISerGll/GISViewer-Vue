export let GisConfig = {
  arcgis_api: 'http://localhost:8090/arcgis_js_api/library/4.14',
  theme: 'custom', //dark,vec
  baseLayers: [
    {
      label: '深色底图',
      type: 'tiled',
      url: 'https://10.31.214.248/server/rest/services/bj_xxb/MapServer',
      visible: true
    },
    {
      label: '标线',
      url: 'https://10.31.214.248/server/rest/services/bx/MapServer',
      type: 'tiled',
      visible: true
    }
  ],
  operationallayers: [
    {
      label: '路网状况',
      type: 'dynamic',
      url:
        'http://10.31.214.201:6080/arcgis/rest/services/YJZH/KuaiSuLu_fbd/MapServer',
      refreshInterval: 1,
      visible: true,
      outFields: ['*'],
      popupTemplates: {
        '0': {
          title: '',
          content: '{FSTR_DESC}'
        },
        '1': {
          title: '',
          content: '{FSTR_DESC}'
        },
        '2': {
          title: '',
          content: '{FSTR_DESC}'
        },
        '3': {
          title: '',
          content: '{FSTR_DESC}'
        }
      }
    },
    {
      label: '发布段指数',
      type: 'dynamic',
      url:
        'http://10.31.214.201:6080/arcgis/rest/services/YJZH/ShangHai_fbdindex/MapServer',
      refreshInterval: 1,
      visible: false,
      outFields: ['*']
    },
    {
      label: '交通事故',
      type: 'feature',
      url:
        'http://10.31.214.201:6080/arcgis/rest/services/YJZH/ShangHai_event/MapServer/0',
      refreshInterval: 1,
      visible: false,
      outFields: ['*'],
      popupTemplate: {
        title: '',
        content: '{YJZH.EVENT.DEVICEDESC}'
      },
      renderer: {
        type: 'simple', // autocasts as new SimpleRenderer()
        symbol: {
          type: 'picture-marker',
          url: 'assets/mapIcons/event.svg',
          width: 33,
          height: 33
        }
      }
    },
    {
      label: '市内水运',
      url:
        'http://10.31.214.201:6080/arcgis/rest/services/YJZH/ShangHai_ferryroutes/MapServer',
      type: 'dynamic',
      visible: false,
      popupTemplates: {
        '0': {
          title: '',
          content: '{FEATURENAM}'
        },
        '1': {
          title: '',
          content: '{FEATURENAM}'
        },
        '2': {
          title: '',
          content: '{FSTR_DESC}'
        },
        '3': {
          title: '',
          content: '{FSTR_DESC}'
        },
        '5': {
          title: '',
          content: '{FSTR_DESC}'
        },
        '6': {
          title: '',
          content: '{FSTR_DESC}'
        }
      }
    },
    {
      label: '机场',
      url:
        'http://10.31.214.201:6080/arcgis/rest/services/YJZH/ShangHai_Airport/MapServer',
      type: 'dynamic',
      visible: false
    },
    {
      label: '铁路客运',
      url:
        'http://10.31.214.201:6080/arcgis/rest/services/YJZH/ShangHai_Railway/MapServer',
      type: 'dynamic',
      visible: false
    },
    /*设备*/
    {
      label: '快速路摄像机',
      url: 'https://10.31.214.248/server/rest/services/sssb_dpt/MapServer/1',
      type: 'feature',
      outFields: ['*'],
      visible: false,
      popupTemplate: {
        title: '',
        content: '路名:{ROADNAME}<br/>描述:{位置}<br/>类型:{图层名}'
      }
    },
    {
      label: '快速路摄像机',
      url: 'https://10.31.214.248/server/rest/services/sssb_dpt/MapServer/2',
      type: 'feature',
      outFields: ['*'],
      visible: false,
      popupTemplate: {
        title: '',
        content: '路名:{ROADNAME}<br/>描述:{位置}<br/>类型:{图层名}'
      }
    },
    {
      label: '快速路摄像机',
      url: 'https://10.31.214.248/server/rest/services/sssb_dpt/MapServer/3',
      type: 'feature',
      outFields: ['*'],
      visible: false,
      popupTemplate: {
        title: '',
        content: '路名:{ROADNAME}<br/>描述:{位置}<br/>类型:{图层名}'
      }
    },
    {
      label: '快速路摄像机',
      url: 'https://10.31.214.248/server/rest/services/sssb_dpt/MapServer/4',
      type: 'feature',
      outFields: ['*'],
      visible: false,
      popupTemplate: {
        title: '',
        content: '路名:{ROADNAME}<br/>描述:{位置}<br/>类型:{图层名}'
      }
    },
    {
      label: '高速公路摄像机',
      url: 'https://10.31.214.248/server/rest/services/sssb_dpt/MapServer/6',
      type: 'feature',
      outFields: ['*'],
      visible: false,
      popupTemplate: {
        title: '',
        content: '路名:{ROADNAME}<br/>描述:{位置}<br/>类型:{图层名}'
      }
    },
    {
      label: '高速公路摄像机',
      url: 'https://10.31.214.248/server/rest/services/sssb_dpt/MapServer/7',
      type: 'feature',
      outFields: ['*'],
      visible: false,
      popupTemplate: {
        title: '',
        content: '路名:{ROADNAME}<br/>描述:{位置}<br/>类型:{图层名}'
      }
    },
    {
      label: '高速公路摄像机',
      url: 'https://10.31.214.248/server/rest/services/sssb_dpt/MapServer/8',
      type: 'feature',
      outFields: ['*'],
      visible: false,
      popupTemplate: {
        title: '',
        content: '路名:{ROADNAME}<br/>描述:{位置}<br/>类型:{图层名}'
      }
    },
    {
      label: '高速公路摄像机',
      url: 'https://10.31.214.248/server/rest/services/sssb_dpt/MapServer/9',
      type: 'feature',
      outFields: ['*'],
      visible: false,
      popupTemplate: {
        title: '',
        content: '路名:{ROADNAME}<br/>描述:{位置}<br/>类型:{图层名}'
      }
    },
    {
      label: '高速公路摄像机',
      url: 'https://10.31.214.248/server/rest/services/sssb_dpt/MapServer/10',
      type: 'feature',
      outFields: ['*'],
      visible: false,
      popupTemplate: {
        title: '',
        content: '路名:{ROADNAME}<br/>描述:{位置}<br/>类型:{图层名}'
      }
    },
    {
      label: '主线情报板',
      url: 'https://10.31.214.248/server/rest/services/sssb_dpt/MapServer/12',
      type: 'feature',
      outFields: ['*'],
      visible: false,
      popupTemplate: {title: '', content: '路名:{ROADNAME}<br/>描述:{DES}'}
    },
    {
      label: '主线情报板',
      url: 'https://10.31.214.248/server/rest/services/sssb_dpt/MapServer/13',
      type: 'feature',
      outFields: ['*'],
      visible: false,
      popupTemplate: {title: '', content: '路名:{ROADNAME}<br/>描述:{DES}'}
    },
    {
      label: '匝道情报板',
      url: 'https://10.31.214.248/server/rest/services/sssb_dpt/MapServer/14',
      type: 'feature',
      outFields: ['*'],
      visible: false,
      popupTemplate: {title: '', content: '路名:{ROADNAME}<br/>描述:{DES}'}
    },
    {
      label: '高速情报板',
      url: 'https://10.31.214.248/server/rest/services/sssb_dpt/MapServer/15',
      type: 'feature',
      outFields: ['*'],
      visible: false,
      popupTemplate: {title: '', content: '路名:{ROADNAME}<br/>描述:{DES}'}
    },
    {
      label: '高速收费站',
      url: 'https://10.31.214.248/server/rest/services/sssb_dpt/MapServer/17',
      type: 'feature',
      outFields: ['*'],
      visible: false,
      popupTemplate: {title: '', content: '名称:{NAME}'}
    },
    {
      label: '高速收费站',
      url: 'https://10.31.214.248/server/rest/services/sssb_dpt/MapServer/18',
      type: 'feature',
      outFields: ['*'],
      visible: false,
      popupTemplate: {title: '', content: '名称:{NAME}'}
    },
    {
      label: '高速收费站',
      url: 'https://10.31.214.248/server/rest/services/sssb_dpt/MapServer/19',
      type: 'feature',
      outFields: ['*'],
      visible: false,
      popupTemplate: {title: '', content: '名称:{NAME}'}
    },
    {
      label: '高速收费站',
      url: 'https://10.31.214.248/server/rest/services/sssb_dpt/MapServer/20',
      type: 'feature',
      outFields: ['*'],
      visible: false,
      popupTemplate: {title: '', content: '名称:{NAME}'}
    },
    {
      label: '高速收费站',
      url: 'https://10.31.214.248/server/rest/services/sssb_dpt/MapServer/21',
      type: 'feature',
      outFields: ['*'],
      visible: false,
      popupTemplate: {title: '', content: '名称:{NAME}'}
    },
    {
      label: '匝道通行灯',
      url: 'https://10.31.214.248/server/rest/services/sssb_dpt/MapServer/26',
      type: 'feature',
      outFields: ['*'],
      visible: false,
      popupTemplate: {
        title: '',
        content: '路名:{ROADNAME}<br/>描述:{DES}<br/>类型:{DEVTYPE}'
      }
    },
    {
      label: '匝道通行灯',
      url: 'https://10.31.214.248/server/rest/services/sssb_dpt/MapServer/27',
      type: 'feature',
      outFields: ['*'],
      visible: false,
      popupTemplate: {
        title: '',
        content: '路名:{ROADNAME}<br/>描述:{DES}<br/>类型:{DEVTYPE}'
      }
    },
    {
      label: '匝道通行灯',
      url: 'https://10.31.214.248/server/rest/services/sssb_dpt/MapServer/28',
      type: 'feature',
      outFields: ['*'],
      visible: false,
      popupTemplate: {
        title: '',
        content: '路名:{ROADNAME}<br/>描述:{DES}<br/>类型:{DEVTYPE}'
      }
    },
    {
      label: '匝道通行灯',
      url: 'https://10.31.214.248/server/rest/services/sssb_dpt/MapServer/29',
      type: 'feature',
      outFields: ['*'],
      visible: false,
      popupTemplate: {
        title: '',
        content: '路名:{ROADNAME}<br/>描述:{DES}<br/>类型:{DEVTYPE}'
      }
    },
    {
      label: '匝道通行灯',
      url: 'https://10.31.214.248/server/rest/services/sssb_dpt/MapServer/30',
      type: 'feature',
      outFields: ['*'],
      visible: false,
      popupTemplate: {
        title: '',
        content: '路名:{ROADNAME}<br/>描述:{DES}<br/>类型:{DEVTYPE}'
      }
    },
    {
      label: '匝道通行灯',
      url: 'https://10.31.214.248/server/rest/services/sssb_dpt/MapServer/31',
      type: 'feature',
      outFields: ['*'],
      visible: false,
      popupTemplate: {
        title: '',
        content: '路名:{ROADNAME}<br/>描述:{DES}<br/>类型:{DEVTYPE}'
      }
    },
    {
      label: '匝道通行灯',
      url: 'https://10.31.214.248/server/rest/services/sssb_dpt/MapServer/32',
      type: 'feature',
      outFields: ['*'],
      visible: false,
      popupTemplate: {
        title: '',
        content: '路名:{ROADNAME}<br/>描述:{DES}<br/>类型:{DEVTYPE}'
      }
    },
    /*设备*/
    {
      label: '摄像机',
      url: 'https://10.31.214.248/server/rest/services/sssb_dpt/MapServer',
      type: 'dynamic',
      visible: false,
      popupTemplates: {
        '1': {
          title: '',
          content: '路名:{ROADNAME}<br/>描述:{位置}<br/>类型:{图层名}'
        },
        '2': {
          title: '',
          content: '路名:{ROADNAME}<br/>描述:{位置}<br/>类型:{图层名}'
        },
        '3': {
          title: '',
          content: '路名:{ROADNAME}<br/>描述:{位置}<br/>类型:{图层名}'
        },
        '4': {
          title: '',
          content: '路名:{ROADNAME}<br/>描述:{位置}<br/>类型:{图层名}'
        },
        '6': {
          title: '',
          content: '路名:{ROADNAME}<br/>描述:{位置}<br/>类型:{图层名}'
        },
        '7': {
          title: '',
          content: '路名:{ROADNAME}<br/>描述:{位置}<br/>类型:{图层名}'
        },
        '8': {
          title: '',
          content: '路名:{ROADNAME}<br/>描述:{位置}<br/>类型:{图层名}'
        },
        '9': {
          title: '',
          content: '路名:{ROADNAME}<br/>描述:{位置}<br/>类型:{图层名}'
        },
        '10': {
          title: '',
          content: '路名:{ROADNAME}<br/>描述:{位置}<br/>类型:{图层名}'
        },
        '12': {
          title: '',
          content: '路名:{ROADNAME}<br/>描述:{DES}'
        },
        '13': {
          title: '',
          content: '路名:{ROADNAME}<br/>描述:{DES}'
        },
        '14': {
          title: '',
          content: '路名:{ROADNAME}<br/>描述:{DES}'
        },
        '15': {
          title: '',
          content: '路名:{ROADNAME}<br/>描述:{DES}'
        },
        '17': {
          title: '',
          content: '名称:{NAME}'
        },
        '18': {
          title: '',
          content: '名称:{NAME}'
        },
        '19': {
          title: '',
          content: '名称:{NAME}'
        },
        '20': {
          title: '',
          content: '名称:{NAME}'
        },
        '21': {
          title: '',
          content: '名称:{NAME}'
        },
        '26': {
          title: '',
          content: '路名:{ROADNAME}<br/>描述:{DES}<br/>类型:{DEVTYPE}'
        },
        '27': {
          title: '',
          content: '路名:{ROADNAME}<br/>描述:{DES}<br/>类型:{DEVTYPE}'
        },
        '28': {
          title: '',
          content: '路名:{ROADNAME}<br/>描述:{DES}<br/>类型:{DEVTYPE}'
        },
        '29': {
          title: '',
          content: '路名:{ROADNAME}<br/>描述:{DES}<br/>类型:{DEVTYPE}'
        },
        '30': {
          title: '',
          content: '路名:{ROADNAME}<br/>描述:{DES}<br/>类型:{DEVTYPE}'
        },
        '31': {
          title: '',
          content: '路名:{ROADNAME}<br/>描述:{DES}<br/>类型:{DEVTYPE}'
        },
        '32': {
          title: '',
          content: '路名:{ROADNAME}<br/>描述:{DES}<br/>类型:{DEVTYPE}'
        }
      }
    }
  ],
  options: {
    //for arcgis-2d
    center: [0, 0],
    zoom: 2,
    //viewMode: '3D',
    constraints: {
      //minZoom: 3
    }
  }
};
