define([
    'Util/turf',
    "Util/shp",
    'Util/Path',
    'VectorRenderer/VectorStyle' 
], function (
    turf,
    shp,
    Path,
    VectorStyle 
    ) {

    /**
    *
    *@param {Object} options
    *@param {String|turf.FeatureCollection|Object|Array<MeteoLib.Util.Contour.PolyLine>|Array<MeteoLib.Util.Contour.Polygon>}options.source 矢量文件url或者geojson对象    
    *@param {Cesium.VectorStyle}[options.style=new VectorStyle()] 矢量文件url或者geojson对象    
    *@param {Boolean}[options.simplify=false] true则简化，默认不简化
    *@param {Boolean}[options.simplifyTolerance=0.01] 简化公差
    *@memberof Cesium
    *@constructor 
    */
    function VectorLayer(options) {
        options = Cesium.defaultValue(options, Cesium.defaultValue.EMPTY_OBJECT);
        if (!Cesium.defined(options.source)) {
            throw new Cesium.DeveloperError("source is required");
        }
        var ext = null;
        if (typeof options.source == 'string') {
            options.source = options.source.toLowerCase();
            ext = Path.GetExtension(options.source)
            if (ext !== '.shp' && ext !== '.json' && ext !== '.geojson' && ext !== '.topojson') {
                throw new Cesium.DeveloperError("The data  options.source provide is not supported.");
            }
        } else if (options.source.type && options.source.type == "FeatureCollection") {

        } else if (Cesium.isArray(options.source)) {
            if (!(options.source[0] instanceof PolyLine) && (options.source[0] instanceof Polygon)) {
                throw new Cesium.DeveloperError("The data  options.source provide is not supported.");
            }
        } else {
            throw new Cesium.DeveloperError("The data  options.source provide is not supported.");
        }

        if (ext) {
            this._source = options.source.replace('.shp', '');
        } else {
            this._source = options.source;
        }

        this._fileExtension = ext;
        this._simplifyTolerance = Cesium.defaultValue(options.simplifyTolerance, 0.01);
        this._simplify = Cesium.defaultValue(options.simplify, false);
        this._ready = false;

        /**
         *
         *@type {Cesium.VectorStyle}
         */
        this.style = Cesium.defaultValue(options.style, new VectorStyle());
        /**
        *
        *@type {Promise}
        */
        this.readyPromise = Cesium.when.defer();
        /**
        *
        *@type {turf.featureCollection}
        */
        this.lines = null;
        /**
       *
       *@type {turf.featureCollection}
       */
        this.outlines = null;
        /**
       *
       *@type {turf.featureCollection}
       */
        this.points = null;
        /**
         *
         *@type {turf.featureCollection}
         */
        this.polygons = null;

        /**
         *@readonly
         *@type {Boolean}
         */
        this.onlyPoint = false;
        /**
        *@readonly
        *@type {Array<Number>}
        */
        this.bbox = [];
        /**
         *@readonly
         *@type {Cesium.Rectangle}
         */
        this.rectangle = null;

        var that = this;
        var shpPromise = Cesium.when.defer();
        function onSuccess(geoJSON) {
            try {
                initVectorLayer(that, geoJSON);
                geoJSON = null;
                shpPromise.resolve(that);
            } catch (err) {
                shpPromise.reject(err);
            }
        }

        var promises = [this.style.readyPromise, shpPromise];

        if (ext) {
            switch (ext) {
                case '.shp':
                    shp(this._source).then(onSuccess, function (err) {
                        console.log("load shp file error：" + err);
                    });
                    break;
                case '.json':
                case '.geojson':
                case '.topojson':
                    Cesium.loadText(this._source).then(function (geojson) {
                        onSuccess(JSON.parse(geojson));
                    }).otherwise(function (err) {
                        console.log(err);
                    })
                    break;
                default:
                    throw new Cesium.DeveloperError("The file  options.source provide is not supported.");
            }
        } else {
            setTimeout(function () {
                if (Cesium.isArray(that._source)) {
                    var contourLines = that._source;

                    if (contourLines[0] instanceof PolyLine)
                    {
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
                    onSuccess(that._source)
                }

            }, 10)
        }

        Cesium.when.all(promises, function () {
            that._ready = true;
            that.readyPromise.resolve(that);
        }, function (err) {
            that._ready = false;
            that.readyPromise.resolve(err);
        });
    }

    function initVectorLayer(vectorLayer, geoJSON) {
        var that = vectorLayer;
        var tolerance = that._simplifyTolerance;
        var lines = [], outlines = [], points = [], polygons = [];
        var onlyPoint = true;
        turf.featureEach(geoJSON, function (feature, index) {
            if (feature.geometry.type == "Point"
                || feature.geometry.type == "MultiPoint") {
                points.push(feature);
            }
            if (feature.geometry.type == "Polygon"
                || feature.geometry.type == "MultiPolygon") {
                outlines = outlines.concat(turf.polygonToLineString(feature).features);
                onlyPoint = false;
                //if (that._fill) {
                if (that._simplify) {
                    simplified = turf.simplify(feature, tolerance, false);
                    polygons.push(simplified);
                } else {
                    polygons.push(feature);
                }
                // }
            }
            if (feature.geometry.type == "MultiLineString"
                || feature.geometry.type == "LineString") {
                if (that._simplify) {
                    simplified = turf.simplify(feature, tolerance, false);
                    lines.push(simplified);
                } else {
                    lines.push(feature);
                }
                onlyPoint = false;
            }
        })

        if (lines.length > 0) {
            if (!that.lines) {
                that.lines = turf.featureCollection(lines);
            }
        }

        if (outlines.length > 0) {
            if (!that.outlines) {
                that.outlines = turf.featureCollection(outlines);
            }

        }

        if (points.length > 0) {
            if (!that.points) {
                that.points = turf.featureCollection(points);
            }

        }

        if (polygons.length > 0) {
            if (!that.polygons) {
                that.polygons = turf.featureCollection(polygons);
            }
        }

        that.onlyPoint = onlyPoint;
        that.bbox = turf.bbox(geoJSON);
        that.rectangle = Cesium.Rectangle.fromDegrees(that.bbox[0], that.bbox[1], that.bbox[2], that.bbox[3]);

    }

    Cesium.defineProperties(VectorLayer.prototype, {
        ready: {
            get: function () {
                return this._ready;
            }
        }
    })
    return VectorLayer;
})