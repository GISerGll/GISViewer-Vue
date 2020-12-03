export let GisConfig = {
  arcgis_api: "http://localhost:8090/arcgis_js_api_4",
  theme: "dark", //dark,vec
  baseLayers: [
    {
      label: "深色",
      type: "tiled",
      url:
        "https://map.geoq.cn/arcgis/rest/services/ChinaOnlineStreetPurplishBlue/MapServer",
      visible: true,
    },
  ],
  operationallayers: [
    {
      label: "H51F009012",
      type: "scene",
      portalItem: {
        id: "0c5e9fc361d641b593a45b57689416ef",
      },
      definitionExpression: "Height >= 10",
    },
    {
      label: "H51F010013建筑",
      type: "scene",
      portalItem: {
        id: "1b64c2ad1a9a400c9235ff300a3c3509",
      },
      definitionExpression: "Height >= 10",
    },
    {
      label: "H51F010011建筑",
      type: "scene",
      portalItem: {
        id: "22d238e891fa471ca116a36bd18e2a33",
      },
      definitionExpression: "Height >= 10",
    },
    {
      label: "H51F010012建筑",
      type: "scene",
      portalItem: {
        id: "605e1e69a82e4e129fdb271ac16d0a20",
      },
      definitionExpression: "Height >= 10",
    },
    {
      label: "H51F010013建筑",
      type: "scene",
      portalItem: {
        id: "993738a7f5d544129b159a245c96c4db",
      },
      definitionExpression: "Height >= 10",
    },
    {
      label: "H51F011011",
      type: "scene",
      portalItem: {
        id: "a366bd80fb454a0d9936ee9821dbd3aa",
      },
      definitionExpression: "Height >= 10",
    },
    {
      label: "H51F011012建筑",
      type: "scene",
      portalItem: {
        id: "359cd7a797144524b52254db366fc2cf",
      },
      definitionExpression: "Height >= 10",
    },
    {
      label: "地标建筑",
      type: "scene",
      portalItem: {
        id: "9730604ddbf945f78072d29f42eff070",
      },
    },
    {
      label: "水域",
      type: "feature",
      url:
        "https://services7.arcgis.com/fSYMnKC69N1CiYKt/arcgis/rest/services/ShangHai_Water_Polygon/FeatureServer",
      renderer: {
        type: "simple",
        symbol: {
          type: "polygon-3d",
          symbolLayers: [
            {
              type: "water",
              waveDirection: 260,
              color: "#25427c",
              waveStrength: "moderate",
              waterbodySize: "medium",
            },
          ],
        },
      },
    },
  ],
  options: {
    camera: {
      position: [110.425657, 24.397402, 20000000],
      heading: 0,
      tilt: 0,
    },
    environment: {
      lighting: {
        waterReflectionEnabled: true,
        directShadowsEnabled: true,
      },
    },
  },
  viewAnimation: [
    {
      target: {
        position: [121.440468, 31.167411, 4200],
        heading: 38,
        tilt: 65,
      },
      option: {
        duration: 8000,
      },
    },
    {
      target: {
        position: [121.41638, 31.090727, 7600],
        heading: 0,
        tilt: 45,
      },
      option: {
        duration: 4000,
      },
    },
  ],
};
