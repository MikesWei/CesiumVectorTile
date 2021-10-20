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
