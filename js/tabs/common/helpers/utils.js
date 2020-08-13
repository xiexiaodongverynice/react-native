/**
 * @flow
 */

interface location {
  longitude: string;
  latitude: string;
}

const checkLocationDistance = (locationA: location, locationB: location, distance: number) => {
  var R = 6370996.81, //地球半径(米)
    p = null,
    j = void 0,
    Ib = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  function Jb(a) {
    var b = '',
      c,
      d,
      e = '',
      f,
      g = '',
      i = 0;
    f = /[^A-Za-z0-9\+\/\=]/g;
    if (!a || f.exec(a)) return a;
    a = a.replace(/[^A-Za-z0-9\+\/\=]/g, '');
    do
      (c = Ib.indexOf(a.charAt(i++))),
        (d = Ib.indexOf(a.charAt(i++))),
        (f = Ib.indexOf(a.charAt(i++))),
        (g = Ib.indexOf(a.charAt(i++))),
        (c = (c << 2) | (d >> 4)),
        (d = ((d & 15) << 4) | (f >> 2)),
        (e = ((f & 3) << 6) | g),
        (b += String.fromCharCode(c)),
        64 != f && (b += String.fromCharCode(d)),
        64 != g && (b += String.fromCharCode(e));
    while (i < a.length);
    return b;
  }
  function Za(a) {
    return 'string' == typeof a;
  }
  function Point(a, b) {
    isNaN(a) && ((a = Jb(a)), (a = isNaN(a) ? 0 : a));
    Za(a) && (a = parseFloat(a));
    isNaN(b) && ((b = Jb(b)), (b = isNaN(b) ? 0 : b));
    Za(b) && (b = parseFloat(b));
    this.lng = a;
    this.lat = b;
  }
  Point.prototype.mb = function(a) {
    return a && this.lat == a.lat && this.lng == a.lng;
  };
  function OD(a, b, c) {
    for (; a > c; ) a -= c - b;
    for (; a < b; ) a += c - b;
    return a;
  }
  function SD(a, b, c) {
    b != p && (a = Math.max(a, b));
    c != p && (a = Math.min(a, c));
    return a;
  }
  function Tk(a) {
    return (Math.PI * a) / 180;
  }
  function Pe(a, b, c, d) {
    return R * Math.acos(Math.sin(c) * Math.sin(d) + Math.cos(c) * Math.cos(d) * Math.cos(b - a));
  }
  function Vo(a, b) {
    if (!a || !b) return 0;
    a.lng = OD(a.lng, -180, 180);
    a.lat = SD(a.lat, -74, 74);
    b.lng = OD(b.lng, -180, 180);
    b.lat = SD(b.lat, -74, 74);
    return Pe(Tk(a.lng), Tk(b.lng), Tk(a.lat), Tk(b.lat));
  }
  function getDistance(a, b) {
    if (a && b) {
      if (a.mb(b)) return 0;
      var c;
      c = Vo(a, b);
      if (c === p || c === j) c = 0;
      return c;
    }
  }

  //使用并保留小数点后两位
  var p1 = new Point(parseFloat(locationA.longitude), parseFloat(locationA.latitude));
  var p2 = new Point(parseFloat(locationB.longitude), parseFloat(locationB.latitude));
  var m = getDistance(p1, p2).toFixed(2);
  //获取到的单位是 米
  console.log('m===>', m);
  return parseInt(m);
};

export { checkLocationDistance };
