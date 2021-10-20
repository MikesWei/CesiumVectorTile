(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.CesiumVectorTile = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
function LonLatProjection(width, height) {
    var imageSize = { width: width, height: height };
    function getBoundingRect(regions) {
        var LIMIT = Number.MAX_VALUE
        var min, max
        var boundingRect = { xMin: LIMIT, yMin: LIMIT, xMax: -LIMIT, yMax: -LIMIT }

        for (var i = 0, L = regions.length; i < L; i++) {
            var rect = regions[i].getBoundingRect()

            min = { x: rect.xMin, y: rect.yMin };
            max = { x: rect.xMax, y: rect.yMax }

            boundingRect.xMin = boundingRect.xMin < min.x ? boundingRect.xMin : min.x
            boundingRect.yMin = boundingRect.yMin < min.y ? boundingRect.yMin : min.y
            boundingRect.xMax = boundingRect.xMax > max.x ? boundingRect.xMax : max.x
            boundingRect.yMax = boundingRect.yMax > max.y ? boundingRect.yMax : max.y
        }

        return boundingRect
    }

    function project(coordinate, boundingRect) {
        var width = boundingRect.xMax - boundingRect.xMin;
        var height = boundingRect.yMin - boundingRect.yMax;
        var distanceX = Math.abs(coordinate[0] - boundingRect.xMin);
        var distanceY = coordinate[1] - boundingRect.yMax;

        var percentX = (distanceX / width);
        var percentY = (distanceY / height);

        var px = percentX * imageSize.width,
            py = percentY * imageSize.height;
        return { x: px, y: py };
    }

    function unproject(pt, boundingRect) {
        var width = boundingRect.xMax - boundingRect.xMin;
        var height = boundingRect.yMin - boundingRect.yMax;
        var lon = (pt.x / imageSize.width) * width,
            lat = (pt.y / imageSize.height) * height;
        return [lon, lat];
    }

    this.project = project;
    this.unproject = unproject;
    this.getBoundingRect = getBoundingRect;
}

module.exports = LonLatProjection;
},{}],2:[function(require,module,exports){

var shp = require('shpjs/lib/index.js');
var when = require('when');
var readAsArrayBuffer = require('./utils/readAsArrayBuffer');
var readAsText = require('./utils/readAsText');
var Path = require('./utils/Path');

shp.groupFiles = function (files) {
    var group = {};
    for (var i = 0; i < files.length; i++) {
        var name = Path.ChangeExtension(files[i].name, "");
        if (!group[name]) {
            group[name] = [];
        }
        group[name].push(files[i]);
    }
    return group;
}

shp.parseShpFiles = function (files, encoding) {
    if (!files || files.length > 0) {
        var df = when.defer();
        var promise = df.promise;
        var shpFile, dbfFile, prjFile;
        for (var i = 0; i < files.length; i++) {
            if (files[i].name.toLocaleLowerCase().indexOf(".shp") > 0) {
                shpFile = files[i];
            }
            if (files[i].name.toLocaleLowerCase().indexOf(".prj") > 0) {
                prjFile = files[i];
            }
            if (files[i].name.toLocaleLowerCase().indexOf(".dbf") > 0) {
                dbfFile = files[i];
            }
        }
        if (!shpFile || !prjFile || !dbfFile) {
            // throw new Error("打开文件失败,请通过ctrl+同时选择shp、prj、dbf三个文件");
            df.reject(new Error("打开文件失败,请通过ctrl+同时选择shp、prj、dbf三个文件"));
            return promise;
        }
        readAsArrayBuffer(shpFile).then(function (shpBuffer) {
            readAsText(prjFile).then(function (prjBuffer) {
                readAsArrayBuffer(dbfFile).then(function (dbfBuffer) {
                    var parsed = shp.combine([shp.parseShp(shpBuffer, prjBuffer), shp.parseDbf(dbfBuffer, encoding)]);
                    parsed.fileName = shpFile.name.toLocaleLowerCase();

                    df.resolve(parsed);
                }).otherwise(function (err) {
                    df.reject(err);
                })
            }).otherwise(function (err) {
                df.reject(err);
            })
        }).otherwise(function (err) {
            df.reject(err);
        })
  
        return promise;
    } else {
        throw new Error("文件列表不能为空");
    }
}

module.exports = shp;
},{"./utils/Path":64,"./utils/readAsArrayBuffer":67,"./utils/readAsText":68,"shpjs/lib/index.js":undefined,"when":undefined}],3:[function(require,module,exports){
var defaultValue = require('./cesium/Core/defaultValue');
var defined = require('./cesium/Core/defined');
var when = require('when');

function getColor(color) {
    if (typeof Cesium != 'undefined') {
        if (typeof color == 'string') {
            color = Cesium.Color.fromCssColorString(color);
        } else if (Array. isArray(color)) {
            color = Cesium.Color.fromBytes(color[0], color[1], color[2], color[3]);
        }
    }
    else if (Array.isArray(color)) {
        color = 'rgba(' + [color[0], color[1], color[2], defaultValue(color[3], 0) / 255].join(',') + ')';
    }
    return color
}

/**
 *
 *@param {Object} options
 *@param {Cesium.Color|String}[options.outlineColor=Cesium.Color.YELLOW] 线或边颜色，仅线、面数据有效。
 *@param {Cesium.Color|String}[options.fillColor=Cesium.Color.fromBytes(0, 255, 255, 30)] 填充颜色，仅面数据有效。
 *@param {Cesium.Color|String}[options.backgroundColor] 背景色
 *@param {Number}[options.lineWidth=1.5] 线宽，仅线数据有效。
 *@param {Boolean}[options.outline=true] 是否显示边，仅面数据有效。
 *@param {Boolean}[options.fill=true] 是否填充，仅面数据有效。
 *@param {Cesium.Color|String}[options.fontColor=Cesium.Color.BLACK] 注记文本颜色
 *@param {Number}[options.fontSize=16] 注记文本字体大小，仅在数据有点时有效。
 *@param {String}[options.fontFamily="宋体"] 注记文本字体名称，仅在数据有点时有效。
 *@param {Boolean}[options.labelStroke] 是否显示注记文本轮廓线，仅在数据有点时有效。
 *@param {String}[options.labelStrokeWidth=1] 注记文本轮廓线宽，仅在数据有点时有效。
 *@param {Cesium.Color|String}[options.labelStrokeColor] 注记文本轮廓线颜色，仅在数据有点时有效。
 * 
 *@param {Number}[options.pointSize=4] 注记点大小，仅在数据有点时有效。
 *@param {Cesium.Color|String}[options.pointColor=Cesium.Color.YELLOW] 注记点颜色，仅在数据有点时有效。
 *@param {String}[options.labelPropertyName='NAME'] 注记文本属性名称，仅在数据有点时有效。
 *@param {String}[options.makerImage=undefined] 注记点图标，如果设置点图标，则其他点样式参数无效，仅在数据有点时有效。
 *@param {Number}[options.ringRadius=2] 注记点样式为Ring时，圆心点大小（半径），仅在数据有点时有效。
 *@param {String}[options.pointStyle='Ring'] 注记点样式，仅在数据有点时有效。'Solid'为实心圆,'Ring'为带圆心的圆形,'Circle'为空心圆
 *@param {Number}[options.circleLineWidth=2] 注记点样式为Circle时，圆形线宽
 *@param {Boolean}[options.showMarker=true] 是否显示注记点，仅在数据有点时有效。
 *@param {Boolean}[options.showLabel=true] 是否显示文本，仅在数据有点时有效。
 *@param {Boolean}[options.showCenterLabel=true] 是否显示文本，仅对线和面数据有效。
 *@param {String}[options.centerLabelPropertyName] 几何中心注记文本属性名称，仅对线和面数据有效。
 *@param {Number}[options.labelOffsetX=10] 标注文本x方向偏移量，仅在数据有点时有效。以屏幕为参考，左上角为0，向右为正，单位为像素
 *@param {Number}[options.labelOffsetY=5] 标注文本y方向偏移量，仅在数据有点时有效。以屏幕为参考，左上角为0，向下为正，单位为像素 
 *@param {Array.<Number>}[options.lineDash=undefined] 虚线样式，不设置则为实线
 *@param {String}[options.lineCap="butt"] 设置线条末端线帽的样式。 butt——默认。向线条的每个末端添加平直的边缘；round——向线条的每个末端添加圆形线帽；square——向线条的每个末端添加正方形线帽。
 *@param {String}[options.shadowColor=undefined] 设置用于阴影的颜色
 *@param {Number}[options.shadowBlur=undefined] 设置用于阴影的模糊级别
 *@param {Number}[options.shadowOffsetX=undefined] 设置阴影距形状的水平距离
 *@param {Number}[options.shadowOffsetY=undefined] 设置阴影距形状的垂直距离
 *@param {String}[options.lineJoin="miter"] 设置当两条线交汇时所创建边角的类型。bevel——斜角；round——创建圆角；miter——默认。创建尖角。
 *@param {Number}[options.miterLimit=10] 设置最大斜接长度。
 *@memberof Cesium
 *@constructor 
 */
function VectorStyle(options) {
    //*@param {Number}[options.lineOffset=undefined] 双线样式参数，两线间距，单位为米(m)。不设置则为单线

    if (typeof document == 'undefined') {
        return options;
    }
    options = defaultValue(options, {});
    this.fillColor = defaultValue(getColor(options.fillColor), getColor([0, 255, 255, 30]));

    this.fill = defaultValue(options.fill, true);

    this.labelStroke = options.labelStroke;
    this.labelStrokeWidth = defaultValue(options.labelStrokeWidth, 1);
    this.labelStrokeColor = defaultValue(getColor(options.labelStrokeColor), getColor([160, 99, 57]));

    //线样式
    this.outlineColor = defaultValue(getColor(options.outlineColor), getColor('yellow'));

    this.backgroundColor = getColor(options.backgroundColor);

    this.lineWidth = defaultValue(options.lineWidth, 1.5);
    this.outline = defaultValue(options.outline, true);

    //注记样式
    this.fontColor = getColor(defaultValue(options.fontColor, 'black'));


    this.fontSize = defaultValue(options.fontSize, 16);
    this.fontFamily = defaultValue(options.fontFamily, "宋体");
    this.pointSize = defaultValue(options.pointSize, 4);
    this.pointColor = getColor(defaultValue(options.pointColor, 'yellow'));

    this.pointStyle = defaultValue(options.pointStyle, 'Ring');//'Solid','Ring','Circle'
    this.labelPropertyName = defaultValue(options.labelPropertyName, 'NAME');
    this.ringRadius = defaultValue(options.ringRadius, 2);
    this.circleLineWidth = defaultValue(options.circleLineWidth, 2);
    if (defined(options.showMaker)) {
        this.showMarker = defaultValue(options.showMaker, true);
    }
    if (defined(options.showMarker)) {
        this.showMarker = defaultValue(options.showMarker, true);
    }

    this.showLabel = defaultValue(options.showLabel, true);

    this.showCenterLabel = defaultValue(options.showCenterLabel, false);
    this.centerLabelPropertyName = options.centerLabelPropertyName;

    this.labelOffsetX = defaultValue(options.labelOffsetX, 0);
    this.labelOffsetY = defaultValue(options.labelOffsetY, 0);
    this.markerImage = options.markerImage;

    this.lineDash = options.lineDash;
    //this.lineOffset = options.lineOffset;
    this.lineCap = defaultValue(options.lineCap, "butt");
    this.lineJoin = defaultValue(options.lineJoin, "miter");
    this.shadowColor = getColor(options.shadowColor);

    this.shadowBlur = options.shadowBlur;
    this.shadowOffsetX = options.shadowOffsetX;
    this.shadowOffsetY = options.shadowOffsetY;
    this.miterLimit = defaultValue(options.miterLimit, 10);

    this.markerImageEl = null;
    var makerImagePromise = null;
    var deferred = when.defer()
    this.readyPromise = deferred.promise;
    var that = this;
    if (typeof this.markerImage == 'string') {

        var image = new Image();
        image.onload = function () {
            that.markerImageEl = this;
            deferred.resolve(true);
        }
        image.onerror = function (err) {
            deferred.reject(err);
        }
        image.src = this.markerImage;
    } else {
        if (this.markerImage instanceof Image
            || this.markerImage instanceof HTMLCanvasElement) {
            this.markerImageEl = this.markerImage;
        }
        setTimeout(function () {

            deferred.resolve(true);
        }, 10)
    }

}

/**
*
*@return {Cesium.VectorStyle}
*/
VectorStyle.prototype.clone = function () {
    var style = new VectorStyle();
    for (var i in this) {

        if (this.hasOwnProperty(i)) {
            if (typeof Cesium != 'undefined' && this[i] instanceof Cesium.Color) {
                style[i] = Cesium.Color.clone(this[i]);
            } else {
                style[i] = this[i];
            }
        }
    }
    return style;
}

/**
*
*@type {Cesium.VectorStyle}
*/
VectorStyle.Default = new VectorStyle();

module.exports = VectorStyle;

},{"./cesium/Core/defaultValue":40,"./cesium/Core/defined":42,"when":undefined}],4:[function(require,module,exports){
//不支持shp格式，如果需要支持shp格式，请在页面引用shpjs
//或者将入口改为VectorTileImageryProvider 
var loadJson = require('./cesium/Core/Resource').fetchJson;
var LonLatProjection = require('./LonLatProjection');
var Path = require('./utils/Path');
var VectorStyle = require('./VectorStyle');
var drawText = require('./utils/drawText');
var defineProperties = require('./cesium/Core/defineProperties')
var defined = require('./cesium/Core/defined');
var defaultValue = require('./cesium/Core/defaultValue');
var Event = require('./cesium/Core/Event');
var when = require('when');
var CesiumMath = require('./cesium/Core/Math');

var turf = require('./turf-light')
var Rectangle = require('./cesium/Core/Rectangle');
if (typeof Cesium !== 'undefined') {
    //Rectangle = Cesium.Rectangle;
    if (Cesium.ImageryLayerCollection) {

        /**
         * 根据zIndex属性调整图层顺序
         * @method orderByZIndex
         * @name orderByZIndex
         * @memberof Cesium.ImageryLayerCollection
         */

        Cesium.ImageryLayerCollection.prototype.orderByZIndex = function () {
            //调整带有index的图层顺序
            var layersHasIndex = [];
            for (var i = 0; i < this.length; i++) {
                var l = this.get(i);
                if ((l.imageryProvider.zIndex || l.zIndex)) {
                    layersHasIndex.push(l);
                    if (!l.zIndex) {
                        l.zIndex = l.imageryProvider.zIndex;
                    } else if (!l.imageryProvider.zIndex) {
                        l.imageryProvider.zIndex = l.zIndex;
                    }
                }
            }
            if (layersHasIndex && layersHasIndex.length) {
                layersHasIndex.sort(function (a, b) {
                    if (a.zIndex > b.zIndex) {
                        return 1;
                    } else if (a.zIndex < b.zIndex) {
                        return -1;
                    }
                    else {
                        return 0;
                    }
                })
            }
            var that = this;
            layersHasIndex.forEach(function (l) {
                that.raiseToTop(l);
            });

            for (var i = 0; i < this.length; i++) {
                var l = this.get(i);
                //调整矢量图层顺序
                if (!Cesium.defined(l.imageryProvider.zIndex)
                    && !Cesium.defined(l.zIndex)
                    && l.imageryProvider instanceof VectorTileImageryProvider) {
                    this.raiseToTop(l);
                }
            }

            for (var i = 0; i < this.length; i++) {
                var l = this.get(i);
                //调整矢量图层顺序
                if (!Cesium.defined(l.imageryProvider.zIndex)
                    && !Cesium.defined(l.zIndex)
                    && l.imageryProvider instanceof VectorTileImageryProvider
                    && (l.imageryProvider._lineOnly || l.imageryProvider._onlyPoint)) {
                    this.raiseToTop(l);
                }
            }
        }

    }
}
// var defaultColor = new Cesium.Color(1.0, 1.0, 1.0, 0.4);
// var defaultGlowColor = new Cesium.Color(0.0, 1.0, 0.0, 0.05);
// var defaultBackgroundColor = new Cesium.Color(0.0, 0.5, 0.0, 0.2);
function isShpLocalFiles(files) {
    var isFile = files.length >= 3;
    if (!isFile) return false;
    var shpFile, dbfFile, prjFile;
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (!(file instanceof File || (file instanceof Blob && file.name))) {
            return false;
        }
        if (files[i].name.toLocaleLowerCase().indexOf(".shp") > 0) {
            shpFile = files[i];
        }
        if (files[i].name.toLocaleLowerCase().indexOf(".prj") > 0) {
            prjFile = files[i];
        }
        if (files[i].name.toLocaleLowerCase().indexOf(".dbf") > 0) {
            dbfFile = files[i];
        }
    }
    if (!shpFile || !prjFile || !dbfFile) {
        return false;
    }
    return true;
}

/**
*动态矢量切片提供程序，支持esri shapefile(需要引用shpjs或者打包的时候加入shpjs)、geojson文件，也可以直接加载geojson对象
*   <ul class="see-list">
*       <li><a href="https://mikeswei.github.io/CesiumVectorTile/" target="_blank">VectorTileImageryProviderDemo</a></li>
*  </ul>  
*@param {Object}options 参数如下：
*@param {String|turf.FeatureCollection|Object|Array<File>}options.source  矢量文件url、矢量文件列表或者geojson对象
*@param {Cesium.VectorStyle}[options.defaultStyle=Cesium.VectorStyle.Default] 默认样式 
*@param {Boolean}[options.simplify=false] true则简化，默认不简化
*@param {Boolean}[options.simplifyTolerance=0.01] 简化公差
*@param {Boolean}[options.minimumLevel=3] 最小级别
*@param {Boolean}[options.maximumLevel=22] 最大级别
*@param {Boolean}[options.showMaximumLevel=true] 当超出最大级别时是否继续显示
*@param {Boolean}[options.removeDuplicate=true] 是否剔除重复的多边形
*@param {Boolean}[options.allowPick=false] 是否支持要素查询，如果支持要素查询则保留原始的geojson，会多占用系统内存
*@param {Cesium.VectorTileImageryProvider~clusteringCallback}[options.clustering] 聚类函数
* 
*@param {Cesium.VectorTileImageryProvider~StyleFilterCallback}[options.styleFilter=undefined] 样式函数
*@constructor 
*@memberof Cesium
*@extends Cesium.ImageryProvider
*@example
    //1.面数据
    viewer.imageryLayers.addImageryProvider(new VectorTileImageryProvider({
        source: appConfig.BaseURL + "Assets/VectorData/中国数据/陕西/榆林/county_sshanxi_yulin.shp",
        defaultStyle:{ outlineColor: Cesium.Color.WHITE, 
            fill: true
        },
        maximumLevel: 22,
        minimumLevel: 0
    }))
    //2.点数据
    viewer.imageryLayers.addImageryProvider(new VectorTileImageryProvider({
        source: appConfig.BaseURL + "Assets/VectorData/中国数据/陕西/榆林/town_sshanxi_yulin.shp"
        ,defaultStyle:{ 
            fontColor: Cesium.Color.WHITE
            , fontSize: 20
            , fontFamily: '微软雅黑'
            , markerImage: appConfig.BaseURL + "Assets/Images/Stations/autonew.png"
             , labelOffsetY: 5
            , labelOffsetX: 10
        }
            , maximumLevel: 22
            , minimumLevel: 9
    }))
    //3.线数据
      viewer.imageryLayers.addImageryProvider(new VectorTileImageryProvider({
        source: appConfig.BaseURL + "Assets/VectorData/中国数据/中国边界.shp" 
    }))
 
    //4.geojson
    viewer.imageryLayers.addImageryProvider(new VectorTileImageryProvider({
        source: appConfig.BaseURL + "Assets/SampleData/simplestyles.geojson",//VectorData/中国数据/中国边界.shp",
        defaultStyle:{
            fill: true
        },
            minimumLevel: 0
    }))
 
    5.使用样式函数（styleFilter）设置样式
     viewer.imageryLayers.addImageryProvider(new Cesium.VectorTileImageryProvider({
        source: appConfig.BaseURL + "Assets/VectorData/世界数据/Countries.shp",
        defaultStyle: {
            outlineColor: Cesium.Color.YELLOW,
            lineWidth: 2,
            fillColor: Cesium.Color.fromBytes(2, 24, 47, 200),
            fill: false,
            tileCacheSize: 200,
            showMarker: false,
            showCenterLabel: true,
            fontColor: "rgba(255,0,0,1)",
            labelOffsetX: -10,
            labelOffsetY: -5,
            fontSize: 13,
            fontFamily: "黑体",
            centerLabelPropertyName: "NAME"
        },
        maximumLevel: 20,
        minimumLevel: 1,
        simplify: false ,
        styleFilter: function (feature, style) {
            if (feature.properties.hasOwnProperty("NAME") && feature.properties["NAME"].toLocaleLowerCase().indexOf("china") >= 0) {
                style.outlineColor = Cesium.Color.RED;
                style.fill = true;
                style.fillColor = Cesium.Color.AZURE.withAlpha(0.5);
            }
        }
    }))
 
6.配图示例
appConfig.map = appConfig.map ? appConfig.map : {
    focusAdminNames: ['北京', '天津', '河北'],
    focusPropertyName: "NAME"
};
imageryProviders.seaLandImgProvider = new VectorTileImageryProvider({
    source: appConfig.BaseURL + 'Assets/SampleData/sealand.geojson',
    zIndex: 999,
    minimumLevel: 0,
    defaultStyle: {
        fill: true,//是否填充海陆颜色
        outlineColor: 'rgba(138,138,138,1)',//边界颜色
        fillColor: 'rgba(235,235,235,1)',//陆地颜色
        backgroundColor: 'rgba(89,129,188,1)'//海区颜色
    }
});
imageryProviders.chinaBorderImgProvider = new VectorTileImageryProvider({
    source: appConfig.BaseURL + 'Assets/SampleData/ChinaBorder.geojson',
    zIndex: 999,
    minimumLevel: 0,
    defaultStyle: {
        lineWidth: 1.25,
        outlineColor: 'rgba(88,88,88,1)'
    }
});
 
imageryProviders.provinceImgProvider = new VectorTileImageryProvider({
    source: appConfig.BaseURL + 'Assets/SampleData/Province.geojson',
    zIndex: 998,
    minimumLevel: 0,
    defaultStyle: {
        lineWidth: 1,
        //lineDash: [1, 4],
        fill: true,
        outline: true,
        shadowColor: Cesium.Color.WHITE,
        outlineColor: 'rgba(118,118,118,1)',
        fillColor: 'rgba(225,225,225, .5)'
    },
    styleFilter: function (feature, style) {
 
        if (appConfig.map) {
            var highlight = false;
            for (var i = 0; i < appConfig.map.focusAdminNames.length; i++) {
                highlight = feature.properties[appConfig.map.focusPropertyName]
                    && feature.properties[appConfig.map.focusPropertyName].indexOf(appConfig.map.focusAdminNames[i]) >= 0;
                if (highlight) break;
            }
            if (highlight) {
                style.fill = false;
                style.outlineColor = Cesium.Color.BLACK;
                style.fillColor = Cesium.Color.WHITE;
                style.lineWidth = 1.25;
                style.lineDash = null;
            }
        }
 
        return style;
    }
});
 
imageryProviders.adminLabelImgProvider = new VectorTileImageryProvider({
    source: appConfig.BaseURL + 'Assets/SampleData/placeName.geojson',
    minimumLevel: 3,
    defaultStyle: {
        showLabel: true,
        labelPropertyName: "name",
        fontFamily: 'heiti',
        showMarker: true,
        labelOffsetY: -12,
        pointColor: 'rgba(118,118,118,1)',
        labelStrokeWidth: 4,
        fontSize: 12,
        labelStroke: true,
        fontColor: Cesium.Color.WHITE,
        labelStrokeColor: 'rgba(118,118,118,1)'//Cesium.Color.BLACK
    },
    styleFilter: function (fc, style, x, y, level) {
        var highlight = false;
        if (appConfig.map && fc.properties.province) {
 
            for (var i = 0; i < appConfig.map.focusAdminNames.length; i++) {
                highlight = fc.properties.province.indexOf(
                    appConfig.map.focusAdminNames[i]
                ) >= 0;
                if (highlight) break;
            }
        }
        if (highlight) {
            style.pointColor = Cesium.Color.BLACK;
        }
        if (fc.properties.adminType == 'province') {
            if (level > 14) {
                style.show = false;
            }
            style.showMarker = false;
            style.labelOffsetY = 0;
            style.fontSize = 16;
            if (highlight) {
                style.labelStrokeColor = Cesium.Color.fromBytes(160, 99, 57);
            } else {
                style.labelStrokeColor = Cesium.Color.fromBytes(140, 89, 47);
            }
        } else {
 
            if (fc.properties.adminType == 'city') {
                if (level < 6) {
                    style.show = false;
                }
            }
            if (fc.properties.adminType == 'county' && level < 10) {
                style.show = false;
            }
            if (fc.properties.adminType == 'country') {
                style.show = false;
            }
 
            if (level > 14) {
                style.fontSize = 18;
            }
 
            if (highlight) {
                style.labelStrokeColor = Cesium.Color.BLACK;
            }
        }
        if (level < 6) {
            style.fontSize = 9;
        }
        if (level > 4) {
            style.labelPropertyName = "name";
        } else {
            style.labelPropertyName = "nameabbrevation";
        }
 
        return style;
    }
})
imageryProviderViewModels.push(new Cesium.ProviderViewModel({
    name: '海陆模版',
    iconUrl: appConfig.BaseURL + 'Assets/Images/ImageryProviders/sealand.png',
    tooltip: '海陆模版',
    creationFunction: function () {
        setTimeout(function () {
            imageryProviderViewModels.onSelected(imageryProviders.seaLandImgProvider);
        }, 200);
        return imageryProviders.seaLandImgProvider;
    }
}));
 
 
//leaflet中使用,必须先引用leafletjs文件后引用MeteoLibjs文件
//VectorTileImageryLayer参数和MeteoLib.Scene.VectorTileImageryProvider的参数一样
 var map = L.map('map', {
            crs: L.CRS.EPSG4326
        })
var vectorTileImageryLayer = new L.VectorTileImageryLayer({
    zIndex: 1,
    source: "../../../examples/Assets/Data/json/china_province.geojson",
    defaultStyle: {
        fill: true
    }
})
layerCtrl.addOverlay(vectorTileImageryLayer, '自定义矢量瓦片图层')
vectorTileImageryLayer.addTo(map)
*/
function VectorTileImageryProvider(options) {
    ///@param {Boolean}[options.multipleTask=true] 是否使用多个VectorTileImageryProvider实例，使用多个实例是设置该参数为true可以提高ui响应速度，使用唯一一个实例时设置该参数为false则可以提高切片速度。
    //@param {Boolean}[options.taskWaitTime=10] 使用多个实例时，每个实例的切片任务延迟结束的时间，以此来避免多个矢量图层同时存在时出现某个图层一直更新而其他图层一直没有更新的bug

    options = defaultValue(options, {});
    if (!defined(options.source)) {
        return;
        //throw new Error("source is required");
    }
    var ext = null;
    var isLocalShpFile = false;
    if (typeof options.source == 'string') {
        var source = options.source.toLowerCase();
        ext = Path.GetExtension(source)
        if (ext !== '.shp' && ext !== '.json' && ext !== '.geojson' && ext !== '.topojson') {
            throw new Error("The data  options.source provider is not supported.");
        }
    } else if (options.source.type && options.source.type == "FeatureCollection") {

    } else if (isShpLocalFiles(options.source)) {
        isLocalShpFile = true;
    } else {
        throw new Error("The data  options.source provider is not supported.");
    }

    this._rectangle = options.rectangle;
    this._tilingScheme = new Cesium.GeographicTilingScheme({ ellipsoid: options.ellipsoid });
    this._tileWidth = defaultValue(options.tileWidth, 256);
    this._tileHeight = defaultValue(options.tileHeight, 256);

    //if (ext && ext == '.shp') {
    //    ext = Path.GetExtension(options.source)
    //    this._url = options.source.replace(ext, '');
    //} else {
    this._url = options.source;
    //}
    this._fileExtension = ext;


    this._removeDuplicate = defaultValue(options.removeDuplicate, true);
    this._allowPick = defaultValue(options.allowPick, false);
    this._simplifyTolerance = defaultValue(options.simplifyTolerance, 0.01);
    this._simplify = defaultValue(options.simplify, false);
    //this._multipleTask = defaultValue(options.multipleTask, true);
    //this._taskWaitTime = defaultValue(options.taskWaitTime, 10);
    this._maximumLevel = defaultValue(options.maximumLevel, 22)
    this._minimumLevel = defaultValue(options.minimumLevel, 3)
    this._showMaximumLevel = defaultValue(options.showMaximumLevel, true)
    this._makerImage = options.markerImage;
    this._tileCacheSize = defaultValue(options.tileCacheSize, 200);
    if (typeof options.defaultStyle == 'object' && !(options.defaultStyle instanceof VectorStyle)) {
        options.defaultStyle = new VectorStyle(options.defaultStyle);
    }
    this._defaultStyle = defaultValue(options.defaultStyle, VectorStyle.Default.clone());
    this._styleFilter = typeof options.styleFilter == 'function' ? options.styleFilter : undefined;
    this.clustering = options.clustering

    this._errorEvent = new Event();
    this._featuresPicked = new Event();

    var readyDf = when.defer();

    this._readyPromise = readyDf.promise; //Cesium.when.defer();
    this._ready = false;
    this._state = VectorTileImageryProvider.State.READY;

    this._cache = {};
    this._count = 0;
    this.zIndex = options.zIndex;
    this._bbox = null;
    /**
     * 如果需要支持可以点击拾取要素进行要素查询则存储原始的geojson
     * @private
     */
    this._geoJSON = null;
    var that = this;
    var promises = [];
    if (typeof this._makerImage == 'string') {
        var makerImageDf = when.defer();
        var image = new Image();
        image.onload = function () {
            makerImageDf.resolve(this);
            that._makerImageEl = this;
        }
        image.onerror = function (err) {
            makerImageDf.resolve(err);
        }
        image.src = this._makerImage;
        promises.push(makerImageDf.promise);
    }

    var shpDf = when.defer();
    promises.push(shpDf.promise);
    this._state = VectorTileImageryProvider.State.SHPLOADING;
    if (ext) {
        switch (ext) {
            case '.shp':

                var url = this._url;
                var ext = Path.GetExtension(url);
                url = url.replace(ext, "");
                if (typeof shp == 'function') {
                    shp(url, undefined, "gbk").then(onSuccess, function (err) {
                        console.log("load shp file error：" + err);
                    });
                } else {
                    if (typeof VectorTileImageryProvider.shp == 'function') {
                        VectorTileImageryProvider.shp(url, undefined, "gbk").then(onSuccess, function (err) {
                            console.log("load shp file error：" + err);
                            that.readyPromise.reject(err)
                        });
                    } else {
                        throw new Error('找不到shp()方法，请确认是否引用了shpjs')
                    }
                }
                break;
            case '.json':
            case '.geojson':
            case '.topojson':
                // Resources.get(this._url)
                //loadText(this._url)
                loadJson(this._url)
                    .then(function (geojson) {
                        onSuccess(geojson);
                    }).otherwise(function (err) {
                        console.log(err);
                    })
                break;
            default:
                throw new Error("The file  options.source provider is not supported.");
        }
    } else {
        if (isLocalShpFile) {
            if (typeof shp == 'undefined') {
                if (typeof VectorTileImageryProvider.shp == 'function') {
                    shp = VectorTileImageryProvider.shp;
                } else {
                    throw new Error('找不到shp()方法，请确认是否引用了shpjs')
                }
            }
            var prms = shp.parseShpFiles(that._url);
            if (prms) {
                prms.then(onSuccess).otherwise(function (err) {
                    readyDf.reject(err);
                    //console.log(err);
                    //throw new Error("The file  options.source provider is not supported.");
                });
            } else {
                readyDf.reject(new Error("The file  options.source provider is not supported."));
            }
        } else {
            setTimeout(function () {
                if (Array.isArray(that._url)) {
                    readyDf.reject(new Error("The data  options.source provide is not supported."));
                } else {
                    onSuccess(that._url);
                }
            }, 10)
        }

    }

    this._lineGeoJSON = null;
    this._outlineGeoJSON = null;
    this._pointGeoJSON = null;
    this._polygonJSON = null;
    this._onlyPoint = false;
    this._lineOnly = false;
    this._polygonOnly = false;

    function onSuccess(geoJSON) {
        if (that._allowPick)
            that._geoJSON = geoJSON;
        var tolerance = that._simplifyTolerance;
        var lines = [], outlines = [], points = [], polygons = [];
        var onlyPoint = true, lineOnly = true, polygonOnly = true;
        var simplified;

        function groupByCenterLabelPropertyName(geoJSON, centerLabelPropertyName) {
            var dic = {};
            turf.featureEach(geoJSON, function (fc) {

                var geometry = fc.geometry;
                if (geometry) return;

                if ((geometry.type == 'Polygon'
                    || geometry.type == 'MultiPolygon')
                    && that._defaultStyle.showCenterLabel
                    && that._defaultStyle.centerLabelPropertyName
                    && fc.properties.hasOwnProperty(centerLabelPropertyName)) {

                    if (!dic[fc.properties[centerLabelPropertyName]]) {
                        dic[fc.properties[centerLabelPropertyName]] = [];
                    }
                    dic[fc.properties[centerLabelPropertyName]].push(fc);
                }

            });
            var keys = Object.keys(dic);
            for (var i = 0; i < keys.length; i++) {
                var fc = dic[keys[i]][0];
                var fcs = turf.featureCollection(dic[keys[i]]);
                var center = turf.center(fcs)
                points.push(center);
                center.properties = fc.properties;
                delete dic[keys[i]];
            }

        }

        if (that._defaultStyle.showCenterLabel
            && that._defaultStyle.centerLabelPropertyName) {
            that._defaultStyle.showLabel = true;
            that._defaultStyle.labelPropertyName = that._defaultStyle.centerLabelPropertyName;

            groupByCenterLabelPropertyName(geoJSON, that._defaultStyle.centerLabelPropertyName);
        }

        turf.featureEach(geoJSON, function (fc) {
            var geometry = fc.geometry;
            if (!geometry) return;
            if (geometry.type == 'MultiPolygon') {
                var polygonCoords = turf.getCoords(fc);
                polygonCoords.forEach(function (coords) {
                    geoJSON.features.push(turf.polygon(coords, fc.properties));
                })
                polygonCoords = [];
            }
        })

        for (var i = 0; i < geoJSON.features.length; i++) {
            var feature = geoJSON.features[i]
            if (!feature) continue;
            var geometry = feature.geometry
            if (!geometry) continue
            if (geometry.type == 'MultiPolygon') {
                geoJSON.features.splice(i, 1)
            }
        }
        if (that._removeDuplicate) {
            geoJSON = turf.removeDuplicate(geoJSON);
        }


        turf.featureEach(geoJSON, function (feature, index) {
            var geometry = feature.geometry
            if (!geometry) return
            if (geometry.type == "Point"
                || geometry.type == "MultiPoint") {
                points.push(feature);
                lineOnly = false;
                polygonOnly = false;
            } else if (that._defaultStyle.showCenterLabel
                && that._defaultStyle.centerLabelPropertyName
                && geometry.type !== "Polygon"
                && geometry.type !== "MultiPolygon") {
                that._defaultStyle.showLabel = true;
                that._defaultStyle.labelPropertyName = that._defaultStyle.centerLabelPropertyName;
                var center = turf.centerOfMass(feature)
                points.push(center);
                center.properties = feature.properties;
            }

            if (geometry.type == "Polygon"
                || geometry.type == "MultiPolygon") {
                var lineString = turf.polygonToLineString(feature);
                if (lineString) {
                    if (lineString.type == 'FeatureCollection') {
                        outlines = outlines.concat(lineString.features);
                    } else if (lineString.type == 'Feature') {
                        outlines = outlines.concat(lineString);
                    }
                }

                onlyPoint = false;
                lineOnly = false;

                if (that._simplify) {
                    simplified = turf.simplify(feature, {
                        tolerance: tolerance, highQuality: false
                    });
                    polygons.push(simplified);

                    simplified = null;
                } else {
                    polygons.push(feature);

                }
            }
            if (geometry.type == "MultiLineString"
                || geometry.type == "LineString") {

                if (that._simplify) {
                    simplified = turf.simplify(feature, { tolerance: tolerance, highQuality: false });
                    lines.push(simplified);

                    simplified = null;

                } else {
                    lines.push(feature);

                }
                onlyPoint = false;
                polygonOnly = false;
            }
        })

        if (lines.length > 0) {
            that._lineGeoJSON = turf.featureCollection(lines);
            lines = null;
        }

        if (outlines.length > 0) {
            outlines.forEach(function (outline) {
                outline.properties.isOutline = true;
            })
            that._outlineGeoJSON = turf.featureCollection(outlines);
            outlines = null;
        }

        if (points.length > 0) {
            that._pointGeoJSON = turf.featureCollection(points);
            points = null;
        }

        if (polygons.length > 0) {
            that._polygonJSON = turf.featureCollection(polygons);
            polygons = null;
        }

        that._lineOnly = lineOnly;
        that._polygonOnly = polygonOnly;
        that._onlyPoint = onlyPoint;
        that._state = VectorTileImageryProvider.State.LOADED;
        var bbox = turf.bbox(geoJSON);
        if (bbox[0] == bbox[2]) {
            bbox[0] = bbox[0] - 0.1;
            bbox[2] = bbox[2] + 0.1;
        }
        if (bbox[1] == bbox[3]) {
            bbox[1] = bbox[1] - 0.1;
            bbox[3] = bbox[3] + 0.1;
        }
        // that.rectangle = Cesium.Rectangle.fromDegrees(that._bbox[0], that._bbox[1], that._bbox[2], that._bbox[3]);
        that._bbox = Rectangle.fromDegrees(bbox[0], bbox[1], bbox[2], bbox[3]);
        if (!that._rectangle) that._rectangle = that._bbox;
        geoJSON = null;
        shpDf.resolve(that);
    }

    when.all(promises).then(function () {
        that._ready = that._state == VectorTileImageryProvider.State.LOADED;
        that._createCanvas();
        VectorTileImageryProvider.instanceCount++;
        readyDf.resolve(true);
        that._state = VectorTileImageryProvider.State.COMPELTED;
    }).otherwise(function (err) {
        readyDf.reject(err);
    });
}

/**
*样式设置函数
*@callback  Cesium.VectorTileImageryProvider~StyleFilterCallback
*@param {Geojson.Feature}feature 当前要素（用Geojson.Feature存储）
*@param {Cesium.VectorStyle}style 即将应用与当前要素的样式，可以通过修改该参数中的各样式设置选项来针对当前要素进行特殊的样式设置。
*修改后只对当前要素有效，不会修改MeteoLib.Scene.VectorTileImageryProvider的默认样式
*@param {Number}x
*@param {Number}y
*@param {Number}level
*/


/**
*聚类函数
*@callback  Cesium.VectorTileImageryProvider~clusteringCallback
*@param {Array<Feature<Point|MultiPoint>>}features 
  * @param {CanvasRenderingContext2D}context
  * @param {CanvasRenderingContext2D}tileBBox
*@param {Number}x
*@param {Number}y
*@param {Number}level
*/


VectorTileImageryProvider.instanceCount = 0;
VectorTileImageryProvider._currentTaskCount = 0;
VectorTileImageryProvider._maxTaskCount = 3;
VectorTileImageryProvider.State = {
    READY: 0,
    SHPLOADING: 1,
    CLIPPING: 3,
    GEOJSONDRAWING: 4,
    COMPELTED: 5
}
defineProperties(VectorTileImageryProvider.prototype, {
    /**
    *  
    * @memberof Cesium.VectorTileImageryProvider.prototype
    * @type {Cesium.VectorTileImageryProvider~StyleFilterCallback} 
    */
    styleFilter: {
        get: function () {
            return this._styleFilter;
        },
        set: function (val) {
            this._styleFilter = val;
        }
    },
    /**
     * 
     * @memberof Cesium.VectorTileImageryProvider.prototype
     * @type {Cesium.VectorStyle}
     * @readonly
     */
    defaultStyle: {
        get: function () {
            return this._defaultStyle;
        }
    },
    /**
     * Gets the proxy used by this provider.
     * @memberof Cesium.VectorTileImageryProvider.prototype
     * @type {Proxy}
     * @readonly
     */
    proxy: {
        get: function () {
            return undefined;
        }
    },

    /**
     * Gets the width of each tile, in pixels. This function should
     * not be called before {@link Cesium.VectorTileImageryProvider#ready} returns true.
     * @memberof Cesium.VectorTileImageryProvider.prototype
     * @type {Number}
     * @readonly
     */
    tileWidth: {
        get: function () {
            return this._tileWidth;
        }
    },

    /**
     * Gets the height of each tile, in pixels.  This function should
     * not be called before {@link Cesium.VectorTileImageryProvider#ready} returns true.
     * @memberof Cesium.VectorTileImageryProvider.prototype
     * @type {Number}
     * @readonly
     */
    tileHeight: {
        get: function () {
            return this._tileHeight;
        }
    },

    /**
     * Gets the maximum level-of-detail that can be requested.  This function should
     * not be called before {@link Cesium.VectorTileImageryProvider#ready} returns true.
     * @memberof Cesium.VectorTileImageryProvider.prototype
     * @type {Number}
     * @readonly
     */
    maximumLevel: {
        get: function () {
            return this._showMaximumLevel ? this._maximumLevel : 22;
        }
    },

    /**
     * Gets the minimum level-of-detail that can be requested.  This function should
     * not be called before {@link Cesium.VectorTileImageryProvider#ready} returns true.
     * @memberof Cesium.VectorTileImageryProvider.prototype
     * @type {Number}
     * @readonly
     */
    minimumLevel: {
        get: function () {
            //if (this._minimumLevel <5) {
            //    return this._minimumLevel;
            //}
            return 0;
        }
    },

    /**
     * Gets the tiling scheme used by this provider.  This function should
     * not be called before {@link Cesium.VectorTileImageryProvider#ready} returns true.
     * @memberof Cesium.VectorTileImageryProvider.prototype
     * @type {TilingScheme}
     * @readonly
     */
    tilingScheme: {
        get: function () {
            return this._tilingScheme;
        }
    },

    /**
     * Gets the rectangle, in radians, of the imagery provided by this instance.  This function should
     * not be called before {@link Cesium.VectorTileImageryProvider#ready} returns true.
     * @memberof Cesium.VectorTileImageryProvider.prototype
     * @type {Rectangle}
     * @readonly
     */
    rectangle: {
        get: function () {
            return this._rectangle;//_tilingScheme.rectangle;
        }
    },

    /**
     * Gets the tile discard policy.  If not undefined, the discard policy is responsible
     * for filtering out "missing" tiles via its shouldDiscardImage function.  If this function
     * returns undefined, no tiles are filtered.  This function should
     * not be called before {@link Cesium.VectorTileImageryProvider#ready} returns true.
     * @memberof Cesium.VectorTileImageryProvider.prototype
     * @type {TileDiscardPolicy}
     * @readonly
     */
    tileDiscardPolicy: {
        get: function () {
            return undefined;
        }
    },

    /**
     * Gets an event that is raised when the imagery provider encounters an asynchronous error.  By subscribing
     * to the event, you will be notified of the error and can potentially recover from it.  Event listeners
     * are passed an instance of {@link TileProviderError}.
     * @memberof Cesium.VectorTileImageryProvider.prototype
     * @type {Event}
     * @readonly
     */
    errorEvent: {
        get: function () {
            return this._errorEvent;
        }
    },
    /**
     *  要素查询有结果时，即要素被点击时触发该事件
     * @memberof Cesium.VectorTileImageryProvider.prototype
     * @type {Event}
     * @readonly
     */
    featuresPicked: {
        get: function () {
            return this._featuresPicked;
        }
    },
    /**
     * Gets a value indicating whether or not the provider is ready for use.
     * @memberof Cesium.VectorTileImageryProvider.prototype
     * @type {Boolean}
     * @readonly
     */
    ready: {
        get: function () {
            return this._ready;
        }
    },

    /**
     * Gets a promise that resolves to true when the provider is ready for use.
     * @memberof Cesium.VectorTileImageryProvider.prototype
     * @type {Promise.<Boolean>}
     * @readonly
     */
    readyPromise: {
        get: function () {
            return this._readyPromise;
        }
    },

    /**
     * Gets the credit to display when this imagery provider is active.  Typically this is used to credit
     * the source of the imagery.  This function should not be called before {@link Cesium.VectorTileImageryProvider#ready} returns true.
     * @memberof Cesium.VectorTileImageryProvider.prototype
     * @type {Credit}
     * @readonly
     */
    credit: {
        get: function () {
            return undefined;
        }
    },

    /**
     * Gets a value indicating whether or not the images provided by this imagery provider
     * include an alpha channel.  If this property is false, an alpha channel, if present, will
     * be ignored.  If this property is true, any images without an alpha channel will be treated
     * as if their alpha is 1.0 everywhere.  When this property is false, memory usage
     * and texture upload time are reduced.
     * @memberof Cesium.VectorTileImageryProvider.prototype
     * @type {Boolean}
     * @readonly
     */
    hasAlphaChannel: {
        get: function () {
            return true;
        }
    }
});

VectorTileImageryProvider.prototype._createCanvas = function () {
    this._canvas = document.createElement("canvas");
    this._canvas.width = this._tileWidth;
    this._canvas.height = this._tileHeight;
    this._context = this._canvas.getContext("2d");
    if (this._defaultStyle.backgroundColor) {
        if (this._defaultStyle.backgroundColor instanceof Cesium.Color) {
            this._context.fillStyle = this._defaultStyle.backgroundColor.toCssColorString();
        } else {
            this._context.fillStyle = this._defaultStyle.backgroundColor;
        }
        this._context.fillRect(0, 0, this._canvas.width, this._canvas.height);
    }

    this._context.lineWidth = this._defaultStyle.lineWidth;
    if (this._defaultStyle.outlineColor instanceof Cesium.Color) {
        this._context.strokeStyle = this._defaultStyle.outlineColor.toCssColorString();// "rgb(255,255,0)";
    } else {
        this._context.strokeStyle = this._defaultStyle.outlineColor;// "rgb(255,255,0)";
    }

    if (this._defaultStyle.fillColor instanceof Cesium.Color) {
        this._context.fillStyle = this._defaultStyle.fillColor.toCssColorString();// "rgba(0,255,255,0.0)";
    } else {
        this._context.fillStyle = this._defaultStyle.fillColor;// "rgba(0,255,255,0.0)";
    }
}

var isWorking = false;
//用当前瓦片（Tile）矩形裁剪geojson并返回裁剪结果
VectorTileImageryProvider.prototype._clipGeojson = function (rectangle) {
    var that = this;
    var bbox = [CesiumMath.toDegrees(rectangle.west),
    CesiumMath.toDegrees(rectangle.south),
    CesiumMath.toDegrees(rectangle.east),
    CesiumMath.toDegrees(rectangle.north)];
    var polygonBBox = turf.bboxPolygon(bbox);
    //    turf.polygon([[
    //    [bbox[0], bbox[1]],//sw
    //    [bbox[2], bbox[1]],//se
    //    [bbox[2], bbox[3]],//ne
    //    [bbox[0], bbox[3]],//nw
    //    [bbox[0], bbox[1]],//sw
    //]]);
    var pointsBBox = [
        [bbox[0], bbox[1]],
        [bbox[2], bbox[1]],
        [bbox[2], bbox[3]],
        [bbox[0], bbox[3]],
        [bbox[0], bbox[1]]
    ];
    for (var i = 0; i < pointsBBox.length; i++) {
        var point = turf.point(pointsBBox[i]);
        pointsBBox[i] = point;
    }
    pointsBBox = turf.featureCollection(pointsBBox);


    var features = [];
    if (this._pointGeoJSON) {
        //为了避免出现在边界的文字只画到一半，同时把周边切片包含的点也放在本切片绘制
        var lonW = (bbox[2] - bbox[0]) / 2, latH = (bbox[3] - bbox[1]) / 2;
        var polygonBBox4Points = turf.bboxPolygon([
            bbox[0] - lonW,
            bbox[1] - latH,
            bbox[2] + lonW,
            bbox[3] + latH,
        ]);
        var fcBBox = turf.featureCollection([polygonBBox4Points]);
        var pts = turf.within(this._pointGeoJSON, fcBBox);
        features = features.concat(pts.features);
    }
    var canClipGeojsons = [];


    if (this._polygonJSON) {
        canClipGeojsons.push(this._polygonJSON);
    }
    if (this._lineGeoJSON) {
        canClipGeojsons.push(this._lineGeoJSON);
    }
    if (this._outlineGeoJSON) {
        canClipGeojsons.push(this._outlineGeoJSON);
    }

    var clipped;
    function clippedExists() {
        var clippedCoords = turf.getCoords(clipped);
        var exists = false;
        for (var i = 0; i < features.length; i++) {
            var keys1 = Object.keys(clipped.properties);
            var keys2 = Object.keys(features[i].properties);

            if (keys1.length != keys2.length) {
                break;
            }
            var kEquals = true;
            for (var k_i = 0; k_i < keys1.length; k_i++) {
                if (keys1[k_i] != keys2[k_i]) {
                    kEquals = false;
                    break;
                }
            }
            if (!kEquals) {
                break;
            }
            kEquals = true;
            for (var k_i = 0; k_i < keys1.length; k_i++) {
                if (clipped.properties[keys1[k_i]] != features[i].properties[keys1[k_i]]) {
                    kEquals = false;
                    break;
                }
            }
            if (!kEquals) {
                break;
            }

            var tempCoords = turf.getCoords(features[i]);

            if (clippedCoords.length && clippedCoords.length == tempCoords.length) {
                var equals = true;
                for (var j = 0; j < clippedCoords.length; j++) {
                    var c1 = clippedCoords[j], c2 = tempCoords[j];
                    if (!Array.isArray(c1[0])) {
                        try {
                            equals = c1[0] == c2[0] && c1[1] == c2[1];
                        } catch (e) {
                            console.log(e)
                        }

                    } else if (c1.length == c2.length) {
                        for (var k = 0; k < c1.length; k++) {

                            if (c1[k][0] != c2[k][0] || c1[k][1] != c2[k][1]) {
                                equals = false;
                                break;
                            }
                        }

                    } else {
                        equals = false;
                        break;
                    }
                    if (equals) {
                        break;
                    }
                }
                if (equals) {
                    exists = true;
                    break;
                }
            }

        }

        return exists;
    }

    canClipGeojsons.forEach(function (geojson) {
        turf.featureEach(geojson, function (currentFeature, currentIndex) {
            if (!currentFeature.geometry) return;

            clipped = null;
            try {
                //if (currentFeature.geometry.type == "Polygon"
                //    || currentFeature.geometry.type == "MultiPolygon") {
                //    //var fcs = turf.featureCollection([currentFeature]);
                //    //if (!turf.within(pointsBBox, fcs))
                //    clipped = turf.intersect(currentFeature, polygonBBox);
                //    //else
                //    //    clipped = polygonBBox;
                //    //fcs = null;
                //}
                if (!clipped) {
                    clipped = turf.bboxClip(currentFeature, bbox);
                }
                if (clipped && clipped.geometry.coordinates.length > 0) {
                    var empty = true;
                    for (var i = 0; i < clipped.geometry.coordinates.length; i++) {
                        if (clipped.geometry.coordinates[i].length > 0) {
                            empty = false;
                            break;
                        }
                    }
                    if (!empty) {

                        // if (!clippedExists()) {
                        features.push(clipped);
                        //}
                    } else {
                        //clipped = turf.intersect(currentFeature, polygonBBox);
                        //if (clipped) {
                        //    features.push(clipped);
                        //}
                        //var fcs = turf.featureCollection([currentFeature]);
                        //if (turf.within(pointsBBox, fcs)) {
                        //    features.push(polygonBBox);
                        //}
                        //fcs = null;
                    }

                }
            } catch (e) {
                var coordinates = [];
                currentFeature.geometry.coordinates.forEach(function (contour) {
                    if (contour.length > 3) {
                        coordinates.push(contour);
                    }
                })
                currentFeature.geometry.coordinates = coordinates;
                try {
                    clipped = turf.bboxClip(currentFeature, bbox);
                    if (clipped && clipped.geometry.coordinates.length > 0) {

                        //if (!clippedExists()) {
                        features.push(clipped);
                        //}
                    }
                } catch (error) {
                    console.error(error)
                }

            }
        })
    })
    clipped = null;
    if (features.length > 0) {

        features = turf.featureCollection(features);
        return features;
    }
    return null;
}

/**
    * 挖孔
    * @param {any} context
    * @param {any} projection
    * @param {any} boundingRect
    * @param {any} x
    * @param {any} y
    * @param {any} holes
    */
function createHoles(context, projection, boundingRect, x, y, holes) {
    var tileCanvas = context.canvas;
    var imgData = context.getImageData(0, 0, tileCanvas.width, tileCanvas.height);

    var holeMaskCanvas = document.createElement("canvas");
    holeMaskCanvas.width = tileCanvas.width;
    holeMaskCanvas.height = tileCanvas.height;
    var holeMaskCtx = holeMaskCanvas.getContext("2d");

    var mask = [];
    holes.map(function (hole) {
        holeMaskCtx.clearRect(0, 0, holeMaskCanvas.width, holeMaskCanvas.height);
        holeMaskCtx.beginPath();
        var pointIndex = 0;
        hole.map(function (coordinate) {
            var pt = projection.project(coordinate, boundingRect)
            if (pointIndex == 0) {
                holeMaskCtx.moveTo(x + pt.x, y + pt.y);
            } else {
                holeMaskCtx.lineTo(x + pt.x, y + pt.y);
            }
            pointIndex++;
        })
        holeMaskCtx.closePath();


        holeMaskCtx.fillStyle = "rgba(255,255,255,1)";
        holeMaskCtx.fill();
        mask = holeMaskCtx.getImageData(0, 0, holeMaskCanvas.width, holeMaskCanvas.height).data;
        for (var i = 3; i < mask.length; i += 4) {
            if (mask[i] > 0) {
                imgData.data[i] = 0;
            }
        }

    });
    context.putImageData(imgData, 0, 0);
}

//绘制多边形（面或线）
function drawContours(context, projection, boundingRect, x, y, contours, fill, stroke, style) {

    var count = 0;
    var holes = [];
    contours.map(function (contour) {
        if (!fill || count <= 0) {
            var pointIndex = 0;
            context.beginPath();
            contour.map(function (coordinate) {
                var pt = projection.project(coordinate, boundingRect)
                if (pointIndex == 0) {
                    context.moveTo(x + pt.x, y + pt.y);
                } else {
                    context.lineTo(x + pt.x, y + pt.y);
                }
                pointIndex++;
            })

            if (fill) {
                context.closePath();
                context.fill(); //context.stroke();
            }
            if (stroke) {
                context.stroke();
            }

        } else {
            holes.push(contour);
        }
        count++;
    })
    if (fill) {
        return holes;
    } else {
        holes = null;
    }
}


//画点
function drawMarker(context, projection, boundingRect, x, y, pointFeature, fill, stroke, labelPropertyName, makerStyle) {
    if (typeof labelPropertyName == 'undefined') {
        labelPropertyName = "NAME";
    }

    var style = Object.assign({
        pointSize: 3,
        fontSize: 9,
        fontFamily: 'courier',
        color: 'rgb(0,0,0)',
        backgroundColor: 'rgb(255,0,0)',
        pointStyle: "Solid",//'Solid','Ring','Circle'
        ringRadius: 2,
        circleLineWidth: 1,
        showMarker: true,
        showLabel: true,
        labelOffsetX: 0.0,
        labelOffsetY: 0.0,
        markerSymbol: undefined
    }, makerStyle);

    context.font = style.fontSize + 'px ' + style.fontFamily + ' bold'

    var coordinate = pointFeature.geometry.coordinates

    var percentX = (coordinate[0] - boundingRect.xMin) / (boundingRect.xMax - boundingRect.xMin);
    var percentY = (coordinate[1] - boundingRect.yMax) / (boundingRect.yMin - boundingRect.yMax);

    var pt = { x: percentX * context.canvas.width, y: percentY * context.canvas.height };

    if (style.showMarker || style.showMarker) {

        var px = pt.x + x,
            py = pt.y + y;

        if (style.markerSymbol && (style.markerSymbol instanceof Image
            || style.markerSymbol instanceof HTMLCanvasElement)) {


            var textHeight = style.markerSymbol.height;
            var textWidth = style.markerSymbol.width;
            px -= textWidth / 2;
            py -= textHeight / 2;
            if (style.markerSymbol.width && style.markerSymbol.height)
                context.drawImage(
                    style.markerSymbol, px, py
                )

        } else {
            px -= style.pointSize;
            py -= style.pointSize;
            context.fillStyle = style.backgroundColor
            context.beginPath();
            context.arc(px, py, style.pointSize, 0, Math.PI * 2);
            if (style.pointStyle == 'Solid') {
                context.fill();
            }
            else if (style.pointStyle == 'Circle') {
                context.lineWidth = style.circleLineWidth;
                context.strokeStyle = style.backgroundColor
                context.stroke();
            } else if (style.pointStyle == 'Ring') {
                context.strokeStyle = style.backgroundColor
                context.stroke();
                context.beginPath();
                context.arc(px, py, style.ringRadius, 0, Math.PI * 2);
                context.closePath();
                context.fill();
            }
        }
    }
    if (style.showLabel) {
        var text = pointFeature.properties[labelPropertyName];
        if (text) {
            if (typeof text != 'string') {
                text = text.toString();
            }
            context.fillStyle = style.color;
            var px = pt.x + x + style.labelOffsetX;//+ 4,
            py = pt.y + y + style.labelOffsetY;// + style.fontSize / 2;

            text = text.trim();
            var textImg = drawText(text, {
                fill: true,
                font: style.fontSize + 'px ' + style.fontFamily,
                stroke: style.labelStroke,
                strokeWidth: style.labelStrokeWidth,
                strokeColor:
                    typeof style.labelStrokeColor == 'string' ?
                        Cesium.Color.fromCssColorString(style.labelStrokeColor) :
                        style.labelStrokeColor,
                fillColor: Cesium.Color.fromCssColorString(style.color)
            })

            var textHeight = textImg.height;
            var textWidth = textImg.width;
            px -= textWidth / 2 + style.pointSize;
            py -= textHeight / 2 + style.pointSize;
            if (textImg.width && textImg.height)
                context.drawImage(textImg, px, py)
        }
    }
    context.restore();
}

/**
 * 
 *@param {Number}x
 *@param {Number}y
 *@param {Object}geojson 
 *@param {Object}[boundingRect=undefined] 
 *@param {Number}width
 *@param {Number}height
 *@param {Object}[fill=true] 
 *@param {Object}[stroke=true] 
 *@private
 */
VectorTileImageryProvider.prototype._drawGeojson = function (context, x, y, geojson, boundingRect, width, height, fill, stroke, row, col, level) {
    var that = this;
    if (typeof fill == 'undefined') {
        fill = true;
    }
    if (typeof stroke == 'undefined') {
        stroke = true;
    }
    if (!fill && !stroke) {
        return undefined;
    }
    if (typeof width == 'undefined') {
        width = context.canvas.width - x;
    }
    if (typeof height == 'undefined') {
        height = context.canvas.height - y;
    }

    var projection = new LonLatProjection(width, height);

    var style = this._defaultStyle;

    var makerStyle = {
        labelStroke: style.labelStroke,
        labelStrokeWidth: style.labelStrokeWidth,
        labelStrokeColor: style.labelStrokeColor,
        pointSize: style.pointSize,
        fontSize: style.fontSize,
        fontFamily: style.fontFamily,
        color: style.fontColor instanceof Cesium.Color ? style.fontColor.toCssColorString() : style.fontColor,
        backgroundColor: style.pointColor instanceof Cesium.Color ? style.pointColor.toCssColorString() : style.pointColor,
        pointStyle: style.pointStyle,//'Solid','Ring','Circle'
        ringRadius: style.ringRadius,
        circleLineWidth: style.circleLineWidth,
        showMarker: style.showMarker,
        showLabel: style.showLabel,
        labelOffsetX: style.labelOffsetX,
        labelOffsetY: style.labelOffsetY,
        markerSymbol: (style.markerImage instanceof Image
            || style.markerImage instanceof HTMLCanvasElement
        ) ? style.markerImage : style.markerImageEl
    };
    var holes = [];
    if (that._styleFilter) {
        turf.featureEach(geojson, function (currentFeature, currentFeatureIndex) {
            if (that._styleFilter) {
                style = that._defaultStyle.clone();
                that._styleFilter(currentFeature, style, row, col, level);
                currentFeature.style = style;
            }
        });
        geojson.features.sort(function (a, b) {
            if (a.style && a.style.lineDash) {
                return 1;
            }
            if (b.style && b.style.lineDash) {
                return -1;
            }
            return 0;
        })
    }

    function drawFeature(currentFeature, currentFeatureIndex) {

        if (that._styleFilter) {
            style = currentFeature.style;
            if (style.show == false) {
                return;
            }

            makerStyle = {
                labelStroke: style.labelStroke,
                labelStrokeWidth: style.labelStrokeWidth,
                labelStrokeColor: style.labelStrokeColor,
                pointSize: style.pointSize,
                fontSize: style.fontSize,
                fontFamily: style.fontFamily,
                color: style.fontColor instanceof Cesium.Color ? style.fontColor.toCssColorString() : style.fontColor,
                backgroundColor: style.pointColor instanceof Cesium.Color ? style.pointColor.toCssColorString() : style.pointColor,
                pointStyle: style.pointStyle,//'Solid','Ring','Circle'
                ringRadius: style.ringRadius,
                circleLineWidth: style.circleLineWidth,
                showMarker: style.showMarker,
                showLabel: style.showLabel,
                labelOffsetX: style.labelOffsetX,
                labelOffsetY: style.labelOffsetY,
                markerSymbol: (style.markerImage instanceof Image || style.markerImage instanceof HTMLCanvasElement) ? style.markerImage : style.markerImageEl
            };
        } else {
            style = that._defaultStyle;
        }

        context.lineWidth = style.lineWidth;

        if (style.outlineColor instanceof Cesium.Color) {
            context.strokeStyle = style.outlineColor.toCssColorString();// "rgb(255,255,0)";
        } else {
            context.strokeStyle = style.outlineColor;// "rgb(255,255,0)";
        }

        if (style.fillColor instanceof Cesium.Color) {
            context.fillStyle = style.fillColor.toCssColorString();// "rgba(0,255,255,0.0)";
        } else {
            context.fillStyle = style.fillColor;// "rgba(0,255,255,0.0)";
        }

        if (style.lineDash) {
            context.setLineDash(style.lineDash);
        }

        context.lineCap = style.lineCap;
        if (style.shadowColor && style.shadowColor instanceof Cesium.Color) {
            context.shadowColor = style.shadowColor.toCssColorString();
        } else {
            context.shadowColor = style.shadowColor;
        }
        context.shadowBlur = style.shadowBlur;
        context.shadowOffsetX = style.shadowOffsetX;
        context.shadowOffsetY = style.shadowOffsetY;
        context.miterLimit = style.miterLimit;
        context.lineJoin = style.lineJoin;

        var geometry = currentFeature.geometry

        if (geometry.type == "Point") {
            drawMarker(context, projection, boundingRect, x, y, currentFeature, fill, stroke, style.labelPropertyName, makerStyle);
        }
        else if (geometry.type == "Polygon" && style.fill) {

            var contours = turf.getCoords(currentFeature);
            var tempHoles = drawContours(context, projection, boundingRect, x, y, contours, true, false, style);
            if (tempHoles) {
                tempHoles.map(function (hole) {
                    hole.style = style;
                    holes.push(hole);
                })
            }
            //drawContours(context, projection, boundingRect, x, y, contours, true, false, style);
        } else if (geometry.type == "MultiPolygon" && style.fill) {
            var polygons;
            try {

                polygons = turf.getCoords(currentFeature);
                polygons.map(function (contours) {
                    var tempHoles = drawContours(context, projection, boundingRect, x, y, contours, true, false, style);
                    if (tempHoles) {
                        tempHoles.map(function (hole) {
                            hole.style = style;
                            holes.push(hole);
                        })

                    }
                })

            } catch (e) {
                //     console.log(e);
            }
        } else if (geometry.type == "MultiLineString") {
            if (currentFeature.properties.isOutline && !style.outline) {

            } else {
                var contours = turf.getCoords(currentFeature);
                drawContours(context, projection, boundingRect, x, y, contours, false, true, style);
                contours = null;
            }

        }
        else if (geometry.type == "LineString") {
            if (currentFeature.properties.isOutline && !style.outline) {

            } else {
                var contour = turf.getCoords(currentFeature);
                var contours = [contour]
                drawContours(context, projection, boundingRect, x, y, contours, false, true, style);
                contour = null;
                contours = null;

            }
        }
    }

    turf.featureEach(geojson, function (fc, idx) {
        var geometry = fc.geometry
        if (!geometry) return;

        if (geometry.type == "Polygon" || geometry.type == "MultiPolygon") {
            drawFeature(fc, idx)
        }
    })
    if (holes && holes.length) {
        createHoles(context, projection, boundingRect, x, y, holes)
    }
    turf.featureEach(geojson, function (fc, idx) {
        var geometry = fc.geometry
        if (!geometry) return;

        if (geometry.type == "LineString" || geometry.type == "MultiLineString") {
            drawFeature(fc, idx)
        }
    })


    var pointFcs = [];
    turf.featureEach(geojson, function (fc, idx) {
        var geometry = fc.geometry
        if (!geometry) return;
        if (geometry.type == "Point" || geometry.type == "MultiPoint") {
            if (typeof that.clustering !== 'function') drawFeature(fc, idx)
            else pointFcs.push(fc)
        }
    })

    var tileBBox = [
        boundingRect.xMin, boundingRect.yMin, boundingRect.xMax, boundingRect.yMax
    ]
    if (typeof that.clustering == 'function') {
        pointFcs = that.clustering(pointFcs, context, tileBBox, row, col, level)
    }
    if (pointFcs && pointFcs.length) {
        pointFcs.forEach(function (fc, idx) {
            drawFeature(fc, idx)
        })
    }
}

/**
 * 判断点和绘制符号后的矩形区域是否跨瓦片
 * @param {CanvasRenderingContext2D}context
 * @param {Array.<Number>}tileBBox
 * @param {Feature.<Point|MultiPoint>}pointFeature
 * @param {Array.<Number>}outDrawBBox
 * @return {Boolean}
 */
VectorTileImageryProvider.pointIsCrossTile = function pointIsCrossTile(context, tileBBox, pointFeature, outDrawBBox) {
    if (outDrawBBox) outDrawBBox.splice(0, outDrawBBox.length)
    if (!pointFeature.properties) return true;
    if (!pointFeature.properties.symbol) return true;
    var symbol = pointFeature.properties.symbol;
    var coordinate = pointFeature.geometry.coordinates

    var percentX = (coordinate[0] - tileBBox[0]) / (tileBBox[2] - tileBBox[0]);
    var percentY = (coordinate[1] - tileBBox[3]) / (tileBBox[1] - tileBBox[3]);

    var x = percentX * context.canvas.width,
        y = percentY * context.canvas.height;
    var minX = x - symbol.width / 2.0, maxX = x + symbol.width / 2.0;
    var minY = y - symbol.height / 2.0, maxY = y + symbol.height / 2.0;
    if (minX < 0 || maxX > context.canvas.width) return true;
    if (minY < 0 || maxY > context.canvas.height) return true;
    outDrawBBox[0] = minX;
    outDrawBBox[1] = minY;
    outDrawBBox[2] = maxX;
    outDrawBBox[3] = maxY;
    return false;
}
/**
*同步导出瓦片
*@param {Number}x
*@param {Number}y
*@param {Number}level
*@return {Canvas}
*/
VectorTileImageryProvider.prototype.requestImageSync = function (x, y, level) {
    var that = this;
    var cacheId = x + "," + y + "," + level;

    if (that.cache && that.cache[cacheId]) {
        return that.cache[cacheId];
    }
    var rectangle = this._tilingScheme.tileXYToRectangle(x, y, level);
    var boundingRect = {
        xMin: CesiumMath.toDegrees(rectangle.west),
        yMin: CesiumMath.toDegrees(rectangle.south),
        xMax: CesiumMath.toDegrees(rectangle.east),
        yMax: CesiumMath.toDegrees(rectangle.north)
    };

    var clippedGeojson = that._clipGeojson(rectangle);

    if (!clippedGeojson) {
        if (that._onlyPoint || (that._polygonOnly && that._defaultStyle.fill)) {
            return getEmpty(that._defaultStyle.backgroundColor);
        }
        else {
            return undefined;
        }
    } else {
        that._createCanvas();
        if (!that._defaultStyle.backgroundColor) {
            that._context.clearRect(0, 0, that._canvas.width, that._canvas.height);
        }
        that._drawGeojson(that._context, 0, 0, clippedGeojson, boundingRect, that._tileWidth, that._tileHeight, that._fill, that._outline, x, y, level);
        return that._canvas;
    }
}
VectorTileImageryProvider.prototype._createTileImage = function (x, y, level, rectangle, defer) {

    var that = this;
    var cacheId = x + "," + y + "," + level;

    var boundingRect = {
        xMin: CesiumMath.toDegrees(rectangle.west),
        yMin: CesiumMath.toDegrees(rectangle.south),
        xMax: CesiumMath.toDegrees(rectangle.east),
        yMax: CesiumMath.toDegrees(rectangle.north)
    };
    this._state = VectorTileImageryProvider.State.CLIPPING;
    requestAnimationFrame(function () {
        var clippedGeojson = that._clipGeojson(rectangle);

        if (!clippedGeojson) {
            if (that._onlyPoint) {
                defer.resolve(getEmpty(that._defaultStyle.backgroundColor));
            }
            else {
                defer.resolve(undefined);
            }
            that._state = VectorTileImageryProvider.State.COMPELTED;
            VectorTileImageryProvider._currentTaskCount--;
        } else {

            Cesium.requestAnimationFrame(function () {
                that._state = VectorTileImageryProvider.State.GEOJSONDRAWING;
                that._createCanvas();
                if (!that._defaultStyle.backgroundColor) {
                    that._context.clearRect(0, 0, that._canvas.width, that._canvas.height);
                }

                //if (level < 8) {
                //    var v = 1.5 / Math.pow(2, (level + 0));
                //    try {
                //        clippedGeojson = turf.simplify(clippedGeojson, v);
                //    } catch (e) {

                //    }

                //}

                that._drawGeojson(that._context, 0, 0, clippedGeojson, boundingRect, that._tileWidth, that._tileHeight, that._fill, that._outline, x, y, level);

                that.cache[cacheId] = that._canvas;
                that.cache[cacheId].srcJson = clippedGeojson;
                that.cacheCount++;
                VectorTileImageryProvider._currentTaskCount--;

                defer.resolve(that._canvas);

                Cesium.requestAnimationFrame(function () {
                    that._state = VectorTileImageryProvider.State.COMPELTED;
                });
            });

        }
    });
}

/**
*
*/
VectorTileImageryProvider.prototype.clearCache = function () {
    var provider = this;
    for (var cacheId in provider.cache) {
        if (provider.cache.hasOwnProperty(cacheId)) {
            provider.cache[cacheId].srcJson = null;
            delete provider.cache[cacheId];
        }
    }
    provider.cache = {};
    provider.cacheCount = 0;
}

VectorTileImageryProvider.prototype._getTileImage = function (x, y, level, rectangle) {

    var defer = when.defer();
    var that = this;

    //从缓存中查询
    var cacheId = x + "," + y + "," + level;
    if (!that.cacheCount) {
        that.cacheCount = 0;
    }
    if (!that.cache || that.cacheCount > that._tileCacheSize) {
        for (var cacheId in that.cache) {
            if (that.cache.hasOwnProperty(cacheId)) {
                that.cache[cacheId].srcJson = null;
                delete that.cache[cacheId];
            }
        }
        that.cache = {};
        that.cacheCount = 0;
    }
    if (that.cache[cacheId]) {
        return that.cache[cacheId]
    }

    //处理并发
    if (VectorTileImageryProvider._maxTaskCount < VectorTileImageryProvider._currentTaskCount) {
        return undefined;
    }
    VectorTileImageryProvider._currentTaskCount++;
    that._state = VectorTileImageryProvider.State.READY;
    setTimeout(function () {
        return that._createTileImage(x, y, level, rectangle, defer)
    }, 1);
    return defer.promise;
}

var emptycv;

function getEmpty(bgColor) {
    if (!emptycv) {

        emptycv = document.createElement("canvas");
        emptycv.width = 256;
        emptycv.height = 256;
    }
    if (bgColor) {
        var ctx = emptycv.getContext('2d');

        if (bgColor instanceof Cesium.Color) {
            ctx.fillStyle = bgColor.toCssColorString();
        } else {
            ctx.fillStyle = bgColor;
        }

        ctx.fillRect(0, 0, emptycv.width, emptycv.height);
    }
    else {
        var ctx = emptycv.getContext('2d');
        ctx.clearRect(0, 0, emptycv.width, emptycv.height);
    }
    return emptycv;
}
var scratchRectangleIntersection;
if (typeof Rectangle !== 'undefined') {
    scratchRectangleIntersection = new Rectangle();
}
VectorTileImageryProvider.prototype.requestImage = function (x, y, level, distance) {
    if (!this._ready || this._state != VectorTileImageryProvider.State.COMPELTED) {
        return undefined;
    }
    if (level < this._minimumLevel) {
        this._createCanvas();
        this._context.clearRect(0, 0, this._tileWidth, this._tileHeight);
        return this._canvas;
    } else if (level > this._maximumLevel) {
        return getEmpty(this._defaultStyle.backgroundColor)
    }
    var rectangle = this.tilingScheme.tileXYToRectangle(x, y, level);
    return this._getTileImage(x, y, level, rectangle);
}
VectorTileImageryProvider.prototype.pickFeatures = function (x, y, level, longitude, latitude) {
    //alert(longitude+","+ latitude);
}
/**
*合并图层并出图
*@param {Array.<Cesium.VectorTileImageryProvider>}vectorTileImageryProviders
*@param {Cesium.Rectangle}rectangle
*@param {Number}level
*@param {Number}[tileWidth=256]
*@param {Number}[tileHeight=256]
*@return {Canvas}
*/
VectorTileImageryProvider.compose = function (
    vectorTileImageryProviders, rectangle, level,
    tileWidth, tileHeight
) {

    tileWidth = tileWidth ? tileWidth : 256;
    tileHeight = tileHeight ? tileHeight : 256;

    vectorTileImageryProviders.sort(function (a, b) {
        if (!Cesium.defined(a.zIndex)) {
            return -1;
        }
        if (!Cesium.defined(b.zIndex)) {
            return 1;
        }
        return a.zIndex - b.zIndex;
    })

    var tilingScheme = new Cesium.GeographicTilingScheme();

    var nw = Rectangle.northwest(rectangle);
    var se = Rectangle.southeast(rectangle);
    var lt = tilingScheme.positionToTileXY(nw, level);
    var rb = tilingScheme.positionToTileXY(se, level);

    var w = (rb.x - lt.x + 1) * tileWidth,
        h = (rb.y - lt.y + 1) * tileHeight;
    var cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    var context = cv.getContext('2d');
    for (var li = 0; li < vectorTileImageryProviders.length; li++) {

        for (var x = lt.x, i = 0; x <= rb.x; x++, i++) {
            for (var y = lt.y, j = 0; y <= rb.y; y++, j++) {

                var px = i * tileWidth, py = j * tileHeight;
                var provider = vectorTileImageryProviders[li];

                try {
                    var image = provider.requestImageSync(x, y, level);
                    if (image && image.width && image.height) {
                        context.drawImage(image, px, py, tileWidth, tileHeight);
                    }
                } catch (e) {
                    console.error(e);
                }
            }
        }
    }

    return cv;
}

var scratchRect = new Rectangle();
/**
 * 重写此函数，实现：要素被点击时准备好并返回要素查询结果信息。
 * @param {Feature}feature geojson要素
 * @param {Number}x 当前点所在tms瓦片编号x部分
 * @param {Number}y 当前点所在tms瓦片编号y部分
 * @param {Number}level 当前点所在tms瓦片级别
 * @param {Number}longitude 当前点击的点经度（单位是弧度）
 * @param {Number}latitude 当前点击的点纬度（单位是弧度）
 * @return {Promise.<Cesium.ImageryLayerFeatureInfo>|Cesium.ImageryLayerFeatureInfo}
 */
VectorTileImageryProvider.prototype.prepareFeatureInfo = function (feature, x, y, level, longitude, latitude) {
    return undefined;
}
/**
 * 实现Cesium.ImageryProvidery要素查询（拾取）接口，除了返回结果可以在Cesium内置的InfoBox显示之外，还触发featuresPicked事件。
 * @param {Number}x
 * @param {Number}y
 * @param {Number}level
 * @param {Number}longitude
 * @param {Number}latitude
 */
VectorTileImageryProvider.prototype.pickFeatures = function (x, y, level, longitude, latitude) {
    var that = this;
    if (!this._allowPick || !this._geoJSON) {
        that._featuresPicked.raiseEvent(that, undefined);
        return undefined;
    }
    this.tilingScheme.tileXYToRectangle(x, y, level, scratchRect);
    var res = turf.radiansToLength(scratchRect.width / 256, 'kilometers');//分辨率，单位公里，即当前视图下一个像素点边长所表示距离

    var pt = turf.point([CesiumMath.toDegrees(longitude), CesiumMath.toDegrees(latitude)]);

    var pickedFeatures = [];
    var style = this.defaultStyle;

    turf.featureEach(this._geoJSON, function (fc) {
        var srcFc = fc;
        var found = false;
        var geometry = fc.geometry
        if (!geometry) return;

        if (style.fill && (geometry.type == 'Polygon' || geometry.type == 'MultiPolygon')) {
            if (turf.booleanPointInPolygon(pt, fc)) {
                found = true;
            }
        } else {
            var dist = turf.pointToFeatureDistance(pt, fc, {
                units: "kilometers"
            })

            if ((style.outline && (geometry.type == 'Polygon' || geometry.type == 'MultiPolygon'))
                || (geometry.type == "LineString" || geometry.type == "MultiLineString")
            ) {
                found = dist <= res * 2.0;
            } else if (style.showMarker && (geometry.type == 'Point' || geometry.type == 'MultiPoint')) {

                switch (style.pointStyle) {
                    case "Solid":
                        found = dist <= style.pointSize * 2.0;
                        break;
                    case "Ring":
                    case "Circle": found = dist <= (style.circleLineWidth + style.ringRadius) * 2.0;
                        break;
                }
            }
        }

        if (found) {//查找成功
            var fcInfo;
            if (typeof that.prepareFeatureInfo == 'function') {
                fcInfo = that.prepareFeatureInfo(srcFc, x, y, level, longitude, latitude)
            }
            if (!fcInfo) {
                var fcInfo = new Cesium.ImageryLayerFeatureInfo();
                fcInfo.data = srcFc;
                fcInfo.description = JSON.stringify(srcFc.properties, null, 2);
                if (style.labelPropertyName) {
                    fcInfo.name = srcFc.properties[style.labelPropertyName]
                }
                else if (style.centerLabelPropertyName) {
                    fcInfo.name = srcFc.properties[style.centerLabelPropertyName]
                }

                var srcGeometry = srcFc.geometry
                if (srcGeometry.type == 'Point' || srcGeometry.type == 'MultiPoint') {
                    fcInfo.position = new Cesium.Cartographic(longitude, latitude)
                } else {
                    var centroidPt = turf.centroid(srcFc);
                    var coord = turf.getCoords(centroidPt);
                    fcInfo.position = Cesium.Cartographic.fromDegrees(coord[0], coord[1])
                }
            }
            pickedFeatures.push(fcInfo)
        }
    })
    if (pickedFeatures.length) {
        var df = when.defer();
        var startTime = new Date();
        when.all(pickedFeatures).then(function (pickedFeatures) {
            var timespan = new Date() - startTime;
            if (timespan < 100) {
                setTimeout(function () {
                    that._featuresPicked.raiseEvent(that, pickedFeatures);
                    df.resolve(pickedFeatures);
                }, 100);
            } else {
                that._featuresPicked.raiseEvent(that, pickedFeatures);
                df.resolve(pickedFeatures);
            }
        }).otherwise(function (err) {
            console.error(err);
            that._featuresPicked.raiseEvent(that, undefined);
        })
        return df.promise;
    } else {
        that._featuresPicked.raiseEvent(that, undefined);
    }
}
/**
 * @callback Cesium.VectorTileImageryProvider~featuresPickedCallback
 * @param {Cesium.VectorTileImageryProvider}ImageryProvider
 * @param {Array.<Cesium.ImageryLayerFeatureInfo>}pickedFeatures
 */

/**
 * 
 */
VectorTileImageryProvider.prototype.destroy = function () {
    for (var key in this) {
        if (this.hasOwnProperty(key)) {
            delete this[key];
        }
    }
}

//支持leaflet
//leaflet图层,仅支持L.CRS.EPSG4326坐标系，使用MeteoLib中的VectorTileImageryProvider动态生成矢量瓦片

if (typeof L != 'undefined' && L.GridLayer && L.GridLayer.extend) {

    L.VectorTileImageryLayer = L.GridLayer.extend({
        options: {
            crs: L.CRS.EPSG4326,
            defaultZIndex: 1
        },
        initialize: function (options) {
            options.tileCacheSize = options.tileCacheSize ? options.tileCacheSize : 20,
                this.tileProvider = new VectorTileImageryProvider(options)
            this.options.defaultZIndex = options.zIndex;
        },
        clearCache: function () {
            if (this.tileProvider) this.tileProvider.clearCache()
        },
        onAdd: function (map) {
            this.setZIndex(this.options.defaultZIndex)
            L.GridLayer.prototype.onAdd.call(this, map);
        },
        createTile: function (coords, done) {

            var tile = L.DomUtil.create('canvas', 'leaflet-tile');
            var size = this.getTileSize();
            tile.width = size.x;
            tile.height = size.y;
            var ctx = tile.getContext('2d');
            var invertedY = this._globalTileRange.max.y - coords.y;
            var vecImgPrvd = this.tileProvider
            if (!vecImgPrvd.ready) {
                vecImgPrvd.readyPromise.then(function () {
                    var img = vecImgPrvd.requestImageSync(coords.x, coords.y, coords.z);
                    if (img) ctx.drawImage(img, 0, 0)
                    done(null, tile);
                })
            } else {
                requestAnimationFrame(function () {
                    var img = vecImgPrvd.requestImageSync(coords.x, coords.y, coords.z);
                    if (img) ctx.drawImage(img, 0, 0)
                    done(null, tile)
                });
            }
            return tile;
        }
    });
}
module.exports = VectorTileImageryProvider;

},{"./LonLatProjection":1,"./VectorStyle":3,"./cesium/Core/Event":15,"./cesium/Core/Math":21,"./cesium/Core/Rectangle":22,"./cesium/Core/Resource":28,"./cesium/Core/defaultValue":40,"./cesium/Core/defineProperties":41,"./cesium/Core/defined":42,"./turf-light":63,"./utils/Path":64,"./utils/drawText":66,"when":undefined}],5:[function(require,module,exports){
//增加对shp格式的支持
/**
   * 
   * @namespace Cesium
   */

   
var VectorTileImageryProvider = require('./VectorTileImageryProvider-light');
VectorTileImageryProvider.shp = require('./Shp')
module.exports = VectorTileImageryProvider;
},{"./Shp":2,"./VectorTileImageryProvider-light":4}],6:[function(require,module,exports){
module.exports = {
    // Resource:require('./cesium/Core/Resource'),
    when: require('./cesium/ThirdParty/when'),
    Cartesian2: require('./cesium/Core/Cartesian2'),
    Cartesian3: require('./cesium/Core/Cartesian3'),
    Cartesian4: require('./cesium/Core/Cartesian4'),
    Math: require('./cesium/Core/Math'),
    CesiumMath: require('./cesium/Core/Math'),
    TilingScheme: require('./cesium/Core/TilingScheme'),
    GeographicTilingScheme: require('./cesium/Core/GeographicTilingScheme'),
    WebMercatorTilingScheme: require('./cesium/Core/WebMercatorTilingScheme'),
    Color: require('./cesium/Core/Color'),
    Event: require('./cesium/Core/Event'),
    TaskProcessor: require('./cesium/Core/TaskProcessor'),
    Rectangle: require('./cesium/Core/Rectangle'),
    writeTextToCanvas: require('./cesium/Core/writeTextToCanvas')
};
},{"./cesium/Core/Cartesian2":7,"./cesium/Core/Cartesian3":8,"./cesium/Core/Cartesian4":9,"./cesium/Core/Color":12,"./cesium/Core/Event":15,"./cesium/Core/GeographicTilingScheme":19,"./cesium/Core/Math":21,"./cesium/Core/Rectangle":22,"./cesium/Core/TaskProcessor":30,"./cesium/Core/TilingScheme":31,"./cesium/Core/WebMercatorTilingScheme":35,"./cesium/Core/writeTextToCanvas":59,"./cesium/ThirdParty/when":61}],7:[function(require,module,exports){
var Check=require('./Check');
var defaultValue=require('./defaultValue');
var defined=require('./defined');
var DeveloperError=require('./DeveloperError');
var freezeObject=require('./freezeObject');
var CesiumMath=require('./Math');

    'use strict';

    /**
     * A 2D Cartesian point.
     * @alias Cartesian2
     * @constructor
     *
     * @param {Number} [x=0.0] The X component.
     * @param {Number} [y=0.0] The Y component.
     *
     * @see Cartesian3
     * @see Cartesian4
     * @see Packable
     */
    function Cartesian2(x, y) {
        /**
         * The X component.
         * @type {Number}
         * @default 0.0
         */
        this.x = defaultValue(x, 0.0);

        /**
         * The Y component.
         * @type {Number}
         * @default 0.0
         */
        this.y = defaultValue(y, 0.0);
    }

    /**
     * Creates a Cartesian2 instance from x and y coordinates.
     *
     * @param {Number} x The x coordinate.
     * @param {Number} y The y coordinate.
     * @param {Cartesian2} [result] The object onto which to store the result.
     * @returns {Cartesian2} The modified result parameter or a new Cartesian2 instance if one was not provided.
     */
    Cartesian2.fromElements = function(x, y, result) {
        if (!defined(result)) {
            return new Cartesian2(x, y);
        }

        result.x = x;
        result.y = y;
        return result;
    };

    /**
     * Duplicates a Cartesian2 instance.
     *
     * @param {Cartesian2} cartesian The Cartesian to duplicate.
     * @param {Cartesian2} [result] The object onto which to store the result.
     * @returns {Cartesian2} The modified result parameter or a new Cartesian2 instance if one was not provided. (Returns undefined if cartesian is undefined)
     */
    Cartesian2.clone = function(cartesian, result) {
        if (!defined(cartesian)) {
            return undefined;
        }
        if (!defined(result)) {
            return new Cartesian2(cartesian.x, cartesian.y);
        }

        result.x = cartesian.x;
        result.y = cartesian.y;
        return result;
    };

    /**
     * Creates a Cartesian2 instance from an existing Cartesian3.  This simply takes the
     * x and y properties of the Cartesian3 and drops z.
     * @function
     *
     * @param {Cartesian3} cartesian The Cartesian3 instance to create a Cartesian2 instance from.
     * @param {Cartesian2} [result] The object onto which to store the result.
     * @returns {Cartesian2} The modified result parameter or a new Cartesian2 instance if one was not provided.
     */
    Cartesian2.fromCartesian3 = Cartesian2.clone;

    /**
     * Creates a Cartesian2 instance from an existing Cartesian4.  This simply takes the
     * x and y properties of the Cartesian4 and drops z and w.
     * @function
     *
     * @param {Cartesian4} cartesian The Cartesian4 instance to create a Cartesian2 instance from.
     * @param {Cartesian2} [result] The object onto which to store the result.
     * @returns {Cartesian2} The modified result parameter or a new Cartesian2 instance if one was not provided.
     */
    Cartesian2.fromCartesian4 = Cartesian2.clone;

    /**
     * The number of elements used to pack the object into an array.
     * @type {Number}
     */
    Cartesian2.packedLength = 2;

    /**
     * Stores the provided instance into the provided array.
     *
     * @param {Cartesian2} value The value to pack.
     * @param {Number[]} array The array to pack into.
     * @param {Number} [startingIndex=0] The index into the array at which to start packing the elements.
     *
     * @returns {Number[]} The array that was packed into
     */
    Cartesian2.pack = function(value, array, startingIndex) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('value', value);
        Check.defined('array', array);
        //>>includeEnd('debug');

        startingIndex = defaultValue(startingIndex, 0);

        array[startingIndex++] = value.x;
        array[startingIndex] = value.y;

        return array;
    };

    /**
     * Retrieves an instance from a packed array.
     *
     * @param {Number[]} array The packed array.
     * @param {Number} [startingIndex=0] The starting index of the element to be unpacked.
     * @param {Cartesian2} [result] The object into which to store the result.
     * @returns {Cartesian2} The modified result parameter or a new Cartesian2 instance if one was not provided.
     */
    Cartesian2.unpack = function(array, startingIndex, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('array', array);
        //>>includeEnd('debug');

        startingIndex = defaultValue(startingIndex, 0);

        if (!defined(result)) {
            result = new Cartesian2();
        }
        result.x = array[startingIndex++];
        result.y = array[startingIndex];
        return result;
    };

    /**
     * Flattens an array of Cartesian2s into and array of components.
     *
     * @param {Cartesian2[]} array The array of cartesians to pack.
     * @param {Number[]} result The array onto which to store the result.
     * @returns {Number[]} The packed array.
     */
    Cartesian2.packArray = function(array, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('array', array);
        //>>includeEnd('debug');

        var length = array.length;
        if (!defined(result)) {
            result = new Array(length * 2);
        } else {
            result.length = length * 2;
        }

        for (var i = 0; i < length; ++i) {
            Cartesian2.pack(array[i], result, i * 2);
        }
        return result;
    };

    /**
     * Unpacks an array of cartesian components into and array of Cartesian2s.
     *
     * @param {Number[]} array The array of components to unpack.
     * @param {Cartesian2[]} result The array onto which to store the result.
     * @returns {Cartesian2[]} The unpacked array.
     */
    Cartesian2.unpackArray = function(array, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('array', array);
        //>>includeEnd('debug');

        var length = array.length;
        if (!defined(result)) {
            result = new Array(length / 2);
        } else {
            result.length = length / 2;
        }

        for (var i = 0; i < length; i += 2) {
            var index = i / 2;
            result[index] = Cartesian2.unpack(array, i, result[index]);
        }
        return result;
    };

    /**
     * Creates a Cartesian2 from two consecutive elements in an array.
     * @function
     *
     * @param {Number[]} array The array whose two consecutive elements correspond to the x and y components, respectively.
     * @param {Number} [startingIndex=0] The offset into the array of the first element, which corresponds to the x component.
     * @param {Cartesian2} [result] The object onto which to store the result.
     * @returns {Cartesian2} The modified result parameter or a new Cartesian2 instance if one was not provided.
     *
     * @example
     * // Create a Cartesian2 with (1.0, 2.0)
     * var v = [1.0, 2.0];
     * var p = Cesium.Cartesian2.fromArray(v);
     *
     * // Create a Cartesian2 with (1.0, 2.0) using an offset into an array
     * var v2 = [0.0, 0.0, 1.0, 2.0];
     * var p2 = Cesium.Cartesian2.fromArray(v2, 2);
     */
    Cartesian2.fromArray = Cartesian2.unpack;

    /**
     * Computes the value of the maximum component for the supplied Cartesian.
     *
     * @param {Cartesian2} cartesian The cartesian to use.
     * @returns {Number} The value of the maximum component.
     */
    Cartesian2.maximumComponent = function(cartesian) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('cartesian', cartesian);
        //>>includeEnd('debug');

        return Math.max(cartesian.x, cartesian.y);
    };

    /**
     * Computes the value of the minimum component for the supplied Cartesian.
     *
     * @param {Cartesian2} cartesian The cartesian to use.
     * @returns {Number} The value of the minimum component.
     */
    Cartesian2.minimumComponent = function(cartesian) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('cartesian', cartesian);
        //>>includeEnd('debug');

        return Math.min(cartesian.x, cartesian.y);
    };

    /**
     * Compares two Cartesians and computes a Cartesian which contains the minimum components of the supplied Cartesians.
     *
     * @param {Cartesian2} first A cartesian to compare.
     * @param {Cartesian2} second A cartesian to compare.
     * @param {Cartesian2} result The object into which to store the result.
     * @returns {Cartesian2} A cartesian with the minimum components.
     */
    Cartesian2.minimumByComponent = function(first, second, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('first', first);
        Check.typeOf.object('second', second);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.x = Math.min(first.x, second.x);
        result.y = Math.min(first.y, second.y);

        return result;
    };

    /**
     * Compares two Cartesians and computes a Cartesian which contains the maximum components of the supplied Cartesians.
     *
     * @param {Cartesian2} first A cartesian to compare.
     * @param {Cartesian2} second A cartesian to compare.
     * @param {Cartesian2} result The object into which to store the result.
     * @returns {Cartesian2} A cartesian with the maximum components.
     */
    Cartesian2.maximumByComponent = function(first, second, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('first', first);
        Check.typeOf.object('second', second);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.x = Math.max(first.x, second.x);
        result.y = Math.max(first.y, second.y);
        return result;
    };

    /**
     * Computes the provided Cartesian's squared magnitude.
     *
     * @param {Cartesian2} cartesian The Cartesian instance whose squared magnitude is to be computed.
     * @returns {Number} The squared magnitude.
     */
    Cartesian2.magnitudeSquared = function(cartesian) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('cartesian', cartesian);
        //>>includeEnd('debug');

        return cartesian.x * cartesian.x + cartesian.y * cartesian.y;
    };

    /**
     * Computes the Cartesian's magnitude (length).
     *
     * @param {Cartesian2} cartesian The Cartesian instance whose magnitude is to be computed.
     * @returns {Number} The magnitude.
     */
    Cartesian2.magnitude = function(cartesian) {
        return Math.sqrt(Cartesian2.magnitudeSquared(cartesian));
    };

    var distanceScratch = new Cartesian2();

    /**
     * Computes the distance between two points.
     *
     * @param {Cartesian2} left The first point to compute the distance from.
     * @param {Cartesian2} right The second point to compute the distance to.
     * @returns {Number} The distance between two points.
     *
     * @example
     * // Returns 1.0
     * var d = Cesium.Cartesian2.distance(new Cesium.Cartesian2(1.0, 0.0), new Cesium.Cartesian2(2.0, 0.0));
     */
    Cartesian2.distance = function(left, right) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('left', left);
        Check.typeOf.object('right', right);
        //>>includeEnd('debug');

        Cartesian2.subtract(left, right, distanceScratch);
        return Cartesian2.magnitude(distanceScratch);
    };

    /**
     * Computes the squared distance between two points.  Comparing squared distances
     * using this function is more efficient than comparing distances using {@link Cartesian2#distance}.
     *
     * @param {Cartesian2} left The first point to compute the distance from.
     * @param {Cartesian2} right The second point to compute the distance to.
     * @returns {Number} The distance between two points.
     *
     * @example
     * // Returns 4.0, not 2.0
     * var d = Cesium.Cartesian2.distance(new Cesium.Cartesian2(1.0, 0.0), new Cesium.Cartesian2(3.0, 0.0));
     */
    Cartesian2.distanceSquared = function(left, right) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('left', left);
        Check.typeOf.object('right', right);
        //>>includeEnd('debug');

        Cartesian2.subtract(left, right, distanceScratch);
        return Cartesian2.magnitudeSquared(distanceScratch);
    };

    /**
     * Computes the normalized form of the supplied Cartesian.
     *
     * @param {Cartesian2} cartesian The Cartesian to be normalized.
     * @param {Cartesian2} result The object onto which to store the result.
     * @returns {Cartesian2} The modified result parameter.
     */
    Cartesian2.normalize = function(cartesian, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('cartesian', cartesian);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        var magnitude = Cartesian2.magnitude(cartesian);

        result.x = cartesian.x / magnitude;
        result.y = cartesian.y / magnitude;

        //>>includeStart('debug', pragmas.debug);
        if (isNaN(result.x) || isNaN(result.y)) {
            throw new DeveloperError('normalized result is not a number');
        }
        //>>includeEnd('debug');

        return result;
    };

    /**
     * Computes the dot (scalar) product of two Cartesians.
     *
     * @param {Cartesian2} left The first Cartesian.
     * @param {Cartesian2} right The second Cartesian.
     * @returns {Number} The dot product.
     */
    Cartesian2.dot = function(left, right) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('left', left);
        Check.typeOf.object('right', right);
        //>>includeEnd('debug');

        return left.x * right.x + left.y * right.y;
    };

    /**
     * Computes the componentwise product of two Cartesians.
     *
     * @param {Cartesian2} left The first Cartesian.
     * @param {Cartesian2} right The second Cartesian.
     * @param {Cartesian2} result The object onto which to store the result.
     * @returns {Cartesian2} The modified result parameter.
     */
    Cartesian2.multiplyComponents = function(left, right, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('left', left);
        Check.typeOf.object('right', right);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.x = left.x * right.x;
        result.y = left.y * right.y;
        return result;
    };

    /**
     * Computes the componentwise quotient of two Cartesians.
     *
     * @param {Cartesian2} left The first Cartesian.
     * @param {Cartesian2} right The second Cartesian.
     * @param {Cartesian2} result The object onto which to store the result.
     * @returns {Cartesian2} The modified result parameter.
     */
    Cartesian2.divideComponents = function(left, right, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('left', left);
        Check.typeOf.object('right', right);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.x = left.x / right.x;
        result.y = left.y / right.y;
        return result;
    };

    /**
     * Computes the componentwise sum of two Cartesians.
     *
     * @param {Cartesian2} left The first Cartesian.
     * @param {Cartesian2} right The second Cartesian.
     * @param {Cartesian2} result The object onto which to store the result.
     * @returns {Cartesian2} The modified result parameter.
     */
    Cartesian2.add = function(left, right, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('left', left);
        Check.typeOf.object('right', right);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.x = left.x + right.x;
        result.y = left.y + right.y;
        return result;
    };

    /**
     * Computes the componentwise difference of two Cartesians.
     *
     * @param {Cartesian2} left The first Cartesian.
     * @param {Cartesian2} right The second Cartesian.
     * @param {Cartesian2} result The object onto which to store the result.
     * @returns {Cartesian2} The modified result parameter.
     */
    Cartesian2.subtract = function(left, right, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('left', left);
        Check.typeOf.object('right', right);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.x = left.x - right.x;
        result.y = left.y - right.y;
        return result;
    };

    /**
     * Multiplies the provided Cartesian componentwise by the provided scalar.
     *
     * @param {Cartesian2} cartesian The Cartesian to be scaled.
     * @param {Number} scalar The scalar to multiply with.
     * @param {Cartesian2} result The object onto which to store the result.
     * @returns {Cartesian2} The modified result parameter.
     */
    Cartesian2.multiplyByScalar = function(cartesian, scalar, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('cartesian', cartesian);
        Check.typeOf.number('scalar', scalar);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.x = cartesian.x * scalar;
        result.y = cartesian.y * scalar;
        return result;
    };

    /**
     * Divides the provided Cartesian componentwise by the provided scalar.
     *
     * @param {Cartesian2} cartesian The Cartesian to be divided.
     * @param {Number} scalar The scalar to divide by.
     * @param {Cartesian2} result The object onto which to store the result.
     * @returns {Cartesian2} The modified result parameter.
     */
    Cartesian2.divideByScalar = function(cartesian, scalar, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('cartesian', cartesian);
        Check.typeOf.number('scalar', scalar);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.x = cartesian.x / scalar;
        result.y = cartesian.y / scalar;
        return result;
    };

    /**
     * Negates the provided Cartesian.
     *
     * @param {Cartesian2} cartesian The Cartesian to be negated.
     * @param {Cartesian2} result The object onto which to store the result.
     * @returns {Cartesian2} The modified result parameter.
     */
    Cartesian2.negate = function(cartesian, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('cartesian', cartesian);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.x = -cartesian.x;
        result.y = -cartesian.y;
        return result;
    };

    /**
     * Computes the absolute value of the provided Cartesian.
     *
     * @param {Cartesian2} cartesian The Cartesian whose absolute value is to be computed.
     * @param {Cartesian2} result The object onto which to store the result.
     * @returns {Cartesian2} The modified result parameter.
     */
    Cartesian2.abs = function(cartesian, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('cartesian', cartesian);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.x = Math.abs(cartesian.x);
        result.y = Math.abs(cartesian.y);
        return result;
    };

    var lerpScratch = new Cartesian2();
    /**
     * Computes the linear interpolation or extrapolation at t using the provided cartesians.
     *
     * @param {Cartesian2} start The value corresponding to t at 0.0.
     * @param {Cartesian2} end The value corresponding to t at 1.0.
     * @param {Number} t The point along t at which to interpolate.
     * @param {Cartesian2} result The object onto which to store the result.
     * @returns {Cartesian2} The modified result parameter.
     */
    Cartesian2.lerp = function(start, end, t, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('start', start);
        Check.typeOf.object('end', end);
        Check.typeOf.number('t', t);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        Cartesian2.multiplyByScalar(end, t, lerpScratch);
        result = Cartesian2.multiplyByScalar(start, 1.0 - t, result);
        return Cartesian2.add(lerpScratch, result, result);
    };

    var angleBetweenScratch = new Cartesian2();
    var angleBetweenScratch2 = new Cartesian2();
    /**
     * Returns the angle, in radians, between the provided Cartesians.
     *
     * @param {Cartesian2} left The first Cartesian.
     * @param {Cartesian2} right The second Cartesian.
     * @returns {Number} The angle between the Cartesians.
     */
    Cartesian2.angleBetween = function(left, right) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('left', left);
        Check.typeOf.object('right', right);
        //>>includeEnd('debug');

        Cartesian2.normalize(left, angleBetweenScratch);
        Cartesian2.normalize(right, angleBetweenScratch2);
        return CesiumMath.acosClamped(Cartesian2.dot(angleBetweenScratch, angleBetweenScratch2));
    };

    var mostOrthogonalAxisScratch = new Cartesian2();
    /**
     * Returns the axis that is most orthogonal to the provided Cartesian.
     *
     * @param {Cartesian2} cartesian The Cartesian on which to find the most orthogonal axis.
     * @param {Cartesian2} result The object onto which to store the result.
     * @returns {Cartesian2} The most orthogonal axis.
     */
    Cartesian2.mostOrthogonalAxis = function(cartesian, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('cartesian', cartesian);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        var f = Cartesian2.normalize(cartesian, mostOrthogonalAxisScratch);
        Cartesian2.abs(f, f);

        if (f.x <= f.y) {
            result = Cartesian2.clone(Cartesian2.UNIT_X, result);
        } else {
            result = Cartesian2.clone(Cartesian2.UNIT_Y, result);
        }

        return result;
    };

    /**
     * Compares the provided Cartesians componentwise and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     *
     * @param {Cartesian2} [left] The first Cartesian.
     * @param {Cartesian2} [right] The second Cartesian.
     * @returns {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
     */
    Cartesian2.equals = function(left, right) {
        return (left === right) ||
               ((defined(left)) &&
                (defined(right)) &&
                (left.x === right.x) &&
                (left.y === right.y));
    };

    /**
     * @private
     */
    Cartesian2.equalsArray = function(cartesian, array, offset) {
        return cartesian.x === array[offset] &&
               cartesian.y === array[offset + 1];
    };

    /**
     * Compares the provided Cartesians componentwise and returns
     * <code>true</code> if they pass an absolute or relative tolerance test,
     * <code>false</code> otherwise.
     *
     * @param {Cartesian2} [left] The first Cartesian.
     * @param {Cartesian2} [right] The second Cartesian.
     * @param {Number} relativeEpsilon The relative epsilon tolerance to use for equality testing.
     * @param {Number} [absoluteEpsilon=relativeEpsilon] The absolute epsilon tolerance to use for equality testing.
     * @returns {Boolean} <code>true</code> if left and right are within the provided epsilon, <code>false</code> otherwise.
     */
    Cartesian2.equalsEpsilon = function(left, right, relativeEpsilon, absoluteEpsilon) {
        return (left === right) ||
               (defined(left) &&
                defined(right) &&
                CesiumMath.equalsEpsilon(left.x, right.x, relativeEpsilon, absoluteEpsilon) &&
                CesiumMath.equalsEpsilon(left.y, right.y, relativeEpsilon, absoluteEpsilon));
    };

    /**
     * An immutable Cartesian2 instance initialized to (0.0, 0.0).
     *
     * @type {Cartesian2}
     * @constant
     */
    Cartesian2.ZERO = freezeObject(new Cartesian2(0.0, 0.0));

    /**
     * An immutable Cartesian2 instance initialized to (1.0, 0.0).
     *
     * @type {Cartesian2}
     * @constant
     */
    Cartesian2.UNIT_X = freezeObject(new Cartesian2(1.0, 0.0));

    /**
     * An immutable Cartesian2 instance initialized to (0.0, 1.0).
     *
     * @type {Cartesian2}
     * @constant
     */
    Cartesian2.UNIT_Y = freezeObject(new Cartesian2(0.0, 1.0));

    /**
     * Duplicates this Cartesian2 instance.
     *
     * @param {Cartesian2} [result] The object onto which to store the result.
     * @returns {Cartesian2} The modified result parameter or a new Cartesian2 instance if one was not provided.
     */
    Cartesian2.prototype.clone = function(result) {
        return Cartesian2.clone(this, result);
    };

    /**
     * Compares this Cartesian against the provided Cartesian componentwise and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     *
     * @param {Cartesian2} [right] The right hand side Cartesian.
     * @returns {Boolean} <code>true</code> if they are equal, <code>false</code> otherwise.
     */
    Cartesian2.prototype.equals = function(right) {
        return Cartesian2.equals(this, right);
    };

    /**
     * Compares this Cartesian against the provided Cartesian componentwise and returns
     * <code>true</code> if they pass an absolute or relative tolerance test,
     * <code>false</code> otherwise.
     *
     * @param {Cartesian2} [right] The right hand side Cartesian.
     * @param {Number} relativeEpsilon The relative epsilon tolerance to use for equality testing.
     * @param {Number} [absoluteEpsilon=relativeEpsilon] The absolute epsilon tolerance to use for equality testing.
     * @returns {Boolean} <code>true</code> if they are within the provided epsilon, <code>false</code> otherwise.
     */
    Cartesian2.prototype.equalsEpsilon = function(right, relativeEpsilon, absoluteEpsilon) {
        return Cartesian2.equalsEpsilon(this, right, relativeEpsilon, absoluteEpsilon);
    };

    /**
     * Creates a string representing this Cartesian in the format '(x, y)'.
     *
     * @returns {String} A string representing the provided Cartesian in the format '(x, y)'.
     */
    Cartesian2.prototype.toString = function() {
        return '(' + this.x + ', ' + this.y + ')';
    };

    module.exports= Cartesian2;

},{"./Check":11,"./DeveloperError":13,"./Math":21,"./defaultValue":40,"./defined":42,"./freezeObject":45}],8:[function(require,module,exports){
var Check=require('./Check');
var defaultValue=require('./defaultValue');
var defined=require('./defined');
var DeveloperError=require('./DeveloperError');
var freezeObject=require('./freezeObject');
var CesiumMath=require('./Math');

    'use strict';

    /**
     * A 3D Cartesian point.
     * @alias Cartesian3
     * @constructor
     *
     * @param {Number} [x=0.0] The X component.
     * @param {Number} [y=0.0] The Y component.
     * @param {Number} [z=0.0] The Z component.
     *
     * @see Cartesian2
     * @see Cartesian4
     * @see Packable
     */
    function Cartesian3(x, y, z) {
        /**
         * The X component.
         * @type {Number}
         * @default 0.0
         */
        this.x = defaultValue(x, 0.0);

        /**
         * The Y component.
         * @type {Number}
         * @default 0.0
         */
        this.y = defaultValue(y, 0.0);

        /**
         * The Z component.
         * @type {Number}
         * @default 0.0
         */
        this.z = defaultValue(z, 0.0);
    }

    /**
     * Converts the provided Spherical into Cartesian3 coordinates.
     *
     * @param {Spherical} spherical The Spherical to be converted to Cartesian3.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     */
    Cartesian3.fromSpherical = function(spherical, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('spherical', spherical);
        //>>includeEnd('debug');

        if (!defined(result)) {
            result = new Cartesian3();
        }

        var clock = spherical.clock;
        var cone = spherical.cone;
        var magnitude = defaultValue(spherical.magnitude, 1.0);
        var radial = magnitude * Math.sin(cone);
        result.x = radial * Math.cos(clock);
        result.y = radial * Math.sin(clock);
        result.z = magnitude * Math.cos(cone);
        return result;
    };

    /**
     * Creates a Cartesian3 instance from x, y and z coordinates.
     *
     * @param {Number} x The x coordinate.
     * @param {Number} y The y coordinate.
     * @param {Number} z The z coordinate.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     */
    Cartesian3.fromElements = function(x, y, z, result) {
        if (!defined(result)) {
            return new Cartesian3(x, y, z);
        }

        result.x = x;
        result.y = y;
        result.z = z;
        return result;
    };

    /**
     * Duplicates a Cartesian3 instance.
     *
     * @param {Cartesian3} cartesian The Cartesian to duplicate.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided. (Returns undefined if cartesian is undefined)
     */
    Cartesian3.clone = function(cartesian, result) {
        if (!defined(cartesian)) {
            return undefined;
        }
        if (!defined(result)) {
            return new Cartesian3(cartesian.x, cartesian.y, cartesian.z);
        }

        result.x = cartesian.x;
        result.y = cartesian.y;
        result.z = cartesian.z;
        return result;
    };

    /**
     * Creates a Cartesian3 instance from an existing Cartesian4.  This simply takes the
     * x, y, and z properties of the Cartesian4 and drops w.
     * @function
     *
     * @param {Cartesian4} cartesian The Cartesian4 instance to create a Cartesian3 instance from.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     */
    Cartesian3.fromCartesian4 = Cartesian3.clone;

    /**
     * The number of elements used to pack the object into an array.
     * @type {Number}
     */
    Cartesian3.packedLength = 3;

    /**
     * Stores the provided instance into the provided array.
     *
     * @param {Cartesian3} value The value to pack.
     * @param {Number[]} array The array to pack into.
     * @param {Number} [startingIndex=0] The index into the array at which to start packing the elements.
     *
     * @returns {Number[]} The array that was packed into
     */
    Cartesian3.pack = function(value, array, startingIndex) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('value', value);
        Check.defined('array', array);
        //>>includeEnd('debug');

        startingIndex = defaultValue(startingIndex, 0);

        array[startingIndex++] = value.x;
        array[startingIndex++] = value.y;
        array[startingIndex] = value.z;

        return array;
    };

    /**
     * Retrieves an instance from a packed array.
     *
     * @param {Number[]} array The packed array.
     * @param {Number} [startingIndex=0] The starting index of the element to be unpacked.
     * @param {Cartesian3} [result] The object into which to store the result.
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     */
    Cartesian3.unpack = function(array, startingIndex, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('array', array);
        //>>includeEnd('debug');

        startingIndex = defaultValue(startingIndex, 0);

        if (!defined(result)) {
            result = new Cartesian3();
        }
        result.x = array[startingIndex++];
        result.y = array[startingIndex++];
        result.z = array[startingIndex];
        return result;
    };

    /**
     * Flattens an array of Cartesian3s into an array of components.
     *
     * @param {Cartesian3[]} array The array of cartesians to pack.
     * @param {Number[]} result The array onto which to store the result.
     * @returns {Number[]} The packed array.
     */
    Cartesian3.packArray = function(array, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('array', array);
        //>>includeEnd('debug');

        var length = array.length;
        if (!defined(result)) {
            result = new Array(length * 3);
        } else {
            result.length = length * 3;
        }

        for (var i = 0; i < length; ++i) {
            Cartesian3.pack(array[i], result, i * 3);
        }
        return result;
    };

    /**
     * Unpacks an array of cartesian components into an array of Cartesian3s.
     *
     * @param {Number[]} array The array of components to unpack.
     * @param {Cartesian3[]} result The array onto which to store the result.
     * @returns {Cartesian3[]} The unpacked array.
     */
    Cartesian3.unpackArray = function(array, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('array', array);
        Check.typeOf.number.greaterThanOrEquals('array.length', array.length, 3);
        if (array.length % 3 !== 0) {
            throw new DeveloperError('array length must be a multiple of 3.');
        }
        //>>includeEnd('debug');

        var length = array.length;
        if (!defined(result)) {
            result = new Array(length / 3);
        } else {
            result.length = length / 3;
        }

        for (var i = 0; i < length; i += 3) {
            var index = i / 3;
            result[index] = Cartesian3.unpack(array, i, result[index]);
        }
        return result;
    };

    /**
     * Creates a Cartesian3 from three consecutive elements in an array.
     * @function
     *
     * @param {Number[]} array The array whose three consecutive elements correspond to the x, y, and z components, respectively.
     * @param {Number} [startingIndex=0] The offset into the array of the first element, which corresponds to the x component.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @example
     * // Create a Cartesian3 with (1.0, 2.0, 3.0)
     * var v = [1.0, 2.0, 3.0];
     * var p = Cesium.Cartesian3.fromArray(v);
     *
     * // Create a Cartesian3 with (1.0, 2.0, 3.0) using an offset into an array
     * var v2 = [0.0, 0.0, 1.0, 2.0, 3.0];
     * var p2 = Cesium.Cartesian3.fromArray(v2, 2);
     */
    Cartesian3.fromArray = Cartesian3.unpack;

    /**
     * Computes the value of the maximum component for the supplied Cartesian.
     *
     * @param {Cartesian3} cartesian The cartesian to use.
     * @returns {Number} The value of the maximum component.
     */
    Cartesian3.maximumComponent = function(cartesian) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('cartesian', cartesian);
        //>>includeEnd('debug');

        return Math.max(cartesian.x, cartesian.y, cartesian.z);
    };

    /**
     * Computes the value of the minimum component for the supplied Cartesian.
     *
     * @param {Cartesian3} cartesian The cartesian to use.
     * @returns {Number} The value of the minimum component.
     */
    Cartesian3.minimumComponent = function(cartesian) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('cartesian', cartesian);
        //>>includeEnd('debug');

        return Math.min(cartesian.x, cartesian.y, cartesian.z);
    };

    /**
     * Compares two Cartesians and computes a Cartesian which contains the minimum components of the supplied Cartesians.
     *
     * @param {Cartesian3} first A cartesian to compare.
     * @param {Cartesian3} second A cartesian to compare.
     * @param {Cartesian3} result The object into which to store the result.
     * @returns {Cartesian3} A cartesian with the minimum components.
     */
    Cartesian3.minimumByComponent = function(first, second, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('first', first);
        Check.typeOf.object('second', second);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.x = Math.min(first.x, second.x);
        result.y = Math.min(first.y, second.y);
        result.z = Math.min(first.z, second.z);

        return result;
    };

    /**
     * Compares two Cartesians and computes a Cartesian which contains the maximum components of the supplied Cartesians.
     *
     * @param {Cartesian3} first A cartesian to compare.
     * @param {Cartesian3} second A cartesian to compare.
     * @param {Cartesian3} result The object into which to store the result.
     * @returns {Cartesian3} A cartesian with the maximum components.
     */
    Cartesian3.maximumByComponent = function(first, second, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('first', first);
        Check.typeOf.object('second', second);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.x = Math.max(first.x, second.x);
        result.y = Math.max(first.y, second.y);
        result.z = Math.max(first.z, second.z);
        return result;
    };

    /**
     * Computes the provided Cartesian's squared magnitude.
     *
     * @param {Cartesian3} cartesian The Cartesian instance whose squared magnitude is to be computed.
     * @returns {Number} The squared magnitude.
     */
    Cartesian3.magnitudeSquared = function(cartesian) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('cartesian', cartesian);
        //>>includeEnd('debug');

        return cartesian.x * cartesian.x + cartesian.y * cartesian.y + cartesian.z * cartesian.z;
    };

    /**
     * Computes the Cartesian's magnitude (length).
     *
     * @param {Cartesian3} cartesian The Cartesian instance whose magnitude is to be computed.
     * @returns {Number} The magnitude.
     */
    Cartesian3.magnitude = function(cartesian) {
        return Math.sqrt(Cartesian3.magnitudeSquared(cartesian));
    };

    var distanceScratch = new Cartesian3();

    /**
     * Computes the distance between two points.
     *
     * @param {Cartesian3} left The first point to compute the distance from.
     * @param {Cartesian3} right The second point to compute the distance to.
     * @returns {Number} The distance between two points.
     *
     * @example
     * // Returns 1.0
     * var d = Cesium.Cartesian3.distance(new Cesium.Cartesian3(1.0, 0.0, 0.0), new Cesium.Cartesian3(2.0, 0.0, 0.0));
     */
    Cartesian3.distance = function(left, right) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('left', left);
        Check.typeOf.object('right', right);
        //>>includeEnd('debug');

        Cartesian3.subtract(left, right, distanceScratch);
        return Cartesian3.magnitude(distanceScratch);
    };

    /**
     * Computes the squared distance between two points.  Comparing squared distances
     * using this function is more efficient than comparing distances using {@link Cartesian3#distance}.
     *
     * @param {Cartesian3} left The first point to compute the distance from.
     * @param {Cartesian3} right The second point to compute the distance to.
     * @returns {Number} The distance between two points.
     *
     * @example
     * // Returns 4.0, not 2.0
     * var d = Cesium.Cartesian3.distanceSquared(new Cesium.Cartesian3(1.0, 0.0, 0.0), new Cesium.Cartesian3(3.0, 0.0, 0.0));
     */
    Cartesian3.distanceSquared = function(left, right) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('left', left);
        Check.typeOf.object('right', right);
        //>>includeEnd('debug');

        Cartesian3.subtract(left, right, distanceScratch);
        return Cartesian3.magnitudeSquared(distanceScratch);
    };

    /**
     * Computes the normalized form of the supplied Cartesian.
     *
     * @param {Cartesian3} cartesian The Cartesian to be normalized.
     * @param {Cartesian3} result The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter.
     */
    Cartesian3.normalize = function(cartesian, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('cartesian', cartesian);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        var magnitude = Cartesian3.magnitude(cartesian);

        result.x = cartesian.x / magnitude;
        result.y = cartesian.y / magnitude;
        result.z = cartesian.z / magnitude;

        //>>includeStart('debug', pragmas.debug);
        if (isNaN(result.x) || isNaN(result.y) || isNaN(result.z)) {
            throw new DeveloperError('normalized result is not a number');
        }
        //>>includeEnd('debug');

        return result;
    };

    /**
     * Computes the dot (scalar) product of two Cartesians.
     *
     * @param {Cartesian3} left The first Cartesian.
     * @param {Cartesian3} right The second Cartesian.
     * @returns {Number} The dot product.
     */
    Cartesian3.dot = function(left, right) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('left', left);
        Check.typeOf.object('right', right);
        //>>includeEnd('debug');

        return left.x * right.x + left.y * right.y + left.z * right.z;
    };

    /**
     * Computes the componentwise product of two Cartesians.
     *
     * @param {Cartesian3} left The first Cartesian.
     * @param {Cartesian3} right The second Cartesian.
     * @param {Cartesian3} result The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter.
     */
    Cartesian3.multiplyComponents = function(left, right, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('left', left);
        Check.typeOf.object('right', right);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.x = left.x * right.x;
        result.y = left.y * right.y;
        result.z = left.z * right.z;
        return result;
    };

    /**
     * Computes the componentwise quotient of two Cartesians.
     *
     * @param {Cartesian3} left The first Cartesian.
     * @param {Cartesian3} right The second Cartesian.
     * @param {Cartesian3} result The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter.
     */
    Cartesian3.divideComponents = function(left, right, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('left', left);
        Check.typeOf.object('right', right);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.x = left.x / right.x;
        result.y = left.y / right.y;
        result.z = left.z / right.z;
        return result;
    };

    /**
     * Computes the componentwise sum of two Cartesians.
     *
     * @param {Cartesian3} left The first Cartesian.
     * @param {Cartesian3} right The second Cartesian.
     * @param {Cartesian3} result The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter.
     */
    Cartesian3.add = function(left, right, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('left', left);
        Check.typeOf.object('right', right);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.x = left.x + right.x;
        result.y = left.y + right.y;
        result.z = left.z + right.z;
        return result;
    };

    /**
     * Computes the componentwise difference of two Cartesians.
     *
     * @param {Cartesian3} left The first Cartesian.
     * @param {Cartesian3} right The second Cartesian.
     * @param {Cartesian3} result The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter.
     */
    Cartesian3.subtract = function(left, right, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('left', left);
        Check.typeOf.object('right', right);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.x = left.x - right.x;
        result.y = left.y - right.y;
        result.z = left.z - right.z;
        return result;
    };

    /**
     * Multiplies the provided Cartesian componentwise by the provided scalar.
     *
     * @param {Cartesian3} cartesian The Cartesian to be scaled.
     * @param {Number} scalar The scalar to multiply with.
     * @param {Cartesian3} result The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter.
     */
    Cartesian3.multiplyByScalar = function(cartesian, scalar, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('cartesian', cartesian);
        Check.typeOf.number('scalar', scalar);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.x = cartesian.x * scalar;
        result.y = cartesian.y * scalar;
        result.z = cartesian.z * scalar;
        return result;
    };

    /**
     * Divides the provided Cartesian componentwise by the provided scalar.
     *
     * @param {Cartesian3} cartesian The Cartesian to be divided.
     * @param {Number} scalar The scalar to divide by.
     * @param {Cartesian3} result The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter.
     */
    Cartesian3.divideByScalar = function(cartesian, scalar, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('cartesian', cartesian);
        Check.typeOf.number('scalar', scalar);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.x = cartesian.x / scalar;
        result.y = cartesian.y / scalar;
        result.z = cartesian.z / scalar;
        return result;
    };

    /**
     * Negates the provided Cartesian.
     *
     * @param {Cartesian3} cartesian The Cartesian to be negated.
     * @param {Cartesian3} result The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter.
     */
    Cartesian3.negate = function(cartesian, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('cartesian', cartesian);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.x = -cartesian.x;
        result.y = -cartesian.y;
        result.z = -cartesian.z;
        return result;
    };

    /**
     * Computes the absolute value of the provided Cartesian.
     *
     * @param {Cartesian3} cartesian The Cartesian whose absolute value is to be computed.
     * @param {Cartesian3} result The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter.
     */
    Cartesian3.abs = function(cartesian, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('cartesian', cartesian);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.x = Math.abs(cartesian.x);
        result.y = Math.abs(cartesian.y);
        result.z = Math.abs(cartesian.z);
        return result;
    };

    var lerpScratch = new Cartesian3();
    /**
     * Computes the linear interpolation or extrapolation at t using the provided cartesians.
     *
     * @param {Cartesian3} start The value corresponding to t at 0.0.
     * @param {Cartesian3} end The value corresponding to t at 1.0.
     * @param {Number} t The point along t at which to interpolate.
     * @param {Cartesian3} result The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter.
     */
    Cartesian3.lerp = function(start, end, t, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('start', start);
        Check.typeOf.object('end', end);
        Check.typeOf.number('t', t);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        Cartesian3.multiplyByScalar(end, t, lerpScratch);
        result = Cartesian3.multiplyByScalar(start, 1.0 - t, result);
        return Cartesian3.add(lerpScratch, result, result);
    };

    var angleBetweenScratch = new Cartesian3();
    var angleBetweenScratch2 = new Cartesian3();
    /**
     * Returns the angle, in radians, between the provided Cartesians.
     *
     * @param {Cartesian3} left The first Cartesian.
     * @param {Cartesian3} right The second Cartesian.
     * @returns {Number} The angle between the Cartesians.
     */
    Cartesian3.angleBetween = function(left, right) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('left', left);
        Check.typeOf.object('right', right);
        //>>includeEnd('debug');

        Cartesian3.normalize(left, angleBetweenScratch);
        Cartesian3.normalize(right, angleBetweenScratch2);
        var cosine = Cartesian3.dot(angleBetweenScratch, angleBetweenScratch2);
        var sine = Cartesian3.magnitude(Cartesian3.cross(angleBetweenScratch, angleBetweenScratch2, angleBetweenScratch));
        return Math.atan2(sine, cosine);
    };

    var mostOrthogonalAxisScratch = new Cartesian3();
    /**
     * Returns the axis that is most orthogonal to the provided Cartesian.
     *
     * @param {Cartesian3} cartesian The Cartesian on which to find the most orthogonal axis.
     * @param {Cartesian3} result The object onto which to store the result.
     * @returns {Cartesian3} The most orthogonal axis.
     */
    Cartesian3.mostOrthogonalAxis = function(cartesian, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('cartesian', cartesian);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        var f = Cartesian3.normalize(cartesian, mostOrthogonalAxisScratch);
        Cartesian3.abs(f, f);

        if (f.x <= f.y) {
            if (f.x <= f.z) {
                result = Cartesian3.clone(Cartesian3.UNIT_X, result);
            } else {
                result = Cartesian3.clone(Cartesian3.UNIT_Z, result);
            }
        } else if (f.y <= f.z) {
            result = Cartesian3.clone(Cartesian3.UNIT_Y, result);
        } else {
            result = Cartesian3.clone(Cartesian3.UNIT_Z, result);
        }

        return result;
    };

    /**
     * Projects vector a onto vector b
     * @param {Cartesian3} a The vector that needs projecting
     * @param {Cartesian3} b The vector to project onto
     * @param {Cartesian3} result The result cartesian
     * @returns {Cartesian3} The modified result parameter
     */
    Cartesian3.projectVector = function(a, b, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('a', a);
        Check.defined('b', b);
        Check.defined('result', result);
        //>>includeEnd('debug');

        var scalar = Cartesian3.dot(a, b) / Cartesian3.dot(b, b);
        return Cartesian3.multiplyByScalar(b, scalar, result);
    };

    /**
     * Compares the provided Cartesians componentwise and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     *
     * @param {Cartesian3} [left] The first Cartesian.
     * @param {Cartesian3} [right] The second Cartesian.
     * @returns {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
     */
    Cartesian3.equals = function(left, right) {
            return (left === right) ||
              ((defined(left)) &&
               (defined(right)) &&
               (left.x === right.x) &&
               (left.y === right.y) &&
               (left.z === right.z));
    };

    /**
     * @private
     */
    Cartesian3.equalsArray = function(cartesian, array, offset) {
        return cartesian.x === array[offset] &&
               cartesian.y === array[offset + 1] &&
               cartesian.z === array[offset + 2];
    };

    /**
     * Compares the provided Cartesians componentwise and returns
     * <code>true</code> if they pass an absolute or relative tolerance test,
     * <code>false</code> otherwise.
     *
     * @param {Cartesian3} [left] The first Cartesian.
     * @param {Cartesian3} [right] The second Cartesian.
     * @param {Number} relativeEpsilon The relative epsilon tolerance to use for equality testing.
     * @param {Number} [absoluteEpsilon=relativeEpsilon] The absolute epsilon tolerance to use for equality testing.
     * @returns {Boolean} <code>true</code> if left and right are within the provided epsilon, <code>false</code> otherwise.
     */
    Cartesian3.equalsEpsilon = function(left, right, relativeEpsilon, absoluteEpsilon) {
        return (left === right) ||
               (defined(left) &&
                defined(right) &&
                CesiumMath.equalsEpsilon(left.x, right.x, relativeEpsilon, absoluteEpsilon) &&
                CesiumMath.equalsEpsilon(left.y, right.y, relativeEpsilon, absoluteEpsilon) &&
                CesiumMath.equalsEpsilon(left.z, right.z, relativeEpsilon, absoluteEpsilon));
    };

    /**
     * Computes the cross (outer) product of two Cartesians.
     *
     * @param {Cartesian3} left The first Cartesian.
     * @param {Cartesian3} right The second Cartesian.
     * @param {Cartesian3} result The object onto which to store the result.
     * @returns {Cartesian3} The cross product.
     */
    Cartesian3.cross = function(left, right, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('left', left);
        Check.typeOf.object('right', right);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        var leftX = left.x;
        var leftY = left.y;
        var leftZ = left.z;
        var rightX = right.x;
        var rightY = right.y;
        var rightZ = right.z;

        var x = leftY * rightZ - leftZ * rightY;
        var y = leftZ * rightX - leftX * rightZ;
        var z = leftX * rightY - leftY * rightX;

        result.x = x;
        result.y = y;
        result.z = z;
        return result;
    };

    /**
     * Computes the midpoint between the right and left Cartesian.
     * @param {Cartesian3} left The first Cartesian.
     * @param {Cartesian3} right The second Cartesian.
     * @param {Cartesian3} result The object onto which to store the result.
     * @returns {Cartesian3} The midpoint.
     */
    Cartesian3.midpoint = function(left, right, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('left', left);
        Check.typeOf.object('right', right);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.x = (left.x + right.x) * 0.5;
        result.y = (left.y + right.y) * 0.5;
        result.z = (left.z + right.z) * 0.5;

        return result;
    };

    /**
     * Returns a Cartesian3 position from longitude and latitude values given in degrees.
     *
     * @param {Number} longitude The longitude, in degrees
     * @param {Number} latitude The latitude, in degrees
     * @param {Number} [height=0.0] The height, in meters, above the ellipsoid.
     * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid on which the position lies.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @returns {Cartesian3} The position
     *
     * @example
     * var position = Cesium.Cartesian3.fromDegrees(-115.0, 37.0);
     */
    Cartesian3.fromDegrees = function(longitude, latitude, height, ellipsoid, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.number('longitude', longitude);
        Check.typeOf.number('latitude', latitude);
        //>>includeEnd('debug');

        longitude = CesiumMath.toRadians(longitude);
        latitude = CesiumMath.toRadians(latitude);
        return Cartesian3.fromRadians(longitude, latitude, height, ellipsoid, result);
    };

    var scratchN = new Cartesian3();
    var scratchK = new Cartesian3();
    var wgs84RadiiSquared = new Cartesian3(6378137.0 * 6378137.0, 6378137.0 * 6378137.0, 6356752.3142451793 * 6356752.3142451793);

    /**
     * Returns a Cartesian3 position from longitude and latitude values given in radians.
     *
     * @param {Number} longitude The longitude, in radians
     * @param {Number} latitude The latitude, in radians
     * @param {Number} [height=0.0] The height, in meters, above the ellipsoid.
     * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid on which the position lies.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @returns {Cartesian3} The position
     *
     * @example
     * var position = Cesium.Cartesian3.fromRadians(-2.007, 0.645);
     */
    Cartesian3.fromRadians = function(longitude, latitude, height, ellipsoid, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.number('longitude', longitude);
        Check.typeOf.number('latitude', latitude);
        //>>includeEnd('debug');

        height = defaultValue(height, 0.0);
        var radiiSquared = defined(ellipsoid) ? ellipsoid.radiiSquared : wgs84RadiiSquared;

        var cosLatitude = Math.cos(latitude);
        scratchN.x = cosLatitude * Math.cos(longitude);
        scratchN.y = cosLatitude * Math.sin(longitude);
        scratchN.z = Math.sin(latitude);
        scratchN = Cartesian3.normalize(scratchN, scratchN);

        Cartesian3.multiplyComponents(radiiSquared, scratchN, scratchK);
        var gamma = Math.sqrt(Cartesian3.dot(scratchN, scratchK));
        scratchK = Cartesian3.divideByScalar(scratchK, gamma, scratchK);
        scratchN = Cartesian3.multiplyByScalar(scratchN, height, scratchN);

        if (!defined(result)) {
            result = new Cartesian3();
        }
        return Cartesian3.add(scratchK, scratchN, result);
    };

    /**
     * Returns an array of Cartesian3 positions given an array of longitude and latitude values given in degrees.
     *
     * @param {Number[]} coordinates A list of longitude and latitude values. Values alternate [longitude, latitude, longitude, latitude...].
     * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid on which the coordinates lie.
     * @param {Cartesian3[]} [result] An array of Cartesian3 objects to store the result.
     * @returns {Cartesian3[]} The array of positions.
     *
     * @example
     * var positions = Cesium.Cartesian3.fromDegreesArray([-115.0, 37.0, -107.0, 33.0]);
     */
    Cartesian3.fromDegreesArray = function(coordinates, ellipsoid, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('coordinates', coordinates);
        if (coordinates.length < 2 || coordinates.length % 2 !== 0) {
            throw new DeveloperError('the number of coordinates must be a multiple of 2 and at least 2');
        }
        //>>includeEnd('debug');

        var length = coordinates.length;
        if (!defined(result)) {
            result = new Array(length / 2);
        } else {
            result.length = length / 2;
        }

        for (var i = 0; i < length; i += 2) {
            var longitude = coordinates[i];
            var latitude = coordinates[i + 1];
            var index = i / 2;
            result[index] = Cartesian3.fromDegrees(longitude, latitude, 0, ellipsoid, result[index]);
        }

        return result;
    };

    /**
     * Returns an array of Cartesian3 positions given an array of longitude and latitude values given in radians.
     *
     * @param {Number[]} coordinates A list of longitude and latitude values. Values alternate [longitude, latitude, longitude, latitude...].
     * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid on which the coordinates lie.
     * @param {Cartesian3[]} [result] An array of Cartesian3 objects to store the result.
     * @returns {Cartesian3[]} The array of positions.
     *
     * @example
     * var positions = Cesium.Cartesian3.fromRadiansArray([-2.007, 0.645, -1.867, .575]);
     */
    Cartesian3.fromRadiansArray = function(coordinates, ellipsoid, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('coordinates', coordinates);
        if (coordinates.length < 2 || coordinates.length % 2 !== 0) {
            throw new DeveloperError('the number of coordinates must be a multiple of 2 and at least 2');
        }
        //>>includeEnd('debug');

        var length = coordinates.length;
        if (!defined(result)) {
            result = new Array(length / 2);
        } else {
            result.length = length / 2;
        }

        for (var i = 0; i < length; i += 2) {
            var longitude = coordinates[i];
            var latitude = coordinates[i + 1];
            var index = i / 2;
            result[index] = Cartesian3.fromRadians(longitude, latitude, 0, ellipsoid, result[index]);
        }

        return result;
    };

    /**
     * Returns an array of Cartesian3 positions given an array of longitude, latitude and height values where longitude and latitude are given in degrees.
     *
     * @param {Number[]} coordinates A list of longitude, latitude and height values. Values alternate [longitude, latitude, height, longitude, latitude, height...].
     * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid on which the position lies.
     * @param {Cartesian3[]} [result] An array of Cartesian3 objects to store the result.
     * @returns {Cartesian3[]} The array of positions.
     *
     * @example
     * var positions = Cesium.Cartesian3.fromDegreesArrayHeights([-115.0, 37.0, 100000.0, -107.0, 33.0, 150000.0]);
     */
    Cartesian3.fromDegreesArrayHeights = function(coordinates, ellipsoid, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('coordinates', coordinates);
        if (coordinates.length < 3 || coordinates.length % 3 !== 0) {
            throw new DeveloperError('the number of coordinates must be a multiple of 3 and at least 3');
        }
        //>>includeEnd('debug');

        var length = coordinates.length;
        if (!defined(result)) {
            result = new Array(length / 3);
        } else {
            result.length = length / 3;
        }

        for (var i = 0; i < length; i += 3) {
            var longitude = coordinates[i];
            var latitude = coordinates[i + 1];
            var height = coordinates[i + 2];
            var index = i / 3;
            result[index] = Cartesian3.fromDegrees(longitude, latitude, height, ellipsoid, result[index]);
        }

        return result;
    };

    /**
     * Returns an array of Cartesian3 positions given an array of longitude, latitude and height values where longitude and latitude are given in radians.
     *
     * @param {Number[]} coordinates A list of longitude, latitude and height values. Values alternate [longitude, latitude, height, longitude, latitude, height...].
     * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid on which the position lies.
     * @param {Cartesian3[]} [result] An array of Cartesian3 objects to store the result.
     * @returns {Cartesian3[]} The array of positions.
     *
     * @example
     * var positions = Cesium.Cartesian3.fromRadiansArrayHeights([-2.007, 0.645, 100000.0, -1.867, .575, 150000.0]);
     */
    Cartesian3.fromRadiansArrayHeights = function(coordinates, ellipsoid, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('coordinates', coordinates);
        if (coordinates.length < 3 || coordinates.length % 3 !== 0) {
            throw new DeveloperError('the number of coordinates must be a multiple of 3 and at least 3');
        }
        //>>includeEnd('debug');

        var length = coordinates.length;
        if (!defined(result)) {
            result = new Array(length / 3);
        } else {
            result.length = length / 3;
        }

        for (var i = 0; i < length; i += 3) {
            var longitude = coordinates[i];
            var latitude = coordinates[i + 1];
            var height = coordinates[i + 2];
            var index = i / 3;
            result[index] = Cartesian3.fromRadians(longitude, latitude, height, ellipsoid, result[index]);
        }

        return result;
    };

    /**
     * An immutable Cartesian3 instance initialized to (0.0, 0.0, 0.0).
     *
     * @type {Cartesian3}
     * @constant
     */
    Cartesian3.ZERO = freezeObject(new Cartesian3(0.0, 0.0, 0.0));

    /**
     * An immutable Cartesian3 instance initialized to (1.0, 0.0, 0.0).
     *
     * @type {Cartesian3}
     * @constant
     */
    Cartesian3.UNIT_X = freezeObject(new Cartesian3(1.0, 0.0, 0.0));

    /**
     * An immutable Cartesian3 instance initialized to (0.0, 1.0, 0.0).
     *
     * @type {Cartesian3}
     * @constant
     */
    Cartesian3.UNIT_Y = freezeObject(new Cartesian3(0.0, 1.0, 0.0));

    /**
     * An immutable Cartesian3 instance initialized to (0.0, 0.0, 1.0).
     *
     * @type {Cartesian3}
     * @constant
     */
    Cartesian3.UNIT_Z = freezeObject(new Cartesian3(0.0, 0.0, 1.0));

    /**
     * Duplicates this Cartesian3 instance.
     *
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     */
    Cartesian3.prototype.clone = function(result) {
        return Cartesian3.clone(this, result);
    };

    /**
     * Compares this Cartesian against the provided Cartesian componentwise and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     *
     * @param {Cartesian3} [right] The right hand side Cartesian.
     * @returns {Boolean} <code>true</code> if they are equal, <code>false</code> otherwise.
     */
    Cartesian3.prototype.equals = function(right) {
        return Cartesian3.equals(this, right);
    };

    /**
     * Compares this Cartesian against the provided Cartesian componentwise and returns
     * <code>true</code> if they pass an absolute or relative tolerance test,
     * <code>false</code> otherwise.
     *
     * @param {Cartesian3} [right] The right hand side Cartesian.
     * @param {Number} relativeEpsilon The relative epsilon tolerance to use for equality testing.
     * @param {Number} [absoluteEpsilon=relativeEpsilon] The absolute epsilon tolerance to use for equality testing.
     * @returns {Boolean} <code>true</code> if they are within the provided epsilon, <code>false</code> otherwise.
     */
    Cartesian3.prototype.equalsEpsilon = function(right, relativeEpsilon, absoluteEpsilon) {
        return Cartesian3.equalsEpsilon(this, right, relativeEpsilon, absoluteEpsilon);
    };

    /**
     * Creates a string representing this Cartesian in the format '(x, y, z)'.
     *
     * @returns {String} A string representing this Cartesian in the format '(x, y, z)'.
     */
    Cartesian3.prototype.toString = function() {
        return '(' + this.x + ', ' + this.y + ', ' + this.z + ')';
    };

    module.exports= Cartesian3;

},{"./Check":11,"./DeveloperError":13,"./Math":21,"./defaultValue":40,"./defined":42,"./freezeObject":45}],9:[function(require,module,exports){
var Check=require('./Check');
var defaultValue=require('./defaultValue');
var defined=require('./defined');
var DeveloperError=require('./DeveloperError');
var freezeObject=require('./freezeObject');
var CesiumMath=require('./Math');

    'use strict';

    /**
     * A 4D Cartesian point.
     * @alias Cartesian4
     * @constructor
     *
     * @param {Number} [x=0.0] The X component.
     * @param {Number} [y=0.0] The Y component.
     * @param {Number} [z=0.0] The Z component.
     * @param {Number} [w=0.0] The W component.
     *
     * @see Cartesian2
     * @see Cartesian3
     * @see Packable
     */
    function Cartesian4(x, y, z, w) {
        /**
         * The X component.
         * @type {Number}
         * @default 0.0
         */
        this.x = defaultValue(x, 0.0);

        /**
         * The Y component.
         * @type {Number}
         * @default 0.0
         */
        this.y = defaultValue(y, 0.0);

        /**
         * The Z component.
         * @type {Number}
         * @default 0.0
         */
        this.z = defaultValue(z, 0.0);

        /**
         * The W component.
         * @type {Number}
         * @default 0.0
         */
        this.w = defaultValue(w, 0.0);
    }

    /**
     * Creates a Cartesian4 instance from x, y, z and w coordinates.
     *
     * @param {Number} x The x coordinate.
     * @param {Number} y The y coordinate.
     * @param {Number} z The z coordinate.
     * @param {Number} w The w coordinate.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     */
    Cartesian4.fromElements = function(x, y, z, w, result) {
        if (!defined(result)) {
            return new Cartesian4(x, y, z, w);
        }

        result.x = x;
        result.y = y;
        result.z = z;
        result.w = w;
        return result;
    };

    /**
     * Creates a Cartesian4 instance from a {@link Color}. <code>red</code>, <code>green</code>, <code>blue</code>,
     * and <code>alpha</code> map to <code>x</code>, <code>y</code>, <code>z</code>, and <code>w</code>, respectively.
     *
     * @param {Color} color The source color.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     */
    Cartesian4.fromColor = function(color, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('color', color);
        //>>includeEnd('debug');
        if (!defined(result)) {
            return new Cartesian4(color.red, color.green, color.blue, color.alpha);
        }

        result.x = color.red;
        result.y = color.green;
        result.z = color.blue;
        result.w = color.alpha;
        return result;
    };

    /**
     * Duplicates a Cartesian4 instance.
     *
     * @param {Cartesian4} cartesian The Cartesian to duplicate.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided. (Returns undefined if cartesian is undefined)
     */
    Cartesian4.clone = function(cartesian, result) {
        if (!defined(cartesian)) {
            return undefined;
        }

        if (!defined(result)) {
            return new Cartesian4(cartesian.x, cartesian.y, cartesian.z, cartesian.w);
        }

        result.x = cartesian.x;
        result.y = cartesian.y;
        result.z = cartesian.z;
        result.w = cartesian.w;
        return result;
    };

    /**
     * The number of elements used to pack the object into an array.
     * @type {Number}
     */
    Cartesian4.packedLength = 4;

    /**
     * Stores the provided instance into the provided array.
     *
     * @param {Cartesian4} value The value to pack.
     * @param {Number[]} array The array to pack into.
     * @param {Number} [startingIndex=0] The index into the array at which to start packing the elements.
     *
     * @returns {Number[]} The array that was packed into
     */
    Cartesian4.pack = function(value, array, startingIndex) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('value', value);
        Check.defined('array', array);
        //>>includeEnd('debug');

        startingIndex = defaultValue(startingIndex, 0);

        array[startingIndex++] = value.x;
        array[startingIndex++] = value.y;
        array[startingIndex++] = value.z;
        array[startingIndex] = value.w;

        return array;
    };

    /**
     * Retrieves an instance from a packed array.
     *
     * @param {Number[]} array The packed array.
     * @param {Number} [startingIndex=0] The starting index of the element to be unpacked.
     * @param {Cartesian4} [result] The object into which to store the result.
     * @returns {Cartesian4}  The modified result parameter or a new Cartesian4 instance if one was not provided.
     */
    Cartesian4.unpack = function(array, startingIndex, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('array', array);
        //>>includeEnd('debug');

        startingIndex = defaultValue(startingIndex, 0);

        if (!defined(result)) {
            result = new Cartesian4();
        }
        result.x = array[startingIndex++];
        result.y = array[startingIndex++];
        result.z = array[startingIndex++];
        result.w = array[startingIndex];
        return result;
    };

    /**
     * Flattens an array of Cartesian4s into and array of components.
     *
     * @param {Cartesian4[]} array The array of cartesians to pack.
     * @param {Number[]} result The array onto which to store the result.
     * @returns {Number[]} The packed array.
     */
    Cartesian4.packArray = function(array, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('array', array);
        //>>includeEnd('debug');

        var length = array.length;
        if (!defined(result)) {
            result = new Array(length * 4);
        } else {
            result.length = length * 4;
        }

        for (var i = 0; i < length; ++i) {
            Cartesian4.pack(array[i], result, i * 4);
        }
        return result;
    };

    /**
     * Unpacks an array of cartesian components into and array of Cartesian4s.
     *
     * @param {Number[]} array The array of components to unpack.
     * @param {Cartesian4[]} result The array onto which to store the result.
     * @returns {Cartesian4[]} The unpacked array.
     */
    Cartesian4.unpackArray = function(array, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('array', array);
        //>>includeEnd('debug');

        var length = array.length;
        if (!defined(result)) {
            result = new Array(length / 4);
        } else {
            result.length = length / 4;
        }

        for (var i = 0; i < length; i += 4) {
            var index = i / 4;
            result[index] = Cartesian4.unpack(array, i, result[index]);
        }
        return result;
    };

    /**
     * Creates a Cartesian4 from four consecutive elements in an array.
     * @function
     *
     * @param {Number[]} array The array whose four consecutive elements correspond to the x, y, z, and w components, respectively.
     * @param {Number} [startingIndex=0] The offset into the array of the first element, which corresponds to the x component.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @returns {Cartesian4}  The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @example
     * // Create a Cartesian4 with (1.0, 2.0, 3.0, 4.0)
     * var v = [1.0, 2.0, 3.0, 4.0];
     * var p = Cesium.Cartesian4.fromArray(v);
     *
     * // Create a Cartesian4 with (1.0, 2.0, 3.0, 4.0) using an offset into an array
     * var v2 = [0.0, 0.0, 1.0, 2.0, 3.0, 4.0];
     * var p2 = Cesium.Cartesian4.fromArray(v2, 2);
     */
    Cartesian4.fromArray = Cartesian4.unpack;

    /**
     * Computes the value of the maximum component for the supplied Cartesian.
     *
     * @param {Cartesian4} cartesian The cartesian to use.
     * @returns {Number} The value of the maximum component.
     */
    Cartesian4.maximumComponent = function(cartesian) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('cartesian', cartesian);
        //>>includeEnd('debug');

        return Math.max(cartesian.x, cartesian.y, cartesian.z, cartesian.w);
    };

    /**
     * Computes the value of the minimum component for the supplied Cartesian.
     *
     * @param {Cartesian4} cartesian The cartesian to use.
     * @returns {Number} The value of the minimum component.
     */
    Cartesian4.minimumComponent = function(cartesian) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('cartesian', cartesian);
        //>>includeEnd('debug');

        return Math.min(cartesian.x, cartesian.y, cartesian.z, cartesian.w);
    };

    /**
     * Compares two Cartesians and computes a Cartesian which contains the minimum components of the supplied Cartesians.
     *
     * @param {Cartesian4} first A cartesian to compare.
     * @param {Cartesian4} second A cartesian to compare.
     * @param {Cartesian4} result The object into which to store the result.
     * @returns {Cartesian4} A cartesian with the minimum components.
     */
    Cartesian4.minimumByComponent = function(first, second, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('first', first);
        Check.typeOf.object('second', second);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.x = Math.min(first.x, second.x);
        result.y = Math.min(first.y, second.y);
        result.z = Math.min(first.z, second.z);
        result.w = Math.min(first.w, second.w);

        return result;
    };

    /**
     * Compares two Cartesians and computes a Cartesian which contains the maximum components of the supplied Cartesians.
     *
     * @param {Cartesian4} first A cartesian to compare.
     * @param {Cartesian4} second A cartesian to compare.
     * @param {Cartesian4} result The object into which to store the result.
     * @returns {Cartesian4} A cartesian with the maximum components.
     */
    Cartesian4.maximumByComponent = function(first, second, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('first', first);
        Check.typeOf.object('second', second);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.x = Math.max(first.x, second.x);
        result.y = Math.max(first.y, second.y);
        result.z = Math.max(first.z, second.z);
        result.w = Math.max(first.w, second.w);

        return result;
    };

    /**
     * Computes the provided Cartesian's squared magnitude.
     *
     * @param {Cartesian4} cartesian The Cartesian instance whose squared magnitude is to be computed.
     * @returns {Number} The squared magnitude.
     */
    Cartesian4.magnitudeSquared = function(cartesian) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('cartesian', cartesian);
        //>>includeEnd('debug');

        return cartesian.x * cartesian.x + cartesian.y * cartesian.y + cartesian.z * cartesian.z + cartesian.w * cartesian.w;
    };

    /**
     * Computes the Cartesian's magnitude (length).
     *
     * @param {Cartesian4} cartesian The Cartesian instance whose magnitude is to be computed.
     * @returns {Number} The magnitude.
     */
    Cartesian4.magnitude = function(cartesian) {
        return Math.sqrt(Cartesian4.magnitudeSquared(cartesian));
    };

    var distanceScratch = new Cartesian4();

    /**
     * Computes the 4-space distance between two points.
     *
     * @param {Cartesian4} left The first point to compute the distance from.
     * @param {Cartesian4} right The second point to compute the distance to.
     * @returns {Number} The distance between two points.
     *
     * @example
     * // Returns 1.0
     * var d = Cesium.Cartesian4.distance(
     *   new Cesium.Cartesian4(1.0, 0.0, 0.0, 0.0),
     *   new Cesium.Cartesian4(2.0, 0.0, 0.0, 0.0));
     */
    Cartesian4.distance = function(left, right) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('left', left);
        Check.typeOf.object('right', right);
        //>>includeEnd('debug');

        Cartesian4.subtract(left, right, distanceScratch);
        return Cartesian4.magnitude(distanceScratch);
    };

    /**
     * Computes the squared distance between two points.  Comparing squared distances
     * using this function is more efficient than comparing distances using {@link Cartesian4#distance}.
     *
     * @param {Cartesian4} left The first point to compute the distance from.
     * @param {Cartesian4} right The second point to compute the distance to.
     * @returns {Number} The distance between two points.
     *
     * @example
     * // Returns 4.0, not 2.0
     * var d = Cesium.Cartesian4.distance(
     *   new Cesium.Cartesian4(1.0, 0.0, 0.0, 0.0),
     *   new Cesium.Cartesian4(3.0, 0.0, 0.0, 0.0));
     */
    Cartesian4.distanceSquared = function(left, right) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('left', left);
        Check.typeOf.object('right', right);
        //>>includeEnd('debug');

        Cartesian4.subtract(left, right, distanceScratch);
        return Cartesian4.magnitudeSquared(distanceScratch);
    };

    /**
     * Computes the normalized form of the supplied Cartesian.
     *
     * @param {Cartesian4} cartesian The Cartesian to be normalized.
     * @param {Cartesian4} result The object onto which to store the result.
     * @returns {Cartesian4} The modified result parameter.
     */
    Cartesian4.normalize = function(cartesian, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('cartesian', cartesian);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        var magnitude = Cartesian4.magnitude(cartesian);

        result.x = cartesian.x / magnitude;
        result.y = cartesian.y / magnitude;
        result.z = cartesian.z / magnitude;
        result.w = cartesian.w / magnitude;

        //>>includeStart('debug', pragmas.debug);
        if (isNaN(result.x) || isNaN(result.y) || isNaN(result.z) || isNaN(result.w)) {
            throw new DeveloperError('normalized result is not a number');
        }
        //>>includeEnd('debug');

        return result;
    };

    /**
     * Computes the dot (scalar) product of two Cartesians.
     *
     * @param {Cartesian4} left The first Cartesian.
     * @param {Cartesian4} right The second Cartesian.
     * @returns {Number} The dot product.
     */
    Cartesian4.dot = function(left, right) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('left', left);
        Check.typeOf.object('right', right);
        //>>includeEnd('debug');

        return left.x * right.x + left.y * right.y + left.z * right.z + left.w * right.w;
    };

    /**
     * Computes the componentwise product of two Cartesians.
     *
     * @param {Cartesian4} left The first Cartesian.
     * @param {Cartesian4} right The second Cartesian.
     * @param {Cartesian4} result The object onto which to store the result.
     * @returns {Cartesian4} The modified result parameter.
     */
    Cartesian4.multiplyComponents = function(left, right, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('left', left);
        Check.typeOf.object('right', right);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.x = left.x * right.x;
        result.y = left.y * right.y;
        result.z = left.z * right.z;
        result.w = left.w * right.w;
        return result;
    };

    /**
     * Computes the componentwise quotient of two Cartesians.
     *
     * @param {Cartesian4} left The first Cartesian.
     * @param {Cartesian4} right The second Cartesian.
     * @param {Cartesian4} result The object onto which to store the result.
     * @returns {Cartesian4} The modified result parameter.
     */
    Cartesian4.divideComponents = function(left, right, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('left', left);
        Check.typeOf.object('right', right);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.x = left.x / right.x;
        result.y = left.y / right.y;
        result.z = left.z / right.z;
        result.w = left.w / right.w;
        return result;
    };

    /**
     * Computes the componentwise sum of two Cartesians.
     *
     * @param {Cartesian4} left The first Cartesian.
     * @param {Cartesian4} right The second Cartesian.
     * @param {Cartesian4} result The object onto which to store the result.
     * @returns {Cartesian4} The modified result parameter.
     */
    Cartesian4.add = function(left, right, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('left', left);
        Check.typeOf.object('right', right);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.x = left.x + right.x;
        result.y = left.y + right.y;
        result.z = left.z + right.z;
        result.w = left.w + right.w;
        return result;
    };

    /**
     * Computes the componentwise difference of two Cartesians.
     *
     * @param {Cartesian4} left The first Cartesian.
     * @param {Cartesian4} right The second Cartesian.
     * @param {Cartesian4} result The object onto which to store the result.
     * @returns {Cartesian4} The modified result parameter.
     */
    Cartesian4.subtract = function(left, right, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('left', left);
        Check.typeOf.object('right', right);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.x = left.x - right.x;
        result.y = left.y - right.y;
        result.z = left.z - right.z;
        result.w = left.w - right.w;
        return result;
    };

    /**
     * Multiplies the provided Cartesian componentwise by the provided scalar.
     *
     * @param {Cartesian4} cartesian The Cartesian to be scaled.
     * @param {Number} scalar The scalar to multiply with.
     * @param {Cartesian4} result The object onto which to store the result.
     * @returns {Cartesian4} The modified result parameter.
     */
    Cartesian4.multiplyByScalar = function(cartesian, scalar, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('cartesian', cartesian);
        Check.typeOf.number('scalar', scalar);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.x = cartesian.x * scalar;
        result.y = cartesian.y * scalar;
        result.z = cartesian.z * scalar;
        result.w = cartesian.w * scalar;
        return result;
    };

    /**
     * Divides the provided Cartesian componentwise by the provided scalar.
     *
     * @param {Cartesian4} cartesian The Cartesian to be divided.
     * @param {Number} scalar The scalar to divide by.
     * @param {Cartesian4} result The object onto which to store the result.
     * @returns {Cartesian4} The modified result parameter.
     */
    Cartesian4.divideByScalar = function(cartesian, scalar, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('cartesian', cartesian);
        Check.typeOf.number('scalar', scalar);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.x = cartesian.x / scalar;
        result.y = cartesian.y / scalar;
        result.z = cartesian.z / scalar;
        result.w = cartesian.w / scalar;
        return result;
    };

    /**
     * Negates the provided Cartesian.
     *
     * @param {Cartesian4} cartesian The Cartesian to be negated.
     * @param {Cartesian4} result The object onto which to store the result.
     * @returns {Cartesian4} The modified result parameter.
     */
    Cartesian4.negate = function(cartesian, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('cartesian', cartesian);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.x = -cartesian.x;
        result.y = -cartesian.y;
        result.z = -cartesian.z;
        result.w = -cartesian.w;
        return result;
    };

    /**
     * Computes the absolute value of the provided Cartesian.
     *
     * @param {Cartesian4} cartesian The Cartesian whose absolute value is to be computed.
     * @param {Cartesian4} result The object onto which to store the result.
     * @returns {Cartesian4} The modified result parameter.
     */
    Cartesian4.abs = function(cartesian, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('cartesian', cartesian);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.x = Math.abs(cartesian.x);
        result.y = Math.abs(cartesian.y);
        result.z = Math.abs(cartesian.z);
        result.w = Math.abs(cartesian.w);
        return result;
    };

    var lerpScratch = new Cartesian4();
    /**
     * Computes the linear interpolation or extrapolation at t using the provided cartesians.
     *
     * @param {Cartesian4} start The value corresponding to t at 0.0.
     * @param {Cartesian4}end The value corresponding to t at 1.0.
     * @param {Number} t The point along t at which to interpolate.
     * @param {Cartesian4} result The object onto which to store the result.
     * @returns {Cartesian4} The modified result parameter.
     */
    Cartesian4.lerp = function(start, end, t, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('start', start);
        Check.typeOf.object('end', end);
        Check.typeOf.number('t', t);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        Cartesian4.multiplyByScalar(end, t, lerpScratch);
        result = Cartesian4.multiplyByScalar(start, 1.0 - t, result);
        return Cartesian4.add(lerpScratch, result, result);
    };

    var mostOrthogonalAxisScratch = new Cartesian4();
    /**
     * Returns the axis that is most orthogonal to the provided Cartesian.
     *
     * @param {Cartesian4} cartesian The Cartesian on which to find the most orthogonal axis.
     * @param {Cartesian4} result The object onto which to store the result.
     * @returns {Cartesian4} The most orthogonal axis.
     */
    Cartesian4.mostOrthogonalAxis = function(cartesian, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('cartesian', cartesian);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        var f = Cartesian4.normalize(cartesian, mostOrthogonalAxisScratch);
        Cartesian4.abs(f, f);

        if (f.x <= f.y) {
            if (f.x <= f.z) {
                if (f.x <= f.w) {
                    result = Cartesian4.clone(Cartesian4.UNIT_X, result);
                } else {
                    result = Cartesian4.clone(Cartesian4.UNIT_W, result);
                }
            } else if (f.z <= f.w) {
                result = Cartesian4.clone(Cartesian4.UNIT_Z, result);
            } else {
                result = Cartesian4.clone(Cartesian4.UNIT_W, result);
            }
        } else if (f.y <= f.z) {
            if (f.y <= f.w) {
                result = Cartesian4.clone(Cartesian4.UNIT_Y, result);
            } else {
                result = Cartesian4.clone(Cartesian4.UNIT_W, result);
            }
        } else if (f.z <= f.w) {
            result = Cartesian4.clone(Cartesian4.UNIT_Z, result);
        } else {
            result = Cartesian4.clone(Cartesian4.UNIT_W, result);
        }

        return result;
    };

    /**
     * Compares the provided Cartesians componentwise and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     *
     * @param {Cartesian4} [left] The first Cartesian.
     * @param {Cartesian4} [right] The second Cartesian.
     * @returns {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
     */
    Cartesian4.equals = function(left, right) {
        return (left === right) ||
               ((defined(left)) &&
                (defined(right)) &&
                (left.x === right.x) &&
                (left.y === right.y) &&
                (left.z === right.z) &&
                (left.w === right.w));
    };

    /**
     * @private
     */
    Cartesian4.equalsArray = function(cartesian, array, offset) {
        return cartesian.x === array[offset] &&
               cartesian.y === array[offset + 1] &&
               cartesian.z === array[offset + 2] &&
               cartesian.w === array[offset + 3];
    };

    /**
     * Compares the provided Cartesians componentwise and returns
     * <code>true</code> if they pass an absolute or relative tolerance test,
     * <code>false</code> otherwise.
     *
     * @param {Cartesian4} [left] The first Cartesian.
     * @param {Cartesian4} [right] The second Cartesian.
     * @param {Number} relativeEpsilon The relative epsilon tolerance to use for equality testing.
     * @param {Number} [absoluteEpsilon=relativeEpsilon] The absolute epsilon tolerance to use for equality testing.
     * @returns {Boolean} <code>true</code> if left and right are within the provided epsilon, <code>false</code> otherwise.
     */
    Cartesian4.equalsEpsilon = function(left, right, relativeEpsilon, absoluteEpsilon) {
        return (left === right) ||
               (defined(left) &&
                defined(right) &&
                CesiumMath.equalsEpsilon(left.x, right.x, relativeEpsilon, absoluteEpsilon) &&
                CesiumMath.equalsEpsilon(left.y, right.y, relativeEpsilon, absoluteEpsilon) &&
                CesiumMath.equalsEpsilon(left.z, right.z, relativeEpsilon, absoluteEpsilon) &&
                CesiumMath.equalsEpsilon(left.w, right.w, relativeEpsilon, absoluteEpsilon));
    };

    /**
     * An immutable Cartesian4 instance initialized to (0.0, 0.0, 0.0, 0.0).
     *
     * @type {Cartesian4}
     * @constant
     */
    Cartesian4.ZERO = freezeObject(new Cartesian4(0.0, 0.0, 0.0, 0.0));

    /**
     * An immutable Cartesian4 instance initialized to (1.0, 0.0, 0.0, 0.0).
     *
     * @type {Cartesian4}
     * @constant
     */
    Cartesian4.UNIT_X = freezeObject(new Cartesian4(1.0, 0.0, 0.0, 0.0));

    /**
     * An immutable Cartesian4 instance initialized to (0.0, 1.0, 0.0, 0.0).
     *
     * @type {Cartesian4}
     * @constant
     */
    Cartesian4.UNIT_Y = freezeObject(new Cartesian4(0.0, 1.0, 0.0, 0.0));

    /**
     * An immutable Cartesian4 instance initialized to (0.0, 0.0, 1.0, 0.0).
     *
     * @type {Cartesian4}
     * @constant
     */
    Cartesian4.UNIT_Z = freezeObject(new Cartesian4(0.0, 0.0, 1.0, 0.0));

    /**
     * An immutable Cartesian4 instance initialized to (0.0, 0.0, 0.0, 1.0).
     *
     * @type {Cartesian4}
     * @constant
     */
    Cartesian4.UNIT_W = freezeObject(new Cartesian4(0.0, 0.0, 0.0, 1.0));

    /**
     * Duplicates this Cartesian4 instance.
     *
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     */
    Cartesian4.prototype.clone = function(result) {
        return Cartesian4.clone(this, result);
    };

    /**
     * Compares this Cartesian against the provided Cartesian componentwise and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     *
     * @param {Cartesian4} [right] The right hand side Cartesian.
     * @returns {Boolean} <code>true</code> if they are equal, <code>false</code> otherwise.
     */
    Cartesian4.prototype.equals = function(right) {
        return Cartesian4.equals(this, right);
    };

    /**
     * Compares this Cartesian against the provided Cartesian componentwise and returns
     * <code>true</code> if they pass an absolute or relative tolerance test,
     * <code>false</code> otherwise.
     *
     * @param {Cartesian4} [right] The right hand side Cartesian.
     * @param {Number} relativeEpsilon The relative epsilon tolerance to use for equality testing.
     * @param {Number} [absoluteEpsilon=relativeEpsilon] The absolute epsilon tolerance to use for equality testing.
     * @returns {Boolean} <code>true</code> if they are within the provided epsilon, <code>false</code> otherwise.
     */
    Cartesian4.prototype.equalsEpsilon = function(right, relativeEpsilon, absoluteEpsilon) {
        return Cartesian4.equalsEpsilon(this, right, relativeEpsilon, absoluteEpsilon);
    };

    /**
     * Creates a string representing this Cartesian in the format '(x, y)'.
     *
     * @returns {String} A string representing the provided Cartesian in the format '(x, y)'.
     */
    Cartesian4.prototype.toString = function() {
        return '(' + this.x + ', ' + this.y + ', ' + this.z + ', ' + this.w + ')';
    };

    var scratchFloatArray = new Float32Array(1);
    var SHIFT_LEFT_8 = 256.0;
    var SHIFT_LEFT_16 = 65536.0;
    var SHIFT_LEFT_24 = 16777216.0;

    var SHIFT_RIGHT_8 = 1.0 / SHIFT_LEFT_8;
    var SHIFT_RIGHT_16 = 1.0 / SHIFT_LEFT_16;
    var SHIFT_RIGHT_24 = 1.0 / SHIFT_LEFT_24;

    var BIAS = 38.0;

    /**
     * Packs an arbitrary floating point value to 4 values representable using uint8.
     *
     * @param {Number} value A floating point number
     * @param {Cartesian4} [result] The Cartesian4 that will contain the packed float.
     * @returns {Cartesian4} A Cartesian4 representing the float packed to values in x, y, z, and w.
     */
    Cartesian4.packFloat = function(value, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.number('value', value);
        //>>includeEnd('debug');

        if (!defined(result)) {
            result = new Cartesian4();
        }

        // Force the value to 32 bit precision
        scratchFloatArray[0] = value;
        value = scratchFloatArray[0];

        if (value === 0.0) {
            return Cartesian4.clone(Cartesian4.ZERO, result);
        }

        var sign = value < 0.0 ? 1.0 : 0.0;
        var exponent;

        if (!isFinite(value)) {
            value = 0.1;
            exponent = BIAS;
        } else {
            value = Math.abs(value);
            exponent = Math.floor(CesiumMath.logBase(value, 10)) + 1.0;
            value = value / Math.pow(10.0, exponent);
        }

        var temp = value * SHIFT_LEFT_8;
        result.x = Math.floor(temp);
        temp = (temp - result.x) * SHIFT_LEFT_8;
        result.y = Math.floor(temp);
        temp = (temp - result.y) * SHIFT_LEFT_8;
        result.z = Math.floor(temp);
        result.w = (exponent + BIAS) * 2.0 + sign;

        return result;
    };

    /**
     * Unpacks a float packed using Cartesian4.packFloat.
     *
     * @param {Cartesian4} packedFloat A Cartesian4 containing a float packed to 4 values representable using uint8.
     * @returns {Number} The unpacked float.
     * @private
     */
    Cartesian4.unpackFloat = function(packedFloat) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('packedFloat', packedFloat);
        //>>includeEnd('debug');

        var temp = packedFloat.w / 2.0;
        var exponent = Math.floor(temp);
        var sign = (temp - exponent) * 2.0;
        exponent = exponent - BIAS;

        sign = sign * 2.0 - 1.0;
        sign = -sign;

        if (exponent >= BIAS) {
            return sign < 0.0 ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
        }

        var unpacked = sign * packedFloat.x * SHIFT_RIGHT_8;
        unpacked += sign * packedFloat.y * SHIFT_RIGHT_16;
        unpacked += sign * packedFloat.z * SHIFT_RIGHT_24;

        return unpacked * Math.pow(10.0, exponent);
    };

    module.exports= Cartesian4;

},{"./Check":11,"./DeveloperError":13,"./Math":21,"./defaultValue":40,"./defined":42,"./freezeObject":45}],10:[function(require,module,exports){
var Cartesian3=require('./Cartesian3');
var Check=require('./Check');
var defaultValue=require('./defaultValue');
var defined=require('./defined');
var freezeObject=require('./freezeObject');
var CesiumMath=require('./Math');
var scaleToGeodeticSurface=require('./scaleToGeodeticSurface');

    'use strict';

    /**
     * A position defined by longitude, latitude, and height.
     * @alias Cartographic
     * @constructor
     *
     * @param {Number} [longitude=0.0] The longitude, in radians.
     * @param {Number} [latitude=0.0] The latitude, in radians.
     * @param {Number} [height=0.0] The height, in meters, above the ellipsoid.
     *
     * @see Ellipsoid
     */
    function Cartographic(longitude, latitude, height) {
        /**
         * The longitude, in radians.
         * @type {Number}
         * @default 0.0
         */
        this.longitude = defaultValue(longitude, 0.0);

        /**
         * The latitude, in radians.
         * @type {Number}
         * @default 0.0
         */
        this.latitude = defaultValue(latitude, 0.0);

        /**
         * The height, in meters, above the ellipsoid.
         * @type {Number}
         * @default 0.0
         */
        this.height = defaultValue(height, 0.0);
    }

    /**
     * Creates a new Cartographic instance from longitude and latitude
     * specified in radians.
     *
     * @param {Number} longitude The longitude, in radians.
     * @param {Number} latitude The latitude, in radians.
     * @param {Number} [height=0.0] The height, in meters, above the ellipsoid.
     * @param {Cartographic} [result] The object onto which to store the result.
     * @returns {Cartographic} The modified result parameter or a new Cartographic instance if one was not provided.
     */
    Cartographic.fromRadians = function(longitude, latitude, height, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.number('longitude', longitude);
        Check.typeOf.number('latitude', latitude);
        //>>includeEnd('debug');

        height = defaultValue(height, 0.0);

        if (!defined(result)) {
            return new Cartographic(longitude, latitude, height);
        }

        result.longitude = longitude;
        result.latitude = latitude;
        result.height = height;
        return result;
    };

    /**
     * Creates a new Cartographic instance from longitude and latitude
     * specified in degrees.  The values in the resulting object will
     * be in radians.
     *
     * @param {Number} longitude The longitude, in degrees.
     * @param {Number} latitude The latitude, in degrees.
     * @param {Number} [height=0.0] The height, in meters, above the ellipsoid.
     * @param {Cartographic} [result] The object onto which to store the result.
     * @returns {Cartographic} The modified result parameter or a new Cartographic instance if one was not provided.
     */
    Cartographic.fromDegrees = function(longitude, latitude, height, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.number('longitude', longitude);
        Check.typeOf.number('latitude', latitude);
        //>>includeEnd('debug');
        longitude = CesiumMath.toRadians(longitude);
        latitude = CesiumMath.toRadians(latitude);

        return Cartographic.fromRadians(longitude, latitude, height, result);
    };

    var cartesianToCartographicN = new Cartesian3();
    var cartesianToCartographicP = new Cartesian3();
    var cartesianToCartographicH = new Cartesian3();
    var wgs84OneOverRadii = new Cartesian3(1.0 / 6378137.0, 1.0 / 6378137.0, 1.0 / 6356752.3142451793);
    var wgs84OneOverRadiiSquared = new Cartesian3(1.0 / (6378137.0 * 6378137.0), 1.0 / (6378137.0 * 6378137.0), 1.0 / (6356752.3142451793 * 6356752.3142451793));
    var wgs84CenterToleranceSquared = CesiumMath.EPSILON1;

    /**
     * Creates a new Cartographic instance from a Cartesian position. The values in the
     * resulting object will be in radians.
     *
     * @param {Cartesian3} cartesian The Cartesian position to convert to cartographic representation.
     * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid on which the position lies.
     * @param {Cartographic} [result] The object onto which to store the result.
     * @returns {Cartographic} The modified result parameter, new Cartographic instance if none was provided, or undefined if the cartesian is at the center of the ellipsoid.
     */
    Cartographic.fromCartesian = function(cartesian, ellipsoid, result) {
        var oneOverRadii = defined(ellipsoid) ? ellipsoid.oneOverRadii : wgs84OneOverRadii;
        var oneOverRadiiSquared = defined(ellipsoid) ? ellipsoid.oneOverRadiiSquared : wgs84OneOverRadiiSquared;
        var centerToleranceSquared = defined(ellipsoid) ? ellipsoid._centerToleranceSquared : wgs84CenterToleranceSquared;

        //`cartesian is required.` is thrown from scaleToGeodeticSurface
        var p = scaleToGeodeticSurface(cartesian, oneOverRadii, oneOverRadiiSquared, centerToleranceSquared, cartesianToCartographicP);

        if (!defined(p)) {
            return undefined;
        }

        var n = Cartesian3.multiplyComponents(p, oneOverRadiiSquared, cartesianToCartographicN);
        n = Cartesian3.normalize(n, n);

        var h = Cartesian3.subtract(cartesian, p, cartesianToCartographicH);

        var longitude = Math.atan2(n.y, n.x);
        var latitude = Math.asin(n.z);
        var height = CesiumMath.sign(Cartesian3.dot(h, cartesian)) * Cartesian3.magnitude(h);

        if (!defined(result)) {
            return new Cartographic(longitude, latitude, height);
        }
        result.longitude = longitude;
        result.latitude = latitude;
        result.height = height;
        return result;
    };

    /**
     * Creates a new Cartesian3 instance from a Cartographic input. The values in the inputted
     * object should be in radians.
     *
     * @param {Cartographic} cartographic Input to be converted into a Cartesian3 output.
     * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid on which the position lies.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @returns {Cartesian3} The position
     */
    Cartographic.toCartesian = function(cartographic, ellipsoid, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('cartographic', cartographic);
        //>>includeEnd('debug');

        return Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, cartographic.height, ellipsoid, result);
    };

    /**
     * Duplicates a Cartographic instance.
     *
     * @param {Cartographic} cartographic The cartographic to duplicate.
     * @param {Cartographic} [result] The object onto which to store the result.
     * @returns {Cartographic} The modified result parameter or a new Cartographic instance if one was not provided. (Returns undefined if cartographic is undefined)
     */
    Cartographic.clone = function(cartographic, result) {
        if (!defined(cartographic)) {
            return undefined;
        }
        if (!defined(result)) {
            return new Cartographic(cartographic.longitude, cartographic.latitude, cartographic.height);
        }
        result.longitude = cartographic.longitude;
        result.latitude = cartographic.latitude;
        result.height = cartographic.height;
        return result;
    };

    /**
     * Compares the provided cartographics componentwise and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     *
     * @param {Cartographic} [left] The first cartographic.
     * @param {Cartographic} [right] The second cartographic.
     * @returns {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
     */
    Cartographic.equals = function(left, right) {
        return (left === right) ||
                ((defined(left)) &&
                 (defined(right)) &&
                 (left.longitude === right.longitude) &&
                 (left.latitude === right.latitude) &&
                 (left.height === right.height));
    };

    /**
     * Compares the provided cartographics componentwise and returns
     * <code>true</code> if they are within the provided epsilon,
     * <code>false</code> otherwise.
     *
     * @param {Cartographic} [left] The first cartographic.
     * @param {Cartographic} [right] The second cartographic.
     * @param {Number} epsilon The epsilon to use for equality testing.
     * @returns {Boolean} <code>true</code> if left and right are within the provided epsilon, <code>false</code> otherwise.
     */
    Cartographic.equalsEpsilon = function(left, right, epsilon) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.number('epsilon', epsilon);
        //>>includeEnd('debug');

        return (left === right) ||
               ((defined(left)) &&
                (defined(right)) &&
                (Math.abs(left.longitude - right.longitude) <= epsilon) &&
                (Math.abs(left.latitude - right.latitude) <= epsilon) &&
                (Math.abs(left.height - right.height) <= epsilon));
    };

    /**
     * An immutable Cartographic instance initialized to (0.0, 0.0, 0.0).
     *
     * @type {Cartographic}
     * @constant
     */
    Cartographic.ZERO = freezeObject(new Cartographic(0.0, 0.0, 0.0));

    /**
     * Duplicates this instance.
     *
     * @param {Cartographic} [result] The object onto which to store the result.
     * @returns {Cartographic} The modified result parameter or a new Cartographic instance if one was not provided.
     */
    Cartographic.prototype.clone = function(result) {
        return Cartographic.clone(this, result);
    };

    /**
     * Compares the provided against this cartographic componentwise and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     *
     * @param {Cartographic} [right] The second cartographic.
     * @returns {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
     */
    Cartographic.prototype.equals = function(right) {
        return Cartographic.equals(this, right);
    };

    /**
     * Compares the provided against this cartographic componentwise and returns
     * <code>true</code> if they are within the provided epsilon,
     * <code>false</code> otherwise.
     *
     * @param {Cartographic} [right] The second cartographic.
     * @param {Number} epsilon The epsilon to use for equality testing.
     * @returns {Boolean} <code>true</code> if left and right are within the provided epsilon, <code>false</code> otherwise.
     */
    Cartographic.prototype.equalsEpsilon = function(right, epsilon) {
        return Cartographic.equalsEpsilon(this, right, epsilon);
    };

    /**
     * Creates a string representing this cartographic in the format '(longitude, latitude, height)'.
     *
     * @returns {String} A string representing the provided cartographic in the format '(longitude, latitude, height)'.
     */
    Cartographic.prototype.toString = function() {
        return '(' + this.longitude + ', ' + this.latitude + ', ' + this.height + ')';
    };

    module.exports= Cartographic;

},{"./Cartesian3":8,"./Check":11,"./Math":21,"./defaultValue":40,"./defined":42,"./freezeObject":45,"./scaleToGeodeticSurface":58}],11:[function(require,module,exports){
var defined=require('./defined');
var DeveloperError=require('./DeveloperError');

    'use strict';

    /**
     * Contains functions for checking that supplied arguments are of a specified type
     * or meet specified conditions
     * @private
     */
    var Check = {};

    /**
     * Contains type checking functions, all using the typeof operator
     */
    Check.typeOf = {};

    function getUndefinedErrorMessage(name) {
        return name + ' is required, actual value was undefined';
    }

    function getFailedTypeErrorMessage(actual, expected, name) {
        return 'Expected ' + name + ' to be typeof ' + expected + ', actual typeof was ' + actual;
    }

    /**
     * Throws if test is not defined
     *
     * @param {String} name The name of the variable being tested
     * @param {*} test The value that is to be checked
     * @exception {DeveloperError} test must be defined
     */
    Check.defined = function (name, test) {
        if (!defined(test)) {
            throw new DeveloperError(getUndefinedErrorMessage(name));
        }
    };

    /**
     * Throws if test is not typeof 'function'
     *
     * @param {String} name The name of the variable being tested
     * @param {*} test The value to test
     * @exception {DeveloperError} test must be typeof 'function'
     */
    Check.typeOf.func = function (name, test) {
        if (typeof test !== 'function') {
            throw new DeveloperError(getFailedTypeErrorMessage(typeof test, 'function', name));
        }
    };

    /**
     * Throws if test is not typeof 'string'
     *
     * @param {String} name The name of the variable being tested
     * @param {*} test The value to test
     * @exception {DeveloperError} test must be typeof 'string'
     */
    Check.typeOf.string = function (name, test) {
        if (typeof test !== 'string') {
            throw new DeveloperError(getFailedTypeErrorMessage(typeof test, 'string', name));
        }
    };

    /**
     * Throws if test is not typeof 'number'
     *
     * @param {String} name The name of the variable being tested
     * @param {*} test The value to test
     * @exception {DeveloperError} test must be typeof 'number'
     */
    Check.typeOf.number = function (name, test) {
        if (typeof test !== 'number') {
            throw new DeveloperError(getFailedTypeErrorMessage(typeof test, 'number', name));
        }
    };

    /**
     * Throws if test is not typeof 'number' and less than limit
     *
     * @param {String} name The name of the variable being tested
     * @param {*} test The value to test
     * @param {Number} limit The limit value to compare against
     * @exception {DeveloperError} test must be typeof 'number' and less than limit
     */
    Check.typeOf.number.lessThan = function (name, test, limit) {
        Check.typeOf.number(name, test);
        if (test >= limit) {
            throw new DeveloperError('Expected ' + name + ' to be less than ' + limit + ', actual value was ' + test);
        }
    };

    /**
     * Throws if test is not typeof 'number' and less than or equal to limit
     *
     * @param {String} name The name of the variable being tested
     * @param {*} test The value to test
     * @param {Number} limit The limit value to compare against
     * @exception {DeveloperError} test must be typeof 'number' and less than or equal to limit
     */
    Check.typeOf.number.lessThanOrEquals = function (name, test, limit) {
        Check.typeOf.number(name, test);
        if (test > limit) {
            throw new DeveloperError('Expected ' + name + ' to be less than or equal to ' + limit + ', actual value was ' + test);
        }
    };

    /**
     * Throws if test is not typeof 'number' and greater than limit
     *
     * @param {String} name The name of the variable being tested
     * @param {*} test The value to test
     * @param {Number} limit The limit value to compare against
     * @exception {DeveloperError} test must be typeof 'number' and greater than limit
     */
    Check.typeOf.number.greaterThan = function (name, test, limit) {
        Check.typeOf.number(name, test);
        if (test <= limit) {
            throw new DeveloperError('Expected ' + name + ' to be greater than ' + limit + ', actual value was ' + test);
        }
    };

    /**
     * Throws if test is not typeof 'number' and greater than or equal to limit
     *
     * @param {String} name The name of the variable being tested
     * @param {*} test The value to test
     * @param {Number} limit The limit value to compare against
     * @exception {DeveloperError} test must be typeof 'number' and greater than or equal to limit
     */
    Check.typeOf.number.greaterThanOrEquals = function (name, test, limit) {
        Check.typeOf.number(name, test);
        if (test < limit) {
            throw new DeveloperError('Expected ' + name + ' to be greater than or equal to' + limit + ', actual value was ' + test);
        }
    };

    /**
     * Throws if test is not typeof 'object'
     *
     * @param {String} name The name of the variable being tested
     * @param {*} test The value to test
     * @exception {DeveloperError} test must be typeof 'object'
     */
    Check.typeOf.object = function (name, test) {
        if (typeof test !== 'object') {
            throw new DeveloperError(getFailedTypeErrorMessage(typeof test, 'object', name));
        }
    };

    /**
     * Throws if test is not typeof 'boolean'
     *
     * @param {String} name The name of the variable being tested
     * @param {*} test The value to test
     * @exception {DeveloperError} test must be typeof 'boolean'
     */
    Check.typeOf.bool = function (name, test) {
        if (typeof test !== 'boolean') {
            throw new DeveloperError(getFailedTypeErrorMessage(typeof test, 'boolean', name));
        }
    };

    /**
     * Throws if test1 and test2 is not typeof 'number' and not equal in value
     *
     * @param {String} name1 The name of the first variable being tested
     * @param {String} name2 The name of the second variable being tested against
     * @param {*} test1 The value to test
     * @param {*} test2 The value to test against
     * @exception {DeveloperError} test1 and test2 should be type of 'number' and be equal in value
     */
    Check.typeOf.number.equals = function (name1, name2, test1, test2) {
        Check.typeOf.number(name1, test1);
        Check.typeOf.number(name2, test2);
        if (test1 !== test2) {
            throw new DeveloperError(name1 + ' must be equal to ' + name2 + ', the actual values are ' + test1 + ' and ' + test2);
        }
    };

    module.exports= Check;

},{"./DeveloperError":13,"./defined":42}],12:[function(require,module,exports){
var Check=require('./Check');
var defaultValue=require('./defaultValue');
var defined=require('./defined');
var FeatureDetection=require('./FeatureDetection');
var freezeObject=require('./freezeObject');
var CesiumMath=require('./Math');

    'use strict';

    function hue2rgb(m1, m2, h) {
        if (h < 0) {
            h += 1;
        }
        if (h > 1) {
            h -= 1;
        }
        if (h * 6 < 1) {
            return m1 + (m2 - m1) * 6 * h;
        }
        if (h * 2 < 1) {
            return m2;
        }
        if (h * 3 < 2) {
            return m1 + (m2 - m1) * (2 / 3 - h) * 6;
        }
        return m1;
    }

    /**
     * A color, specified using red, green, blue, and alpha values,
     * which range from <code>0</code> (no intensity) to <code>1.0</code> (full intensity).
     * @param {Number} [red=1.0] The red component.
     * @param {Number} [green=1.0] The green component.
     * @param {Number} [blue=1.0] The blue component.
     * @param {Number} [alpha=1.0] The alpha component.
     *
     * @constructor
     * @alias Color
     *
     * @see Packable
     */
    function Color(red, green, blue, alpha) {
        /**
         * The red component.
         * @type {Number}
         * @default 1.0
         */
        this.red = defaultValue(red, 1.0);
        /**
         * The green component.
         * @type {Number}
         * @default 1.0
         */
        this.green = defaultValue(green, 1.0);
        /**
         * The blue component.
         * @type {Number}
         * @default 1.0
         */
        this.blue = defaultValue(blue, 1.0);
        /**
         * The alpha component.
         * @type {Number}
         * @default 1.0
         */
        this.alpha = defaultValue(alpha, 1.0);
    }

    /**
     * Creates a Color instance from a {@link Cartesian4}. <code>x</code>, <code>y</code>, <code>z</code>,
     * and <code>w</code> map to <code>red</code>, <code>green</code>, <code>blue</code>, and <code>alpha</code>, respectively.
     *
     * @param {Cartesian4} cartesian The source cartesian.
     * @param {Color} [result] The object onto which to store the result.
     * @returns {Color} The modified result parameter or a new Color instance if one was not provided.
     */
    Color.fromCartesian4 = function(cartesian, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('cartesian', cartesian);
        //>>includeEnd('debug');

        if (!defined(result)) {
            return new Color(cartesian.x, cartesian.y, cartesian.z, cartesian.w);
        }

        result.red = cartesian.x;
        result.green = cartesian.y;
        result.blue = cartesian.z;
        result.alpha = cartesian.w;
        return result;
    };

    /**
     * Creates a new Color specified using red, green, blue, and alpha values
     * that are in the range of 0 to 255, converting them internally to a range of 0.0 to 1.0.
     *
     * @param {Number} [red=255] The red component.
     * @param {Number} [green=255] The green component.
     * @param {Number} [blue=255] The blue component.
     * @param {Number} [alpha=255] The alpha component.
     * @param {Color} [result] The object onto which to store the result.
     * @returns {Color} The modified result parameter or a new Color instance if one was not provided.
     */
    Color.fromBytes = function(red, green, blue, alpha, result) {
        red = Color.byteToFloat(defaultValue(red, 255.0));
        green = Color.byteToFloat(defaultValue(green, 255.0));
        blue = Color.byteToFloat(defaultValue(blue, 255.0));
        alpha = Color.byteToFloat(defaultValue(alpha, 255.0));

        if (!defined(result)) {
            return new Color(red, green, blue, alpha);
        }

        result.red = red;
        result.green = green;
        result.blue = blue;
        result.alpha = alpha;
        return result;
    };

    /**
     * Creates a new Color that has the same red, green, and blue components
     * of the specified color, but with the specified alpha value.
     *
     * @param {Color} color The base color
     * @param {Number} alpha The new alpha component.
     * @param {Color} [result] The object onto which to store the result.
     * @returns {Color} The modified result parameter or a new Color instance if one was not provided.
     *
     * @example var translucentRed = Cesium.Color.fromAlpha(Cesium.Color.RED, 0.9);
     */
    Color.fromAlpha = function(color, alpha, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('color', color);
        Check.typeOf.number('alpha', alpha);
        //>>includeEnd('debug');

        if (!defined(result)) {
            return new Color(color.red, color.green, color.blue, alpha);
        }

        result.red = color.red;
        result.green = color.green;
        result.blue = color.blue;
        result.alpha = alpha;
        return result;
    };

    var scratchArrayBuffer;
    var scratchUint32Array;
    var scratchUint8Array;
    if (FeatureDetection.supportsTypedArrays()) {
        scratchArrayBuffer = new ArrayBuffer(4);
        scratchUint32Array = new Uint32Array(scratchArrayBuffer);
        scratchUint8Array = new Uint8Array(scratchArrayBuffer);
    }

    /**
     * Creates a new Color from a single numeric unsigned 32-bit RGBA value, using the endianness
     * of the system.
     *
     * @param {Number} rgba A single numeric unsigned 32-bit RGBA value.
     * @param {Color} [result] The object to store the result in, if undefined a new instance will be created.
     * @returns {Color} The color object.
     *
     * @example
     * var color = Cesium.Color.fromRgba(0x67ADDFFF);
     *
     * @see Color#toRgba
     */
    Color.fromRgba = function(rgba, result) {
        // scratchUint32Array and scratchUint8Array share an underlying array buffer
        scratchUint32Array[0] = rgba;
        return Color.fromBytes(scratchUint8Array[0], scratchUint8Array[1], scratchUint8Array[2], scratchUint8Array[3], result);
    };

    /**
     * Creates a Color instance from hue, saturation, and lightness.
     *
     * @param {Number} [hue=0] The hue angle 0...1
     * @param {Number} [saturation=0] The saturation value 0...1
     * @param {Number} [lightness=0] The lightness value 0...1
     * @param {Number} [alpha=1.0] The alpha component 0...1
     * @param {Color} [result] The object to store the result in, if undefined a new instance will be created.
     * @returns {Color} The color object.
     *
     * @see {@link http://www.w3.org/TR/css3-color/#hsl-color|CSS color values}
     */
    Color.fromHsl = function(hue, saturation, lightness, alpha, result) {
        hue = defaultValue(hue, 0.0) % 1.0;
        saturation = defaultValue(saturation, 0.0);
        lightness = defaultValue(lightness, 0.0);
        alpha = defaultValue(alpha, 1.0);

        var red = lightness;
        var green = lightness;
        var blue = lightness;

        if (saturation !== 0) {
            var m2;
            if (lightness < 0.5) {
                m2 = lightness * (1 + saturation);
            } else {
                m2 = lightness + saturation - lightness * saturation;
            }

            var m1 = 2.0 * lightness - m2;
            red = hue2rgb(m1, m2, hue + 1 / 3);
            green = hue2rgb(m1, m2, hue);
            blue = hue2rgb(m1, m2, hue - 1 / 3);
        }

        if (!defined(result)) {
            return new Color(red, green, blue, alpha);
        }

        result.red = red;
        result.green = green;
        result.blue = blue;
        result.alpha = alpha;
        return result;
    };

    /**
     * Creates a random color using the provided options. For reproducible random colors, you should
     * call {@link CesiumMath#setRandomNumberSeed} once at the beginning of your application.
     *
     * @param {Object} [options] Object with the following properties:
     * @param {Number} [options.red] If specified, the red component to use instead of a randomized value.
     * @param {Number} [options.minimumRed=0.0] The maximum red value to generate if none was specified.
     * @param {Number} [options.maximumRed=1.0] The minimum red value to generate if none was specified.
     * @param {Number} [options.green] If specified, the green component to use instead of a randomized value.
     * @param {Number} [options.minimumGreen=0.0] The maximum green value to generate if none was specified.
     * @param {Number} [options.maximumGreen=1.0] The minimum green value to generate if none was specified.
     * @param {Number} [options.blue] If specified, the blue component to use instead of a randomized value.
     * @param {Number} [options.minimumBlue=0.0] The maximum blue value to generate if none was specified.
     * @param {Number} [options.maximumBlue=1.0] The minimum blue value to generate if none was specified.
     * @param {Number} [options.alpha] If specified, the alpha component to use instead of a randomized value.
     * @param {Number} [options.minimumAlpha=0.0] The maximum alpha value to generate if none was specified.
     * @param {Number} [options.maximumAlpha=1.0] The minimum alpha value to generate if none was specified.
     * @param {Color} [result] The object to store the result in, if undefined a new instance will be created.
     * @returns {Color} The modified result parameter or a new instance if result was undefined.
     *
     * @exception {DeveloperError} minimumRed must be less than or equal to maximumRed.
     * @exception {DeveloperError} minimumGreen must be less than or equal to maximumGreen.
     * @exception {DeveloperError} minimumBlue must be less than or equal to maximumBlue.
     * @exception {DeveloperError} minimumAlpha must be less than or equal to maximumAlpha.
     *
     * @example
     * //Create a completely random color
     * var color = Cesium.Color.fromRandom();
     *
     * //Create a random shade of yellow.
     * var color = Cesium.Color.fromRandom({
     *     red : 1.0,
     *     green : 1.0,
     *     alpha : 1.0
     * });
     *
     * //Create a random bright color.
     * var color = Cesium.Color.fromRandom({
     *     minimumRed : 0.75,
     *     minimumGreen : 0.75,
     *     minimumBlue : 0.75,
     *     alpha : 1.0
     * });
     */
    Color.fromRandom = function(options, result) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        var red = options.red;
        if (!defined(red)) {
            var minimumRed = defaultValue(options.minimumRed, 0);
            var maximumRed = defaultValue(options.maximumRed, 1.0);

            //>>includeStart('debug', pragmas.debug);
            Check.typeOf.number.lessThanOrEquals('minimumRed', minimumRed, maximumRed);
            //>>includeEnd('debug');

            red = minimumRed + (CesiumMath.nextRandomNumber() * (maximumRed - minimumRed));
        }

        var green = options.green;
        if (!defined(green)) {
            var minimumGreen = defaultValue(options.minimumGreen, 0);
            var maximumGreen = defaultValue(options.maximumGreen, 1.0);

            //>>includeStart('debug', pragmas.debug);
            Check.typeOf.number.lessThanOrEquals('minimumGreen', minimumGreen, maximumGreen);
            //>>includeEnd('debug');
            green = minimumGreen + (CesiumMath.nextRandomNumber() * (maximumGreen - minimumGreen));
        }

        var blue = options.blue;
        if (!defined(blue)) {
            var minimumBlue = defaultValue(options.minimumBlue, 0);
            var maximumBlue = defaultValue(options.maximumBlue, 1.0);

            //>>includeStart('debug', pragmas.debug);
            Check.typeOf.number.lessThanOrEquals('minimumBlue', minimumBlue, maximumBlue);
            //>>includeEnd('debug');

            blue = minimumBlue + (CesiumMath.nextRandomNumber() * (maximumBlue - minimumBlue));
        }

        var alpha = options.alpha;
        if (!defined(alpha)) {
            var minimumAlpha = defaultValue(options.minimumAlpha, 0);
            var maximumAlpha = defaultValue(options.maximumAlpha, 1.0);

            //>>includeStart('debug', pragmas.debug);
            Check.typeOf.number.lessThanOrEquals('minumumAlpha', minimumAlpha, maximumAlpha);
            //>>includeEnd('debug');

            alpha = minimumAlpha + (CesiumMath.nextRandomNumber() * (maximumAlpha - minimumAlpha));
        }

        if (!defined(result)) {
            return new Color(red, green, blue, alpha);
        }

        result.red = red;
        result.green = green;
        result.blue = blue;
        result.alpha = alpha;
        return result;
    };

    //#rgb
    var rgbMatcher = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i;
    //#rrggbb
    var rrggbbMatcher = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
    //rgb(), rgba(), or rgb%()
    var rgbParenthesesMatcher = /^rgba?\(\s*([0-9.]+%?)\s*,\s*([0-9.]+%?)\s*,\s*([0-9.]+%?)(?:\s*,\s*([0-9.]+))?\s*\)$/i;
    //hsl(), hsla(), or hsl%()
    var hslParenthesesMatcher = /^hsla?\(\s*([0-9.]+)\s*,\s*([0-9.]+%)\s*,\s*([0-9.]+%)(?:\s*,\s*([0-9.]+))?\s*\)$/i;

    /**
     * Creates a Color instance from a CSS color value.
     *
     * @param {String} color The CSS color value in #rgb, #rrggbb, rgb(), rgba(), hsl(), or hsla() format.
     * @param {Color} [result] The object to store the result in, if undefined a new instance will be created.
     * @returns {Color} The color object, or undefined if the string was not a valid CSS color.
     *
     *
     * @example
     * var cesiumBlue = Cesium.Color.fromCssColorString('#67ADDF');
     * var green = Cesium.Color.fromCssColorString('green');
     *
     * @see {@link http://www.w3.org/TR/css3-color|CSS color values}
     */
    Color.fromCssColorString = function(color, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.string('color', color);
        //>>includeEnd('debug');

        if (!defined(result)) {
            result = new Color();
        }

        var namedColor = Color[color.toUpperCase()];
        if (defined(namedColor)) {
            Color.clone(namedColor, result);
            return result;
        }

        var matches = rgbMatcher.exec(color);
        if (matches !== null) {
            result.red = parseInt(matches[1], 16) / 15;
            result.green = parseInt(matches[2], 16) / 15.0;
            result.blue = parseInt(matches[3], 16) / 15.0;
            result.alpha = 1.0;
            return result;
        }

        matches = rrggbbMatcher.exec(color);
        if (matches !== null) {
            result.red = parseInt(matches[1], 16) / 255.0;
            result.green = parseInt(matches[2], 16) / 255.0;
            result.blue = parseInt(matches[3], 16) / 255.0;
            result.alpha = 1.0;
            return result;
        }

        matches = rgbParenthesesMatcher.exec(color);
        if (matches !== null) {
            result.red = parseFloat(matches[1]) / ('%' === matches[1].substr(-1) ? 100.0 : 255.0);
            result.green = parseFloat(matches[2]) / ('%' === matches[2].substr(-1) ? 100.0 : 255.0);
            result.blue = parseFloat(matches[3]) / ('%' === matches[3].substr(-1) ? 100.0 : 255.0);
            result.alpha = parseFloat(defaultValue(matches[4], '1.0'));
            return result;
        }

        matches = hslParenthesesMatcher.exec(color);
        if (matches !== null) {
            return Color.fromHsl(parseFloat(matches[1]) / 360.0,
                                 parseFloat(matches[2]) / 100.0,
                                 parseFloat(matches[3]) / 100.0,
                                 parseFloat(defaultValue(matches[4], '1.0')), result);
        }

        result = undefined;
        return result;
    };

    /**
     * The number of elements used to pack the object into an array.
     * @type {Number}
     */
    Color.packedLength = 4;

    /**
     * Stores the provided instance into the provided array.
     *
     * @param {Color} value The value to pack.
     * @param {Number[]} array The array to pack into.
     * @param {Number} [startingIndex=0] The index into the array at which to start packing the elements.
     *
     * @returns {Number[]} The array that was packed into
     */
    Color.pack = function(value, array, startingIndex) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('value', value);
        Check.defined('array', array);
        //>>includeEnd('debug');

        startingIndex = defaultValue(startingIndex, 0);
        array[startingIndex++] = value.red;
        array[startingIndex++] = value.green;
        array[startingIndex++] = value.blue;
        array[startingIndex] = value.alpha;

        return array;
    };

    /**
     * Retrieves an instance from a packed array.
     *
     * @param {Number[]} array The packed array.
     * @param {Number} [startingIndex=0] The starting index of the element to be unpacked.
     * @param {Color} [result] The object into which to store the result.
     * @returns {Color} The modified result parameter or a new Color instance if one was not provided.
     */
    Color.unpack = function(array, startingIndex, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('array', array);
        //>>includeEnd('debug');

        startingIndex = defaultValue(startingIndex, 0);
        if (!defined(result)) {
            result = new Color();
        }
        result.red = array[startingIndex++];
        result.green = array[startingIndex++];
        result.blue = array[startingIndex++];
        result.alpha = array[startingIndex];
        return result;
    };

    /**
     * Converts a 'byte' color component in the range of 0 to 255 into
     * a 'float' color component in the range of 0 to 1.0.
     *
     * @param {Number} number The number to be converted.
     * @returns {Number} The converted number.
     */
    Color.byteToFloat = function(number) {
        return number / 255.0;
    };

    /**
     * Converts a 'float' color component in the range of 0 to 1.0 into
     * a 'byte' color component in the range of 0 to 255.
     *
     * @param {Number} number The number to be converted.
     * @returns {Number} The converted number.
     */
    Color.floatToByte = function(number) {
        return number === 1.0 ? 255.0 : (number * 256.0) | 0;
    };

    /**
     * Duplicates a Color.
     *
     * @param {Color} color The Color to duplicate.
     * @param {Color} [result] The object to store the result in, if undefined a new instance will be created.
     * @returns {Color} The modified result parameter or a new instance if result was undefined. (Returns undefined if color is undefined)
     */
    Color.clone = function(color, result) {
        if (!defined(color)) {
            return undefined;
        }
        if (!defined(result)) {
            return new Color(color.red, color.green, color.blue, color.alpha);
        }
        result.red = color.red;
        result.green = color.green;
        result.blue = color.blue;
        result.alpha = color.alpha;
        return result;
    };

    /**
     * Returns true if the first Color equals the second color.
     *
     * @param {Color} left The first Color to compare for equality.
     * @param {Color} right The second Color to compare for equality.
     * @returns {Boolean} <code>true</code> if the Colors are equal; otherwise, <code>false</code>.
     */
    Color.equals = function(left, right) {
        return (left === right) || //
               (defined(left) && //
                defined(right) && //
                left.red === right.red && //
                left.green === right.green && //
                left.blue === right.blue && //
                left.alpha === right.alpha);
    };

    /**
     * @private
     */
    Color.equalsArray = function(color, array, offset) {
        return color.red === array[offset] &&
               color.green === array[offset + 1] &&
               color.blue === array[offset + 2] &&
               color.alpha === array[offset + 3];
    };

    /**
     * Returns a duplicate of a Color instance.
     *
     * @param {Color} [result] The object to store the result in, if undefined a new instance will be created.
     * @returns {Color} The modified result parameter or a new instance if result was undefined.
     */
    Color.prototype.clone = function(result) {
        return Color.clone(this, result);
    };

    /**
     * Returns true if this Color equals other.
     *
     * @param {Color} other The Color to compare for equality.
     * @returns {Boolean} <code>true</code> if the Colors are equal; otherwise, <code>false</code>.
     */
    Color.prototype.equals = function(other) {
        return Color.equals(this, other);
    };

    /**
     * Returns <code>true</code> if this Color equals other componentwise within the specified epsilon.
     *
     * @param {Color} other The Color to compare for equality.
     * @param {Number} [epsilon=0.0] The epsilon to use for equality testing.
     * @returns {Boolean} <code>true</code> if the Colors are equal within the specified epsilon; otherwise, <code>false</code>.
     */
    Color.prototype.equalsEpsilon = function(other, epsilon) {
        return (this === other) || //
               ((defined(other)) && //
                (Math.abs(this.red - other.red) <= epsilon) && //
                (Math.abs(this.green - other.green) <= epsilon) && //
                (Math.abs(this.blue - other.blue) <= epsilon) && //
                (Math.abs(this.alpha - other.alpha) <= epsilon));
    };

    /**
     * Creates a string representing this Color in the format '(red, green, blue, alpha)'.
     *
     * @returns {String} A string representing this Color in the format '(red, green, blue, alpha)'.
     */
    Color.prototype.toString = function() {
        return '(' + this.red + ', ' + this.green + ', ' + this.blue + ', ' + this.alpha + ')';
    };

    /**
     * Creates a string containing the CSS color value for this color.
     *
     * @returns {String} The CSS equivalent of this color.
     *
     * @see {@link http://www.w3.org/TR/css3-color/#rgba-color|CSS RGB or RGBA color values}
     */
    Color.prototype.toCssColorString = function() {
        var red = Color.floatToByte(this.red);
        var green = Color.floatToByte(this.green);
        var blue = Color.floatToByte(this.blue);
        if (this.alpha === 1) {
            return 'rgb(' + red + ',' + green + ',' + blue + ')';
        }
        return 'rgba(' + red + ',' + green + ',' + blue + ',' + this.alpha + ')';
    };

    /**
     * Converts this color to an array of red, green, blue, and alpha values
     * that are in the range of 0 to 255.
     *
     * @param {Number[]} [result] The array to store the result in, if undefined a new instance will be created.
     * @returns {Number[]} The modified result parameter or a new instance if result was undefined.
     */
    Color.prototype.toBytes = function(result) {
        var red = Color.floatToByte(this.red);
        var green = Color.floatToByte(this.green);
        var blue = Color.floatToByte(this.blue);
        var alpha = Color.floatToByte(this.alpha);

        if (!defined(result)) {
            return [red, green, blue, alpha];
        }
        result[0] = red;
        result[1] = green;
        result[2] = blue;
        result[3] = alpha;
        return result;
    };

    /**
     * Converts this color to a single numeric unsigned 32-bit RGBA value, using the endianness
     * of the system.
     *
     * @returns {Number} A single numeric unsigned 32-bit RGBA value.
     *
     *
     * @example
     * var rgba = Cesium.Color.BLUE.toRgba();
     *
     * @see Color.fromRgba
     */
    Color.prototype.toRgba = function() {
        // scratchUint32Array and scratchUint8Array share an underlying array buffer
        scratchUint8Array[0] = Color.floatToByte(this.red);
        scratchUint8Array[1] = Color.floatToByte(this.green);
        scratchUint8Array[2] = Color.floatToByte(this.blue);
        scratchUint8Array[3] = Color.floatToByte(this.alpha);
        return scratchUint32Array[0];
    };

    /**
     * Brightens this color by the provided magnitude.
     *
     * @param {Number} magnitude A positive number indicating the amount to brighten.
     * @param {Color} result The object onto which to store the result.
     * @returns {Color} The modified result parameter.
     *
     * @example
     * var brightBlue = Cesium.Color.BLUE.brighten(0.5, new Cesium.Color());
     */
    Color.prototype.brighten = function(magnitude, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.number('magnitude', magnitude);
        Check.typeOf.number.greaterThanOrEquals('magnitude', magnitude, 0.0);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        magnitude = (1.0 - magnitude);
        result.red = 1.0 - ((1.0 - this.red) * magnitude);
        result.green = 1.0 - ((1.0 - this.green) * magnitude);
        result.blue = 1.0 - ((1.0 - this.blue) * magnitude);
        result.alpha = this.alpha;
        return result;
    };

    /**
     * Darkens this color by the provided magnitude.
     *
     * @param {Number} magnitude A positive number indicating the amount to darken.
     * @param {Color} result The object onto which to store the result.
     * @returns {Color} The modified result parameter.
     *
     * @example
     * var darkBlue = Cesium.Color.BLUE.darken(0.5, new Cesium.Color());
     */
    Color.prototype.darken = function(magnitude, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.number('magnitude', magnitude);
        Check.typeOf.number.greaterThanOrEquals('magnitude', magnitude, 0.0);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        magnitude = (1.0 - magnitude);
        result.red = this.red * magnitude;
        result.green = this.green * magnitude;
        result.blue = this.blue * magnitude;
        result.alpha = this.alpha;
        return result;
    };

    /**
     * Creates a new Color that has the same red, green, and blue components
     * as this Color, but with the specified alpha value.
     *
     * @param {Number} alpha The new alpha component.
     * @param {Color} [result] The object onto which to store the result.
     * @returns {Color} The modified result parameter or a new Color instance if one was not provided.
     *
     * @example var translucentRed = Cesium.Color.RED.withAlpha(0.9);
     */
    Color.prototype.withAlpha = function(alpha, result) {
        return Color.fromAlpha(this, alpha, result);
    };

    /**
     * Computes the componentwise sum of two Colors.
     *
     * @param {Color} left The first Color.
     * @param {Color} right The second Color.
     * @param {Color} result The object onto which to store the result.
     * @returns {Color} The modified result parameter.
     */
    Color.add = function(left, right, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('left', left);
        Check.typeOf.object('right', right);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.red = left.red + right.red;
        result.green = left.green + right.green;
        result.blue = left.blue + right.blue;
        result.alpha = left.alpha + right.alpha;
        return result;
    };

    /**
     * Computes the componentwise difference of two Colors.
     *
     * @param {Color} left The first Color.
     * @param {Color} right The second Color.
     * @param {Color} result The object onto which to store the result.
     * @returns {Color} The modified result parameter.
     */
    Color.subtract = function(left, right, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('left', left);
        Check.typeOf.object('right', right);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.red = left.red - right.red;
        result.green = left.green - right.green;
        result.blue = left.blue - right.blue;
        result.alpha = left.alpha - right.alpha;
        return result;
    };

    /**
     * Computes the componentwise product of two Colors.
     *
     * @param {Color} left The first Color.
     * @param {Color} right The second Color.
     * @param {Color} result The object onto which to store the result.
     * @returns {Color} The modified result parameter.
     */
    Color.multiply = function(left, right, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('left', left);
        Check.typeOf.object('right', right);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.red = left.red * right.red;
        result.green = left.green * right.green;
        result.blue = left.blue * right.blue;
        result.alpha = left.alpha * right.alpha;
        return result;
    };

    /**
     * Computes the componentwise quotient of two Colors.
     *
     * @param {Color} left The first Color.
     * @param {Color} right The second Color.
     * @param {Color} result The object onto which to store the result.
     * @returns {Color} The modified result parameter.
     */
    Color.divide = function(left, right, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('left', left);
        Check.typeOf.object('right', right);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.red = left.red / right.red;
        result.green = left.green / right.green;
        result.blue = left.blue / right.blue;
        result.alpha = left.alpha / right.alpha;
        return result;
    };

    /**
     * Computes the componentwise modulus of two Colors.
     *
     * @param {Color} left The first Color.
     * @param {Color} right The second Color.
     * @param {Color} result The object onto which to store the result.
     * @returns {Color} The modified result parameter.
     */
    Color.mod = function(left, right, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('left', left);
        Check.typeOf.object('right', right);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.red = left.red % right.red;
        result.green = left.green % right.green;
        result.blue = left.blue % right.blue;
        result.alpha = left.alpha % right.alpha;
        return result;
    };

    /**
     * Multiplies the provided Color componentwise by the provided scalar.
     *
     * @param {Color} color The Color to be scaled.
     * @param {Number} scalar The scalar to multiply with.
     * @param {Color} result The object onto which to store the result.
     * @returns {Color} The modified result parameter.
     */
    Color.multiplyByScalar = function(color, scalar, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('color', color);
        Check.typeOf.number('scalar', scalar);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.red = color.red * scalar;
        result.green = color.green * scalar;
        result.blue = color.blue * scalar;
        result.alpha = color.alpha * scalar;
        return result;
    };

    /**
     * Divides the provided Color componentwise by the provided scalar.
     *
     * @param {Color} color The Color to be divided.
     * @param {Number} scalar The scalar to divide with.
     * @param {Color} result The object onto which to store the result.
     * @returns {Color} The modified result parameter.
     */
    Color.divideByScalar = function(color, scalar, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('color', color);
        Check.typeOf.number('scalar', scalar);
        Check.typeOf.object('result', result);
        //>>includeEnd('debug');

        result.red = color.red / scalar;
        result.green = color.green / scalar;
        result.blue = color.blue / scalar;
        result.alpha = color.alpha / scalar;
        return result;
    };

    /**
     * An immutable Color instance initialized to CSS color #F0F8FF
     * <span class="colorSwath" style="background: #F0F8FF;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.ALICEBLUE = freezeObject(Color.fromCssColorString('#F0F8FF'));

    /**
     * An immutable Color instance initialized to CSS color #FAEBD7
     * <span class="colorSwath" style="background: #FAEBD7;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.ANTIQUEWHITE = freezeObject(Color.fromCssColorString('#FAEBD7'));

    /**
     * An immutable Color instance initialized to CSS color #00FFFF
     * <span class="colorSwath" style="background: #00FFFF;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.AQUA = freezeObject(Color.fromCssColorString('#00FFFF'));

    /**
     * An immutable Color instance initialized to CSS color #7FFFD4
     * <span class="colorSwath" style="background: #7FFFD4;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.AQUAMARINE = freezeObject(Color.fromCssColorString('#7FFFD4'));

    /**
     * An immutable Color instance initialized to CSS color #F0FFFF
     * <span class="colorSwath" style="background: #F0FFFF;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.AZURE = freezeObject(Color.fromCssColorString('#F0FFFF'));

    /**
     * An immutable Color instance initialized to CSS color #F5F5DC
     * <span class="colorSwath" style="background: #F5F5DC;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.BEIGE = freezeObject(Color.fromCssColorString('#F5F5DC'));

    /**
     * An immutable Color instance initialized to CSS color #FFE4C4
     * <span class="colorSwath" style="background: #FFE4C4;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.BISQUE = freezeObject(Color.fromCssColorString('#FFE4C4'));

    /**
     * An immutable Color instance initialized to CSS color #000000
     * <span class="colorSwath" style="background: #000000;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.BLACK = freezeObject(Color.fromCssColorString('#000000'));

    /**
     * An immutable Color instance initialized to CSS color #FFEBCD
     * <span class="colorSwath" style="background: #FFEBCD;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.BLANCHEDALMOND = freezeObject(Color.fromCssColorString('#FFEBCD'));

    /**
     * An immutable Color instance initialized to CSS color #0000FF
     * <span class="colorSwath" style="background: #0000FF;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.BLUE = freezeObject(Color.fromCssColorString('#0000FF'));

    /**
     * An immutable Color instance initialized to CSS color #8A2BE2
     * <span class="colorSwath" style="background: #8A2BE2;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.BLUEVIOLET = freezeObject(Color.fromCssColorString('#8A2BE2'));

    /**
     * An immutable Color instance initialized to CSS color #A52A2A
     * <span class="colorSwath" style="background: #A52A2A;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.BROWN = freezeObject(Color.fromCssColorString('#A52A2A'));

    /**
     * An immutable Color instance initialized to CSS color #DEB887
     * <span class="colorSwath" style="background: #DEB887;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.BURLYWOOD = freezeObject(Color.fromCssColorString('#DEB887'));

    /**
     * An immutable Color instance initialized to CSS color #5F9EA0
     * <span class="colorSwath" style="background: #5F9EA0;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.CADETBLUE = freezeObject(Color.fromCssColorString('#5F9EA0'));
    /**
     * An immutable Color instance initialized to CSS color #7FFF00
     * <span class="colorSwath" style="background: #7FFF00;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.CHARTREUSE = freezeObject(Color.fromCssColorString('#7FFF00'));

    /**
     * An immutable Color instance initialized to CSS color #D2691E
     * <span class="colorSwath" style="background: #D2691E;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.CHOCOLATE = freezeObject(Color.fromCssColorString('#D2691E'));

    /**
     * An immutable Color instance initialized to CSS color #FF7F50
     * <span class="colorSwath" style="background: #FF7F50;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.CORAL = freezeObject(Color.fromCssColorString('#FF7F50'));

    /**
     * An immutable Color instance initialized to CSS color #6495ED
     * <span class="colorSwath" style="background: #6495ED;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.CORNFLOWERBLUE = freezeObject(Color.fromCssColorString('#6495ED'));

    /**
     * An immutable Color instance initialized to CSS color #FFF8DC
     * <span class="colorSwath" style="background: #FFF8DC;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.CORNSILK = freezeObject(Color.fromCssColorString('#FFF8DC'));

    /**
     * An immutable Color instance initialized to CSS color #DC143C
     * <span class="colorSwath" style="background: #DC143C;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.CRIMSON = freezeObject(Color.fromCssColorString('#DC143C'));

    /**
     * An immutable Color instance initialized to CSS color #00FFFF
     * <span class="colorSwath" style="background: #00FFFF;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.CYAN = freezeObject(Color.fromCssColorString('#00FFFF'));

    /**
     * An immutable Color instance initialized to CSS color #00008B
     * <span class="colorSwath" style="background: #00008B;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.DARKBLUE = freezeObject(Color.fromCssColorString('#00008B'));

    /**
     * An immutable Color instance initialized to CSS color #008B8B
     * <span class="colorSwath" style="background: #008B8B;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.DARKCYAN = freezeObject(Color.fromCssColorString('#008B8B'));

    /**
     * An immutable Color instance initialized to CSS color #B8860B
     * <span class="colorSwath" style="background: #B8860B;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.DARKGOLDENROD = freezeObject(Color.fromCssColorString('#B8860B'));

    /**
     * An immutable Color instance initialized to CSS color #A9A9A9
     * <span class="colorSwath" style="background: #A9A9A9;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.DARKGRAY = freezeObject(Color.fromCssColorString('#A9A9A9'));

    /**
     * An immutable Color instance initialized to CSS color #006400
     * <span class="colorSwath" style="background: #006400;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.DARKGREEN = freezeObject(Color.fromCssColorString('#006400'));

    /**
     * An immutable Color instance initialized to CSS color #A9A9A9
     * <span class="colorSwath" style="background: #A9A9A9;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.DARKGREY = Color.DARKGRAY;

    /**
     * An immutable Color instance initialized to CSS color #BDB76B
     * <span class="colorSwath" style="background: #BDB76B;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.DARKKHAKI = freezeObject(Color.fromCssColorString('#BDB76B'));

    /**
     * An immutable Color instance initialized to CSS color #8B008B
     * <span class="colorSwath" style="background: #8B008B;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.DARKMAGENTA = freezeObject(Color.fromCssColorString('#8B008B'));

    /**
     * An immutable Color instance initialized to CSS color #556B2F
     * <span class="colorSwath" style="background: #556B2F;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.DARKOLIVEGREEN = freezeObject(Color.fromCssColorString('#556B2F'));

    /**
     * An immutable Color instance initialized to CSS color #FF8C00
     * <span class="colorSwath" style="background: #FF8C00;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.DARKORANGE = freezeObject(Color.fromCssColorString('#FF8C00'));

    /**
     * An immutable Color instance initialized to CSS color #9932CC
     * <span class="colorSwath" style="background: #9932CC;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.DARKORCHID = freezeObject(Color.fromCssColorString('#9932CC'));

    /**
     * An immutable Color instance initialized to CSS color #8B0000
     * <span class="colorSwath" style="background: #8B0000;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.DARKRED = freezeObject(Color.fromCssColorString('#8B0000'));

    /**
     * An immutable Color instance initialized to CSS color #E9967A
     * <span class="colorSwath" style="background: #E9967A;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.DARKSALMON = freezeObject(Color.fromCssColorString('#E9967A'));

    /**
     * An immutable Color instance initialized to CSS color #8FBC8F
     * <span class="colorSwath" style="background: #8FBC8F;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.DARKSEAGREEN = freezeObject(Color.fromCssColorString('#8FBC8F'));

    /**
     * An immutable Color instance initialized to CSS color #483D8B
     * <span class="colorSwath" style="background: #483D8B;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.DARKSLATEBLUE = freezeObject(Color.fromCssColorString('#483D8B'));

    /**
     * An immutable Color instance initialized to CSS color #2F4F4F
     * <span class="colorSwath" style="background: #2F4F4F;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.DARKSLATEGRAY = freezeObject(Color.fromCssColorString('#2F4F4F'));

    /**
     * An immutable Color instance initialized to CSS color #2F4F4F
     * <span class="colorSwath" style="background: #2F4F4F;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.DARKSLATEGREY = Color.DARKSLATEGRAY;

    /**
     * An immutable Color instance initialized to CSS color #00CED1
     * <span class="colorSwath" style="background: #00CED1;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.DARKTURQUOISE = freezeObject(Color.fromCssColorString('#00CED1'));

    /**
     * An immutable Color instance initialized to CSS color #9400D3
     * <span class="colorSwath" style="background: #9400D3;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.DARKVIOLET = freezeObject(Color.fromCssColorString('#9400D3'));

    /**
     * An immutable Color instance initialized to CSS color #FF1493
     * <span class="colorSwath" style="background: #FF1493;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.DEEPPINK = freezeObject(Color.fromCssColorString('#FF1493'));

    /**
     * An immutable Color instance initialized to CSS color #00BFFF
     * <span class="colorSwath" style="background: #00BFFF;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.DEEPSKYBLUE = freezeObject(Color.fromCssColorString('#00BFFF'));

    /**
     * An immutable Color instance initialized to CSS color #696969
     * <span class="colorSwath" style="background: #696969;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.DIMGRAY = freezeObject(Color.fromCssColorString('#696969'));

    /**
     * An immutable Color instance initialized to CSS color #696969
     * <span class="colorSwath" style="background: #696969;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.DIMGREY = Color.DIMGRAY;

    /**
     * An immutable Color instance initialized to CSS color #1E90FF
     * <span class="colorSwath" style="background: #1E90FF;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.DODGERBLUE = freezeObject(Color.fromCssColorString('#1E90FF'));

    /**
     * An immutable Color instance initialized to CSS color #B22222
     * <span class="colorSwath" style="background: #B22222;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.FIREBRICK = freezeObject(Color.fromCssColorString('#B22222'));

    /**
     * An immutable Color instance initialized to CSS color #FFFAF0
     * <span class="colorSwath" style="background: #FFFAF0;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.FLORALWHITE = freezeObject(Color.fromCssColorString('#FFFAF0'));

    /**
     * An immutable Color instance initialized to CSS color #228B22
     * <span class="colorSwath" style="background: #228B22;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.FORESTGREEN = freezeObject(Color.fromCssColorString('#228B22'));

    /**
     * An immutable Color instance initialized to CSS color #FF00FF
     * <span class="colorSwath" style="background: #FF00FF;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.FUCHSIA = freezeObject(Color.fromCssColorString('#FF00FF'));

    /**
     * An immutable Color instance initialized to CSS color #DCDCDC
     * <span class="colorSwath" style="background: #DCDCDC;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.GAINSBORO = freezeObject(Color.fromCssColorString('#DCDCDC'));

    /**
     * An immutable Color instance initialized to CSS color #F8F8FF
     * <span class="colorSwath" style="background: #F8F8FF;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.GHOSTWHITE = freezeObject(Color.fromCssColorString('#F8F8FF'));

    /**
     * An immutable Color instance initialized to CSS color #FFD700
     * <span class="colorSwath" style="background: #FFD700;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.GOLD = freezeObject(Color.fromCssColorString('#FFD700'));

    /**
     * An immutable Color instance initialized to CSS color #DAA520
     * <span class="colorSwath" style="background: #DAA520;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.GOLDENROD = freezeObject(Color.fromCssColorString('#DAA520'));

    /**
     * An immutable Color instance initialized to CSS color #808080
     * <span class="colorSwath" style="background: #808080;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.GRAY = freezeObject(Color.fromCssColorString('#808080'));

    /**
     * An immutable Color instance initialized to CSS color #008000
     * <span class="colorSwath" style="background: #008000;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.GREEN = freezeObject(Color.fromCssColorString('#008000'));

    /**
     * An immutable Color instance initialized to CSS color #ADFF2F
     * <span class="colorSwath" style="background: #ADFF2F;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.GREENYELLOW = freezeObject(Color.fromCssColorString('#ADFF2F'));

    /**
     * An immutable Color instance initialized to CSS color #808080
     * <span class="colorSwath" style="background: #808080;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.GREY = Color.GRAY;

    /**
     * An immutable Color instance initialized to CSS color #F0FFF0
     * <span class="colorSwath" style="background: #F0FFF0;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.HONEYDEW = freezeObject(Color.fromCssColorString('#F0FFF0'));

    /**
     * An immutable Color instance initialized to CSS color #FF69B4
     * <span class="colorSwath" style="background: #FF69B4;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.HOTPINK = freezeObject(Color.fromCssColorString('#FF69B4'));

    /**
     * An immutable Color instance initialized to CSS color #CD5C5C
     * <span class="colorSwath" style="background: #CD5C5C;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.INDIANRED = freezeObject(Color.fromCssColorString('#CD5C5C'));

    /**
     * An immutable Color instance initialized to CSS color #4B0082
     * <span class="colorSwath" style="background: #4B0082;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.INDIGO = freezeObject(Color.fromCssColorString('#4B0082'));

    /**
     * An immutable Color instance initialized to CSS color #FFFFF0
     * <span class="colorSwath" style="background: #FFFFF0;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.IVORY = freezeObject(Color.fromCssColorString('#FFFFF0'));

    /**
     * An immutable Color instance initialized to CSS color #F0E68C
     * <span class="colorSwath" style="background: #F0E68C;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.KHAKI = freezeObject(Color.fromCssColorString('#F0E68C'));

    /**
     * An immutable Color instance initialized to CSS color #E6E6FA
     * <span class="colorSwath" style="background: #E6E6FA;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.LAVENDER = freezeObject(Color.fromCssColorString('#E6E6FA'));

    /**
     * An immutable Color instance initialized to CSS color #FFF0F5
     * <span class="colorSwath" style="background: #FFF0F5;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.LAVENDAR_BLUSH = freezeObject(Color.fromCssColorString('#FFF0F5'));

    /**
     * An immutable Color instance initialized to CSS color #7CFC00
     * <span class="colorSwath" style="background: #7CFC00;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.LAWNGREEN = freezeObject(Color.fromCssColorString('#7CFC00'));

    /**
     * An immutable Color instance initialized to CSS color #FFFACD
     * <span class="colorSwath" style="background: #FFFACD;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.LEMONCHIFFON = freezeObject(Color.fromCssColorString('#FFFACD'));

    /**
     * An immutable Color instance initialized to CSS color #ADD8E6
     * <span class="colorSwath" style="background: #ADD8E6;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.LIGHTBLUE = freezeObject(Color.fromCssColorString('#ADD8E6'));

    /**
     * An immutable Color instance initialized to CSS color #F08080
     * <span class="colorSwath" style="background: #F08080;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.LIGHTCORAL = freezeObject(Color.fromCssColorString('#F08080'));

    /**
     * An immutable Color instance initialized to CSS color #E0FFFF
     * <span class="colorSwath" style="background: #E0FFFF;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.LIGHTCYAN = freezeObject(Color.fromCssColorString('#E0FFFF'));

    /**
     * An immutable Color instance initialized to CSS color #FAFAD2
     * <span class="colorSwath" style="background: #FAFAD2;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.LIGHTGOLDENRODYELLOW = freezeObject(Color.fromCssColorString('#FAFAD2'));

    /**
     * An immutable Color instance initialized to CSS color #D3D3D3
     * <span class="colorSwath" style="background: #D3D3D3;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.LIGHTGRAY = freezeObject(Color.fromCssColorString('#D3D3D3'));

    /**
     * An immutable Color instance initialized to CSS color #90EE90
     * <span class="colorSwath" style="background: #90EE90;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.LIGHTGREEN = freezeObject(Color.fromCssColorString('#90EE90'));

    /**
     * An immutable Color instance initialized to CSS color #D3D3D3
     * <span class="colorSwath" style="background: #D3D3D3;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.LIGHTGREY = Color.LIGHTGRAY;

    /**
     * An immutable Color instance initialized to CSS color #FFB6C1
     * <span class="colorSwath" style="background: #FFB6C1;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.LIGHTPINK = freezeObject(Color.fromCssColorString('#FFB6C1'));

    /**
     * An immutable Color instance initialized to CSS color #20B2AA
     * <span class="colorSwath" style="background: #20B2AA;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.LIGHTSEAGREEN = freezeObject(Color.fromCssColorString('#20B2AA'));

    /**
     * An immutable Color instance initialized to CSS color #87CEFA
     * <span class="colorSwath" style="background: #87CEFA;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.LIGHTSKYBLUE = freezeObject(Color.fromCssColorString('#87CEFA'));

    /**
     * An immutable Color instance initialized to CSS color #778899
     * <span class="colorSwath" style="background: #778899;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.LIGHTSLATEGRAY = freezeObject(Color.fromCssColorString('#778899'));

    /**
     * An immutable Color instance initialized to CSS color #778899
     * <span class="colorSwath" style="background: #778899;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.LIGHTSLATEGREY = Color.LIGHTSLATEGRAY;

    /**
     * An immutable Color instance initialized to CSS color #B0C4DE
     * <span class="colorSwath" style="background: #B0C4DE;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.LIGHTSTEELBLUE = freezeObject(Color.fromCssColorString('#B0C4DE'));

    /**
     * An immutable Color instance initialized to CSS color #FFFFE0
     * <span class="colorSwath" style="background: #FFFFE0;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.LIGHTYELLOW = freezeObject(Color.fromCssColorString('#FFFFE0'));

    /**
     * An immutable Color instance initialized to CSS color #00FF00
     * <span class="colorSwath" style="background: #00FF00;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.LIME = freezeObject(Color.fromCssColorString('#00FF00'));

    /**
     * An immutable Color instance initialized to CSS color #32CD32
     * <span class="colorSwath" style="background: #32CD32;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.LIMEGREEN = freezeObject(Color.fromCssColorString('#32CD32'));

    /**
     * An immutable Color instance initialized to CSS color #FAF0E6
     * <span class="colorSwath" style="background: #FAF0E6;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.LINEN = freezeObject(Color.fromCssColorString('#FAF0E6'));

    /**
     * An immutable Color instance initialized to CSS color #FF00FF
     * <span class="colorSwath" style="background: #FF00FF;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.MAGENTA = freezeObject(Color.fromCssColorString('#FF00FF'));

    /**
     * An immutable Color instance initialized to CSS color #800000
     * <span class="colorSwath" style="background: #800000;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.MAROON = freezeObject(Color.fromCssColorString('#800000'));

    /**
     * An immutable Color instance initialized to CSS color #66CDAA
     * <span class="colorSwath" style="background: #66CDAA;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.MEDIUMAQUAMARINE = freezeObject(Color.fromCssColorString('#66CDAA'));

    /**
     * An immutable Color instance initialized to CSS color #0000CD
     * <span class="colorSwath" style="background: #0000CD;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.MEDIUMBLUE = freezeObject(Color.fromCssColorString('#0000CD'));

    /**
     * An immutable Color instance initialized to CSS color #BA55D3
     * <span class="colorSwath" style="background: #BA55D3;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.MEDIUMORCHID = freezeObject(Color.fromCssColorString('#BA55D3'));

    /**
     * An immutable Color instance initialized to CSS color #9370DB
     * <span class="colorSwath" style="background: #9370DB;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.MEDIUMPURPLE = freezeObject(Color.fromCssColorString('#9370DB'));

    /**
     * An immutable Color instance initialized to CSS color #3CB371
     * <span class="colorSwath" style="background: #3CB371;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.MEDIUMSEAGREEN = freezeObject(Color.fromCssColorString('#3CB371'));

    /**
     * An immutable Color instance initialized to CSS color #7B68EE
     * <span class="colorSwath" style="background: #7B68EE;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.MEDIUMSLATEBLUE = freezeObject(Color.fromCssColorString('#7B68EE'));

    /**
     * An immutable Color instance initialized to CSS color #00FA9A
     * <span class="colorSwath" style="background: #00FA9A;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.MEDIUMSPRINGGREEN = freezeObject(Color.fromCssColorString('#00FA9A'));

    /**
     * An immutable Color instance initialized to CSS color #48D1CC
     * <span class="colorSwath" style="background: #48D1CC;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.MEDIUMTURQUOISE = freezeObject(Color.fromCssColorString('#48D1CC'));

    /**
     * An immutable Color instance initialized to CSS color #C71585
     * <span class="colorSwath" style="background: #C71585;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.MEDIUMVIOLETRED = freezeObject(Color.fromCssColorString('#C71585'));

    /**
     * An immutable Color instance initialized to CSS color #191970
     * <span class="colorSwath" style="background: #191970;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.MIDNIGHTBLUE = freezeObject(Color.fromCssColorString('#191970'));

    /**
     * An immutable Color instance initialized to CSS color #F5FFFA
     * <span class="colorSwath" style="background: #F5FFFA;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.MINTCREAM = freezeObject(Color.fromCssColorString('#F5FFFA'));

    /**
     * An immutable Color instance initialized to CSS color #FFE4E1
     * <span class="colorSwath" style="background: #FFE4E1;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.MISTYROSE = freezeObject(Color.fromCssColorString('#FFE4E1'));

    /**
     * An immutable Color instance initialized to CSS color #FFE4B5
     * <span class="colorSwath" style="background: #FFE4B5;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.MOCCASIN = freezeObject(Color.fromCssColorString('#FFE4B5'));

    /**
     * An immutable Color instance initialized to CSS color #FFDEAD
     * <span class="colorSwath" style="background: #FFDEAD;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.NAVAJOWHITE = freezeObject(Color.fromCssColorString('#FFDEAD'));

    /**
     * An immutable Color instance initialized to CSS color #000080
     * <span class="colorSwath" style="background: #000080;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.NAVY = freezeObject(Color.fromCssColorString('#000080'));

    /**
     * An immutable Color instance initialized to CSS color #FDF5E6
     * <span class="colorSwath" style="background: #FDF5E6;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.OLDLACE = freezeObject(Color.fromCssColorString('#FDF5E6'));

    /**
     * An immutable Color instance initialized to CSS color #808000
     * <span class="colorSwath" style="background: #808000;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.OLIVE = freezeObject(Color.fromCssColorString('#808000'));

    /**
     * An immutable Color instance initialized to CSS color #6B8E23
     * <span class="colorSwath" style="background: #6B8E23;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.OLIVEDRAB = freezeObject(Color.fromCssColorString('#6B8E23'));

    /**
     * An immutable Color instance initialized to CSS color #FFA500
     * <span class="colorSwath" style="background: #FFA500;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.ORANGE = freezeObject(Color.fromCssColorString('#FFA500'));

    /**
     * An immutable Color instance initialized to CSS color #FF4500
     * <span class="colorSwath" style="background: #FF4500;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.ORANGERED = freezeObject(Color.fromCssColorString('#FF4500'));

    /**
     * An immutable Color instance initialized to CSS color #DA70D6
     * <span class="colorSwath" style="background: #DA70D6;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.ORCHID = freezeObject(Color.fromCssColorString('#DA70D6'));

    /**
     * An immutable Color instance initialized to CSS color #EEE8AA
     * <span class="colorSwath" style="background: #EEE8AA;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.PALEGOLDENROD = freezeObject(Color.fromCssColorString('#EEE8AA'));

    /**
     * An immutable Color instance initialized to CSS color #98FB98
     * <span class="colorSwath" style="background: #98FB98;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.PALEGREEN = freezeObject(Color.fromCssColorString('#98FB98'));

    /**
     * An immutable Color instance initialized to CSS color #AFEEEE
     * <span class="colorSwath" style="background: #AFEEEE;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.PALETURQUOISE = freezeObject(Color.fromCssColorString('#AFEEEE'));

    /**
     * An immutable Color instance initialized to CSS color #DB7093
     * <span class="colorSwath" style="background: #DB7093;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.PALEVIOLETRED = freezeObject(Color.fromCssColorString('#DB7093'));

    /**
     * An immutable Color instance initialized to CSS color #FFEFD5
     * <span class="colorSwath" style="background: #FFEFD5;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.PAPAYAWHIP = freezeObject(Color.fromCssColorString('#FFEFD5'));

    /**
     * An immutable Color instance initialized to CSS color #FFDAB9
     * <span class="colorSwath" style="background: #FFDAB9;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.PEACHPUFF = freezeObject(Color.fromCssColorString('#FFDAB9'));

    /**
     * An immutable Color instance initialized to CSS color #CD853F
     * <span class="colorSwath" style="background: #CD853F;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.PERU = freezeObject(Color.fromCssColorString('#CD853F'));

    /**
     * An immutable Color instance initialized to CSS color #FFC0CB
     * <span class="colorSwath" style="background: #FFC0CB;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.PINK = freezeObject(Color.fromCssColorString('#FFC0CB'));

    /**
     * An immutable Color instance initialized to CSS color #DDA0DD
     * <span class="colorSwath" style="background: #DDA0DD;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.PLUM = freezeObject(Color.fromCssColorString('#DDA0DD'));

    /**
     * An immutable Color instance initialized to CSS color #B0E0E6
     * <span class="colorSwath" style="background: #B0E0E6;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.POWDERBLUE = freezeObject(Color.fromCssColorString('#B0E0E6'));

    /**
     * An immutable Color instance initialized to CSS color #800080
     * <span class="colorSwath" style="background: #800080;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.PURPLE = freezeObject(Color.fromCssColorString('#800080'));

    /**
     * An immutable Color instance initialized to CSS color #FF0000
     * <span class="colorSwath" style="background: #FF0000;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.RED = freezeObject(Color.fromCssColorString('#FF0000'));

    /**
     * An immutable Color instance initialized to CSS color #BC8F8F
     * <span class="colorSwath" style="background: #BC8F8F;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.ROSYBROWN = freezeObject(Color.fromCssColorString('#BC8F8F'));

    /**
     * An immutable Color instance initialized to CSS color #4169E1
     * <span class="colorSwath" style="background: #4169E1;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.ROYALBLUE = freezeObject(Color.fromCssColorString('#4169E1'));

    /**
     * An immutable Color instance initialized to CSS color #8B4513
     * <span class="colorSwath" style="background: #8B4513;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.SADDLEBROWN = freezeObject(Color.fromCssColorString('#8B4513'));

    /**
     * An immutable Color instance initialized to CSS color #FA8072
     * <span class="colorSwath" style="background: #FA8072;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.SALMON = freezeObject(Color.fromCssColorString('#FA8072'));

    /**
     * An immutable Color instance initialized to CSS color #F4A460
     * <span class="colorSwath" style="background: #F4A460;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.SANDYBROWN = freezeObject(Color.fromCssColorString('#F4A460'));

    /**
     * An immutable Color instance initialized to CSS color #2E8B57
     * <span class="colorSwath" style="background: #2E8B57;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.SEAGREEN = freezeObject(Color.fromCssColorString('#2E8B57'));

    /**
     * An immutable Color instance initialized to CSS color #FFF5EE
     * <span class="colorSwath" style="background: #FFF5EE;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.SEASHELL = freezeObject(Color.fromCssColorString('#FFF5EE'));

    /**
     * An immutable Color instance initialized to CSS color #A0522D
     * <span class="colorSwath" style="background: #A0522D;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.SIENNA = freezeObject(Color.fromCssColorString('#A0522D'));

    /**
     * An immutable Color instance initialized to CSS color #C0C0C0
     * <span class="colorSwath" style="background: #C0C0C0;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.SILVER = freezeObject(Color.fromCssColorString('#C0C0C0'));

    /**
     * An immutable Color instance initialized to CSS color #87CEEB
     * <span class="colorSwath" style="background: #87CEEB;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.SKYBLUE = freezeObject(Color.fromCssColorString('#87CEEB'));

    /**
     * An immutable Color instance initialized to CSS color #6A5ACD
     * <span class="colorSwath" style="background: #6A5ACD;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.SLATEBLUE = freezeObject(Color.fromCssColorString('#6A5ACD'));

    /**
     * An immutable Color instance initialized to CSS color #708090
     * <span class="colorSwath" style="background: #708090;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.SLATEGRAY = freezeObject(Color.fromCssColorString('#708090'));

    /**
     * An immutable Color instance initialized to CSS color #708090
     * <span class="colorSwath" style="background: #708090;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.SLATEGREY = Color.SLATEGRAY;

    /**
     * An immutable Color instance initialized to CSS color #FFFAFA
     * <span class="colorSwath" style="background: #FFFAFA;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.SNOW = freezeObject(Color.fromCssColorString('#FFFAFA'));

    /**
     * An immutable Color instance initialized to CSS color #00FF7F
     * <span class="colorSwath" style="background: #00FF7F;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.SPRINGGREEN = freezeObject(Color.fromCssColorString('#00FF7F'));

    /**
     * An immutable Color instance initialized to CSS color #4682B4
     * <span class="colorSwath" style="background: #4682B4;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.STEELBLUE = freezeObject(Color.fromCssColorString('#4682B4'));

    /**
     * An immutable Color instance initialized to CSS color #D2B48C
     * <span class="colorSwath" style="background: #D2B48C;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.TAN = freezeObject(Color.fromCssColorString('#D2B48C'));

    /**
     * An immutable Color instance initialized to CSS color #008080
     * <span class="colorSwath" style="background: #008080;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.TEAL = freezeObject(Color.fromCssColorString('#008080'));

    /**
     * An immutable Color instance initialized to CSS color #D8BFD8
     * <span class="colorSwath" style="background: #D8BFD8;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.THISTLE = freezeObject(Color.fromCssColorString('#D8BFD8'));

    /**
     * An immutable Color instance initialized to CSS color #FF6347
     * <span class="colorSwath" style="background: #FF6347;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.TOMATO = freezeObject(Color.fromCssColorString('#FF6347'));

    /**
     * An immutable Color instance initialized to CSS color #40E0D0
     * <span class="colorSwath" style="background: #40E0D0;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.TURQUOISE = freezeObject(Color.fromCssColorString('#40E0D0'));

    /**
     * An immutable Color instance initialized to CSS color #EE82EE
     * <span class="colorSwath" style="background: #EE82EE;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.VIOLET = freezeObject(Color.fromCssColorString('#EE82EE'));

    /**
     * An immutable Color instance initialized to CSS color #F5DEB3
     * <span class="colorSwath" style="background: #F5DEB3;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.WHEAT = freezeObject(Color.fromCssColorString('#F5DEB3'));

    /**
     * An immutable Color instance initialized to CSS color #FFFFFF
     * <span class="colorSwath" style="background: #FFFFFF;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.WHITE = freezeObject(Color.fromCssColorString('#FFFFFF'));

    /**
     * An immutable Color instance initialized to CSS color #F5F5F5
     * <span class="colorSwath" style="background: #F5F5F5;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.WHITESMOKE = freezeObject(Color.fromCssColorString('#F5F5F5'));

    /**
     * An immutable Color instance initialized to CSS color #FFFF00
     * <span class="colorSwath" style="background: #FFFF00;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.YELLOW = freezeObject(Color.fromCssColorString('#FFFF00'));

    /**
     * An immutable Color instance initialized to CSS color #9ACD32
     * <span class="colorSwath" style="background: #9ACD32;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.YELLOWGREEN = freezeObject(Color.fromCssColorString('#9ACD32'));

    /**
     * An immutable Color instance initialized to CSS transparent.
     * <span class="colorSwath" style="background: transparent;"></span>
     *
     * @constant
     * @type {Color}
     */
    Color.TRANSPARENT = freezeObject(new Color(0, 0, 0, 0));

    module.exports= Color;

},{"./Check":11,"./FeatureDetection":16,"./Math":21,"./defaultValue":40,"./defined":42,"./freezeObject":45}],13:[function(require,module,exports){
var defined=require('./defined');

    'use strict';

    /**
     * Constructs an exception object that is thrown due to a developer error, e.g., invalid argument,
     * argument out of range, etc.  This exception should only be thrown during development;
     * it usually indicates a bug in the calling code.  This exception should never be
     * caught; instead the calling code should strive not to generate it.
     * <br /><br />
     * On the other hand, a {@link RuntimeError} indicates an exception that may
     * be thrown at runtime, e.g., out of memory, that the calling code should be prepared
     * to catch.
     *
     * @alias DeveloperError
     * @constructor
     * @extends Error
     *
     * @param {String} [message] The error message for this exception.
     *
     * @see RuntimeError
     */
    function DeveloperError(message) {
        /**
         * 'DeveloperError' indicating that this exception was thrown due to a developer error.
         * @type {String}
         * @readonly
         */
        this.name = 'DeveloperError';

        /**
         * The explanation for why this exception was thrown.
         * @type {String}
         * @readonly
         */
        this.message = message;

        //Browsers such as IE don't have a stack property until you actually throw the error.
        var stack;
        try {
            throw new Error();
        } catch (e) {
            stack = e.stack;
        }

        /**
         * The stack trace of this exception, if available.
         * @type {String}
         * @readonly
         */
        this.stack = stack;
    }

    if (defined(Object.create)) {
        DeveloperError.prototype = Object.create(Error.prototype);
        DeveloperError.prototype.constructor = DeveloperError;
    }

    DeveloperError.prototype.toString = function() {
        var str = this.name + ': ' + this.message;

        if (defined(this.stack)) {
            str += '\n' + this.stack.toString();
        }

        return str;
    };

    /**
     * @private
     */
    DeveloperError.throwInstantiationError = function() {
        throw new DeveloperError('This function defines an interface and should not be called directly.');
    };

    module.exports= DeveloperError;

},{"./defined":42}],14:[function(require,module,exports){
var Cartesian3=require('./Cartesian3');
var Cartographic=require('./Cartographic');
var Check=require('./Check');
var defaultValue=require('./defaultValue');
var defined=require('./defined');
var defineProperties=require('./defineProperties');
var DeveloperError=require('./DeveloperError');
var freezeObject=require('./freezeObject');
var CesiumMath=require('./Math');
var scaleToGeodeticSurface=require('./scaleToGeodeticSurface');

    'use strict';

    function initialize(ellipsoid, x, y, z) {
        x = defaultValue(x, 0.0);
        y = defaultValue(y, 0.0);
        z = defaultValue(z, 0.0);

        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.number.greaterThanOrEquals('x', x, 0.0);
        Check.typeOf.number.greaterThanOrEquals('y', y, 0.0);
        Check.typeOf.number.greaterThanOrEquals('z', z, 0.0);
        //>>includeEnd('debug');

        ellipsoid._radii = new Cartesian3(x, y, z);

        ellipsoid._radiiSquared = new Cartesian3(x * x,
                                            y * y,
                                            z * z);

        ellipsoid._radiiToTheFourth = new Cartesian3(x * x * x * x,
                                                y * y * y * y,
                                                z * z * z * z);

        ellipsoid._oneOverRadii = new Cartesian3(x === 0.0 ? 0.0 : 1.0 / x,
                                            y === 0.0 ? 0.0 : 1.0 / y,
                                            z === 0.0 ? 0.0 : 1.0 / z);

        ellipsoid._oneOverRadiiSquared = new Cartesian3(x === 0.0 ? 0.0 : 1.0 / (x * x),
                                                   y === 0.0 ? 0.0 : 1.0 / (y * y),
                                                   z === 0.0 ? 0.0 : 1.0 / (z * z));

        ellipsoid._minimumRadius = Math.min(x, y, z);

        ellipsoid._maximumRadius = Math.max(x, y, z);

        ellipsoid._centerToleranceSquared = CesiumMath.EPSILON1;

        if (ellipsoid._radiiSquared.z !== 0) {
            ellipsoid._squaredXOverSquaredZ = ellipsoid._radiiSquared.x / ellipsoid._radiiSquared.z;
        }
    }

    /**
     * A quadratic surface defined in Cartesian coordinates by the equation
     * <code>(x / a)^2 + (y / b)^2 + (z / c)^2 = 1</code>.  Primarily used
     * by Cesium to represent the shape of planetary bodies.
     *
     * Rather than constructing this object directly, one of the provided
     * constants is normally used.
     * @alias Ellipsoid
     * @constructor
     *
     * @param {Number} [x=0] The radius in the x direction.
     * @param {Number} [y=0] The radius in the y direction.
     * @param {Number} [z=0] The radius in the z direction.
     *
     * @exception {DeveloperError} All radii components must be greater than or equal to zero.
     *
     * @see Ellipsoid.fromCartesian3
     * @see Ellipsoid.WGS84
     * @see Ellipsoid.UNIT_SPHERE
     */
    function Ellipsoid(x, y, z) {
        this._radii = undefined;
        this._radiiSquared = undefined;
        this._radiiToTheFourth = undefined;
        this._oneOverRadii = undefined;
        this._oneOverRadiiSquared = undefined;
        this._minimumRadius = undefined;
        this._maximumRadius = undefined;
        this._centerToleranceSquared = undefined;
        this._squaredXOverSquaredZ = undefined;

        initialize(this, x, y, z);
    }

    defineProperties(Ellipsoid.prototype, {
        /**
         * Gets the radii of the ellipsoid.
         * @memberof Ellipsoid.prototype
         * @type {Cartesian3}
         * @readonly
         */
        radii : {
            get: function() {
                return this._radii;
            }
        },
        /**
         * Gets the squared radii of the ellipsoid.
         * @memberof Ellipsoid.prototype
         * @type {Cartesian3}
         * @readonly
         */
        radiiSquared : {
            get : function() {
                return this._radiiSquared;
            }
        },
        /**
         * Gets the radii of the ellipsoid raise to the fourth power.
         * @memberof Ellipsoid.prototype
         * @type {Cartesian3}
         * @readonly
         */
        radiiToTheFourth : {
            get : function() {
                return this._radiiToTheFourth;
            }
        },
        /**
         * Gets one over the radii of the ellipsoid.
         * @memberof Ellipsoid.prototype
         * @type {Cartesian3}
         * @readonly
         */
        oneOverRadii : {
            get : function() {
                return this._oneOverRadii;
            }
        },
        /**
         * Gets one over the squared radii of the ellipsoid.
         * @memberof Ellipsoid.prototype
         * @type {Cartesian3}
         * @readonly
         */
        oneOverRadiiSquared : {
            get : function() {
                return this._oneOverRadiiSquared;
            }
        },
        /**
         * Gets the minimum radius of the ellipsoid.
         * @memberof Ellipsoid.prototype
         * @type {Number}
         * @readonly
         */
        minimumRadius : {
            get : function() {
                return this._minimumRadius;
            }
        },
        /**
         * Gets the maximum radius of the ellipsoid.
         * @memberof Ellipsoid.prototype
         * @type {Number}
         * @readonly
         */
        maximumRadius : {
            get : function() {
                return this._maximumRadius;
            }
        }
    });

    /**
     * Duplicates an Ellipsoid instance.
     *
     * @param {Ellipsoid} ellipsoid The ellipsoid to duplicate.
     * @param {Ellipsoid} [result] The object onto which to store the result, or undefined if a new
     *                    instance should be created.
     * @returns {Ellipsoid} The cloned Ellipsoid. (Returns undefined if ellipsoid is undefined)
     */
    Ellipsoid.clone = function(ellipsoid, result) {
        if (!defined(ellipsoid)) {
            return undefined;
        }
        var radii = ellipsoid._radii;

        if (!defined(result)) {
            return new Ellipsoid(radii.x, radii.y, radii.z);
        }

        Cartesian3.clone(radii, result._radii);
        Cartesian3.clone(ellipsoid._radiiSquared, result._radiiSquared);
        Cartesian3.clone(ellipsoid._radiiToTheFourth, result._radiiToTheFourth);
        Cartesian3.clone(ellipsoid._oneOverRadii, result._oneOverRadii);
        Cartesian3.clone(ellipsoid._oneOverRadiiSquared, result._oneOverRadiiSquared);
        result._minimumRadius = ellipsoid._minimumRadius;
        result._maximumRadius = ellipsoid._maximumRadius;
        result._centerToleranceSquared = ellipsoid._centerToleranceSquared;

        return result;
    };

    /**
     * Computes an Ellipsoid from a Cartesian specifying the radii in x, y, and z directions.
     *
     * @param {Cartesian3} [cartesian=Cartesian3.ZERO] The ellipsoid's radius in the x, y, and z directions.
     * @param {Ellipsoid} [result] The object onto which to store the result, or undefined if a new
     *                    instance should be created.
     * @returns {Ellipsoid} A new Ellipsoid instance.
     *
     * @exception {DeveloperError} All radii components must be greater than or equal to zero.
     *
     * @see Ellipsoid.WGS84
     * @see Ellipsoid.UNIT_SPHERE
     */
    Ellipsoid.fromCartesian3 = function(cartesian, result) {
        if (!defined(result)) {
            result = new Ellipsoid();
        }

        if (!defined(cartesian)) {
            return result;
        }

        initialize(result, cartesian.x, cartesian.y, cartesian.z);
        return result;
    };

    /**
     * An Ellipsoid instance initialized to the WGS84 standard.
     *
     * @type {Ellipsoid}
     * @constant
     */
    Ellipsoid.WGS84 = freezeObject(new Ellipsoid(6378137.0, 6378137.0, 6356752.3142451793));

    /**
     * An Ellipsoid instance initialized to radii of (1.0, 1.0, 1.0).
     *
     * @type {Ellipsoid}
     * @constant
     */
    Ellipsoid.UNIT_SPHERE = freezeObject(new Ellipsoid(1.0, 1.0, 1.0));

    /**
     * An Ellipsoid instance initialized to a sphere with the lunar radius.
     *
     * @type {Ellipsoid}
     * @constant
     */
    Ellipsoid.MOON = freezeObject(new Ellipsoid(CesiumMath.LUNAR_RADIUS, CesiumMath.LUNAR_RADIUS, CesiumMath.LUNAR_RADIUS));

    /**
     * Duplicates an Ellipsoid instance.
     *
     * @param {Ellipsoid} [result] The object onto which to store the result, or undefined if a new
     *                    instance should be created.
     * @returns {Ellipsoid} The cloned Ellipsoid.
     */
    Ellipsoid.prototype.clone = function(result) {
        return Ellipsoid.clone(this, result);
    };

    /**
     * The number of elements used to pack the object into an array.
     * @type {Number}
     */
    Ellipsoid.packedLength = Cartesian3.packedLength;

    /**
     * Stores the provided instance into the provided array.
     *
     * @param {Ellipsoid} value The value to pack.
     * @param {Number[]} array The array to pack into.
     * @param {Number} [startingIndex=0] The index into the array at which to start packing the elements.
     *
     * @returns {Number[]} The array that was packed into
     */
    Ellipsoid.pack = function(value, array, startingIndex) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('value', value);
        Check.defined('array', array);
        //>>includeEnd('debug');

        startingIndex = defaultValue(startingIndex, 0);

        Cartesian3.pack(value._radii, array, startingIndex);

        return array;
    };

    /**
     * Retrieves an instance from a packed array.
     *
     * @param {Number[]} array The packed array.
     * @param {Number} [startingIndex=0] The starting index of the element to be unpacked.
     * @param {Ellipsoid} [result] The object into which to store the result.
     * @returns {Ellipsoid} The modified result parameter or a new Ellipsoid instance if one was not provided.
     */
    Ellipsoid.unpack = function(array, startingIndex, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('array', array);
        //>>includeEnd('debug');

        startingIndex = defaultValue(startingIndex, 0);

        var radii = Cartesian3.unpack(array, startingIndex);
        return Ellipsoid.fromCartesian3(radii, result);
    };

    /**
     * Computes the unit vector directed from the center of this ellipsoid toward the provided Cartesian position.
     * @function
     *
     * @param {Cartesian3} cartesian The Cartesian for which to to determine the geocentric normal.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if none was provided.
     */
    Ellipsoid.prototype.geocentricSurfaceNormal = Cartesian3.normalize;

    /**
     * Computes the normal of the plane tangent to the surface of the ellipsoid at the provided position.
     *
     * @param {Cartographic} cartographic The cartographic position for which to to determine the geodetic normal.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if none was provided.
     */
    Ellipsoid.prototype.geodeticSurfaceNormalCartographic = function(cartographic, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('cartographic', cartographic);
        //>>includeEnd('debug');

        var longitude = cartographic.longitude;
        var latitude = cartographic.latitude;
        var cosLatitude = Math.cos(latitude);

        var x = cosLatitude * Math.cos(longitude);
        var y = cosLatitude * Math.sin(longitude);
        var z = Math.sin(latitude);

        if (!defined(result)) {
            result = new Cartesian3();
        }
        result.x = x;
        result.y = y;
        result.z = z;
        return Cartesian3.normalize(result, result);
    };

    /**
     * Computes the normal of the plane tangent to the surface of the ellipsoid at the provided position.
     *
     * @param {Cartesian3} cartesian The Cartesian position for which to to determine the surface normal.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if none was provided.
     */
    Ellipsoid.prototype.geodeticSurfaceNormal = function(cartesian, result) {
        if (!defined(result)) {
            result = new Cartesian3();
        }
        result = Cartesian3.multiplyComponents(cartesian, this._oneOverRadiiSquared, result);
        return Cartesian3.normalize(result, result);
    };

    var cartographicToCartesianNormal = new Cartesian3();
    var cartographicToCartesianK = new Cartesian3();

    /**
     * Converts the provided cartographic to Cartesian representation.
     *
     * @param {Cartographic} cartographic The cartographic position.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if none was provided.
     *
     * @example
     * //Create a Cartographic and determine it's Cartesian representation on a WGS84 ellipsoid.
     * var position = new Cesium.Cartographic(Cesium.Math.toRadians(21), Cesium.Math.toRadians(78), 5000);
     * var cartesianPosition = Cesium.Ellipsoid.WGS84.cartographicToCartesian(position);
     */
    Ellipsoid.prototype.cartographicToCartesian = function(cartographic, result) {
        //`cartographic is required` is thrown from geodeticSurfaceNormalCartographic.
        var n = cartographicToCartesianNormal;
        var k = cartographicToCartesianK;
        this.geodeticSurfaceNormalCartographic(cartographic, n);
        Cartesian3.multiplyComponents(this._radiiSquared, n, k);
        var gamma = Math.sqrt(Cartesian3.dot(n, k));
        Cartesian3.divideByScalar(k, gamma, k);
        Cartesian3.multiplyByScalar(n, cartographic.height, n);

        if (!defined(result)) {
            result = new Cartesian3();
        }
        return Cartesian3.add(k, n, result);
    };

    /**
     * Converts the provided array of cartographics to an array of Cartesians.
     *
     * @param {Cartographic[]} cartographics An array of cartographic positions.
     * @param {Cartesian3[]} [result] The object onto which to store the result.
     * @returns {Cartesian3[]} The modified result parameter or a new Array instance if none was provided.
     *
     * @example
     * //Convert an array of Cartographics and determine their Cartesian representation on a WGS84 ellipsoid.
     * var positions = [new Cesium.Cartographic(Cesium.Math.toRadians(21), Cesium.Math.toRadians(78), 0),
     *                  new Cesium.Cartographic(Cesium.Math.toRadians(21.321), Cesium.Math.toRadians(78.123), 100),
     *                  new Cesium.Cartographic(Cesium.Math.toRadians(21.645), Cesium.Math.toRadians(78.456), 250)];
     * var cartesianPositions = Cesium.Ellipsoid.WGS84.cartographicArrayToCartesianArray(positions);
     */
    Ellipsoid.prototype.cartographicArrayToCartesianArray = function(cartographics, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('cartographics', cartographics);
        //>>includeEnd('debug')

        var length = cartographics.length;
        if (!defined(result)) {
            result = new Array(length);
        } else {
            result.length = length;
        }
        for ( var i = 0; i < length; i++) {
            result[i] = this.cartographicToCartesian(cartographics[i], result[i]);
        }
        return result;
    };

    var cartesianToCartographicN = new Cartesian3();
    var cartesianToCartographicP = new Cartesian3();
    var cartesianToCartographicH = new Cartesian3();

    /**
     * Converts the provided cartesian to cartographic representation.
     * The cartesian is undefined at the center of the ellipsoid.
     *
     * @param {Cartesian3} cartesian The Cartesian position to convert to cartographic representation.
     * @param {Cartographic} [result] The object onto which to store the result.
     * @returns {Cartographic} The modified result parameter, new Cartographic instance if none was provided, or undefined if the cartesian is at the center of the ellipsoid.
     *
     * @example
     * //Create a Cartesian and determine it's Cartographic representation on a WGS84 ellipsoid.
     * var position = new Cesium.Cartesian3(17832.12, 83234.52, 952313.73);
     * var cartographicPosition = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
     */
    Ellipsoid.prototype.cartesianToCartographic = function(cartesian, result) {
        //`cartesian is required.` is thrown from scaleToGeodeticSurface
        var p = this.scaleToGeodeticSurface(cartesian, cartesianToCartographicP);

        if (!defined(p)) {
            return undefined;
        }

        var n = this.geodeticSurfaceNormal(p, cartesianToCartographicN);
        var h = Cartesian3.subtract(cartesian, p, cartesianToCartographicH);

        var longitude = Math.atan2(n.y, n.x);
        var latitude = Math.asin(n.z);
        var height = CesiumMath.sign(Cartesian3.dot(h, cartesian)) * Cartesian3.magnitude(h);

        if (!defined(result)) {
            return new Cartographic(longitude, latitude, height);
        }
        result.longitude = longitude;
        result.latitude = latitude;
        result.height = height;
        return result;
    };

    /**
     * Converts the provided array of cartesians to an array of cartographics.
     *
     * @param {Cartesian3[]} cartesians An array of Cartesian positions.
     * @param {Cartographic[]} [result] The object onto which to store the result.
     * @returns {Cartographic[]} The modified result parameter or a new Array instance if none was provided.
     *
     * @example
     * //Create an array of Cartesians and determine their Cartographic representation on a WGS84 ellipsoid.
     * var positions = [new Cesium.Cartesian3(17832.12, 83234.52, 952313.73),
     *                  new Cesium.Cartesian3(17832.13, 83234.53, 952313.73),
     *                  new Cesium.Cartesian3(17832.14, 83234.54, 952313.73)]
     * var cartographicPositions = Cesium.Ellipsoid.WGS84.cartesianArrayToCartographicArray(positions);
     */
    Ellipsoid.prototype.cartesianArrayToCartographicArray = function(cartesians, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('cartesians', cartesians);
        //>>includeEnd('debug');

        var length = cartesians.length;
        if (!defined(result)) {
            result = new Array(length);
        } else {
            result.length = length;
        }
        for ( var i = 0; i < length; ++i) {
            result[i] = this.cartesianToCartographic(cartesians[i], result[i]);
        }
        return result;
    };

    /**
     * Scales the provided Cartesian position along the geodetic surface normal
     * so that it is on the surface of this ellipsoid.  If the position is
     * at the center of the ellipsoid, this function returns undefined.
     *
     * @param {Cartesian3} cartesian The Cartesian position to scale.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter, a new Cartesian3 instance if none was provided, or undefined if the position is at the center.
     */
    Ellipsoid.prototype.scaleToGeodeticSurface = function(cartesian, result) {
        return scaleToGeodeticSurface(cartesian, this._oneOverRadii, this._oneOverRadiiSquared, this._centerToleranceSquared, result);
    };

    /**
     * Scales the provided Cartesian position along the geocentric surface normal
     * so that it is on the surface of this ellipsoid.
     *
     * @param {Cartesian3} cartesian The Cartesian position to scale.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if none was provided.
     */
    Ellipsoid.prototype.scaleToGeocentricSurface = function(cartesian, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('cartesian', cartesian);
        //>>includeEnd('debug');

        if (!defined(result)) {
            result = new Cartesian3();
        }

        var positionX = cartesian.x;
        var positionY = cartesian.y;
        var positionZ = cartesian.z;
        var oneOverRadiiSquared = this._oneOverRadiiSquared;

        var beta = 1.0 / Math.sqrt((positionX * positionX) * oneOverRadiiSquared.x +
                                   (positionY * positionY) * oneOverRadiiSquared.y +
                                   (positionZ * positionZ) * oneOverRadiiSquared.z);

        return Cartesian3.multiplyByScalar(cartesian, beta, result);
    };

    /**
     * Transforms a Cartesian X, Y, Z position to the ellipsoid-scaled space by multiplying
     * its components by the result of {@link Ellipsoid#oneOverRadii}.
     *
     * @param {Cartesian3} position The position to transform.
     * @param {Cartesian3} [result] The position to which to copy the result, or undefined to create and
     *        return a new instance.
     * @returns {Cartesian3} The position expressed in the scaled space.  The returned instance is the
     *          one passed as the result parameter if it is not undefined, or a new instance of it is.
     */
    Ellipsoid.prototype.transformPositionToScaledSpace = function(position, result) {
        if (!defined(result)) {
            result = new Cartesian3();
        }

        return Cartesian3.multiplyComponents(position, this._oneOverRadii, result);
    };

    /**
     * Transforms a Cartesian X, Y, Z position from the ellipsoid-scaled space by multiplying
     * its components by the result of {@link Ellipsoid#radii}.
     *
     * @param {Cartesian3} position The position to transform.
     * @param {Cartesian3} [result] The position to which to copy the result, or undefined to create and
     *        return a new instance.
     * @returns {Cartesian3} The position expressed in the unscaled space.  The returned instance is the
     *          one passed as the result parameter if it is not undefined, or a new instance of it is.
     */
    Ellipsoid.prototype.transformPositionFromScaledSpace = function(position, result) {
        if (!defined(result)) {
            result = new Cartesian3();
        }

        return Cartesian3.multiplyComponents(position, this._radii, result);
    };

    /**
     * Compares this Ellipsoid against the provided Ellipsoid componentwise and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     *
     * @param {Ellipsoid} [right] The other Ellipsoid.
     * @returns {Boolean} <code>true</code> if they are equal, <code>false</code> otherwise.
     */
    Ellipsoid.prototype.equals = function(right) {
        return (this === right) ||
               (defined(right) &&
                Cartesian3.equals(this._radii, right._radii));
    };

    /**
     * Creates a string representing this Ellipsoid in the format '(radii.x, radii.y, radii.z)'.
     *
     * @returns {String} A string representing this ellipsoid in the format '(radii.x, radii.y, radii.z)'.
     */
    Ellipsoid.prototype.toString = function() {
        return this._radii.toString();
    };

    /**
     * Computes a point which is the intersection of the surface normal with the z-axis.
     *
     * @param {Cartesian3} position the position. must be on the surface of the ellipsoid.
     * @param {Number} [buffer = 0.0] A buffer to subtract from the ellipsoid size when checking if the point is inside the ellipsoid.
     *                                In earth case, with common earth datums, there is no need for this buffer since the intersection point is always (relatively) very close to the center.
     *                                In WGS84 datum, intersection point is at max z = +-42841.31151331382 (0.673% of z-axis).
     *                                Intersection point could be outside the ellipsoid if the ratio of MajorAxis / AxisOfRotation is bigger than the square root of 2
     * @param {Cartesian3} [result] The cartesian to which to copy the result, or undefined to create and
     *        return a new instance.
     * @returns {Cartesian3 | undefined} the intersection point if it's inside the ellipsoid, undefined otherwise
     *
     * @exception {DeveloperError} position is required.
     * @exception {DeveloperError} Ellipsoid must be an ellipsoid of revolution (radii.x == radii.y).
     * @exception {DeveloperError} Ellipsoid.radii.z must be greater than 0.
     */
    Ellipsoid.prototype.getSurfaceNormalIntersectionWithZAxis = function(position, buffer, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('position', position);

        if (!CesiumMath.equalsEpsilon(this._radii.x, this._radii.y, CesiumMath.EPSILON15)) {
            throw new DeveloperError('Ellipsoid must be an ellipsoid of revolution (radii.x == radii.y)');
        }

        Check.typeOf.number.greaterThan('Ellipsoid.radii.z', this._radii.z, 0);
        //>>includeEnd('debug');

        buffer = defaultValue(buffer, 0.0);

        var squaredXOverSquaredZ = this._squaredXOverSquaredZ;

        if (!defined(result)) {
            result = new Cartesian3();
        }

        result.x = 0.0;
        result.y = 0.0;
        result.z = position.z * (1 - squaredXOverSquaredZ);

        if (Math.abs(result.z) >= this._radii.z - buffer) {
            return undefined;
        }

        return result;
    };

    module.exports= Ellipsoid;

},{"./Cartesian3":8,"./Cartographic":10,"./Check":11,"./DeveloperError":13,"./Math":21,"./defaultValue":40,"./defineProperties":41,"./defined":42,"./freezeObject":45,"./scaleToGeodeticSurface":58}],15:[function(require,module,exports){
var Check=require('./Check');
var defined=require('./defined');
var defineProperties=require('./defineProperties');

    'use strict';

    /**
     * A generic utility class for managing subscribers for a particular event.
     * This class is usually instantiated inside of a container class and
     * exposed as a property for others to subscribe to.
     *
     * @alias Event
     * @constructor
     * @example
     * MyObject.prototype.myListener = function(arg1, arg2) {
     *     this.myArg1Copy = arg1;
     *     this.myArg2Copy = arg2;
     * }
     *
     * var myObjectInstance = new MyObject();
     * var evt = new Cesium.Event();
     * evt.addEventListener(MyObject.prototype.myListener, myObjectInstance);
     * evt.raiseEvent('1', '2');
     * evt.removeEventListener(MyObject.prototype.myListener);
     */
    function Event() {
        this._listeners = [];
        this._scopes = [];
        this._toRemove = [];
        this._insideRaiseEvent = false;
    }

    defineProperties(Event.prototype, {
        /**
         * The number of listeners currently subscribed to the event.
         * @memberof Event.prototype
         * @type {Number}
         * @readonly
         */
        numberOfListeners : {
            get : function() {
                return this._listeners.length - this._toRemove.length;
            }
        }
    });

    /**
     * Registers a callback function to be executed whenever the event is raised.
     * An optional scope can be provided to serve as the <code>this</code> pointer
     * in which the function will execute.
     *
     * @param {Function} listener The function to be executed when the event is raised.
     * @param {Object} [scope] An optional object scope to serve as the <code>this</code>
     *        pointer in which the listener function will execute.
     * @returns {Event~RemoveCallback} A function that will remove this event listener when invoked.
     *
     * @see Event#raiseEvent
     * @see Event#removeEventListener
     */
    Event.prototype.addEventListener = function(listener, scope) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.func('listener', listener);
        //>>includeEnd('debug');

        this._listeners.push(listener);
        this._scopes.push(scope);

        var event = this;
        return function() {
            event.removeEventListener(listener, scope);
        };
    };

    /**
     * Unregisters a previously registered callback.
     *
     * @param {Function} listener The function to be unregistered.
     * @param {Object} [scope] The scope that was originally passed to addEventListener.
     * @returns {Boolean} <code>true</code> if the listener was removed; <code>false</code> if the listener and scope are not registered with the event.
     *
     * @see Event#addEventListener
     * @see Event#raiseEvent
     */
    Event.prototype.removeEventListener = function(listener, scope) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.func('listener', listener);
        //>>includeEnd('debug');

        var listeners = this._listeners;
        var scopes = this._scopes;

        var index = -1;
        for (var i = 0; i < listeners.length; i++) {
            if (listeners[i] === listener && scopes[i] === scope) {
                index = i;
                break;
            }
        }

        if (index !== -1) {
            if (this._insideRaiseEvent) {
                //In order to allow removing an event subscription from within
                //a callback, we don't actually remove the items here.  Instead
                //remember the index they are at and undefined their value.
                this._toRemove.push(index);
                listeners[index] = undefined;
                scopes[index] = undefined;
            } else {
                listeners.splice(index, 1);
                scopes.splice(index, 1);
            }
            return true;
        }

        return false;
    };

    function compareNumber(a,b) {
        return b - a;
    }

    /**
     * Raises the event by calling each registered listener with all supplied arguments.
     *
     * @param {*} arguments This method takes any number of parameters and passes them through to the listener functions.
     *
     * @see Event#addEventListener
     * @see Event#removeEventListener
     */
    Event.prototype.raiseEvent = function() {
        this._insideRaiseEvent = true;

        var i;
        var listeners = this._listeners;
        var scopes = this._scopes;
        var length = listeners.length;

        for (i = 0; i < length; i++) {
            var listener = listeners[i];
            if (defined(listener)) {
                listeners[i].apply(scopes[i], arguments);
            }
        }

        //Actually remove items removed in removeEventListener.
        var toRemove = this._toRemove;
        length = toRemove.length;
        if (length > 0) {
            toRemove.sort(compareNumber);
            for (i = 0; i < length; i++) {
                var index = toRemove[i];
                listeners.splice(index, 1);
                scopes.splice(index, 1);
            }
            toRemove.length = 0;
        }

        this._insideRaiseEvent = false;
    };

    /**
     * A function that removes a listener.
     * @callback Event~RemoveCallback
     */

    module.exports= Event;

},{"./Check":11,"./defineProperties":41,"./defined":42}],16:[function(require,module,exports){
var defaultValue=require('./defaultValue');
var defined=require('./defined');
var defineProperties=require('./defineProperties');
var DeveloperError=require('./DeveloperError');
var Fullscreen=require('./Fullscreen');
var when=require('when');

    'use strict';
    /*global CanvasPixelArray*/

    var theNavigator;
    if (typeof navigator !== 'undefined') {
        theNavigator = navigator;
    } else {
        theNavigator = {};
    }

    function extractVersion(versionString) {
        var parts = versionString.split('.');
        for (var i = 0, len = parts.length; i < len; ++i) {
            parts[i] = parseInt(parts[i], 10);
        }
        return parts;
    }

    var isChromeResult;
    var chromeVersionResult;
    function isChrome() {
        if (!defined(isChromeResult)) {
            isChromeResult = false;
            // Edge contains Chrome in the user agent too
            if (!isEdge()) {
                var fields = (/ Chrome\/([\.0-9]+)/).exec(theNavigator.userAgent);
                if (fields !== null) {
                    isChromeResult = true;
                    chromeVersionResult = extractVersion(fields[1]);
                }
            }
        }

        return isChromeResult;
    }

    function chromeVersion() {
        return isChrome() && chromeVersionResult;
    }

    var isSafariResult;
    var safariVersionResult;
    function isSafari() {
        if (!defined(isSafariResult)) {
            isSafariResult = false;

            // Chrome and Edge contain Safari in the user agent too
            if (!isChrome() && !isEdge() && (/ Safari\/[\.0-9]+/).test(theNavigator.userAgent)) {
                var fields = (/ Version\/([\.0-9]+)/).exec(theNavigator.userAgent);
                if (fields !== null) {
                    isSafariResult = true;
                    safariVersionResult = extractVersion(fields[1]);
                }
            }
        }

        return isSafariResult;
    }

    function safariVersion() {
        return isSafari() && safariVersionResult;
    }

    var isWebkitResult;
    var webkitVersionResult;
    function isWebkit() {
        if (!defined(isWebkitResult)) {
            isWebkitResult = false;

            var fields = (/ AppleWebKit\/([\.0-9]+)(\+?)/).exec(theNavigator.userAgent);
            if (fields !== null) {
                isWebkitResult = true;
                webkitVersionResult = extractVersion(fields[1]);
                webkitVersionResult.isNightly = !!fields[2];
            }
        }

        return isWebkitResult;
    }

    function webkitVersion() {
        return isWebkit() && webkitVersionResult;
    }

    var isInternetExplorerResult;
    var internetExplorerVersionResult;
    function isInternetExplorer() {
        if (!defined(isInternetExplorerResult)) {
            isInternetExplorerResult = false;

            var fields;
            if (theNavigator.appName === 'Microsoft Internet Explorer') {
                fields = /MSIE ([0-9]{1,}[\.0-9]{0,})/.exec(theNavigator.userAgent);
                if (fields !== null) {
                    isInternetExplorerResult = true;
                    internetExplorerVersionResult = extractVersion(fields[1]);
                }
            } else if (theNavigator.appName === 'Netscape') {
                fields = /Trident\/.*rv:([0-9]{1,}[\.0-9]{0,})/.exec(theNavigator.userAgent);
                if (fields !== null) {
                    isInternetExplorerResult = true;
                    internetExplorerVersionResult = extractVersion(fields[1]);
                }
            }
        }
        return isInternetExplorerResult;
    }

    function internetExplorerVersion() {
        return isInternetExplorer() && internetExplorerVersionResult;
    }

    var isEdgeResult;
    var edgeVersionResult;
    function isEdge() {
        if (!defined(isEdgeResult)) {
            isEdgeResult = false;
            var fields = (/ Edge\/([\.0-9]+)/).exec(theNavigator.userAgent);
            if (fields !== null) {
                isEdgeResult = true;
                edgeVersionResult = extractVersion(fields[1]);
            }
        }
        return isEdgeResult;
    }

    function edgeVersion() {
        return isEdge() && edgeVersionResult;
    }

    var isFirefoxResult;
    var firefoxVersionResult;
    function isFirefox() {
        if (!defined(isFirefoxResult)) {
            isFirefoxResult = false;

            var fields = /Firefox\/([\.0-9]+)/.exec(theNavigator.userAgent);
            if (fields !== null) {
                isFirefoxResult = true;
                firefoxVersionResult = extractVersion(fields[1]);
            }
        }
        return isFirefoxResult;
    }

    var isWindowsResult;
    function isWindows() {
        if (!defined(isWindowsResult)) {
            isWindowsResult = /Windows/i.test(theNavigator.appVersion);
        }
        return isWindowsResult;
    }

    function firefoxVersion() {
        return isFirefox() && firefoxVersionResult;
    }

    var hasPointerEvents;
    function supportsPointerEvents() {
        if (!defined(hasPointerEvents)) {
            //While navigator.pointerEnabled is deprecated in the W3C specification
            //we still need to use it if it exists in order to support browsers
            //that rely on it, such as the Windows WebBrowser control which defines
            //PointerEvent but sets navigator.pointerEnabled to false.

            //Firefox disabled because of https://github.com/AnalyticalGraphicsInc/cesium/issues/6372
            hasPointerEvents = !isFirefox() && typeof PointerEvent !== 'undefined' && (!defined(theNavigator.pointerEnabled) || theNavigator.pointerEnabled);
        }
        return hasPointerEvents;
    }

    var imageRenderingValueResult;
    var supportsImageRenderingPixelatedResult;
    function supportsImageRenderingPixelated() {
        if (!defined(supportsImageRenderingPixelatedResult)) {
            var canvas = document.createElement('canvas');
            canvas.setAttribute('style',
                                'image-rendering: -moz-crisp-edges;' +
                                'image-rendering: pixelated;');
            //canvas.style.imageRendering will be undefined, null or an empty string on unsupported browsers.
            var tmp = canvas.style.imageRendering;
            supportsImageRenderingPixelatedResult = defined(tmp) && tmp !== '';
            if (supportsImageRenderingPixelatedResult) {
                imageRenderingValueResult = tmp;
            }
        }
        return supportsImageRenderingPixelatedResult;
    }

    function imageRenderingValue() {
        return supportsImageRenderingPixelated() ? imageRenderingValueResult : undefined;
    }

    function supportsWebP() {
        //>>includeStart('debug', pragmas.debug);
        if (!supportsWebP.initialized) {
            throw new DeveloperError('You must call FeatureDetection.supportsWebP.initialize and wait for the promise to resolve before calling FeatureDetection.supportsWebP');
        }
        //>>includeEnd('debug');
        return supportsWebP._result;
    }
    supportsWebP._promise = undefined;
    supportsWebP._result = undefined;
    supportsWebP.initialize = function() {
        // From https://developers.google.com/speed/webp/faq#how_can_i_detect_browser_support_for_webp
        if (defined(supportsWebP._promise)) {
            return supportsWebP._promise;
        }

        var supportsWebPDeferred = when.defer();
        supportsWebP._promise = supportsWebPDeferred.promise;
        if (isEdge()) {
            // Edge's WebP support with WebGL is incomplete.
            // See bug report: https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/19221241/
            supportsWebP._result = false;
            supportsWebPDeferred.resolve(supportsWebP._result);
            return supportsWebPDeferred.promise;
        }

        var image = new Image();
        image.onload = function () {
            supportsWebP._result = (image.width > 0) && (image.height > 0);
            supportsWebPDeferred.resolve(supportsWebP._result);
        };

        image.onerror = function () {
            supportsWebP._result = false;
            supportsWebPDeferred.resolve(supportsWebP._result);
        };

        image.src = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';

        return supportsWebPDeferred.promise;
    };
    defineProperties(supportsWebP, {
        initialized: {
            get: function() {
                return defined(supportsWebP._result);
            }
        }
    });

    var typedArrayTypes = [];
    if (typeof ArrayBuffer !== 'undefined') {
        typedArrayTypes.push(Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array);

        if (typeof Uint8ClampedArray !== 'undefined') {
            typedArrayTypes.push(Uint8ClampedArray);
        }

        if (typeof CanvasPixelArray !== 'undefined') {
            typedArrayTypes.push(CanvasPixelArray);
        }
    }

    /**
     * A set of functions to detect whether the current browser supports
     * various features.
     *
     * @exports FeatureDetection
     */
    var FeatureDetection = {
        isChrome : isChrome,
        chromeVersion : chromeVersion,
        isSafari : isSafari,
        safariVersion : safariVersion,
        isWebkit : isWebkit,
        webkitVersion : webkitVersion,
        isInternetExplorer : isInternetExplorer,
        internetExplorerVersion : internetExplorerVersion,
        isEdge : isEdge,
        edgeVersion : edgeVersion,
        isFirefox : isFirefox,
        firefoxVersion : firefoxVersion,
        isWindows : isWindows,
        hardwareConcurrency : defaultValue(theNavigator.hardwareConcurrency, 3),
        supportsPointerEvents : supportsPointerEvents,
        supportsImageRenderingPixelated: supportsImageRenderingPixelated,
        supportsWebP: supportsWebP,
        imageRenderingValue: imageRenderingValue,
        typedArrayTypes: typedArrayTypes
    };

    /**
     * Detects whether the current browser supports the full screen standard.
     *
     * @returns {Boolean} true if the browser supports the full screen standard, false if not.
     *
     * @see Fullscreen
     * @see {@link http://dvcs.w3.org/hg/fullscreen/raw-file/tip/Overview.html|W3C Fullscreen Living Specification}
     */
    FeatureDetection.supportsFullscreen = function() {
        return Fullscreen.supportsFullscreen();
    };

    /**
     * Detects whether the current browser supports typed arrays.
     *
     * @returns {Boolean} true if the browser supports typed arrays, false if not.
     *
     * @see {@link http://www.khronos.org/registry/typedarray/specs/latest/|Typed Array Specification}
     */
    FeatureDetection.supportsTypedArrays = function() {
        return typeof ArrayBuffer !== 'undefined';
    };

    /**
     * Detects whether the current browser supports Web Workers.
     *
     * @returns {Boolean} true if the browsers supports Web Workers, false if not.
     *
     * @see {@link http://www.w3.org/TR/workers/}
     */
    FeatureDetection.supportsWebWorkers = function() {
        return typeof Worker !== 'undefined';
    };

    /**
     * Detects whether the current browser supports Web Assembly.
     *
     * @returns {Boolean} true if the browsers supports Web Assembly, false if not.
     *
     * @see {@link https://developer.mozilla.org/en-US/docs/WebAssembly}
     */
    FeatureDetection.supportsWebAssembly = function() {
        return typeof WebAssembly !== 'undefined' && !FeatureDetection.isEdge();
    };

    module.exports= FeatureDetection;

},{"./DeveloperError":13,"./Fullscreen":17,"./defaultValue":40,"./defineProperties":41,"./defined":42,"when":undefined}],17:[function(require,module,exports){
var defined=require('./defined');
var defineProperties=require('./defineProperties');

    'use strict';

    var _supportsFullscreen;
    var _names = {
        requestFullscreen : undefined,
        exitFullscreen : undefined,
        fullscreenEnabled : undefined,
        fullscreenElement : undefined,
        fullscreenchange : undefined,
        fullscreenerror : undefined
    };

    /**
     * Browser-independent functions for working with the standard fullscreen API.
     *
     * @exports Fullscreen
     * @namespace
     *
     * @see {@link http://dvcs.w3.org/hg/fullscreen/raw-file/tip/Overview.html|W3C Fullscreen Living Specification}
     */
    var Fullscreen = {};

    defineProperties(Fullscreen, {
        /**
         * The element that is currently fullscreen, if any.  To simply check if the
         * browser is in fullscreen mode or not, use {@link Fullscreen#fullscreen}.
         * @memberof Fullscreen
         * @type {Object}
         * @readonly
         */
        element : {
            get : function() {
                if (!Fullscreen.supportsFullscreen()) {
                    return undefined;
                }

                return document[_names.fullscreenElement];
            }
        },

        /**
         * The name of the event on the document that is fired when fullscreen is
         * entered or exited.  This event name is intended for use with addEventListener.
         * In your event handler, to determine if the browser is in fullscreen mode or not,
         * use {@link Fullscreen#fullscreen}.
         * @memberof Fullscreen
         * @type {String}
         * @readonly
         */
        changeEventName : {
            get : function() {
                if (!Fullscreen.supportsFullscreen()) {
                    return undefined;
                }

                return _names.fullscreenchange;
            }
        },

        /**
         * The name of the event that is fired when a fullscreen error
         * occurs.  This event name is intended for use with addEventListener.
         * @memberof Fullscreen
         * @type {String}
         * @readonly
         */
        errorEventName : {
            get : function() {
                if (!Fullscreen.supportsFullscreen()) {
                    return undefined;
                }

                return _names.fullscreenerror;
            }
        },

        /**
         * Determine whether the browser will allow an element to be made fullscreen, or not.
         * For example, by default, iframes cannot go fullscreen unless the containing page
         * adds an "allowfullscreen" attribute (or prefixed equivalent).
         * @memberof Fullscreen
         * @type {Boolean}
         * @readonly
         */
        enabled : {
            get : function() {
                if (!Fullscreen.supportsFullscreen()) {
                    return undefined;
                }

                return document[_names.fullscreenEnabled];
            }
        },

        /**
         * Determines if the browser is currently in fullscreen mode.
         * @memberof Fullscreen
         * @type {Boolean}
         * @readonly
         */
        fullscreen : {
            get : function() {
                if (!Fullscreen.supportsFullscreen()) {
                    return undefined;
                }

                return Fullscreen.element !== null;
            }
        }
    });

    /**
     * Detects whether the browser supports the standard fullscreen API.
     *
     * @returns {Boolean} <code>true</code> if the browser supports the standard fullscreen API,
     * <code>false</code> otherwise.
     */
    Fullscreen.supportsFullscreen = function() {
        if (defined(_supportsFullscreen)) {
            return _supportsFullscreen;
        }

        _supportsFullscreen = false;

        var body = document.body;
        if (typeof body.requestFullscreen === 'function') {
            // go with the unprefixed, standard set of names
            _names.requestFullscreen = 'requestFullscreen';
            _names.exitFullscreen = 'exitFullscreen';
            _names.fullscreenEnabled = 'fullscreenEnabled';
            _names.fullscreenElement = 'fullscreenElement';
            _names.fullscreenchange = 'fullscreenchange';
            _names.fullscreenerror = 'fullscreenerror';
            _supportsFullscreen = true;
            return _supportsFullscreen;
        }

        //check for the correct combination of prefix plus the various names that browsers use
        var prefixes = ['webkit', 'moz', 'o', 'ms', 'khtml'];
        var name;
        for (var i = 0, len = prefixes.length; i < len; ++i) {
            var prefix = prefixes[i];

            // casing of Fullscreen differs across browsers
            name = prefix + 'RequestFullscreen';
            if (typeof body[name] === 'function') {
                _names.requestFullscreen = name;
                _supportsFullscreen = true;
            } else {
                name = prefix + 'RequestFullScreen';
                if (typeof body[name] === 'function') {
                    _names.requestFullscreen = name;
                    _supportsFullscreen = true;
                }
            }

            // disagreement about whether it's "exit" as per spec, or "cancel"
            name = prefix + 'ExitFullscreen';
            if (typeof document[name] === 'function') {
                _names.exitFullscreen = name;
            } else {
                name = prefix + 'CancelFullScreen';
                if (typeof document[name] === 'function') {
                    _names.exitFullscreen = name;
                }
            }

            // casing of Fullscreen differs across browsers
            name = prefix + 'FullscreenEnabled';
            if (document[name] !== undefined) {
                _names.fullscreenEnabled = name;
            } else {
                name = prefix + 'FullScreenEnabled';
                if (document[name] !== undefined) {
                    _names.fullscreenEnabled = name;
                }
            }

            // casing of Fullscreen differs across browsers
            name = prefix + 'FullscreenElement';
            if (document[name] !== undefined) {
                _names.fullscreenElement = name;
            } else {
                name = prefix + 'FullScreenElement';
                if (document[name] !== undefined) {
                    _names.fullscreenElement = name;
                }
            }

            // thankfully, event names are all lowercase per spec
            name = prefix + 'fullscreenchange';
            // event names do not have 'on' in the front, but the property on the document does
            if (document['on' + name] !== undefined) {
                //except on IE
                if (prefix === 'ms') {
                    name = 'MSFullscreenChange';
                }
                _names.fullscreenchange = name;
            }

            name = prefix + 'fullscreenerror';
            if (document['on' + name] !== undefined) {
                //except on IE
                if (prefix === 'ms') {
                    name = 'MSFullscreenError';
                }
                _names.fullscreenerror = name;
            }
        }

        return _supportsFullscreen;
    };

    /**
     * Asynchronously requests the browser to enter fullscreen mode on the given element.
     * If fullscreen mode is not supported by the browser, does nothing.
     *
     * @param {Object} element The HTML element which will be placed into fullscreen mode.
     * @param {HMDVRDevice} [vrDevice] The VR device.
     *
     * @example
     * // Put the entire page into fullscreen.
     * Cesium.Fullscreen.requestFullscreen(document.body)
     *
     * // Place only the Cesium canvas into fullscreen.
     * Cesium.Fullscreen.requestFullscreen(scene.canvas)
     */
    Fullscreen.requestFullscreen = function(element, vrDevice) {
        if (!Fullscreen.supportsFullscreen()) {
            return;
        }

        element[_names.requestFullscreen]({ vrDisplay: vrDevice });
    };

    /**
     * Asynchronously exits fullscreen mode.  If the browser is not currently
     * in fullscreen, or if fullscreen mode is not supported by the browser, does nothing.
     */
    Fullscreen.exitFullscreen = function() {
        if (!Fullscreen.supportsFullscreen()) {
            return;
        }

        document[_names.exitFullscreen]();
    };

    module.exports= Fullscreen;

},{"./defineProperties":41,"./defined":42}],18:[function(require,module,exports){
var Cartesian3 = require('./Cartesian3');
var Cartographic = require('./Cartographic');
var defaultValue = require('./defaultValue');
var defined = require('./defined');
var defineProperties = require('./defineProperties');
var DeveloperError = require('./DeveloperError');
var Ellipsoid = require('./Ellipsoid');

'use strict';

/**
 * A simple map projection where longitude and latitude are linearly mapped to X and Y by multiplying
 * them by the {@link Ellipsoid#maximumRadius}.  This projection
 * is commonly known as geographic, equirectangular, equidistant cylindrical, or plate carrée.  It
 * is also known as EPSG:4326.
 *
 * @alias GeographicProjection
 * @constructor
 *
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid.
 *
 * @see WebMercatorProjection
 */
function GeographicProjection(ellipsoid) {
    this._ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);
    this._semimajorAxis = this._ellipsoid.maximumRadius;
    this._oneOverSemimajorAxis = 1.0 / this._semimajorAxis;
}

defineProperties(GeographicProjection.prototype, {
    /**
     * Gets the {@link Ellipsoid}.
     *
     * @memberof GeographicProjection.prototype
     *
     * @type {Ellipsoid}
     * @readonly
     */
    ellipsoid: {
        get: function () {
            return this._ellipsoid;
        }
    }
});

/**
 * Projects a set of {@link Cartographic} coordinates, in radians, to map coordinates, in meters.
 * X and Y are the longitude and latitude, respectively, multiplied by the maximum radius of the
 * ellipsoid.  Z is the unmodified height.
 *
 * @param {Cartographic} cartographic The coordinates to project.
 * @param {Cartesian3} [result] An instance into which to copy the result.  If this parameter is
 *        undefined, a new instance is created and returned.
 * @returns {Cartesian3} The projected coordinates.  If the result parameter is not undefined, the
 *          coordinates are copied there and that instance is returned.  Otherwise, a new instance is
 *          created and returned.
 */
GeographicProjection.prototype.project = function (cartographic, result) {
    // Actually this is the special case of equidistant cylindrical called the plate carree
    var semimajorAxis = this._semimajorAxis;
    var x = cartographic.longitude * semimajorAxis;
    var y = cartographic.latitude * semimajorAxis;
    var z = cartographic.height;

    if (!defined(result)) {
        return new Cartesian3(x, y, z);
    }

    result.x = x;
    result.y = y;
    result.z = z;
    return result;
};

/**
 * Unprojects a set of projected {@link Cartesian3} coordinates, in meters, to {@link Cartographic}
 * coordinates, in radians.  Longitude and Latitude are the X and Y coordinates, respectively,
 * divided by the maximum radius of the ellipsoid.  Height is the unmodified Z coordinate.
 *
 * @param {Cartesian3} cartesian The Cartesian position to unproject with height (z) in meters.
 * @param {Cartographic} [result] An instance into which to copy the result.  If this parameter is
 *        undefined, a new instance is created and returned.
 * @returns {Cartographic} The unprojected coordinates.  If the result parameter is not undefined, the
 *          coordinates are copied there and that instance is returned.  Otherwise, a new instance is
 *          created and returned.
 */
GeographicProjection.prototype.unproject = function (cartesian, result) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(cartesian)) {
        throw new DeveloperError('cartesian is required');
    }
    //>>includeEnd('debug');

    var oneOverEarthSemimajorAxis = this._oneOverSemimajorAxis;
    var longitude = cartesian.x * oneOverEarthSemimajorAxis;
    var latitude = cartesian.y * oneOverEarthSemimajorAxis;
    var height = cartesian.z;

    if (!defined(result)) {
        return new Cartographic(longitude, latitude, height);
    }

    result.longitude = longitude;
    result.latitude = latitude;
    result.height = height;
    return result;
};

module.exports = GeographicProjection;

},{"./Cartesian3":8,"./Cartographic":10,"./DeveloperError":13,"./Ellipsoid":14,"./defaultValue":40,"./defineProperties":41,"./defined":42}],19:[function(require,module,exports){
var Cartesian2=require('./Cartesian2');
var Check=require('./Check');
var defaultValue=require('./defaultValue');
var defined=require('./defined');
var defineProperties=require('./defineProperties');
var Ellipsoid=require('./Ellipsoid');
var GeographicProjection=require('./GeographicProjection');
var CesiumMath=require('./Math');
var Rectangle=require('./Rectangle');

    'use strict';

    /**
     * A tiling scheme for geometry referenced to a simple {@link GeographicProjection} where
     * longitude and latitude are directly mapped to X and Y.  This projection is commonly
     * known as geographic, equirectangular, equidistant cylindrical, or plate carrée.
     *
     * @alias GeographicTilingScheme
     * @constructor
     *
     * @param {Object} [options] Object with the following properties:
     * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.WGS84] The ellipsoid whose surface is being tiled. Defaults to
     * the WGS84 ellipsoid.
     * @param {Rectangle} [options.rectangle=Rectangle.MAX_VALUE] The rectangle, in radians, covered by the tiling scheme.
     * @param {Number} [options.numberOfLevelZeroTilesX=2] The number of tiles in the X direction at level zero of
     * the tile tree.
     * @param {Number} [options.numberOfLevelZeroTilesY=1] The number of tiles in the Y direction at level zero of
     * the tile tree.
     */
    function GeographicTilingScheme(options) {
        options = defaultValue(options, {});

        this._ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.WGS84);
        this._rectangle = defaultValue(options.rectangle, Rectangle.MAX_VALUE);
        this._projection = new GeographicProjection(this._ellipsoid);
        this._numberOfLevelZeroTilesX = defaultValue(options.numberOfLevelZeroTilesX, 2);
        this._numberOfLevelZeroTilesY = defaultValue(options.numberOfLevelZeroTilesY, 1);
    }

    defineProperties(GeographicTilingScheme.prototype, {
        /**
         * Gets the ellipsoid that is tiled by this tiling scheme.
         * @memberof GeographicTilingScheme.prototype
         * @type {Ellipsoid}
         */
        ellipsoid : {
            get : function() {
                return this._ellipsoid;
            }
        },

        /**
         * Gets the rectangle, in radians, covered by this tiling scheme.
         * @memberof GeographicTilingScheme.prototype
         * @type {Rectangle}
         */
        rectangle : {
            get : function() {
                return this._rectangle;
            }
        },

        /**
         * Gets the map projection used by this tiling scheme.
         * @memberof GeographicTilingScheme.prototype
         * @type {MapProjection}
         */
        projection : {
            get : function() {
                return this._projection;
            }
        }
    });

    /**
     * Gets the total number of tiles in the X direction at a specified level-of-detail.
     *
     * @param {Number} level The level-of-detail.
     * @returns {Number} The number of tiles in the X direction at the given level.
     */
    GeographicTilingScheme.prototype.getNumberOfXTilesAtLevel = function(level) {
        return this._numberOfLevelZeroTilesX << level;
    };

    /**
     * Gets the total number of tiles in the Y direction at a specified level-of-detail.
     *
     * @param {Number} level The level-of-detail.
     * @returns {Number} The number of tiles in the Y direction at the given level.
     */
    GeographicTilingScheme.prototype.getNumberOfYTilesAtLevel = function(level) {
        return this._numberOfLevelZeroTilesY << level;
    };

    /**
     * Transforms a rectangle specified in geodetic radians to the native coordinate system
     * of this tiling scheme.
     *
     * @param {Rectangle} rectangle The rectangle to transform.
     * @param {Rectangle} [result] The instance to which to copy the result, or undefined if a new instance
     *        should be created.
     * @returns {Rectangle} The specified 'result', or a new object containing the native rectangle if 'result'
     *          is undefined.
     */
    GeographicTilingScheme.prototype.rectangleToNativeRectangle = function(rectangle, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('rectangle', rectangle);
        //>>includeEnd('debug');

        var west = CesiumMath.toDegrees(rectangle.west);
        var south = CesiumMath.toDegrees(rectangle.south);
        var east = CesiumMath.toDegrees(rectangle.east);
        var north = CesiumMath.toDegrees(rectangle.north);

        if (!defined(result)) {
            return new Rectangle(west, south, east, north);
        }

        result.west = west;
        result.south = south;
        result.east = east;
        result.north = north;
        return result;
    };

    /**
     * Converts tile x, y coordinates and level to a rectangle expressed in the native coordinates
     * of the tiling scheme.
     *
     * @param {Number} x The integer x coordinate of the tile.
     * @param {Number} y The integer y coordinate of the tile.
     * @param {Number} level The tile level-of-detail.  Zero is the least detailed.
     * @param {Object} [result] The instance to which to copy the result, or undefined if a new instance
     *        should be created.
     * @returns {Rectangle} The specified 'result', or a new object containing the rectangle
     *          if 'result' is undefined.
     */
    GeographicTilingScheme.prototype.tileXYToNativeRectangle = function(x, y, level, result) {
        var rectangleRadians = this.tileXYToRectangle(x, y, level, result);
        rectangleRadians.west = CesiumMath.toDegrees(rectangleRadians.west);
        rectangleRadians.south = CesiumMath.toDegrees(rectangleRadians.south);
        rectangleRadians.east = CesiumMath.toDegrees(rectangleRadians.east);
        rectangleRadians.north = CesiumMath.toDegrees(rectangleRadians.north);
        return rectangleRadians;
    };

    /**
     * Converts tile x, y coordinates and level to a cartographic rectangle in radians.
     *
     * @param {Number} x The integer x coordinate of the tile.
     * @param {Number} y The integer y coordinate of the tile.
     * @param {Number} level The tile level-of-detail.  Zero is the least detailed.
     * @param {Object} [result] The instance to which to copy the result, or undefined if a new instance
     *        should be created.
     * @returns {Rectangle} The specified 'result', or a new object containing the rectangle
     *          if 'result' is undefined.
     */
    GeographicTilingScheme.prototype.tileXYToRectangle = function(x, y, level, result) {
        var rectangle = this._rectangle;

        var xTiles = this.getNumberOfXTilesAtLevel(level);
        var yTiles = this.getNumberOfYTilesAtLevel(level);

        var xTileWidth = rectangle.width / xTiles;
        var west = x * xTileWidth + rectangle.west;
        var east = (x + 1) * xTileWidth + rectangle.west;

        var yTileHeight = rectangle.height / yTiles;
        var north = rectangle.north - y * yTileHeight;
        var south = rectangle.north - (y + 1) * yTileHeight;

        if (!defined(result)) {
            result = new Rectangle(west, south, east, north);
        }

        result.west = west;
        result.south = south;
        result.east = east;
        result.north = north;
        return result;
    };

    /**
     * Calculates the tile x, y coordinates of the tile containing
     * a given cartographic position.
     *
     * @param {Cartographic} position The position.
     * @param {Number} level The tile level-of-detail.  Zero is the least detailed.
     * @param {Cartesian2} [result] The instance to which to copy the result, or undefined if a new instance
     *        should be created.
     * @returns {Cartesian2} The specified 'result', or a new object containing the tile x, y coordinates
     *          if 'result' is undefined.
     */
    GeographicTilingScheme.prototype.positionToTileXY = function(position, level, result) {
        var rectangle = this._rectangle;
        if (!Rectangle.contains(rectangle, position)) {
            // outside the bounds of the tiling scheme
            return undefined;
        }

        var xTiles = this.getNumberOfXTilesAtLevel(level);
        var yTiles = this.getNumberOfYTilesAtLevel(level);

        var xTileWidth = rectangle.width / xTiles;
        var yTileHeight = rectangle.height / yTiles;

        var longitude = position.longitude;
        if (rectangle.east < rectangle.west) {
            longitude += CesiumMath.TWO_PI;
        }

        var xTileCoordinate = (longitude - rectangle.west) / xTileWidth | 0;
        if (xTileCoordinate >= xTiles) {
            xTileCoordinate = xTiles - 1;
        }

        var yTileCoordinate = (rectangle.north - position.latitude) / yTileHeight | 0;
        if (yTileCoordinate >= yTiles) {
            yTileCoordinate = yTiles - 1;
        }

        if (!defined(result)) {
            return new Cartesian2(xTileCoordinate, yTileCoordinate);
        }

        result.x = xTileCoordinate;
        result.y = yTileCoordinate;
        return result;
    };

    module.exports= GeographicTilingScheme;

},{"./Cartesian2":7,"./Check":11,"./Ellipsoid":14,"./GeographicProjection":18,"./Math":21,"./Rectangle":22,"./defaultValue":40,"./defineProperties":41,"./defined":42}],20:[function(require,module,exports){
var Check=require('./Check');
var defaultValue=require('./defaultValue');
var defined=require('./defined');
var defineProperties=require('./defineProperties');

    'use strict';

    /**
     * Array implementation of a heap.
     *
     * @alias Heap
     * @constructor
     * @private
     *
     * @param {Object} options Object with the following properties:
     * @param {Heap~ComparatorCallback} options.comparator The comparator to use for the heap. If comparator(a, b) is less than 0, sort a to a lower index than b, otherwise sort to a higher index.
     */
    function Heap(options) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('options', options);
        Check.defined('options.comparator', options.comparator);
        //>>includeEnd('debug');

        this._comparator = options.comparator;
        this._array = [];
        this._length = 0;
        this._maximumLength = undefined;
    }

    defineProperties(Heap.prototype, {
        /**
         * Gets the length of the heap.
         *
         * @memberof Heap.prototype
         *
         * @type {Number}
         * @readonly
         */
        length : {
            get : function() {
                return this._length;
            }
        },

        /**
         * Gets the internal array.
         *
         * @memberof Heap.prototype
         *
         * @type {Array}
         * @readonly
         */
        internalArray : {
            get : function() {
                return this._array;
            }
        },

        /**
         * Gets and sets the maximum length of the heap.
         *
         * @memberof Heap.prototype
         *
         * @type {Number}
         */
        maximumLength : {
            get : function() {
                return this._maximumLength;
            },
            set : function(value) {
                this._maximumLength = value;
                if (this._length > value && value > 0) {
                    this._length = value;
                    this._array.length = value;
                }
            }
        },

        /**
         * The comparator to use for the heap. If comparator(a, b) is less than 0, sort a to a lower index than b, otherwise sort to a higher index.
         *
         * @memberof Heap.prototype
         *
         * @type {Heap~ComparatorCallback}
         */
        comparator : {
            get : function() {
                return this._comparator;
            }
        }
    });

    function swap(array, a, b) {
        var temp = array[a];
        array[a] = array[b];
        array[b] = temp;
    }

    /**
     * Resizes the internal array of the heap.
     *
     * @param {Number} [length] The length to resize internal array to. Defaults to the current length of the heap.
     */
    Heap.prototype.reserve = function(length) {
        length = defaultValue(length, this._length);
        this._array.length = length;
    };

    /**
     * Update the heap so that index and all descendants satisfy the heap property.
     *
     * @param {Number} [index=0] The starting index to heapify from.
     */
    Heap.prototype.heapify = function(index) {
        index = defaultValue(index, 0);
        var length = this._length;
        var comparator = this._comparator;
        var array = this._array;
        var candidate = -1;
        var inserting = true;

        while (inserting) {
            var right = 2 * (index + 1);
            var left = right - 1;

            if (left < length && comparator(array[left], array[index]) < 0) {
                candidate = left;
            } else {
                candidate = index;
            }

            if (right < length && comparator(array[right], array[candidate]) < 0) {
                candidate = right;
            }
            if (candidate !== index) {
                swap(array, candidate, index);
                index = candidate;
            } else {
                inserting = false;
            }
        }
    };

    /**
     * Resort the heap.
     */
    Heap.prototype.resort = function() {
        var length = this._length;
        for (var i = Math.ceil(length / 2); i >= 0; --i) {
            this.heapify(i);
        }
    };

    /**
     * Insert an element into the heap. If the length would grow greater than maximumLength
     * of the heap, extra elements are removed.
     *
     * @param {*} element The element to insert
     *
     * @return {*} The element that was removed from the heap if the heap is at full capacity.
     */
    Heap.prototype.insert = function(element) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('element', element);
        //>>includeEnd('debug');

        var array = this._array;
        var comparator = this._comparator;
        var maximumLength = this._maximumLength;

        var index = this._length++;
        if (index < array.length) {
            array[index] = element;
        } else {
            array.push(element);
        }

        while (index !== 0) {
            var parent = Math.floor((index - 1) / 2);
            if (comparator(array[index], array[parent]) < 0) {
                swap(array, index, parent);
                index = parent;
            } else {
                break;
            }
        }

        var removedElement;

        if (defined(maximumLength) && (this._length > maximumLength)) {
            removedElement = array[maximumLength];
            this._length = maximumLength;
        }

        return removedElement;
    };

    /**
     * Remove the element specified by index from the heap and return it.
     *
     * @param {Number} [index=0] The index to remove.
     * @returns {*} The specified element of the heap.
     */
    Heap.prototype.pop = function(index) {
        index = defaultValue(index, 0);
        if (this._length === 0) {
            return undefined;
        }
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.number.lessThan('index', index, this._length);
        //>>includeEnd('debug');

        var array = this._array;
        var root = array[index];
        swap(array, index, --this._length);
        this.heapify(index);
        return root;
    };

    /**
     * The comparator to use for the heap.
     * @callback Heap~ComparatorCallback
     * @param {*} a An element in the heap.
     * @param {*} b An element in the heap.
     * @returns {Number} If the result of the comparison is less than 0, sort a to a lower index than b, otherwise sort to a higher index.
     */

    module.exports= Heap;

},{"./Check":11,"./defaultValue":40,"./defineProperties":41,"./defined":42}],21:[function(require,module,exports){
var MersenneTwister = require('mersenne-twister');
var Check = require('./Check');
var defaultValue = require('./defaultValue');
var defined = require('./defined');
var DeveloperError = require('./DeveloperError');

'use strict';

/**
 * Math functions.
 *
 * @exports CesiumMath
 * @alias Math
 */
var CesiumMath = {};

/**
 * 0.1
 * @type {Number}
 * @constant
 */
CesiumMath.EPSILON1 = 0.1;

/**
 * 0.01
 * @type {Number}
 * @constant
 */
CesiumMath.EPSILON2 = 0.01;

/**
 * 0.001
 * @type {Number}
 * @constant
 */
CesiumMath.EPSILON3 = 0.001;

/**
 * 0.0001
 * @type {Number}
 * @constant
 */
CesiumMath.EPSILON4 = 0.0001;

/**
 * 0.00001
 * @type {Number}
 * @constant
 */
CesiumMath.EPSILON5 = 0.00001;

/**
 * 0.000001
 * @type {Number}
 * @constant
 */
CesiumMath.EPSILON6 = 0.000001;

/**
 * 0.0000001
 * @type {Number}
 * @constant
 */
CesiumMath.EPSILON7 = 0.0000001;

/**
 * 0.00000001
 * @type {Number}
 * @constant
 */
CesiumMath.EPSILON8 = 0.00000001;

/**
 * 0.000000001
 * @type {Number}
 * @constant
 */
CesiumMath.EPSILON9 = 0.000000001;

/**
 * 0.0000000001
 * @type {Number}
 * @constant
 */
CesiumMath.EPSILON10 = 0.0000000001;

/**
 * 0.00000000001
 * @type {Number}
 * @constant
 */
CesiumMath.EPSILON11 = 0.00000000001;

/**
 * 0.000000000001
 * @type {Number}
 * @constant
 */
CesiumMath.EPSILON12 = 0.000000000001;

/**
 * 0.0000000000001
 * @type {Number}
 * @constant
 */
CesiumMath.EPSILON13 = 0.0000000000001;

/**
 * 0.00000000000001
 * @type {Number}
 * @constant
 */
CesiumMath.EPSILON14 = 0.00000000000001;

/**
 * 0.000000000000001
 * @type {Number}
 * @constant
 */
CesiumMath.EPSILON15 = 0.000000000000001;

/**
 * 0.0000000000000001
 * @type {Number}
 * @constant
 */
CesiumMath.EPSILON16 = 0.0000000000000001;

/**
 * 0.00000000000000001
 * @type {Number}
 * @constant
 */
CesiumMath.EPSILON17 = 0.00000000000000001;

/**
 * 0.000000000000000001
 * @type {Number}
 * @constant
 */
CesiumMath.EPSILON18 = 0.000000000000000001;

/**
 * 0.0000000000000000001
 * @type {Number}
 * @constant
 */
CesiumMath.EPSILON19 = 0.0000000000000000001;

/**
 * 0.00000000000000000001
 * @type {Number}
 * @constant
 */
CesiumMath.EPSILON20 = 0.00000000000000000001;

/**
 * 0.000000000000000000001
 * @type {Number}
 * @constant
 */
CesiumMath.EPSILON21 = 0.000000000000000000001;

/**
 * The gravitational parameter of the Earth in meters cubed
 * per second squared as defined by the WGS84 model: 3.986004418e14
 * @type {Number}
 * @constant
 */
CesiumMath.GRAVITATIONALPARAMETER = 3.986004418e14;

/**
 * Radius of the sun in meters: 6.955e8
 * @type {Number}
 * @constant
 */
CesiumMath.SOLAR_RADIUS = 6.955e8;

/**
 * The mean radius of the moon, according to the "Report of the IAU/IAG Working Group on
 * Cartographic Coordinates and Rotational Elements of the Planets and satellites: 2000",
 * Celestial Mechanics 82: 83-110, 2002.
 * @type {Number}
 * @constant
 */
CesiumMath.LUNAR_RADIUS = 1737400.0;

/**
 * 64 * 1024
 * @type {Number}
 * @constant
 */
CesiumMath.SIXTY_FOUR_KILOBYTES = 64 * 1024;

/**
 * Returns the sign of the value; 1 if the value is positive, -1 if the value is
 * negative, or 0 if the value is 0.
 *
 * @function
 * @param {Number} value The value to return the sign of.
 * @returns {Number} The sign of value.
 */
CesiumMath.sign = defaultValue(Math.sign, function sign(value) {
    value = +value; // coerce to number
    if (value === 0 || value !== value) {
        // zero or NaN
        return value;
    }
    return value > 0 ? 1 : -1;
});

/**
 * Returns 1.0 if the given value is positive or zero, and -1.0 if it is negative.
 * This is similar to {@link CesiumMath#sign} except that returns 1.0 instead of
 * 0.0 when the input value is 0.0.
 * @param {Number} value The value to return the sign of.
 * @returns {Number} The sign of value.
 */
CesiumMath.signNotZero = function (value) {
    return value < 0.0 ? -1.0 : 1.0;
};

/**
 * Converts a scalar value in the range [-1.0, 1.0] to a SNORM in the range [0, rangeMax]
 * @param {Number} value The scalar value in the range [-1.0, 1.0]
 * @param {Number} [rangeMax=255] The maximum value in the mapped range, 255 by default.
 * @returns {Number} A SNORM value, where 0 maps to -1.0 and rangeMax maps to 1.0.
 *
 * @see CesiumMath.fromSNorm
 */
CesiumMath.toSNorm = function (value, rangeMax) {
    rangeMax = defaultValue(rangeMax, 255);
    return Math.round((CesiumMath.clamp(value, -1.0, 1.0) * 0.5 + 0.5) * rangeMax);
};

/**
 * Converts a SNORM value in the range [0, rangeMax] to a scalar in the range [-1.0, 1.0].
 * @param {Number} value SNORM value in the range [0, 255]
 * @param {Number} [rangeMax=255] The maximum value in the SNORM range, 255 by default.
 * @returns {Number} Scalar in the range [-1.0, 1.0].
 *
 * @see CesiumMath.toSNorm
 */
CesiumMath.fromSNorm = function (value, rangeMax) {
    rangeMax = defaultValue(rangeMax, 255);
    return CesiumMath.clamp(value, 0.0, rangeMax) / rangeMax * 2.0 - 1.0;
};

/**
 * Returns the hyperbolic sine of a number.
 * The hyperbolic sine of <em>value</em> is defined to be
 * (<em>e<sup>x</sup>&nbsp;-&nbsp;e<sup>-x</sup></em>)/2.0
 * where <i>e</i> is Euler's number, approximately 2.71828183.
 *
 * <p>Special cases:
 *   <ul>
 *     <li>If the argument is NaN, then the result is NaN.</li>
 *
 *     <li>If the argument is infinite, then the result is an infinity
 *     with the same sign as the argument.</li>
 *
 *     <li>If the argument is zero, then the result is a zero with the
 *     same sign as the argument.</li>
 *   </ul>
 *</p>
 *
 * @function
 * @param {Number} value The number whose hyperbolic sine is to be returned.
 * @returns {Number} The hyperbolic sine of <code>value</code>.
 */
CesiumMath.sinh = defaultValue(Math.sinh, function sinh(value) {
    return (Math.exp(value) - Math.exp(-value)) / 2.0;
});

/**
 * Returns the hyperbolic cosine of a number.
 * The hyperbolic cosine of <strong>value</strong> is defined to be
 * (<em>e<sup>x</sup>&nbsp;+&nbsp;e<sup>-x</sup></em>)/2.0
 * where <i>e</i> is Euler's number, approximately 2.71828183.
 *
 * <p>Special cases:
 *   <ul>
 *     <li>If the argument is NaN, then the result is NaN.</li>
 *
 *     <li>If the argument is infinite, then the result is positive infinity.</li>
 *
 *     <li>If the argument is zero, then the result is 1.0.</li>
 *   </ul>
 *</p>
 *
 * @function
 * @param {Number} value The number whose hyperbolic cosine is to be returned.
 * @returns {Number} The hyperbolic cosine of <code>value</code>.
 */
CesiumMath.cosh = defaultValue(Math.cosh, function cosh(value) {
    return (Math.exp(value) + Math.exp(-value)) / 2.0;
});

/**
 * Computes the linear interpolation of two values.
 *
 * @param {Number} p The start value to interpolate.
 * @param {Number} q The end value to interpolate.
 * @param {Number} time The time of interpolation generally in the range <code>[0.0, 1.0]</code>.
 * @returns {Number} The linearly interpolated value.
 *
 * @example
 * var n = Cesium.Math.lerp(0.0, 2.0, 0.5); // returns 1.0
 */
CesiumMath.lerp = function (p, q, time) {
    return ((1.0 - time) * p) + (time * q);
};

/**
 * pi
 *
 * @type {Number}
 * @constant
 */
CesiumMath.PI = Math.PI;

/**
 * 1/pi
 *
 * @type {Number}
 * @constant
 */
CesiumMath.ONE_OVER_PI = 1.0 / Math.PI;

/**
 * pi/2
 *
 * @type {Number}
 * @constant
 */
CesiumMath.PI_OVER_TWO = Math.PI / 2.0;

/**
 * pi/3
 *
 * @type {Number}
 * @constant
 */
CesiumMath.PI_OVER_THREE = Math.PI / 3.0;

/**
 * pi/4
 *
 * @type {Number}
 * @constant
 */
CesiumMath.PI_OVER_FOUR = Math.PI / 4.0;

/**
 * pi/6
 *
 * @type {Number}
 * @constant
 */
CesiumMath.PI_OVER_SIX = Math.PI / 6.0;

/**
 * 3pi/2
 *
 * @type {Number}
 * @constant
 */
CesiumMath.THREE_PI_OVER_TWO = 3.0 * Math.PI / 2.0;

/**
 * 2pi
 *
 * @type {Number}
 * @constant
 */
CesiumMath.TWO_PI = 2.0 * Math.PI;

/**
 * 1/2pi
 *
 * @type {Number}
 * @constant
 */
CesiumMath.ONE_OVER_TWO_PI = 1.0 / (2.0 * Math.PI);

/**
 * The number of radians in a degree.
 *
 * @type {Number}
 * @constant
 * @default Math.PI / 180.0
 */
CesiumMath.RADIANS_PER_DEGREE = Math.PI / 180.0;

/**
 * The number of degrees in a radian.
 *
 * @type {Number}
 * @constant
 * @default 180.0 / Math.PI
 */
CesiumMath.DEGREES_PER_RADIAN = 180.0 / Math.PI;

/**
 * The number of radians in an arc second.
 *
 * @type {Number}
 * @constant
 * @default {@link CesiumMath.RADIANS_PER_DEGREE} / 3600.0
 */
CesiumMath.RADIANS_PER_ARCSECOND = CesiumMath.RADIANS_PER_DEGREE / 3600.0;

/**
 * Converts degrees to radians.
 * @param {Number} degrees The angle to convert in degrees.
 * @returns {Number} The corresponding angle in radians.
 */
CesiumMath.toRadians = function (degrees) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(degrees)) {
        throw new DeveloperError('degrees is required.');
    }
    //>>includeEnd('debug');
    return degrees * CesiumMath.RADIANS_PER_DEGREE;
};

/**
 * Converts radians to degrees.
 * @param {Number} radians The angle to convert in radians.
 * @returns {Number} The corresponding angle in degrees.
 */
CesiumMath.toDegrees = function (radians) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(radians)) {
        throw new DeveloperError('radians is required.');
    }
    //>>includeEnd('debug');
    return radians * CesiumMath.DEGREES_PER_RADIAN;
};

/**
 * Converts a longitude value, in radians, to the range [<code>-Math.PI</code>, <code>Math.PI</code>).
 *
 * @param {Number} angle The longitude value, in radians, to convert to the range [<code>-Math.PI</code>, <code>Math.PI</code>).
 * @returns {Number} The equivalent longitude value in the range [<code>-Math.PI</code>, <code>Math.PI</code>).
 *
 * @example
 * // Convert 270 degrees to -90 degrees longitude
 * var longitude = Cesium.Math.convertLongitudeRange(Cesium.Math.toRadians(270.0));
 */
CesiumMath.convertLongitudeRange = function (angle) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(angle)) {
        throw new DeveloperError('angle is required.');
    }
    //>>includeEnd('debug');
    var twoPi = CesiumMath.TWO_PI;

    var simplified = angle - Math.floor(angle / twoPi) * twoPi;

    if (simplified < -Math.PI) {
        return simplified + twoPi;
    }
    if (simplified >= Math.PI) {
        return simplified - twoPi;
    }

    return simplified;
};

/**
 * Convenience function that clamps a latitude value, in radians, to the range [<code>-Math.PI/2</code>, <code>Math.PI/2</code>).
 * Useful for sanitizing data before use in objects requiring correct range.
 *
 * @param {Number} angle The latitude value, in radians, to clamp to the range [<code>-Math.PI/2</code>, <code>Math.PI/2</code>).
 * @returns {Number} The latitude value clamped to the range [<code>-Math.PI/2</code>, <code>Math.PI/2</code>).
 *
 * @example
 * // Clamp 108 degrees latitude to 90 degrees latitude
 * var latitude = Cesium.Math.clampToLatitudeRange(Cesium.Math.toRadians(108.0));
 */
CesiumMath.clampToLatitudeRange = function (angle) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(angle)) {
        throw new DeveloperError('angle is required.');
    }
    //>>includeEnd('debug');

    return CesiumMath.clamp(angle, -1 * CesiumMath.PI_OVER_TWO, CesiumMath.PI_OVER_TWO);
};

/**
 * Produces an angle in the range -Pi <= angle <= Pi which is equivalent to the provided angle.
 *
 * @param {Number} angle in radians
 * @returns {Number} The angle in the range [<code>-CesiumMath.PI</code>, <code>CesiumMath.PI</code>].
 */
CesiumMath.negativePiToPi = function (angle) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(angle)) {
        throw new DeveloperError('angle is required.');
    }
    //>>includeEnd('debug');
    return CesiumMath.zeroToTwoPi(angle + CesiumMath.PI) - CesiumMath.PI;
};

/**
 * Produces an angle in the range 0 <= angle <= 2Pi which is equivalent to the provided angle.
 *
 * @param {Number} angle in radians
 * @returns {Number} The angle in the range [0, <code>CesiumMath.TWO_PI</code>].
 */
CesiumMath.zeroToTwoPi = function (angle) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(angle)) {
        throw new DeveloperError('angle is required.');
    }
    //>>includeEnd('debug');
    var mod = CesiumMath.mod(angle, CesiumMath.TWO_PI);
    if (Math.abs(mod) < CesiumMath.EPSILON14 && Math.abs(angle) > CesiumMath.EPSILON14) {
        return CesiumMath.TWO_PI;
    }
    return mod;
};

/**
 * The modulo operation that also works for negative dividends.
 *
 * @param {Number} m The dividend.
 * @param {Number} n The divisor.
 * @returns {Number} The remainder.
 */
CesiumMath.mod = function (m, n) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(m)) {
        throw new DeveloperError('m is required.');
    }
    if (!defined(n)) {
        throw new DeveloperError('n is required.');
    }
    //>>includeEnd('debug');
    return ((m % n) + n) % n;
};

/**
 * Determines if two values are equal using an absolute or relative tolerance test. This is useful
 * to avoid problems due to roundoff error when comparing floating-point values directly. The values are
 * first compared using an absolute tolerance test. If that fails, a relative tolerance test is performed.
 * Use this test if you are unsure of the magnitudes of left and right.
 *
 * @param {Number} left The first value to compare.
 * @param {Number} right The other value to compare.
 * @param {Number} relativeEpsilon The maximum inclusive delta between <code>left</code> and <code>right</code> for the relative tolerance test.
 * @param {Number} [absoluteEpsilon=relativeEpsilon] The maximum inclusive delta between <code>left</code> and <code>right</code> for the absolute tolerance test.
 * @returns {Boolean} <code>true</code> if the values are equal within the epsilon; otherwise, <code>false</code>.
 *
 * @example
 * var a = Cesium.Math.equalsEpsilon(0.0, 0.01, Cesium.Math.EPSILON2); // true
 * var b = Cesium.Math.equalsEpsilon(0.0, 0.1, Cesium.Math.EPSILON2);  // false
 * var c = Cesium.Math.equalsEpsilon(3699175.1634344, 3699175.2, Cesium.Math.EPSILON7); // true
 * var d = Cesium.Math.equalsEpsilon(3699175.1634344, 3699175.2, Cesium.Math.EPSILON9); // false
 */
CesiumMath.equalsEpsilon = function (left, right, relativeEpsilon, absoluteEpsilon) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(left)) {
        throw new DeveloperError('left is required.');
    }
    if (!defined(right)) {
        throw new DeveloperError('right is required.');
    }
    if (!defined(relativeEpsilon)) {
        throw new DeveloperError('relativeEpsilon is required.');
    }
    //>>includeEnd('debug');
    absoluteEpsilon = defaultValue(absoluteEpsilon, relativeEpsilon);
    var absDiff = Math.abs(left - right);
    return absDiff <= absoluteEpsilon || absDiff <= relativeEpsilon * Math.max(Math.abs(left), Math.abs(right));
};

/**
 * Determines if the left value is less than the right value. If the two values are within
 * <code>absoluteEpsilon</code> of each other, they are considered equal and this function returns false.
 *
 * @param {Number} left The first number to compare.
 * @param {Number} right The second number to compare.
 * @param {Number} absoluteEpsilon The absolute epsilon to use in comparison.
 * @returns {Boolean} <code>true</code> if <code>left</code> is less than <code>right</code> by more than
 *          <code>absoluteEpsilon<code>. <code>false</code> if <code>left</code> is greater or if the two
 *          values are nearly equal.
 */
CesiumMath.lessThan = function (left, right, absoluteEpsilon) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(left)) {
        throw new DeveloperError('first is required.');
    }
    if (!defined(right)) {
        throw new DeveloperError('second is required.');
    }
    if (!defined(absoluteEpsilon)) {
        throw new DeveloperError('relativeEpsilon is required.');
    }
    //>>includeEnd('debug');
    return left - right < -absoluteEpsilon;
};

/**
 * Determines if the left value is less than or equal to the right value. If the two values are within
 * <code>absoluteEpsilon</code> of each other, they are considered equal and this function returns true.
 *
 * @param {Number} left The first number to compare.
 * @param {Number} right The second number to compare.
 * @param {Number} absoluteEpsilon The absolute epsilon to use in comparison.
 * @returns {Boolean} <code>true</code> if <code>left</code> is less than <code>right</code> or if the
 *          the values are nearly equal.
 */
CesiumMath.lessThanOrEquals = function (left, right, absoluteEpsilon) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(left)) {
        throw new DeveloperError('first is required.');
    }
    if (!defined(right)) {
        throw new DeveloperError('second is required.');
    }
    if (!defined(absoluteEpsilon)) {
        throw new DeveloperError('relativeEpsilon is required.');
    }
    //>>includeEnd('debug');
    return left - right < absoluteEpsilon;
};

/**
 * Determines if the left value is greater the right value. If the two values are within
 * <code>absoluteEpsilon</code> of each other, they are considered equal and this function returns false.
 *
 * @param {Number} left The first number to compare.
 * @param {Number} right The second number to compare.
 * @param {Number} absoluteEpsilon The absolute epsilon to use in comparison.
 * @returns {Boolean} <code>true</code> if <code>left</code> is greater than <code>right</code> by more than
 *          <code>absoluteEpsilon<code>. <code>false</code> if <code>left</code> is less or if the two
 *          values are nearly equal.
 */
CesiumMath.greaterThan = function (left, right, absoluteEpsilon) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(left)) {
        throw new DeveloperError('first is required.');
    }
    if (!defined(right)) {
        throw new DeveloperError('second is required.');
    }
    if (!defined(absoluteEpsilon)) {
        throw new DeveloperError('relativeEpsilon is required.');
    }
    //>>includeEnd('debug');
    return left - right > absoluteEpsilon;
};

/**
 * Determines if the left value is greater than or equal to the right value. If the two values are within
 * <code>absoluteEpsilon</code> of each other, they are considered equal and this function returns true.
 *
 * @param {Number} left The first number to compare.
 * @param {Number} right The second number to compare.
 * @param {Number} absoluteEpsilon The absolute epsilon to use in comparison.
 * @returns {Boolean} <code>true</code> if <code>left</code> is greater than <code>right</code> or if the
 *          the values are nearly equal.
 */
CesiumMath.greaterThanOrEquals = function (left, right, absoluteEpsilon) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(left)) {
        throw new DeveloperError('first is required.');
    }
    if (!defined(right)) {
        throw new DeveloperError('second is required.');
    }
    if (!defined(absoluteEpsilon)) {
        throw new DeveloperError('relativeEpsilon is required.');
    }
    //>>includeEnd('debug');
    return left - right > -absoluteEpsilon;
};

var factorials = [1];

/**
 * Computes the factorial of the provided number.
 *
 * @param {Number} n The number whose factorial is to be computed.
 * @returns {Number} The factorial of the provided number or undefined if the number is less than 0.
 *
 * @exception {DeveloperError} A number greater than or equal to 0 is required.
 *
 *
 * @example
 * //Compute 7!, which is equal to 5040
 * var computedFactorial = Cesium.Math.factorial(7);
 *
 * @see {@link http://en.wikipedia.org/wiki/Factorial|Factorial on Wikipedia}
 */
CesiumMath.factorial = function (n) {
    //>>includeStart('debug', pragmas.debug);
    if (typeof n !== 'number' || n < 0) {
        throw new DeveloperError('A number greater than or equal to 0 is required.');
    }
    //>>includeEnd('debug');

    var length = factorials.length;
    if (n >= length) {
        var sum = factorials[length - 1];
        for (var i = length; i <= n; i++) {
            factorials.push(sum * i);
        }
    }
    return factorials[n];
};

/**
 * Increments a number with a wrapping to a minimum value if the number exceeds the maximum value.
 *
 * @param {Number} [n] The number to be incremented.
 * @param {Number} [maximumValue] The maximum incremented value before rolling over to the minimum value.
 * @param {Number} [minimumValue=0.0] The number reset to after the maximum value has been exceeded.
 * @returns {Number} The incremented number.
 *
 * @exception {DeveloperError} Maximum value must be greater than minimum value.
 *
 * @example
 * var n = Cesium.Math.incrementWrap(5, 10, 0); // returns 6
 * var n = Cesium.Math.incrementWrap(10, 10, 0); // returns 0
 */
CesiumMath.incrementWrap = function (n, maximumValue, minimumValue) {
    minimumValue = defaultValue(minimumValue, 0.0);

    //>>includeStart('debug', pragmas.debug);
    if (!defined(n)) {
        throw new DeveloperError('n is required.');
    }
    if (maximumValue <= minimumValue) {
        throw new DeveloperError('maximumValue must be greater than minimumValue.');
    }
    //>>includeEnd('debug');

    ++n;
    if (n > maximumValue) {
        n = minimumValue;
    }
    return n;
};

/**
 * Determines if a positive integer is a power of two.
 *
 * @param {Number} n The positive integer to test.
 * @returns {Boolean} <code>true</code> if the number if a power of two; otherwise, <code>false</code>.
 *
 * @exception {DeveloperError} A number greater than or equal to 0 is required.
 *
 * @example
 * var t = Cesium.Math.isPowerOfTwo(16); // true
 * var f = Cesium.Math.isPowerOfTwo(20); // false
 */
CesiumMath.isPowerOfTwo = function (n) {
    //>>includeStart('debug', pragmas.debug);
    if (typeof n !== 'number' || n < 0) {
        throw new DeveloperError('A number greater than or equal to 0 is required.');
    }
    //>>includeEnd('debug');

    return (n !== 0) && ((n & (n - 1)) === 0);
};

/**
 * Computes the next power-of-two integer greater than or equal to the provided positive integer.
 *
 * @param {Number} n The positive integer to test.
 * @returns {Number} The next power-of-two integer.
 *
 * @exception {DeveloperError} A number greater than or equal to 0 is required.
 *
 * @example
 * var n = Cesium.Math.nextPowerOfTwo(29); // 32
 * var m = Cesium.Math.nextPowerOfTwo(32); // 32
 */
CesiumMath.nextPowerOfTwo = function (n) {
    //>>includeStart('debug', pragmas.debug);
    if (typeof n !== 'number' || n < 0) {
        throw new DeveloperError('A number greater than or equal to 0 is required.');
    }
    //>>includeEnd('debug');

    // From http://graphics.stanford.edu/~seander/bithacks.html#RoundUpPowerOf2
    --n;
    n |= n >> 1;
    n |= n >> 2;
    n |= n >> 4;
    n |= n >> 8;
    n |= n >> 16;
    ++n;

    return n;
};

/**
 * Constraint a value to lie between two values.
 *
 * @param {Number} value The value to constrain.
 * @param {Number} min The minimum value.
 * @param {Number} max The maximum value.
 * @returns {Number} The value clamped so that min <= value <= max.
 */
CesiumMath.clamp = function (value, min, max) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(value)) {
        throw new DeveloperError('value is required');
    }
    if (!defined(min)) {
        throw new DeveloperError('min is required.');
    }
    if (!defined(max)) {
        throw new DeveloperError('max is required.');
    }
    //>>includeEnd('debug');
    return value < min ? min : value > max ? max : value;
};

var randomNumberGenerator = new MersenneTwister();

/**
 * Sets the seed used by the random number generator
 * in {@link CesiumMath#nextRandomNumber}.
 *
 * @param {Number} seed An integer used as the seed.
 */
CesiumMath.setRandomNumberSeed = function (seed) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(seed)) {
        throw new DeveloperError('seed is required.');
    }
    //>>includeEnd('debug');

    randomNumberGenerator = new MersenneTwister(seed);
};

/**
 * Generates a random floating point number in the range of [0.0, 1.0)
 * using a Mersenne twister.
 *
 * @returns {Number} A random number in the range of [0.0, 1.0).
 *
 * @see CesiumMath.setRandomNumberSeed
 * @see {@link http://en.wikipedia.org/wiki/Mersenne_twister|Mersenne twister on Wikipedia}
 */
CesiumMath.nextRandomNumber = function () {
    return randomNumberGenerator.random();
};

/**
 * Generates a random number between two numbers.
 *
 * @param {Number} min The minimum value.
 * @param {Number} max The maximum value.
 * @returns {Number} A random number between the min and max.
 */
CesiumMath.randomBetween = function (min, max) {
    return CesiumMath.nextRandomNumber() * (max - min) + min;
};

/**
 * Computes <code>Math.acos(value)</code>, but first clamps <code>value</code> to the range [-1.0, 1.0]
 * so that the function will never return NaN.
 *
 * @param {Number} value The value for which to compute acos.
 * @returns {Number} The acos of the value if the value is in the range [-1.0, 1.0], or the acos of -1.0 or 1.0,
 *          whichever is closer, if the value is outside the range.
 */
CesiumMath.acosClamped = function (value) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(value)) {
        throw new DeveloperError('value is required.');
    }
    //>>includeEnd('debug');
    return Math.acos(CesiumMath.clamp(value, -1.0, 1.0));
};

/**
 * Computes <code>Math.asin(value)</code>, but first clamps <code>value</code> to the range [-1.0, 1.0]
 * so that the function will never return NaN.
 *
 * @param {Number} value The value for which to compute asin.
 * @returns {Number} The asin of the value if the value is in the range [-1.0, 1.0], or the asin of -1.0 or 1.0,
 *          whichever is closer, if the value is outside the range.
 */
CesiumMath.asinClamped = function (value) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(value)) {
        throw new DeveloperError('value is required.');
    }
    //>>includeEnd('debug');
    return Math.asin(CesiumMath.clamp(value, -1.0, 1.0));
};

/**
 * Finds the chord length between two points given the circle's radius and the angle between the points.
 *
 * @param {Number} angle The angle between the two points.
 * @param {Number} radius The radius of the circle.
 * @returns {Number} The chord length.
 */
CesiumMath.chordLength = function (angle, radius) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(angle)) {
        throw new DeveloperError('angle is required.');
    }
    if (!defined(radius)) {
        throw new DeveloperError('radius is required.');
    }
    //>>includeEnd('debug');
    return 2.0 * radius * Math.sin(angle * 0.5);
};

/**
 * Finds the logarithm of a number to a base.
 *
 * @param {Number} number The number.
 * @param {Number} base The base.
 * @returns {Number} The result.
 */
CesiumMath.logBase = function (number, base) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(number)) {
        throw new DeveloperError('number is required.');
    }
    if (!defined(base)) {
        throw new DeveloperError('base is required.');
    }
    //>>includeEnd('debug');
    return Math.log(number) / Math.log(base);
};

/**
 * Finds the cube root of a number.
 * Returns NaN if <code>number</code> is not provided.
 *
 * @function
 * @param {Number} [number] The number.
 * @returns {Number} The result.
 */
CesiumMath.cbrt = defaultValue(Math.cbrt, function cbrt(number) {
    var result = Math.pow(Math.abs(number), 1.0 / 3.0);
    return number < 0.0 ? -result : result;
});

/**
 * Finds the base 2 logarithm of a number.
 *
 * @function
 * @param {Number} number The number.
 * @returns {Number} The result.
 */
CesiumMath.log2 = defaultValue(Math.log2, function log2(number) {
    return Math.log(number) * Math.LOG2E;
});

/**
 * @private
 */
CesiumMath.fog = function (distanceToCamera, density) {
    var scalar = distanceToCamera * density;
    return 1.0 - Math.exp(-(scalar * scalar));
};

/**
 * Computes a fast approximation of Atan for input in the range [-1, 1].
 *
 * Based on Michal Drobot's approximation from ShaderFastLibs,
 * which in turn is based on "Efficient approximations for the arctangent function,"
 * Rajan, S. Sichun Wang Inkol, R. Joyal, A., May 2006.
 * Adapted from ShaderFastLibs under MIT License.
 *
 * @param {Number} x An input number in the range [-1, 1]
 * @returns {Number} An approximation of atan(x)
 */
CesiumMath.fastApproximateAtan = function (x) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number('x', x);
    //>>includeEnd('debug');

    return x * (-0.1784 * Math.abs(x) - 0.0663 * x * x + 1.0301);
};

/**
 * Computes a fast approximation of Atan2(x, y) for arbitrary input scalars.
 *
 * Range reduction math based on nvidia's cg reference implementation: http://developer.download.nvidia.com/cg/atan2.html
 *
 * @param {Number} x An input number that isn't zero if y is zero.
 * @param {Number} y An input number that isn't zero if x is zero.
 * @returns {Number} An approximation of atan2(x, y)
 */
CesiumMath.fastApproximateAtan2 = function (x, y) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number('x', x);
    Check.typeOf.number('y', y);
    //>>includeEnd('debug');

    // atan approximations are usually only reliable over [-1, 1]
    // So reduce the range by flipping whether x or y is on top based on which is bigger.
    var opposite;
    var adjacent;
    var t = Math.abs(x); // t used as swap and atan result.
    opposite = Math.abs(y);
    adjacent = Math.max(t, opposite);
    opposite = Math.min(t, opposite);

    var oppositeOverAdjacent = opposite / adjacent;
    //>>includeStart('debug', pragmas.debug);
    if (isNaN(oppositeOverAdjacent)) {
        throw new DeveloperError('either x or y must be nonzero');
    }
    //>>includeEnd('debug');
    t = CesiumMath.fastApproximateAtan(oppositeOverAdjacent);

    // Undo range reduction
    t = Math.abs(y) > Math.abs(x) ? CesiumMath.PI_OVER_TWO - t : t;
    t = x < 0.0 ? CesiumMath.PI - t : t;
    t = y < 0.0 ? -t : t;
    return t;
};

module.exports = CesiumMath;

},{"./Check":11,"./DeveloperError":13,"./defaultValue":40,"./defined":42,"mersenne-twister":undefined}],22:[function(require,module,exports){
var Cartographic=require('./Cartographic');
var Check=require('./Check');
var defaultValue=require('./defaultValue');
var defined=require('./defined');
var defineProperties=require('./defineProperties');
var Ellipsoid=require('./Ellipsoid');
var freezeObject=require('./freezeObject');
var CesiumMath=require('./Math');

    'use strict';

    /**
     * A two dimensional region specified as longitude and latitude coordinates.
     *
     * @alias Rectangle
     * @constructor
     *
     * @param {Number} [west=0.0] The westernmost longitude, in radians, in the range [-Pi, Pi].
     * @param {Number} [south=0.0] The southernmost latitude, in radians, in the range [-Pi/2, Pi/2].
     * @param {Number} [east=0.0] The easternmost longitude, in radians, in the range [-Pi, Pi].
     * @param {Number} [north=0.0] The northernmost latitude, in radians, in the range [-Pi/2, Pi/2].
     *
     * @see Packable
     */
    function Rectangle(west, south, east, north) {
        /**
         * The westernmost longitude in radians in the range [-Pi, Pi].
         *
         * @type {Number}
         * @default 0.0
         */
        this.west = defaultValue(west, 0.0);

        /**
         * The southernmost latitude in radians in the range [-Pi/2, Pi/2].
         *
         * @type {Number}
         * @default 0.0
         */
        this.south = defaultValue(south, 0.0);

        /**
         * The easternmost longitude in radians in the range [-Pi, Pi].
         *
         * @type {Number}
         * @default 0.0
         */
        this.east = defaultValue(east, 0.0);

        /**
         * The northernmost latitude in radians in the range [-Pi/2, Pi/2].
         *
         * @type {Number}
         * @default 0.0
         */
        this.north = defaultValue(north, 0.0);
    }

    defineProperties(Rectangle.prototype, {
        /**
         * Gets the width of the rectangle in radians.
         * @memberof Rectangle.prototype
         * @type {Number}
         */
        width : {
            get : function() {
                return Rectangle.computeWidth(this);
            }
        },

        /**
         * Gets the height of the rectangle in radians.
         * @memberof Rectangle.prototype
         * @type {Number}
         */
        height : {
            get : function() {
                return Rectangle.computeHeight(this);
            }
        }
    });

    /**
     * The number of elements used to pack the object into an array.
     * @type {Number}
     */
    Rectangle.packedLength = 4;

    /**
     * Stores the provided instance into the provided array.
     *
     * @param {Rectangle} value The value to pack.
     * @param {Number[]} array The array to pack into.
     * @param {Number} [startingIndex=0] The index into the array at which to start packing the elements.
     *
     * @returns {Number[]} The array that was packed into
     */
    Rectangle.pack = function(value, array, startingIndex) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('value', value);
        Check.defined('array', array);
        //>>includeEnd('debug');

        startingIndex = defaultValue(startingIndex, 0);

        array[startingIndex++] = value.west;
        array[startingIndex++] = value.south;
        array[startingIndex++] = value.east;
        array[startingIndex] = value.north;

        return array;
    };

    /**
     * Retrieves an instance from a packed array.
     *
     * @param {Number[]} array The packed array.
     * @param {Number} [startingIndex=0] The starting index of the element to be unpacked.
     * @param {Rectangle} [result] The object into which to store the result.
     * @returns {Rectangle} The modified result parameter or a new Rectangle instance if one was not provided.
     */
    Rectangle.unpack = function(array, startingIndex, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('array', array);
        //>>includeEnd('debug');

        startingIndex = defaultValue(startingIndex, 0);

        if (!defined(result)) {
            result = new Rectangle();
        }

        result.west = array[startingIndex++];
        result.south = array[startingIndex++];
        result.east = array[startingIndex++];
        result.north = array[startingIndex];
        return result;
    };

    /**
     * Computes the width of a rectangle in radians.
     * @param {Rectangle} rectangle The rectangle to compute the width of.
     * @returns {Number} The width.
     */
    Rectangle.computeWidth = function(rectangle) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('rectangle', rectangle);
        //>>includeEnd('debug');
        var east = rectangle.east;
        var west = rectangle.west;
        if (east < west) {
            east += CesiumMath.TWO_PI;
        }
        return east - west;
    };

    /**
     * Computes the height of a rectangle in radians.
     * @param {Rectangle} rectangle The rectangle to compute the height of.
     * @returns {Number} The height.
     */
    Rectangle.computeHeight = function(rectangle) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('rectangle', rectangle);
        //>>includeEnd('debug');
        return rectangle.north - rectangle.south;
    };

    /**
     * Creates a rectangle given the boundary longitude and latitude in degrees.
     *
     * @param {Number} [west=0.0] The westernmost longitude in degrees in the range [-180.0, 180.0].
     * @param {Number} [south=0.0] The southernmost latitude in degrees in the range [-90.0, 90.0].
     * @param {Number} [east=0.0] The easternmost longitude in degrees in the range [-180.0, 180.0].
     * @param {Number} [north=0.0] The northernmost latitude in degrees in the range [-90.0, 90.0].
     * @param {Rectangle} [result] The object onto which to store the result, or undefined if a new instance should be created.
     * @returns {Rectangle} The modified result parameter or a new Rectangle instance if none was provided.
     *
     * @example
     * var rectangle = Cesium.Rectangle.fromDegrees(0.0, 20.0, 10.0, 30.0);
     */
    Rectangle.fromDegrees = function(west, south, east, north, result) {
        west = CesiumMath.toRadians(defaultValue(west, 0.0));
        south = CesiumMath.toRadians(defaultValue(south, 0.0));
        east = CesiumMath.toRadians(defaultValue(east, 0.0));
        north = CesiumMath.toRadians(defaultValue(north, 0.0));

        if (!defined(result)) {
            return new Rectangle(west, south, east, north);
        }

        result.west = west;
        result.south = south;
        result.east = east;
        result.north = north;

        return result;
    };

    /**
     * Creates a rectangle given the boundary longitude and latitude in radians.
     *
     * @param {Number} [west=0.0] The westernmost longitude in radians in the range [-Math.PI, Math.PI].
     * @param {Number} [south=0.0] The southernmost latitude in radians in the range [-Math.PI/2, Math.PI/2].
     * @param {Number} [east=0.0] The easternmost longitude in radians in the range [-Math.PI, Math.PI].
     * @param {Number} [north=0.0] The northernmost latitude in radians in the range [-Math.PI/2, Math.PI/2].
     * @param {Rectangle} [result] The object onto which to store the result, or undefined if a new instance should be created.
     * @returns {Rectangle} The modified result parameter or a new Rectangle instance if none was provided.
     *
     * @example
     * var rectangle = Cesium.Rectangle.fromRadians(0.0, Math.PI/4, Math.PI/8, 3*Math.PI/4);
     */
    Rectangle.fromRadians = function(west, south, east, north, result) {
        if (!defined(result)) {
            return new Rectangle(west, south, east, north);
        }

        result.west = defaultValue(west, 0.0);
        result.south = defaultValue(south, 0.0);
        result.east = defaultValue(east, 0.0);
        result.north = defaultValue(north, 0.0);

        return result;
    };

    /**
     * Creates the smallest possible Rectangle that encloses all positions in the provided array.
     *
     * @param {Cartographic[]} cartographics The list of Cartographic instances.
     * @param {Rectangle} [result] The object onto which to store the result, or undefined if a new instance should be created.
     * @returns {Rectangle} The modified result parameter or a new Rectangle instance if none was provided.
     */
    Rectangle.fromCartographicArray = function(cartographics, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('cartographics', cartographics);
        //>>includeEnd('debug');

        var west = Number.MAX_VALUE;
        var east = -Number.MAX_VALUE;
        var westOverIDL = Number.MAX_VALUE;
        var eastOverIDL = -Number.MAX_VALUE;
        var south = Number.MAX_VALUE;
        var north = -Number.MAX_VALUE;

        for ( var i = 0, len = cartographics.length; i < len; i++) {
            var position = cartographics[i];
            west = Math.min(west, position.longitude);
            east = Math.max(east, position.longitude);
            south = Math.min(south, position.latitude);
            north = Math.max(north, position.latitude);

            var lonAdjusted = position.longitude >= 0 ?  position.longitude : position.longitude +  CesiumMath.TWO_PI;
            westOverIDL = Math.min(westOverIDL, lonAdjusted);
            eastOverIDL = Math.max(eastOverIDL, lonAdjusted);
        }

        if(east - west > eastOverIDL - westOverIDL) {
            west = westOverIDL;
            east = eastOverIDL;

            if (east > CesiumMath.PI) {
                east = east - CesiumMath.TWO_PI;
            }
            if (west > CesiumMath.PI) {
                west = west - CesiumMath.TWO_PI;
            }
        }

        if (!defined(result)) {
            return new Rectangle(west, south, east, north);
        }

        result.west = west;
        result.south = south;
        result.east = east;
        result.north = north;
        return result;
    };

    /**
     * Creates the smallest possible Rectangle that encloses all positions in the provided array.
     *
     * @param {Cartesian3[]} cartesians The list of Cartesian instances.
     * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid the cartesians are on.
     * @param {Rectangle} [result] The object onto which to store the result, or undefined if a new instance should be created.
     * @returns {Rectangle} The modified result parameter or a new Rectangle instance if none was provided.
     */
    Rectangle.fromCartesianArray = function(cartesians, ellipsoid, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('cartesians', cartesians);
        //>>includeEnd('debug');
        ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);

        var west = Number.MAX_VALUE;
        var east = -Number.MAX_VALUE;
        var westOverIDL = Number.MAX_VALUE;
        var eastOverIDL = -Number.MAX_VALUE;
        var south = Number.MAX_VALUE;
        var north = -Number.MAX_VALUE;

        for ( var i = 0, len = cartesians.length; i < len; i++) {
            var position = ellipsoid.cartesianToCartographic(cartesians[i]);
            west = Math.min(west, position.longitude);
            east = Math.max(east, position.longitude);
            south = Math.min(south, position.latitude);
            north = Math.max(north, position.latitude);

            var lonAdjusted = position.longitude >= 0 ?  position.longitude : position.longitude +  CesiumMath.TWO_PI;
            westOverIDL = Math.min(westOverIDL, lonAdjusted);
            eastOverIDL = Math.max(eastOverIDL, lonAdjusted);
        }

        if(east - west > eastOverIDL - westOverIDL) {
            west = westOverIDL;
            east = eastOverIDL;

            if (east > CesiumMath.PI) {
                east = east - CesiumMath.TWO_PI;
            }
            if (west > CesiumMath.PI) {
                west = west - CesiumMath.TWO_PI;
            }
        }

        if (!defined(result)) {
            return new Rectangle(west, south, east, north);
        }

        result.west = west;
        result.south = south;
        result.east = east;
        result.north = north;
        return result;
    };

    /**
     * Duplicates a Rectangle.
     *
     * @param {Rectangle} rectangle The rectangle to clone.
     * @param {Rectangle} [result] The object onto which to store the result, or undefined if a new instance should be created.
     * @returns {Rectangle} The modified result parameter or a new Rectangle instance if none was provided. (Returns undefined if rectangle is undefined)
     */
    Rectangle.clone = function(rectangle, result) {
        if (!defined(rectangle)) {
            return undefined;
        }

        if (!defined(result)) {
            return new Rectangle(rectangle.west, rectangle.south, rectangle.east, rectangle.north);
        }

        result.west = rectangle.west;
        result.south = rectangle.south;
        result.east = rectangle.east;
        result.north = rectangle.north;
        return result;
    };

    /**
     * Compares the provided Rectangles componentwise and returns
     * <code>true</code> if they pass an absolute or relative tolerance test,
     * <code>false</code> otherwise.
     *
     * @param {Rectangle} [left] The first Rectangle.
     * @param {Rectangle} [right] The second Rectangle.
     * @param {Number} absoluteEpsilon The absolute epsilon tolerance to use for equality testing.
     * @returns {Boolean} <code>true</code> if left and right are within the provided epsilon, <code>false</code> otherwise.
     */
    Rectangle.equalsEpsilon = function(left, right, absoluteEpsilon) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.number('absoluteEpsilon', absoluteEpsilon);
        //>>includeEnd('debug');

        return (left === right) ||
               (defined(left) &&
                defined(right) &&
                (Math.abs(left.west - right.west) <= absoluteEpsilon) &&
                (Math.abs(left.south - right.south) <= absoluteEpsilon) &&
                (Math.abs(left.east - right.east) <= absoluteEpsilon) &&
                (Math.abs(left.north - right.north) <= absoluteEpsilon));
    };

    /**
     * Duplicates this Rectangle.
     *
     * @param {Rectangle} [result] The object onto which to store the result.
     * @returns {Rectangle} The modified result parameter or a new Rectangle instance if none was provided.
     */
    Rectangle.prototype.clone = function(result) {
        return Rectangle.clone(this, result);
    };

    /**
     * Compares the provided Rectangle with this Rectangle componentwise and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     *
     * @param {Rectangle} [other] The Rectangle to compare.
     * @returns {Boolean} <code>true</code> if the Rectangles are equal, <code>false</code> otherwise.
     */
    Rectangle.prototype.equals = function(other) {
        return Rectangle.equals(this, other);
    };

    /**
     * Compares the provided rectangles and returns <code>true</code> if they are equal,
     * <code>false</code> otherwise.
     *
     * @param {Rectangle} [left] The first Rectangle.
     * @param {Rectangle} [right] The second Rectangle.
     * @returns {Boolean} <code>true</code> if left and right are equal; otherwise <code>false</code>.
     */
    Rectangle.equals = function(left, right) {
        return (left === right) ||
               ((defined(left)) &&
                (defined(right)) &&
                (left.west === right.west) &&
                (left.south === right.south) &&
                (left.east === right.east) &&
                (left.north === right.north));
    };

    /**
     * Compares the provided Rectangle with this Rectangle componentwise and returns
     * <code>true</code> if they are within the provided epsilon,
     * <code>false</code> otherwise.
     *
     * @param {Rectangle} [other] The Rectangle to compare.
     * @param {Number} epsilon The epsilon to use for equality testing.
     * @returns {Boolean} <code>true</code> if the Rectangles are within the provided epsilon, <code>false</code> otherwise.
     */
    Rectangle.prototype.equalsEpsilon = function(other, epsilon) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.number('epsilon', epsilon);
        //>>includeEnd('debug');

        return Rectangle.equalsEpsilon(this, other, epsilon);
    };

    /**
     * Checks a Rectangle's properties and throws if they are not in valid ranges.
     *
     * @param {Rectangle} rectangle The rectangle to validate
     *
     * @exception {DeveloperError} <code>north</code> must be in the interval [<code>-Pi/2</code>, <code>Pi/2</code>].
     * @exception {DeveloperError} <code>south</code> must be in the interval [<code>-Pi/2</code>, <code>Pi/2</code>].
     * @exception {DeveloperError} <code>east</code> must be in the interval [<code>-Pi</code>, <code>Pi</code>].
     * @exception {DeveloperError} <code>west</code> must be in the interval [<code>-Pi</code>, <code>Pi</code>].
     */
    Rectangle.validate = function(rectangle) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('rectangle', rectangle);

        var north = rectangle.north;
        Check.typeOf.number.greaterThanOrEquals('north', north, -CesiumMath.PI_OVER_TWO);
        Check.typeOf.number.lessThanOrEquals('north', north, CesiumMath.PI_OVER_TWO);

        var south = rectangle.south;
        Check.typeOf.number.greaterThanOrEquals('south', south, -CesiumMath.PI_OVER_TWO);
        Check.typeOf.number.lessThanOrEquals('south', south, CesiumMath.PI_OVER_TWO);

        var west = rectangle.west;
        Check.typeOf.number.greaterThanOrEquals('west', west, -Math.PI);
        Check.typeOf.number.lessThanOrEquals('west', west, Math.PI);

        var east = rectangle.east;
        Check.typeOf.number.greaterThanOrEquals('east', east, -Math.PI);
        Check.typeOf.number.lessThanOrEquals('east', east, Math.PI);
        //>>includeEnd('debug');
    };

    /**
     * Computes the southwest corner of a rectangle.
     *
     * @param {Rectangle} rectangle The rectangle for which to find the corner
     * @param {Cartographic} [result] The object onto which to store the result.
     * @returns {Cartographic} The modified result parameter or a new Cartographic instance if none was provided.
     */
    Rectangle.southwest = function(rectangle, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('rectangle', rectangle);
        //>>includeEnd('debug');

        if (!defined(result)) {
            return new Cartographic(rectangle.west, rectangle.south);
        }
        result.longitude = rectangle.west;
        result.latitude = rectangle.south;
        result.height = 0.0;
        return result;
    };

    /**
     * Computes the northwest corner of a rectangle.
     *
     * @param {Rectangle} rectangle The rectangle for which to find the corner
     * @param {Cartographic} [result] The object onto which to store the result.
     * @returns {Cartographic} The modified result parameter or a new Cartographic instance if none was provided.
     */
    Rectangle.northwest = function(rectangle, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('rectangle', rectangle);
        //>>includeEnd('debug');

        if (!defined(result)) {
            return new Cartographic(rectangle.west, rectangle.north);
        }
        result.longitude = rectangle.west;
        result.latitude = rectangle.north;
        result.height = 0.0;
        return result;
    };

    /**
     * Computes the northeast corner of a rectangle.
     *
     * @param {Rectangle} rectangle The rectangle for which to find the corner
     * @param {Cartographic} [result] The object onto which to store the result.
     * @returns {Cartographic} The modified result parameter or a new Cartographic instance if none was provided.
     */
    Rectangle.northeast = function(rectangle, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('rectangle', rectangle);
        //>>includeEnd('debug');

        if (!defined(result)) {
            return new Cartographic(rectangle.east, rectangle.north);
        }
        result.longitude = rectangle.east;
        result.latitude = rectangle.north;
        result.height = 0.0;
        return result;
    };

    /**
     * Computes the southeast corner of a rectangle.
     *
     * @param {Rectangle} rectangle The rectangle for which to find the corner
     * @param {Cartographic} [result] The object onto which to store the result.
     * @returns {Cartographic} The modified result parameter or a new Cartographic instance if none was provided.
     */
    Rectangle.southeast = function(rectangle, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('rectangle', rectangle);
        //>>includeEnd('debug');

        if (!defined(result)) {
            return new Cartographic(rectangle.east, rectangle.south);
        }
        result.longitude = rectangle.east;
        result.latitude = rectangle.south;
        result.height = 0.0;
        return result;
    };

    /**
     * Computes the center of a rectangle.
     *
     * @param {Rectangle} rectangle The rectangle for which to find the center
     * @param {Cartographic} [result] The object onto which to store the result.
     * @returns {Cartographic} The modified result parameter or a new Cartographic instance if none was provided.
     */
    Rectangle.center = function(rectangle, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('rectangle', rectangle);
        //>>includeEnd('debug');

        var east = rectangle.east;
        var west = rectangle.west;

        if (east < west) {
            east += CesiumMath.TWO_PI;
        }

        var longitude = CesiumMath.negativePiToPi((west + east) * 0.5);
        var latitude = (rectangle.south + rectangle.north) * 0.5;

        if (!defined(result)) {
            return new Cartographic(longitude, latitude);
        }

        result.longitude = longitude;
        result.latitude = latitude;
        result.height = 0.0;
        return result;
    };

    /**
     * Computes the intersection of two rectangles.  This function assumes that the rectangle's coordinates are
     * latitude and longitude in radians and produces a correct intersection, taking into account the fact that
     * the same angle can be represented with multiple values as well as the wrapping of longitude at the
     * anti-meridian.  For a simple intersection that ignores these factors and can be used with projected
     * coordinates, see {@link Rectangle.simpleIntersection}.
     *
     * @param {Rectangle} rectangle On rectangle to find an intersection
     * @param {Rectangle} otherRectangle Another rectangle to find an intersection
     * @param {Rectangle} [result] The object onto which to store the result.
     * @returns {Rectangle|undefined} The modified result parameter, a new Rectangle instance if none was provided or undefined if there is no intersection.
     */
    Rectangle.intersection = function(rectangle, otherRectangle, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('rectangle', rectangle);
        Check.typeOf.object('otherRectangle', otherRectangle);
        //>>includeEnd('debug');

        var rectangleEast = rectangle.east;
        var rectangleWest = rectangle.west;

        var otherRectangleEast = otherRectangle.east;
        var otherRectangleWest = otherRectangle.west;

        if (rectangleEast < rectangleWest && otherRectangleEast > 0.0) {
            rectangleEast += CesiumMath.TWO_PI;
        } else if (otherRectangleEast < otherRectangleWest && rectangleEast > 0.0) {
            otherRectangleEast += CesiumMath.TWO_PI;
        }

        if (rectangleEast < rectangleWest && otherRectangleWest < 0.0) {
            otherRectangleWest += CesiumMath.TWO_PI;
        } else if (otherRectangleEast < otherRectangleWest && rectangleWest < 0.0) {
            rectangleWest += CesiumMath.TWO_PI;
        }

        var west = CesiumMath.negativePiToPi(Math.max(rectangleWest, otherRectangleWest));
        var east = CesiumMath.negativePiToPi(Math.min(rectangleEast, otherRectangleEast));

        if ((rectangle.west < rectangle.east || otherRectangle.west < otherRectangle.east) && east <= west) {
            return undefined;
        }

        var south = Math.max(rectangle.south, otherRectangle.south);
        var north = Math.min(rectangle.north, otherRectangle.north);

        if (south >= north) {
            return undefined;
        }

        if (!defined(result)) {
            return new Rectangle(west, south, east, north);
        }
        result.west = west;
        result.south = south;
        result.east = east;
        result.north = north;
        return result;
    };

    /**
     * Computes a simple intersection of two rectangles.  Unlike {@link Rectangle.intersection}, this function
     * does not attempt to put the angular coordinates into a consistent range or to account for crossing the
     * anti-meridian.  As such, it can be used for rectangles where the coordinates are not simply latitude
     * and longitude (i.e. projected coordinates).
     *
     * @param {Rectangle} rectangle On rectangle to find an intersection
     * @param {Rectangle} otherRectangle Another rectangle to find an intersection
     * @param {Rectangle} [result] The object onto which to store the result.
     * @returns {Rectangle|undefined} The modified result parameter, a new Rectangle instance if none was provided or undefined if there is no intersection.
     */
    Rectangle.simpleIntersection = function(rectangle, otherRectangle, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('rectangle', rectangle);
        Check.typeOf.object('otherRectangle', otherRectangle);
        //>>includeEnd('debug');

        var west = Math.max(rectangle.west, otherRectangle.west);
        var south = Math.max(rectangle.south, otherRectangle.south);
        var east = Math.min(rectangle.east, otherRectangle.east);
        var north = Math.min(rectangle.north, otherRectangle.north);

        if (south >= north || west >= east) {
            return undefined;
        }

        if (!defined(result)) {
            return new Rectangle(west, south, east, north);
        }

        result.west = west;
        result.south = south;
        result.east = east;
        result.north = north;
        return result;
    };

    /**
     * Computes a rectangle that is the union of two rectangles.
     *
     * @param {Rectangle} rectangle A rectangle to enclose in rectangle.
     * @param {Rectangle} otherRectangle A rectangle to enclose in a rectangle.
     * @param {Rectangle} [result] The object onto which to store the result.
     * @returns {Rectangle} The modified result parameter or a new Rectangle instance if none was provided.
     */
    Rectangle.union = function(rectangle, otherRectangle, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('rectangle', rectangle);
        Check.typeOf.object('otherRectangle', otherRectangle);
        //>>includeEnd('debug');

        if (!defined(result)) {
            result = new Rectangle();
        }

        var rectangleEast = rectangle.east;
        var rectangleWest = rectangle.west;

        var otherRectangleEast = otherRectangle.east;
        var otherRectangleWest = otherRectangle.west;

        if (rectangleEast < rectangleWest && otherRectangleEast > 0.0) {
            rectangleEast += CesiumMath.TWO_PI;
        } else if (otherRectangleEast < otherRectangleWest && rectangleEast > 0.0) {
            otherRectangleEast += CesiumMath.TWO_PI;
        }

        if (rectangleEast < rectangleWest && otherRectangleWest < 0.0) {
            otherRectangleWest += CesiumMath.TWO_PI;
        } else if (otherRectangleEast < otherRectangleWest && rectangleWest < 0.0) {
            rectangleWest += CesiumMath.TWO_PI;
        }

        var west = CesiumMath.convertLongitudeRange(Math.min(rectangleWest, otherRectangleWest));
        var east = CesiumMath.convertLongitudeRange(Math.max(rectangleEast, otherRectangleEast));

        result.west = west;
        result.south = Math.min(rectangle.south, otherRectangle.south);
        result.east = east;
        result.north = Math.max(rectangle.north, otherRectangle.north);

        return result;
    };

    /**
     * Computes a rectangle by enlarging the provided rectangle until it contains the provided cartographic.
     *
     * @param {Rectangle} rectangle A rectangle to expand.
     * @param {Cartographic} cartographic A cartographic to enclose in a rectangle.
     * @param {Rectangle} [result] The object onto which to store the result.
     * @returns {Rectangle} The modified result parameter or a new Rectangle instance if one was not provided.
     */
    Rectangle.expand = function(rectangle, cartographic, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('rectangle', rectangle);
        Check.typeOf.object('cartographic', cartographic);
        //>>includeEnd('debug');

        if (!defined(result)) {
            result = new Rectangle();
        }

        result.west = Math.min(rectangle.west, cartographic.longitude);
        result.south = Math.min(rectangle.south, cartographic.latitude);
        result.east = Math.max(rectangle.east, cartographic.longitude);
        result.north = Math.max(rectangle.north, cartographic.latitude);

        return result;
    };

    /**
     * Returns true if the cartographic is on or inside the rectangle, false otherwise.
     *
     * @param {Rectangle} rectangle The rectangle
     * @param {Cartographic} cartographic The cartographic to test.
     * @returns {Boolean} true if the provided cartographic is inside the rectangle, false otherwise.
     */
    Rectangle.contains = function(rectangle, cartographic) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('rectangle', rectangle);
        Check.typeOf.object('cartographic', cartographic);
        //>>includeEnd('debug');

        var longitude = cartographic.longitude;
        var latitude = cartographic.latitude;

        var west = rectangle.west;
        var east = rectangle.east;

        if (east < west) {
            east += CesiumMath.TWO_PI;
            if (longitude < 0.0) {
                longitude += CesiumMath.TWO_PI;
            }
        }
        return (longitude > west || CesiumMath.equalsEpsilon(longitude, west, CesiumMath.EPSILON14)) &&
               (longitude < east || CesiumMath.equalsEpsilon(longitude, east, CesiumMath.EPSILON14)) &&
               latitude >= rectangle.south &&
               latitude <= rectangle.north;
    };

    var subsampleLlaScratch = new Cartographic();
    /**
     * Samples a rectangle so that it includes a list of Cartesian points suitable for passing to
     * {@link BoundingSphere#fromPoints}.  Sampling is necessary to account
     * for rectangles that cover the poles or cross the equator.
     *
     * @param {Rectangle} rectangle The rectangle to subsample.
     * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid to use.
     * @param {Number} [surfaceHeight=0.0] The height of the rectangle above the ellipsoid.
     * @param {Cartesian3[]} [result] The array of Cartesians onto which to store the result.
     * @returns {Cartesian3[]} The modified result parameter or a new Array of Cartesians instances if none was provided.
     */
    Rectangle.subsample = function(rectangle, ellipsoid, surfaceHeight, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('rectangle', rectangle);
        //>>includeEnd('debug');

        ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);
        surfaceHeight = defaultValue(surfaceHeight, 0.0);

        if (!defined(result)) {
            result = [];
        }
        var length = 0;

        var north = rectangle.north;
        var south = rectangle.south;
        var east = rectangle.east;
        var west = rectangle.west;

        var lla = subsampleLlaScratch;
        lla.height = surfaceHeight;

        lla.longitude = west;
        lla.latitude = north;
        result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
        length++;

        lla.longitude = east;
        result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
        length++;

        lla.latitude = south;
        result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
        length++;

        lla.longitude = west;
        result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
        length++;

        if (north < 0.0) {
            lla.latitude = north;
        } else if (south > 0.0) {
            lla.latitude = south;
        } else {
            lla.latitude = 0.0;
        }

        for ( var i = 1; i < 8; ++i) {
            lla.longitude = -Math.PI + i * CesiumMath.PI_OVER_TWO;
            if (Rectangle.contains(rectangle, lla)) {
                result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
                length++;
            }
        }

        if (lla.latitude === 0.0) {
            lla.longitude = west;
            result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
            length++;
            lla.longitude = east;
            result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
            length++;
        }
        result.length = length;
        return result;
    };

    /**
     * The largest possible rectangle.
     *
     * @type {Rectangle}
     * @constant
    */
    Rectangle.MAX_VALUE = freezeObject(new Rectangle(-Math.PI, -CesiumMath.PI_OVER_TWO, Math.PI, CesiumMath.PI_OVER_TWO));

    module.exports= Rectangle;

},{"./Cartographic":10,"./Check":11,"./Ellipsoid":14,"./Math":21,"./defaultValue":40,"./defineProperties":41,"./defined":42,"./freezeObject":45}],23:[function(require,module,exports){
var defaultValue=require('./defaultValue');
var defined=require('./defined');
var RequestState=require('./RequestState');
var RequestType=require('./RequestType');

    'use strict';

    /**
     * Stores information for making a request. In general this does not need to be constructed directly.
     *
     * @alias Request
     * @constructor
     * @namespace
     * @exports Request
     * @param {Object} [options] An object with the following properties:
     * @param {String} [options.url] The url to request.
     * @param {Request~RequestCallback} [options.requestFunction] The function that makes the actual data request.
     * @param {Request~CancelCallback} [options.cancelFunction] The function that is called when the request is cancelled.
     * @param {Request~PriorityCallback} [options.priorityFunction] The function that is called to update the request's priority, which occurs once per frame.
     * @param {Number} [options.priority=0.0] The initial priority of the request.
     * @param {Boolean} [options.throttle=false] Whether to throttle and prioritize the request. If false, the request will be sent immediately. If true, the request will be throttled and sent based on priority.
     * @param {Boolean} [options.throttleByServer=false] Whether to throttle the request by server.
     * @param {RequestType} [options.type=RequestType.OTHER] The type of request.
     */
    function Request(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        var throttleByServer = defaultValue(options.throttleByServer, false);
        var throttle = defaultValue(options.throttle, false);

        /**
         * The URL to request.
         *
         * @type {String}
         */
        this.url = options.url;

        /**
         * The function that makes the actual data request.
         *
         * @type {Request~RequestCallback}
         */
        this.requestFunction = options.requestFunction;

        /**
         * The function that is called when the request is cancelled.
         *
         * @type {Request~CancelCallback}
         */
        this.cancelFunction = options.cancelFunction;

        /**
         * The function that is called to update the request's priority, which occurs once per frame.
         *
         * @type {Request~PriorityCallback}
         */
        this.priorityFunction = options.priorityFunction;

        /**
         * Priority is a unit-less value where lower values represent higher priority.
         * For world-based objects, this is usually the distance from the camera.
         * A request that does not have a priority function defaults to a priority of 0.
         *
         * If priorityFunction is defined, this value is updated every frame with the result of that call.
         *
         * @type {Number}
         * @default 0.0
         */
        this.priority = defaultValue(options.priority, 0.0);

        /**
         * Whether to throttle and prioritize the request. If false, the request will be sent immediately. If true, the
         * request will be throttled and sent based on priority.
         *
         * @type {Boolean}
         * @readonly
         *
         * @default false
         */
        this.throttle = throttle;

        /**
         * Whether to throttle the request by server. Browsers typically support about 6-8 parallel connections
         * for HTTP/1 servers, and an unlimited amount of connections for HTTP/2 servers. Setting this value
         * to <code>true</code> is preferable for requests going through HTTP/1 servers.
         *
         * @type {Boolean}
         * @readonly
         *
         * @default false
         */
        this.throttleByServer = throttleByServer;

        /**
         * Type of request.
         *
         * @type {RequestType}
         * @readonly
         *
         * @default RequestType.OTHER
         */
        this.type = defaultValue(options.type, RequestType.OTHER);

        /**
         * A key used to identify the server that a request is going to. It is derived from the url's authority and scheme.
         *
         * @type {String}
         *
         * @private
         */
        this.serverKey = undefined;

        /**
         * The current state of the request.
         *
         * @type {RequestState}
         * @readonly
         */
        this.state = RequestState.UNISSUED;

        /**
         * The requests's deferred promise.
         *
         * @type {Object}
         *
         * @private
         */
        this.deferred = undefined;

        /**
         * Whether the request was explicitly cancelled.
         *
         * @type {Boolean}
         *
         * @private
         */
        this.cancelled = false;
    }

    /**
     * Mark the request as cancelled.
     *
     * @private
     */
    Request.prototype.cancel = function() {
        this.cancelled = true;
    };

    /**
     * Duplicates a Request instance.
     *
     * @param {Request} [result] The object onto which to store the result.
     *
     * @returns {Request} The modified result parameter or a new Resource instance if one was not provided.
     */
    Request.prototype.clone = function(result) {
        if (!defined(result)) {
            return new Request(this);
        }

        result.url = this.url;
        result.requestFunction = this.requestFunction;
        result.cancelFunction = this.cancelFunction;
        result.priorityFunction = this.priorityFunction;
        result.priority = this.priority;
        result.throttle = this.throttle;
        result.throttleByServer = this.throttleByServer;
        result.type = this.type;
        result.serverKey = this.serverKey;

        // These get defaulted because the cloned request hasn't been issued
        result.state = this.RequestState.UNISSUED;
        result.deferred = undefined;
        result.cancelled = false;

        return result;
    };

    /**
     * The function that makes the actual data request.
     * @callback Request~RequestCallback
     * @returns {Promise} A promise for the requested data.
     */

    /**
     * The function that is called when the request is cancelled.
     * @callback Request~CancelCallback
     */

    /**
     * The function that is called to update the request's priority, which occurs once per frame.
     * @callback Request~PriorityCallback
     * @returns {Number} The updated priority value.
     */

    module.exports= Request;

},{"./RequestState":26,"./RequestType":27,"./defaultValue":40,"./defined":42}],24:[function(require,module,exports){
var defined=require('./defined');
var parseResponseHeaders=require('./parseResponseHeaders');

    'use strict';

    /**
     * An event that is raised when a request encounters an error.
     *
     * @constructor
     * @alias RequestErrorEvent
     *
     * @param {Number} [statusCode] The HTTP error status code, such as 404.
     * @param {Object} [response] The response included along with the error.
     * @param {String|Object} [responseHeaders] The response headers, represented either as an object literal or as a
     *                        string in the format returned by XMLHttpRequest's getAllResponseHeaders() function.
     */
    function RequestErrorEvent(statusCode, response, responseHeaders) {
        /**
         * The HTTP error status code, such as 404.  If the error does not have a particular
         * HTTP code, this property will be undefined.
         *
         * @type {Number}
         */
        this.statusCode = statusCode;

        /**
         * The response included along with the error.  If the error does not include a response,
         * this property will be undefined.
         *
         * @type {Object}
         */
        this.response = response;

        /**
         * The headers included in the response, represented as an object literal of key/value pairs.
         * If the error does not include any headers, this property will be undefined.
         *
         * @type {Object}
         */
        this.responseHeaders = responseHeaders;

        if (typeof this.responseHeaders === 'string') {
            this.responseHeaders = parseResponseHeaders(this.responseHeaders);
        }
    }

    /**
     * Creates a string representing this RequestErrorEvent.
     * @memberof RequestErrorEvent
     *
     * @returns {String} A string representing the provided RequestErrorEvent.
     */
    RequestErrorEvent.prototype.toString = function() {
        var str = 'Request has failed.';
        if (defined(this.statusCode)) {
            str += ' Status Code: ' + this.statusCode;
        }
        return str;
    };

    module.exports= RequestErrorEvent;

},{"./defined":42,"./parseResponseHeaders":56}],25:[function(require,module,exports){
var Uri=require('./Uri');
var when=require('when');
var Check=require('./Check');
var defaultValue=require('./defaultValue');
var defined=require('./defined');
var defineProperties=require('./defineProperties');
var Event=require('./Event');
var Heap=require('./Heap');
var isBlobUri=require('./isBlobUri');
var isDataUri=require('./isDataUri');
var RequestState=require('./RequestState');

    'use strict';

    function sortRequests(a, b) {
        return a.priority - b.priority;
    }

    var statistics = {
        numberOfAttemptedRequests : 0,
        numberOfActiveRequests : 0,
        numberOfCancelledRequests : 0,
        numberOfCancelledActiveRequests : 0,
        numberOfFailedRequests : 0,
        numberOfActiveRequestsEver : 0
    };

    var priorityHeapLength = 20;
    var requestHeap = new Heap({
        comparator : sortRequests
    });
    requestHeap.maximumLength = priorityHeapLength;
    requestHeap.reserve(priorityHeapLength);

    var activeRequests = [];
    var numberOfActiveRequestsByServer = {};

    var pageUri = typeof document !== 'undefined' ? new Uri(document.location.href) : new Uri();

    var requestCompletedEvent = new Event();

    /**
     * Tracks the number of active requests and prioritizes incoming requests.
     *
     * @exports RequestScheduler
     *
     * @private
     */
    function RequestScheduler() {
    }

    /**
     * The maximum number of simultaneous active requests. Un-throttled requests do not observe this limit.
     * @type {Number}
     * @default 50
     */
    RequestScheduler.maximumRequests = 50;

    /**
     * The maximum number of simultaneous active requests per server. Un-throttled requests or servers specifically
     * listed in requestsByServer do not observe this limit.
     * @type {Number}
     * @default 6
     */
    RequestScheduler.maximumRequestsPerServer = 6;

    /**
     * A per serverKey list of overrides to use for throttling instead of maximumRequestsPerServer
     */
    RequestScheduler.requestsByServer = {
        'api.cesium.com:443': 18,
        'assets.cesium.com:443': 18
    };

    /**
     * Specifies if the request scheduler should throttle incoming requests, or let the browser queue requests under its control.
     * @type {Boolean}
     * @default true
     */
    RequestScheduler.throttleRequests = true;

    /**
     * When true, log statistics to the console every frame
     * @type {Boolean}
     * @default false
     */
    RequestScheduler.debugShowStatistics = false;

    /**
     * An event that's raised when a request is completed.  Event handlers are passed
     * the error object if the request fails.
     *
     * @type {Event}
     * @default Event()
     */
    RequestScheduler.requestCompletedEvent = requestCompletedEvent;

    defineProperties(RequestScheduler, {
        /**
         * Returns the statistics used by the request scheduler.
         *
         * @memberof RequestScheduler
         *
         * @type Object
         * @readonly
         */
        statistics : {
            get : function() {
                return statistics;
            }
        },

        /**
         * The maximum size of the priority heap. This limits the number of requests that are sorted by priority. Only applies to requests that are not yet active.
         *
         * @memberof RequestScheduler
         *
         * @type {Number}
         * @default 20
         */
        priorityHeapLength : {
            get : function() {
                return priorityHeapLength;
            },
            set : function(value) {
                // If the new length shrinks the heap, need to cancel some of the requests.
                // Since this value is not intended to be tweaked regularly it is fine to just cancel the high priority requests.
                if (value < priorityHeapLength) {
                    while (requestHeap.length > value) {
                        var request = requestHeap.pop();
                        cancelRequest(request);
                    }
                }
                priorityHeapLength = value;
                requestHeap.maximumLength = value;
                requestHeap.reserve(value);
            }
        }
    });

    function updatePriority(request) {
        if (defined(request.priorityFunction)) {
            request.priority = request.priorityFunction();
        }
    }

    function serverHasOpenSlots(serverKey) {
        var maxRequests = defaultValue(RequestScheduler.requestsByServer[serverKey], RequestScheduler.maximumRequestsPerServer);
        return numberOfActiveRequestsByServer[serverKey] < maxRequests;
    }

    function issueRequest(request) {
        if (request.state === RequestState.UNISSUED) {
            request.state = RequestState.ISSUED;
            request.deferred = when.defer();
        }
        return request.deferred.promise;
    }

    function getRequestReceivedFunction(request) {
        return function(results) {
            if (request.state === RequestState.CANCELLED) {
                // If the data request comes back but the request is cancelled, ignore it.
                return;
            }
            --statistics.numberOfActiveRequests;
            --numberOfActiveRequestsByServer[request.serverKey];
            requestCompletedEvent.raiseEvent();
            request.state = RequestState.RECEIVED;
            request.deferred.resolve(results);
        };
    }

    function getRequestFailedFunction(request) {
        return function(error) {
            if (request.state === RequestState.CANCELLED) {
                // If the data request comes back but the request is cancelled, ignore it.
                return;
            }
            ++statistics.numberOfFailedRequests;
            --statistics.numberOfActiveRequests;
            --numberOfActiveRequestsByServer[request.serverKey];
            requestCompletedEvent.raiseEvent(error);
            request.state = RequestState.FAILED;
            request.deferred.reject(error);
        };
    }

    function startRequest(request) {
        var promise = issueRequest(request);
        request.state = RequestState.ACTIVE;
        activeRequests.push(request);
        ++statistics.numberOfActiveRequests;
        ++statistics.numberOfActiveRequestsEver;
        ++numberOfActiveRequestsByServer[request.serverKey];
        request.requestFunction().then(getRequestReceivedFunction(request)).otherwise(getRequestFailedFunction(request));
        return promise;
    }

    function cancelRequest(request) {
        var active = request.state === RequestState.ACTIVE;
        request.state = RequestState.CANCELLED;
        ++statistics.numberOfCancelledRequests;
        request.deferred.reject();

        if (active) {
            --statistics.numberOfActiveRequests;
            --numberOfActiveRequestsByServer[request.serverKey];
            ++statistics.numberOfCancelledActiveRequests;
        }

        if (defined(request.cancelFunction)) {
            request.cancelFunction();
        }
    }

    /**
     * Sort requests by priority and start requests.
     */
    RequestScheduler.update = function() {
        var i;
        var request;

        // Loop over all active requests. Cancelled, failed, or received requests are removed from the array to make room for new requests.
        var removeCount = 0;
        var activeLength = activeRequests.length;
        for (i = 0; i < activeLength; ++i) {
            request = activeRequests[i];
            if (request.cancelled) {
                // Request was explicitly cancelled
                cancelRequest(request);
            }
            if (request.state !== RequestState.ACTIVE) {
                // Request is no longer active, remove from array
                ++removeCount;
                continue;
            }
            if (removeCount > 0) {
                // Shift back to fill in vacated slots from completed requests
                activeRequests[i - removeCount] = request;
            }
        }
        activeRequests.length -= removeCount;

        // Update priority of issued requests and resort the heap
        var issuedRequests = requestHeap.internalArray;
        var issuedLength = requestHeap.length;
        for (i = 0; i < issuedLength; ++i) {
            updatePriority(issuedRequests[i]);
        }
        requestHeap.resort();

        // Get the number of open slots and fill with the highest priority requests.
        // Un-throttled requests are automatically added to activeRequests, so activeRequests.length may exceed maximumRequests
        var openSlots = Math.max(RequestScheduler.maximumRequests - activeRequests.length, 0);
        var filledSlots = 0;
        while (filledSlots < openSlots && requestHeap.length > 0) {
            // Loop until all open slots are filled or the heap becomes empty
            request = requestHeap.pop();
            if (request.cancelled) {
                // Request was explicitly cancelled
                cancelRequest(request);
                continue;
            }

            if (request.throttleByServer && !serverHasOpenSlots(request.serverKey)) {
                // Open slots are available, but the request is throttled by its server. Cancel and try again later.
                cancelRequest(request);
                continue;
            }

            startRequest(request);
            ++filledSlots;
        }

        updateStatistics();
    };

    /**
     * Get the server key from a given url.
     *
     * @param {String} url The url.
     * @returns {String} The server key.
     */
    RequestScheduler.getServerKey = function(url) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.string('url', url);
        //>>includeEnd('debug');

        var uri = new Uri(url).resolve(pageUri);
        uri.normalize();
        var serverKey = uri.authority;
        if (!/:/.test(serverKey)) {
            // If the authority does not contain a port number, add port 443 for https or port 80 for http
            serverKey = serverKey + ':' + (uri.scheme === 'https' ? '443' : '80');
        }

        var length = numberOfActiveRequestsByServer[serverKey];
        if (!defined(length)) {
            numberOfActiveRequestsByServer[serverKey] = 0;
        }

        return serverKey;
    };

    /**
     * Issue a request. If request.throttle is false, the request is sent immediately. Otherwise the request will be
     * queued and sorted by priority before being sent.
     *
     * @param {Request} request The request object.
     *
     * @returns {Promise|undefined} A Promise for the requested data, or undefined if this request does not have high enough priority to be issued.
     */
    RequestScheduler.request = function(request) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('request', request);
        Check.typeOf.string('request.url', request.url);
        Check.typeOf.func('request.requestFunction', request.requestFunction);
        //>>includeEnd('debug');

        if (isDataUri(request.url) || isBlobUri(request.url)) {
            requestCompletedEvent.raiseEvent();
            request.state = RequestState.RECEIVED;
            return request.requestFunction();
        }

        ++statistics.numberOfAttemptedRequests;

        if (!defined(request.serverKey)) {
            request.serverKey = RequestScheduler.getServerKey(request.url);
        }

        if (request.throttleByServer && !serverHasOpenSlots(request.serverKey)) {
            // Server is saturated. Try again later.
            return undefined;
        }

        if (!RequestScheduler.throttleRequests || !request.throttle) {
            return startRequest(request);
        }

        if (activeRequests.length >= RequestScheduler.maximumRequests) {
            // Active requests are saturated. Try again later.
            return undefined;
        }

        // Insert into the priority heap and see if a request was bumped off. If this request is the lowest
        // priority it will be returned.
        updatePriority(request);
        var removedRequest = requestHeap.insert(request);

        if (defined(removedRequest)) {
            if (removedRequest === request) {
                // Request does not have high enough priority to be issued
                return undefined;
            }
            // A previously issued request has been bumped off the priority heap, so cancel it
            cancelRequest(removedRequest);
        }

        return issueRequest(request);
    };

    function clearStatistics() {
        statistics.numberOfAttemptedRequests = 0;
        statistics.numberOfCancelledRequests = 0;
        statistics.numberOfCancelledActiveRequests = 0;
    }

    function updateStatistics() {
        if (!RequestScheduler.debugShowStatistics) {
            return;
        }

        if (statistics.numberOfAttemptedRequests > 0) {
            console.log('Number of attempted requests: ' + statistics.numberOfAttemptedRequests);
        }
        if (statistics.numberOfActiveRequests > 0) {
            console.log('Number of active requests: ' + statistics.numberOfActiveRequests);
        }
        if (statistics.numberOfCancelledRequests > 0) {
            console.log('Number of cancelled requests: ' + statistics.numberOfCancelledRequests);
        }
        if (statistics.numberOfCancelledActiveRequests > 0) {
            console.log('Number of cancelled active requests: ' + statistics.numberOfCancelledActiveRequests);
        }
        if (statistics.numberOfFailedRequests > 0) {
            console.log('Number of failed requests: ' + statistics.numberOfFailedRequests);
        }

        clearStatistics();
    }

    /**
     * For testing only. Clears any requests that may not have completed from previous tests.
     *
     * @private
     */
    RequestScheduler.clearForSpecs = function() {
        while (requestHeap.length > 0) {
            var request = requestHeap.pop();
            cancelRequest(request);
        }
        var length = activeRequests.length;
        for (var i = 0; i < length; ++i) {
            cancelRequest(activeRequests[i]);
        }
        activeRequests.length = 0;
        numberOfActiveRequestsByServer = {};

        // Clear stats
        statistics.numberOfAttemptedRequests = 0;
        statistics.numberOfActiveRequests = 0;
        statistics.numberOfCancelledRequests = 0;
        statistics.numberOfCancelledActiveRequests = 0;
        statistics.numberOfFailedRequests = 0;
        statistics.numberOfActiveRequestsEver = 0;
    };

    /**
     * For testing only.
     *
     * @private
     */
    RequestScheduler.numberOfActiveRequestsByServer = function(serverKey) {
        return numberOfActiveRequestsByServer[serverKey];
    };

    /**
     * For testing only.
     *
     * @private
     */
    RequestScheduler.requestHeap = requestHeap;

    module.exports= RequestScheduler;

},{"./Check":11,"./Event":15,"./Heap":20,"./RequestState":26,"./Uri":33,"./defaultValue":40,"./defineProperties":41,"./defined":42,"./isBlobUri":50,"./isDataUri":52,"when":undefined}],26:[function(require,module,exports){
var freezeObject=require('./freezeObject');

    'use strict';

    /**
     * State of the request.
     *
     * @exports RequestState
     */
    var RequestState = {
        /**
         * Initial unissued state.
         *
         * @type Number
         * @constant
         */
        UNISSUED : 0,

        /**
         * Issued but not yet active. Will become active when open slots are available.
         *
         * @type Number
         * @constant
         */
        ISSUED : 1,

        /**
         * Actual http request has been sent.
         *
         * @type Number
         * @constant
         */
        ACTIVE : 2,

        /**
         * Request completed successfully.
         *
         * @type Number
         * @constant
         */
        RECEIVED : 3,

        /**
         * Request was cancelled, either explicitly or automatically because of low priority.
         *
         * @type Number
         * @constant
         */
        CANCELLED : 4,

        /**
         * Request failed.
         *
         * @type Number
         * @constant
         */
        FAILED : 5
    };

    module.exports= freezeObject(RequestState);

},{"./freezeObject":45}],27:[function(require,module,exports){
var freezeObject=require('./freezeObject');

    'use strict';

    /**
     * An enum identifying the type of request. Used for finer grained logging and priority sorting.
     *
     * @exports RequestType
     */
    var RequestType = {
        /**
         * Terrain request.
         *
         * @type Number
         * @constant
         */
        TERRAIN : 0,

        /**
         * Imagery request.
         *
         * @type Number
         * @constant
         */
        IMAGERY : 1,

        /**
         * 3D Tiles request.
         *
         * @type Number
         * @constant
         */
        TILES3D : 2,

        /**
         * Other request.
         *
         * @type Number
         * @constant
         */
        OTHER : 3
    };

    module.exports= freezeObject(RequestType);

},{"./freezeObject":45}],28:[function(require,module,exports){
(function (global,Buffer){
var Uri=require('uri');
var when=require('when');
var appendForwardSlash=require('./appendForwardSlash');
var Check=require('./Check');
var clone=require('./clone');
var combine=require('./combine');
var defaultValue=require('./defaultValue');
var defined=require('./defined');
var defineProperties=require('./defineProperties');
var deprecationWarning=require('./deprecationWarning');
var DeveloperError=require('./DeveloperError');
var freezeObject=require('./freezeObject');
var FeatureDetection=require('./FeatureDetection');
var getAbsoluteUri=require('./getAbsoluteUri');
var getBaseUri=require('./getBaseUri');
var getExtensionFromUri=require('./getExtensionFromUri');
var isBlobUri=require('./isBlobUri');
var isCrossOriginUrl=require('./isCrossOriginUrl');
var isDataUri=require('./isDataUri');
var loadAndExecuteScript=require('./loadAndExecuteScript');
var objectToQuery=require('./objectToQuery');
var queryToObject=require('./queryToObject');
var Request=require('./Request');
var RequestErrorEvent=require('./RequestErrorEvent');
var RequestScheduler=require('./RequestScheduler');
var RequestState=require('./RequestState');
var RuntimeError=require('./RuntimeError');
var TrustedServers=require('./TrustedServers');

    'use strict';

    var xhrBlobSupported = (function() {
        try {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', '#', true);
            xhr.responseType = 'blob';
            return xhr.responseType === 'blob';
        } catch (e) {
            return false;
        }
    })();

    /**
     * Parses a query string and returns the object equivalent.
     *
     * @param {Uri} uri The Uri with a query object.
     * @param {Resource} resource The Resource that will be assigned queryParameters.
     * @param {Boolean} merge If true, we'll merge with the resource's existing queryParameters. Otherwise they will be replaced.
     * @param {Boolean} preserveQueryParameters If true duplicate parameters will be concatenated into an array. If false, keys in uri will take precedence.
     *
     * @private
     */
    function parseQuery(uri, resource, merge, preserveQueryParameters) {
        var queryString = uri.query;
        if (!defined(queryString) || (queryString.length === 0)) {
            return {};
        }

        var query;
        // Special case we run into where the querystring is just a string, not key/value pairs
        if (queryString.indexOf('=') === -1) {
            var result = {};
            result[queryString] = undefined;
            query = result;
        } else {
            query = queryToObject(queryString);
        }

        if (merge) {
            resource._queryParameters = combineQueryParameters(query, resource._queryParameters, preserveQueryParameters);
        } else {
            resource._queryParameters = query;
        }
        uri.query = undefined;
    }

    /**
     * Converts a query object into a string.
     *
     * @param {Uri} uri The Uri object that will have the query object set.
     * @param {Resource} resource The resource that has queryParameters
     *
     * @private
     */
    function stringifyQuery(uri, resource) {
        var queryObject = resource._queryParameters;

        var keys = Object.keys(queryObject);

        // We have 1 key with an undefined value, so this is just a string, not key/value pairs
        if (keys.length === 1 && !defined(queryObject[keys[0]])) {
            uri.query = keys[0];
        } else {
            uri.query = objectToQuery(queryObject);
        }
    }

    /**
     * Clones a value if it is defined, otherwise returns the default value
     *
     * @param {*} [val] The value to clone.
     * @param {*} [defaultVal] The default value.
     *
     * @returns {*} A clone of val or the defaultVal.
     *
     * @private
     */
    function defaultClone(val, defaultVal) {
        if (!defined(val)) {
            return defaultVal;
        }

        return defined(val.clone) ? val.clone() : clone(val);
    }

    /**
     * Checks to make sure the Resource isn't already being requested.
     *
     * @param {Request} request The request to check.
     *
     * @private
     */
    function checkAndResetRequest(request) {
        if (request.state === RequestState.ISSUED || request.state === RequestState.ACTIVE) {
            throw new RuntimeError('The Resource is already being fetched.');
        }

        request.state = RequestState.UNISSUED;
        request.deferred = undefined;
    }

    /**
     * This combines a map of query parameters.
     *
     * @param {Object} q1 The first map of query parameters. Values in this map will take precedence if preserveQueryParameters is false.
     * @param {Object} q2 The second map of query parameters.
     * @param {Boolean} preserveQueryParameters If true duplicate parameters will be concatenated into an array. If false, keys in q1 will take precedence.
     *
     * @returns {Object} The combined map of query parameters.
     *
     * @example
     * var q1 = {
     *   a: 1,
     *   b: 2
     * };
     * var q2 = {
     *   a: 3,
     *   c: 4
     * };
     * var q3 = {
     *   b: [5, 6],
     *   d: 7
     * }
     *
     * // Returns
     * // {
     * //   a: [1, 3],
     * //   b: 2,
     * //   c: 4
     * // };
     * combineQueryParameters(q1, q2, true);
     *
     * // Returns
     * // {
     * //   a: 1,
     * //   b: 2,
     * //   c: 4
     * // };
     * combineQueryParameters(q1, q2, false);
     *
     * // Returns
     * // {
     * //   a: 1,
     * //   b: [2, 5, 6],
     * //   d: 7
     * // };
     * combineQueryParameters(q1, q3, true);
     *
     * // Returns
     * // {
     * //   a: 1,
     * //   b: 2,
     * //   d: 7
     * // };
     * combineQueryParameters(q1, q3, false);
     *
     * @private
     */
    function combineQueryParameters(q1, q2, preserveQueryParameters) {
        if (!preserveQueryParameters) {
            return combine(q1, q2);
        }

        var result = clone(q1, true);
        for (var param in q2) {
            if (q2.hasOwnProperty(param)) {
                var value = result[param];
                var q2Value = q2[param];
                if (defined(value)) {
                    if (!Array.isArray(value)) {
                        value = result[param] = [value];
                    }

                    result[param] = value.concat(q2Value);
                } else {
                    result[param] = Array.isArray(q2Value) ? q2Value.slice() : q2Value;
                }
            }
        }

        return result;
    }

    /**
     * A resource that includes the location and any other parameters we need to retrieve it or create derived resources. It also provides the ability to retry requests.
     *
     * @alias Resource
     * @constructor
     *
     * @param {String|Object} options A url or an object with the following properties
     * @param {String} options.url The url of the resource.
     * @param {Object} [options.queryParameters] An object containing query parameters that will be sent when retrieving the resource.
     * @param {Object} [options.templateValues] Key/Value pairs that are used to replace template values (eg. {x}).
     * @param {Object} [options.headers={}] Additional HTTP headers that will be sent.
     * @param {DefaultProxy} [options.proxy] A proxy to be used when loading the resource.
     * @param {Resource~RetryCallback} [options.retryCallback] The Function to call when a request for this resource fails. If it returns true, the request will be retried.
     * @param {Number} [options.retryAttempts=0] The number of times the retryCallback should be called before giving up.
     * @param {Request} [options.request] A Request object that will be used. Intended for internal use only.
     *
     * @example
     * function refreshTokenRetryCallback(resource, error) {
     *   if (error.statusCode === 403) {
     *     // 403 status code means a new token should be generated
     *     return getNewAccessToken()
     *       .then(function(token) {
     *         resource.queryParameters.access_token = token;
     *         return true;
     *       })
     *       .otherwise(function() {
     *         return false;
     *       });
     *   }
     *
     *   return false;
     * }
     *
     * var resource = new Resource({
     *    url: 'http://server.com/path/to/resource.json',
     *    proxy: new DefaultProxy('/proxy/'),
     *    headers: {
     *      'X-My-Header': 'valueOfHeader'
     *    },
     *    queryParameters: {
     *      'access_token': '123-435-456-000'
     *    },
     *    retryCallback: refreshTokenRetryCallback,
     *    retryAttempts: 1
     * });
     */
    function Resource(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);
        if (typeof options === 'string') {
            options = {
                url: options
            };
        }

        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.string('options.url', options.url);
        //>>includeEnd('debug');

        this._url = undefined;
        this._templateValues = defaultClone(options.templateValues, {});
        this._queryParameters = defaultClone(options.queryParameters, {});

        /**
         * Additional HTTP headers that will be sent with the request.
         *
         * @type {Object}
         */
        this.headers = defaultClone(options.headers, {});

        /**
         * A Request object that will be used. Intended for internal use only.
         *
         * @type {Request}
         */
        this.request = defaultValue(options.request, new Request());

        /**
         * A proxy to be used when loading the resource.
         *
         * @type {DefaultProxy}
         */
        this.proxy = options.proxy;

        /**
         * Function to call when a request for this resource fails. If it returns true or a Promise that resolves to true, the request will be retried.
         *
         * @type {Function}
         */
        this.retryCallback = options.retryCallback;

        /**
         * The number of times the retryCallback should be called before giving up.
         *
         * @type {Number}
         */
        this.retryAttempts = defaultValue(options.retryAttempts, 0);
        this._retryCount = 0;

        var uri = new Uri(options.url);
        parseQuery(uri, this, true, true);

        // Remove the fragment as it's not sent with a request
        uri.fragment = undefined;

        this._url = uri.toString();
    }

    /**
     * A helper function to create a resource depending on whether we have a String or a Resource
     *
     * @param {Resource|String} resource A Resource or a String to use when creating a new Resource.
     *
     * @returns {Resource} If resource is a String, a Resource constructed with the url and options. Otherwise the resource parameter is returned.
     *
     * @private
     */
    Resource.createIfNeeded = function(resource) {
        if (resource instanceof Resource) {
            // Keep existing request object. This function is used internally to duplicate a Resource, so that it can't
            //  be modified outside of a class that holds it (eg. an imagery or terrain provider). Since the Request objects
            //  are managed outside of the providers, by the tile loading code, we want to keep the request property the same so if it is changed
            //  in the underlying tiling code the requests for this resource will use it.
            return  resource.getDerivedResource({
                request: resource.request
            });
        }

        if (typeof resource !== 'string') {
            return resource;
        }

        return new Resource({
            url: resource
        });
    };

    var supportsImageBitmapOptionsPromise;
    /**
     * A helper function to check whether createImageBitmap supports passing ImageBitmapOptions.
     *
     * @returns {Promise<Boolean>} A promise that resolves to true if this browser supports creating an ImageBitmap with options.
     *
     * @private
     */
    Resource.supportsImageBitmapOptions = function() {
        // Until the HTML folks figure out what to do about this, we need to actually try loading an image to
        // know if this browser supports passing options to the createImageBitmap function.
        // https://github.com/whatwg/html/pull/4248
        if (defined(supportsImageBitmapOptionsPromise)) {
            return supportsImageBitmapOptionsPromise;
        }

        if (typeof createImageBitmap !== 'function') {
            supportsImageBitmapOptionsPromise = when.resolve(false);
            return supportsImageBitmapOptionsPromise;
        }

        var imageDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWP4////fwAJ+wP9CNHoHgAAAABJRU5ErkJggg==';

        supportsImageBitmapOptionsPromise = Resource.fetchBlob({
            url : imageDataUri
        })
            .then(function(blob) {
                return createImageBitmap(blob, {
                    imageOrientation: 'flipY'
                });
            })
            .then(function(imageBitmap) {
                return true;
            })
            .otherwise(function() {
                return false;
            });

        return supportsImageBitmapOptionsPromise;
    };

    defineProperties(Resource, {
        /**
         * Returns true if blobs are supported.
         *
         * @memberof Resource
         * @type {Boolean}
         *
         * @readonly
         */
        isBlobSupported : {
            get : function() {
                return xhrBlobSupported;
            }
        }
    });

    defineProperties(Resource.prototype, {
        /**
         * Query parameters appended to the url.
         *
         * @memberof Resource.prototype
         * @type {Object}
         *
         * @readonly
         */
        queryParameters: {
            get: function() {
                return this._queryParameters;
            }
        },

        /**
         * The key/value pairs used to replace template parameters in the url.
         *
         * @memberof Resource.prototype
         * @type {Object}
         *
         * @readonly
         */
        templateValues: {
            get: function() {
                return this._templateValues;
            }
        },

        /**
         * The url to the resource with template values replaced, query string appended and encoded by proxy if one was set.
         *
         * @memberof Resource.prototype
         * @type {String}
         */
        url: {
            get: function() {
                return this.getUrlComponent(true, true);
            },
            set: function(value) {
                var uri = new Uri(value);

                parseQuery(uri, this, false);

                // Remove the fragment as it's not sent with a request
                uri.fragment = undefined;

                this._url = uri.toString();
            }
        },

        /**
         * The file extension of the resource.
         *
         * @memberof Resource.prototype
         * @type {String}
         *
         * @readonly
         */
        extension: {
            get: function() {
                return getExtensionFromUri(this._url);
            }
        },

        /**
         * True if the Resource refers to a data URI.
         *
         * @memberof Resource.prototype
         * @type {Boolean}
         */
        isDataUri: {
            get: function() {
                return isDataUri(this._url);
            }
        },

        /**
         * True if the Resource refers to a blob URI.
         *
         * @memberof Resource.prototype
         * @type {Boolean}
         */
        isBlobUri: {
            get: function() {
                return isBlobUri(this._url);
            }
        },

        /**
         * True if the Resource refers to a cross origin URL.
         *
         * @memberof Resource.prototype
         * @type {Boolean}
         */
        isCrossOriginUrl: {
            get: function() {
                return isCrossOriginUrl(this._url);
            }
        },

        /**
         * True if the Resource has request headers. This is equivalent to checking if the headers property has any keys.
         *
         * @memberof Resource.prototype
         * @type {Boolean}
         */
        hasHeaders: {
            get: function() {
                return (Object.keys(this.headers).length > 0);
            }
        }
    });

    /**
     * Returns the url, optional with the query string and processed by a proxy.
     *
     * @param {Boolean} [query=false] If true, the query string is included.
     * @param {Boolean} [proxy=false] If true, the url is processed the proxy object if defined.
     *
     * @returns {String} The url with all the requested components.
     */
    Resource.prototype.getUrlComponent = function(query, proxy) {
        if(this.isDataUri) {
            return this._url;
        }

        var uri = new Uri(this._url);

        if (query) {
            stringifyQuery(uri, this);
        }

        // objectToQuery escapes the placeholders.  Undo that.
        var url = uri.toString().replace(/%7B/g, '{').replace(/%7D/g, '}');

        var templateValues = this._templateValues;
        url = url.replace(/{(.*?)}/g, function(match, key) {
            var replacement = templateValues[key];
            if (defined(replacement)) {
                // use the replacement value from templateValues if there is one...
                return encodeURIComponent(replacement);
            }
            // otherwise leave it unchanged
            return match;
        });

        if (proxy && defined(this.proxy)) {
            url = this.proxy.getURL(url);
        }
        return url;
    };

    /**
     * Combines the specified object and the existing query parameters. This allows you to add many parameters at once,
     *  as opposed to adding them one at a time to the queryParameters property. If a value is already set, it will be replaced with the new value.
     *
     * @param {Object} params The query parameters
     * @param {Boolean} [useAsDefault=false] If true the params will be used as the default values, so they will only be set if they are undefined.
     */
    Resource.prototype.setQueryParameters = function(params, useAsDefault) {
        if (useAsDefault) {
            this._queryParameters = combineQueryParameters(this._queryParameters, params, false);
        } else {
            this._queryParameters = combineQueryParameters(params, this._queryParameters, false);
        }
    };

    /**
     * Combines the specified object and the existing query parameters. This allows you to add many parameters at once,
     *  as opposed to adding them one at a time to the queryParameters property.
     *
     * @param {Object} params The query parameters
     */
    Resource.prototype.appendQueryParameters = function(params) {
        this._queryParameters = combineQueryParameters(params, this._queryParameters, true);
    };

    /**
     * Combines the specified object and the existing template values. This allows you to add many values at once,
     *  as opposed to adding them one at a time to the templateValues property. If a value is already set, it will become an array and the new value will be appended.
     *
     * @param {Object} template The template values
     * @param {Boolean} [useAsDefault=false] If true the values will be used as the default values, so they will only be set if they are undefined.
     */
    Resource.prototype.setTemplateValues = function(template, useAsDefault) {
        if (useAsDefault) {
            this._templateValues = combine(this._templateValues, template);
        } else {
            this._templateValues = combine(template, this._templateValues);
        }
    };

    /**
     * Returns a resource relative to the current instance. All properties remain the same as the current instance unless overridden in options.
     *
     * @param {Object} options An object with the following properties
     * @param {String} [options.url]  The url that will be resolved relative to the url of the current instance.
     * @param {Object} [options.queryParameters] An object containing query parameters that will be combined with those of the current instance.
     * @param {Object} [options.templateValues] Key/Value pairs that are used to replace template values (eg. {x}). These will be combined with those of the current instance.
     * @param {Object} [options.headers={}] Additional HTTP headers that will be sent.
     * @param {DefaultProxy} [options.proxy] A proxy to be used when loading the resource.
     * @param {Resource~RetryCallback} [options.retryCallback] The function to call when loading the resource fails.
     * @param {Number} [options.retryAttempts] The number of times the retryCallback should be called before giving up.
     * @param {Request} [options.request] A Request object that will be used. Intended for internal use only.
     * @param {Boolean} [options.preserveQueryParameters=false] If true, this will keep all query parameters from the current resource and derived resource. If false, derived parameters will replace those of the current resource.
     *
     * @returns {Resource} The resource derived from the current one.
     */
    Resource.prototype.getDerivedResource = function(options) {
        var resource = this.clone();
        resource._retryCount = 0;

        if (defined(options.url)) {
            var uri = new Uri(options.url);

            var preserveQueryParameters = defaultValue(options.preserveQueryParameters, false);
            parseQuery(uri, resource, true, preserveQueryParameters);

            // Remove the fragment as it's not sent with a request
            uri.fragment = undefined;

            resource._url = uri.resolve(new Uri(getAbsoluteUri(this._url))).toString();
        }

        if (defined(options.queryParameters)) {
            resource._queryParameters = combine(options.queryParameters, resource._queryParameters);
        }
        if (defined(options.templateValues)) {
            resource._templateValues = combine(options.templateValues, resource.templateValues);
        }
        if (defined(options.headers)) {
            resource.headers = combine(options.headers, resource.headers);
        }
        if (defined(options.proxy)) {
            resource.proxy = options.proxy;
        }
        if (defined(options.request)) {
            resource.request = options.request;
        }
        if (defined(options.retryCallback)) {
            resource.retryCallback = options.retryCallback;
        }
        if (defined(options.retryAttempts)) {
            resource.retryAttempts = options.retryAttempts;
        }

        return resource;
    };

    /**
     * Called when a resource fails to load. This will call the retryCallback function if defined until retryAttempts is reached.
     *
     * @param {Error} [error] The error that was encountered.
     *
     * @returns {Promise<Boolean>} A promise to a boolean, that if true will cause the resource request to be retried.
     *
     * @private
     */
    Resource.prototype.retryOnError = function(error) {
        var retryCallback = this.retryCallback;
        if ((typeof retryCallback !== 'function') || (this._retryCount >= this.retryAttempts)) {
            return when(false);
        }

        var that = this;
        return when(retryCallback(this, error))
            .then(function(result) {
                ++that._retryCount;

                return result;
            });
    };

    /**
     * Duplicates a Resource instance.
     *
     * @param {Resource} [result] The object onto which to store the result.
     *
     * @returns {Resource} The modified result parameter or a new Resource instance if one was not provided.
     */
    Resource.prototype.clone = function(result) {
        if (!defined(result)) {
            result = new Resource({
                url : this._url
            });
        }

        result._url = this._url;
        result._queryParameters = clone(this._queryParameters);
        result._templateValues = clone(this._templateValues);
        result.headers = clone(this.headers);
        result.proxy = this.proxy;
        result.retryCallback = this.retryCallback;
        result.retryAttempts = this.retryAttempts;
        result._retryCount = 0;
        result.request = this.request.clone();

        return result;
    };

    /**
     * Returns the base path of the Resource.
     *
     * @param {Boolean} [includeQuery = false] Whether or not to include the query string and fragment form the uri
     *
     * @returns {String} The base URI of the resource
     */
    Resource.prototype.getBaseUri = function(includeQuery) {
        return getBaseUri(this.getUrlComponent(includeQuery), includeQuery);
    };

    /**
     * Appends a forward slash to the URL.
     */
    Resource.prototype.appendForwardSlash = function() {
        this._url = appendForwardSlash(this._url);
    };

    /**
     * Asynchronously loads the resource as raw binary data.  Returns a promise that will resolve to
     * an ArrayBuffer once loaded, or reject if the resource failed to load.  The data is loaded
     * using XMLHttpRequest, which means that in order to make requests to another origin,
     * the server must have Cross-Origin Resource Sharing (CORS) headers enabled.
     *
     * @returns {Promise.<ArrayBuffer>|undefined} a promise that will resolve to the requested data when loaded. Returns undefined if <code>request.throttle</code> is true and the request does not have high enough priority.
     *
     * @example
     * // load a single URL asynchronously
     * resource.fetchArrayBuffer().then(function(arrayBuffer) {
     *     // use the data
     * }).otherwise(function(error) {
     *     // an error occurred
     * });
     *
     * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
     * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
     */
    Resource.prototype.fetchArrayBuffer = function () {
        return this.fetch({
            responseType : 'arraybuffer'
        });
    };

    /**
     * Creates a Resource and calls fetchArrayBuffer() on it.
     *
     * @param {String|Object} options A url or an object with the following properties
     * @param {String} options.url The url of the resource.
     * @param {Object} [options.queryParameters] An object containing query parameters that will be sent when retrieving the resource.
     * @param {Object} [options.templateValues] Key/Value pairs that are used to replace template values (eg. {x}).
     * @param {Object} [options.headers={}] Additional HTTP headers that will be sent.
     * @param {DefaultProxy} [options.proxy] A proxy to be used when loading the resource.
     * @param {Resource~RetryCallback} [options.retryCallback] The Function to call when a request for this resource fails. If it returns true, the request will be retried.
     * @param {Number} [options.retryAttempts=0] The number of times the retryCallback should be called before giving up.
     * @param {Request} [options.request] A Request object that will be used. Intended for internal use only.
     * @returns {Promise.<ArrayBuffer>|undefined} a promise that will resolve to the requested data when loaded. Returns undefined if <code>request.throttle</code> is true and the request does not have high enough priority.
     */
    Resource.fetchArrayBuffer = function (options) {
        var resource = new Resource(options);
        return resource.fetchArrayBuffer();
    };

    /**
     * Asynchronously loads the given resource as a blob.  Returns a promise that will resolve to
     * a Blob once loaded, or reject if the resource failed to load.  The data is loaded
     * using XMLHttpRequest, which means that in order to make requests to another origin,
     * the server must have Cross-Origin Resource Sharing (CORS) headers enabled.
     *
     * @returns {Promise.<Blob>|undefined} a promise that will resolve to the requested data when loaded. Returns undefined if <code>request.throttle</code> is true and the request does not have high enough priority.
     *
     * @example
     * // load a single URL asynchronously
     * resource.fetchBlob().then(function(blob) {
     *     // use the data
     * }).otherwise(function(error) {
     *     // an error occurred
     * });
     *
     * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
     * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
     */
    Resource.prototype.fetchBlob = function () {
        return this.fetch({
            responseType : 'blob'
        });
    };

    /**
     * Creates a Resource and calls fetchBlob() on it.
     *
     * @param {String|Object} options A url or an object with the following properties
     * @param {String} options.url The url of the resource.
     * @param {Object} [options.queryParameters] An object containing query parameters that will be sent when retrieving the resource.
     * @param {Object} [options.templateValues] Key/Value pairs that are used to replace template values (eg. {x}).
     * @param {Object} [options.headers={}] Additional HTTP headers that will be sent.
     * @param {DefaultProxy} [options.proxy] A proxy to be used when loading the resource.
     * @param {Resource~RetryCallback} [options.retryCallback] The Function to call when a request for this resource fails. If it returns true, the request will be retried.
     * @param {Number} [options.retryAttempts=0] The number of times the retryCallback should be called before giving up.
     * @param {Request} [options.request] A Request object that will be used. Intended for internal use only.
     * @returns {Promise.<Blob>|undefined} a promise that will resolve to the requested data when loaded. Returns undefined if <code>request.throttle</code> is true and the request does not have high enough priority.
     */
    Resource.fetchBlob = function (options) {
        var resource = new Resource(options);
        return resource.fetchBlob();
    };

    /**
     * Asynchronously loads the given image resource.  Returns a promise that will resolve to
     * an {@link https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap|ImageBitmap} if <code>preferImageBitmap</code> is true and the browser supports <code>createImageBitmap</code> or otherwise an
     * {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement|Image} once loaded, or reject if the image failed to load.
     *
     * @param {Object} [options] An object with the following properties.
     * @param {Boolean} [options.preferBlob=false] If true, we will load the image via a blob.
     * @param {Boolean} [options.preferImageBitmap=false] If true, image will be decoded during fetch and an <code>ImageBitmap</code> is returned.
     * @param {Boolean} [options.flipY=false] If true, image will be vertically flipped during decode. Only applies if the browser supports <code>createImageBitmap</code>.
     * @returns {Promise.<ImageBitmap>|Promise.<Image>|undefined} a promise that will resolve to the requested data when loaded. Returns undefined if <code>request.throttle</code> is true and the request does not have high enough priority.
     *
     *
     * @example
     * // load a single image asynchronously
     * resource.fetchImage().then(function(image) {
     *     // use the loaded image
     * }).otherwise(function(error) {
     *     // an error occurred
     * });
     *
     * // load several images in parallel
     * when.all([resource1.fetchImage(), resource2.fetchImage()]).then(function(images) {
     *     // images is an array containing all the loaded images
     * });
     *
     * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
     * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
     */
    Resource.prototype.fetchImage = function (options) {
        if (typeof options === 'boolean') {
            deprecationWarning('fetchImage-parameter-change', 'fetchImage now takes an options object in CesiumJS 1.57. Use resource.fetchImage({ preferBlob: true }) instead of resource.fetchImage(true).');
            options = {
                preferBlob : options
            };
        }
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);
        var preferImageBitmap = defaultValue(options.preferImageBitmap, false);
        var preferBlob = defaultValue(options.preferBlob, false);
        var flipY = defaultValue(options.flipY, false);

        checkAndResetRequest(this.request);

        // We try to load the image normally if
        // 1. Blobs aren't supported
        // 2. It's a data URI
        // 3. It's a blob URI
        // 4. It doesn't have request headers and we preferBlob is false
        if (!xhrBlobSupported || this.isDataUri || this.isBlobUri || (!this.hasHeaders && !preferBlob)) {
            return fetchImage({
                resource: this,
                flipY: flipY,
                preferImageBitmap: preferImageBitmap
            });
        }

        var blobPromise = this.fetchBlob();
        if (!defined(blobPromise)) {
            return;
        }

        var supportsImageBitmap;
        var useImageBitmap;
        var generatedBlobResource;
        var generatedBlob;
        return Resource.supportsImageBitmapOptions()
            .then(function(result) {
                supportsImageBitmap = result;
                useImageBitmap = supportsImageBitmap && preferImageBitmap;
                return blobPromise;
            })
            .then(function(blob) {
                if (!defined(blob)) {
                    return;
                }
                generatedBlob = blob;
                if (useImageBitmap) {
                    return Resource._Implementations.createImageBitmapFromBlob(blob, flipY);
                }
                var blobUrl = window.URL.createObjectURL(blob);
                generatedBlobResource = new Resource({
                    url: blobUrl
                });

                return fetchImage({
                    resource: generatedBlobResource,
                    flipY: flipY,
                    preferImageBitmap: false
                });
            })
            .then(function(image) {
                if (!defined(image)) {
                    return;
                }
                // This is because the blob object is needed for DiscardMissingTileImagePolicy
                // See https://github.com/AnalyticalGraphicsInc/cesium/issues/1353
                image.blob = generatedBlob;
                if (useImageBitmap) {
                    return image;
                }

                window.URL.revokeObjectURL(generatedBlobResource.url);
                return image;
            })
            .otherwise(function(error) {
                if (defined(generatedBlobResource)) {
                    window.URL.revokeObjectURL(generatedBlobResource.url);
                }

                return when.reject(error);
            });
    };

    /**
     * Fetches an image and returns a promise to it.
     *
     * @param {Object} [options] An object with the following properties.
     * @param {Resource} [options.resource] Resource object that points to an image to fetch.
     * @param {Boolean} [options.preferImageBitmap] If true, image will be decoded during fetch and an <code>ImageBitmap</code> is returned.
     * @param {Boolean} [options.flipY] If true, image will be vertically flipped during decode. Only applies if the browser supports <code>createImageBitmap</code>.
     *
     * @private
     */
    function fetchImage(options) {
        var resource = options.resource;
        var flipY = options.flipY;
        var preferImageBitmap = options.preferImageBitmap;

        var request = resource.request;
        request.url = resource.url;
        request.requestFunction = function() {
            var url = resource.url;
            var crossOrigin = false;

            // data URIs can't have crossorigin set.
            if (!resource.isDataUri && !resource.isBlobUri) {
                crossOrigin = resource.isCrossOriginUrl;
            }

            var deferred = when.defer();

            Resource._Implementations.createImage(url, crossOrigin, deferred, flipY, preferImageBitmap);

            return deferred.promise;
        };

        var promise = RequestScheduler.request(request);
        if (!defined(promise)) {
            return;
        }

        return promise
            .otherwise(function(e) {
                // Don't retry cancelled or otherwise aborted requests
                if (request.state !== RequestState.FAILED) {
                    return when.reject(e);
                }

                return resource.retryOnError(e)
                    .then(function(retry) {
                        if (retry) {
                            // Reset request so it can try again
                            request.state = RequestState.UNISSUED;
                            request.deferred = undefined;

                            return fetchImage({
                                resource: resource,
                                flipY: flipY,
                                preferImageBitmap: preferImageBitmap
                            });
                        }

                        return when.reject(e);
                    });
            });
    }

    /**
     * Creates a Resource and calls fetchImage() on it.
     *
     * @param {String|Object} options A url or an object with the following properties
     * @param {String} options.url The url of the resource.
     * @param {Object} [options.queryParameters] An object containing query parameters that will be sent when retrieving the resource.
     * @param {Object} [options.templateValues] Key/Value pairs that are used to replace template values (eg. {x}).
     * @param {Object} [options.headers={}] Additional HTTP headers that will be sent.
     * @param {DefaultProxy} [options.proxy] A proxy to be used when loading the resource.
     * @param {Boolean} [options.flipY=false] Whether to vertically flip the image during fetch and decode. Only applies when requesting an image and the browser supports <code>createImageBitmap</code>.
     * @param {Resource~RetryCallback} [options.retryCallback] The Function to call when a request for this resource fails. If it returns true, the request will be retried.
     * @param {Number} [options.retryAttempts=0] The number of times the retryCallback should be called before giving up.
     * @param {Request} [options.request] A Request object that will be used. Intended for internal use only.
     * @param {Boolean} [options.preferBlob=false]  If true, we will load the image via a blob.
     * @param {Boolean} [options.preferImageBitmap=false] If true, image will be decoded during fetch and an <code>ImageBitmap</code> is returned.
     * @returns {Promise.<ImageBitmap>|Promise.<Image>|undefined} a promise that will resolve to the requested data when loaded. Returns undefined if <code>request.throttle</code> is true and the request does not have high enough priority.
     */
    Resource.fetchImage = function (options) {
        var resource = new Resource(options);
        return resource.fetchImage({
            flipY: options.flipY,
            preferBlob: options.preferBlob,
            preferImageBitmap: options.preferImageBitmap
        });
    };

    /**
     * Asynchronously loads the given resource as text.  Returns a promise that will resolve to
     * a String once loaded, or reject if the resource failed to load.  The data is loaded
     * using XMLHttpRequest, which means that in order to make requests to another origin,
     * the server must have Cross-Origin Resource Sharing (CORS) headers enabled.
     *
     * @returns {Promise.<String>|undefined} a promise that will resolve to the requested data when loaded. Returns undefined if <code>request.throttle</code> is true and the request does not have high enough priority.
     *
     * @example
     * // load text from a URL, setting a custom header
     * var resource = new Resource({
     *   url: 'http://someUrl.com/someJson.txt',
     *   headers: {
     *     'X-Custom-Header' : 'some value'
     *   }
     * });
     * resource.fetchText().then(function(text) {
     *     // Do something with the text
     * }).otherwise(function(error) {
     *     // an error occurred
     * });
     *
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest|XMLHttpRequest}
     * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
     * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
     */
    Resource.prototype.fetchText = function() {
        return this.fetch({
            responseType : 'text'
        });
    };

    /**
     * Creates a Resource and calls fetchText() on it.
     *
     * @param {String|Object} options A url or an object with the following properties
     * @param {String} options.url The url of the resource.
     * @param {Object} [options.queryParameters] An object containing query parameters that will be sent when retrieving the resource.
     * @param {Object} [options.templateValues] Key/Value pairs that are used to replace template values (eg. {x}).
     * @param {Object} [options.headers={}] Additional HTTP headers that will be sent.
     * @param {DefaultProxy} [options.proxy] A proxy to be used when loading the resource.
     * @param {Resource~RetryCallback} [options.retryCallback] The Function to call when a request for this resource fails. If it returns true, the request will be retried.
     * @param {Number} [options.retryAttempts=0] The number of times the retryCallback should be called before giving up.
     * @param {Request} [options.request] A Request object that will be used. Intended for internal use only.
     * @returns {Promise.<String>|undefined} a promise that will resolve to the requested data when loaded. Returns undefined if <code>request.throttle</code> is true and the request does not have high enough priority.
     */
    Resource.fetchText = function (options) {
        var resource = new Resource(options);
        return resource.fetchText();
    };

    // note: &#42;&#47;&#42; below is */* but that ends the comment block early
    /**
     * Asynchronously loads the given resource as JSON.  Returns a promise that will resolve to
     * a JSON object once loaded, or reject if the resource failed to load.  The data is loaded
     * using XMLHttpRequest, which means that in order to make requests to another origin,
     * the server must have Cross-Origin Resource Sharing (CORS) headers enabled. This function
     * adds 'Accept: application/json,&#42;&#47;&#42;;q=0.01' to the request headers, if not
     * already specified.
     *
     * @returns {Promise.<Object>|undefined} a promise that will resolve to the requested data when loaded. Returns undefined if <code>request.throttle</code> is true and the request does not have high enough priority.
     *
     *
     * @example
     * resource.fetchJson().then(function(jsonData) {
     *     // Do something with the JSON object
     * }).otherwise(function(error) {
     *     // an error occurred
     * });
     *
     * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
     * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
     */
    Resource.prototype.fetchJson = function() {
        var promise = this.fetch({
            responseType : 'text',
            headers: {
                Accept : 'application/json,*/*;q=0.01'
            }
        });

        if (!defined(promise)) {
            return undefined;
        }

        return promise
            .then(function(value) {
                if (!defined(value)) {
                    return;
                }
                return JSON.parse(value);
            });
    };

    /**
     * Creates a Resource and calls fetchJson() on it.
     *
     * @param {String|Object} options A url or an object with the following properties
     * @param {String} options.url The url of the resource.
     * @param {Object} [options.queryParameters] An object containing query parameters that will be sent when retrieving the resource.
     * @param {Object} [options.templateValues] Key/Value pairs that are used to replace template values (eg. {x}).
     * @param {Object} [options.headers={}] Additional HTTP headers that will be sent.
     * @param {DefaultProxy} [options.proxy] A proxy to be used when loading the resource.
     * @param {Resource~RetryCallback} [options.retryCallback] The Function to call when a request for this resource fails. If it returns true, the request will be retried.
     * @param {Number} [options.retryAttempts=0] The number of times the retryCallback should be called before giving up.
     * @param {Request} [options.request] A Request object that will be used. Intended for internal use only.
     * @returns {Promise.<Object>|undefined} a promise that will resolve to the requested data when loaded. Returns undefined if <code>request.throttle</code> is true and the request does not have high enough priority.
     */
    Resource.fetchJson = function (options) {
        var resource = new Resource(options);
        return resource.fetchJson();
    };

    /**
     * Asynchronously loads the given resource as XML.  Returns a promise that will resolve to
     * an XML Document once loaded, or reject if the resource failed to load.  The data is loaded
     * using XMLHttpRequest, which means that in order to make requests to another origin,
     * the server must have Cross-Origin Resource Sharing (CORS) headers enabled.
     *
     * @returns {Promise.<XMLDocument>|undefined} a promise that will resolve to the requested data when loaded. Returns undefined if <code>request.throttle</code> is true and the request does not have high enough priority.
     *
     *
     * @example
     * // load XML from a URL, setting a custom header
     * Cesium.loadXML('http://someUrl.com/someXML.xml', {
     *   'X-Custom-Header' : 'some value'
     * }).then(function(document) {
     *     // Do something with the document
     * }).otherwise(function(error) {
     *     // an error occurred
     * });
     *
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest|XMLHttpRequest}
     * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
     * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
     */
    Resource.prototype.fetchXML = function() {
        return this.fetch({
            responseType : 'document',
            overrideMimeType : 'text/xml'
        });
    };

    /**
     * Creates a Resource and calls fetchXML() on it.
     *
     * @param {String|Object} options A url or an object with the following properties
     * @param {String} options.url The url of the resource.
     * @param {Object} [options.queryParameters] An object containing query parameters that will be sent when retrieving the resource.
     * @param {Object} [options.templateValues] Key/Value pairs that are used to replace template values (eg. {x}).
     * @param {Object} [options.headers={}] Additional HTTP headers that will be sent.
     * @param {DefaultProxy} [options.proxy] A proxy to be used when loading the resource.
     * @param {Resource~RetryCallback} [options.retryCallback] The Function to call when a request for this resource fails. If it returns true, the request will be retried.
     * @param {Number} [options.retryAttempts=0] The number of times the retryCallback should be called before giving up.
     * @param {Request} [options.request] A Request object that will be used. Intended for internal use only.
     * @returns {Promise.<XMLDocument>|undefined} a promise that will resolve to the requested data when loaded. Returns undefined if <code>request.throttle</code> is true and the request does not have high enough priority.
     */
    Resource.fetchXML = function (options) {
        var resource = new Resource(options);
        return resource.fetchXML();
    };

    /**
     * Requests a resource using JSONP.
     *
     * @param {String} [callbackParameterName='callback'] The callback parameter name that the server expects.
     * @returns {Promise.<Object>|undefined} a promise that will resolve to the requested data when loaded. Returns undefined if <code>request.throttle</code> is true and the request does not have high enough priority.
     *
     *
     * @example
     * // load a data asynchronously
     * resource.fetchJsonp().then(function(data) {
     *     // use the loaded data
     * }).otherwise(function(error) {
     *     // an error occurred
     * });
     *
     * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
     */
    Resource.prototype.fetchJsonp = function(callbackParameterName) {
        callbackParameterName = defaultValue(callbackParameterName, 'callback');

        checkAndResetRequest(this.request);

        //generate a unique function name
        var functionName;
        do {
            functionName = 'loadJsonp' + Math.random().toString().substring(2, 8);
        } while (defined(window[functionName]));

        return fetchJsonp(this, callbackParameterName, functionName);
    };

    function fetchJsonp(resource, callbackParameterName, functionName) {
        var callbackQuery = {};
        callbackQuery[callbackParameterName] = functionName;
        resource.setQueryParameters(callbackQuery);

        var request = resource.request;
        request.url = resource.url;
        request.requestFunction = function() {
            var deferred = when.defer();

            //assign a function with that name in the global scope
            window[functionName] = function(data) {
                deferred.resolve(data);

                try {
                    delete window[functionName];
                } catch (e) {
                    window[functionName] = undefined;
                }
            };

            Resource._Implementations.loadAndExecuteScript(resource.url, functionName, deferred);
            return deferred.promise;
        };

        var promise = RequestScheduler.request(request);
        if (!defined(promise)) {
            return;
        }

        return promise
            .otherwise(function(e) {
                if (request.state !== RequestState.FAILED) {
                    return when.reject(e);
                }

                return resource.retryOnError(e)
                    .then(function(retry) {
                        if (retry) {
                            // Reset request so it can try again
                            request.state = RequestState.UNISSUED;
                            request.deferred = undefined;

                            return fetchJsonp(resource, callbackParameterName, functionName);
                        }

                        return when.reject(e);
                    });
            });
    }

    /**
     * Creates a Resource from a URL and calls fetchJsonp() on it.
     *
     * @param {String|Object} options A url or an object with the following properties
     * @param {String} options.url The url of the resource.
     * @param {Object} [options.queryParameters] An object containing query parameters that will be sent when retrieving the resource.
     * @param {Object} [options.templateValues] Key/Value pairs that are used to replace template values (eg. {x}).
     * @param {Object} [options.headers={}] Additional HTTP headers that will be sent.
     * @param {DefaultProxy} [options.proxy] A proxy to be used when loading the resource.
     * @param {Resource~RetryCallback} [options.retryCallback] The Function to call when a request for this resource fails. If it returns true, the request will be retried.
     * @param {Number} [options.retryAttempts=0] The number of times the retryCallback should be called before giving up.
     * @param {Request} [options.request] A Request object that will be used. Intended for internal use only.
     * @param {String} [options.callbackParameterName='callback'] The callback parameter name that the server expects.
     * @returns {Promise.<Object>|undefined} a promise that will resolve to the requested data when loaded. Returns undefined if <code>request.throttle</code> is true and the request does not have high enough priority.
     */
    Resource.fetchJsonp = function (options) {
        var resource = new Resource(options);
        return resource.fetchJsonp(options.callbackParameterName);
    };

    /**
     * @private
     */
    Resource.prototype._makeRequest = function(options) {
        var resource = this;
        checkAndResetRequest(resource.request);

        var request = resource.request;
        request.url = resource.url;

        request.requestFunction = function() {
            var responseType = options.responseType;
            var headers = combine(options.headers, resource.headers);
            var overrideMimeType = options.overrideMimeType;
            var method = options.method;
            var data = options.data;
            var deferred = when.defer();
            var xhr = Resource._Implementations.loadWithXhr(resource.url, responseType, method, data, headers, deferred, overrideMimeType);
            if (defined(xhr) && defined(xhr.abort)) {
                request.cancelFunction = function() {
                    xhr.abort();
                };
            }
            return deferred.promise;
        };

        var promise = RequestScheduler.request(request);
        if (!defined(promise)) {
            return;
        }

        return promise
            .then(function(data) {
                return data;
            })
            .otherwise(function(e) {
                if (request.state !== RequestState.FAILED) {
                    return when.reject(e);
                }

                return resource.retryOnError(e)
                    .then(function(retry) {
                        if (retry) {
                            // Reset request so it can try again
                            request.state = RequestState.UNISSUED;
                            request.deferred = undefined;

                            return resource.fetch(options);
                        }

                        return when.reject(e);
                    });
            });
    };

    var dataUriRegex = /^data:(.*?)(;base64)?,(.*)$/;

    function decodeDataUriText(isBase64, data) {
        var result = decodeURIComponent(data);
        if (isBase64) {
            return atob(result);
        }
        return result;
    }

    function decodeDataUriArrayBuffer(isBase64, data) {
        var byteString = decodeDataUriText(isBase64, data);
        var buffer = new ArrayBuffer(byteString.length);
        var view = new Uint8Array(buffer);
        for (var i = 0; i < byteString.length; i++) {
            view[i] = byteString.charCodeAt(i);
        }
        return buffer;
    }

    function decodeDataUri(dataUriRegexResult, responseType) {
        responseType = defaultValue(responseType, '');
        var mimeType = dataUriRegexResult[1];
        var isBase64 = !!dataUriRegexResult[2];
        var data = dataUriRegexResult[3];

        switch (responseType) {
            case '':
            case 'text':
                return decodeDataUriText(isBase64, data);
            case 'arraybuffer':
                return decodeDataUriArrayBuffer(isBase64, data);
            case 'blob':
                var buffer = decodeDataUriArrayBuffer(isBase64, data);
                return new Blob([buffer], {
                    type : mimeType
                });
            case 'document':
                var parser = new DOMParser();
                return parser.parseFromString(decodeDataUriText(isBase64, data), mimeType);
            case 'json':
                return JSON.parse(decodeDataUriText(isBase64, data));
            default:
                //>>includeStart('debug', pragmas.debug);
                throw new DeveloperError('Unhandled responseType: ' + responseType);
            //>>includeEnd('debug');
        }
    }

    /**
     * Asynchronously loads the given resource.  Returns a promise that will resolve to
     * the result once loaded, or reject if the resource failed to load.  The data is loaded
     * using XMLHttpRequest, which means that in order to make requests to another origin,
     * the server must have Cross-Origin Resource Sharing (CORS) headers enabled. It's recommended that you use
     * the more specific functions eg. fetchJson, fetchBlob, etc.
     *
     * @param {Object} [options] Object with the following properties:
     * @param {String} [options.responseType] The type of response.  This controls the type of item returned.
     * @param {Object} [options.headers] Additional HTTP headers to send with the request, if any.
     * @param {String} [options.overrideMimeType] Overrides the MIME type returned by the server.
     * @returns {Promise.<Object>|undefined} a promise that will resolve to the requested data when loaded. Returns undefined if <code>request.throttle</code> is true and the request does not have high enough priority.
     *
     *
     * @example
     * resource.fetch()
     *   .then(function(body) {
     *       // use the data
     *   }).otherwise(function(error) {
     *       // an error occurred
     *   });
     *
     * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
     * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
     */
    Resource.prototype.fetch = function(options) {
        options = defaultClone(options, {});
        options.method = 'GET';

        return this._makeRequest(options);
    };

    /**
     * Creates a Resource from a URL and calls fetch() on it.
     *
     * @param {String|Object} options A url or an object with the following properties
     * @param {String} options.url The url of the resource.
     * @param {Object} [options.queryParameters] An object containing query parameters that will be sent when retrieving the resource.
     * @param {Object} [options.templateValues] Key/Value pairs that are used to replace template values (eg. {x}).
     * @param {Object} [options.headers={}] Additional HTTP headers that will be sent.
     * @param {DefaultProxy} [options.proxy] A proxy to be used when loading the resource.
     * @param {Resource~RetryCallback} [options.retryCallback] The Function to call when a request for this resource fails. If it returns true, the request will be retried.
     * @param {Number} [options.retryAttempts=0] The number of times the retryCallback should be called before giving up.
     * @param {Request} [options.request] A Request object that will be used. Intended for internal use only.
     * @param {String} [options.responseType] The type of response.  This controls the type of item returned.
     * @param {String} [options.overrideMimeType] Overrides the MIME type returned by the server.
     * @returns {Promise.<Object>|undefined} a promise that will resolve to the requested data when loaded. Returns undefined if <code>request.throttle</code> is true and the request does not have high enough priority.
     */
    Resource.fetch = function (options) {
        var resource = new Resource(options);
        return resource.fetch({
            // Make copy of just the needed fields because headers can be passed to both the constructor and to fetch
            responseType: options.responseType,
            overrideMimeType: options.overrideMimeType
        });
    };

    /**
     * Asynchronously deletes the given resource.  Returns a promise that will resolve to
     * the result once loaded, or reject if the resource failed to load.  The data is loaded
     * using XMLHttpRequest, which means that in order to make requests to another origin,
     * the server must have Cross-Origin Resource Sharing (CORS) headers enabled.
     *
     * @param {Object} [options] Object with the following properties:
     * @param {String} [options.responseType] The type of response.  This controls the type of item returned.
     * @param {Object} [options.headers] Additional HTTP headers to send with the request, if any.
     * @param {String} [options.overrideMimeType] Overrides the MIME type returned by the server.
     * @returns {Promise.<Object>|undefined} a promise that will resolve to the requested data when loaded. Returns undefined if <code>request.throttle</code> is true and the request does not have high enough priority.
     *
     *
     * @example
     * resource.delete()
     *   .then(function(body) {
     *       // use the data
     *   }).otherwise(function(error) {
     *       // an error occurred
     *   });
     *
     * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
     * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
     */
    Resource.prototype.delete = function(options) {
        options = defaultClone(options, {});
        options.method = 'DELETE';

        return this._makeRequest(options);
    };

    /**
     * Creates a Resource from a URL and calls delete() on it.
     *
     * @param {String|Object} options A url or an object with the following properties
     * @param {String} options.url The url of the resource.
     * @param {Object} [options.data] Data that is posted with the resource.
     * @param {Object} [options.queryParameters] An object containing query parameters that will be sent when retrieving the resource.
     * @param {Object} [options.templateValues] Key/Value pairs that are used to replace template values (eg. {x}).
     * @param {Object} [options.headers={}] Additional HTTP headers that will be sent.
     * @param {DefaultProxy} [options.proxy] A proxy to be used when loading the resource.
     * @param {Resource~RetryCallback} [options.retryCallback] The Function to call when a request for this resource fails. If it returns true, the request will be retried.
     * @param {Number} [options.retryAttempts=0] The number of times the retryCallback should be called before giving up.
     * @param {Request} [options.request] A Request object that will be used. Intended for internal use only.
     * @param {String} [options.responseType] The type of response.  This controls the type of item returned.
     * @param {String} [options.overrideMimeType] Overrides the MIME type returned by the server.
     * @returns {Promise.<Object>|undefined} a promise that will resolve to the requested data when loaded. Returns undefined if <code>request.throttle</code> is true and the request does not have high enough priority.
     */
    Resource.delete = function (options) {
        var resource = new Resource(options);
        return resource.delete({
            // Make copy of just the needed fields because headers can be passed to both the constructor and to fetch
            responseType: options.responseType,
            overrideMimeType: options.overrideMimeType,
            data: options.data
        });
    };

    /**
     * Asynchronously gets headers the given resource.  Returns a promise that will resolve to
     * the result once loaded, or reject if the resource failed to load.  The data is loaded
     * using XMLHttpRequest, which means that in order to make requests to another origin,
     * the server must have Cross-Origin Resource Sharing (CORS) headers enabled.
     *
     * @param {Object} [options] Object with the following properties:
     * @param {String} [options.responseType] The type of response.  This controls the type of item returned.
     * @param {Object} [options.headers] Additional HTTP headers to send with the request, if any.
     * @param {String} [options.overrideMimeType] Overrides the MIME type returned by the server.
     * @returns {Promise.<Object>|undefined} a promise that will resolve to the requested data when loaded. Returns undefined if <code>request.throttle</code> is true and the request does not have high enough priority.
     *
     *
     * @example
     * resource.head()
     *   .then(function(headers) {
     *       // use the data
     *   }).otherwise(function(error) {
     *       // an error occurred
     *   });
     *
     * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
     * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
     */
    Resource.prototype.head = function(options) {
        options = defaultClone(options, {});
        options.method = 'HEAD';

        return this._makeRequest(options);
    };

    /**
     * Creates a Resource from a URL and calls head() on it.
     *
     * @param {String|Object} options A url or an object with the following properties
     * @param {String} options.url The url of the resource.
     * @param {Object} [options.queryParameters] An object containing query parameters that will be sent when retrieving the resource.
     * @param {Object} [options.templateValues] Key/Value pairs that are used to replace template values (eg. {x}).
     * @param {Object} [options.headers={}] Additional HTTP headers that will be sent.
     * @param {DefaultProxy} [options.proxy] A proxy to be used when loading the resource.
     * @param {Resource~RetryCallback} [options.retryCallback] The Function to call when a request for this resource fails. If it returns true, the request will be retried.
     * @param {Number} [options.retryAttempts=0] The number of times the retryCallback should be called before giving up.
     * @param {Request} [options.request] A Request object that will be used. Intended for internal use only.
     * @param {String} [options.responseType] The type of response.  This controls the type of item returned.
     * @param {String} [options.overrideMimeType] Overrides the MIME type returned by the server.
     * @returns {Promise.<Object>|undefined} a promise that will resolve to the requested data when loaded. Returns undefined if <code>request.throttle</code> is true and the request does not have high enough priority.
     */
    Resource.head = function (options) {
        var resource = new Resource(options);
        return resource.head({
            // Make copy of just the needed fields because headers can be passed to both the constructor and to fetch
            responseType: options.responseType,
            overrideMimeType: options.overrideMimeType
        });
    };

    /**
     * Asynchronously gets options the given resource.  Returns a promise that will resolve to
     * the result once loaded, or reject if the resource failed to load.  The data is loaded
     * using XMLHttpRequest, which means that in order to make requests to another origin,
     * the server must have Cross-Origin Resource Sharing (CORS) headers enabled.
     *
     * @param {Object} [options] Object with the following properties:
     * @param {String} [options.responseType] The type of response.  This controls the type of item returned.
     * @param {Object} [options.headers] Additional HTTP headers to send with the request, if any.
     * @param {String} [options.overrideMimeType] Overrides the MIME type returned by the server.
     * @returns {Promise.<Object>|undefined} a promise that will resolve to the requested data when loaded. Returns undefined if <code>request.throttle</code> is true and the request does not have high enough priority.
     *
     *
     * @example
     * resource.options()
     *   .then(function(headers) {
     *       // use the data
     *   }).otherwise(function(error) {
     *       // an error occurred
     *   });
     *
     * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
     * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
     */
    Resource.prototype.options = function(options) {
        options = defaultClone(options, {});
        options.method = 'OPTIONS';

        return this._makeRequest(options);
    };

    /**
     * Creates a Resource from a URL and calls options() on it.
     *
     * @param {String|Object} options A url or an object with the following properties
     * @param {String} options.url The url of the resource.
     * @param {Object} [options.queryParameters] An object containing query parameters that will be sent when retrieving the resource.
     * @param {Object} [options.templateValues] Key/Value pairs that are used to replace template values (eg. {x}).
     * @param {Object} [options.headers={}] Additional HTTP headers that will be sent.
     * @param {DefaultProxy} [options.proxy] A proxy to be used when loading the resource.
     * @param {Resource~RetryCallback} [options.retryCallback] The Function to call when a request for this resource fails. If it returns true, the request will be retried.
     * @param {Number} [options.retryAttempts=0] The number of times the retryCallback should be called before giving up.
     * @param {Request} [options.request] A Request object that will be used. Intended for internal use only.
     * @param {String} [options.responseType] The type of response.  This controls the type of item returned.
     * @param {String} [options.overrideMimeType] Overrides the MIME type returned by the server.
     * @returns {Promise.<Object>|undefined} a promise that will resolve to the requested data when loaded. Returns undefined if <code>request.throttle</code> is true and the request does not have high enough priority.
     */
    Resource.options = function (options) {
        var resource = new Resource(options);
        return resource.options({
            // Make copy of just the needed fields because headers can be passed to both the constructor and to fetch
            responseType: options.responseType,
            overrideMimeType: options.overrideMimeType
        });
    };

    /**
     * Asynchronously posts data to the given resource.  Returns a promise that will resolve to
     * the result once loaded, or reject if the resource failed to load.  The data is loaded
     * using XMLHttpRequest, which means that in order to make requests to another origin,
     * the server must have Cross-Origin Resource Sharing (CORS) headers enabled.
     *
     * @param {Object} data Data that is posted with the resource.
     * @param {Object} [options] Object with the following properties:
     * @param {Object} [options.data] Data that is posted with the resource.
     * @param {String} [options.responseType] The type of response.  This controls the type of item returned.
     * @param {Object} [options.headers] Additional HTTP headers to send with the request, if any.
     * @param {String} [options.overrideMimeType] Overrides the MIME type returned by the server.
     * @returns {Promise.<Object>|undefined} a promise that will resolve to the requested data when loaded. Returns undefined if <code>request.throttle</code> is true and the request does not have high enough priority.
     *
     *
     * @example
     * resource.post(data)
     *   .then(function(result) {
     *       // use the result
     *   }).otherwise(function(error) {
     *       // an error occurred
     *   });
     *
     * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
     * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
     */
    Resource.prototype.post = function(data, options) {
        Check.defined('data', data);

        options = defaultClone(options, {});
        options.method = 'POST';
        options.data = data;

        return this._makeRequest(options);
    };

    /**
     * Creates a Resource from a URL and calls post() on it.
     *
     * @param {Object} options A url or an object with the following properties
     * @param {String} options.url The url of the resource.
     * @param {Object} options.data Data that is posted with the resource.
     * @param {Object} [options.queryParameters] An object containing query parameters that will be sent when retrieving the resource.
     * @param {Object} [options.templateValues] Key/Value pairs that are used to replace template values (eg. {x}).
     * @param {Object} [options.headers={}] Additional HTTP headers that will be sent.
     * @param {DefaultProxy} [options.proxy] A proxy to be used when loading the resource.
     * @param {Resource~RetryCallback} [options.retryCallback] The Function to call when a request for this resource fails. If it returns true, the request will be retried.
     * @param {Number} [options.retryAttempts=0] The number of times the retryCallback should be called before giving up.
     * @param {Request} [options.request] A Request object that will be used. Intended for internal use only.
     * @param {String} [options.responseType] The type of response.  This controls the type of item returned.
     * @param {String} [options.overrideMimeType] Overrides the MIME type returned by the server.
     * @returns {Promise.<Object>|undefined} a promise that will resolve to the requested data when loaded. Returns undefined if <code>request.throttle</code> is true and the request does not have high enough priority.
     */
    Resource.post = function (options) {
        var resource = new Resource(options);
        return resource.post(options.data, {
            // Make copy of just the needed fields because headers can be passed to both the constructor and to post
            responseType: options.responseType,
            overrideMimeType: options.overrideMimeType
        });
    };

    /**
     * Asynchronously puts data to the given resource.  Returns a promise that will resolve to
     * the result once loaded, or reject if the resource failed to load.  The data is loaded
     * using XMLHttpRequest, which means that in order to make requests to another origin,
     * the server must have Cross-Origin Resource Sharing (CORS) headers enabled.
     *
     * @param {Object} data Data that is posted with the resource.
     * @param {Object} [options] Object with the following properties:
     * @param {String} [options.responseType] The type of response.  This controls the type of item returned.
     * @param {Object} [options.headers] Additional HTTP headers to send with the request, if any.
     * @param {String} [options.overrideMimeType] Overrides the MIME type returned by the server.
     * @returns {Promise.<Object>|undefined} a promise that will resolve to the requested data when loaded. Returns undefined if <code>request.throttle</code> is true and the request does not have high enough priority.
     *
     *
     * @example
     * resource.put(data)
     *   .then(function(result) {
     *       // use the result
     *   }).otherwise(function(error) {
     *       // an error occurred
     *   });
     *
     * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
     * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
     */
    Resource.prototype.put = function(data, options) {
        Check.defined('data', data);

        options = defaultClone(options, {});
        options.method = 'PUT';
        options.data = data;

        return this._makeRequest(options);
    };

    /**
     * Creates a Resource from a URL and calls put() on it.
     *
     * @param {Object} options A url or an object with the following properties
     * @param {String} options.url The url of the resource.
     * @param {Object} options.data Data that is posted with the resource.
     * @param {Object} [options.queryParameters] An object containing query parameters that will be sent when retrieving the resource.
     * @param {Object} [options.templateValues] Key/Value pairs that are used to replace template values (eg. {x}).
     * @param {Object} [options.headers={}] Additional HTTP headers that will be sent.
     * @param {DefaultProxy} [options.proxy] A proxy to be used when loading the resource.
     * @param {Resource~RetryCallback} [options.retryCallback] The Function to call when a request for this resource fails. If it returns true, the request will be retried.
     * @param {Number} [options.retryAttempts=0] The number of times the retryCallback should be called before giving up.
     * @param {Request} [options.request] A Request object that will be used. Intended for internal use only.
     * @param {String} [options.responseType] The type of response.  This controls the type of item returned.
     * @param {String} [options.overrideMimeType] Overrides the MIME type returned by the server.
     * @returns {Promise.<Object>|undefined} a promise that will resolve to the requested data when loaded. Returns undefined if <code>request.throttle</code> is true and the request does not have high enough priority.
     */
    Resource.put = function (options) {
        var resource = new Resource(options);
        return resource.put(options.data, {
            // Make copy of just the needed fields because headers can be passed to both the constructor and to post
            responseType: options.responseType,
            overrideMimeType: options.overrideMimeType
        });
    };

    /**
     * Asynchronously patches data to the given resource.  Returns a promise that will resolve to
     * the result once loaded, or reject if the resource failed to load.  The data is loaded
     * using XMLHttpRequest, which means that in order to make requests to another origin,
     * the server must have Cross-Origin Resource Sharing (CORS) headers enabled.
     *
     * @param {Object} data Data that is posted with the resource.
     * @param {Object} [options] Object with the following properties:
     * @param {String} [options.responseType] The type of response.  This controls the type of item returned.
     * @param {Object} [options.headers] Additional HTTP headers to send with the request, if any.
     * @param {String} [options.overrideMimeType] Overrides the MIME type returned by the server.
     * @returns {Promise.<Object>|undefined} a promise that will resolve to the requested data when loaded. Returns undefined if <code>request.throttle</code> is true and the request does not have high enough priority.
     *
     *
     * @example
     * resource.patch(data)
     *   .then(function(result) {
     *       // use the result
     *   }).otherwise(function(error) {
     *       // an error occurred
     *   });
     *
     * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
     * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
     */
    Resource.prototype.patch = function(data, options) {
        Check.defined('data', data);

        options = defaultClone(options, {});
        options.method = 'PATCH';
        options.data = data;

        return this._makeRequest(options);
    };

    /**
     * Creates a Resource from a URL and calls patch() on it.
     *
     * @param {Object} options A url or an object with the following properties
     * @param {String} options.url The url of the resource.
     * @param {Object} options.data Data that is posted with the resource.
     * @param {Object} [options.queryParameters] An object containing query parameters that will be sent when retrieving the resource.
     * @param {Object} [options.templateValues] Key/Value pairs that are used to replace template values (eg. {x}).
     * @param {Object} [options.headers={}] Additional HTTP headers that will be sent.
     * @param {DefaultProxy} [options.proxy] A proxy to be used when loading the resource.
     * @param {Resource~RetryCallback} [options.retryCallback] The Function to call when a request for this resource fails. If it returns true, the request will be retried.
     * @param {Number} [options.retryAttempts=0] The number of times the retryCallback should be called before giving up.
     * @param {Request} [options.request] A Request object that will be used. Intended for internal use only.
     * @param {String} [options.responseType] The type of response.  This controls the type of item returned.
     * @param {String} [options.overrideMimeType] Overrides the MIME type returned by the server.
     * @returns {Promise.<Object>|undefined} a promise that will resolve to the requested data when loaded. Returns undefined if <code>request.throttle</code> is true and the request does not have high enough priority.
     */
    Resource.patch = function (options) {
        var resource = new Resource(options);
        return resource.patch(options.data, {
            // Make copy of just the needed fields because headers can be passed to both the constructor and to post
            responseType: options.responseType,
            overrideMimeType: options.overrideMimeType
        });
    };

    /**
     * Contains implementations of functions that can be replaced for testing
     *
     * @private
     */
    Resource._Implementations = {};

    function loadImageElement(url, crossOrigin, deferred) {
        var image = new Image();

        image.onload = function() {
            deferred.resolve(image);
        };

        image.onerror = function(e) {
            deferred.reject(e);
        };

        if (crossOrigin) {
            if (TrustedServers.contains(url)) {
                image.crossOrigin = 'use-credentials';
            } else {
                image.crossOrigin = '';
            }
        }

        image.src = url;
    }

    Resource._Implementations.createImage = function(url, crossOrigin, deferred, flipY, preferImageBitmap) {
        // Passing an Image to createImageBitmap will force it to run on the main thread
        // since DOM elements don't exist on workers. We convert it to a blob so it's non-blocking.
        // See:
        //    https://bugzilla.mozilla.org/show_bug.cgi?id=1044102#c38
        //    https://bugs.chromium.org/p/chromium/issues/detail?id=580202#c10
        Resource.supportsImageBitmapOptions()
            .then(function(supportsImageBitmap) {
                // We can only use ImageBitmap if we can flip on decode.
                // See: https://github.com/AnalyticalGraphicsInc/cesium/pull/7579#issuecomment-466146898
                if (!(supportsImageBitmap && preferImageBitmap)) {
                    loadImageElement(url, crossOrigin, deferred);
                    return;
                }

                return Resource.fetchBlob({
                    url: url
                });
            })
            .then(function(blob) {
                if (!defined(blob)) {
                    return;
                }

                return Resource._Implementations.createImageBitmapFromBlob(blob, flipY);
            })
            .then(function(imageBitmap) {
                if (!defined(imageBitmap)) {
                    return;
                }

                deferred.resolve(imageBitmap);
            })
            .otherwise(deferred.reject);
    };

    Resource._Implementations.createImageBitmapFromBlob = function(blob, flipY) {
        return createImageBitmap(blob, {
            imageOrientation: flipY ? 'flipY' : 'none'
        });
    };

    function decodeResponse(loadWithHttpResponse, responseType) {
        switch (responseType) {
          case 'text':
              return loadWithHttpResponse.toString('utf8');
          case 'json':
              return JSON.parse(loadWithHttpResponse.toString('utf8'));
          default:
              return new Uint8Array(loadWithHttpResponse).buffer;
        }
    }

    function loadWithHttpRequest(url, responseType, method, data, headers, deferred, overrideMimeType) {

        // Specifically use the Node version of require to avoid conflicts with the global
        // require defined in the built version of Cesium.
        var nodeRequire = global.require; // eslint-disable-line

        // Note: only the 'json' and 'text' responseTypes transforms the loaded buffer
        var URL = nodeRequire('url').parse(url);
        var http = URL.protocol === 'https:' ? nodeRequire('https') : nodeRequire('http');
        var zlib = nodeRequire('zlib');
        var options = {
            protocol : URL.protocol,
            hostname : URL.hostname,
            port : URL.port,
            path : URL.path,
            query : URL.query,
            method : method,
            headers : headers
        };

        http.request(options)
            .on('response', function(res) {
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    deferred.reject(new RequestErrorEvent(res.statusCode, res, res.headers));
                    return;
                }

                var chunkArray = [];
                res.on('data', function(chunk) {
                    chunkArray.push(chunk);
                });

                res.on('end', function() {
                    var result = Buffer.concat(chunkArray); // eslint-disable-line
                    if (res.headers['content-encoding'] === 'gzip') {
                        zlib.gunzip(result, function(error, resultUnzipped) {
                            if (error) {
                                deferred.reject(new RuntimeError('Error decompressing response.'));
                            } else {
                                deferred.resolve(decodeResponse(resultUnzipped, responseType));
                            }
                        });
                    } else {
                        deferred.resolve(decodeResponse(result, responseType));
                    }
                });
            }).on('error', function(e) {
                deferred.reject(new RequestErrorEvent());
            }).end();
    }

    var noXMLHttpRequest = typeof XMLHttpRequest === 'undefined';
    Resource._Implementations.loadWithXhr = function(url, responseType, method, data, headers, deferred, overrideMimeType) {
        var dataUriRegexResult = dataUriRegex.exec(url);
        if (dataUriRegexResult !== null) {
            deferred.resolve(decodeDataUri(dataUriRegexResult, responseType));
            return;
        }

        if (noXMLHttpRequest) {
            loadWithHttpRequest(url, responseType, method, data, headers, deferred, overrideMimeType);
            return;
        }

        var xhr = new XMLHttpRequest();

        if (TrustedServers.contains(url)) {
            xhr.withCredentials = true;
        }

        xhr.open(method, url, true);

        if (defined(overrideMimeType) && defined(xhr.overrideMimeType)) {
            xhr.overrideMimeType(overrideMimeType);
        }

        if (defined(headers)) {
            for (var key in headers) {
                if (headers.hasOwnProperty(key)) {
                    xhr.setRequestHeader(key, headers[key]);
                }
            }
        }

        if (defined(responseType)) {
            xhr.responseType = responseType;
        }

        // While non-standard, file protocol always returns a status of 0 on success
        var localFile = false;
        if (typeof url === 'string') {
            localFile = (url.indexOf('file://') === 0) || (typeof window !== 'undefined' && window.location.origin === 'file://');
        }

        xhr.onload = function() {
            if ((xhr.status < 200 || xhr.status >= 300) && !(localFile && xhr.status === 0)) {
                deferred.reject(new RequestErrorEvent(xhr.status, xhr.response, xhr.getAllResponseHeaders()));
                return;
            }

            var response = xhr.response;
            var browserResponseType = xhr.responseType;

            if (method === 'HEAD' || method === 'OPTIONS') {
                var responseHeaderString = xhr.getAllResponseHeaders();
                var splitHeaders = responseHeaderString.trim().split(/[\r\n]+/);

                var responseHeaders = {};
                splitHeaders.forEach(function (line) {
                    var parts = line.split(': ');
                    var header = parts.shift();
                    responseHeaders[header] = parts.join(': ');
                });

                deferred.resolve(responseHeaders);
                return;
            }

            //All modern browsers will go into either the first or second if block or last else block.
            //Other code paths support older browsers that either do not support the supplied responseType
            //or do not support the xhr.response property.
            if (xhr.status === 204) {
                // accept no content
                deferred.resolve();
            } else if (defined(response) && (!defined(responseType) || (browserResponseType === responseType))) {
                deferred.resolve(response);
            } else if ((responseType === 'json') && typeof response === 'string') {
                try {
                    deferred.resolve(JSON.parse(response));
                } catch (e) {
                    deferred.reject(e);
                }
            } else if ((browserResponseType === '' || browserResponseType === 'document') && defined(xhr.responseXML) && xhr.responseXML.hasChildNodes()) {
                deferred.resolve(xhr.responseXML);
            } else if ((browserResponseType === '' || browserResponseType === 'text') && defined(xhr.responseText)) {
                deferred.resolve(xhr.responseText);
            } else {
                deferred.reject(new RuntimeError('Invalid XMLHttpRequest response type.'));
            }
        };

        xhr.onerror = function(e) {
            deferred.reject(new RequestErrorEvent());
        };

        xhr.send(data);

        return xhr;
    };

    Resource._Implementations.loadAndExecuteScript = function(url, functionName, deferred) {
        return loadAndExecuteScript(url, functionName).otherwise(deferred.reject);
    };

    /**
     * The default implementations
     *
     * @private
     */
    Resource._DefaultImplementations = {};
    Resource._DefaultImplementations.createImage = Resource._Implementations.createImage;
    Resource._DefaultImplementations.loadWithXhr = Resource._Implementations.loadWithXhr;
    Resource._DefaultImplementations.loadAndExecuteScript = Resource._Implementations.loadAndExecuteScript;

    /**
     * A resource instance initialized to the current browser location
     *
     * @type {Resource}
     * @constant
     */
    Resource.DEFAULT = freezeObject(new Resource({
        url: (typeof document === 'undefined') ? '' : document.location.href.split('?')[0]
    }));

    /**
     * A function that returns the value of the property.
     * @callback Resource~RetryCallback
     *
     * @param {Resource} [resource] The resource that failed to load.
     * @param {Error} [error] The error that occurred during the loading of the resource.
     * @returns {Boolean|Promise<Boolean>} If true or a promise that resolved to true, the resource will be retried. Otherwise the failure will be returned.
     */

    module.exports= Resource;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
},{"./Check":11,"./DeveloperError":13,"./FeatureDetection":16,"./Request":23,"./RequestErrorEvent":24,"./RequestScheduler":25,"./RequestState":26,"./RuntimeError":29,"./TrustedServers":32,"./appendForwardSlash":36,"./clone":38,"./combine":39,"./defaultValue":40,"./defineProperties":41,"./defined":42,"./deprecationWarning":43,"./freezeObject":45,"./getAbsoluteUri":46,"./getBaseUri":47,"./getExtensionFromUri":48,"./isBlobUri":50,"./isCrossOriginUrl":51,"./isDataUri":52,"./loadAndExecuteScript":53,"./objectToQuery":54,"./queryToObject":57,"buffer":undefined,"uri":undefined,"when":undefined}],29:[function(require,module,exports){
var defined=require('./defined');

    'use strict';

    /**
     * Constructs an exception object that is thrown due to an error that can occur at runtime, e.g.,
     * out of memory, could not compile shader, etc.  If a function may throw this
     * exception, the calling code should be prepared to catch it.
     * <br /><br />
     * On the other hand, a {@link DeveloperError} indicates an exception due
     * to a developer error, e.g., invalid argument, that usually indicates a bug in the
     * calling code.
     *
     * @alias RuntimeError
     * @constructor
     * @extends Error
     *
     * @param {String} [message] The error message for this exception.
     *
     * @see DeveloperError
     */
    function RuntimeError(message) {
        /**
         * 'RuntimeError' indicating that this exception was thrown due to a runtime error.
         * @type {String}
         * @readonly
         */
        this.name = 'RuntimeError';

        /**
         * The explanation for why this exception was thrown.
         * @type {String}
         * @readonly
         */
        this.message = message;

        //Browsers such as IE don't have a stack property until you actually throw the error.
        var stack;
        try {
            throw new Error();
        } catch (e) {
            stack = e.stack;
        }

        /**
         * The stack trace of this exception, if available.
         * @type {String}
         * @readonly
         */
        this.stack = stack;
    }

    if (defined(Object.create)) {
        RuntimeError.prototype = Object.create(Error.prototype);
        RuntimeError.prototype.constructor = RuntimeError;
    }

    RuntimeError.prototype.toString = function() {
        var str = this.name + ': ' + this.message;

        if (defined(this.stack)) {
            str += '\n' + this.stack.toString();
        }

        return str;
    };

    module.exports= RuntimeError;

},{"./defined":42}],30:[function(require,module,exports){
var when = require('when');
var buildModuleUrl = require('./buildModuleUrl');
var defaultValue = require('./defaultValue');
var defined = require('./defined');
var destroyObject = require('./destroyObject');
var DeveloperError = require('./DeveloperError');
var Event = require('./Event');
var FeatureDetection = require('./FeatureDetection');
var getAbsoluteUri = require('./getAbsoluteUri');
var isCrossOriginUrl = require('./isCrossOriginUrl');
var Resource = require('./Resource');
var RuntimeError = require('./RuntimeError');
// var require=require('require');

'use strict';

function canTransferArrayBuffer() {
    if (!defined(TaskProcessor._canTransferArrayBuffer)) {
        var worker = new Worker(getWorkerUrl('Workers/transferTypedArrayTest.js'));
        worker.postMessage = defaultValue(worker.webkitPostMessage, worker.postMessage);

        var value = 99;
        var array = new Int8Array([value]);

        try {
            // postMessage might fail with a DataCloneError
            // if transferring array buffers is not supported.
            worker.postMessage({
                array: array
            }, [array.buffer]);
        } catch (e) {
            TaskProcessor._canTransferArrayBuffer = false;
            return TaskProcessor._canTransferArrayBuffer;
        }

        var deferred = when.defer();

        worker.onmessage = function (event) {
            var array = event.data.array;

            // some versions of Firefox silently fail to transfer typed arrays.
            // https://bugzilla.mozilla.org/show_bug.cgi?id=841904
            // Check to make sure the value round-trips successfully.
            var result = defined(array) && array[0] === value;
            deferred.resolve(result);

            worker.terminate();

            TaskProcessor._canTransferArrayBuffer = result;
        };

        TaskProcessor._canTransferArrayBuffer = deferred.promise;
    }

    return TaskProcessor._canTransferArrayBuffer;
}

var taskCompletedEvent = new Event();

function completeTask(processor, data) {
    --processor._activeTasks;

    var id = data.id;
    if (!defined(id)) {
        // This is not one of ours.
        return;
    }

    var deferreds = processor._deferreds;
    var deferred = deferreds[id];

    if (defined(data.error)) {
        var error = data.error;
        if (error.name === 'RuntimeError') {
            error = new RuntimeError(data.error.message);
            error.stack = data.error.stack;
        } else if (error.name === 'DeveloperError') {
            error = new DeveloperError(data.error.message);
            error.stack = data.error.stack;
        }
        taskCompletedEvent.raiseEvent(error);
        deferred.reject(error);
    } else {
        taskCompletedEvent.raiseEvent();
        deferred.resolve(data.result);
    }

    delete deferreds[id];
}

function getWorkerUrl(moduleID) {
    var url = buildModuleUrl(moduleID);

    if (isCrossOriginUrl(url)) {
        //to load cross-origin, create a shim worker from a blob URL
        var script = 'importScripts("' + url + '");';

        var blob;
        try {
            blob = new Blob([script], {
                type: 'application/javascript'
            });
        } catch (e) {
            var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
            var blobBuilder = new BlobBuilder();
            blobBuilder.append(script);
            blob = blobBuilder.getBlob('application/javascript');
        }

        var URL = window.URL || window.webkitURL;
        url = URL.createObjectURL(blob);
    }

    return url;
}

var bootstrapperUrlResult;
function getBootstrapperUrl() {
    if (!defined(bootstrapperUrlResult)) {
        bootstrapperUrlResult = getWorkerUrl('Workers/cesiumWorkerBootstrapper.js');
    }
    return bootstrapperUrlResult;
}

function createWorker(processor) {
    var worker = new Worker(getBootstrapperUrl());
    worker.postMessage = defaultValue(worker.webkitPostMessage, worker.postMessage);

    var bootstrapMessage = {
        loaderConfig: {},
        workerModule: TaskProcessor._workerModulePrefix + processor._workerName
    };

    if (defined(TaskProcessor._loaderConfig)) {
        bootstrapMessage.loaderConfig = TaskProcessor._loaderConfig;
    } else {
        if (!(defined(define.amd) && !define.amd.toUrlUndefined && defined(require.toUrl))) {
            bootstrapMessage.loaderConfig.paths = {
                'Workers': buildModuleUrl('Workers')
            };
        }
        bootstrapMessage.loaderConfig.baseUrl = buildModuleUrl.getCesiumBaseUrl().url;
    }

    worker.postMessage(bootstrapMessage);

    worker.onmessage = function (event) {
        completeTask(processor, event.data);
    };

    return worker;
}

function getWebAssemblyLoaderConfig(processor, wasmOptions) {
    var config = {
        modulePath: undefined,
        wasmBinaryFile: undefined,
        wasmBinary: undefined
    };

    // Web assembly not supported, use fallback js module if provided
    if (!FeatureDetection.supportsWebAssembly()) {
        if (!defined(wasmOptions.fallbackModulePath)) {
            throw new RuntimeError('This browser does not support Web Assembly, and no backup module was provided for ' + processor._workerName);
        }

        config.modulePath = buildModuleUrl(wasmOptions.fallbackModulePath);
        return when.resolve(config);
    }

    config.modulePath = buildModuleUrl(wasmOptions.modulePath);
    config.wasmBinaryFile = buildModuleUrl(wasmOptions.wasmBinaryFile);

    return Resource.fetchArrayBuffer({
        url: config.wasmBinaryFile
    }).then(function (arrayBuffer) {
        config.wasmBinary = arrayBuffer;
        return config;
    });
}

/**
 * A wrapper around a web worker that allows scheduling tasks for a given worker,
 * returning results asynchronously via a promise.
 *
 * The Worker is not constructed until a task is scheduled.
 *
 * @alias TaskProcessor
 * @constructor
 *
 * @param {String} workerName The name of the worker.  This is expected to be a script
 *                            in the Workers folder.
 * @param {Number} [maximumActiveTasks=5] The maximum number of active tasks.  Once exceeded,
 *                                        scheduleTask will not queue any more tasks, allowing
 *                                        work to be rescheduled in future frames.
 */
function TaskProcessor(workerName, maximumActiveTasks) {
    this._workerName = workerName;
    this._maximumActiveTasks = defaultValue(maximumActiveTasks, 5);
    this._activeTasks = 0;
    this._deferreds = {};
    this._nextID = 0;
}

var emptyTransferableObjectArray = [];

/**
 * Schedule a task to be processed by the web worker asynchronously.  If there are currently more
 * tasks active than the maximum set by the constructor, will immediately return undefined.
 * Otherwise, returns a promise that will resolve to the result posted back by the worker when
 * finished.
 *
 * @param {Object} parameters Any input data that will be posted to the worker.
 * @param {Object[]} [transferableObjects] An array of objects contained in parameters that should be
 *                                      transferred to the worker instead of copied.
 * @returns {Promise.<Object>|undefined} Either a promise that will resolve to the result when available, or undefined
 *                    if there are too many active tasks,
 *
 * @example
 * var taskProcessor = new Cesium.TaskProcessor('myWorkerName');
 * var promise = taskProcessor.scheduleTask({
 *     someParameter : true,
 *     another : 'hello'
 * });
 * if (!Cesium.defined(promise)) {
 *     // too many active tasks - try again later
 * } else {
 *     Cesium.when(promise, function(result) {
 *         // use the result of the task
 *     });
 * }
 */
TaskProcessor.prototype.scheduleTask = function (parameters, transferableObjects) {
    if (!defined(this._worker)) {
        this._worker = createWorker(this);
    }

    if (this._activeTasks >= this._maximumActiveTasks) {
        return undefined;
    }

    ++this._activeTasks;

    var processor = this;
    return when(canTransferArrayBuffer(), function (canTransferArrayBuffer) {
        if (!defined(transferableObjects)) {
            transferableObjects = emptyTransferableObjectArray;
        } else if (!canTransferArrayBuffer) {
            transferableObjects.length = 0;
        }

        var id = processor._nextID++;
        var deferred = when.defer();
        processor._deferreds[id] = deferred;

        processor._worker.postMessage({
            id: id,
            parameters: parameters,
            canTransferArrayBuffer: canTransferArrayBuffer
        }, transferableObjects);

        return deferred.promise;
    });
};

/**
 * Posts a message to a web worker with configuration to initialize loading
 * and compiling a web assembly module asychronously, as well as an optional
 * fallback JavaScript module to use if Web Assembly is not supported.
 *
 * @param {Object} [webAssemblyOptions] An object with the following properties:
 * @param {String} [webAssemblyOptions.modulePath] The path of the web assembly JavaScript wrapper module.
 * @param {String} [webAssemblyOptions.wasmBinaryFile] The path of the web assembly binary file.
 * @param {String} [webAssemblyOptions.fallbackModulePath] The path of the fallback JavaScript module to use if web assembly is not supported.
 * @returns {Promise.<Object>} A promise that resolves to the result when the web worker has loaded and compiled the web assembly module and is ready to process tasks.
 */
TaskProcessor.prototype.initWebAssemblyModule = function (webAssemblyOptions) {
    if (!defined(this._worker)) {
        this._worker = createWorker(this);
    }

    var deferred = when.defer();
    var processor = this;
    var worker = this._worker;
    getWebAssemblyLoaderConfig(this, webAssemblyOptions).then(function (wasmConfig) {
        return when(canTransferArrayBuffer(), function (canTransferArrayBuffer) {
            var transferableObjects;
            var binary = wasmConfig.wasmBinary;
            if (defined(binary) && canTransferArrayBuffer) {
                transferableObjects = [binary];
            }

            worker.onmessage = function (event) {
                worker.onmessage = function (event) {
                    completeTask(processor, event.data);
                };

                deferred.resolve(event.data);
            };

            worker.postMessage({ webAssemblyConfig: wasmConfig }, transferableObjects);
        });
    });

    return deferred;
};

/**
 * Returns true if this object was destroyed; otherwise, false.
 * <br /><br />
 * If this object was destroyed, it should not be used; calling any function other than
 * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.
 *
 * @returns {Boolean} True if this object was destroyed; otherwise, false.
 *
 * @see TaskProcessor#destroy
 */
TaskProcessor.prototype.isDestroyed = function () {
    return false;
};

/**
 * Destroys this object.  This will immediately terminate the Worker.
 * <br /><br />
 * Once an object is destroyed, it should not be used; calling any function other than
 * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.
 */
TaskProcessor.prototype.destroy = function () {
    if (defined(this._worker)) {
        this._worker.terminate();
    }
    return destroyObject(this);
};

/**
 * An event that's raised when a task is completed successfully.  Event handlers are passed
 * the error object is a task fails.
 *
 * @type {Event}
 *
 * @private
 */
TaskProcessor.taskCompletedEvent = taskCompletedEvent;

// exposed for testing purposes
TaskProcessor._defaultWorkerModulePrefix = 'Workers/';
TaskProcessor._workerModulePrefix = TaskProcessor._defaultWorkerModulePrefix;
TaskProcessor._loaderConfig = undefined;
TaskProcessor._canTransferArrayBuffer = undefined;

module.exports = TaskProcessor;

},{"./DeveloperError":13,"./Event":15,"./FeatureDetection":16,"./Resource":28,"./RuntimeError":29,"./buildModuleUrl":37,"./defaultValue":40,"./defined":42,"./destroyObject":44,"./getAbsoluteUri":46,"./isCrossOriginUrl":51,"when":undefined}],31:[function(require,module,exports){
var defineProperties=require('./defineProperties');
var DeveloperError=require('./DeveloperError');

    'use strict';

    /**
     * A tiling scheme for geometry or imagery on the surface of an ellipsoid.  At level-of-detail zero,
     * the coarsest, least-detailed level, the number of tiles is configurable.
     * At level of detail one, each of the level zero tiles has four children, two in each direction.
     * At level of detail two, each of the level one tiles has four children, two in each direction.
     * This continues for as many levels as are present in the geometry or imagery source.
     *
     * @alias TilingScheme
     * @constructor
     *
     * @see WebMercatorTilingScheme
     * @see GeographicTilingScheme
     */
    function TilingScheme(options) {
        //>>includeStart('debug', pragmas.debug);
        throw new DeveloperError('This type should not be instantiated directly.  Instead, use WebMercatorTilingScheme or GeographicTilingScheme.');
        //>>includeEnd('debug');
    }

    defineProperties(TilingScheme.prototype, {
        /**
         * Gets the ellipsoid that is tiled by the tiling scheme.
         * @memberof TilingScheme.prototype
         * @type {Ellipsoid}
         */
        ellipsoid: {
            get : DeveloperError.throwInstantiationError
        },

        /**
         * Gets the rectangle, in radians, covered by this tiling scheme.
         * @memberof TilingScheme.prototype
         * @type {Rectangle}
         */
        rectangle : {
            get : DeveloperError.throwInstantiationError
        },

        /**
         * Gets the map projection used by the tiling scheme.
         * @memberof TilingScheme.prototype
         * @type {MapProjection}
         */
        projection : {
            get : DeveloperError.throwInstantiationError
        }
    });

    /**
     * Gets the total number of tiles in the X direction at a specified level-of-detail.
     * @function
     *
     * @param {Number} level The level-of-detail.
     * @returns {Number} The number of tiles in the X direction at the given level.
     */
    TilingScheme.prototype.getNumberOfXTilesAtLevel = DeveloperError.throwInstantiationError;

    /**
     * Gets the total number of tiles in the Y direction at a specified level-of-detail.
     * @function
     *
     * @param {Number} level The level-of-detail.
     * @returns {Number} The number of tiles in the Y direction at the given level.
     */
    TilingScheme.prototype.getNumberOfYTilesAtLevel = DeveloperError.throwInstantiationError;

    /**
     * Transforms a rectangle specified in geodetic radians to the native coordinate system
     * of this tiling scheme.
     * @function
     *
     * @param {Rectangle} rectangle The rectangle to transform.
     * @param {Rectangle} [result] The instance to which to copy the result, or undefined if a new instance
     *        should be created.
     * @returns {Rectangle} The specified 'result', or a new object containing the native rectangle if 'result'
     *          is undefined.
     */
    TilingScheme.prototype.rectangleToNativeRectangle = DeveloperError.throwInstantiationError;

    /**
     * Converts tile x, y coordinates and level to a rectangle expressed in the native coordinates
     * of the tiling scheme.
     * @function
     *
     * @param {Number} x The integer x coordinate of the tile.
     * @param {Number} y The integer y coordinate of the tile.
     * @param {Number} level The tile level-of-detail.  Zero is the least detailed.
     * @param {Object} [result] The instance to which to copy the result, or undefined if a new instance
     *        should be created.
     * @returns {Rectangle} The specified 'result', or a new object containing the rectangle
     *          if 'result' is undefined.
     */
    TilingScheme.prototype.tileXYToNativeRectangle = DeveloperError.throwInstantiationError;

    /**
     * Converts tile x, y coordinates and level to a cartographic rectangle in radians.
     * @function
     *
     * @param {Number} x The integer x coordinate of the tile.
     * @param {Number} y The integer y coordinate of the tile.
     * @param {Number} level The tile level-of-detail.  Zero is the least detailed.
     * @param {Object} [result] The instance to which to copy the result, or undefined if a new instance
     *        should be created.
     * @returns {Rectangle} The specified 'result', or a new object containing the rectangle
     *          if 'result' is undefined.
     */
    TilingScheme.prototype.tileXYToRectangle = DeveloperError.throwInstantiationError;

    /**
     * Calculates the tile x, y coordinates of the tile containing
     * a given cartographic position.
     * @function
     *
     * @param {Cartographic} position The position.
     * @param {Number} level The tile level-of-detail.  Zero is the least detailed.
     * @param {Cartesian2} [result] The instance to which to copy the result, or undefined if a new instance
     *        should be created.
     * @returns {Cartesian2} The specified 'result', or a new object containing the tile x, y coordinates
     *          if 'result' is undefined.
     */
    TilingScheme.prototype.positionToTileXY = DeveloperError.throwInstantiationError;

    module.exports= TilingScheme;

},{"./DeveloperError":13,"./defineProperties":41}],32:[function(require,module,exports){
var Uri=require('./Uri');
var defined=require('./defined');
var DeveloperError=require('./DeveloperError');

    'use strict';

    /**
     * A singleton that contains all of the servers that are trusted. Credentials will be sent with
     * any requests to these servers.
     *
     * @exports TrustedServers
     *
     * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
     */
    var TrustedServers = {};
    var _servers = {};

    /**
     * Adds a trusted server to the registry
     *
     * @param {String} host The host to be added.
     * @param {Number} port The port used to access the host.
     *
     * @example
     * // Add a trusted server
     * TrustedServers.add('my.server.com', 80);
     */
    TrustedServers.add = function(host, port) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(host)) {
            throw new DeveloperError('host is required.');
        }
        if (!defined(port) || port <= 0) {
            throw new DeveloperError('port is required to be greater than 0.');
        }
        //>>includeEnd('debug');

        var authority = host.toLowerCase() + ':' + port;
        if (!defined(_servers[authority])) {
            _servers[authority] = true;
        }
    };

    /**
     * Removes a trusted server from the registry
     *
     * @param {String} host The host to be removed.
     * @param {Number} port The port used to access the host.
     *
     * @example
     * // Remove a trusted server
     * TrustedServers.remove('my.server.com', 80);
     */
    TrustedServers.remove = function(host, port) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(host)) {
            throw new DeveloperError('host is required.');
        }
        if (!defined(port) || port <= 0) {
            throw new DeveloperError('port is required to be greater than 0.');
        }
        //>>includeEnd('debug');

        var authority = host.toLowerCase() + ':' + port;
        if (defined(_servers[authority])) {
            delete _servers[authority];
        }
    };

    function getAuthority(url) {
        var uri = new Uri(url);
        uri.normalize();

        // Removes username:password@ so we just have host[:port]
        var authority = uri.getAuthority();
        if (!defined(authority)) {
            return undefined; // Relative URL
        }

        if (authority.indexOf('@') !== -1) {
            var parts = authority.split('@');
            authority = parts[1];
        }

        // If the port is missing add one based on the scheme
        if (authority.indexOf(':') === -1) {
            var scheme = uri.getScheme();
            if (!defined(scheme)) {
                scheme = window.location.protocol;
                scheme = scheme.substring(0, scheme.length-1);
            }
            if (scheme === 'http') {
                authority += ':80';
            } else if (scheme === 'https') {
                authority += ':443';
            } else {
                return undefined;
            }
        }

        return authority;
    }

    /**
     * Tests whether a server is trusted or not. The server must have been added with the port if it is included in the url.
     *
     * @param {String} url The url to be tested against the trusted list
     *
     * @returns {boolean} Returns true if url is trusted, false otherwise.
     *
     * @example
     * // Add server
     * TrustedServers.add('my.server.com', 81);
     *
     * // Check if server is trusted
     * if (TrustedServers.contains('https://my.server.com:81/path/to/file.png')) {
     *     // my.server.com:81 is trusted
     * }
     * if (TrustedServers.contains('https://my.server.com/path/to/file.png')) {
     *     // my.server.com isn't trusted
     * }
     */
    TrustedServers.contains = function(url) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(url)) {
            throw new DeveloperError('url is required.');
        }
        //>>includeEnd('debug');
        var authority = getAuthority(url);
        if (defined(authority) && defined(_servers[authority])) {
            return true;
        }

        return false;
    };

    /**
     * Clears the registry
     *
     * @example
     * // Remove a trusted server
     * TrustedServers.clear();
     */
    TrustedServers.clear = function() {
        _servers = {};
    };

    module.exports= TrustedServers;

},{"./DeveloperError":13,"./Uri":33,"./defined":42}],33:[function(require,module,exports){
/**
 * @license
 *
 * Grauw URI utilities
 *
 * See: http://hg.grauw.nl/grauw-lib/file/tip/src/uri.js
 *
 * @author Laurens Holst (http://www.grauw.nl/)
 *
 *   Copyright 2012 Laurens Holst
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *
 */

/**
 * Constructs a URI object.
 * @constructor
 * @class Implementation of URI parsing and base URI resolving algorithm in RFC 3986.
 * @param {string|URI} uri A string or URI object to create the object from.
 */
function URI(uri) {
	if (uri instanceof URI) {  // copy constructor
		this.scheme = uri.scheme;
		this.authority = uri.authority;
		this.path = uri.path;
		this.query = uri.query;
		this.fragment = uri.fragment;
	} else if (uri) {  // uri is URI string or cast to string
		var c = parseRegex.exec(uri);
		this.scheme = c[1];
		this.authority = c[2];
		this.path = c[3];
		this.query = c[4];
		this.fragment = c[5];
	}
}
// Initial values on the prototype
URI.prototype.scheme = null;
URI.prototype.authority = null;
URI.prototype.path = '';
URI.prototype.query = null;
URI.prototype.fragment = null;

// Regular expression from RFC 3986 appendix B
var parseRegex = new RegExp('^(?:([^:/?#]+):)?(?://([^/?#]*))?([^?#]*)(?:\\?([^#]*))?(?:#(.*))?$');

/**
 * Returns the scheme part of the URI.
 * In "http://example.com:80/a/b?x#y" this is "http".
 */
URI.prototype.getScheme = function () {
	return this.scheme;
};

/**
 * Returns the authority part of the URI.
 * In "http://example.com:80/a/b?x#y" this is "example.com:80".
 */
URI.prototype.getAuthority = function () {
	return this.authority;
};

/**
 * Returns the path part of the URI.
 * In "http://example.com:80/a/b?x#y" this is "/a/b".
 * In "mailto:mike@example.com" this is "mike@example.com".
 */
URI.prototype.getPath = function () {
	return this.path;
};

/**
 * Returns the query part of the URI.
 * In "http://example.com:80/a/b?x#y" this is "x".
 */
URI.prototype.getQuery = function () {
	return this.query;
};

/**
 * Returns the fragment part of the URI.
 * In "http://example.com:80/a/b?x#y" this is "y".
 */
URI.prototype.getFragment = function () {
	return this.fragment;
};

/**
 * Tests whether the URI is an absolute URI.
 * See RFC 3986 section 4.3.
 */
URI.prototype.isAbsolute = function () {
	return !!this.scheme && !this.fragment;
};

///**
//* Extensive validation of the URI against the ABNF in RFC 3986
//*/
//URI.prototype.validate

/**
 * Tests whether the URI is a same-document reference.
 * See RFC 3986 section 4.4.
 *
 * To perform more thorough comparison, you can normalise the URI objects.
 */
URI.prototype.isSameDocumentAs = function (uri) {
	return uri.scheme == this.scheme &&
		uri.authority == this.authority &&
		uri.path == this.path &&
		uri.query == this.query;
};

/**
 * Simple String Comparison of two URIs.
 * See RFC 3986 section 6.2.1.
 *
 * To perform more thorough comparison, you can normalise the URI objects.
 */
URI.prototype.equals = function (uri) {
	return this.isSameDocumentAs(uri) && uri.fragment == this.fragment;
};

/**
 * Normalizes the URI using syntax-based normalization.
 * This includes case normalization, percent-encoding normalization and path segment normalization.
 * XXX: Percent-encoding normalization does not escape characters that need to be escaped.
 *      (Although that would not be a valid URI in the first place. See validate().)
 * See RFC 3986 section 6.2.2.
 */
URI.prototype.normalize = function () {
	this.removeDotSegments();
	if (this.scheme)
		this.scheme = this.scheme.toLowerCase();
	if (this.authority)
		this.authority = this.authority.replace(authorityRegex, replaceAuthority).
			replace(caseRegex, replaceCase);
	if (this.path)
		this.path = this.path.replace(caseRegex, replaceCase);
	if (this.query)
		this.query = this.query.replace(caseRegex, replaceCase);
	if (this.fragment)
		this.fragment = this.fragment.replace(caseRegex, replaceCase);
};

var caseRegex = /%[0-9a-z]{2}/gi;
var percentRegex = /[a-zA-Z0-9\-\._~]/;
var authorityRegex = /(.*@)?([^@:]*)(:.*)?/;

function replaceCase(str) {
	var dec = unescape(str);
	return percentRegex.test(dec) ? dec : str.toUpperCase();
}

function replaceAuthority(str, p1, p2, p3) {
	return (p1 || '') + p2.toLowerCase() + (p3 || '');
}

/**
 * Resolve a relative URI (this) against a base URI.
 * The base URI must be an absolute URI.
 * See RFC 3986 section 5.2
 */
URI.prototype.resolve = function (baseURI) {
	var uri = new URI();
	if (this.scheme) {
		uri.scheme = this.scheme;
		uri.authority = this.authority;
		uri.path = this.path;
		uri.query = this.query;
	} else {
		uri.scheme = baseURI.scheme;
		if (this.authority) {
			uri.authority = this.authority;
			uri.path = this.path;
			uri.query = this.query;
		} else {
			uri.authority = baseURI.authority;
			if (this.path == '') {
				uri.path = baseURI.path;
				uri.query = this.query || baseURI.query;
			} else {
				if (this.path.charAt(0) == '/') {
					uri.path = this.path;
					uri.removeDotSegments();
				} else {
					if (baseURI.authority && baseURI.path == '') {
						uri.path = '/' + this.path;
					} else {
						uri.path = baseURI.path.substring(0, baseURI.path.lastIndexOf('/') + 1) + this.path;
					}
					uri.removeDotSegments();
				}
				uri.query = this.query;
			}
		}
	}
	uri.fragment = this.fragment;
	return uri;
};

/**
 * Remove dot segments from path.
 * See RFC 3986 section 5.2.4
 * @private
 */
URI.prototype.removeDotSegments = function () {
	var input = this.path.split('/'),
		output = [],
		segment,
		absPath = input[0] == '';
	if (absPath)
		input.shift();
	var sFirst = input[0] == '' ? input.shift() : null;
	while (input.length) {
		segment = input.shift();
		if (segment == '..') {
			output.pop();
		} else if (segment != '.') {
			output.push(segment);
		}
	}
	if (segment == '.' || segment == '..')
		output.push('');
	if (absPath)
		output.unshift('');
	this.path = output.join('/');
};

// We don't like this function because it builds up a cache that is never cleared.
//	/**
//	 * Resolves a relative URI against an absolute base URI.
//	 * Convenience method.
//	 * @param {String} uri the relative URI to resolve
//	 * @param {String} baseURI the base URI (must be absolute) to resolve against
//	 */
//	URI.resolve = function(sURI, sBaseURI) {
//		var uri = cache[sURI] || (cache[sURI] = new URI(sURI));
//		var baseURI = cache[sBaseURI] || (cache[sBaseURI] = new URI(sBaseURI));
//		return uri.resolve(baseURI).toString();
//	};

//	var cache = {};

/**
 * Serialises the URI to a string.
 */
URI.prototype.toString = function () {
	var result = '';
	if (this.scheme)
		result += this.scheme + ':';
	if (this.authority)
		result += '//' + this.authority;
	result += this.path;
	if (this.query)
		result += '?' + this.query;
	if (this.fragment)
		result += '#' + this.fragment;
	return result;
};

module.exports = URI;


},{}],34:[function(require,module,exports){
var Cartesian3=require('./Cartesian3');
var Cartographic=require('./Cartographic');
var defaultValue=require('./defaultValue');
var defined=require('./defined');
var defineProperties=require('./defineProperties');
var DeveloperError=require('./DeveloperError');
var Ellipsoid=require('./Ellipsoid');
var CesiumMath=require('./Math');

    'use strict';

    /**
     * The map projection used by Google Maps, Bing Maps, and most of ArcGIS Online, EPSG:3857.  This
     * projection use longitude and latitude expressed with the WGS84 and transforms them to Mercator using
     * the spherical (rather than ellipsoidal) equations.
     *
     * @alias WebMercatorProjection
     * @constructor
     *
     * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid.
     *
     * @see GeographicProjection
     */
    function WebMercatorProjection(ellipsoid) {
        this._ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);
        this._semimajorAxis = this._ellipsoid.maximumRadius;
        this._oneOverSemimajorAxis = 1.0 / this._semimajorAxis;
    }

    defineProperties(WebMercatorProjection.prototype, {
        /**
         * Gets the {@link Ellipsoid}.
         *
         * @memberof WebMercatorProjection.prototype
         *
         * @type {Ellipsoid}
         * @readonly
         */
        ellipsoid : {
            get : function() {
                return this._ellipsoid;
            }
        }
    });

    /**
     * Converts a Mercator angle, in the range -PI to PI, to a geodetic latitude
     * in the range -PI/2 to PI/2.
     *
     * @param {Number} mercatorAngle The angle to convert.
     * @returns {Number} The geodetic latitude in radians.
     */
    WebMercatorProjection.mercatorAngleToGeodeticLatitude = function(mercatorAngle) {
        return CesiumMath.PI_OVER_TWO - (2.0 * Math.atan(Math.exp(-mercatorAngle)));
    };

    /**
     * Converts a geodetic latitude in radians, in the range -PI/2 to PI/2, to a Mercator
     * angle in the range -PI to PI.
     *
     * @param {Number} latitude The geodetic latitude in radians.
     * @returns {Number} The Mercator angle.
     */
    WebMercatorProjection.geodeticLatitudeToMercatorAngle = function(latitude) {
        // Clamp the latitude coordinate to the valid Mercator bounds.
        if (latitude > WebMercatorProjection.MaximumLatitude) {
            latitude = WebMercatorProjection.MaximumLatitude;
        } else if (latitude < -WebMercatorProjection.MaximumLatitude) {
            latitude = -WebMercatorProjection.MaximumLatitude;
        }
        var sinLatitude = Math.sin(latitude);
        return 0.5 * Math.log((1.0 + sinLatitude) / (1.0 - sinLatitude));
    };

    /**
     * The maximum latitude (both North and South) supported by a Web Mercator
     * (EPSG:3857) projection.  Technically, the Mercator projection is defined
     * for any latitude up to (but not including) 90 degrees, but it makes sense
     * to cut it off sooner because it grows exponentially with increasing latitude.
     * The logic behind this particular cutoff value, which is the one used by
     * Google Maps, Bing Maps, and Esri, is that it makes the projection
     * square.  That is, the rectangle is equal in the X and Y directions.
     *
     * The constant value is computed by calling:
     *    WebMercatorProjection.mercatorAngleToGeodeticLatitude(Math.PI)
     *
     * @type {Number}
     */
    WebMercatorProjection.MaximumLatitude = WebMercatorProjection.mercatorAngleToGeodeticLatitude(Math.PI);

    /**
     * Converts geodetic ellipsoid coordinates, in radians, to the equivalent Web Mercator
     * X, Y, Z coordinates expressed in meters and returned in a {@link Cartesian3}.  The height
     * is copied unmodified to the Z coordinate.
     *
     * @param {Cartographic} cartographic The cartographic coordinates in radians.
     * @param {Cartesian3} [result] The instance to which to copy the result, or undefined if a
     *        new instance should be created.
     * @returns {Cartesian3} The equivalent web mercator X, Y, Z coordinates, in meters.
     */
    WebMercatorProjection.prototype.project = function(cartographic, result) {
        var semimajorAxis = this._semimajorAxis;
        var x = cartographic.longitude * semimajorAxis;
        var y = WebMercatorProjection.geodeticLatitudeToMercatorAngle(cartographic.latitude) * semimajorAxis;
        var z = cartographic.height;

        if (!defined(result)) {
            return new Cartesian3(x, y, z);
        }

        result.x = x;
        result.y = y;
        result.z = z;
        return result;
    };

    /**
     * Converts Web Mercator X, Y coordinates, expressed in meters, to a {@link Cartographic}
     * containing geodetic ellipsoid coordinates.  The Z coordinate is copied unmodified to the
     * height.
     *
     * @param {Cartesian3} cartesian The web mercator Cartesian position to unrproject with height (z) in meters.
     * @param {Cartographic} [result] The instance to which to copy the result, or undefined if a
     *        new instance should be created.
     * @returns {Cartographic} The equivalent cartographic coordinates.
     */
    WebMercatorProjection.prototype.unproject = function(cartesian, result) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(cartesian)) {
            throw new DeveloperError('cartesian is required');
        }
        //>>includeEnd('debug');

        var oneOverEarthSemimajorAxis = this._oneOverSemimajorAxis;
        var longitude = cartesian.x * oneOverEarthSemimajorAxis;
        var latitude = WebMercatorProjection.mercatorAngleToGeodeticLatitude(cartesian.y * oneOverEarthSemimajorAxis);
        var height = cartesian.z;

        if (!defined(result)) {
            return new Cartographic(longitude, latitude, height);
        }

        result.longitude = longitude;
        result.latitude = latitude;
        result.height = height;
        return result;
    };

    module.exports= WebMercatorProjection;

},{"./Cartesian3":8,"./Cartographic":10,"./DeveloperError":13,"./Ellipsoid":14,"./Math":21,"./defaultValue":40,"./defineProperties":41,"./defined":42}],35:[function(require,module,exports){
var Cartesian2=require('./Cartesian2');
var defaultValue=require('./defaultValue');
var defined=require('./defined');
var defineProperties=require('./defineProperties');
var Ellipsoid=require('./Ellipsoid');
var Rectangle=require('./Rectangle');
var WebMercatorProjection=require('./WebMercatorProjection');

    'use strict';

    /**
     * A tiling scheme for geometry referenced to a {@link WebMercatorProjection}, EPSG:3857.  This is
     * the tiling scheme used by Google Maps, Microsoft Bing Maps, and most of ESRI ArcGIS Online.
     *
     * @alias WebMercatorTilingScheme
     * @constructor
     *
     * @param {Object} [options] Object with the following properties:
     * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.WGS84] The ellipsoid whose surface is being tiled. Defaults to
     * the WGS84 ellipsoid.
     * @param {Number} [options.numberOfLevelZeroTilesX=1] The number of tiles in the X direction at level zero of
     *        the tile tree.
     * @param {Number} [options.numberOfLevelZeroTilesY=1] The number of tiles in the Y direction at level zero of
     *        the tile tree.
     * @param {Cartesian2} [options.rectangleSouthwestInMeters] The southwest corner of the rectangle covered by the
     *        tiling scheme, in meters.  If this parameter or rectangleNortheastInMeters is not specified, the entire
     *        globe is covered in the longitude direction and an equal distance is covered in the latitude
     *        direction, resulting in a square projection.
     * @param {Cartesian2} [options.rectangleNortheastInMeters] The northeast corner of the rectangle covered by the
     *        tiling scheme, in meters.  If this parameter or rectangleSouthwestInMeters is not specified, the entire
     *        globe is covered in the longitude direction and an equal distance is covered in the latitude
     *        direction, resulting in a square projection.
     */
    function WebMercatorTilingScheme(options) {
        options = defaultValue(options, {});

        this._ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.WGS84);
        this._numberOfLevelZeroTilesX = defaultValue(options.numberOfLevelZeroTilesX, 1);
        this._numberOfLevelZeroTilesY = defaultValue(options.numberOfLevelZeroTilesY, 1);

        this._projection = new WebMercatorProjection(this._ellipsoid);

        if (defined(options.rectangleSouthwestInMeters) &&
            defined(options.rectangleNortheastInMeters)) {
            this._rectangleSouthwestInMeters = options.rectangleSouthwestInMeters;
            this._rectangleNortheastInMeters = options.rectangleNortheastInMeters;
        } else {
            var semimajorAxisTimesPi = this._ellipsoid.maximumRadius * Math.PI;
            this._rectangleSouthwestInMeters = new Cartesian2(-semimajorAxisTimesPi, -semimajorAxisTimesPi);
            this._rectangleNortheastInMeters = new Cartesian2(semimajorAxisTimesPi, semimajorAxisTimesPi);
        }

        var southwest = this._projection.unproject(this._rectangleSouthwestInMeters);
        var northeast = this._projection.unproject(this._rectangleNortheastInMeters);
        this._rectangle = new Rectangle(southwest.longitude, southwest.latitude,
                                  northeast.longitude, northeast.latitude);
    }

    defineProperties(WebMercatorTilingScheme.prototype, {
        /**
         * Gets the ellipsoid that is tiled by this tiling scheme.
         * @memberof WebMercatorTilingScheme.prototype
         * @type {Ellipsoid}
         */
        ellipsoid : {
            get : function() {
                return this._ellipsoid;
            }
        },

        /**
         * Gets the rectangle, in radians, covered by this tiling scheme.
         * @memberof WebMercatorTilingScheme.prototype
         * @type {Rectangle}
         */
        rectangle : {
            get : function() {
                return this._rectangle;
            }
        },

        /**
         * Gets the map projection used by this tiling scheme.
         * @memberof WebMercatorTilingScheme.prototype
         * @type {MapProjection}
         */
        projection : {
            get : function() {
                return this._projection;
            }
        }
    });

    /**
     * Gets the total number of tiles in the X direction at a specified level-of-detail.
     *
     * @param {Number} level The level-of-detail.
     * @returns {Number} The number of tiles in the X direction at the given level.
     */
    WebMercatorTilingScheme.prototype.getNumberOfXTilesAtLevel = function(level) {
        return this._numberOfLevelZeroTilesX << level;
    };

    /**
     * Gets the total number of tiles in the Y direction at a specified level-of-detail.
     *
     * @param {Number} level The level-of-detail.
     * @returns {Number} The number of tiles in the Y direction at the given level.
     */
    WebMercatorTilingScheme.prototype.getNumberOfYTilesAtLevel = function(level) {
        return this._numberOfLevelZeroTilesY << level;
    };

    /**
     * Transforms a rectangle specified in geodetic radians to the native coordinate system
     * of this tiling scheme.
     *
     * @param {Rectangle} rectangle The rectangle to transform.
     * @param {Rectangle} [result] The instance to which to copy the result, or undefined if a new instance
     *        should be created.
     * @returns {Rectangle} The specified 'result', or a new object containing the native rectangle if 'result'
     *          is undefined.
     */
    WebMercatorTilingScheme.prototype.rectangleToNativeRectangle = function(rectangle, result) {
        var projection = this._projection;
        var southwest = projection.project(Rectangle.southwest(rectangle));
        var northeast = projection.project(Rectangle.northeast(rectangle));

        if (!defined(result)) {
            return new Rectangle(southwest.x, southwest.y, northeast.x, northeast.y);
        }

        result.west = southwest.x;
        result.south = southwest.y;
        result.east = northeast.x;
        result.north = northeast.y;
        return result;
    };

    /**
     * Converts tile x, y coordinates and level to a rectangle expressed in the native coordinates
     * of the tiling scheme.
     *
     * @param {Number} x The integer x coordinate of the tile.
     * @param {Number} y The integer y coordinate of the tile.
     * @param {Number} level The tile level-of-detail.  Zero is the least detailed.
     * @param {Object} [result] The instance to which to copy the result, or undefined if a new instance
     *        should be created.
     * @returns {Rectangle} The specified 'result', or a new object containing the rectangle
     *          if 'result' is undefined.
     */
    WebMercatorTilingScheme.prototype.tileXYToNativeRectangle = function(x, y, level, result) {
        var xTiles = this.getNumberOfXTilesAtLevel(level);
        var yTiles = this.getNumberOfYTilesAtLevel(level);

        var xTileWidth = (this._rectangleNortheastInMeters.x - this._rectangleSouthwestInMeters.x) / xTiles;
        var west = this._rectangleSouthwestInMeters.x + x * xTileWidth;
        var east = this._rectangleSouthwestInMeters.x + (x + 1) * xTileWidth;

        var yTileHeight = (this._rectangleNortheastInMeters.y - this._rectangleSouthwestInMeters.y) / yTiles;
        var north = this._rectangleNortheastInMeters.y - y * yTileHeight;
        var south = this._rectangleNortheastInMeters.y - (y + 1) * yTileHeight;

        if (!defined(result)) {
            return new Rectangle(west, south, east, north);
        }

        result.west = west;
        result.south = south;
        result.east = east;
        result.north = north;
        return result;
    };

    /**
     * Converts tile x, y coordinates and level to a cartographic rectangle in radians.
     *
     * @param {Number} x The integer x coordinate of the tile.
     * @param {Number} y The integer y coordinate of the tile.
     * @param {Number} level The tile level-of-detail.  Zero is the least detailed.
     * @param {Object} [result] The instance to which to copy the result, or undefined if a new instance
     *        should be created.
     * @returns {Rectangle} The specified 'result', or a new object containing the rectangle
     *          if 'result' is undefined.
     */
    WebMercatorTilingScheme.prototype.tileXYToRectangle = function(x, y, level, result) {
        var nativeRectangle = this.tileXYToNativeRectangle(x, y, level, result);

        var projection = this._projection;
        var southwest = projection.unproject(new Cartesian2(nativeRectangle.west, nativeRectangle.south));
        var northeast = projection.unproject(new Cartesian2(nativeRectangle.east, nativeRectangle.north));

        nativeRectangle.west = southwest.longitude;
        nativeRectangle.south = southwest.latitude;
        nativeRectangle.east = northeast.longitude;
        nativeRectangle.north = northeast.latitude;
        return nativeRectangle;
    };

    /**
     * Calculates the tile x, y coordinates of the tile containing
     * a given cartographic position.
     *
     * @param {Cartographic} position The position.
     * @param {Number} level The tile level-of-detail.  Zero is the least detailed.
     * @param {Cartesian2} [result] The instance to which to copy the result, or undefined if a new instance
     *        should be created.
     * @returns {Cartesian2} The specified 'result', or a new object containing the tile x, y coordinates
     *          if 'result' is undefined.
     */
    WebMercatorTilingScheme.prototype.positionToTileXY = function(position, level, result) {
        var rectangle = this._rectangle;
        if (!Rectangle.contains(rectangle, position)) {
            // outside the bounds of the tiling scheme
            return undefined;
        }

        var xTiles = this.getNumberOfXTilesAtLevel(level);
        var yTiles = this.getNumberOfYTilesAtLevel(level);

        var overallWidth = this._rectangleNortheastInMeters.x - this._rectangleSouthwestInMeters.x;
        var xTileWidth = overallWidth / xTiles;
        var overallHeight = this._rectangleNortheastInMeters.y - this._rectangleSouthwestInMeters.y;
        var yTileHeight = overallHeight / yTiles;

        var projection = this._projection;

        var webMercatorPosition = projection.project(position);
        var distanceFromWest = webMercatorPosition.x - this._rectangleSouthwestInMeters.x;
        var distanceFromNorth = this._rectangleNortheastInMeters.y - webMercatorPosition.y;

        var xTileCoordinate = distanceFromWest / xTileWidth | 0;
        if (xTileCoordinate >= xTiles) {
            xTileCoordinate = xTiles - 1;
        }
        var yTileCoordinate = distanceFromNorth / yTileHeight | 0;
        if (yTileCoordinate >= yTiles) {
            yTileCoordinate = yTiles - 1;
        }

        if (!defined(result)) {
            return new Cartesian2(xTileCoordinate, yTileCoordinate);
        }

        result.x = xTileCoordinate;
        result.y = yTileCoordinate;
        return result;
    };

    module.exports= WebMercatorTilingScheme;

},{"./Cartesian2":7,"./Ellipsoid":14,"./Rectangle":22,"./WebMercatorProjection":34,"./defaultValue":40,"./defineProperties":41,"./defined":42}],36:[function(require,module,exports){

    'use strict';

    /**
     * @private
     */
    function appendForwardSlash(url) {
        if (url.length === 0 || url[url.length - 1] !== '/') {
            url = url + '/';
        }
        return url;
    }

    module.exports= appendForwardSlash;

},{}],37:[function(require,module,exports){
var defined=require('./defined');
var DeveloperError=require('./DeveloperError');
var getAbsoluteUri=require('./getAbsoluteUri');
var Resource=require('./Resource');
// var require=require('require'); 

    'use strict';
    /*global CESIUM_BASE_URL*/

    var cesiumScriptRegex = /((?:.*\/)|^)cesium[\w-]*\.js(?:\W|$)/i;
    function getBaseUrlFromCesiumScript() {
        var scripts = document.getElementsByTagName('script');
        for ( var i = 0, len = scripts.length; i < len; ++i) {
            var src = scripts[i].getAttribute('src');
            var result = cesiumScriptRegex.exec(src);
            if (result !== null) {
                return result[1];
            }
        }
        return undefined;
    }

    var a;
    function tryMakeAbsolute(url) {
        if (typeof document === 'undefined') {
            //Node.js and Web Workers. In both cases, the URL will already be absolute.
            return url;
        }

        if (!defined(a)) {
            a = document.createElement('a');
        }
        a.href = url;

        // IE only absolutizes href on get, not set
        a.href = a.href; // eslint-disable-line no-self-assign
        return a.href;
    }

    var baseResource;
    function getCesiumBaseUrl() {
        if (defined(baseResource)) {
            return baseResource;
        }

        var baseUrlString;
        if (typeof CESIUM_BASE_URL !== 'undefined') {
            baseUrlString = CESIUM_BASE_URL;
        } else if (defined(define.amd) && !define.amd.toUrlUndefined && defined(require.toUrl)) {
            baseUrlString = getAbsoluteUri('..', buildModuleUrl('Core/buildModuleUrl.js'));
        } else {
            baseUrlString = getBaseUrlFromCesiumScript();
        }

        //>>includeStart('debug', pragmas.debug);
        if (!defined(baseUrlString)) {
            throw new DeveloperError('Unable to determine Cesium base URL automatically, try defining a global variable called CESIUM_BASE_URL.');
        }
        //>>includeEnd('debug');

        baseResource = new Resource({
            url: tryMakeAbsolute(baseUrlString)
        });
        baseResource.appendForwardSlash();

        return baseResource;
    }

    function buildModuleUrlFromRequireToUrl(moduleID) {
        //moduleID will be non-relative, so require it relative to this module, in Core.
        return tryMakeAbsolute(require.toUrl('../' + moduleID));
    }

    function buildModuleUrlFromBaseUrl(moduleID) {
        var resource = getCesiumBaseUrl().getDerivedResource({
            url: moduleID
        });
        return resource.url;
    }

    var implementation;

    /**
     * Given a non-relative moduleID, returns an absolute URL to the file represented by that module ID,
     * using, in order of preference, require.toUrl, the value of a global CESIUM_BASE_URL, or
     * the base URL of the Cesium.js script.
     *
     * @private
     */
    function buildModuleUrl(moduleID) {
        if (!defined(implementation)) {
            //select implementation
            if (defined(define.amd) && !define.amd.toUrlUndefined && defined(require.toUrl)) {
                implementation = buildModuleUrlFromRequireToUrl;
            } else {
                implementation = buildModuleUrlFromBaseUrl;
            }
        }

        var url = implementation(moduleID);
        return url;
    }

    // exposed for testing
    buildModuleUrl._cesiumScriptRegex = cesiumScriptRegex;
    buildModuleUrl._buildModuleUrlFromBaseUrl = buildModuleUrlFromBaseUrl;
    buildModuleUrl._clearBaseResource = function() {
        baseResource = undefined;
    };

    /**
     * Sets the base URL for resolving modules.
     * @param {String} value The new base URL.
     */
    buildModuleUrl.setBaseUrl = function(value) {
        baseResource = Resource.DEFAULT.getDerivedResource({
            url: value
        });
    };

    /**
     * Gets the base URL for resolving modules.
     */
    buildModuleUrl.getCesiumBaseUrl = getCesiumBaseUrl;

    module.exports= buildModuleUrl;

},{"./DeveloperError":13,"./Resource":28,"./defined":42,"./getAbsoluteUri":46}],38:[function(require,module,exports){
var defaultValue=require('./defaultValue');

    'use strict';

    /**
     * Clones an object, returning a new object containing the same properties.
     *
     * @exports clone
     *
     * @param {Object} object The object to clone.
     * @param {Boolean} [deep=false] If true, all properties will be deep cloned recursively.
     * @returns {Object} The cloned object.
     */
    function clone(object, deep) {
        if (object === null || typeof object !== 'object') {
            return object;
        }

        deep = defaultValue(deep, false);

        var result = new object.constructor();
        for ( var propertyName in object) {
            if (object.hasOwnProperty(propertyName)) {
                var value = object[propertyName];
                if (deep) {
                    value = clone(value, deep);
                }
                result[propertyName] = value;
            }
        }

        return result;
    }

    module.exports= clone;

},{"./defaultValue":40}],39:[function(require,module,exports){
var defaultValue=require('./defaultValue');
var defined=require('./defined');

    'use strict';

    /**
     * Merges two objects, copying their properties onto a new combined object. When two objects have the same
     * property, the value of the property on the first object is used.  If either object is undefined,
     * it will be treated as an empty object.
     *
     * @example
     * var object1 = {
     *     propOne : 1,
     *     propTwo : {
     *         value1 : 10
     *     }
     * }
     * var object2 = {
     *     propTwo : 2
     * }
     * var final = Cesium.combine(object1, object2);
     *
     * // final === {
     * //     propOne : 1,
     * //     propTwo : {
     * //         value1 : 10
     * //     }
     * // }
     *
     * @param {Object} [object1] The first object to merge.
     * @param {Object} [object2] The second object to merge.
     * @param {Boolean} [deep=false] Perform a recursive merge.
     * @returns {Object} The combined object containing all properties from both objects.
     *
     * @exports combine
     */
    function combine(object1, object2, deep) {
        deep = defaultValue(deep, false);

        var result = {};

        var object1Defined = defined(object1);
        var object2Defined = defined(object2);
        var property;
        var object1Value;
        var object2Value;
        if (object1Defined) {
            for (property in object1) {
                if (object1.hasOwnProperty(property)) {
                    object1Value = object1[property];
                    if (object2Defined && deep && typeof object1Value === 'object' && object2.hasOwnProperty(property)) {
                        object2Value = object2[property];
                        if (typeof object2Value === 'object') {
                            result[property] = combine(object1Value, object2Value, deep);
                        } else {
                            result[property] = object1Value;
                        }
                    } else {
                        result[property] = object1Value;
                    }
                }
            }
        }
        if (object2Defined) {
            for (property in object2) {
                if (object2.hasOwnProperty(property) && !result.hasOwnProperty(property)) {
                    object2Value = object2[property];
                    result[property] = object2Value;
                }
            }
        }
        return result;
    }

    module.exports= combine;

},{"./defaultValue":40,"./defined":42}],40:[function(require,module,exports){
var freezeObject=require('./freezeObject');

    'use strict';

    /**
     * Returns the first parameter if not undefined, otherwise the second parameter.
     * Useful for setting a default value for a parameter.
     *
     * @exports defaultValue
     *
     * @param {*} a
     * @param {*} b
     * @returns {*} Returns the first parameter if not undefined, otherwise the second parameter.
     *
     * @example
     * param = Cesium.defaultValue(param, 'default');
     */
    function defaultValue(a, b) {
        if (a !== undefined && a !== null) {
            return a;
        }
        return b;
    }

    /**
     * A frozen empty object that can be used as the default value for options passed as
     * an object literal.
     * @type {Object}
     */
    defaultValue.EMPTY_OBJECT = freezeObject({});

    module.exports= defaultValue;

},{"./freezeObject":45}],41:[function(require,module,exports){
var defined=require('./defined');

    'use strict';

    var definePropertyWorks = (function() {
        try {
            return 'x' in Object.defineProperty({}, 'x', {});
        } catch (e) {
            return false;
        }
    })();

    /**
     * Defines properties on an object, using Object.defineProperties if available,
     * otherwise returns the object unchanged.  This function should be used in
     * setup code to prevent errors from completely halting JavaScript execution
     * in legacy browsers.
     *
     * @private
     *
     * @exports defineProperties
     */
    var defineProperties = Object.defineProperties;
    if (!definePropertyWorks || !defined(defineProperties)) {
        defineProperties = function(o) {
            return o;
        };
    }

    module.exports= defineProperties;

},{"./defined":42}],42:[function(require,module,exports){

    'use strict';

    /**
     * @exports defined
     *
     * @param {*} value The object.
     * @returns {Boolean} Returns true if the object is defined, returns false otherwise.
     *
     * @example
     * if (Cesium.defined(positions)) {
     *      doSomething();
     * } else {
     *      doSomethingElse();
     * }
     */
    function defined(value) {
        return value !== undefined && value !== null;
    }

    module.exports= defined;

},{}],43:[function(require,module,exports){
var defined=require('./defined');
var DeveloperError=require('./DeveloperError');
var oneTimeWarning=require('./oneTimeWarning');

    'use strict';

    /**
     * Logs a deprecation message to the console.  Use this function instead of
     * <code>console.log</code> directly since this does not log duplicate messages
     * unless it is called from multiple workers.
     *
     * @exports deprecationWarning
     *
     * @param {String} identifier The unique identifier for this deprecated API.
     * @param {String} message The message to log to the console.
     *
     * @example
     * // Deprecated function or class
     * function Foo() {
     *    deprecationWarning('Foo', 'Foo was deprecated in Cesium 1.01.  It will be removed in 1.03.  Use newFoo instead.');
     *    // ...
     * }
     *
     * // Deprecated function
     * Bar.prototype.func = function() {
     *    deprecationWarning('Bar.func', 'Bar.func() was deprecated in Cesium 1.01.  It will be removed in 1.03.  Use Bar.newFunc() instead.');
     *    // ...
     * };
     *
     * // Deprecated property
     * defineProperties(Bar.prototype, {
     *     prop : {
     *         get : function() {
     *             deprecationWarning('Bar.prop', 'Bar.prop was deprecated in Cesium 1.01.  It will be removed in 1.03.  Use Bar.newProp instead.');
     *             // ...
     *         },
     *         set : function(value) {
     *             deprecationWarning('Bar.prop', 'Bar.prop was deprecated in Cesium 1.01.  It will be removed in 1.03.  Use Bar.newProp instead.');
     *             // ...
     *         }
     *     }
     * });
     *
     * @private
     */
    function deprecationWarning(identifier, message) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(identifier) || !defined(message)) {
            throw new DeveloperError('identifier and message are required.');
        }
        //>>includeEnd('debug');

        oneTimeWarning(identifier, message);
    }

    module.exports= deprecationWarning;

},{"./DeveloperError":13,"./defined":42,"./oneTimeWarning":55}],44:[function(require,module,exports){
var defaultValue=require('./defaultValue');
var DeveloperError=require('./DeveloperError');

    'use strict';

    function returnTrue() {
        return true;
    }

    /**
     * Destroys an object.  Each of the object's functions, including functions in its prototype,
     * is replaced with a function that throws a {@link DeveloperError}, except for the object's
     * <code>isDestroyed</code> function, which is set to a function that returns <code>true</code>.
     * The object's properties are removed with <code>delete</code>.
     * <br /><br />
     * This function is used by objects that hold native resources, e.g., WebGL resources, which
     * need to be explicitly released.  Client code calls an object's <code>destroy</code> function,
     * which then releases the native resource and calls <code>destroyObject</code> to put itself
     * in a destroyed state.
     *
     * @exports destroyObject
     *
     * @param {Object} object The object to destroy.
     * @param {String} [message] The message to include in the exception that is thrown if
     *                           a destroyed object's function is called.
     *
     *
     * @example
     * // How a texture would destroy itself.
     * this.destroy = function () {
     *     _gl.deleteTexture(_texture);
     *     return Cesium.destroyObject(this);
     * };
     *
     * @see DeveloperError
     */
    function destroyObject(object, message) {
        message = defaultValue(message, 'This object was destroyed, i.e., destroy() was called.');

        function throwOnDestroyed() {
            //>>includeStart('debug', pragmas.debug);
            throw new DeveloperError(message);
            //>>includeEnd('debug');
        }

        for ( var key in object) {
            if (typeof object[key] === 'function') {
                object[key] = throwOnDestroyed;
            }
        }

        object.isDestroyed = returnTrue;

        return undefined;
    }

    module.exports= destroyObject;

},{"./DeveloperError":13,"./defaultValue":40}],45:[function(require,module,exports){
var defined=require('./defined');

    'use strict';

    /**
     * Freezes an object, using Object.freeze if available, otherwise returns
     * the object unchanged.  This function should be used in setup code to prevent
     * errors from completely halting JavaScript execution in legacy browsers.
     *
     * @private
     *
     * @exports freezeObject
     */
    var freezeObject = Object.freeze;
    if (!defined(freezeObject)) {
        freezeObject = function(o) {
            return o;
        };
    }

    module.exports= freezeObject;

},{"./defined":42}],46:[function(require,module,exports){
var Uri=require('uri');
var defaultValue=require('./defaultValue');
var defined=require('./defined');
var DeveloperError=require('./DeveloperError');

    'use strict';

    /**
     * Given a relative Uri and a base Uri, returns the absolute Uri of the relative Uri.
     * @exports getAbsoluteUri
     *
     * @param {String} relative The relative Uri.
     * @param {String} [base] The base Uri.
     * @returns {String} The absolute Uri of the given relative Uri.
     *
     * @example
     * //absolute Uri will be "https://test.com/awesome.png";
     * var absoluteUri = Cesium.getAbsoluteUri('awesome.png', 'https://test.com');
     */
    function getAbsoluteUri(relative, base) {
        var documentObject;
        if (typeof document !== 'undefined') {
            documentObject = document;
        }

        return getAbsoluteUri._implementation(relative, base, documentObject);
    }

    getAbsoluteUri._implementation = function(relative, base, documentObject) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(relative)) {
            throw new DeveloperError('relative uri is required.');
        }
        //>>includeEnd('debug');

        if (!defined(base)) {
            if (typeof documentObject === 'undefined') {
                return relative;
            }
            base = defaultValue(documentObject.baseURI, documentObject.location.href);
        }

        var baseUri = new Uri(base);
        var relativeUri = new Uri(relative);
        return relativeUri.resolve(baseUri).toString();
    };

    module.exports= getAbsoluteUri;

},{"./DeveloperError":13,"./defaultValue":40,"./defined":42,"uri":undefined}],47:[function(require,module,exports){
var Uri=require('uri');
var defined=require('./defined');
var DeveloperError=require('./DeveloperError');

    'use strict';

    /**
     * Given a URI, returns the base path of the URI.
     * @exports getBaseUri
     *
     * @param {String} uri The Uri.
     * @param {Boolean} [includeQuery = false] Whether or not to include the query string and fragment form the uri
     * @returns {String} The base path of the Uri.
     *
     * @example
     * // basePath will be "/Gallery/";
     * var basePath = Cesium.getBaseUri('/Gallery/simple.czml?value=true&example=false');
     *
     * // basePath will be "/Gallery/?value=true&example=false";
     * var basePath = Cesium.getBaseUri('/Gallery/simple.czml?value=true&example=false', true);
     */
    function getBaseUri(uri, includeQuery) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(uri)) {
            throw new DeveloperError('uri is required.');
        }
        //>>includeEnd('debug');

        var basePath = '';
        var i = uri.lastIndexOf('/');
        if (i !== -1) {
            basePath = uri.substring(0, i + 1);
        }

        if (!includeQuery) {
            return basePath;
        }

        uri = new Uri(uri);
        if (defined(uri.query)) {
            basePath += '?' + uri.query;
        }
        if (defined(uri.fragment)){
            basePath += '#' + uri.fragment;
        }

        return basePath;
    }

    module.exports= getBaseUri;

},{"./DeveloperError":13,"./defined":42,"uri":undefined}],48:[function(require,module,exports){
var Uri=require('uri');
var defined=require('./defined');
var DeveloperError=require('./DeveloperError');

    'use strict';

    /**
     * Given a URI, returns the extension of the URI.
     * @exports getExtensionFromUri
     *
     * @param {String} uri The Uri.
     * @returns {String} The extension of the Uri.
     *
     * @example
     * //extension will be "czml";
     * var extension = Cesium.getExtensionFromUri('/Gallery/simple.czml?value=true&example=false');
     */
    function getExtensionFromUri(uri) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(uri)) {
            throw new DeveloperError('uri is required.');
        }
        //>>includeEnd('debug');

        var uriObject = new Uri(uri);
        uriObject.normalize();
        var path = uriObject.path;
        var index = path.lastIndexOf('/');
        if (index !== -1) {
            path = path.substr(index + 1);
        }
        index = path.lastIndexOf('.');
        if (index === -1) {
            path = '';
        } else {
            path = path.substr(index + 1);
        }
        return path;
    }

    module.exports= getExtensionFromUri;

},{"./DeveloperError":13,"./defined":42,"uri":undefined}],49:[function(require,module,exports){
var defined=require('./defined');

    'use strict';

    /**
     * Tests an object to see if it is an array.
     * @exports isArray
     *
     * @param {*} value The value to test.
     * @returns {Boolean} true if the value is an array, false otherwise.
     */
    var isArray = Array.isArray;
    if (!defined(isArray)) {
        isArray = function(value) {
            return Object.prototype.toString.call(value) === '[object Array]';
        };
    }

    module.exports= isArray;

},{"./defined":42}],50:[function(require,module,exports){
var Check=require('./Check');

    'use strict';

    var blobUriRegex = /^blob:/i;

    /**
     * Determines if the specified uri is a blob uri.
     *
     * @exports isBlobUri
     *
     * @param {String} uri The uri to test.
     * @returns {Boolean} true when the uri is a blob uri; otherwise, false.
     *
     * @private
     */
    function isBlobUri(uri) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.string('uri', uri);
        //>>includeEnd('debug');

        return blobUriRegex.test(uri);
    }

    module.exports= isBlobUri;

},{"./Check":11}],51:[function(require,module,exports){
var defined=require('./defined');

    'use strict';

    var a;

    /**
     * Given a URL, determine whether that URL is considered cross-origin to the current page.
     *
     * @private
     */
    function isCrossOriginUrl(url) {
        if (!defined(a)) {
            a = document.createElement('a');
        }

        // copy window location into the anchor to get consistent results
        // when the port is default for the protocol (e.g. 80 for HTTP)
        a.href = window.location.href;

        // host includes both hostname and port if the port is not standard
        var host = a.host;
        var protocol = a.protocol;

        a.href = url;
        // IE only absolutizes href on get, not set
        a.href = a.href; // eslint-disable-line no-self-assign

        return protocol !== a.protocol || host !== a.host;
    }

    module.exports= isCrossOriginUrl;

},{"./defined":42}],52:[function(require,module,exports){
var Check=require('./Check');

    'use strict';

    var dataUriRegex = /^data:/i;

    /**
     * Determines if the specified uri is a data uri.
     *
     * @exports isDataUri
     *
     * @param {String} uri The uri to test.
     * @returns {Boolean} true when the uri is a data uri; otherwise, false.
     *
     * @private
     */
    function isDataUri(uri) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.string('uri', uri);
        //>>includeEnd('debug');

        return dataUriRegex.test(uri);
    }

    module.exports= isDataUri;

},{"./Check":11}],53:[function(require,module,exports){
var when=require('when');

        'use strict';

    /**
     * @private
     */
    function loadAndExecuteScript(url) {
        var deferred = when.defer();
        var script = document.createElement('script');
        script.async = true;
        script.src = url;

        var head = document.getElementsByTagName('head')[0];
        script.onload = function() {
            script.onload = undefined;
            head.removeChild(script);
            deferred.resolve();
        };
        script.onerror = function(e) {
            deferred.reject(e);
        };

        head.appendChild(script);

        return deferred.promise;
    }

    module.exports= loadAndExecuteScript;

},{"when":undefined}],54:[function(require,module,exports){
var defined=require('./defined');
var DeveloperError=require('./DeveloperError');
var isArray=require('./isArray');

    'use strict';

    /**
     * Converts an object representing a set of name/value pairs into a query string,
     * with names and values encoded properly for use in a URL.  Values that are arrays
     * will produce multiple values with the same name.
     * @exports objectToQuery
     *
     * @param {Object} obj The object containing data to encode.
     * @returns {String} An encoded query string.
     *
     *
     * @example
     * var str = Cesium.objectToQuery({
     *     key1 : 'some value',
     *     key2 : 'a/b',
     *     key3 : ['x', 'y']
     * });
     *
     * @see queryToObject
     * // str will be:
     * // 'key1=some%20value&key2=a%2Fb&key3=x&key3=y'
     */
    function objectToQuery(obj) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(obj)) {
            throw new DeveloperError('obj is required.');
        }
        //>>includeEnd('debug');

        var result = '';
        for ( var propName in obj) {
            if (obj.hasOwnProperty(propName)) {
                var value = obj[propName];

                var part = encodeURIComponent(propName) + '=';
                if (isArray(value)) {
                    for (var i = 0, len = value.length; i < len; ++i) {
                        result += part + encodeURIComponent(value[i]) + '&';
                    }
                } else {
                    result += part + encodeURIComponent(value) + '&';
                }
            }
        }

        // trim last &
        result = result.slice(0, -1);

        // This function used to replace %20 with + which is more compact and readable.
        // However, some servers didn't properly handle + as a space.
        // https://github.com/AnalyticalGraphicsInc/cesium/issues/2192

        return result;
    }

    module.exports= objectToQuery;

},{"./DeveloperError":13,"./defined":42,"./isArray":49}],55:[function(require,module,exports){
var defaultValue=require('./defaultValue');
var defined=require('./defined');
var DeveloperError=require('./DeveloperError');

    'use strict';

    var warnings = {};

    /**
     * Logs a one time message to the console.  Use this function instead of
     * <code>console.log</code> directly since this does not log duplicate messages
     * unless it is called from multiple workers.
     *
     * @exports oneTimeWarning
     *
     * @param {String} identifier The unique identifier for this warning.
     * @param {String} [message=identifier] The message to log to the console.
     *
     * @example
     * for(var i=0;i<foo.length;++i) {
     *    if (!defined(foo[i].bar)) {
     *       // Something that can be recovered from but may happen a lot
     *       oneTimeWarning('foo.bar undefined', 'foo.bar is undefined. Setting to 0.');
     *       foo[i].bar = 0;
     *       // ...
     *    }
     * }
     *
     * @private
     */
    function oneTimeWarning(identifier, message) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(identifier)) {
            throw new DeveloperError('identifier is required.');
        }
        //>>includeEnd('debug');

        if (!defined(warnings[identifier])) {
            warnings[identifier] = true;
            console.warn(defaultValue(message, identifier));
        }
    }

    oneTimeWarning.geometryOutlines = 'Entity geometry outlines are unsupported on terrain. Outlines will be disabled. To enable outlines, disable geometry terrain clamping by explicitly setting height to 0.';

    oneTimeWarning.geometryZIndex = 'Entity geometry with zIndex are unsupported when height or extrudedHeight are defined.  zIndex will be ignored';

    oneTimeWarning.geometryHeightReference = 'Entity corridor, ellipse, polygon or rectangle with heightReference must also have a defined height.  heightReference will be ignored';
    oneTimeWarning.geometryExtrudedHeightReference = 'Entity corridor, ellipse, polygon or rectangle with extrudedHeightReference must also have a defined extrudedHeight.  extrudedHeightReference will be ignored';

    module.exports= oneTimeWarning;

},{"./DeveloperError":13,"./defaultValue":40,"./defined":42}],56:[function(require,module,exports){

    'use strict';

    /**
     * Parses the result of XMLHttpRequest's getAllResponseHeaders() method into
     * a dictionary.
     *
     * @exports parseResponseHeaders
     *
     * @param {String} headerString The header string returned by getAllResponseHeaders().  The format is
     *                 described here: http://www.w3.org/TR/XMLHttpRequest/#the-getallresponseheaders()-method
     * @returns {Object} A dictionary of key/value pairs, where each key is the name of a header and the corresponding value
     *                   is that header's value.
     *
     * @private
     */
    function parseResponseHeaders(headerString) {
        var headers = {};

        if (!headerString) {
          return headers;
        }

        var headerPairs = headerString.split('\u000d\u000a');

        for (var i = 0; i < headerPairs.length; ++i) {
          var headerPair = headerPairs[i];
          // Can't use split() here because it does the wrong thing
          // if the header value has the string ": " in it.
          var index = headerPair.indexOf('\u003a\u0020');
          if (index > 0) {
            var key = headerPair.substring(0, index);
            var val = headerPair.substring(index + 2);
            headers[key] = val;
          }
        }

        return headers;
    }

    module.exports= parseResponseHeaders;

},{}],57:[function(require,module,exports){
var defined=require('./defined');
var DeveloperError=require('./DeveloperError');
var isArray=require('./isArray');

    'use strict';

    /**
     * Parses a query string into an object, where the keys and values of the object are the
     * name/value pairs from the query string, decoded. If a name appears multiple times,
     * the value in the object will be an array of values.
     * @exports queryToObject
     *
     * @param {String} queryString The query string.
     * @returns {Object} An object containing the parameters parsed from the query string.
     *
     *
     * @example
     * var obj = Cesium.queryToObject('key1=some%20value&key2=a%2Fb&key3=x&key3=y');
     * // obj will be:
     * // {
     * //   key1 : 'some value',
     * //   key2 : 'a/b',
     * //   key3 : ['x', 'y']
     * // }
     *
     * @see objectToQuery
     */
    function queryToObject(queryString) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(queryString)) {
            throw new DeveloperError('queryString is required.');
        }
        //>>includeEnd('debug');

        var result = {};
        if (queryString === '') {
            return result;
        }
        var parts = queryString.replace(/\+/g, '%20').split(/[&;]/);
        for (var i = 0, len = parts.length; i < len; ++i) {
            var subparts = parts[i].split('=');

            var name = decodeURIComponent(subparts[0]);
            var value = subparts[1];
            if (defined(value)) {
                value = decodeURIComponent(value);
            } else {
                value = '';
            }

            var resultValue = result[name];
            if (typeof resultValue === 'string') {
                // expand the single value to an array
                result[name] = [resultValue, value];
            } else if (isArray(resultValue)) {
                resultValue.push(value);
            } else {
                result[name] = value;
            }
        }
        return result;
    }

    module.exports= queryToObject;

},{"./DeveloperError":13,"./defined":42,"./isArray":49}],58:[function(require,module,exports){
var Cartesian3=require('./Cartesian3');
var defined=require('./defined');
var DeveloperError=require('./DeveloperError');
var CesiumMath=require('./Math');

    'use strict';

    var scaleToGeodeticSurfaceIntersection = new Cartesian3();
    var scaleToGeodeticSurfaceGradient = new Cartesian3();

    /**
     * Scales the provided Cartesian position along the geodetic surface normal
     * so that it is on the surface of this ellipsoid.  If the position is
     * at the center of the ellipsoid, this function returns undefined.
     *
     * @param {Cartesian3} cartesian The Cartesian position to scale.
     * @param {Cartesian3} oneOverRadii One over radii of the ellipsoid.
     * @param {Cartesian3} oneOverRadiiSquared One over radii squared of the ellipsoid.
     * @param {Number} centerToleranceSquared Tolerance for closeness to the center.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter, a new Cartesian3 instance if none was provided, or undefined if the position is at the center.
     *
     * @exports scaleToGeodeticSurface
     *
     * @private
     */
    function scaleToGeodeticSurface(cartesian, oneOverRadii, oneOverRadiiSquared, centerToleranceSquared, result) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(cartesian)) {
            throw new DeveloperError('cartesian is required.');
        }
        if (!defined(oneOverRadii)) {
            throw new DeveloperError('oneOverRadii is required.');
        }
        if (!defined(oneOverRadiiSquared)) {
            throw new DeveloperError('oneOverRadiiSquared is required.');
        }
        if (!defined(centerToleranceSquared)) {
            throw new DeveloperError('centerToleranceSquared is required.');
        }
        //>>includeEnd('debug');

        var positionX = cartesian.x;
        var positionY = cartesian.y;
        var positionZ = cartesian.z;

        var oneOverRadiiX = oneOverRadii.x;
        var oneOverRadiiY = oneOverRadii.y;
        var oneOverRadiiZ = oneOverRadii.z;

        var x2 = positionX * positionX * oneOverRadiiX * oneOverRadiiX;
        var y2 = positionY * positionY * oneOverRadiiY * oneOverRadiiY;
        var z2 = positionZ * positionZ * oneOverRadiiZ * oneOverRadiiZ;

        // Compute the squared ellipsoid norm.
        var squaredNorm = x2 + y2 + z2;
        var ratio = Math.sqrt(1.0 / squaredNorm);

        // As an initial approximation, assume that the radial intersection is the projection point.
        var intersection = Cartesian3.multiplyByScalar(cartesian, ratio, scaleToGeodeticSurfaceIntersection);

        // If the position is near the center, the iteration will not converge.
        if (squaredNorm < centerToleranceSquared) {
            return !isFinite(ratio) ? undefined : Cartesian3.clone(intersection, result);
        }

        var oneOverRadiiSquaredX = oneOverRadiiSquared.x;
        var oneOverRadiiSquaredY = oneOverRadiiSquared.y;
        var oneOverRadiiSquaredZ = oneOverRadiiSquared.z;

        // Use the gradient at the intersection point in place of the true unit normal.
        // The difference in magnitude will be absorbed in the multiplier.
        var gradient = scaleToGeodeticSurfaceGradient;
        gradient.x = intersection.x * oneOverRadiiSquaredX * 2.0;
        gradient.y = intersection.y * oneOverRadiiSquaredY * 2.0;
        gradient.z = intersection.z * oneOverRadiiSquaredZ * 2.0;

        // Compute the initial guess at the normal vector multiplier, lambda.
        var lambda = (1.0 - ratio) * Cartesian3.magnitude(cartesian) / (0.5 * Cartesian3.magnitude(gradient));
        var correction = 0.0;

        var func;
        var denominator;
        var xMultiplier;
        var yMultiplier;
        var zMultiplier;
        var xMultiplier2;
        var yMultiplier2;
        var zMultiplier2;
        var xMultiplier3;
        var yMultiplier3;
        var zMultiplier3;

        do {
            lambda -= correction;

            xMultiplier = 1.0 / (1.0 + lambda * oneOverRadiiSquaredX);
            yMultiplier = 1.0 / (1.0 + lambda * oneOverRadiiSquaredY);
            zMultiplier = 1.0 / (1.0 + lambda * oneOverRadiiSquaredZ);

            xMultiplier2 = xMultiplier * xMultiplier;
            yMultiplier2 = yMultiplier * yMultiplier;
            zMultiplier2 = zMultiplier * zMultiplier;

            xMultiplier3 = xMultiplier2 * xMultiplier;
            yMultiplier3 = yMultiplier2 * yMultiplier;
            zMultiplier3 = zMultiplier2 * zMultiplier;

            func = x2 * xMultiplier2 + y2 * yMultiplier2 + z2 * zMultiplier2 - 1.0;

            // "denominator" here refers to the use of this expression in the velocity and acceleration
            // computations in the sections to follow.
            denominator = x2 * xMultiplier3 * oneOverRadiiSquaredX + y2 * yMultiplier3 * oneOverRadiiSquaredY + z2 * zMultiplier3 * oneOverRadiiSquaredZ;

            var derivative = -2.0 * denominator;

            correction = func / derivative;
        } while (Math.abs(func) > CesiumMath.EPSILON12);

        if (!defined(result)) {
            return new Cartesian3(positionX * xMultiplier, positionY * yMultiplier, positionZ * zMultiplier);
        }
        result.x = positionX * xMultiplier;
        result.y = positionY * yMultiplier;
        result.z = positionZ * zMultiplier;
        return result;
    }

    module.exports= scaleToGeodeticSurface;

},{"./Cartesian3":8,"./DeveloperError":13,"./Math":21,"./defined":42}],59:[function(require,module,exports){
var measureText=require('../ThirdParty/measureText');
var Color=require('./Color');
var defaultValue=require('./defaultValue');
var defined=require('./defined');
var DeveloperError=require('./DeveloperError');

    'use strict';

    var imageSmoothingEnabledName;

    /**
     * Writes the given text into a new canvas.  The canvas will be sized to fit the text.
     * If text is blank, returns undefined.
     *
     * @param {String} text The text to write.
     * @param {Object} [options] Object with the following properties:
     * @param {String} [options.font='10px sans-serif'] The CSS font to use.
     * @param {String} [options.textBaseline='bottom'] The baseline of the text.
     * @param {Boolean} [options.fill=true] Whether to fill the text.
     * @param {Boolean} [options.stroke=false] Whether to stroke the text.
     * @param {Color} [options.fillColor=Color.WHITE] The fill color.
     * @param {Color} [options.strokeColor=Color.BLACK] The stroke color.
     * @param {Number} [options.strokeWidth=1] The stroke width.
     * @param {Color} [options.backgroundColor=Color.TRANSPARENT] The background color of the canvas.
     * @param {Number} [options.padding=0] The pixel size of the padding to add around the text.
     * @returns {Canvas} A new canvas with the given text drawn into it.  The dimensions object
     *                   from measureText will also be added to the returned canvas. If text is
     *                   blank, returns undefined.
     * @exports writeTextToCanvas
     */
    function writeTextToCanvas(text, options) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(text)) {
            throw new DeveloperError('text is required.');
        }
        //>>includeEnd('debug');
        if (text === '') {
            return undefined;
        }

        options = defaultValue(options, defaultValue.EMPTY_OBJECT);
        var font = defaultValue(options.font, '10px sans-serif');
        var stroke = defaultValue(options.stroke, false);
        var fill = defaultValue(options.fill, true);
        var strokeWidth = defaultValue(options.strokeWidth, 1);
        var backgroundColor = defaultValue(options.backgroundColor, Color.TRANSPARENT);
        var padding = defaultValue(options.padding, 0);
        var doublePadding = padding * 2.0;

        var canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        canvas.style.font = font;

        var context2D = canvas.getContext('2d');

        if (!defined(imageSmoothingEnabledName)) {
            if (defined(context2D.imageSmoothingEnabled)) {
                imageSmoothingEnabledName = 'imageSmoothingEnabled';
            } else if (defined(context2D.mozImageSmoothingEnabled)) {
                imageSmoothingEnabledName = 'mozImageSmoothingEnabled';
            } else if (defined(context2D.webkitImageSmoothingEnabled)) {
                imageSmoothingEnabledName = 'webkitImageSmoothingEnabled';
            } else if (defined(context2D.msImageSmoothingEnabled)) {
                imageSmoothingEnabledName = 'msImageSmoothingEnabled';
            }
        }

        context2D.font = font;
        context2D.lineJoin = 'round';
        context2D.lineWidth = strokeWidth;
        context2D[imageSmoothingEnabledName] = false;

        // textBaseline needs to be set before the measureText call. It won't work otherwise.
        // It's magic.
        context2D.textBaseline = defaultValue(options.textBaseline, 'bottom');

        // in order for measureText to calculate style, the canvas has to be
        // (temporarily) added to the DOM.
        canvas.style.visibility = 'hidden';
        document.body.appendChild(canvas);

        var dimensions = measureText(context2D, text, stroke, fill);
        canvas.dimensions = dimensions;

        document.body.removeChild(canvas);
        canvas.style.visibility = '';

        //Some characters, such as the letter j, have a non-zero starting position.
        //This value is used for kerning later, but we need to take it into account
        //now in order to draw the text completely on the canvas
        var x = -dimensions.bounds.minx;

        //Expand the width to include the starting position.
        var width = Math.ceil(dimensions.width) + x + doublePadding;

        //While the height of the letter is correct, we need to adjust
        //where we start drawing it so that letters like j and y properly dip
        //below the line.
        var height = dimensions.height + doublePadding;
        var baseline = height - dimensions.ascent + doublePadding;
        var y = height - baseline + doublePadding;

        canvas.width = width;
        canvas.height = height;

        // Properties must be explicitly set again after changing width and height
        context2D.font = font;
        context2D.lineJoin = 'round';
        context2D.lineWidth = strokeWidth;
        context2D[imageSmoothingEnabledName] = false;

        // Draw background
        if (backgroundColor !== Color.TRANSPARENT) {
            context2D.fillStyle = backgroundColor.toCssColorString();
            context2D.fillRect(0, 0, canvas.width, canvas.height);
        }

        if (stroke) {
            var strokeColor = defaultValue(options.strokeColor, Color.BLACK);
            context2D.strokeStyle = strokeColor.toCssColorString();
            context2D.strokeText(text, x + padding, y);
        }

        if (fill) {
            var fillColor = defaultValue(options.fillColor, Color.WHITE);
            context2D.fillStyle = fillColor.toCssColorString();
            context2D.fillText(text, x + padding, y);
        }

        return canvas;
    }

    module.exports= writeTextToCanvas;

},{"../ThirdParty/measureText":60,"./Color":12,"./DeveloperError":13,"./defaultValue":40,"./defined":42}],60:[function(require,module,exports){
/*
  This library rewrites the Canvas2D "measureText" function
  so that it returns a more complete metrics object.

** -----------------------------------------------------------------------------

  CHANGELOG:

    2012-01-21 - Whitespace handling added by Joe Turner
                 (https://github.com/oampo)

** -----------------------------------------------------------------------------
*/
/**
  @license
  fontmetrics.js - https://github.com/Pomax/fontmetrics.js

  Copyright (C) 2011 by Mike "Pomax" Kamermans

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
**/
// define(function() {
/*jshint strict:false*/
/*
  var NAME = "FontMetrics Library"
  var VERSION = "1-2012.0121.1300";

  // if there is no getComputedStyle, this library won't work.
  if(!document.defaultView.getComputedStyle) {
    throw("ERROR: 'document.defaultView.getComputedStyle' not found. This library only works in browsers that can report computed CSS values.");
  }

  // store the old text metrics function on the Canvas2D prototype
  CanvasRenderingContext2D.prototype.measureTextWidth = CanvasRenderingContext2D.prototype.measureText;
*/
/**
 *  shortcut function for getting computed CSS values
 */
var getCSSValue = function (element, property) {
  return document.defaultView.getComputedStyle(element, null).getPropertyValue(property);
};
/*
  // debug function
  var show = function(canvas, ctx, xstart, w, h, metrics)
  {
    document.body.appendChild(canvas);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';

    ctx.beginPath();
    ctx.moveTo(xstart,0);
    ctx.lineTo(xstart,h);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(xstart+metrics.bounds.maxx,0);
    ctx.lineTo(xstart+metrics.bounds.maxx,h);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0,h/2-metrics.ascent);
    ctx.lineTo(w,h/2-metrics.ascent);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0,h/2+metrics.descent);
    ctx.lineTo(w,h/2+metrics.descent);
    ctx.closePath();
    ctx.stroke();
  }
*/
/**
 * The new text metrics function
 */
var measureText = function (context2D, textstring, stroke, fill) {
  var metrics = context2D.measureText(textstring),
    fontFamily = getCSSValue(context2D.canvas, "font-family"),
    fontSize = getCSSValue(context2D.canvas, "font-size").replace("px", ""),
    fontStyle = getCSSValue(context2D.canvas, "font-style"),
    fontWeight = getCSSValue(context2D.canvas, "font-weight"),
    isSpace = !(/\S/.test(textstring));
  metrics.fontsize = fontSize;

  // for text lead values, we meaure a multiline text container.
  var leadDiv = document.createElement("div");
  leadDiv.style.position = "absolute";
  leadDiv.style.opacity = 0;
  leadDiv.style.font = fontStyle + " " + fontWeight + " " + fontSize + "px " + fontFamily;
  leadDiv.innerHTML = textstring + "<br/>" + textstring;
  document.body.appendChild(leadDiv);

  // make some initial guess at the text leading (using the standard TeX ratio)
  metrics.leading = 1.2 * fontSize;

  // then we try to get the real value from the browser
  var leadDivHeight = getCSSValue(leadDiv, "height");
  leadDivHeight = leadDivHeight.replace("px", "");
  if (leadDivHeight >= fontSize * 2) { metrics.leading = (leadDivHeight / 2) | 0; }
  document.body.removeChild(leadDiv);

  // if we're not dealing with white space, we can compute metrics
  if (!isSpace) {
    // Have characters, so measure the text
    var canvas = document.createElement("canvas");
    var padding = 100;
    canvas.width = metrics.width + padding;
    canvas.height = 3 * fontSize;
    canvas.style.opacity = 1;
    canvas.style.fontFamily = fontFamily;
    canvas.style.fontSize = fontSize;
    canvas.style.fontStyle = fontStyle;
    canvas.style.fontWeight = fontWeight;
    var ctx = canvas.getContext("2d");
    ctx.font = fontStyle + " " + fontWeight + " " + fontSize + "px " + fontFamily;

    var w = canvas.width,
      h = canvas.height,
      baseline = h / 2;

    // Set all canvas pixeldata values to 255, with all the content
    // data being 0. This lets us scan for data[i] != 255.
    ctx.fillStyle = "white";
    ctx.fillRect(-1, -1, w + 2, h + 2);

    if (stroke) {
      ctx.strokeStyle = "black";
      ctx.lineWidth = context2D.lineWidth;
      ctx.strokeText(textstring, (padding / 2), baseline);
    }

    if (fill) {
      ctx.fillStyle = "black";
      ctx.fillText(textstring, padding / 2, baseline);
    }

    var pixelData = ctx.getImageData(0, 0, w, h).data;

    // canvas pixel data is w*4 by h*4, because R, G, B and A are separate,
    // consecutive values in the array, rather than stored as 32 bit ints.
    var i = 0,
      w4 = w * 4,
      len = pixelData.length;

    // Finding the ascent uses a normal, forward scanline
    while (++i < len && pixelData[i] === 255) { }
    var ascent = (i / w4) | 0;

    // Finding the descent uses a reverse scanline
    i = len - 1;
    while (--i > 0 && pixelData[i] === 255) { }
    var descent = (i / w4) | 0;

    // find the min-x coordinate
    for (i = 0; i < len && pixelData[i] === 255;) {
      i += w4;
      if (i >= len) { i = (i - len) + 4; }
    }
    var minx = ((i % w4) / 4) | 0;

    // find the max-x coordinate
    var step = 1;
    for (i = len - 3; i >= 0 && pixelData[i] === 255;) {
      i -= w4;
      if (i < 0) { i = (len - 3) - (step++) * 4; }
    }
    var maxx = ((i % w4) / 4) + 1 | 0;

    // set font metrics
    metrics.ascent = (baseline - ascent);
    metrics.descent = (descent - baseline);
    metrics.bounds = {
      minx: minx - (padding / 2),
      maxx: maxx - (padding / 2),
      miny: 0,
      maxy: descent - ascent
    };
    metrics.height = 1 + (descent - ascent);
  }

  // if we ARE dealing with whitespace, most values will just be zero.
  else {
    // Only whitespace, so we can't measure the text
    metrics.ascent = 0;
    metrics.descent = 0;
    metrics.bounds = {
      minx: 0,
      maxx: metrics.width, // Best guess
      miny: 0,
      maxy: 0
    };
    metrics.height = 0;
  }
  return metrics;
};

module.exports = measureText;
// });

},{}],61:[function(require,module,exports){
/**
  @license
  when.js - https://github.com/cujojs/when

  MIT License (c) copyright B Cavalier & J Hann

 * A lightweight CommonJS Promises/A and when() implementation
 * when is part of the cujo.js family of libraries (http://cujojs.com/)
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @version 1.7.1
 */

(function(define) { 'use strict';
define(function () {
	var reduceArray, slice, undef;

	//
	// Public API
	//

	when.defer     = defer;     // Create a deferred
	when.resolve   = resolve;   // Create a resolved promise
	when.reject    = reject;    // Create a rejected promise

	when.join      = join;      // Join 2 or more promises

	when.all       = all;       // Resolve a list of promises
	when.map       = map;       // Array.map() for promises
	when.reduce    = reduce;    // Array.reduce() for promises

	when.any       = any;       // One-winner race
	when.some      = some;      // Multi-winner race

	when.chain     = chain;     // Make a promise trigger another resolver

	when.isPromise = isPromise; // Determine if a thing is a promise

	/**
	 * Register an observer for a promise or immediate value.
	 *
	 * @param {*} promiseOrValue
	 * @param {function?} [onFulfilled] callback to be called when promiseOrValue is
	 *   successfully fulfilled.  If promiseOrValue is an immediate value, callback
	 *   will be invoked immediately.
	 * @param {function?} [onRejected] callback to be called when promiseOrValue is
	 *   rejected.
	 * @param {function?} [onProgress] callback to be called when progress updates
	 *   are issued for promiseOrValue.
	 * @returns {Promise} a new {@link Promise} that will complete with the return
	 *   value of callback or errback or the completion value of promiseOrValue if
	 *   callback and/or errback is not supplied.
	 */
	function when(promiseOrValue, onFulfilled, onRejected, onProgress) {
		// Get a trusted promise for the input promiseOrValue, and then
		// register promise handlers
		return resolve(promiseOrValue).then(onFulfilled, onRejected, onProgress);
	}

	/**
	 * Returns promiseOrValue if promiseOrValue is a {@link Promise}, a new Promise if
	 * promiseOrValue is a foreign promise, or a new, already-fulfilled {@link Promise}
	 * whose value is promiseOrValue if promiseOrValue is an immediate value.
	 *
	 * @param {*} promiseOrValue
	 * @returns Guaranteed to return a trusted Promise.  If promiseOrValue is a when.js {@link Promise}
	 *   returns promiseOrValue, otherwise, returns a new, already-resolved, when.js {@link Promise}
	 *   whose resolution value is:
	 *   * the resolution value of promiseOrValue if it's a foreign promise, or
	 *   * promiseOrValue if it's a value
	 */
	function resolve(promiseOrValue) {
		var promise, deferred;

		if(promiseOrValue instanceof Promise) {
			// It's a when.js promise, so we trust it
			promise = promiseOrValue;

		} else {
			// It's not a when.js promise. See if it's a foreign promise or a value.
			if(isPromise(promiseOrValue)) {
				// It's a thenable, but we don't know where it came from, so don't trust
				// its implementation entirely.  Introduce a trusted middleman when.js promise
				deferred = defer();

				// IMPORTANT: This is the only place when.js should ever call .then() on an
				// untrusted promise. Don't expose the return value to the untrusted promise
				promiseOrValue.then(
					function(value)  { deferred.resolve(value); },
					function(reason) { deferred.reject(reason); },
					function(update) { deferred.progress(update); }
				);

				promise = deferred.promise;

			} else {
				// It's a value, not a promise.  Create a resolved promise for it.
				promise = fulfilled(promiseOrValue);
			}
		}

		return promise;
	}

	/**
	 * Returns a rejected promise for the supplied promiseOrValue.  The returned
	 * promise will be rejected with:
	 * - promiseOrValue, if it is a value, or
	 * - if promiseOrValue is a promise
	 *   - promiseOrValue's value after it is fulfilled
	 *   - promiseOrValue's reason after it is rejected
	 * @param {*} promiseOrValue the rejected value of the returned {@link Promise}
	 * @returns {Promise} rejected {@link Promise}
	 */
	function reject(promiseOrValue) {
		return when(promiseOrValue, rejected);
	}

	/**
	 * Trusted Promise constructor.  A Promise created from this constructor is
	 * a trusted when.js promise.  Any other duck-typed promise is considered
	 * untrusted.
	 * @constructor
	 * @name Promise
	 */
	function Promise(then) {
		this.then = then;
	}

	Promise.prototype = {
		/**
		 * Register a callback that will be called when a promise is
		 * fulfilled or rejected.  Optionally also register a progress handler.
		 * Shortcut for .then(onFulfilledOrRejected, onFulfilledOrRejected, onProgress)
		 * @param {function?} [onFulfilledOrRejected]
		 * @param {function?} [onProgress]
		 * @returns {Promise}
		 */
		always: function(onFulfilledOrRejected, onProgress) {
			return this.then(onFulfilledOrRejected, onFulfilledOrRejected, onProgress);
		},

		/**
		 * Register a rejection handler.  Shortcut for .then(undefined, onRejected)
		 * @param {function?} onRejected
		 * @returns {Promise}
		 */
		otherwise: function(onRejected) {
			return this.then(undef, onRejected);
		},

		/**
		 * Shortcut for .then(function() { return value; })
		 * @param  {*} value
		 * @returns {Promise} a promise that:
		 *  - is fulfilled if value is not a promise, or
		 *  - if value is a promise, will fulfill with its value, or reject
		 *    with its reason.
		 */
		yield: function(value) {
			return this.then(function() {
				return value;
			});
		},

		/**
		 * Assumes that this promise will fulfill with an array, and arranges
		 * for the onFulfilled to be called with the array as its argument list
		 * i.e. onFulfilled.spread(undefined, array).
		 * @param {function} onFulfilled function to receive spread arguments
		 * @returns {Promise}
		 */
		spread: function(onFulfilled) {
			return this.then(function(array) {
				// array may contain promises, so resolve its contents.
				return all(array, function(array) {
					return onFulfilled.apply(undef, array);
				});
			});
		}
	};

	/**
	 * Create an already-resolved promise for the supplied value
	 * @private
	 *
	 * @param {*} value
	 * @returns {Promise} fulfilled promise
	 */
	function fulfilled(value) {
		var p = new Promise(function(onFulfilled) {
			// TODO: Promises/A+ check typeof onFulfilled
			try {
				return resolve(onFulfilled ? onFulfilled(value) : value);
			} catch(e) {
				return rejected(e);
			}
		});

		return p;
	}

	/**
	 * Create an already-rejected {@link Promise} with the supplied
	 * rejection reason.
	 * @private
	 *
	 * @param {*} reason
	 * @returns {Promise} rejected promise
	 */
	function rejected(reason) {
		var p = new Promise(function(_, onRejected) {
			// TODO: Promises/A+ check typeof onRejected
			try {
				return onRejected ? resolve(onRejected(reason)) : rejected(reason);
			} catch(e) {
				return rejected(e);
			}
		});

		return p;
	}

	/**
	 * Creates a new, Deferred with fully isolated resolver and promise parts,
	 * either or both of which may be given out safely to consumers.
	 * The Deferred itself has the full API: resolve, reject, progress, and
	 * then. The resolver has resolve, reject, and progress.  The promise
	 * only has then.
	 *
	 * @returns {Deferred}
	 */
	function defer() {
		var deferred, promise, handlers, progressHandlers,
			_then, _progress, _resolve;

		/**
		 * The promise for the new deferred
		 * @type {Promise}
		 */
		promise = new Promise(then);

		/**
		 * The full Deferred object, with {@link Promise} and {@link Resolver} parts
		 * @class Deferred
		 * @name Deferred
		 */
		deferred = {
			then:     then, // DEPRECATED: use deferred.promise.then
			resolve:  promiseResolve,
			reject:   promiseReject,
			// TODO: Consider renaming progress() to notify()
			progress: promiseProgress,

			promise:  promise,

			resolver: {
				resolve:  promiseResolve,
				reject:   promiseReject,
				progress: promiseProgress
			}
		};

		handlers = [];
		progressHandlers = [];

		/**
		 * Pre-resolution then() that adds the supplied callback, errback, and progback
		 * functions to the registered listeners
		 * @private
		 *
		 * @param {function?} [onFulfilled] resolution handler
		 * @param {function?} [onRejected] rejection handler
		 * @param {function?} [onProgress] progress handler
		 */
		_then = function(onFulfilled, onRejected, onProgress) {
			// TODO: Promises/A+ check typeof onFulfilled, onRejected, onProgress
			var deferred, progressHandler;

			deferred = defer();

			progressHandler = typeof onProgress === 'function'
				? function(update) {
					try {
						// Allow progress handler to transform progress event
						deferred.progress(onProgress(update));
					} catch(e) {
						// Use caught value as progress
						deferred.progress(e);
					}
				}
				: function(update) { deferred.progress(update); };

			handlers.push(function(promise) {
				promise.then(onFulfilled, onRejected)
					.then(deferred.resolve, deferred.reject, progressHandler);
			});

			progressHandlers.push(progressHandler);

			return deferred.promise;
		};

		/**
		 * Issue a progress event, notifying all progress listeners
		 * @private
		 * @param {*} update progress event payload to pass to all listeners
		 */
		_progress = function(update) {
			processQueue(progressHandlers, update);
			return update;
		};

		/**
		 * Transition from pre-resolution state to post-resolution state, notifying
		 * all listeners of the resolution or rejection
		 * @private
		 * @param {*} value the value of this deferred
		 */
		_resolve = function(value) {
			value = resolve(value);

			// Replace _then with one that directly notifies with the result.
			_then = value.then;
			// Replace _resolve so that this Deferred can only be resolved once
			_resolve = resolve;
			// Make _progress a noop, to disallow progress for the resolved promise.
			_progress = noop;

			// Notify handlers
			processQueue(handlers, value);

			// Free progressHandlers array since we'll never issue progress events
			progressHandlers = handlers = undef;

			return value;
		};

		return deferred;

		/**
		 * Wrapper to allow _then to be replaced safely
		 * @param {function?} [onFulfilled] resolution handler
		 * @param {function?} [onRejected] rejection handler
		 * @param {function?} [onProgress] progress handler
		 * @returns {Promise} new promise
		 */
		function then(onFulfilled, onRejected, onProgress) {
			// TODO: Promises/A+ check typeof onFulfilled, onRejected, onProgress
			return _then(onFulfilled, onRejected, onProgress);
		}

		/**
		 * Wrapper to allow _resolve to be replaced
		 */
		function promiseResolve(val) {
			return _resolve(val);
		}

		/**
		 * Wrapper to allow _reject to be replaced
		 */
		function promiseReject(err) {
			return _resolve(rejected(err));
		}

		/**
		 * Wrapper to allow _progress to be replaced
		 */
		function promiseProgress(update) {
			return _progress(update);
		}
	}

	/**
	 * Determines if promiseOrValue is a promise or not.  Uses the feature
	 * test from http://wiki.commonjs.org/wiki/Promises/A to determine if
	 * promiseOrValue is a promise.
	 *
	 * @param {*} promiseOrValue anything
	 * @returns {boolean} true if promiseOrValue is a {@link Promise}
	 */
	function isPromise(promiseOrValue) {
		return promiseOrValue && typeof promiseOrValue.then === 'function';
	}

	/**
	 * Initiates a competitive race, returning a promise that will resolve when
	 * howMany of the supplied promisesOrValues have resolved, or will reject when
	 * it becomes impossible for howMany to resolve, for example, when
	 * (promisesOrValues.length - howMany) + 1 input promises reject.
	 *
	 * @param {Array} promisesOrValues array of anything, may contain a mix
	 *      of promises and values
	 * @param howMany {number} number of promisesOrValues to resolve
	 * @param {function?} [onFulfilled] resolution handler
	 * @param {function?} [onRejected] rejection handler
	 * @param {function?} [onProgress] progress handler
	 * @returns {Promise} promise that will resolve to an array of howMany values that
	 * resolved first, or will reject with an array of (promisesOrValues.length - howMany) + 1
	 * rejection reasons.
	 */
	function some(promisesOrValues, howMany, onFulfilled, onRejected, onProgress) {

		checkCallbacks(2, arguments);

		return when(promisesOrValues, function(promisesOrValues) {

			var toResolve, toReject, values, reasons, deferred, fulfillOne, rejectOne, progress, len, i;

			len = promisesOrValues.length >>> 0;

			toResolve = Math.max(0, Math.min(howMany, len));
			values = [];

			toReject = (len - toResolve) + 1;
			reasons = [];

			deferred = defer();

			// No items in the input, resolve immediately
			if (!toResolve) {
				deferred.resolve(values);

			} else {
				progress = deferred.progress;

				rejectOne = function(reason) {
					reasons.push(reason);
					if(!--toReject) {
						fulfillOne = rejectOne = noop;
						deferred.reject(reasons);
					}
				};

				fulfillOne = function(val) {
					// This orders the values based on promise resolution order
					// Another strategy would be to use the original position of
					// the corresponding promise.
					values.push(val);

					if (!--toResolve) {
						fulfillOne = rejectOne = noop;
						deferred.resolve(values);
					}
				};

				for(i = 0; i < len; ++i) {
					if(i in promisesOrValues) {
						when(promisesOrValues[i], fulfiller, rejecter, progress);
					}
				}
			}

			return deferred.then(onFulfilled, onRejected, onProgress);

			function rejecter(reason) {
				rejectOne(reason);
			}

			function fulfiller(val) {
				fulfillOne(val);
			}

		});
	}

	/**
	 * Initiates a competitive race, returning a promise that will resolve when
	 * any one of the supplied promisesOrValues has resolved or will reject when
	 * *all* promisesOrValues have rejected.
	 *
	 * @param {Array|Promise} promisesOrValues array of anything, may contain a mix
	 *      of {@link Promise}s and values
	 * @param {function?} [onFulfilled] resolution handler
	 * @param {function?} [onRejected] rejection handler
	 * @param {function?} [onProgress] progress handler
	 * @returns {Promise} promise that will resolve to the value that resolved first, or
	 * will reject with an array of all rejected inputs.
	 */
	function any(promisesOrValues, onFulfilled, onRejected, onProgress) {

		function unwrapSingleResult(val) {
			return onFulfilled ? onFulfilled(val[0]) : val[0];
		}

		return some(promisesOrValues, 1, unwrapSingleResult, onRejected, onProgress);
	}

	/**
	 * Return a promise that will resolve only once all the supplied promisesOrValues
	 * have resolved. The resolution value of the returned promise will be an array
	 * containing the resolution values of each of the promisesOrValues.
	 * @memberOf when
	 *
	 * @param {Array|Promise} promisesOrValues array of anything, may contain a mix
	 *      of {@link Promise}s and values
	 * @param {function?} [onFulfilled] resolution handler
	 * @param {function?} [onRejected] rejection handler
	 * @param {function?} [onProgress] progress handler
	 * @returns {Promise}
	 */
	function all(promisesOrValues, onFulfilled, onRejected, onProgress) {
		checkCallbacks(1, arguments);
		return map(promisesOrValues, identity).then(onFulfilled, onRejected, onProgress);
	}

	/**
	 * Joins multiple promises into a single returned promise.
	 * @returns {Promise} a promise that will fulfill when *all* the input promises
	 * have fulfilled, or will reject when *any one* of the input promises rejects.
	 */
	function join(/* ...promises */) {
		return map(arguments, identity);
	}

	/**
	 * Traditional map function, similar to `Array.prototype.map()`, but allows
	 * input to contain {@link Promise}s and/or values, and mapFunc may return
	 * either a value or a {@link Promise}
	 *
	 * @param {Array|Promise} promise array of anything, may contain a mix
	 *      of {@link Promise}s and values
	 * @param {function} mapFunc mapping function mapFunc(value) which may return
	 *      either a {@link Promise} or value
	 * @returns {Promise} a {@link Promise} that will resolve to an array containing
	 *      the mapped output values.
	 */
	function map(promise, mapFunc) {
		return when(promise, function(array) {
			var results, len, toResolve, resolve, i, d;

			// Since we know the resulting length, we can preallocate the results
			// array to avoid array expansions.
			toResolve = len = array.length >>> 0;
			results = [];
			d = defer();

			if(!toResolve) {
				d.resolve(results);
			} else {

				resolve = function resolveOne(item, i) {
					when(item, mapFunc).then(function(mapped) {
						results[i] = mapped;

						if(!--toResolve) {
							d.resolve(results);
						}
					}, d.reject);
				};

				// Since mapFunc may be async, get all invocations of it into flight
				for(i = 0; i < len; i++) {
					if(i in array) {
						resolve(array[i], i);
					} else {
						--toResolve;
					}
				}

			}

			return d.promise;

		});
	}

	/**
	 * Traditional reduce function, similar to `Array.prototype.reduce()`, but
	 * input may contain promises and/or values, and reduceFunc
	 * may return either a value or a promise, *and* initialValue may
	 * be a promise for the starting value.
	 *
	 * @param {Array|Promise} promise array or promise for an array of anything,
	 *      may contain a mix of promises and values.
	 * @param {function} reduceFunc reduce function reduce(currentValue, nextValue, index, total),
	 *      where total is the total number of items being reduced, and will be the same
	 *      in each call to reduceFunc.
	 * @returns {Promise} that will resolve to the final reduced value
	 */
	function reduce(promise, reduceFunc /*, initialValue */) {
		var args = slice.call(arguments, 1);

		return when(promise, function(array) {
			var total;

			total = array.length;

			// Wrap the supplied reduceFunc with one that handles promises and then
			// delegates to the supplied.
			args[0] = function (current, val, i) {
				return when(current, function (c) {
					return when(val, function (value) {
						return reduceFunc(c, value, i, total);
					});
				});
			};

			return reduceArray.apply(array, args);
		});
	}

	/**
	 * Ensure that resolution of promiseOrValue will trigger resolver with the
	 * value or reason of promiseOrValue, or instead with resolveValue if it is provided.
	 *
	 * @param promiseOrValue
	 * @param {Object} resolver
	 * @param {function} resolver.resolve
	 * @param {function} resolver.reject
	 * @param {*} [resolveValue]
	 * @returns {Promise}
	 */
	function chain(promiseOrValue, resolver, resolveValue) {
		var useResolveValue = arguments.length > 2;

		return when(promiseOrValue,
			function(val) {
				val = useResolveValue ? resolveValue : val;
				resolver.resolve(val);
				return val;
			},
			function(reason) {
				resolver.reject(reason);
				return rejected(reason);
			},
			resolver.progress
		);
	}

	//
	// Utility functions
	//

	/**
	 * Apply all functions in queue to value
	 * @param {Array} queue array of functions to execute
	 * @param {*} value argument passed to each function
	 */
	function processQueue(queue, value) {
		var handler, i = 0;

		while (handler = queue[i++]) {
			handler(value);
		}
	}

	/**
	 * Helper that checks arrayOfCallbacks to ensure that each element is either
	 * a function, or null or undefined.
	 * @private
	 * @param {number} start index at which to start checking items in arrayOfCallbacks
	 * @param {Array} arrayOfCallbacks array to check
	 * @throws {Error} if any element of arrayOfCallbacks is something other than
	 * a functions, null, or undefined.
	 */
	function checkCallbacks(start, arrayOfCallbacks) {
		// TODO: Promises/A+ update type checking and docs
		var arg, i = arrayOfCallbacks.length;

		while(i > start) {
			arg = arrayOfCallbacks[--i];

			if (arg != null && typeof arg != 'function') {
				throw new Error('arg '+i+' must be a function');
			}
		}
	}

	/**
	 * No-Op function used in method replacement
	 * @private
	 */
	function noop() {}

	slice = [].slice;

	// ES5 reduce implementation if native not available
	// See: http://es5.github.com/#x15.4.4.21 as there are many
	// specifics and edge cases.
	reduceArray = [].reduce ||
		function(reduceFunc /*, initialValue */) {
			/*jshint maxcomplexity: 7*/

			// ES5 dictates that reduce.length === 1

			// This implementation deviates from ES5 spec in the following ways:
			// 1. It does not check if reduceFunc is a Callable

			var arr, args, reduced, len, i;

			i = 0;
			// This generates a jshint warning, despite being valid
			// "Missing 'new' prefix when invoking a constructor."
			// See https://github.com/jshint/jshint/issues/392
			arr = Object(this);
			len = arr.length >>> 0;
			args = arguments;

			// If no initialValue, use first item of array (we know length !== 0 here)
			// and adjust i to start at second item
			if(args.length <= 1) {
				// Skip to the first real element in the array
				for(;;) {
					if(i in arr) {
						reduced = arr[i++];
						break;
					}

					// If we reached the end of the array without finding any real
					// elements, it's a TypeError
					if(++i >= len) {
						throw new TypeError();
					}
				}
			} else {
				// If initialValue provided, use it
				reduced = args[1];
			}

			// Do the actual reduce
			for(;i < len; ++i) {
				// Skip holes
				if(i in arr) {
					reduced = reduceFunc(reduced, arr[i], i, arr);
				}
			}

			return reduced;
		};

	function identity(x) {
		return x;
	}

	return when;
});
})(typeof define == 'function' && define.amd
	? define
	: function (factory) { typeof exports === 'object'
		? (module.exports = factory())
		: (this.when      = factory());
	}
	// Boilerplate for AMD, Node, and browser global
);

},{}],62:[function(require,module,exports){
(function (global){

var g = typeof window != "undefined" ? window : global;
if (typeof g.Cesium == 'undefined') {
    g.Cesium = require('./cesium-core');
}
g.Cesium.VectorTileImageryProvider = require('./VectorTileImageryProvider');
g.Cesium.proj4=require('proj4');
module.exports = g.Cesium;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./VectorTileImageryProvider":5,"./cesium-core":6,"proj4":undefined}],63:[function(require,module,exports){

var turf = require('@turf/helpers');
turf = Object.assign(turf, {
    bbox: require('@turf/bbox').default,
    bboxPolygon: require('@turf/bbox-polygon').default,
    bboxClip: require('@turf/bbox-clip').default,
    polygonToLine: require('@turf/polygon-to-line').default,
    pointToLineDistance: require('@turf/point-to-line-distance').default,
    booleanPointInPolygon: require('@turf/boolean-point-in-polygon').default,
    featureEach: function (geojson, callback) {
        if (geojson.type === 'Feature') {
            callback(geojson, 0);
        } else if (geojson.type === 'FeatureCollection') {
            for (var i = 0; i < geojson.features.length; i++) {
                var feature = geojson.features[i];
                if (!feature) continue;
                if (callback(feature, i) === false) break;
            }
        }
    },
    featureCollection: function (features) {
        return {
            type: 'FeatureCollection',
            features: features
        }
    },
    simplify: require('@turf/simplify').default,
    polygonToLineString: require('@turf/polygon-to-line').default,
    center: require('@turf/center').default,
    centerOfMass: require('@turf/center-of-mass').default,
    centroid: require('@turf/centroid').default,
    lineEquals: function (coords1, coords2) {
        var equals = coords1.length == coords2.length;
        if (equals) {
            for (var i = 0; i < coords1.length; i++) {
                if (coords1[i][0] != coords2[i][0]
                    || coords1[i][1] != coords2[i][1]) {
                    equals = false
                    break;
                }
            }
        }
        return equals;
    },
    polygonEquals: function (ply1, ply2) {
        var lines1 = turf.getCoords(ply1);
        var lines2 = turf.getCoords(ply2);
        var equals = lines1.length == lines2.length
        if (equals) {

            for (var i = 0; i < lines1.length; i++) {
                equals = turf.lineEquals(lines1[i], lines2[i]);
                if (!equals) {
                    break;
                }
            }
        }
        return equals;

    },
    removeDuplicate: function (geoJSON) {
        var fcs = [];
        turf.featureEach(geoJSON, function (fc) {
            var geometry = fc.geometry;
            if (!geometry) return;

            if (geometry.type == "Polygon") {
                var contains = false;
                for (var i = 0; i < fcs.length; i++) {
                    if (turf.polygonEquals(fc, fcs[i])) {
                        contains = true;
                        break;
                    }
                }
                if (!contains) {
                    fcs.push(fc);
                }
            }
            else {
                fcs.push(fc);
            }
        });

        fcs = turf.featureCollection(fcs);

        return fcs;
    },
    within: require('@turf/within')
})
turf = Object.assign(turf, require('@turf/invariant'))
turf.distance = require('@turf/distance').default

turf.pointToPolygonDistance = function (pt, polygon, options) {

    var line = turf.polygonToLine(polygon);
    if (line.type == 'Feature') {
        if (line.geometry.type == 'LineString') {
            return turf.pointToLineDistance(pt, line, options)
        } else {
            return turf.pointToMultiLineDistance(pt, line, options)
        }
    } else if (line.type == 'FeatureCollection') {
        var dist = Number.MAX_VALUE;
        var fcs = line;
        turf.featureEach(fcs, function (fc) {
            var geometry = fc.geometry;
            if (!geometry) return;
            if (geometry.type == 'LineString') {
                dist = Math.min(turf.pointToLineDistance(pt, line, options), dist);
            } else {
                dist = Math.min(turf.pointToMultiLineDistance(pt, line, options), dist);
            }
        })
        if (dist == Number.MAX_VALUE) {
            return undefined
        }
        return dist;
    }
}

turf.pointToMultiPolygonDistance = function (pt, multiPolygon, options) {
    var coordinates = turf.getCoords(multiPolygon);
    var lineString = null;
    var dist = Number.MAX_VALUE;
    coordinates.forEach(function (polygonCoords) {
        polygon = turf.polygon(polygonCoords)
        var timepDist = turf.pointToPolygonDistance(pt, polygon, options);
        dist = Math.min(timepDist, dist);
    })
    coordinates = [];
    if (dist == Number.MAX_VALUE) {
        return undefined
    }

    return dist;
}

turf.pointToMultiLineDistance = function (pt, multiLineString, options) {

    var coordinates = turf.getCoords(multiLineString);
    var lineString = null;
    var dist = Number.MAX_VALUE;
    coordinates.forEach(function (lineCoords) {
        lineString = turf.lineString(lineCoords)
        var timepDist = turf.pointToLineDistance(pt, lineString, options);
        dist = Math.min(timepDist, dist);
    })
    coordinates = [];
    if (dist == Number.MAX_VALUE) {
        return undefined
    }

    return dist;
}

/**
 * @param {Feature<Point>}pt
 * @param {Feature}fc
 * @param {Object}options
 * @param {String}options.units
 * @return {Number|undefined}
 */
turf.pointToFeatureDistance = function (pt, fc, options) {
    var dist = undefined;
    switch (fc.geometry.type) {
        case 'Point':
            dist = turf.distance(pt, fc, options);
            break;
        case 'MultiPoint':
            var coordinates = turf.getCoords(fc);
            var pts = []
            coordinates.forEach(function (coord) {
                pts.push(turf.point(coord))
            })
            pts = turf.featureCollection(pts);
            nearest = turf.nearestPoint(pt, pts);
            pts = [];
            dist = nearest.properties.distanceToPoint
            break;
        case "LineString":
            dist = turf.pointToLineDistance(pt, fc, options)
            break;
        case "MultiLineString":
            dist = turf.pointToMultiLineDistance(pt, fc, options)
            break;
        case "Polygon":
            dist = turf.pointToPolygonDistance(pt, fc, options)
            break;
        case "MultiPolygon":
            dist = turf.pointToMultiPolygonDistance(pt, fc, options)
            break;
    }
    return dist;
}

module.exports = turf;
},{"@turf/bbox":undefined,"@turf/bbox-clip":undefined,"@turf/bbox-polygon":undefined,"@turf/boolean-point-in-polygon":undefined,"@turf/center":undefined,"@turf/center-of-mass":undefined,"@turf/centroid":undefined,"@turf/distance":undefined,"@turf/helpers":undefined,"@turf/invariant":undefined,"@turf/point-to-line-distance":undefined,"@turf/polygon-to-line":undefined,"@turf/simplify":undefined,"@turf/within":undefined}],64:[function(require,module,exports){

/**
*@class
*@memberof Cesium
*/
function Path() { }
/**
*
*获取文件扩展名（后缀）
*@param {String}fname 文件名
*/
Path.GetExtension = function (fname) {
    var start = fname.lastIndexOf(".");
    if (start >= 0) {
        return fname.substring(start, fname.length);
    }
    return "";
}

/**
*
*获取文件扩展名（后缀）
*@param {String}fname 文件名
*/
Path.GetFileName = function (fname) {
    var start = fname.lastIndexOf("/");
    if (start < 0) {
        return fname;
    }
    return fname.substring(start + 1, fname.length);
}
/**
*
*获取文件夹
*@param {String}fname 文件名
*/
Path.GetDirectoryName = function (fname) {
    var start = fname.lastIndexOf("/");
    if (start < 0) {
        return "";
    }
    return fname.substring(0, start);
}
/**
*
*获取文件夹
*@param {String}fname 文件名
*/
Path.Combine = function (dir, fname) {
    return dir + fname;
}
Path.ChangeExtension = function (fname, newExt) {
    return fname.replace(Path.GetExtension(fname), newExt);
}

module.exports = Path;
},{}],65:[function(require,module,exports){

function Rect(x, y, w, h) {
    return { x: x, y: y, width: w, height: h };
}

var Point = function (x, y) {
    return { x: x, y: y };
}
/**
 *
* @memberof Cesium.Util
* @method
* @name drawRoundedRect
 * @param {Object} rect
 * @param {Number} radius
 * @param {CanvasRenderingContext2D} context2d
 */
function drawRoundedRect(rect, r, ctx) {
    var ptA = Point(rect.x + r, rect.y);
    var ptB = Point(rect.x + rect.width, rect.y);
    var ptC = Point(rect.x + rect.width, rect.y + rect.height);
    var ptD = Point(rect.x, rect.y + rect.height);
    var ptE = Point(rect.x, rect.y);

    ctx.beginPath();

    ctx.moveTo(ptA.x, ptA.y);
    ctx.arcTo(ptB.x, ptB.y, ptC.x, ptC.y, r);
    ctx.arcTo(ptC.x, ptC.y, ptD.x, ptD.y, r);
    ctx.arcTo(ptD.x, ptD.y, ptE.x, ptE.y, r);
    ctx.arcTo(ptE.x, ptE.y, ptA.x, ptA.y, r);


    ctx.fill();
    ctx.stroke();
}

module.exports = drawRoundedRect;
},{}],66:[function(require,module,exports){

var drawRoundedRect = require('./drawRoundedRect');
var writeTextToCanvas=require('../cesium/Core/writeTextToCanvas');

/**
* Writes the given text into a new canvas.  The canvas will be sized to fit the text.
* If text is blank, returns undefined.
* - 依赖Cesium.writeTextToCanvas
* @memberof Cesium.Util
* @method
* @name drawText
* @param {String} text The text to write.
* @param {Object} [options] Object with the following properties:
* @param {String} [options.font='10px sans-serif'] The CSS font to use.
* @param {String} [options.textBaseline='bottom'] The baseline of the text.
* @param {Boolean} [options.fill=true] Whether to fill the text.
* @param {Boolean} [options.stroke=false] Whether to stroke the text.
* @param {Color} [options.fillColor=Cesium.Color.WHITE] The fill color.
* @param {Color} [options.strokeColor=Cesium.Color.BLACK] The stroke color.
* @param {Number} [options.strokeWidth=1] The stroke width.
* @param {Color} [options.backgroundColor=Cesium.Color.TRANSPARENT] The background color of the canvas.
* @param {Number} [options.padding=0] The pixel size of the padding to add around the text.
* @returns {Canvas} A new canvas with the given text drawn into it.  The dimensions object
*                   from measureText will also be added to the returned canvas. If text is
*                   blank, returns undefined.
*@example
    var opts={
        font:'10px sans-serif',
        textBaseline:'bottom',
        fill:true,
        stroke:false,
        strokeWidth:1,
        fillColor:Cesium.Color.WHITE,
        strokeColor:Cesium.Color.BLACK,
        backgroundColor:Cesium.Color.TRANSPARENT,
        padding:0
    };
    var textCanvas=drawText('hello world',opts)
*            
*/
function drawText(text, options) {
    options = options ? options : {
        font: "20px sans-serif"
    };
    var backcolor = options.backgroundColor;
    var padding = options.padding ? options.padding : 0;
    delete options.backgroundColor;
    delete options.padding;

    var lines = text.split(/[\r]?\n+/);
    var lineImgs = [];
    var w = 0, h = 0;
    for (var i = 0; i < lines.length; i++) {
        var tempCv = writeTextToCanvas(lines[i], options)
        if (tempCv) {
            lineImgs.push(tempCv);
            h += tempCv.height;
            w = Math.max(w, tempCv.width);
        }
    }
    options.backgroundColor = backcolor;
    options.padding = padding;

    var cv = options.canvas;
    if (!cv) {
        w += padding * 2;
        h += padding * 2.25;
        cv = document.createElement("canvas");
        cv.width = w;
        cv.height = h;
    }

    var ctx = cv.getContext("2d");
    if (backcolor) {
        ctx.fillStyle = backcolor.toCssColorString();
    } else {
        ctx.fillStyle = undefined;
    }

    if (options.border) {
        ctx.lineWidth = options.borderWidth;
        ctx.strokeStyle = options.borderColor.toCssColorString();
    }

    if (!options.borderRadius) {
        if (backcolor) {
            ctx.fillRect(0, 0, cv.width, cv.height);
        }

        if (options.border) {
            ctx.strokeRect(0, 0, cv.width, cv.height);
        }
    } else {
        drawRoundedRect({
            x: 0, y: 0, width: cv.width, height: cv.height
        }, options.borderRadius, ctx);
    }

    delete ctx.strokeStyle;
    delete ctx.fillStyle;
    var y = 0;
    for (var i = 0; i < lineImgs.length; i++) {
        ctx.drawImage(lineImgs[i], 0 + padding, y + padding);
        y += lineImgs[i].height;
    }
    return cv;
}

module.exports = drawText; 
},{"../cesium/Core/writeTextToCanvas":59,"./drawRoundedRect":65}],67:[function(require,module,exports){
var when = require('when');

function readAsArrayBuffer(file) {
    var df = when.defer();
    var fr = new FileReader();
    fr.onload = function (e) {
        df.resolve(e.target.result);
    }
    fr.onprogress = function (e) {
        if (df.progress) df.progress(e.target.result);
    }
    fr.onerror = function (e) {
        df.reject(e.error);
    }
    fr.readAsArrayBuffer(file);
    return df.promise;
}
module.exports = readAsArrayBuffer;
},{"when":undefined}],68:[function(require,module,exports){
var when = require('when');
function readAsText(file) {
    var df = when.defer();
    var fr = new FileReader();
    fr.onload = function (e) {
        df.resolve(e.target.result);
    }
    fr.onprogress = function (e) {
        if (df.progress) df.progress(e.target.result);
    }
    fr.onerror = function (e) {
        df.reject(e.error);
    }
    fr.readAsText(file);
    return df.promise;
}
module.exports = readAsText;
},{"when":undefined}]},{},[62])(62)
});
