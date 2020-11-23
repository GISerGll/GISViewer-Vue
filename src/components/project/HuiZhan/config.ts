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
  ],
  options: {
    camera: {
      position: [121.58122964821716, 31.09996523429159, 9630],
      heading: 0,
      tilt: 50,
    },
  },
};
