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
      label: "H51F010012建筑",
      type: "scene",
      portalItem: {
        id: "605e1e69a82e4e129fdb271ac16d0a20",
      },
    },
    {
      label: "H51F010013建筑",
      type: "scene",
      portalItem: {
        id: "993738a7f5d544129b159a245c96c4db",
      },
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
      position: [121.58122964821716, 31.09996523429159, 9630],
      heading: 0,
      tilt: 50,
    },
    environment: {
      lighting: {
        waterReflectionEnabled: true,
        directShadowsEnabled: true,
      },
    },
  },
};
