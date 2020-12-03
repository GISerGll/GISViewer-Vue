let EARTH_RADIUS = 6371.0; //km 地球半径 平均值，千米
/// <summary>
/// 给定的经度1，纬度1；经度2，纬度2. 计算2个经纬度之间的距离。
/// </summary>
/// <param name="lat1">经度1</param>
/// <param name="lon1">纬度1</param>
/// <param name="lat2">经度2</param>
/// <param name="lon2">纬度2</param>
/// <param name="time">时间(单位毫秒)</param>
/// <returns>距离（公里、千米）</returns>
export function GetSpeed(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  time: number
) {
  //用haversine公式计算球面两点间的距离。
  //经纬度转换成弧度
  lat1 = ConvertDegreesToRadians(lat1);
  lon1 = ConvertDegreesToRadians(lon1);
  lat2 = ConvertDegreesToRadians(lat2);
  lon2 = ConvertDegreesToRadians(lon2);

  //差值
  let vLon = Math.abs(lon1 - lon2);
  let vLat = Math.abs(lat1 - lat2);

  //h is the great circle distance in radians, great circle就是一个球体上的切面，它的圆心即是球心的一个周长最大的圆。
  let h = HaverSin(vLat) + Math.cos(lat1) * Math.cos(lat2) * HaverSin(vLon);

  let distance = 2 * EARTH_RADIUS * Math.asin(Math.sqrt(h));

  time = time / (1000 * 3600);
  return Number(distance / time).toFixed(1);
}
/// <summary>
/// 给定的经度1，纬度1；经度2，纬度2. 计算2个经纬度之间的距离。
/// </summary>
/// <param name="lat1">经度1</param>
/// <param name="lon1">纬度1</param>
/// <param name="lat2">经度2</param>
/// <param name="lon2">纬度2</param>
/// <returns>距离（公里、千米）</returns>
export function GetDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  //用haversine公式计算球面两点间的距离。
  //经纬度转换成弧度
  lat1 = ConvertDegreesToRadians(lat1);
  lon1 = ConvertDegreesToRadians(lon1);
  lat2 = ConvertDegreesToRadians(lat2);
  lon2 = ConvertDegreesToRadians(lon2);

  //差值
  let vLon = Math.abs(lon1 - lon2);
  let vLat = Math.abs(lat1 - lat2);

  //h is the great circle distance in radians, great circle就是一个球体上的切面，它的圆心即是球心的一个周长最大的圆。
  let h = HaverSin(vLat) + Math.cos(lat1) * Math.cos(lat2) * HaverSin(vLon);

  let distance = 2 * EARTH_RADIUS * Math.asin(Math.sqrt(h));

  return distance;
}

/// <summary>
/// 将角度换算为弧度。
/// </summary>
/// <param name="degrees">角度</param>
/// <returns>弧度</returns>
function ConvertDegreesToRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}
function ConvertRadiansToDegrees(radian: number) {
  return (radian * 180.0) / Math.PI;
}
function HaverSin(theta: number) {
  let s = Math.sin(theta / 2);
  return s * s;
}
