
define([
    'Util/turf',
    "Util/Shp",
    'Data/Geojson/LonLatProjection',
    'Util/Path',
    //'Util/Contour/PolyLine',
    //'Util/Contour/Polygon',
    'VectorRenderer/VectorStyle'
], function(
    turf,
    shp,
    LonLatProjection,
    Path,
    //PolyLine,
    //Polygon,
    VectorStyle
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
        *@param {MeteoLib.Render.VectorStyle}[options.defaultStyle=MeteoLib.Render.VectorStyle.Default] 默认样式 
        *@param {Boolean}[options.simplify=false] true则简化，默认不简化
        *@param {Boolean}[options.simplifyTolerance=0.01] 简化公差
       *@param {Boolean}[options.minimumLevel=3] 最小级别
        *@param {Boolean}[options.maximumLevel=22] 最大级别
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

            if (ext) {
                this._url = options.source.replace(ext, '');
            } else {
                this._url = options.source;
            }
            this._fileExtension = ext;

            this._simplifyTolerance = Cesium.defaultValue(options.simplifyTolerance, 0.01);
            this._simplify = Cesium.defaultValue(options.simplify, false);
            //this._multipleTask = Cesium.defaultValue(options.multipleTask, true);
            //this._taskWaitTime = Cesium.defaultValue(options.taskWaitTime, 10);
            this._maximumLevel = Cesium.defaultValue(options.maximumLevel, 22)
            this._minimumLevel = Cesium.defaultValue(options.minimumLevel, 3)
            this._makerImage = options.makerImage;
            this._tileCacheSize = Cesium.defaultValue(options.tileCacheSize, 200);
            if (typeof options.defaultStyle == 'object' && !(options.defaultStyle instanceof VectorStyle)) {
                options.defaultStyle = new VectorStyle(options.defaultStyle);
            }
            this._defaultStyle = Cesium.defaultValue(options.defaultStyle, VectorStyle.Default.clone());
            this._styleFilter = typeof options.styleFilter == 'function' ? options.styleFilter : undefined;

            this._errorEvent = new Cesium.Event();
            this._readyPromise = Cesium.when.defer();
            this._ready = false;
            this._state = VectorTileImageryProvider.State.READY;

            this._cache = {};
            this._count = 0;

            this._bbox = null;
            this._geoJSON = null;
            var that = this;
            var promises = [];
            var makerImagePromise = null;
            if (typeof this._makerImage == 'string') {
                makerImagePromise = Cesium.when.defer();
                var image = new Image();
                image.onload = function() {
                    makerImagePromise.resolve(this);
                    that._makerImageEl = this;
                }
                image.onerror = function(err) {
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
                        shp(this._url).then(onSuccess, function(err) {
                            console.log("load shp file error：" + err);
                        });
                        break;
                    case '.json':
                    case '.geojson':
                    case '.topojson':
                        Cesium.loadText(this._url).then(function(geojson) {
                            onSuccess(JSON.parse(geojson));
                        }).otherwise(function(err) {
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
                        prms.then(onSuccess).otherwise(function(err) {
                            console.log(err);
                            throw new Cesium.DeveloperError("The file  options.source provider is not supported.");
                        });
                    } else {
                        throw new Cesium.DeveloperError("The file  options.source provider is not supported.");
                    }
                } else {
                    setTimeout(function() {
                        if (Cesium.isArray(that._url)) {
                            var contourLines = that._url;

                            if (contourLines[0] instanceof PolyLine) {
                                var coords = [];
                                var multiLineString = [];
                                for (var lineNum = 0; lineNum < contourLines.length; lineNum++) {
                                    coords = [];
                                    contourLines[lineNum].PointList.forEach(function(pt) {
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
                                    contourLines[lineNum].OutLine.PointList.forEach(function(pt) {
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
            function onSuccess(geoJSON) {
                var tolerance = that._simplifyTolerance;
                var lines = [], outlines = [], points = [], polygons = [];
                var onlyPoint = true;
                var simplified;
                turf.featureEach(geoJSON, function(feature, index) {
                    if (feature.geometry.type == "Point"
                        || feature.geometry.type == "MultiPoint") {
                        points.push(feature);
                    } else if (that._defaultStyle.showCenterLabel
                        && that._defaultStyle.centerLabelPropertyName) {
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
                    }
                })

                if (lines.length > 0) {
                    that._lineGeoJSON = turf.featureCollection(lines);
                    lines = null;
                }

                if (outlines.length > 0) {
                    outlines.forEach(function(outline) {
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

                that._onlyPoint = onlyPoint;
                that._state = VectorTileImageryProvider.State.LOADED;
                that._bbox = turf.bbox(geoJSON);
                // that.rectangle = Cesium.Rectangle.fromDegrees(that._bbox[0], that._bbox[1], that._bbox[2], that._bbox[3]);
                that._bbox = Cesium.Rectangle.fromDegrees(that._bbox[0], that._bbox[1], that._bbox[2], that._bbox[3]);
                geoJSON = null;
                shpPromise.resolve(that);
            }

            Cesium.when.all(promises, function() {
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
        *@param {MeteoLib.Render.VectorStyle}style 即将应用与当前要素的样式，可以通过修改该参数中的各样式设置选项来针对当前要素进行特殊的样式设置。
        *修改后只对当前要素有效，不会修改Cesium.VectorTileImageryProvider的默认样式
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
             * Gets the proxy used by this provider.
             * @memberof Cesium.VectorTileImageryProvider.prototype
             * @type {Proxy}
             * @readonly
             */
            proxy: {
                get: function() {
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
                get: function() {
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
                get: function() {
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
                get: function() {
                    return this._maximumLevel;
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
                get: function() {
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
                get: function() {
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
                get: function() {
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
                get: function() {
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
                get: function() {
                    return this._errorEvent;
                }
            },

            /**
             * Gets a value indicating whether or not the provider is ready for use.
             * @memberof Cesium.VectorTileImageryProvider.prototype
             * @type {Boolean}
             * @readonly
             */
            ready: {
                get: function() {
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
                get: function() {
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
                get: function() {
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
                get: function() {
                    return true;
                }
            }
        });

        VectorTileImageryProvider.prototype._createCanvas = function() {
            this._canvas = document.createElement("canvas");
            this._canvas.width = this._tileWidth;
            this._canvas.height = this._tileHeight;
            this._context = this._canvas.getContext("2d");
            this._context.lineWidth = this._defaultStyle.lineWidth;
            this._context.strokeStyle = this._defaultStyle.outlineColor.toCssColorString();// "rgb(255,255,0)";
            this._context.fillStyle = this._defaultStyle.fillColor.toCssColorString();// "rgba(0,255,255,0.0)";
        }

        var isWorking = false;
        //用当前瓦片（Tile）矩形裁剪geojson并返回裁剪结果
        VectorTileImageryProvider.prototype._clipGeojson = function(rectangle) {
            var that = this;
            var bbox = [Cesium.Math.toDegrees(rectangle.west),
            Cesium.Math.toDegrees(rectangle.south),
            Cesium.Math.toDegrees(rectangle.east),
            Cesium.Math.toDegrees(rectangle.north)];
            var poly = turf.polygon([[
                [bbox[0], bbox[1]],//sw
                [bbox[2], bbox[1]],//se
                [bbox[2], bbox[3]],//ne
                [bbox[0], bbox[3]],//nw
                [bbox[0], bbox[1]],//sw
            ]]);
            poly = turf.featureCollection([poly]);
            var features = [];
            if (this._pointGeoJSON) {
                var pts = turf.within(this._pointGeoJSON, poly);
                features = features.concat(pts.features);
            }
            var canClipGeojsons = [];
            if (this._lineGeoJSON) {
                canClipGeojsons.push(this._lineGeoJSON);
            }
            if (this._outlineGeoJSON) {
                canClipGeojsons.push(this._outlineGeoJSON);
            }
            if (this._polygonJSON) {
                canClipGeojsons.push(this._polygonJSON);
            }
            var clipped;
            canClipGeojsons.forEach(function(geojson) {
                turf.featureEach(geojson, function(currentFeature, currentIndex) {
                    clipped = null;
                    try {
                        clipped = turf.bboxClip(currentFeature, bbox);
                        if (clipped && clipped.geometry.coordinates.length > 0) {
                            var empty = true;
                            for (var i = 0; i < clipped.geometry.coordinates.length; i++) {
                                if (clipped.geometry.coordinates[i].length > 0) {
                                    empty = false;
                                    break;
                                }
                            }
                            if (!empty) {
                                features.push(clipped);
                            }

                        }
                    } catch (e) {
                        var coordinates = [];
                        currentFeature.geometry.coordinates.forEach(function(contour) {
                            if (contour.length > 3) {
                                coordinates.push(contour);
                            }
                        })
                        currentFeature.geometry.coordinates = coordinates;
                        clipped = turf.bboxClip(currentFeature, bbox);
                        if (clipped && clipped.geometry.coordinates.length > 0) {
                            features.push(clipped);
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
            holes.map(function(hole) {
                holeMaskCtx.clearRect(0, 0, holeMaskCanvas.width, holeMaskCanvas.height);
                holeMaskCtx.beginPath();
                var pointIndex = 0;
                hole.map(function(coordinate) {
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
            contours.map(function(contour) {
                if (!fill || count <= 0) {
                    var pointIndex = 0;
                    context.beginPath();
                    contour.map(function(coordinate) {
                        var pt = projection.project(coordinate, boundingRect)
                        if (pointIndex == 0) {
                            context.moveTo(x + pt.x, y + pt.y);
                        } else {
                            context.lineTo(x + pt.x, y + pt.y);
                        }
                        pointIndex++;
                    })
                    if (stroke) {
                        context.stroke();
                    }
                    if (fill) {
                        context.closePath();
                        context.fill();
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

            var pt = projection.project(pointFeature.geometry.coordinates, boundingRect)


            if (style.showMaker) {

                var px = pt.x + x,
                    py = pt.y + y;
                if (px + style.pointSize > context.canvas.width) {
                    px -= style.pointSize * 2;
                }
                if (px >= 0 && px - style.pointSize <= 0) {
                    px += style.pointSize;
                }

                if (py + style.pointSize > context.canvas.width) {
                    py -= style.pointSize * 2;
                }
                if (py >= 0 && py - style.pointSize <= 0) {
                    py += style.pointSize;
                }

                if (style.markerSymbol && style.markerSymbol instanceof Image) {
                    if (px - style.markerSymbol.width / 2 < 0) {
                        px += style.markerSymbol.width / 2;
                    }
                    if (py - style.markerSymbol.width / 2 < 0) {
                        py += style.markerSymbol.width / 2;
                    }

                    if (px + style.markerSymbol.width / 2 > context.canvas.width) {
                        px -= style.markerSymbol.width / 2;
                    }
                    if (py + style.markerSymbol.width / 2 > context.canvas.height) {
                        py -= style.markerSymbol.width / 2;
                    }

                    context.drawImage(style.markerSymbol, px, py);//, style.pointSize, style.pointSize);
                } else {



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
                    var px = pt.x + x + style.labelOffsetX + 4,
                        py = pt.y + y + style.labelOffsetY + style.fontSize / 2;

                    var text = pointFeature.properties[labelPropertyName];
                    if (text) {
                        text = text.trim();
                        var textWidth = context.measureText(text).width;
                        if (px + textWidth > context.canvas.width) {
                            px -= (textWidth + style.pointSize + 6);
                        }

                        if (py + style.fontSize > context.canvas.height) {
                            py -= style.labelOffsetY + style.fontSize / 2;
                        }
                        context.fillText(text, px, py);
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
        VectorTileImageryProvider.prototype._drawGeojson = function(context, x, y, geojson, boundingRect, width, height, fill, stroke) {
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
            turf.featureEach(geojson, function(currentFeature, currentFeatureIndex) {

                if (that._styleFilter) {
                    style = that._defaultStyle.clone();
                    that._styleFilter(currentFeature, style);
                    makerStyle = {
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
                        tempHoles.map(function(hole) {
                            hole.style = style;
                            holes.push(hole);
                        })
                    }
                } else if (currentFeature.geometry.type == "MultiPolygon" && style.fill) {
                    var polygons;
                    try {
                        polygons = turf.getCoords(currentFeature);
                        polygons.map(function(contours) {
                            var tempHoles = drawContours(context, projection, boundingRect, x, y, contours, true, false, style);
                            if (tempHoles) {
                                tempHoles.map(function(hole) {
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
            })
            if (holes && holes.length) {
                createHoles(context, projection, boundingRect, x, y, holes);
                holes = null;
            }
        }

        VectorTileImageryProvider.prototype._createTileImage = function(x, y, level, rectangle, defer) {

            var that = this;
            var cacheId = x + "," + y + "," + level;

            var boundingRect = {
                xMin: Cesium.Math.toDegrees(rectangle.west),
                yMin: Cesium.Math.toDegrees(rectangle.south),
                xMax: Cesium.Math.toDegrees(rectangle.east),
                yMax: Cesium.Math.toDegrees(rectangle.north)
            };
            this._state = VectorTileImageryProvider.State.CLIPPING;
            Cesium.requestAnimationFrame(function() {
                var clippedGeojson = that._clipGeojson(rectangle);

                if (!clippedGeojson) {
                    defer.resolve(undefined);
                    that._state = VectorTileImageryProvider.State.COMPELTED;
                    VectorTileImageryProvider._currentTaskCount--;
                } else {

                    Cesium.requestAnimationFrame(function() {
                        that._state = VectorTileImageryProvider.State.GEOJSONDRAWING;
                        that._createCanvas();
                        that._context.clearRect(0, 0, that._canvas.width, that._canvas.height);
                        //if (level < 8) {
                        //    var v = 1.5 / Math.pow(2, (level + 0));
                        //    try {
                        //        clippedGeojson = turf.simplify(clippedGeojson, v);
                        //    } catch (e) {

                        //    }

                        //}

                        that._drawGeojson(that._context, 0, 0, clippedGeojson, boundingRect, that._tileWidth, that._tileHeight, that._fill, that._outline);

                        that.cache[cacheId] = that._canvas;
                        that.cache[cacheId].srcJson = clippedGeojson;
                        that.cacheCount++;
                        VectorTileImageryProvider._currentTaskCount--;

                        defer.resolve(that._canvas);

                        Cesium.requestAnimationFrame(function() {
                            that._state = VectorTileImageryProvider.State.COMPELTED;
                        });
                    });

                }
            });
        }

        VectorTileImageryProvider.prototype._getTileImage = function(x, y, level, rectangle) {

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
            setTimeout(function() {
                return that._createTileImage(x, y, level, rectangle, defer)
            }, 1);
            return defer;
        }

        var scratchRectangleIntersection = new Cesium.Rectangle();
        VectorTileImageryProvider.prototype.requestImage = function(x, y, level, distance) {
            if (!this._ready || this._state != VectorTileImageryProvider.State.COMPELTED) {
                return undefined;
            }
            if (level < this._minimumLevel) {
                this._createCanvas();
                this._context.clearRect(0, 0, this._tileWidth, this._tileHeight);
                return this._canvas;
            }
            var rectangle = this.tilingScheme.tileXYToRectangle(x, y, level);
            return this._getTileImage(x, y, level, rectangle);
        }
        VectorTileImageryProvider.prototype.pickFeatures = function(x, y, level, longitude, latitude) {
            //alert(longitude+","+ latitude);
        }
        return VectorTileImageryProvider;
    })