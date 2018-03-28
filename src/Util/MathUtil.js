define(function () {


    /**
    *数学工具类
    *@memberof Cesium
    *@constructor
    */
    function MathUtil() { }

    /**
    *
    * 判断给定对象是否为数组
    *@param {Object|*}obj
    */
    MathUtil.isArray = function (obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }

    /**
    * 计算最大值
    * @function MathUtil.getMinMax
    * @param {Array.<Number>} arr 数组
    * @param {Number}invalidValue 无效值
    * @returns {Number}
    */
    MathUtil.getMinMax = function (arr, invalidValue) {
        //    if (!MathUtil.isArray(arr)) {
        //        throw new Error("参数不是数组");
        //    }
        var hasInvalidValueParams = typeof invalidValue !== 'undefined' && invalidValue != null;
        var min = Number.MAX_VALUE, max = -Number.MAX_VALUE;
        for (var i = 0; i < arr.length; i++) {
            if (!MathUtil.isArray(arr[i]) && !arr[i].length
                && (isNaN(arr[i]) || (hasInvalidValueParams && invalidValue == arr[i]))) {
                continue;
            }
            if (arr[i] instanceof Array || MathUtil.isArray(arr[i]) || arr[i].length) {
                var minMax = MathUtil.getMinMax(arr[i], invalidValue);
                min = Math.min(minMax[0], min);
                max = Math.max(minMax[1], max);
            } else {
                var v=parseFloat( arr[i])+0.0000001;
                min = Math.min(arr[i], min);
                if (v-max>0) {
                    max = v;
                }
               // max = Math.max(v, max);
            }
        }
        return [min, max];
    }


    /**
    *地球半径
    *@Object MathUtil.EARTH_RADIUS
    */
    MathUtil.EARTH_RADIUS = 6378.137; //地球半径
    /**
    *角度转弧度
    *@param {Number} d
    */
    MathUtil.rad = function (d) {
        return d * Math.PI / 180.0;
    }
    /**
    * 计算距离
    * @param {Array.<Number>} arr 数组
    * @returns {Number}
    */
    MathUtil.getDistance = function (lat1, lng1, lat2, lng2) {
        var radLat1 = MathUtil.rad(lat1);
        var radLat2 = MathUtil.rad(lat2);
        var a = radLat1 - radLat2;
        var b = MathUtil.rad(lng1) - MathUtil.rad(lng2);

        var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
        Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
        s = s * MathUtil.EARTH_RADIUS;
        s = Math.round(s * 10000) / 10000;
        return s;
    }
    /**
    * 计算距离
    * @param {Array.<Number>} arr 数组
    * @returns {Number}
    */
    MathUtil.computeLength = function (Points_lc) {
        var len = 0;
        for (var i = 1; i < Points_lc.length; i++) {
            var p1 = Points_lc[i - 1], p2 = Points_lc[i];
            len += MathUtil.getDistance(p1.lat, p1.lon, p2.lat, p2.lon);
        }
        return len;
    }
    /**
    * 计算距离
    * @param {Array.<Number>} arr 数组
    * @returns {Number}
    */
    MathUtil.computeLength2 = function (Points_lc) {
        var len = 0;
        for (var i = 1; i < Points_lc.length; i++) {
            var p1 = Points_lc[i - 1], p2 = Points_lc[i];
            len += Cesium.Cartesian3.distance(p1, p2);
        }
        return len;
    }

    /**
    * 计算平均值
    * @param {Array.<Number>} arr 数组
    * @returns {Number}
    */
    MathUtil.avrage = function (arr) {
        /// <summary>计算平均值</summary>
        /// <param name="arr" type="Array">数组</param>

        var ret = 0;
        for (var i = 0; i < arr.length; i++) {
            ret += arr[i];
        }
        ret = ret / arr.length;
        return ret;
    }

    /**
    * 计算标准差
    * @param {Array.<Number>} arr 数组
    * @returns {Number}
    */
    MathUtil.standardDeviation = function (arr) {
        /// <summary>计算标准差</summary>
        /// <param name="arr" type="Array">数组</param>

        var u = MathUtil.avrage(arr);
        var ret = 0;
        for (var i = 0; i < arr.length; i++) {
            ret += (arr[i] - u) * (arr[i] - u);
        }
        ret = ret / arr.length;
        ret = Math.sqrt(ret);
        return ret;
    }

    /**
    *风场u、v分量转为风速大小（spr）和方向（dir）
    *@param {Number}u
    *@param {Number}v
    *@param {Array<Number>}outWin
    */
    MathUtil.uv2wind = function uv2wind(u, v, outWin) {

        var spd = Math.sqrt(u * u + v * v)
        var tmp = 0.0 - Math.atan2(v, u) * 180.0 / Map.PI
        var dir = tmp % 360.0;
        outWin[0] = spd;
        outWin[1] = dir;
    }

    /**
   *风速大小（spr）和方向（dir）转为风场u、v分量
   *@param {Number}spd
   *@param {Number}dir
   *@param {Array<Number>}outUV
   */
    MathUtil.wind2uv = function wind2uv(spd, dir, outUV) {
        var tmp = (0.0 - dir) * Math.PI / 180.0;
        outUV[0] = spd * Math.cos(tmp);
        outUV[1] = spd * Math.sin(tmp);
    }
    return MathUtil;
})