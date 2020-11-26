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
      label: "建筑1",
      type: "scene",
      portalItem: {
        id: "8cc268198dc94d529b74b77f8b9623ec",
      },
    },
    {
      label: "建筑2",
      type: "scene",
      portalItem: {
        id: "5d50a53a2c60448b92beb6ea1d3d56dc",
      },
    },
    {
      label: "地标建筑",
      type: "scene",
      portalItem: {
        id: "3f695f7934964eb3b0942f853b048868",
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
