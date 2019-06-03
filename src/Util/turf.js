define([
    'ThirdParty/turf',
    'ThirdParty/TURFjs/turf-plugin',
], function (
    turf,
    turf2
) {
        //turf.turfTaskProcessor = new Cesium.TaskProcessor('turfWorker', 2);
        //turf.turfTaskProcessor.execute = function (methodName,args) {
        //    return turf.turfTaskProcessor.scheduleTask({
        //        methodName: methodName,
        //        args: args
        //    });
        //}
        for (var i in turf2) {
            if (!turf[i]) {
                turf[i] = turf2[i];
            }
        }
        var exports = turf


        //"use strict";
        //Object.defineProperty(exports, "__esModule", { value: true });
        /**
         * @module helpers
         */
        /**
         * Earth Radius used with the Harvesine formula and approximates using a spherical (non-ellipsoid) Earth.
         *
         * @memberof helpers
         * @type {number}
         */
        exports.earthRadius = 6371008.8;
        /**
         * Unit of measurement factors using a spherical (non-ellipsoid) earth radius.
         *
         * @memberof helpers
         * @type {Object}
         */
        exports.factors = {
            centimeters: exports.earthRadius * 100,
            centimetres: exports.earthRadius * 100,
            degrees: exports.earthRadius / 111325,
            feet: exports.earthRadius * 3.28084,
            inches: exports.earthRadius * 39.370,
            kilometers: exports.earthRadius / 1000,
            kilometres: exports.earthRadius / 1000,
            meters: exports.earthRadius,
            metres: exports.earthRadius,
            miles: exports.earthRadius / 1609.344,
            millimeters: exports.earthRadius * 1000,
            millimetres: exports.earthRadius * 1000,
            nauticalmiles: exports.earthRadius / 1852,
            radians: 1,
            yards: exports.earthRadius / 1.0936,
        };
        /**
         * Units of measurement factors based on 1 meter.
         *
         * @memberof helpers
         * @type {Object}
         */
        exports.unitsFactors = {
            centimeters: 100,
            centimetres: 100,
            degrees: 1 / 111325,
            feet: 3.28084,
            inches: 39.370,
            kilometers: 1 / 1000,
            kilometres: 1 / 1000,
            meters: 1,
            metres: 1,
            miles: 1 / 1609.344,
            millimeters: 1000,
            millimetres: 1000,
            nauticalmiles: 1 / 1852,
            radians: 1 / exports.earthRadius,
            yards: 1 / 1.0936,
        };
        /**
         * Area of measurement factors based on 1 square meter.
         *
         * @memberof helpers
         * @type {Object}
         */
        exports.areaFactors = {
            acres: 0.000247105,
            centimeters: 10000,
            centimetres: 10000,
            feet: 10.763910417,
            inches: 1550.003100006,
            kilometers: 0.000001,
            kilometres: 0.000001,
            meters: 1,
            metres: 1,
            miles: 3.86e-7,
            millimeters: 1000000,
            millimetres: 1000000,
            yards: 1.195990046,
        };
        /**
         * Wraps a GeoJSON {@link Geometry} in a GeoJSON {@link Feature}.
         *
         * @name feature
         * @param {Geometry} geometry input geometry
         * @param {Object} [properties={}] an Object of key-value pairs to add as properties
         * @param {Object} [options={}] Optional Parameters
         * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
         * @param {string|number} [options.id] Identifier associated with the Feature
         * @returns {Feature} a GeoJSON Feature
         * @example
         * var geometry = {
         *   "type": "Point",
         *   "coordinates": [110, 50]
         * };
         *
         * var feature = turf.feature(geometry);
         *
         * //=feature
         */
        function feature(geom, properties, options) {
            if (options === void 0) { options = {}; }
            var feat = { type: "Feature" };
            if (options.id === 0 || options.id) {
                feat.id = options.id;
            }
            if (options.bbox) {
                feat.bbox = options.bbox;
            }
            feat.properties = properties || {};
            feat.geometry = geom;
            return feat;
        }
        exports.feature = feature;
        /**
         * Creates a GeoJSON {@link Geometry} from a Geometry string type & coordinates.
         * For GeometryCollection type use `helpers.geometryCollection`
         *
         * @name geometry
         * @param {string} type Geometry Type
         * @param {Array<any>} coordinates Coordinates
         * @param {Object} [options={}] Optional Parameters
         * @returns {Geometry} a GeoJSON Geometry
         * @example
         * var type = "Point";
         * var coordinates = [110, 50];
         * var geometry = turf.geometry(type, coordinates);
         * // => geometry
         */
        function geometry(type, coordinates, options) {
            if (options === void 0) { options = {}; }
            switch (type) {
                case "Point": return point(coordinates).geometry;
                case "LineString": return lineString(coordinates).geometry;
                case "Polygon": return polygon(coordinates).geometry;
                case "MultiPoint": return multiPoint(coordinates).geometry;
                case "MultiLineString": return multiLineString(coordinates).geometry;
                case "MultiPolygon": return multiPolygon(coordinates).geometry;
                default: throw new Error(type + " is invalid");
            }
        }
        exports.geometry = geometry;
        /**
         * Creates a {@link Point} {@link Feature} from a Position.
         *
         * @name point
         * @param {Array<number>} coordinates longitude, latitude position (each in decimal degrees)
         * @param {Object} [properties={}] an Object of key-value pairs to add as properties
         * @param {Object} [options={}] Optional Parameters
         * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
         * @param {string|number} [options.id] Identifier associated with the Feature
         * @returns {Feature<Point>} a Point feature
         * @example
         * var point = turf.point([-75.343, 39.984]);
         *
         * //=point
         */
        function point(coordinates, properties, options) {
            if (options === void 0) { options = {}; }
            var geom = {
                type: "Point",
                coordinates: coordinates,
            };
            return feature(geom, properties, options);
        }
        exports.point = point;
        /**
         * Creates a {@link Point} {@link FeatureCollection} from an Array of Point coordinates.
         *
         * @name points
         * @param {Array<Array<number>>} coordinates an array of Points
         * @param {Object} [properties={}] Translate these properties to each Feature
         * @param {Object} [options={}] Optional Parameters
         * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north]
         * associated with the FeatureCollection
         * @param {string|number} [options.id] Identifier associated with the FeatureCollection
         * @returns {FeatureCollection<Point>} Point Feature
         * @example
         * var points = turf.points([
         *   [-75, 39],
         *   [-80, 45],
         *   [-78, 50]
         * ]);
         *
         * //=points
         */
        function points(coordinates, properties, options) {
            if (options === void 0) { options = {}; }
            return featureCollection(coordinates.map(function (coords) {
                return point(coords, properties);
            }), options);
        }
        exports.points = points;
        /**
         * Creates a {@link Polygon} {@link Feature} from an Array of LinearRings.
         *
         * @name polygon
         * @param {Array<Array<Array<number>>>} coordinates an array of LinearRings
         * @param {Object} [properties={}] an Object of key-value pairs to add as properties
         * @param {Object} [options={}] Optional Parameters
         * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
         * @param {string|number} [options.id] Identifier associated with the Feature
         * @returns {Feature<Polygon>} Polygon Feature
         * @example
         * var polygon = turf.polygon([[[-5, 52], [-4, 56], [-2, 51], [-7, 54], [-5, 52]]], { name: 'poly1' });
         *
         * //=polygon
         */
        function polygon(coordinates, properties, options) {
            if (options === void 0) { options = {}; }
            for (var _i = 0, coordinates_1 = coordinates; _i < coordinates_1.length; _i++) {
                var ring = coordinates_1[_i];
                if (ring.length < 4) {
                    throw new Error("Each LinearRing of a Polygon must have 4 or more Positions.");
                }
                for (var j = 0; j < ring[ring.length - 1].length; j++) {
                    // Check if first point of Polygon contains two numbers
                    if (ring[ring.length - 1][j] !== ring[0][j]) {
                        throw new Error("First and last Position are not equivalent.");
                    }
                }
            }
            var geom = {
                type: "Polygon",
                coordinates: coordinates,
            };
            return feature(geom, properties, options);
        }
        exports.polygon = polygon;
        /**
         * Creates a {@link Polygon} {@link FeatureCollection} from an Array of Polygon coordinates.
         *
         * @name polygons
         * @param {Array<Array<Array<Array<number>>>>} coordinates an array of Polygon coordinates
         * @param {Object} [properties={}] an Object of key-value pairs to add as properties
         * @param {Object} [options={}] Optional Parameters
         * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
         * @param {string|number} [options.id] Identifier associated with the FeatureCollection
         * @returns {FeatureCollection<Polygon>} Polygon FeatureCollection
         * @example
         * var polygons = turf.polygons([
         *   [[[-5, 52], [-4, 56], [-2, 51], [-7, 54], [-5, 52]]],
         *   [[[-15, 42], [-14, 46], [-12, 41], [-17, 44], [-15, 42]]],
         * ]);
         *
         * //=polygons
         */
        function polygons(coordinates, properties, options) {
            if (options === void 0) { options = {}; }
            return featureCollection(coordinates.map(function (coords) {
                return polygon(coords, properties);
            }), options);
        }
        exports.polygons = polygons;
        /**
         * Creates a {@link LineString} {@link Feature} from an Array of Positions.
         *
         * @name lineString
         * @param {Array<Array<number>>} coordinates an array of Positions
         * @param {Object} [properties={}] an Object of key-value pairs to add as properties
         * @param {Object} [options={}] Optional Parameters
         * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
         * @param {string|number} [options.id] Identifier associated with the Feature
         * @returns {Feature<LineString>} LineString Feature
         * @example
         * var linestring1 = turf.lineString([[-24, 63], [-23, 60], [-25, 65], [-20, 69]], {name: 'line 1'});
         * var linestring2 = turf.lineString([[-14, 43], [-13, 40], [-15, 45], [-10, 49]], {name: 'line 2'});
         *
         * //=linestring1
         * //=linestring2
         */
        function lineString(coordinates, properties, options) {
            if (options === void 0) { options = {}; }
            if (coordinates.length < 2) {
                throw new Error("coordinates must be an array of two or more positions");
            }
            var geom = {
                type: "LineString",
                coordinates: coordinates,
            };
            return feature(geom, properties, options);
        }
        exports.lineString = lineString;
        /**
         * Creates a {@link LineString} {@link FeatureCollection} from an Array of LineString coordinates.
         *
         * @name lineStrings
         * @param {Array<Array<Array<number>>>} coordinates an array of LinearRings
         * @param {Object} [properties={}] an Object of key-value pairs to add as properties
         * @param {Object} [options={}] Optional Parameters
         * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north]
         * associated with the FeatureCollection
         * @param {string|number} [options.id] Identifier associated with the FeatureCollection
         * @returns {FeatureCollection<LineString>} LineString FeatureCollection
         * @example
         * var linestrings = turf.lineStrings([
         *   [[-24, 63], [-23, 60], [-25, 65], [-20, 69]],
         *   [[-14, 43], [-13, 40], [-15, 45], [-10, 49]]
         * ]);
         *
         * //=linestrings
         */
        function lineStrings(coordinates, properties, options) {
            if (options === void 0) { options = {}; }
            return featureCollection(coordinates.map(function (coords) {
                return lineString(coords, properties);
            }), options);
        }
        exports.lineStrings = lineStrings;
        /**
         * Takes one or more {@link Feature|Features} and creates a {@link FeatureCollection}.
         *
         * @name featureCollection
         * @param {Feature[]} features input features
         * @param {Object} [options={}] Optional Parameters
         * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
         * @param {string|number} [options.id] Identifier associated with the Feature
         * @returns {FeatureCollection} FeatureCollection of Features
         * @example
         * var locationA = turf.point([-75.343, 39.984], {name: 'Location A'});
         * var locationB = turf.point([-75.833, 39.284], {name: 'Location B'});
         * var locationC = turf.point([-75.534, 39.123], {name: 'Location C'});
         *
         * var collection = turf.featureCollection([
         *   locationA,
         *   locationB,
         *   locationC
         * ]);
         *
         * //=collection
         */
        function featureCollection(features, options) {
            if (options === void 0) { options = {}; }
            var fc = { type: "FeatureCollection" };
            if (options.id) {
                fc.id = options.id;
            }
            if (options.bbox) {
                fc.bbox = options.bbox;
            }
            fc.features = features;
            return fc;
        }
        exports.featureCollection = featureCollection;
        /**
         * Creates a {@link Feature<MultiLineString>} based on a
         * coordinate array. Properties can be added optionally.
         *
         * @name multiLineString
         * @param {Array<Array<Array<number>>>} coordinates an array of LineStrings
         * @param {Object} [properties={}] an Object of key-value pairs to add as properties
         * @param {Object} [options={}] Optional Parameters
         * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
         * @param {string|number} [options.id] Identifier associated with the Feature
         * @returns {Feature<MultiLineString>} a MultiLineString feature
         * @throws {Error} if no coordinates are passed
         * @example
         * var multiLine = turf.multiLineString([[[0,0],[10,10]]]);
         *
         * //=multiLine
         */
        function multiLineString(coordinates, properties, options) {
            if (options === void 0) { options = {}; }
            var geom = {
                type: "MultiLineString",
                coordinates: coordinates,
            };
            return feature(geom, properties, options);
        }
        exports.multiLineString = multiLineString;
        /**
         * Creates a {@link Feature<MultiPoint>} based on a
         * coordinate array. Properties can be added optionally.
         *
         * @name multiPoint
         * @param {Array<Array<number>>} coordinates an array of Positions
         * @param {Object} [properties={}] an Object of key-value pairs to add as properties
         * @param {Object} [options={}] Optional Parameters
         * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
         * @param {string|number} [options.id] Identifier associated with the Feature
         * @returns {Feature<MultiPoint>} a MultiPoint feature
         * @throws {Error} if no coordinates are passed
         * @example
         * var multiPt = turf.multiPoint([[0,0],[10,10]]);
         *
         * //=multiPt
         */
        function multiPoint(coordinates, properties, options) {
            if (options === void 0) { options = {}; }
            var geom = {
                type: "MultiPoint",
                coordinates: coordinates,
            };
            return feature(geom, properties, options);
        }
        exports.multiPoint = multiPoint;
        /**
         * Creates a {@link Feature<MultiPolygon>} based on a
         * coordinate array. Properties can be added optionally.
         *
         * @name multiPolygon
         * @param {Array<Array<Array<Array<number>>>>} coordinates an array of Polygons
         * @param {Object} [properties={}] an Object of key-value pairs to add as properties
         * @param {Object} [options={}] Optional Parameters
         * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
         * @param {string|number} [options.id] Identifier associated with the Feature
         * @returns {Feature<MultiPolygon>} a multipolygon feature
         * @throws {Error} if no coordinates are passed
         * @example
         * var multiPoly = turf.multiPolygon([[[[0,0],[0,10],[10,10],[10,0],[0,0]]]]);
         *
         * //=multiPoly
         *
         */
        function multiPolygon(coordinates, properties, options) {
            if (options === void 0) { options = {}; }
            var geom = {
                type: "MultiPolygon",
                coordinates: coordinates,
            };
            return feature(geom, properties, options);
        }
        exports.multiPolygon = multiPolygon;
        /**
         * Creates a {@link Feature<GeometryCollection>} based on a
         * coordinate array. Properties can be added optionally.
         *
         * @name geometryCollection
         * @param {Array<Geometry>} geometries an array of GeoJSON Geometries
         * @param {Object} [properties={}] an Object of key-value pairs to add as properties
         * @param {Object} [options={}] Optional Parameters
         * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
         * @param {string|number} [options.id] Identifier associated with the Feature
         * @returns {Feature<GeometryCollection>} a GeoJSON GeometryCollection Feature
         * @example
         * var pt = turf.geometry("Point", [100, 0]);
         * var line = turf.geometry("LineString", [[101, 0], [102, 1]]);
         * var collection = turf.geometryCollection([pt, line]);
         *
         * // => collection
         */
        function geometryCollection(geometries, properties, options) {
            if (options === void 0) { options = {}; }
            var geom = {
                type: "GeometryCollection",
                geometries: geometries,
            };
            return feature(geom, properties, options);
        }
        exports.geometryCollection = geometryCollection;
        /**
         * Round number to precision
         *
         * @param {number} num Number
         * @param {number} [precision=0] Precision
         * @returns {number} rounded number
         * @example
         * turf.round(120.4321)
         * //=120
         *
         * turf.round(120.4321, 2)
         * //=120.43
         */
        function round(num, precision) {
            if (precision === void 0) { precision = 0; }
            if (precision && !(precision >= 0)) {
                throw new Error("precision must be a positive number");
            }
            var multiplier = Math.pow(10, precision || 0);
            return Math.round(num * multiplier) / multiplier;
        }
        exports.round = round;
        /**
         * Convert a distance measurement (assuming a spherical Earth) from radians to a more friendly unit.
         * Valid units: miles, nauticalmiles, inches, yards, meters, metres, kilometers, centimeters, feet
         *
         * @name radiansToLength
         * @param {number} radians in radians across the sphere
         * @param {string} [units="kilometers"] can be degrees, radians, miles, or kilometers inches, yards, metres,
         * meters, kilometres, kilometers.
         * @returns {number} distance
         */
        function radiansToLength(radians, units) {
            if (units === void 0) { units = "kilometers"; }
            var factor = exports.factors[units];
            if (!factor) {
                throw new Error(units + " units is invalid");
            }
            return radians * factor;
        }
        exports.radiansToLength = radiansToLength;
        /**
         * Convert a distance measurement (assuming a spherical Earth) from a real-world unit into radians
         * Valid units: miles, nauticalmiles, inches, yards, meters, metres, kilometers, centimeters, feet
         *
         * @name lengthToRadians
         * @param {number} distance in real units
         * @param {string} [units="kilometers"] can be degrees, radians, miles, or kilometers inches, yards, metres,
         * meters, kilometres, kilometers.
         * @returns {number} radians
         */
        function lengthToRadians(distance, units) {
            if (units === void 0) { units = "kilometers"; }
            var factor = exports.factors[units];
            if (!factor) {
                throw new Error(units + " units is invalid");
            }
            return distance / factor;
        }
        exports.lengthToRadians = lengthToRadians;
        /**
         * Convert a distance measurement (assuming a spherical Earth) from a real-world unit into degrees
         * Valid units: miles, nauticalmiles, inches, yards, meters, metres, centimeters, kilometres, feet
         *
         * @name lengthToDegrees
         * @param {number} distance in real units
         * @param {string} [units="kilometers"] can be degrees, radians, miles, or kilometers inches, yards, metres,
         * meters, kilometres, kilometers.
         * @returns {number} degrees
         */
        function lengthToDegrees(distance, units) {
            return radiansToDegrees(lengthToRadians(distance, units));
        }
        exports.lengthToDegrees = lengthToDegrees;
        /**
         * Converts any bearing angle from the north line direction (positive clockwise)
         * and returns an angle between 0-360 degrees (positive clockwise), 0 being the north line
         *
         * @name bearingToAzimuth
         * @param {number} bearing angle, between -180 and +180 degrees
         * @returns {number} angle between 0 and 360 degrees
         */
        function bearingToAzimuth(bearing) {
            var angle = bearing % 360;
            if (angle < 0) {
                angle += 360;
            }
            return angle;
        }
        exports.bearingToAzimuth = bearingToAzimuth;
        /**
         * Converts an angle in radians to degrees
         *
         * @name radiansToDegrees
         * @param {number} radians angle in radians
         * @returns {number} degrees between 0 and 360 degrees
         */
        function radiansToDegrees(radians) {
            var degrees = radians % (2 * Math.PI);
            return degrees * 180 / Math.PI;
        }
        exports.radiansToDegrees = radiansToDegrees;
        /**
         * Converts an angle in degrees to radians
         *
         * @name degreesToRadians
         * @param {number} degrees angle between 0 and 360 degrees
         * @returns {number} angle in radians
         */
        function degreesToRadians(degrees) {
            var radians = degrees % 360;
            return radians * Math.PI / 180;
        }
        exports.degreesToRadians = degreesToRadians;
        /**
         * Converts a length to the requested unit.
         * Valid units: miles, nauticalmiles, inches, yards, meters, metres, kilometers, centimeters, feet
         *
         * @param {number} length to be converted
         * @param {Units} [originalUnit="kilometers"] of the length
         * @param {Units} [finalUnit="kilometers"] returned unit
         * @returns {number} the converted length
         */
        function convertLength(length, originalUnit, finalUnit) {
            if (originalUnit === void 0) { originalUnit = "kilometers"; }
            if (finalUnit === void 0) { finalUnit = "kilometers"; }
            if (!(length >= 0)) {
                throw new Error("length must be a positive number");
            }
            return radiansToLength(lengthToRadians(length, originalUnit), finalUnit);
        }
        exports.convertLength = convertLength;
        /**
         * Converts a area to the requested unit.
         * Valid units: kilometers, kilometres, meters, metres, centimetres, millimeters, acres, miles, yards, feet, inches
         * @param {number} area to be converted
         * @param {Units} [originalUnit="meters"] of the distance
         * @param {Units} [finalUnit="kilometers"] returned unit
         * @returns {number} the converted distance
         */
        function convertArea(area, originalUnit, finalUnit) {
            if (originalUnit === void 0) { originalUnit = "meters"; }
            if (finalUnit === void 0) { finalUnit = "kilometers"; }
            if (!(area >= 0)) {
                throw new Error("area must be a positive number");
            }
            var startFactor = exports.areaFactors[originalUnit];
            if (!startFactor) {
                throw new Error("invalid original units");
            }
            var finalFactor = exports.areaFactors[finalUnit];
            if (!finalFactor) {
                throw new Error("invalid final units");
            }
            return (area / startFactor) * finalFactor;
        }
        exports.convertArea = convertArea;
        /**
         * isNumber
         *
         * @param {*} num Number to validate
         * @returns {boolean} true/false
         * @example
         * turf.isNumber(123)
         * //=true
         * turf.isNumber('foo')
         * //=false
         */
        function isNumber(num) {
            return !isNaN(num) && num !== null && !Array.isArray(num) && !/^\s*$/.test(num);
        }
        exports.isNumber = isNumber;
        /**
         * isObject
         *
         * @param {*} input variable to validate
         * @returns {boolean} true/false
         * @example
         * turf.isObject({elevation: 10})
         * //=true
         * turf.isObject('foo')
         * //=false
         */
        function isObject(input) {
            return (!!input) && (input.constructor === Object);
        }
        exports.isObject = isObject;
        /**
         * Validate BBox
         *
         * @private
         * @param {Array<number>} bbox BBox to validate
         * @returns {void}
         * @throws Error if BBox is not valid
         * @example
         * validateBBox([-180, -40, 110, 50])
         * //=OK
         * validateBBox([-180, -40])
         * //=Error
         * validateBBox('Foo')
         * //=Error
         * validateBBox(5)
         * //=Error
         * validateBBox(null)
         * //=Error
         * validateBBox(undefined)
         * //=Error
         */
        function validateBBox(bbox) {
            if (!bbox) {
                throw new Error("bbox is required");
            }
            if (!Array.isArray(bbox)) {
                throw new Error("bbox must be an Array");
            }
            if (bbox.length !== 4 && bbox.length !== 6) {
                throw new Error("bbox must be an Array of 4 or 6 numbers");
            }
            bbox.forEach(function (num) {
                if (!isNumber(num)) {
                    throw new Error("bbox must only contain numbers");
                }
            });
        }
        exports.validateBBox = validateBBox;
        /**
         * Validate Id
         *
         * @private
         * @param {string|number} id Id to validate
         * @returns {void}
         * @throws Error if Id is not valid
         * @example
         * validateId([-180, -40, 110, 50])
         * //=Error
         * validateId([-180, -40])
         * //=Error
         * validateId('Foo')
         * //=OK
         * validateId(5)
         * //=OK
         * validateId(null)
         * //=Error
         * validateId(undefined)
         * //=Error
         */
        function validateId(id) {
            if (!id) {
                throw new Error("id is required");
            }
            if (["string", "number"].indexOf(typeof id) === -1) {
                throw new Error("id must be a number or a string");
            }
        }
        exports.validateId = validateId;
        // Deprecated methods
        function radians2degrees() {
            throw new Error("method has been renamed to `radiansToDegrees`");
        }
        exports.radians2degrees = radians2degrees;
        function degrees2radians() {
            throw new Error("method has been renamed to `degreesToRadians`");
        }
        exports.degrees2radians = degrees2radians;
        function distanceToDegrees() {
            throw new Error("method has been renamed to `lengthToDegrees`");
        }
        exports.distanceToDegrees = distanceToDegrees;
        function distanceToRadians() {
            throw new Error("method has been renamed to `lengthToRadians`");
        }
        exports.distanceToRadians = distanceToRadians;
        function radiansToDistance() {
            throw new Error("method has been renamed to `radiansToLength`");
        }
        exports.radiansToDistance = radiansToDistance;
        function bearingToAngle() {
            throw new Error("method has been renamed to `bearingToAzimuth`");
        }
        exports.bearingToAngle = bearingToAngle;
        function convertDistance() {
            throw new Error("method has been renamed to `convertLength`");
        }
        exports.convertDistance = convertDistance;

        /**
         * 
         * @param {Array.<Number>} coords1
         * @param {Array.<Number>} coords2
         * @return {Boolean}
         * @memberof Cesium.turf
         */
        exports.lineEquals = function (coords1, coords2) {
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
        }

        /**
         * 
         * @param {Feature} ply1
         * @param {Feature} ply2
         * @return {Boolean}
         * @memberof Cesium.turf
         */
        exports.polygonEquals = function (ply1, ply2) {
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

        }
        /**
         * 
         * @param {Geojson} geoJSON
         * @return {FeatureCollection}
         * @memberof Cesium.turf
         */
        exports.removeDuplicate = function (geoJSON) {
            var fcs = [];
            turf.featureEach(geoJSON, function (fc) {
                if (fc.geometry.type == "Polygon") {
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
        }


        /**
          * 
          * @param {Feature<Point>|FeatureCollection} pt
          * @param {Feature|FeatureCollection} polygon
          * @return {Boolean}
          * @memberof Cesium.turf
          */
        turf.pointInPolygon = function (pt, polygon) {
            if (pt.type == "Feature") {
                pt = turf.featureCollection([pt])
            }
            if (polygon.type == "Feature") {
                polygon = turf.featureCollection([polygon])
            }
            var ptsWithin = turf.within(pt, polygon);
            if (ptsWithin && ptsWithin.features.length) {
                return true;
            }
            return false;
        }



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
                    if (fc.geometry.type == 'LineString') {
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
            if(multiLineString.features)multiLineString=multiLineString.features[0]
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

        /**
         * Unwrap a coordinate from a Point Feature, Geometry or a single coordinate.
         *
         * @name getCoord
         * @param {Array<number>|Geometry<Point>|Feature<Point>} coord GeoJSON Point or an Array of numbers
         * @returns {Array<number>} coordinates
         * @example
         * var pt = turf.point([10, 10]);
         *
         * var coord = turf.getCoord(pt);
         * //= [10, 10]
         */
        function getCoord(coord) {
            if (!coord) {
                throw new Error("coord is required");
            }
            if (!Array.isArray(coord)) {
                if (coord.type === "Feature" && coord.geometry !== null && coord.geometry.type === "Point") {
                    return coord.geometry.coordinates;
                }
                if (coord.type === "Point") {
                    return coord.coordinates;
                }
            }
            if (Array.isArray(coord) && coord.length >= 2 && !Array.isArray(coord[0]) && !Array.isArray(coord[1])) {
                return coord;
            }
            throw new Error("coord must be GeoJSON Point or an Array of numbers");
        }
        exports.getCoord = getCoord;

        /**
         * Get Geometry from Feature or Geometry Object
         *
         * @param {Feature|Geometry} geojson GeoJSON Feature or Geometry Object
         * @returns {Geometry|null} GeoJSON Geometry Object
         * @throws {Error} if geojson is not a Feature or Geometry Object
         * @example
         * var point = {
         *   "type": "Feature",
         *   "properties": {},
         *   "geometry": {
         *     "type": "Point",
         *     "coordinates": [110, 40]
         *   }
         * }
         * var geom = turf.getGeom(point)
         * //={"type": "Point", "coordinates": [110, 40]}
         */
        function getGeom(geojson) {
            if (geojson.type === "Feature") {
                return geojson.geometry;
            }
            return geojson;
        }
        exports.getGeom = getGeom;

        // http://en.wikipedia.org/wiki/Even%E2%80%93odd_rule
        // modified from: https://github.com/substack/point-in-polygon/blob/master/index.js
        // which was modified from http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
        /**
         * Takes a {@link Point} and a {@link Polygon} or {@link MultiPolygon} and determines if the point
         * resides inside the polygon. The polygon can be convex or concave. The function accounts for holes.
         *
         * @name booleanPointInPolygon
         * @param {Coord} point input point
         * @param {Feature<Polygon|MultiPolygon>} polygon input polygon or multipolygon
         * @param {Object} [options={}] Optional parameters
         * @param {boolean} [options.ignoreBoundary=false] True if polygon boundary should be ignored when determining if
         * the point is inside the polygon otherwise false.
         * @returns {boolean} `true` if the Point is inside the Polygon; `false` if the Point is not inside the Polygon
         * @example
         * var pt = turf.point([-77, 44]);
         * var poly = turf.polygon([[
         *   [-81, 41],
         *   [-81, 47],
         *   [-72, 47],
         *   [-72, 41],
         *   [-81, 41]
         * ]]);
         *
         * turf.booleanPointInPolygon(pt, poly);
         * //= true
         */
        function booleanPointInPolygon(point, polygon, options) {
            if (options === void 0) { options = {}; }
            // validation
            if (!point) {
                throw new Error("point is required");
            }
            if (!polygon) {
                throw new Error("polygon is required");
            }
            var pt = turf.getCoord(point);
            var geom = turf.getGeom(polygon);
            var type = geom.type;
            var bbox = polygon.bbox;
            var polys = geom.coordinates;
            // Quick elimination if point is not inside bbox
            if (bbox && inBBox(pt, bbox) === false) {
                return false;
            }
            // normalize to multipolygon
            if (type === "Polygon") {
                polys = [polys];
            }
            var insidePoly = false;
            for (var i = 0; i < polys.length && !insidePoly; i++) {
                // check if it is in the outer ring first
                if (inRing(pt, polys[i][0], options.ignoreBoundary)) {
                    var inHole = false;
                    var k = 1;
                    // check for the point in any of the holes
                    while (k < polys[i].length && !inHole) {
                        if (inRing(pt, polys[i][k], !options.ignoreBoundary)) {
                            inHole = true;
                        }
                        k++;
                    }
                    if (!inHole) {
                        insidePoly = true;
                    }
                }
            }
            return insidePoly;
        }
        exports.booleanPointInPolygon = booleanPointInPolygon;
        /**
         * inRing
         *
         * @private
         * @param {Array<number>} pt [x,y]
         * @param {Array<Array<number>>} ring [[x,y], [x,y],..]
         * @param {boolean} ignoreBoundary ignoreBoundary
         * @returns {boolean} inRing
         */
        function inRing(pt, ring, ignoreBoundary) {
            var isInside = false;
            if (ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]) {
                ring = ring.slice(0, ring.length - 1);
            }
            for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
                var xi = ring[i][0];
                var yi = ring[i][1];
                var xj = ring[j][0];
                var yj = ring[j][1];
                var onBoundary = (pt[1] * (xi - xj) + yi * (xj - pt[0]) + yj * (pt[0] - xi) === 0) &&
                    ((xi - pt[0]) * (xj - pt[0]) <= 0) && ((yi - pt[1]) * (yj - pt[1]) <= 0);
                if (onBoundary) {
                    return !ignoreBoundary;
                }
                var intersect = ((yi > pt[1]) !== (yj > pt[1])) &&
                    (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi);
                if (intersect) {
                    isInside = !isInside;
                }
            }
            return isInside;
        }
        /**
         * inBBox
         *
         * @private
         * @param {Position} pt point [x,y]
         * @param {BBox} bbox BBox [west, south, east, north]
         * @returns {boolean} true/false if point is inside BBox
         */
        function inBBox(pt, bbox) {
            return bbox[0] <= pt[0] &&
                bbox[1] <= pt[1] &&
                bbox[2] >= pt[0] &&
                bbox[3] >= pt[1];
        }

        if (turf.polygonToLineString) {
            turf.polygonToLine = turf.polygonToLineString
        }

        var helpers_1 = turf.helpers;

        //http://en.wikipedia.org/wiki/Haversine_formula
        //http://www.movable-type.co.uk/scripts/latlong.html
        /**
         * Calculates the distance between two {@link Point|points} in degrees, radians, miles, or kilometers.
         * This uses the [Haversine formula](http://en.wikipedia.org/wiki/Haversine_formula) to account for global curvature.
         *
         * @name distance
         * @param {Coord} from origin point
         * @param {Coord} to destination point
         * @param {Object} [options={}] Optional parameters
         * @param {string} [options.units='kilometers'] can be degrees, radians, miles, or kilometers
         * @returns {number} distance between the two points
         * @example
         * var from = turf.point([-75.343, 39.984]);
         * var to = turf.point([-75.534, 39.123]);
         * var options = {units: 'miles'};
         *
         * var distance = turf.distance(from, to, options);
         *
         * //addToMap
         * var addToMap = [from, to];
         * from.properties.distance = distance;
         * to.properties.distance = distance;
         */
        function distance(from, to, options) {
            if (options === void 0) { options = {}; }
            var coordinates1 = turf.getCoord(from);
            var coordinates2 = turf.getCoord(to);
            var dLat = helpers_1.degreesToRadians((coordinates2[1] - coordinates1[1]));
            var dLon = helpers_1.degreesToRadians((coordinates2[0] - coordinates1[0]));
            var lat1 = helpers_1.degreesToRadians(coordinates1[1]);
            var lat2 = helpers_1.degreesToRadians(coordinates2[1]);
            var a = Math.pow(Math.sin(dLat / 2), 2) +
                Math.pow(Math.sin(dLon / 2), 2) * Math.cos(lat1) * Math.cos(lat2);
            return helpers_1.radiansToLength(2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)), options.units);
        }
        exports.distance = distance;


        // http://en.wikipedia.org/wiki/Haversine_formula
        // http://www.movable-type.co.uk/scripts/latlong.html
        /**
         * Takes two {@link Point|points} and finds the geographic bearing between them,
         * i.e. the angle measured in degrees from the north line (0 degrees)
         *
         * @name bearing
         * @param {Coord} start starting Point
         * @param {Coord} end ending Point
         * @param {Object} [options={}] Optional parameters
         * @param {boolean} [options.final=false] calculates the final bearing if true
         * @returns {number} bearing in decimal degrees, between -180 and 180 degrees (positive clockwise)
         * @example
         * var point1 = turf.point([-75.343, 39.984]);
         * var point2 = turf.point([-75.534, 39.123]);
         *
         * var bearing = turf.bearing(point1, point2);
         *
         * //addToMap
         * var addToMap = [point1, point2]
         * point1.properties['marker-color'] = '#f00'
         * point2.properties['marker-color'] = '#0f0'
         * point1.properties.bearing = bearing
         */
        function bearing(start, end, options) {
            if (options === void 0) { options = {}; }
            // Reverse calculation
            if (options.final === true) {
                return calculateFinalBearing(start, end);
            }
            var coordinates1 = invariant_1.getCoord(start);
            var coordinates2 = invariant_1.getCoord(end);
            var lon1 = helpers_1.degreesToRadians(coordinates1[0]);
            var lon2 = helpers_1.degreesToRadians(coordinates2[0]);
            var lat1 = helpers_1.degreesToRadians(coordinates1[1]);
            var lat2 = helpers_1.degreesToRadians(coordinates2[1]);
            var a = Math.sin(lon2 - lon1) * Math.cos(lat2);
            var b = Math.cos(lat1) * Math.sin(lat2) -
                Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
            return helpers_1.radiansToDegrees(Math.atan2(a, b));
        }
        /**
         * Calculates Final Bearing
         *
         * @private
         * @param {Coord} start starting Point
         * @param {Coord} end ending Point
         * @returns {number} bearing
         */
        function calculateFinalBearing(start, end) {
            // Swap start & end
            var bear = bearing(end, start);
            bear = (bear + 180) % 360;
            return bear;
        }
        exports.bearing = bearing;


        var invariant_1 = turf.invariant;
        var meta_1 = turf.meta;
        var helpers = turf.helpers;

        /**
         * Callback for flattenEach
         *
         * @callback flattenEachCallback
         * @param {Feature} currentFeature The current flattened feature being processed.
         * @param {number} featureIndex The current index of the Feature being processed.
         * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed.
         */

        /**
         * Iterate over flattened features in any GeoJSON object, similar to
         * Array.forEach.
         *
         * @name flattenEach
         * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
         * @param {Function} callback a method that takes (currentFeature, featureIndex, multiFeatureIndex)
         * @example
         * var features = turf.featureCollection([
         *     turf.point([26, 37], {foo: 'bar'}),
         *     turf.multiPoint([[40, 30], [36, 53]], {hello: 'world'})
         * ]);
         *
         * turf.flattenEach(features, function (currentFeature, featureIndex, multiFeatureIndex) {
         *   //=currentFeature
         *   //=featureIndex
         *   //=multiFeatureIndex
         * });
         */
        function flattenEach(geojson, callback) {
            meta_1.geomEach(geojson, function (geometry, featureIndex, properties, bbox, id) {
                // Callback for single geometry
                var type = (geometry === null) ? null : geometry.type;
                switch (type) {
                    case null:
                    case 'Point':
                    case 'LineString':
                    case 'Polygon':
                        if (callback(helpers.feature(geometry, properties, { bbox: bbox, id: id }), featureIndex, 0) === false) return false;
                        return;
                }

                var geomType;

                // Callback for multi-geometry
                switch (type) {
                    case 'MultiPoint':
                        geomType = 'Point';
                        break;
                    case 'MultiLineString':
                        geomType = 'LineString';
                        break;
                    case 'MultiPolygon':
                        geomType = 'Polygon';
                        break;
                }

                for (var multiFeatureIndex = 0; multiFeatureIndex < geometry.coordinates.length; multiFeatureIndex++) {
                    var coordinate = geometry.coordinates[multiFeatureIndex];
                    var geom = {
                        type: geomType,
                        coordinates: coordinate
                    };
                    if (callback(helpers.feature(geom, properties), featureIndex, multiFeatureIndex) === false) return false;
                }
            });
        }

        turf.meta.flattenEach = flattenEach

        /**
         * Callback for flattenReduce
         *
         * The first time the callback function is called, the values provided as arguments depend
         * on whether the reduce method has an initialValue argument.
         *
         * If an initialValue is provided to the reduce method:
         *  - The previousValue argument is initialValue.
         *  - The currentValue argument is the value of the first element present in the array.
         *
         * If an initialValue is not provided:
         *  - The previousValue argument is the value of the first element present in the array.
         *  - The currentValue argument is the value of the second element present in the array.
         *
         * @callback flattenReduceCallback
         * @param {*} previousValue The accumulated value previously returned in the last invocation
         * of the callback, or initialValue, if supplied.
         * @param {Feature} currentFeature The current Feature being processed.
         * @param {number} featureIndex The current index of the Feature being processed.
         * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed.
         */

        /**
         * Reduce flattened features in any GeoJSON object, similar to Array.reduce().
         *
         * @name flattenReduce
         * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
         * @param {Function} callback a method that takes (previousValue, currentFeature, featureIndex, multiFeatureIndex)
         * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
         * @returns {*} The value that results from the reduction.
         * @example
         * var features = turf.featureCollection([
         *     turf.point([26, 37], {foo: 'bar'}),
         *     turf.multiPoint([[40, 30], [36, 53]], {hello: 'world'})
         * ]);
         *
         * turf.flattenReduce(features, function (previousValue, currentFeature, featureIndex, multiFeatureIndex) {
         *   //=previousValue
         *   //=currentFeature
         *   //=featureIndex
         *   //=multiFeatureIndex
         *   return currentFeature
         * });
         */
        function flattenReduce(geojson, callback, initialValue) {
            var previousValue = initialValue;
            flattenEach(geojson, function (currentFeature, featureIndex, multiFeatureIndex) {
                if (featureIndex === 0 && multiFeatureIndex === 0 && initialValue === undefined) previousValue = currentFeature;
                else previousValue = callback(previousValue, currentFeature, featureIndex, multiFeatureIndex);
            });
            return previousValue;
        }
        turf.meta.flattenReduce = flattenReduce

        /**
         * Callback for segmentEach
         *
         * @callback segmentEachCallback
         * @param {Feature<LineString>} currentSegment The current Segment being processed.
         * @param {number} featureIndex The current index of the Feature being processed.
         * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed.
         * @param {number} geometryIndex The current index of the Geometry being processed.
         * @param {number} segmentIndex The current index of the Segment being processed.
         * @returns {void}
         */

        /**
         * Iterate over 2-vertex line segment in any GeoJSON object, similar to Array.forEach()
         * (Multi)Point geometries do not contain segments therefore they are ignored during this operation.
         *
         * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON
         * @param {Function} callback a method that takes (currentSegment, featureIndex, multiFeatureIndex, geometryIndex, segmentIndex)
         * @returns {void}
         * @example
         * var polygon = turf.polygon([[[-50, 5], [-40, -10], [-50, -10], [-40, 5], [-50, 5]]]);
         *
         * // Iterate over GeoJSON by 2-vertex segments
         * turf.segmentEach(polygon, function (currentSegment, featureIndex, multiFeatureIndex, geometryIndex, segmentIndex) {
         *   //=currentSegment
         *   //=featureIndex
         *   //=multiFeatureIndex
         *   //=geometryIndex
         *   //=segmentIndex
         * });
         *
         * // Calculate the total number of segments
         * var total = 0;
         * turf.segmentEach(polygon, function () {
         *     total++;
         * });
         */
        function segmentEach(geojson, callback) {
            meta_1.flattenEach(geojson, function (feature, featureIndex, multiFeatureIndex) {
                var segmentIndex = 0;

                // Exclude null Geometries
                if (!feature.geometry) return;
                // (Multi)Point geometries do not contain segments therefore they are ignored during this operation.
                var type = feature.geometry.type;
                if (type === 'Point' || type === 'MultiPoint') return;

                // Generate 2-vertex line segments
                var previousCoords;
                var previousFeatureIndex = 0;
                var previousMultiIndex = 0;
                var prevGeomIndex = 0;
                if (meta_1.coordEach(feature, function (currentCoord, coordIndex, featureIndexCoord, multiPartIndexCoord, geometryIndex) {
                    // Simulating a meta.coordReduce() since `reduce` operations cannot be stopped by returning `false`
                    if (previousCoords === undefined || featureIndex > previousFeatureIndex || multiPartIndexCoord > previousMultiIndex || geometryIndex > prevGeomIndex) {
                        previousCoords = currentCoord;
                        previousFeatureIndex = featureIndex;
                        previousMultiIndex = multiPartIndexCoord;
                        prevGeomIndex = geometryIndex;
                        segmentIndex = 0;
                        return;
                    }
                    var currentSegment = helpers.lineString([previousCoords, currentCoord], feature.properties);
                    if (callback(currentSegment, featureIndex, multiFeatureIndex, geometryIndex, segmentIndex) === false) return false;
                    segmentIndex++;
                    previousCoords = currentCoord;
                }) === false) return false;
            });
        }
        turf.meta.segmentEach = segmentEach

        /**
         * Callback for segmentReduce
         *
         * The first time the callback function is called, the values provided as arguments depend
         * on whether the reduce method has an initialValue argument.
         *
         * If an initialValue is provided to the reduce method:
         *  - The previousValue argument is initialValue.
         *  - The currentValue argument is the value of the first element present in the array.
         *
         * If an initialValue is not provided:
         *  - The previousValue argument is the value of the first element present in the array.
         *  - The currentValue argument is the value of the second element present in the array.
         *
         * @callback segmentReduceCallback
         * @param {*} previousValue The accumulated value previously returned in the last invocation
         * of the callback, or initialValue, if supplied.
         * @param {Feature<LineString>} currentSegment The current Segment being processed.
         * @param {number} featureIndex The current index of the Feature being processed.
         * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed.
         * @param {number} geometryIndex The current index of the Geometry being processed.
         * @param {number} segmentIndex The current index of the Segment being processed.
         */

        /**
         * Reduce 2-vertex line segment in any GeoJSON object, similar to Array.reduce()
         * (Multi)Point geometries do not contain segments therefore they are ignored during this operation.
         *
         * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON
         * @param {Function} callback a method that takes (previousValue, currentSegment, currentIndex)
         * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
         * @returns {void}
         * @example
         * var polygon = turf.polygon([[[-50, 5], [-40, -10], [-50, -10], [-40, 5], [-50, 5]]]);
         *
         * // Iterate over GeoJSON by 2-vertex segments
         * turf.segmentReduce(polygon, function (previousSegment, currentSegment, featureIndex, multiFeatureIndex, geometryIndex, segmentIndex) {
         *   //= previousSegment
         *   //= currentSegment
         *   //= featureIndex
         *   //= multiFeatureIndex
         *   //= geometryIndex
         *   //= segmentInex
         *   return currentSegment
         * });
         *
         * // Calculate the total number of segments
         * var initialValue = 0
         * var total = turf.segmentReduce(polygon, function (previousValue) {
         *     previousValue++;
         *     return previousValue;
         * }, initialValue);
         */
        function segmentReduce(geojson, callback, initialValue) {
            var previousValue = initialValue;
            var started = false;
            segmentEach(geojson, function (currentSegment, featureIndex, multiFeatureIndex, geometryIndex, segmentIndex) {
                if (started === false && initialValue === undefined) previousValue = currentSegment;
                else previousValue = callback(previousValue, currentSegment, featureIndex, multiFeatureIndex, geometryIndex, segmentIndex);
                started = true;
            });
            return previousValue;
        }
        turf.meta.segmentReduce = segmentReduce

        /**
         * Returns the minimum distance between a {@link Point} and a {@link LineString}, being the distance from a line the
         * minimum distance between the point and any segment of the `LineString`.
         *
         * @name pointToLineDistance
         * @param {Feature<Point>|Array<number>} pt Feature or Geometry
         * @param {Feature<LineString>} line GeoJSON Feature or Geometry
         * @param {Object} [options={}] Optional parameters
         * @param {string} [options.units="kilometers"] can be anything supported by turf/convertLength
         * (ex: degrees, radians, miles, or kilometers)
         * @param {string} [options.method="geodesic"] wether to calculate the distance based on geodesic (spheroid) or
         * planar (flat) method. Valid options are 'geodesic' or 'planar'.
         * @returns {number} distance between point and line
         * @example
         * var pt = turf.point([0, 0]);
         * var line = turf.lineString([[1, 1],[-1, 1]]);
         *
         * var distance = turf.pointToLineDistance(pt, line, {units: 'miles'});
         * //=69.11854715938406
         */
        function pointToLineDistance(pt, line, options) {
            if (line.type == 'FeatureCollection' && line.features) {
                line = line.features[0]
            }
            if (options === void 0) { options = {}; }
            // Optional parameters
            if (!options.method) {
                options.method = "geodesic";
            }
            if (!options.units) {
                options.units = "kilometers";
            }
            // validation
            if (!pt) {
                throw new Error("pt is required");
            }
            if (Array.isArray(pt)) {
                pt = helpers_1.point(pt);
            }
            else if (pt.type === "Point") {
                pt = helpers_1.feature(pt);
            }
            else {
                invariant_1.featureOf(pt, "Point", "point");
            }
            if (!line) {
                throw new Error("line is required");
            }
            if (Array.isArray(line)) {
                line = helpers_1.lineString(line);
            }
            else if (line.type === "LineString") {
                line = helpers_1.feature(line);
            }
            else {
                invariant_1.featureOf(line, "LineString", "line");
            }
            var distance = Infinity;
            var p = pt.geometry.coordinates;
            meta_1.segmentEach(line, function (segment) {
                var a = segment.geometry.coordinates[0];
                var b = segment.geometry.coordinates[1];
                var d = distanceToSegment(p, a, b, options);
                if (d < distance) {
                    distance = d;
                }
            });
            return helpers_1.convertLength(distance, "degrees", options.units);
        }
        /**
         * Returns the distance between a point P on a segment AB.
         *
         * @private
         * @param {Array<number>} p external point
         * @param {Array<number>} a first segment point
         * @param {Array<number>} b second segment point
         * @param {Object} [options={}] Optional parameters
         * @returns {number} distance
         */
        function distanceToSegment(p, a, b, options) {
            var v = [b[0] - a[0], b[1] - a[1]];
            var w = [p[0] - a[0], p[1] - a[1]];
            var c1 = dot(w, v);
            if (c1 <= 0) {
                return calcDistance(p, a, { method: options.method, units: "degrees" });
            }
            var c2 = dot(v, v);
            if (c2 <= c1) {
                return calcDistance(p, b, { method: options.method, units: "degrees" });
            }
            var b2 = c1 / c2;
            var Pb = [a[0] + (b2 * v[0]), a[1] + (b2 * v[1])];
            return calcDistance(p, Pb, { method: options.method, units: "degrees" });
        }
        function dot(u, v) {
            return (u[0] * v[0] + u[1] * v[1]);
        }
        function calcDistance(a, b, options) {
            return options.method === "planar" ? rhumbBearing(a, b, options) : rhumbDistance(a, b, options);
        }
        exports.pointToLineDistance = pointToLineDistance;


        /**
         * Takes two {@link Point|points} and finds the bearing angle between them along a Rhumb line
         * i.e. the angle measured in degrees start the north line (0 degrees)
         *
         * @name rhumbBearing
         * @param {Coord} start starting Point
         * @param {Coord} end ending Point
         * @param {Object} [options] Optional parameters
         * @param {boolean} [options.final=false] calculates the final bearing if true
         * @returns {number} bearing from north in decimal degrees, between -180 and 180 degrees (positive clockwise)
         * @example
         * var point1 = turf.point([-75.343, 39.984], {"marker-color": "#F00"});
         * var point2 = turf.point([-75.534, 39.123], {"marker-color": "#00F"});
         *
         * var bearing = turf.rhumbBearing(point1, point2);
         *
         * //addToMap
         * var addToMap = [point1, point2];
         * point1.properties.bearing = bearing;
         * point2.properties.bearing = bearing;
         */
        function rhumbBearing(start, end, options) {
            if (options === void 0) { options = {}; }
            var bear360;
            if (options.final) {
                bear360 = calculateRhumbBearing(invariant_1.getCoord(end), invariant_1.getCoord(start));
            }
            else {
                bear360 = calculateRhumbBearing(invariant_1.getCoord(start), invariant_1.getCoord(end));
            }
            var bear180 = (bear360 > 180) ? -(360 - bear360) : bear360;
            return bear180;
        }
        /**
         * Returns the bearing from ‘this’ point to destination point along a rhumb line.
         * Adapted from Geodesy: https://github.com/chrisveness/geodesy/blob/master/latlon-spherical.js
         *
         * @private
         * @param   {Array<number>} from - origin point.
         * @param   {Array<number>} to - destination point.
         * @returns {number} Bearing in degrees from north.
         * @example
         * var p1 = new LatLon(51.127, 1.338);
         * var p2 = new LatLon(50.964, 1.853);
         * var d = p1.rhumbBearingTo(p2); // 116.7 m
         */
        function calculateRhumbBearing(from, to) {
            // φ => phi
            // Δλ => deltaLambda
            // Δψ => deltaPsi
            // θ => theta
            var phi1 = helpers_1.degreesToRadians(from[1]);
            var phi2 = helpers_1.degreesToRadians(to[1]);
            var deltaLambda = helpers_1.degreesToRadians((to[0] - from[0]));
            // if deltaLambdaon over 180° take shorter rhumb line across the anti-meridian:
            if (deltaLambda > Math.PI) {
                deltaLambda -= 2 * Math.PI;
            }
            if (deltaLambda < -Math.PI) {
                deltaLambda += 2 * Math.PI;
            }
            var deltaPsi = Math.log(Math.tan(phi2 / 2 + Math.PI / 4) / Math.tan(phi1 / 2 + Math.PI / 4));
            var theta = Math.atan2(deltaLambda, deltaPsi);
            return (helpers_1.radiansToDegrees(theta) + 360) % 360;
        }
        exports.rhumbBearing = rhumbBearing;


        /**
         * Calculates the distance along a rhumb line between two {@link Point|points} in degrees, radians,
         * miles, or kilometers.
         *
         * @name rhumbDistance
         * @param {Coord} from origin point
         * @param {Coord} to destination point
         * @param {Object} [options] Optional parameters
         * @param {string} [options.units="kilometers"] can be degrees, radians, miles, or kilometers
         * @returns {number} distance between the two points
         * @example
         * var from = turf.point([-75.343, 39.984]);
         * var to = turf.point([-75.534, 39.123]);
         * var options = {units: 'miles'};
         *
         * var distance = turf.rhumbDistance(from, to, options);
         *
         * //addToMap
         * var addToMap = [from, to];
         * from.properties.distance = distance;
         * to.properties.distance = distance;
         */
        function rhumbDistance(from, to, options) {
            if (options === void 0) { options = {}; }
            var origin = invariant_1.getCoord(from);
            var destination = invariant_1.getCoord(to);
            // compensate the crossing of the 180th meridian (https://macwright.org/2016/09/26/the-180th-meridian.html)
            // solution from https://github.com/mapbox/mapbox-gl-js/issues/3250#issuecomment-294887678
            destination[0] += (destination[0] - origin[0] > 180) ? -360 : (origin[0] - destination[0] > 180) ? 360 : 0;
            var distanceInMeters = calculateRhumbDistance(origin, destination);
            var distance = helpers_1.convertLength(distanceInMeters, "meters", options.units);
            return distance;
        }
        /**
         * Returns the distance travelling from ‘this’ point to destination point along a rhumb line.
         * Adapted from Geodesy: https://github.com/chrisveness/geodesy/blob/master/latlon-spherical.js
         *
         * @private
         * @param   {Array<number>} origin point.
         * @param   {Array<number>} destination point.
         * @param   {number} [radius=6371e3] - (Mean) radius of earth (defaults to radius in metres).
         * @returns {number} Distance in km between this point and destination point (same units as radius).
         *
         * @example
         *     var p1 = new LatLon(51.127, 1.338);
         *     var p2 = new LatLon(50.964, 1.853);
         *     var d = p1.distanceTo(p2); // 40.31 km
         */
        function calculateRhumbDistance(origin, destination, radius) {
            // φ => phi
            // λ => lambda
            // ψ => psi
            // Δ => Delta
            // δ => delta
            // θ => theta
            radius = (radius === undefined) ? helpers_1.earthRadius : Number(radius);
            // see www.edwilliams.org/avform.htm#Rhumb
            var R = radius;
            var phi1 = origin[1] * Math.PI / 180;
            var phi2 = destination[1] * Math.PI / 180;
            var DeltaPhi = phi2 - phi1;
            var DeltaLambda = Math.abs(destination[0] - origin[0]) * Math.PI / 180;
            // if dLon over 180° take shorter rhumb line across the anti-meridian:
            if (DeltaLambda > Math.PI) {
                DeltaLambda -= 2 * Math.PI;
            }
            // on Mercator projection, longitude distances shrink by latitude; q is the 'stretch factor'
            // q becomes ill-conditioned along E-W line (0/0); use empirical tolerance to avoid it
            var DeltaPsi = Math.log(Math.tan(phi2 / 2 + Math.PI / 4) / Math.tan(phi1 / 2 + Math.PI / 4));
            var q = Math.abs(DeltaPsi) > 10e-12 ? DeltaPhi / DeltaPsi : Math.cos(phi1);
            // distance is pythagoras on 'stretched' Mercator projection
            var delta = Math.sqrt(DeltaPhi * DeltaPhi + q * q * DeltaLambda * DeltaLambda); // angular distance in radians
            var dist = delta * R;
            return dist;
        }

        exports.rhumbDistance = rhumbDistance;
        return turf;
    })