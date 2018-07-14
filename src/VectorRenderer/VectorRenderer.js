/// <reference path="../../ThirdParty/Cesium/Cesium.js" />
/// <reference path="turf-bbox-clip.js" />

define([
    'Util/turf',
    "Util/Shp",
    //'Data/Geojson/geoJSONParser',
    'Data/Geojson/LonLatProjection',
    'Util/Path',
    'VectorRenderer/VectorStyle',
    'VectorRenderer/VectorLayer',
    'ThirdParty/proj4/dist/proj4-src'
], function (
    turf,
    shp,
    //geoJSONParser,
    LonLatProjection,
    Path,
    VectorStyle,
    VectorLayer
    ,proj4
) {


        /**
        *矢量渲染器，支持esri shapefile、geojson文件，也可以直接加载geojson对象或MeteoLib.Contour.Polygon、MeteoLib.Contour.Polyline集合
        *@param {Object}options 参数如下：
        *@param {Object}options.width
        *@param {Object}options.height
        *@param {Cesium.VectorLayer|String|turf.FeatureCollection|Object|Array<Cesium.VectorLayer>|Array<String>|Array<turf.FeatureCollection>|Array<Object>}options.layers 矢量文件url(数组)或者geojson对象(数组) 
        *@param {Boolean}[options.fitExtent=true] 
        *@param {Boolean}[options.resizable=true],
        *@param {String} [options.prj]
        *@constructor
        *@memberof Cesium 
        *@example
        var defaultStyle = new VectorStyle({
            outlineColor: Cesium.Color.BLACK,
            fill: true,
        });
    
        var shengjieLayer = new VectorLayer({
            source: appConfig.BaseURL + "Assets/Shp/L_shengjie.shp",
            style: defaultStyle
        });
    
        var chinaLayer = new VectorLayer({
            source: appConfig.BaseURL + "Assets/Shp/china.shp",
            style: defaultStyle
        });
    
        var vectorRenderer = new VectorRenderer({
            layers: [
                chinaLayer,
                shengjieLayer
            ],
            width: 1024,
            height: 512,
            //fitExtent: false,
            resizable:true
        });
         
        Cesium.when(vectorRenderer.readyPromise, function () {
            vectorRenderer.addLayer(chinaLayer);
            var canvas = vectorRenderer.render(vectorRenderer.rectangle);
            document.getElementById("cesiumContainer").appendChild(canvas); 
        }, function (err) {
            console.log(err);
        })
         
        */
        function VectorRenderer(options) {
            ///@param {Boolean}[options.multipleTask=true] 是否使用多个VectorRenderer实例，使用多个实例是设置该参数为true可以提高ui响应速度，使用唯一一个实例时设置该参数为false则可以提高切片速度。
            //@param {Boolean}[options.taskWaitTime=10] 使用多个实例时，每个实例的切片任务延迟结束的时间，以此来避免多个矢量图层同时存在时出现某个图层一直更新而其他图层一直没有更新的bug

            options = Cesium.defaultValue(options, Cesium.defaultValue.EMPTY_OBJECT);
            if (!Cesium.defined(options.layers)) {
                throw new Cesium.DeveloperError("缺少参数layers。");
            }
            if (!Cesium.isArray(options.layers)) {
                options.layers = [options.layers];
            }

            this._width = Cesium.defaultValue(options.width, 512);
            this._height = Cesium.defaultValue(options.height, 512);
            this._backColor = Cesium.defaultValue(options.backColor, Cesium.Color.fromBytes(0, 0, 0, 0));
            if (typeof this._backColor == 'string') {
                this._backColor = Cesium.Color.fromCssColorString(this._backColor);
            }

            this._prj = options.prj;
            this._fitExtent = Cesium.defaultValue(options.fitExtent, true);
            this._resizable = Cesium.defaultValue(options.resizable, true);

            this._readyPromise = Cesium.when.defer();
            this._ready = false;

            this._rectangle = null;
            this._boundingRectangle = null;

            this._layers = [];

            var promises = [];
            for (var i = 0; i < options.layers.length; i++) {
                var layer = options.layers[i];
                if (!(layer instanceof VectorLayer)) {
                    layer = new VectorLayer({
                        source: layer
                    });
                }

                promises.push(layer.readyPromise);
                this._layers.push(layer);
            }
            var that = this;
            Cesium.when.all(promises, function () {
                if (that._layers && that._layers.length && that._layers.length > 0) {
                    that._rectangle = that._layers[0].rectangle;
                    for (var i = 1; i < that._layers.length; i++) {
                        that._rectangle = Cesium.Rectangle.union(that._layers[i].rectangle, that._rectangle)
                    }

                    that.computeBBox();
                }

                that._ready = true;
                that._readyPromise.resolve(that);
            }, function (err) {
                console.log(err);
                that._readyPromise.reject(err);
            });

        }

        Cesium.defineProperties(VectorRenderer.prototype, {

            prj: {
                get: function () {
                    return this._prj;
                },
                set: function (val) {
                    this._prj = val;
                    if (this._ready) {
                        this.computeBBox();
                    }
                }
            },
            width: {
                get: function () {
                    return this._width;
                },
                set: function (val) {
                    this._width = val;
                }
            },

            height: {
                get: function () {
                    return this._height;
                },
                set: function (val) {
                    this._height = val;
                }
            },

            boundingRectangle: {
                get: function () {
                    return this._boundingRectangle;
                }
            },
            rectangle: {
                get: function () {
                    return this._rectangle;
                }
            },

            ready: {
                get: function () {
                    return this._ready;
                }
            },

            readyPromise: {
                get: function () {
                    return this._readyPromise;
                }
            }
        });

        var cartesian2 = new Cesium.Cartesian2();
        /**
         * 
         * @param {Number} lon
         * @param {Number} lat
         * @param {Cesium.Cartesian2} result
         */
        VectorRenderer.prototype.transform = function (coords, result, prjSettings) {
            if (this._prj && proj4)
                coords = proj4(this._prj, coords);
            var x = prjSettings.width * (coords[0] - this._boundingRectangle.x) / this._boundingRectangle.width;
            var y = prjSettings.height * (coords[1] - this._boundingRectangle.y) / this._boundingRectangle.height;
            if (!result) {
                return new Cesium.Cartesian2(x, y);
            }
            result.x = x;
            result.y = y;
            return result;
        }
        /**
         * 
         * @param {Cesium.Rectangle} rectangle
         * @private
         */
        VectorRenderer.prototype.computeBBox = function (rectangle) {
            if (!rectangle) {
                rectangle = this._rectangle;
            }
            if (!this._boundingRectangle) {
                this._boundingRectangle = new Cesium.BoundingRectangle();
            }
            //else {
            //    if (Cesium.Rectangle.equals(this._rectangle, rectangle)) {
            //        return;
            //    }
            //}
            if (!this._prj || !proj4) {
                this._boundingRectangle.x = Cesium.Math.toDegrees(rectangle.west),
                    this._boundingRectangle.y = Cesium.Math.toDegrees(rectangle.north),
                    this._boundingRectangle.width = Cesium.Math.toDegrees(rectangle.east - rectangle.west),
                    this._boundingRectangle.height = Cesium.Math.toDegrees(rectangle.south - rectangle.north);
            } else {
                var lonlats = [
                    [Cesium.Math.toDegrees(rectangle.west), Cesium.Math.toDegrees(rectangle.north)],
                    [Cesium.Math.toDegrees(rectangle.west), Cesium.Math.toDegrees(rectangle.south)],
                    [Cesium.Math.toDegrees(rectangle.east), Cesium.Math.toDegrees(rectangle.south)],
                    [Cesium.Math.toDegrees(rectangle.east), Cesium.Math.toDegrees(rectangle.north)]
                ];
                var coords;
                var west = Number.MAX_VALUE, south = Number.MAX_VALUE,
                    east = -Number.MAX_VALUE, north = -Number.MAX_VALUE
                for (var i = 0; i < lonlats.length; i++) {
                    coords = proj4(this._prj, lonlats[i]);

                    west = Math.min(coords[0], west);
                    south = Math.min(coords[1], south);
                    east = Math.max(coords[0], east);
                    north = Math.max(coords[1], north);
                }

                this._boundingRectangle.x = west,
                    this._boundingRectangle.y = north,
                    this._boundingRectangle.width = east - west,
                    this._boundingRectangle.height = south - north;
            }
        }
        /**
        *
        *@param {Cesium.VectorLayer} layer
        */
        VectorRenderer.prototype.addLayer = function (layer) {
            var that = this;
            if (layer.ready) {
                that._layers.push(layer);
                if (that._layers && that._layers.length && that._layers.length > 0) {
                    that._rectangle = that._layers[0].rectangle;
                    for (var i = 1; i < that._layers.length; i++) {
                        that._rectangle = Cesium.Rectangle.union(that._layers[i].rectangle, that._rectangle)
                    }
                }
                this.computeBBox();
            } else {
                Cesium.when(layer.readyPromise, function () {
                    that._layers.push(layer);
                    if (that._layers && that._layers.length && that._layers.length > 0) {
                        that._rectangle = that._layers[0].rectangle;
                        for (var i = 1; i < that._layers.length; i++) {
                            that._rectangle = Cesium.Rectangle.union(that._layers[i].rectangle, that._rectangle)
                        }
                    }
                    that.computeBBox();
                }, function (err) {
                    console.log(err);
                })
            }

        }

        VectorRenderer.prototype._getDefaultCanvas = function (width, height) {
            if (!this._canvas) {
                this._canvas = document.createElement("canvas");
            }

            this._canvas.width = width;
            this._canvas.height = height;
            this._context = this._canvas.getContext("2d");
            this._context.fillStyle = this._backColor instanceof Cesium.Color ? this._backColor.toCssColorString() : this._backColor;
            this._context.fillRect(0, 0, width, height);

        }

        VectorRenderer.prototype._setStyle = function (canvas, style) {
            var context = canvas.getContext("2d");
            context.lineWidth = style.lineWidth;
            context.strokeStyle = style.outlineColor instanceof Cesium.Color ? style.outlineColor.toCssColorString() : style.outlineColor;
            context.fillStyle = style.fillColor instanceof Cesium.Color ? style.fillColor.toCssColorString() : style.fillColor;

        }

        var isWorking = false;
        //用当前瓦片（Tile）矩形裁剪geojson并返回裁剪结果
        VectorRenderer.prototype._clipGeojson = function (layer, rectangle) {
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
            if (layer.points) {
                var pts = turf.within(layer.points, poly);
                features = features.concat(pts.features);
            }
            var canClipGeojsons = [];
            if (layer.lines) {
                canClipGeojsons.push(layer.lines);
            }
            if (layer.outlines) {
                canClipGeojsons.push(layer.outlines);
            }
            if (layer.polygons) {
                canClipGeojsons.push(layer.polygons);
            }
            canClipGeojsons.forEach(function (geojson) {
                turf.featureEach(geojson, function (currentFeature, currentIndex) {
                    var clipped;
                    try {
                        clipped = turf.bboxClip(currentFeature, bbox);
                        if (clipped && clipped.geometry.coordinates.length > 0) {
                            features.push(clipped);
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
                            features.push(clipped);
                        }
                    }
                })
            })

            features = turf.featureCollection(features);
            return features;
        }

        //绘制多边形（面或线）
        function drawContours(context, projection, prjSettings, x, y, contours, fill, stroke) {
            contours.map(function (contour) {
                var pointIndex = 0;
                context.beginPath();
                contour.map(function (coordinate) {
                    var pt = projection.transform(coordinate, cartesian2, prjSettings); //projection.project(coordinate, boundingRect)
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
                    context.fill();
                }
            })
        }

        //画点
        function drawMarker(context, projection, prjSettings, x, y, pointFeature, fill, stroke, labelPropertyName, makerStyle) {
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

            var pt = projection.transform(pointFeature.geometry.coordinates, cartesian2, prjSettings); //projection.project(pointFeature.geometry.coordinates, boundingRect)


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
         *@param {Object}prjSettings
         *@param {Number}width
         *@param {Number}height
         *@param {Cesium.VectorRenderer.VectorStyle}[style=undefined]
         *@private
         */
        VectorRenderer.prototype._drawGeojson = function (context, x, y, geojson, prjSettings, width, height, style) {//fill, stroke) {
            var that = this;
            if (typeof style.fill == 'undefined') {
                style.fill = true;
            }
            if (typeof style.stroke == 'undefined') {
                style.stroke = true;
            }
            if (!style.fill && !style.stroke) {
                return undefined;
            }
            if (typeof width == 'undefined') {
                width = context.canvas.width - x;
            }
            if (typeof height == 'undefined') {
                height = context.canvas.height - y;
            }

            //var projection = new LonLatProjection(width, height);
            prjSettings = { width: width, height: height };
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
                markerSymbol: style.makerImageEl
            }

            turf.featureEach(geojson, function (currentFeature, currentFeatureIndex) {
                if (currentFeature.geometry.type == "Point") {

                    drawMarker(context, that, prjSettings, x, y, currentFeature, style.fill, style.stroke, this._labelPropertyName, makerStyle);
                    context.lineWidth = that._lineWidth;
                    context.strokeStyle = that._outlineColor.toCssColorString();// "rgb(255,255,0)";
                    context.fillStyle = that._fillColor.toCssColorString();// "rgba(0,255,255,0.0)";
                }
                else if (currentFeature.geometry.type == "Polygon" && style.fill) {
                    var contours = turf.getCoords(currentFeature);
                    drawContours(context, that, prjSettings, x, y, contours, true, false);
                } else if (currentFeature.geometry.type == "MultiPolygon" && style.fill) {
                    var polygons;
                    try {
                        polygons = turf.getCoords(currentFeature);
                        polygons.map(function (contours) {
                            drawContours(context, that, prjSettings, x, y, contours, true, false);
                        })
                    } catch (e) {
                        //     console.log(e);
                    }
                } else if (currentFeature.geometry.type == "MultiLineString") {
                    var contours = turf.getCoords(currentFeature);
                    drawContours(context, that, prjSettings, x, y, contours, false, true);
                }
                else if (currentFeature.geometry.type == "LineString") {
                    var contour = turf.getCoords(currentFeature);
                    var pointIndex = 0;
                    context.beginPath();
                    contour.map(function (coordinate) {
                        var pt = that.transform(coordinate, cartesian2, prjSettings); //projection.project(coordinate, boundingRect)
                        if (pointIndex == 0) {
                            context.moveTo(x + pt.x, y + pt.y);
                        } else {
                            context.lineTo(x + pt.x, y + pt.y);
                        }
                        pointIndex++;
                    })
                    context.stroke();
                }
            })
        }


        /**
        *
        *渲染rectangle所指定范围的矢量，默认按所给矢量的最大范围渲染
        @param {Cesium.Rectangle}[rectangle=undefined] 默认为所有给定矢量图层的最大范围
        @param {Canvas}[canvas]
        @return {Canvas}
        */
        VectorRenderer.prototype.render = function (rectangle) {

            if (!rectangle) {
                rectangle = this._rectangle;
            }
            this.computeBBox(rectangle);

            var that = this;
            var boundingRect = null;// {
            //    xMin: Cesium.Math.toDegrees(rectangle.west),
            //    yMin: Cesium.Math.toDegrees(rectangle.south),
            //    xMax: Cesium.Math.toDegrees(rectangle.east),
            //    yMax: Cesium.Math.toDegrees(rectangle.north)
            //};

            var projWidth = this._width > this._height ? this._width : this._height, projHeight = projWidth;
            var canvasWidth = this._width, canvasHeight = this._height;
            if (that._resizable) {
                var scaleX = 1, scaleY = 1;
                var geoWidth = this._boundingRectangle.width; //(boundingRect.xMax - boundingRect.xMin);
                var geoHeight = Math.abs(this._boundingRectangle.height);//(boundingRect.yMax - boundingRect.yMin);

                if (geoWidth < geoHeight) {
                    scaleX = parseFloat(geoWidth) / parseFloat(geoHeight);
                    projWidth = parseInt(projWidth * scaleX);
                } else {
                    scaleY = parseFloat(geoHeight) / parseFloat(geoWidth);
                    projHeight = parseInt(projHeight * scaleY);
                }

                if (that._fitExtent) {
                    canvasWidth = projWidth;
                    canvasHeight = projHeight;

                }
            }


            this._getDefaultCanvas(canvasWidth, canvasHeight);

            var that = this;

            this._layers.forEach(function (layer) {
                var clippedGeojson = that._clipGeojson(layer, rectangle);

                if (clippedGeojson) {
                    that._setStyle(that._canvas, layer.style);
                    var context = that._canvas.getContext("2d");
                    that._drawGeojson(context, 0, 0, clippedGeojson, boundingRect, projWidth, projHeight, layer.style);
                }
            });

            return this._canvas;

        }

        return VectorRenderer;
    })