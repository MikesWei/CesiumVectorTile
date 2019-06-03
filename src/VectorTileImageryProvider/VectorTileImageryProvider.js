
define([
    'Util/turf',
    "Util/Shp",
    'Data/Geojson/LonLatProjection',
    'Util/Path',
    //'Util/Contour/PolyLine',
    //'Util/Contour/Polygon',
    'VectorRenderer/VectorStyle'
    //,'Core/Resources'
], function (
    turf,
    shp,
    LonLatProjection,
    Path,
    //PolyLine,
    //Polygon,
    VectorStyle
    //,Resources
) {

        if (Cesium.Resource) {
            Cesium.loadText = Cesium.Resource.fetchText;
            Cesium.loadJson = Cesium.Resource.fetchJson;
            Cesium.loadBlob = Cesium.Resource.fetchBlob;
            Cesium.loadArrayBuffer = Cesium.Resource.fetchArrayBuffer;
            Cesium.loadImage = Cesium.Resource.fetchImage;
        }
        var defaultColor = new Cesium.Color(1.0, 1.0, 1.0, 0.4);
        var defaultGlowColor = new Cesium.Color(0.0, 1.0, 0.0, 0.05);
        var defaultBackgroundColor = new Cesium.Color(0.0, 0.5, 0.0, 0.2);
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
        *动态矢量切片提供程序，支持esri shapefile、geojson文件，也可以直接加载geojson对象和Polygon,PolyLine
        *   <ul class="see-list">
        *       <li><a href="https://mikeswei.github.io/CesiumVectorTile/" target="_blank">VectorTileImageryProviderDemo</a></li>
        *  </ul>  
        *@param {Object}options 参数如下：
        *@param {String|turf.FeatureCollection|Object|Array<MeteoLib.Util.Contour.PolyLine|MeteoLib.Util.Contour.Polygon|File>}options.source MeteoLib.Util.Contour.PolyLine及MeteoLib.Util.Contour.Polygon数组、矢量文件url、矢量文件列表或者geojson对象
        *@param {Cesium.VectorStyle}[options.defaultStyle=Cesium.VectorStyle.Default] 默认样式 
        *@param {Boolean}[options.simplify=false] true则简化，默认不简化
        *@param {Boolean}[options.simplifyTolerance=0.01] 简化公差
       *@param {Boolean}[options.minimumLevel=3] 最小级别
        *@param {Boolean}[options.maximumLevel=22] 最大级别
        *@param {Boolean}[options.showMaximumLevel=true] 当超出最大级别时是否继续显示
        *@param {Boolean}[options.removeDuplicate=true] 是否剔除重复（有相同的坐标）的多边形
        *@param {Boolean}[options.allowPick=false] 是否支持要素查询，如果支持要素查询则保留原始的geojson，会多占用系统内存
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
                    , makerImage: appConfig.BaseURL + "Assets/Images/Stations/autonew.png"
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
                    showMaker: false,
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
                showMaker: true,
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
                    style.showMaker = false;
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
        */
        function VectorTileImageryProvider(options) {
            ///@param {Boolean}[options.multipleTask=true] 是否使用多个VectorTileImageryProvider实例，使用多个实例是设置该参数为true可以提高ui响应速度，使用唯一一个实例时设置该参数为false则可以提高切片速度。
            //@param {Boolean}[options.taskWaitTime=10] 使用多个实例时，每个实例的切片任务延迟结束的时间，以此来避免多个矢量图层同时存在时出现某个图层一直更新而其他图层一直没有更新的bug

            options = Cesium.defaultValue(options, Cesium.defaultValue.EMPTY_OBJECT);
            if (!Cesium.defined(options.source)) {
                throw new Cesium.DeveloperError("source is required");
            }
            var ext = null;
            var isLocalShpFile = false;
            if (typeof options.source == 'string') {
                var source = options.source.toLowerCase();
                ext = Path.GetExtension(source)
                if (ext !== '.shp' && ext !== '.json' && ext !== '.geojson' && ext !== '.topojson') {
                    throw new Cesium.DeveloperError("The data  options.source provider is not supported.");
                }
            } else if (options.source.type && options.source.type == "FeatureCollection") {

            } else if (isShpLocalFiles(options.source)) {
                isLocalShpFile = true;
            }
            else if (Cesium.isArray(options.source)) {
                if (!(options.source[0] instanceof PolyLine) && (options.source[0] instanceof Polygon)) {
                    throw new Cesium.DeveloperError("The data  options.source provider is not supported.");
                }
            } else {
                throw new Cesium.DeveloperError("The data  options.source provider is not supported.");
            }

            this._tilingScheme = new Cesium.GeographicTilingScheme({ ellipsoid: options.ellipsoid });
            this._tileWidth = Cesium.defaultValue(options.tileWidth, 256);
            this._tileHeight = Cesium.defaultValue(options.tileHeight, 256);

            //if (ext && ext == '.shp') {
            //    ext = Path.GetExtension(options.source)
            //    this._url = options.source.replace(ext, '');
            //} else {
            this._url = options.source;
            //}
            this._fileExtension = ext;

            this._removeDuplicate = Cesium.defaultValue(options.removeDuplicate, true);
            this._allowPick = Cesium.defaultValue(options.allowPick, false);
            this._simplifyTolerance = Cesium.defaultValue(options.simplifyTolerance, 0.01);
            this._simplify = Cesium.defaultValue(options.simplify, false);
            //this._multipleTask = Cesium.defaultValue(options.multipleTask, true);
            //this._taskWaitTime = Cesium.defaultValue(options.taskWaitTime, 10);
            this._maximumLevel = Cesium.defaultValue(options.maximumLevel, 22)
            this._minimumLevel = Cesium.defaultValue(options.minimumLevel, 3)
            this._showMaximumLevel = Cesium.defaultValue(options.showMaximumLevel, true)
            this._makerImage = options.makerImage;
            this._tileCacheSize = Cesium.defaultValue(options.tileCacheSize, 200);
            if (typeof options.defaultStyle == 'object' && !(options.defaultStyle instanceof VectorStyle)) {
                options.defaultStyle = new VectorStyle(options.defaultStyle);
            }
            this._defaultStyle = Cesium.defaultValue(options.defaultStyle, VectorStyle.Default.clone());
            this._styleFilter = typeof options.styleFilter == 'function' ? options.styleFilter : undefined;


            this._errorEvent = new Cesium.Event();
            this._featuresPicked = new Cesium.Event();
            this._readyPromise = Cesium.when.defer();
            this._ready = false;
            this._state = VectorTileImageryProvider.State.READY;

            this._cache = {};
            this._count = 0;
            this.zIndex = options.zIndex;
            this._bbox = null;
            this._geoJSON = null;
            var that = this;
            var promises = [];
            var makerImagePromise = null;
            if (typeof this._makerImage == 'string') {
                makerImagePromise = Cesium.when.defer();
                var image = new Image();
                image.onload = function () {
                    makerImagePromise.resolve(this);
                    that._makerImageEl = this;
                }
                image.onerror = function (err) {
                    makerImagePromise.resolve(err);
                }
                image.src = this._makerImage;
                promises.push(makerImagePromise);
            }

            var shpPromise = Cesium.when.defer();
            promises.push(shpPromise);
            this._state = VectorTileImageryProvider.State.SHPLOADING;
            if (ext) {
                switch (ext) {
                    case '.shp':
                        shp(this._url).then(onSuccess, function (err) {
                            console.log("load shp file error：" + err);
                        });
                        break;
                    case '.json':
                    case '.geojson':
                    case '.topojson':
                        //Resources.get(this._url)
                        Cesium.loadText(this._url)
                            .then(function (geojson) {
                                eval("(" + geojson + ")")
                                onSuccess(geojson);
                            }).otherwise(function (err) {
                                console.log(err);
                            })
                        break;
                    default:
                        throw new Cesium.DeveloperError("The file  options.source provider is not supported.");
                }
            } else {
                if (isLocalShpFile) {
                    var prms = shp.parseShpFiles(that._url);
                    if (prms) {
                        prms.then(onSuccess).otherwise(function (err) {
                            console.log(err);
                            throw new Cesium.DeveloperError("The file  options.source provider is not supported.");
                        });
                    } else {
                        throw new Cesium.DeveloperError("The file  options.source provider is not supported.");
                    }
                } else {
                    setTimeout(function () {
                        if (Cesium.isArray(that._url)) {
                            var contourLines = that._url;

                            if (contourLines[0] instanceof PolyLine) {
                                var coords = [];
                                var multiLineString = [];
                                for (var lineNum = 0; lineNum < contourLines.length; lineNum++) {
                                    coords = [];
                                    contourLines[lineNum].PointList.forEach(function (pt) {
                                        coords.push(pt.getCoordArray());
                                    })
                                    multiLineString.push(coords);
                                }
                                multiLineString = turf.multiLineString(multiLineString);
                                multiLineString = turf.featureCollection([multiLineString]);
                                onSuccess(multiLineString);
                            }
                            else if (contourLines[0] instanceof Polygon) {
                                var multiPolygon = [];
                                for (var lineNum = 0; lineNum < contourLines.length; lineNum++) {
                                    var coords = [];
                                    contourLines[lineNum].OutLine.PointList.forEach(function (pt) {
                                        coords.push(pt.getCoordArray());
                                    })
                                    var polygon = turf.polygon(coords, contourLines[0].getProperties());
                                    multiPolygon.push(polygon);
                                }
                                multiPolygon = turf.featureCollection(multiPolygon);
                                onSuccess(multiPolygon);
                            } else {
                                throw new Cesium.DeveloperError("The data  options.source provide is not supported.");
                            }

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

                        if ((fc.geometry.type == 'Polygon'
                            || fc.geometry.type == 'MultiPolygon')
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

                    if (fc.geometry.type == 'MultiPolygon') {
                        var polygonCoords = turf.getCoords(fc);
                        polygonCoords.forEach(function (coords) {
                            geoJSON.features.push(turf.polygon(coords, fc.properties));
                        })
                        polygonCoords = [];
                    }
                })

                for (var i = 0; i < geoJSON.features.length; i++) {
                    if (geoJSON.features[i].geometry.type == 'MultiPolygon') {
                        geoJSON.features.splice(i, 1)
                    }
                }
                if (that._removeDuplicate) {
                    geoJSON = turf.removeDuplicate(geoJSON);
                }


                turf.featureEach(geoJSON, function (feature, index) {
                    if (feature.geometry.type == "Point"
                        || feature.geometry.type == "MultiPoint") {
                        points.push(feature);
                        lineOnly = false;
                        polygonOnly = false;
                    } else if (that._defaultStyle.showCenterLabel
                        && that._defaultStyle.centerLabelPropertyName
                        && feature.geometry.type !== "Polygon"
                        && feature.geometry.type !== "MultiPolygon") {
                        that._defaultStyle.showLabel = true;
                        that._defaultStyle.labelPropertyName = that._defaultStyle.centerLabelPropertyName;
                        var center = turf.centerOfMass(feature)
                        points.push(center);
                        center.properties = feature.properties;
                    }

                    if (feature.geometry.type == "Polygon"
                        || feature.geometry.type == "MultiPolygon") {
                        outlines = outlines.concat(turf.polygonToLineString(feature).features);
                        onlyPoint = false;
                        lineOnly = false;

                        if (that._simplify) {
                            simplified = turf.simplify(feature, tolerance, false);
                            polygons.push(simplified);

                            simplified = null;
                        } else {
                            polygons.push(feature);

                        }
                    }
                    if (feature.geometry.type == "MultiLineString"
                        || feature.geometry.type == "LineString") {

                        if (that._simplify) {
                            simplified = turf.simplify(feature, tolerance, false);
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
                that._bbox = turf.bbox(geoJSON);
                // that.rectangle = Cesium.Rectangle.fromDegrees(that._bbox[0], that._bbox[1], that._bbox[2], that._bbox[3]);
                that._bbox = Cesium.Rectangle.fromDegrees(that._bbox[0], that._bbox[1], that._bbox[2], that._bbox[3]);
                geoJSON = null;
                shpPromise.resolve(that);
            }

            Cesium.when.all(promises, function () {
                that._ready = that._state == VectorTileImageryProvider.State.LOADED;
                that._createCanvas();
                VectorTileImageryProvider.instanceCount++;
                that._readyPromise.resolve(true);
                that._state = VectorTileImageryProvider.State.COMPELTED;
            });
        }

        /**
        *样式设置函数
        *@callback  Cesium.VectorTileImageryProvider~StyleFilterCallback
        *@param {Geojson.Feature}feature 当前要素（用Geojson.Feature存储）
        *@param {Cesium.VectorStyle}style 即将应用与当前要素的样式，可以通过修改该参数中的各样式设置选项来针对当前要素进行特殊的样式设置。
        *修改后只对当前要素有效，不会修改Cesium.VectorTileImageryProvider的默认样式
        *@param {Number}x
        *@param {Number}y
        *@param {Number}level
        *@example
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
        Cesium.defineProperties(VectorTileImageryProvider.prototype, {
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
                    return this._bbox;//_tilingScheme.rectangle;
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
             * 要素查询时触发事件（如果允许执行要素查询的话）
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
                this._context.fillStyle = this._defaultStyle.backgroundColor.toCssColorString();
                this._context.fillRect(0, 0, this._canvas.width, this._canvas.height);
            }

            this._context.lineWidth = this._defaultStyle.lineWidth;
            this._context.strokeStyle = this._defaultStyle.outlineColor.toCssColorString();// "rgb(255,255,0)";
            this._context.fillStyle = this._defaultStyle.fillColor.toCssColorString();// "rgba(0,255,255,0.0)";

        }

        var isWorking = false;
        //用当前瓦片（Tile）矩形裁剪geojson并返回裁剪结果
        VectorTileImageryProvider.prototype._clipGeojson = function (rectangle) {
            var that = this;
            var bbox = [Cesium.Math.toDegrees(rectangle.west),
            Cesium.Math.toDegrees(rectangle.south),
            Cesium.Math.toDegrees(rectangle.east),
            Cesium.Math.toDegrees(rectangle.north)];

            var polygonBBox = turf.polygon([[
                [bbox[0], bbox[1]],//sw
                [bbox[2], bbox[1]],//se
                [bbox[2], bbox[3]],//ne
                [bbox[0], bbox[3]],//nw
                [bbox[0], bbox[1]],//sw
            ]]);
            //poly = turf.featureCollection([poly]);

            //var polygonBBox = turf.bboxPolygon(bbox);
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
                var polygonBBox4Points =
                    //turf.bboxPolygon([
                    //                    bbox[0] - lonW,
                    //                    bbox[1] - latH,
                    //                    bbox[2] + lonW,
                    //                    bbox[3] + latH,
                    //                ]);
                    turf.polygon([[
                        [bbox[0] - lonW, bbox[1] - latH],//sw
                        [bbox[2] + lonW, bbox[1] - latH],//se
                        [bbox[2] + lonW, bbox[3] + latH],//ne
                        [bbox[0] - lonW, bbox[3] + latH],//nw
                        [bbox[0] - lonW, bbox[1] - latH],//sw
                    ]]);
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
                            if (!Cesium.isArray(c1[0])) {
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
                        clipped = turf.bboxClip(currentFeature, bbox);
                        if (clipped && clipped.geometry.coordinates.length > 0) {

                            //if (!clippedExists()) {
                            features.push(clipped);
                            //}
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
                showMaker: true,
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

            if (style.showMaker) {

                var px = pt.x + x,
                    py = pt.y + y;
                //if (px + style.pointSize > context.canvas.width) {
                //    px -= style.pointSize * 2;
                //}
                //if (px >= 0 && px - style.pointSize <= 0) {
                //    px += style.pointSize;
                //}

                //if (py + style.pointSize > context.canvas.width) {
                //    py -= style.pointSize * 2;
                //}
                //if (py >= 0 && py - style.pointSize <= 0) {
                //    py += style.pointSize;
                //}

                if (style.markerSymbol && style.markerSymbol instanceof Image) {
                    //if (px - style.markerSymbol.width / 2 < 0) {
                    //    px += style.markerSymbol.width / 2;
                    //}
                    //if (py - style.markerSymbol.width / 2 < 0) {
                    //    py += style.markerSymbol.width / 2;
                    //}

                    //if (px + style.markerSymbol.width / 2 > context.canvas.width) {
                    //    px -= style.markerSymbol.width / 2;
                    //}
                    //if (py + style.markerSymbol.width / 2 > context.canvas.height) {
                    //    py -= style.markerSymbol.width / 2;
                    //}
                    px -= style.markerSymbol.width / 2;
                    py -= style.markerSymbol.height / 2;
                    context.drawImage(style.markerSymbol, px, py);//, style.pointSize, style.pointSize);

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
                if (typeof pointFeature.properties[labelPropertyName] === 'string') {
                    context.fillStyle = style.color;
                    var px = pt.x + x + style.labelOffsetX;//+ 4,
                    py = pt.y + y + style.labelOffsetY;// + style.fontSize / 2;

                    var text = pointFeature.properties[labelPropertyName];
                    if (text) {
                        text = text.trim();
                        var textImg = Cesium.writeTextToCanvas(text, {
                            fill: true,
                            font: style.fontSize + 'px ' + style.fontFamily,
                            stroke: style.labelStroke,
                            strokeWidth: style.labelStrokeWidth,
                            strokeColor: style.labelStrokeColor,
                            fillColor: Cesium.Color.fromCssColorString(style.color)
                        })

                        var textHeight = textImg.height;
                        var textWidth = textImg.width;//context.measureText(text).width;
                        px -= textWidth / 2 + style.pointSize;
                        py -= textHeight / 2 + style.pointSize;
                        //if (px + textWidth > context.canvas.width) {
                        //    var delt = px + textWidth - context.canvas.width;
                        //    px -= delt + style.pointSize;//(textWidth + style.pointSize + 6) / 2.0;
                        //} else if (px - textWidth / 2 < 0) {
                        //    px = 0;
                        //} else {
                        //    px -= textWidth / 2;
                        //}

                        //if (py + textHeight * 2.5 > context.canvas.height) {
                        //    py = py - style.labelOffsetY - textHeight;
                        //} else if (py < textHeight * 1.8) {
                        //    py = pt.y + textHeight / 2.0 - style.labelOffsetY;
                        //} else {
                        //    py += textHeight / 2.0;
                        //}

                        //if (py + style.fontSize * 2.5 > context.canvas.height) {
                        //    py = py - style.labelOffsetY - style.fontSize;
                        //} else if (py < style.fontSize * 1.8) {
                        //    py = pt.y + style.fontSize / 2.0 - style.labelOffsetY;
                        //} else {
                        //    py += style.fontSize / 2.0;
                        //}
                        context.drawImage(textImg, px, py)
                        //context.fillText(text, px, py);
                    }
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
                color: style.fontColor.toCssColorString(),
                backgroundColor: style.pointColor.toCssColorString(),
                pointStyle: style.pointStyle,//'Solid','Ring','Circle'
                ringRadius: style.ringRadius,
                circleLineWidth: style.circleLineWidth,
                showMaker: style.showMaker,
                showLabel: style.showLabel,
                labelOffsetX: style.labelOffsetX,
                labelOffsetY: style.labelOffsetY,
                markerSymbol: style.makerImage instanceof Image ? style.makerImage : style.makerImageEl
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
                        color: style.fontColor.toCssColorString(),
                        backgroundColor: style.pointColor.toCssColorString(),
                        pointStyle: style.pointStyle,//'Solid','Ring','Circle'
                        ringRadius: style.ringRadius,
                        circleLineWidth: style.circleLineWidth,
                        showMaker: style.showMaker,
                        showLabel: style.showLabel,
                        labelOffsetX: style.labelOffsetX,
                        labelOffsetY: style.labelOffsetY,
                        markerSymbol: style.makerImage instanceof Image ? style.makerImage : style.makerImageEl
                    };
                } else {
                    style = that._defaultStyle;
                }

                context.lineWidth = style.lineWidth;
                context.strokeStyle = style.outlineColor.toCssColorString();// "rgb(255,255,0)";
                context.fillStyle = style.fillColor.toCssColorString();// "rgba(0,255,255,0.0)";
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

                if (currentFeature.geometry.type == "Point") {
                    drawMarker(context, projection, boundingRect, x, y, currentFeature, fill, stroke, style.labelPropertyName, makerStyle);
                }
                else if (currentFeature.geometry.type == "Polygon" && style.fill) {

                    var contours = turf.getCoords(currentFeature);
                    var tempHoles = drawContours(context, projection, boundingRect, x, y, contours, true, false, style);
                    if (tempHoles) {
                        tempHoles.map(function (hole) {
                            hole.style = style;
                            holes.push(hole);
                        })
                    }
                    //drawContours(context, projection, boundingRect, x, y, contours, true, false, style);
                } else if (currentFeature.geometry.type == "MultiPolygon" && style.fill) {
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
                } else if (currentFeature.geometry.type == "MultiLineString") {
                    if (currentFeature.properties.isOutline && !style.outline) {

                    } else {
                        var contours = turf.getCoords(currentFeature);
                        drawContours(context, projection, boundingRect, x, y, contours, false, true, style);
                        contours = null;
                    }

                }
                else if (currentFeature.geometry.type == "LineString") {
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
                if (fc.geometry.type == "Polygon" || fc.geometry.type == "MultiPolygon") {
                    drawFeature(fc, idx)
                }
            })
            if (holes && holes.length) {
                createHoles(context, projection, boundingRect, x, y, holes)
            }
            turf.featureEach(geojson, function (fc, idx) {
                if (fc.geometry.type == "LineString" || fc.geometry.type == "MultiLineString") {
                    drawFeature(fc, idx)
                }
            })
            turf.featureEach(geojson, function (fc, idx) {
                if (fc.geometry.type == "Point" || fc.geometry.type == "MultiPoint") {
                    drawFeature(fc, idx)
                }
            })

        }

        VectorTileImageryProvider.prototype._createTileImage = function (x, y, level, rectangle, defer) {

            var that = this;
            var cacheId = x + "," + y + "," + level;

            var boundingRect = {
                xMin: Cesium.Math.toDegrees(rectangle.west),
                yMin: Cesium.Math.toDegrees(rectangle.south),
                xMax: Cesium.Math.toDegrees(rectangle.east),
                yMax: Cesium.Math.toDegrees(rectangle.north)
            };
            this._state = VectorTileImageryProvider.State.CLIPPING;
            Cesium.requestAnimationFrame(function () {
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

        VectorTileImageryProvider.prototype._getTileImage = function (x, y, level, rectangle) {

            var defer = Cesium.when.defer();
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
            return defer;
        }

        var emptycv;

        function getEmpty(bgColor) {
            if (!emptycv) {

                emptycv = document.createElement("canvas");
                emptycv.width = 256;
                emptycv.height = 256;
            }
            if (bgColor) {
                var ctx = emptycv.getContex('2d');
                ctx.fillStyle = bgColor.toCssColorString();
                ctx.fillRect(0, 0, emptycv.width, emptycv.height);
            }
            return emptycv;
        }
        var scratchRectangleIntersection = new Cesium.Rectangle();
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



        var scratchRect = new Cesium.Rectangle();
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
            if (!this._allowPick || !this._geoJSON) {
                this._featuresPicked.raiseEvent(this, undefined);
                return undefined;
            }
            this.tilingScheme.tileXYToRectangle(x, y, level, scratchRect);
            var res = turf.radiansToLength(scratchRect.width / 256, 'kilometers');//分辨率，单位公里，即当前视图下一个像素点边长所表示距离

            var pt = turf.point([Cesium.Math.toDegrees(longitude), Cesium.Math.toDegrees(latitude)]);

            var pickedFeatures = [];
            var style = this.defaultStyle;
            var that = this;
            turf.featureEach(this._geoJSON, function (fc) {
                var srcFc = fc;
                var found = false;
                if (style.fill && (fc.geometry.type == 'Polygon' || fc.geometry.type == 'MultiPolygon')) {
                    // if (turf.pointInPolygon(pt, fc)) { //
                    if (turf.booleanPointInPolygon(pt, fc)) {
                        found = true;
                    }
                } else {
                    var dist = turf.pointToFeatureDistance(pt, fc, {
                        units: "kilometers"
                    })

                    if ((style.outline && (fc.geometry.type == 'Polygon' || fc.geometry.type == 'MultiPolygon'))
                        || (fc.geometry.type == "LineString" || fc.geometry.type == "MultiLineString")
                    ) {
                        found = dist <= res * 2.0;
                    } else if (style.showMarker && (fc.geometry.type == 'Point' || fc.geometry.type == 'MultiPoint')) {

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

                        if (srcFc.geometry.type == 'Point' || srcFc.geometry.type == 'MultiPoint') {
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
                var df = Cesium.when.defer();
                var startTime = new Date();
                Cesium.when.all(pickedFeatures, function (pickedFeatures) {
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
                }, function (err) {
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
        VectorTileImageryProvider.prototype.clearCache = function () {
            for (var key in this.cache) {
                if (this.cache.hasOwnProperty(key)) {
                    delete this.cache[key];
                }
            }
            this.cache = {}
        }
        /**
         * 
         */
        VectorTileImageryProvider.prototype.destroy = function () {
            this.clearCache()
            for (var key in this) {
                if (this.hasOwnProperty(key)) {
                    delete this[key]; 
                }
            }
        }
        return VectorTileImageryProvider;
    })