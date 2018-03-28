(function (f) {
    if (typeof exports === "object" && typeof module !== "undefined") { module.exports = f() }
    else if (typeof define === "function" && define.amd) { define([], f) } else { var g; if (typeof window !== "undefined") { g = window } else if (typeof global !== "undefined") { g = global } else if (typeof self !== "undefined") { g = self } else { g = this } g.turf = f() }
})(function () {
    var define, module, exports; return (function e(t, n, r) { function s(o, u) { if (!n[o]) { if (!t[o]) { var a = typeof require == "function" && require; if (!u && a) return a(o, !0); if (i) return i(o, !0); var f = new Error("Cannot find module '" + o + "'"); throw f.code = "MODULE_NOT_FOUND", f } var l = n[o] = { exports: {} }; t[o][0].call(l.exports, function (e) { var n = t[o][1][e]; return s(n ? n : e) }, l, l.exports, e, t, n, r) } return n[o].exports } var i = typeof require == "function" && require; for (var o = 0; o < r.length; o++) s(r[o]); return s })({
        1: [function (require, module, exports) {
            module.exports = {
                lineIntersect: require('@turf/line-intersect'),
                bboxClip: require('@turf/bbox-clip'),
                polygonToLineString: require('@turf/polygon-to-linestring')
            };
        }, { "@turf/bbox-clip": 2, "@turf/line-intersect": 7, "@turf/polygon-to-linestring": 17 }], 2: [function (require, module, exports) {
            var helpers = require('@turf/helpers');
            var lineclip = require('lineclip');
            var getCoords = require('@turf/invariant').getCoords;
            var lineString = helpers.lineString;
            var multiLineString = helpers.multiLineString;
            var polygon = helpers.polygon;
            var multiPolygon = helpers.multiPolygon;

            /**
             * Takes a {@link Feature} and a bbox and clips the feature to the bbox using [lineclip](https://github.com/mapbox/lineclip).
             * May result in degenerate edges when clipping Polygons.
             *
             * @name bbox-clip
             * @param {Feature<LineString|MultiLineString|Polygon|MultiPolygon>} feature feature to clip to the bbox
             * @param {Array<number>} bbox extent in [minX, minY, maxX, maxY] order
             * @returns {Feature<LineString|MultiLineString|Polygon|MultiPolygon>} clipped Feature
             * @example
             * var bbox = [0, 0, 10, 10];
             * var poly = {
             *   "type": "Feature",
             *   "properties": {},
             *   "geometry": {
             *     "type": "Polygon",
             *     "coordinates": [[[2, 2], [8, 4], [12, 8], [3, 7], [2, 2]]]
             *   }
             * }
             *
             * var clipped = turf.bboxClip(poly, bbox);
             *
             * //=clipped
             */
            module.exports = function (feature, bbox) {
                var geom = getGeom(feature);
                var coords = getCoords(feature);
                var properties = feature.properties;

                switch (geom) {
                    case 'LineString':
                    case 'MultiLineString':
                        var lines = [];
                        if (geom === 'LineString') coords = [coords];
                        coords.forEach(function (line) {
                            lineclip(line, bbox, lines);
                        });
                        if (lines.length === 1) return lineString(lines[0], properties);
                        return multiLineString(lines, properties);
                    case 'Polygon':
                        return polygon(clipPolygon(coords, bbox), properties);
                    case 'MultiPolygon':
                        return multiPolygon(coords.map(function (polygon) {
                            return clipPolygon(polygon, bbox);
                        }), properties);
                    default:
                        throw new Error('geometry ' + geom + ' not supported');
                }
            };

            function clipPolygon(rings, bbox) {
                var outRings = [];
                for (var i = 0; i < rings.length; i++) {
                    var clipped = lineclip.polygon(rings[i], bbox);
                    if (clipped.length > 0) {
                        if (clipped[0][0] !== clipped[clipped.length - 1][0] || clipped[0][1] !== clipped[clipped.length - 1][1]) {
                            clipped.push(clipped[0]);
                        }
                        outRings.push(clipped);
                    }
                }
                return outRings;
            }

            function getGeom(feature) {
                return (feature.geometry) ? feature.geometry.type : feature.type;
            }

        }, { "@turf/helpers": 3, "@turf/invariant": 4, "lineclip": 21 }], 3: [function (require, module, exports) {
            /**
             * Wraps a GeoJSON {@link Geometry} in a GeoJSON {@link Feature}.
             *
             * @name feature
             * @param {Geometry} geometry input geometry
             * @param {Object} properties properties
             * @returns {FeatureCollection} a FeatureCollection of input features
             * @example
             * var geometry = {
             *      "type": "Point",
             *      "coordinates": [
             *        67.5,
             *        32.84267363195431
             *      ]
             *    }
             *
             * var feature = turf.feature(geometry);
             *
             * //=feature
             */
            function feature(geometry, properties) {
                if (!geometry) throw new Error('No geometry passed');

                return {
                    type: 'Feature',
                    properties: properties || {},
                    geometry: geometry
                };
            }

            /**
             * Takes coordinates and properties (optional) and returns a new {@link Point} feature.
             *
             * @name point
             * @param {Array<number>} coordinates longitude, latitude position (each in decimal degrees)
             * @param {Object=} properties an Object that is used as the {@link Feature}'s
             * properties
             * @returns {Feature<Point>} a Point feature
             * @example
             * var pt1 = turf.point([-75.343, 39.984]);
             *
             * //=pt1
             */
            function point(coordinates, properties) {
                if (!coordinates) throw new Error('No coordinates passed');
                if (coordinates.length === undefined) throw new Error('Coordinates must be an array');
                if (coordinates.length < 2) throw new Error('Coordinates must be at least 2 numbers long');
                if (typeof coordinates[0] !== 'number' || typeof coordinates[1] !== 'number') throw new Error('Coordinates must numbers');

                return feature({
                    type: 'Point',
                    coordinates: coordinates
                }, properties);
            }

            /**
             * Takes an array of LinearRings and optionally an {@link Object} with properties and returns a {@link Polygon} feature.
             *
             * @name polygon
             * @param {Array<Array<Array<number>>>} coordinates an array of LinearRings
             * @param {Object=} properties a properties object
             * @returns {Feature<Polygon>} a Polygon feature
             * @throws {Error} throw an error if a LinearRing of the polygon has too few positions
             * or if a LinearRing of the Polygon does not have matching Positions at the
             * beginning & end.
             * @example
             * var polygon = turf.polygon([[
             *  [-2.275543, 53.464547],
             *  [-2.275543, 53.489271],
             *  [-2.215118, 53.489271],
             *  [-2.215118, 53.464547],
             *  [-2.275543, 53.464547]
             * ]], { name: 'poly1', population: 400});
             *
             * //=polygon
             */
            function polygon(coordinates, properties) {
                if (!coordinates) throw new Error('No coordinates passed');

                for (var i = 0; i < coordinates.length; i++) {
                    var ring = coordinates[i];
                    if (ring.length < 4) {
                        throw new Error('Each LinearRing of a Polygon must have 4 or more Positions.');
                    }
                    for (var j = 0; j < ring[ring.length - 1].length; j++) {
                        if (ring[ring.length - 1][j] !== ring[0][j]) {
                            throw new Error('First and last Position are not equivalent.');
                        }
                    }
                }

                return feature({
                    type: 'Polygon',
                    coordinates: coordinates
                }, properties);
            }

            /**
             * Creates a {@link LineString} based on a
             * coordinate array. Properties can be added optionally.
             *
             * @name lineString
             * @param {Array<Array<number>>} coordinates an array of Positions
             * @param {Object=} properties an Object of key-value pairs to add as properties
             * @returns {Feature<LineString>} a LineString feature
             * @throws {Error} if no coordinates are passed
             * @example
             * var linestring1 = turf.lineString([
             *   [-21.964416, 64.148203],
             *   [-21.956176, 64.141316],
             *   [-21.93901, 64.135924],
             *   [-21.927337, 64.136673]
             * ]);
             * var linestring2 = turf.lineString([
             *   [-21.929054, 64.127985],
             *   [-21.912918, 64.134726],
             *   [-21.916007, 64.141016],
             *   [-21.930084, 64.14446]
             * ], {name: 'line 1', distance: 145});
             *
             * //=linestring1
             *
             * //=linestring2
             */
            function lineString(coordinates, properties) {
                if (!coordinates) throw new Error('No coordinates passed');

                return feature({
                    type: 'LineString',
                    coordinates: coordinates
                }, properties);
            }

            /**
             * Takes one or more {@link Feature|Features} and creates a {@link FeatureCollection}.
             *
             * @name featureCollection
             * @param {Feature[]} features input features
             * @returns {FeatureCollection} a FeatureCollection of input features
             * @example
             * var features = [
             *  turf.point([-75.343, 39.984], {name: 'Location A'}),
             *  turf.point([-75.833, 39.284], {name: 'Location B'}),
             *  turf.point([-75.534, 39.123], {name: 'Location C'})
             * ];
             *
             * var fc = turf.featureCollection(features);
             *
             * //=fc
             */
            function featureCollection(features) {
                if (!features) throw new Error('No features passed');

                return {
                    type: 'FeatureCollection',
                    features: features
                };
            }

            /**
             * Creates a {@link Feature<MultiLineString>} based on a
             * coordinate array. Properties can be added optionally.
             *
             * @name multiLineString
             * @param {Array<Array<Array<number>>>} coordinates an array of LineStrings
             * @param {Object=} properties an Object of key-value pairs to add as properties
             * @returns {Feature<MultiLineString>} a MultiLineString feature
             * @throws {Error} if no coordinates are passed
             * @example
             * var multiLine = turf.multiLineString([[[0,0],[10,10]]]);
             *
             * //=multiLine
             *
             */
            function multiLineString(coordinates, properties) {
                if (!coordinates) throw new Error('No coordinates passed');

                return feature({
                    type: 'MultiLineString',
                    coordinates: coordinates
                }, properties);
            }

            /**
             * Creates a {@link Feature<MultiPoint>} based on a
             * coordinate array. Properties can be added optionally.
             *
             * @name multiPoint
             * @param {Array<Array<number>>} coordinates an array of Positions
             * @param {Object=} properties an Object of key-value pairs to add as properties
             * @returns {Feature<MultiPoint>} a MultiPoint feature
             * @throws {Error} if no coordinates are passed
             * @example
             * var multiPt = turf.multiPoint([[0,0],[10,10]]);
             *
             * //=multiPt
             *
             */
            function multiPoint(coordinates, properties) {
                if (!coordinates) throw new Error('No coordinates passed');

                return feature({
                    type: 'MultiPoint',
                    coordinates: coordinates
                }, properties);
            }


            /**
             * Creates a {@link Feature<MultiPolygon>} based on a
             * coordinate array. Properties can be added optionally.
             *
             * @name multiPolygon
             * @param {Array<Array<Array<Array<number>>>>} coordinates an array of Polygons
             * @param {Object=} properties an Object of key-value pairs to add as properties
             * @returns {Feature<MultiPolygon>} a multipolygon feature
             * @throws {Error} if no coordinates are passed
             * @example
             * var multiPoly = turf.multiPolygon([[[[0,0],[0,10],[10,10],[10,0],[0,0]]]]);
             *
             * //=multiPoly
             *
             */
            function multiPolygon(coordinates, properties) {
                if (!coordinates) throw new Error('No coordinates passed');

                return feature({
                    type: 'MultiPolygon',
                    coordinates: coordinates
                }, properties);
            }

            /**
             * Creates a {@link Feature<GeometryCollection>} based on a
             * coordinate array. Properties can be added optionally.
             *
             * @name geometryCollection
             * @param {Array<{Geometry}>} geometries an array of GeoJSON Geometries
             * @param {Object=} properties an Object of key-value pairs to add as properties
             * @returns {Feature<GeometryCollection>} a GeoJSON GeometryCollection Feature
             * @example
             * var pt = {
             *     "type": "Point",
             *       "coordinates": [100, 0]
             *     };
             * var line = {
             *     "type": "LineString",
             *     "coordinates": [ [101, 0], [102, 1] ]
             *   };
             * var collection = turf.geometryCollection([pt, line]);
             *
             * //=collection
             */
            function geometryCollection(geometries, properties) {
                if (!geometries) throw new Error('No geometries passed');

                return feature({
                    type: 'GeometryCollection',
                    geometries: geometries
                }, properties);
            }

            var factors = {
                miles: 3960,
                nauticalmiles: 3441.145,
                degrees: 57.2957795,
                radians: 1,
                inches: 250905600,
                yards: 6969600,
                meters: 6373000,
                metres: 6373000,
                kilometers: 6373,
                kilometres: 6373,
                feet: 20908792.65
            };

            /**
             * Convert a distance measurement from radians to a more friendly unit.
             *
             * @name radiansToDistance
             * @param {number} radians in radians across the sphere
             * @param {string} [units=kilometers] can be degrees, radians, miles, or kilometers inches, yards, metres, meters, kilometres, kilometers.
             * @returns {number} distance
             */
            function radiansToDistance(radians, units) {
                var factor = factors[units || 'kilometers'];
                if (factor === undefined) throw new Error('Invalid unit');

                return radians * factor;
            }

            /**
             * Convert a distance measurement from a real-world unit into radians
             *
             * @name distanceToRadians
             * @param {number} distance in real units
             * @param {string} [units=kilometers] can be degrees, radians, miles, or kilometers inches, yards, metres, meters, kilometres, kilometers.
             * @returns {number} radians
             */
            function distanceToRadians(distance, units) {
                var factor = factors[units || 'kilometers'];
                if (factor === undefined) throw new Error('Invalid unit');

                return distance / factor;
            }

            /**
             * Convert a distance measurement from a real-world unit into degrees
             *
             * @name distanceToDegrees
             * @param {number} distance in real units
             * @param {string} [units=kilometers] can be degrees, radians, miles, or kilometers inches, yards, metres, meters, kilometres, kilometers.
             * @returns {number} degrees
             */
            function distanceToDegrees(distance, units) {
                var factor = factors[units || 'kilometers'];
                if (factor === undefined) throw new Error('Invalid unit');

                return (distance / factor) * 57.2958;
            }

            module.exports = {
                feature: feature,
                featureCollection: featureCollection,
                geometryCollection: geometryCollection,
                point: point,
                multiPoint: multiPoint,
                lineString: lineString,
                multiLineString: multiLineString,
                polygon: polygon,
                multiPolygon: multiPolygon,
                radiansToDistance: radiansToDistance,
                distanceToRadians: distanceToRadians,
                distanceToDegrees: distanceToDegrees
            };

        }, {}], 4: [function (require, module, exports) {
            /**
             * Unwrap a coordinate from a Point Feature, Geometry or a single coordinate.
             *
             * @name getCoord
             * @param {Array<any>|Geometry|Feature<Point>} obj any value
             * @returns {Array<number>} coordinates
             */
            function getCoord(obj) {
                if (!obj) throw new Error('No obj passed');

                var coordinates = getCoords(obj);

                // getCoord() must contain at least two numbers (Point)
                if (coordinates.length > 1 &&
                    typeof coordinates[0] === 'number' &&
                    typeof coordinates[1] === 'number') {
                    return coordinates;
                } else {
                    throw new Error('Coordinate is not a valid Point');
                }
            }

            /**
             * Unwrap coordinates from a Feature, Geometry Object or an Array of numbers
             *
             * @name getCoords
             * @param {Array<any>|Geometry|Feature<any>} obj any value
             * @returns {Array<any>} coordinates
             */
            function getCoords(obj) {
                if (!obj) throw new Error('No obj passed');
                var coordinates;

                // Array of numbers
                if (obj.length) {
                    coordinates = obj;

                    // Geometry Object
                } else if (obj.coordinates) {
                    coordinates = obj.coordinates;

                    // Feature
                } else if (obj.geometry && obj.geometry.coordinates) {
                    coordinates = obj.geometry.coordinates;
                }
                // Checks if coordinates contains a number
                if (coordinates) {
                    containsNumber(coordinates);
                    return coordinates;
                }
                throw new Error('No valid coordinates');
            }

            /**
             * Checks if coordinates contains a number
             *
             * @name containsNumber
             * @param {Array<any>} coordinates GeoJSON Coordinates
             * @returns {boolean} true if Array contains a number
             */
            function containsNumber(coordinates) {
                if (coordinates.length > 1 &&
                    typeof coordinates[0] === 'number' &&
                    typeof coordinates[1] === 'number') {
                    return true;
                }

                if (Array.isArray(coordinates[0]) && coordinates[0].length) {
                    return containsNumber(coordinates[0]);
                }
                throw new Error('coordinates must only contain numbers');
            }

            /**
             * Enforce expectations about types of GeoJSON objects for Turf.
             *
             * @name geojsonType
             * @param {GeoJSON} value any GeoJSON object
             * @param {string} type expected GeoJSON type
             * @param {string} name name of calling function
             * @throws {Error} if value is not the expected type.
             */
            function geojsonType(value, type, name) {
                if (!type || !name) throw new Error('type and name required');

                if (!value || value.type !== type) {
                    throw new Error('Invalid input to ' + name + ': must be a ' + type + ', given ' + value.type);
                }
            }

            /**
             * Enforce expectations about types of {@link Feature} inputs for Turf.
             * Internally this uses {@link geojsonType} to judge geometry types.
             *
             * @name featureOf
             * @param {Feature} feature a feature with an expected geometry type
             * @param {string} type expected GeoJSON type
             * @param {string} name name of calling function
             * @throws {Error} error if value is not the expected type.
             */
            function featureOf(feature, type, name) {
                if (!feature) throw new Error('No feature passed');
                if (!name) throw new Error('.featureOf() requires a name');
                if (!feature || feature.type !== 'Feature' || !feature.geometry) {
                    throw new Error('Invalid input to ' + name + ', Feature with geometry required');
                }
                if (!feature.geometry || feature.geometry.type !== type) {
                    throw new Error('Invalid input to ' + name + ': must be a ' + type + ', given ' + feature.geometry.type);
                }
            }

            /**
             * Enforce expectations about types of {@link FeatureCollection} inputs for Turf.
             * Internally this uses {@link geojsonType} to judge geometry types.
             *
             * @name collectionOf
             * @param {FeatureCollection} featureCollection a FeatureCollection for which features will be judged
             * @param {string} type expected GeoJSON type
             * @param {string} name name of calling function
             * @throws {Error} if value is not the expected type.
             */
            function collectionOf(featureCollection, type, name) {
                if (!featureCollection) throw new Error('No featureCollection passed');
                if (!name) throw new Error('.collectionOf() requires a name');
                if (!featureCollection || featureCollection.type !== 'FeatureCollection') {
                    throw new Error('Invalid input to ' + name + ', FeatureCollection required');
                }
                for (var i = 0; i < featureCollection.features.length; i++) {
                    var feature = featureCollection.features[i];
                    if (!feature || feature.type !== 'Feature' || !feature.geometry) {
                        throw new Error('Invalid input to ' + name + ', Feature with geometry required');
                    }
                    if (!feature.geometry || feature.geometry.type !== type) {
                        throw new Error('Invalid input to ' + name + ': must be a ' + type + ', given ' + feature.geometry.type);
                    }
                }
            }

            module.exports = {
                geojsonType: geojsonType,
                collectionOf: collectionOf,
                featureOf: featureOf,
                getCoord: getCoord,
                getCoords: getCoords,
                containsNumber: containsNumber
            };

        }, {}], 5: [function (require, module, exports) {
            var each = require('@turf/meta').coordEach;

            /**
             * Takes a set of features, calculates the bbox of all input features, and returns a bounding box.
             *
             * @name bbox
             * @param {(Feature|FeatureCollection)} geojson input features
             * @return {Array<number>} bbox extent in [minX, minY, maxX, maxY] order
             * @example
             * var pt1 = turf.point([114.175329, 22.2524])
             * var pt2 = turf.point([114.170007, 22.267969])
             * var pt3 = turf.point([114.200649, 22.274641])
             * var pt4 = turf.point([114.200649, 22.274641])
             * var pt5 = turf.point([114.186744, 22.265745])
             * var features = turf.featureCollection([pt1, pt2, pt3, pt4, pt5])
             *
             * var bbox = turf.bbox(features);
             *
             * var bboxPolygon = turf.bboxPolygon(bbox);
             *
             * //=bbox
             *
             * //=bboxPolygon
             */
            module.exports = function (geojson) {
                var bbox = [Infinity, Infinity, -Infinity, -Infinity];
                each(geojson, function (coord) {
                    if (bbox[0] > coord[0]) bbox[0] = coord[0];
                    if (bbox[1] > coord[1]) bbox[1] = coord[1];
                    if (bbox[2] < coord[0]) bbox[2] = coord[0];
                    if (bbox[3] < coord[1]) bbox[3] = coord[1];
                });
                return bbox;
            };

        }, { "@turf/meta": 16 }], 6: [function (require, module, exports) {
            /**
             * Wraps a GeoJSON {@link Geometry} in a GeoJSON {@link Feature}.
             *
             * @name feature
             * @param {Geometry} geometry input geometry
             * @param {Object} properties properties
             * @returns {FeatureCollection} a FeatureCollection of input features
             * @example
             * var geometry = {
             *      "type": "Point",
             *      "coordinates": [
             *        67.5,
             *        32.84267363195431
             *      ]
             *    }
             *
             * var feature = turf.feature(geometry);
             *
             * //=feature
             */
            function feature(geometry, properties) {
                if (!geometry) throw new Error('No geometry passed');

                return {
                    type: 'Feature',
                    properties: properties || {},
                    geometry: geometry
                };
            }
            module.exports.feature = feature;

            /**
             * Takes coordinates and properties (optional) and returns a new {@link Point} feature.
             *
             * @name point
             * @param {Array<number>} coordinates longitude, latitude position (each in decimal degrees)
             * @param {Object=} properties an Object that is used as the {@link Feature}'s
             * properties
             * @returns {Feature<Point>} a Point feature
             * @example
             * var pt1 = turf.point([-75.343, 39.984]);
             *
             * //=pt1
             */
            module.exports.point = function (coordinates, properties) {
                if (!coordinates) throw new Error('No coordinates passed');
                if (coordinates.length === undefined) throw new Error('Coordinates must be an array');
                if (coordinates.length < 2) throw new Error('Coordinates must be at least 2 numbers long');
                if (typeof coordinates[0] !== 'number' || typeof coordinates[1] !== 'number') throw new Error('Coordinates must numbers');

                return feature({
                    type: 'Point',
                    coordinates: coordinates
                }, properties);
            };

            /**
             * Takes an array of LinearRings and optionally an {@link Object} with properties and returns a {@link Polygon} feature.
             *
             * @name polygon
             * @param {Array<Array<Array<number>>>} coordinates an array of LinearRings
             * @param {Object=} properties a properties object
             * @returns {Feature<Polygon>} a Polygon feature
             * @throws {Error} throw an error if a LinearRing of the polygon has too few positions
             * or if a LinearRing of the Polygon does not have matching Positions at the
             * beginning & end.
             * @example
             * var polygon = turf.polygon([[
             *  [-2.275543, 53.464547],
             *  [-2.275543, 53.489271],
             *  [-2.215118, 53.489271],
             *  [-2.215118, 53.464547],
             *  [-2.275543, 53.464547]
             * ]], { name: 'poly1', population: 400});
             *
             * //=polygon
             */
            module.exports.polygon = function (coordinates, properties) {
                if (!coordinates) throw new Error('No coordinates passed');

                for (var i = 0; i < coordinates.length; i++) {
                    var ring = coordinates[i];
                    if (ring.length < 4) {
                        throw new Error('Each LinearRing of a Polygon must have 4 or more Positions.');
                    }
                    for (var j = 0; j < ring[ring.length - 1].length; j++) {
                        if (ring[ring.length - 1][j] !== ring[0][j]) {
                            throw new Error('First and last Position are not equivalent.');
                        }
                    }
                }

                return feature({
                    type: 'Polygon',
                    coordinates: coordinates
                }, properties);
            };

            /**
             * Creates a {@link LineString} based on a
             * coordinate array. Properties can be added optionally.
             *
             * @name lineString
             * @param {Array<Array<number>>} coordinates an array of Positions
             * @param {Object=} properties an Object of key-value pairs to add as properties
             * @returns {Feature<LineString>} a LineString feature
             * @throws {Error} if no coordinates are passed
             * @example
             * var linestring1 = turf.lineString([
             *   [-21.964416, 64.148203],
             *   [-21.956176, 64.141316],
             *   [-21.93901, 64.135924],
             *   [-21.927337, 64.136673]
             * ]);
             * var linestring2 = turf.lineString([
             *   [-21.929054, 64.127985],
             *   [-21.912918, 64.134726],
             *   [-21.916007, 64.141016],
             *   [-21.930084, 64.14446]
             * ], {name: 'line 1', distance: 145});
             *
             * //=linestring1
             *
             * //=linestring2
             */
            module.exports.lineString = function (coordinates, properties) {
                if (!coordinates) throw new Error('No coordinates passed');

                return feature({
                    type: 'LineString',
                    coordinates: coordinates
                }, properties);
            };

            /**
             * Takes one or more {@link Feature|Features} and creates a {@link FeatureCollection}.
             *
             * @name featureCollection
             * @param {Feature[]} features input features
             * @returns {FeatureCollection} a FeatureCollection of input features
             * @example
             * var features = [
             *  turf.point([-75.343, 39.984], {name: 'Location A'}),
             *  turf.point([-75.833, 39.284], {name: 'Location B'}),
             *  turf.point([-75.534, 39.123], {name: 'Location C'})
             * ];
             *
             * var fc = turf.featureCollection(features);
             *
             * //=fc
             */
            module.exports.featureCollection = function (features) {
                if (!features) throw new Error('No features passed');

                return {
                    type: 'FeatureCollection',
                    features: features
                };
            };

            /**
             * Creates a {@link Feature<MultiLineString>} based on a
             * coordinate array. Properties can be added optionally.
             *
             * @name multiLineString
             * @param {Array<Array<Array<number>>>} coordinates an array of LineStrings
             * @param {Object=} properties an Object of key-value pairs to add as properties
             * @returns {Feature<MultiLineString>} a MultiLineString feature
             * @throws {Error} if no coordinates are passed
             * @example
             * var multiLine = turf.multiLineString([[[0,0],[10,10]]]);
             *
             * //=multiLine
             *
             */
            module.exports.multiLineString = function (coordinates, properties) {
                if (!coordinates) throw new Error('No coordinates passed');

                return feature({
                    type: 'MultiLineString',
                    coordinates: coordinates
                }, properties);
            };

            /**
             * Creates a {@link Feature<MultiPoint>} based on a
             * coordinate array. Properties can be added optionally.
             *
             * @name multiPoint
             * @param {Array<Array<number>>} coordinates an array of Positions
             * @param {Object=} properties an Object of key-value pairs to add as properties
             * @returns {Feature<MultiPoint>} a MultiPoint feature
             * @throws {Error} if no coordinates are passed
             * @example
             * var multiPt = turf.multiPoint([[0,0],[10,10]]);
             *
             * //=multiPt
             *
             */
            module.exports.multiPoint = function (coordinates, properties) {
                if (!coordinates) throw new Error('No coordinates passed');

                return feature({
                    type: 'MultiPoint',
                    coordinates: coordinates
                }, properties);
            };


            /**
             * Creates a {@link Feature<MultiPolygon>} based on a
             * coordinate array. Properties can be added optionally.
             *
             * @name multiPolygon
             * @param {Array<Array<Array<Array<number>>>>} coordinates an array of Polygons
             * @param {Object=} properties an Object of key-value pairs to add as properties
             * @returns {Feature<MultiPolygon>} a multipolygon feature
             * @throws {Error} if no coordinates are passed
             * @example
             * var multiPoly = turf.multiPolygon([[[[0,0],[0,10],[10,10],[10,0],[0,0]]]]);
             *
             * //=multiPoly
             *
             */
            module.exports.multiPolygon = function (coordinates, properties) {
                if (!coordinates) throw new Error('No coordinates passed');

                return feature({
                    type: 'MultiPolygon',
                    coordinates: coordinates
                }, properties);
            };

            /**
             * Creates a {@link Feature<GeometryCollection>} based on a
             * coordinate array. Properties can be added optionally.
             *
             * @name geometryCollection
             * @param {Array<{Geometry}>} geometries an array of GeoJSON Geometries
             * @param {Object=} properties an Object of key-value pairs to add as properties
             * @returns {Feature<GeometryCollection>} a GeoJSON GeometryCollection Feature
             * @example
             * var pt = {
             *     "type": "Point",
             *       "coordinates": [100, 0]
             *     };
             * var line = {
             *     "type": "LineString",
             *     "coordinates": [ [101, 0], [102, 1] ]
             *   };
             * var collection = turf.geometryCollection([pt, line]);
             *
             * //=collection
             */
            module.exports.geometryCollection = function (geometries, properties) {
                if (!geometries) throw new Error('No geometries passed');

                return feature({
                    type: 'GeometryCollection',
                    geometries: geometries
                }, properties);
            };

            var factors = {
                miles: 3960,
                nauticalmiles: 3441.145,
                degrees: 57.2957795,
                radians: 1,
                inches: 250905600,
                yards: 6969600,
                meters: 6373000,
                metres: 6373000,
                kilometers: 6373,
                kilometres: 6373,
                feet: 20908792.65
            };

            /*
             * Convert a distance measurement from radians to a more friendly unit.
             *
             * @name radiansToDistance
             * @param {number} distance in radians across the sphere
             * @param {string} [units=kilometers] can be degrees, radians, miles, or kilometers
             * inches, yards, metres, meters, kilometres, kilometers.
             * @returns {number} distance
             */
            module.exports.radiansToDistance = function (radians, units) {
                var factor = factors[units || 'kilometers'];
                if (factor === undefined) throw new Error('Invalid unit');

                return radians * factor;
            };

            /*
             * Convert a distance measurement from a real-world unit into radians
             *
             * @name distanceToRadians
             * @param {number} distance in real units
             * @param {string} [units=kilometers] can be degrees, radians, miles, or kilometers
             * inches, yards, metres, meters, kilometres, kilometers.
             * @returns {number} radians
             */
            module.exports.distanceToRadians = function (distance, units) {
                var factor = factors[units || 'kilometers'];
                if (factor === undefined) throw new Error('Invalid unit');

                return distance / factor;
            };

            /*
             * Convert a distance measurement from a real-world unit into degrees
             *
             * @name distanceToRadians
             * @param {number} distance in real units
             * @param {string} [units=kilometers] can be degrees, radians, miles, or kilometers
             * inches, yards, metres, meters, kilometres, kilometers.
             * @returns {number} degrees
             */
            module.exports.distanceToDegrees = function (distance, units) {
                var factor = factors[units || 'kilometers'];
                if (factor === undefined) throw new Error('Invalid unit');

                return (distance / factor) * 57.2958;
            };

        }, {}], 7: [function (require, module, exports) {
            var helpers = require('@turf/helpers');
            var meta = require('@turf/meta');
            var lineSegment = require('@turf/line-segment');
            var getCoords = require('@turf/invariant').getCoords;
            var rbush = require('geojson-rbush');
            var point = helpers.point;
            var featureCollection = helpers.featureCollection;
            var featureEach = meta.featureEach;

            /**
             * Takes any LineString or Polygon GeoJSON and returns the intersecting point(s).
             *
             * @name lineIntersect
             * @param {FeatureCollection|Feature<LineString|MultiLineString|Polygon|MultiPolygon>} line1 any LineString or Polygon
             * @param {FeatureCollection|Feature<LineString|MultiLineString|Polygon|MultiPolygon>} line2 any LineString or Polygon
             * @returns {FeatureCollection<Point>} point(s) that intersect both
             * @example
             * var line1 = {
             *   "type": "Feature",
             *   "properties": {},
             *   "geometry": {
             *     "type": "LineString",
             *     "coordinates": [[126, -11], [129, -21]]
             *   }
             * };
             * var line2 = {
             *   "type": "Feature",
             *   "properties": {},
             *   "geometry": {
             *     "type": "LineString",
             *     "coordinates": [[123, -18], [131, -14]]
             *   }
             * };
             * var points = turf.lineIntersect(line1, line2);
             * //= points
             */
            module.exports = function (line1, line2) {
                var results = [];
                // Handles simple 2-vertex segments
                if (line1.geometry.type === 'LineString' &&
                    line2.geometry.type === 'LineString' &&
                    line1.geometry.coordinates.length === 2 &&
                    line2.geometry.coordinates.length === 2) {
                    var intersect = intersects(line1, line2);
                    if (intersect) results.push(intersect);
                    return featureCollection(results);
                }
                // Handles complex GeoJSON Geometries
                var tree = rbush();
                tree.load(lineSegment(line2));
                featureEach(lineSegment(line1), function (segment) {
                    featureEach(tree.search(segment), function (match) {
                        var intersect = intersects(segment, match);
                        if (intersect) results.push(intersect);
                    });
                });
                return featureCollection(results);
            };

            /**
             * Find a point that intersects LineStrings with two coordinates each
             *
             * @private
             * @param {Feature<LineString>} line1 GeoJSON LineString (Must only contain 2 coordinates)
             * @param {Feature<LineString>} line2 GeoJSON LineString (Must only contain 2 coordinates)
             * @returns {Feature<Point>} intersecting GeoJSON Point
             */
            function intersects(line1, line2) {
                var coords1 = getCoords(line1);
                var coords2 = getCoords(line2);
                if (coords1.length !== 2) {
                    throw new Error('<intersects> line1 must only contain 2 coordinates');
                }
                if (coords2.length !== 2) {
                    throw new Error('<intersects> line2 must only contain 2 coordinates');
                }
                var x1 = coords1[0][0];
                var y1 = coords1[0][1];
                var x2 = coords1[1][0];
                var y2 = coords1[1][1];
                var x3 = coords2[0][0];
                var y3 = coords2[0][1];
                var x4 = coords2[1][0];
                var y4 = coords2[1][1];
                var denom = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1));
                var numeA = ((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3));
                var numeB = ((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3));

                if (denom === 0) {
                    if (numeA === 0 && numeB === 0) {
                        return null;
                    }
                    return null;
                }

                var uA = numeA / denom;
                var uB = numeB / denom;

                if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
                    var x = x1 + (uA * (x2 - x1));
                    var y = y1 + (uA * (y2 - y1));
                    return point([x, y]);
                }
                return null;
            }

        }, { "@turf/helpers": 8, "@turf/invariant": 9, "@turf/line-segment": 11, "@turf/meta": 10, "geojson-rbush": 20 }], 8: [function (require, module, exports) {
            arguments[4][3][0].apply(exports, arguments)
        }, { "dup": 3 }], 9: [function (require, module, exports) {
            arguments[4][4][0].apply(exports, arguments)
        }, { "dup": 4 }], 10: [function (require, module, exports) {
            /**
             * Callback for coordEach
             *
             * @private
             * @callback coordEachCallback
             * @param {Array<number>} currentCoords The current coordinates being processed.
             * @param {number} currentIndex The index of the current element being processed in the
             * array.Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
             */

            /**
             * Iterate over coordinates in any GeoJSON object, similar to Array.forEach()
             *
             * @name coordEach
             * @param {Object} layer any GeoJSON object
             * @param {Function} callback a method that takes (currentCoords, currentIndex)
             * @param {boolean} [excludeWrapCoord=false] whether or not to include
             * the final coordinate of LinearRings that wraps the ring in its iteration.
             * @example
             * var features = {
             *   "type": "FeatureCollection",
             *   "features": [
             *     {
             *       "type": "Feature",
             *       "properties": {},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [26, 37]
             *       }
             *     },
             *     {
             *       "type": "Feature",
             *       "properties": {},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [36, 53]
             *       }
             *     }
             *   ]
             * };
             * turf.coordEach(features, function (currentCoords, currentIndex) {
             *   //=currentCoords
             *   //=currentIndex
             * });
             */
            function coordEach(layer, callback, excludeWrapCoord) {
                var i, j, k, g, l, geometry, stopG, coords,
                    geometryMaybeCollection,
                    wrapShrink = 0,
                    currentIndex = 0,
                    isGeometryCollection,
                    isFeatureCollection = layer.type === 'FeatureCollection',
                    isFeature = layer.type === 'Feature',
                    stop = isFeatureCollection ? layer.features.length : 1;

                // This logic may look a little weird. The reason why it is that way
                // is because it's trying to be fast. GeoJSON supports multiple kinds
                // of objects at its root: FeatureCollection, Features, Geometries.
                // This function has the responsibility of handling all of them, and that
                // means that some of the `for` loops you see below actually just don't apply
                // to certain inputs. For instance, if you give this just a
                // Point geometry, then both loops are short-circuited and all we do
                // is gradually rename the input until it's called 'geometry'.
                //
                // This also aims to allocate as few resources as possible: just a
                // few numbers and booleans, rather than any temporary arrays as would
                // be required with the normalization approach.
                for (i = 0; i < stop; i++) {

                    geometryMaybeCollection = (isFeatureCollection ? layer.features[i].geometry :
                    (isFeature ? layer.geometry : layer));
                    isGeometryCollection = geometryMaybeCollection.type === 'GeometryCollection';
                    stopG = isGeometryCollection ? geometryMaybeCollection.geometries.length : 1;

                    for (g = 0; g < stopG; g++) {
                        geometry = isGeometryCollection ?
                        geometryMaybeCollection.geometries[g] : geometryMaybeCollection;
                        coords = geometry.coordinates;

                        wrapShrink = (excludeWrapCoord &&
                            (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon')) ?
                            1 : 0;

                        if (geometry.type === 'Point') {
                            callback(coords, currentIndex);
                            currentIndex++;
                        } else if (geometry.type === 'LineString' || geometry.type === 'MultiPoint') {
                            for (j = 0; j < coords.length; j++) {
                                callback(coords[j], currentIndex);
                                currentIndex++;
                            }
                        } else if (geometry.type === 'Polygon' || geometry.type === 'MultiLineString') {
                            for (j = 0; j < coords.length; j++)
                                for (k = 0; k < coords[j].length - wrapShrink; k++) {
                                    callback(coords[j][k], currentIndex);
                                    currentIndex++;
                                }
                        } else if (geometry.type === 'MultiPolygon') {
                            for (j = 0; j < coords.length; j++)
                                for (k = 0; k < coords[j].length; k++)
                                    for (l = 0; l < coords[j][k].length - wrapShrink; l++) {
                                        callback(coords[j][k][l], currentIndex);
                                        currentIndex++;
                                    }
                        } else if (geometry.type === 'GeometryCollection') {
                            for (j = 0; j < geometry.geometries.length; j++)
                                coordEach(geometry.geometries[j], callback, excludeWrapCoord);
                        } else {
                            throw new Error('Unknown Geometry Type');
                        }
                    }
                }
            }

            /**
             * Callback for coordReduce
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
             * @private
             * @callback coordReduceCallback
             * @param {*} previousValue The accumulated value previously returned in the last invocation
             * of the callback, or initialValue, if supplied.
             * @param {Array<Number>} currentCoords The current coordinate being processed.
             * @param {number} currentIndex The index of the current element being processed in the
             * array.Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
             */

            /**
             * Reduce coordinates in any GeoJSON object, similar to Array.reduce()
             *
             * @name coordReduce
             * @param {Object} layer any GeoJSON object
             * @param {Function} callback a method that takes (previousValue, currentCoords, currentIndex)
             * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
             * @param {boolean} [excludeWrapCoord=false] whether or not to include
             * the final coordinate of LinearRings that wraps the ring in its iteration.
             * @returns {*} The value that results from the reduction.
             * @example
             * var features = {
             *   "type": "FeatureCollection",
             *   "features": [
             *     {
             *       "type": "Feature",
             *       "properties": {},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [26, 37]
             *       }
             *     },
             *     {
             *       "type": "Feature",
             *       "properties": {},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [36, 53]
             *       }
             *     }
             *   ]
             * };
             * turf.coordReduce(features, function (previousValue, currentCoords, currentIndex) {
             *   //=previousValue
             *   //=currentCoords
             *   //=currentIndex
             *   return currentCoords;
             * });
             */
            function coordReduce(layer, callback, initialValue, excludeWrapCoord) {
                var previousValue = initialValue;
                coordEach(layer, function (currentCoords, currentIndex) {
                    if (currentIndex === 0 && initialValue === undefined) {
                        previousValue = currentCoords;
                    } else {
                        previousValue = callback(previousValue, currentCoords, currentIndex);
                    }
                }, excludeWrapCoord);
                return previousValue;
            }

            /**
             * Callback for propEach
             *
             * @private
             * @callback propEachCallback
             * @param {*} currentProperties The current properties being processed.
             * @param {number} currentIndex The index of the current element being processed in the
             * array.Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
             */

            /**
             * Iterate over properties in any GeoJSON object, similar to Array.forEach()
             *
             * @name propEach
             * @param {Object} layer any GeoJSON object
             * @param {Function} callback a method that takes (currentProperties, currentIndex)
             * @example
             * var features = {
             *   "type": "FeatureCollection",
             *   "features": [
             *     {
             *       "type": "Feature",
             *       "properties": {"foo": "bar"},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [26, 37]
             *       }
             *     },
             *     {
             *       "type": "Feature",
             *       "properties": {"hello": "world"},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [36, 53]
             *       }
             *     }
             *   ]
             * };
             * turf.propEach(features, function (currentProperties, currentIndex) {
             *   //=currentProperties
             *   //=currentIndex
             * });
             */
            function propEach(layer, callback) {
                var i;
                switch (layer.type) {
                    case 'FeatureCollection':
                        for (i = 0; i < layer.features.length; i++) {
                            callback(layer.features[i].properties, i);
                        }
                        break;
                    case 'Feature':
                        callback(layer.properties, 0);
                        break;
                }
            }


            /**
             * Callback for propReduce
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
             * @private
             * @callback propReduceCallback
             * @param {*} previousValue The accumulated value previously returned in the last invocation
             * of the callback, or initialValue, if supplied.
             * @param {*} currentProperties The current properties being processed.
             * @param {number} currentIndex The index of the current element being processed in the
             * array.Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
             */

            /**
             * Reduce properties in any GeoJSON object into a single value,
             * similar to how Array.reduce works. However, in this case we lazily run
             * the reduction, so an array of all properties is unnecessary.
             *
             * @name propReduce
             * @param {Object} layer any GeoJSON object
             * @param {Function} callback a method that takes (previousValue, currentProperties, currentIndex)
             * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
             * @returns {*} The value that results from the reduction.
             * @example
             * var features = {
             *   "type": "FeatureCollection",
             *   "features": [
             *     {
             *       "type": "Feature",
             *       "properties": {"foo": "bar"},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [26, 37]
             *       }
             *     },
             *     {
             *       "type": "Feature",
             *       "properties": {"hello": "world"},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [36, 53]
             *       }
             *     }
             *   ]
             * };
             * turf.propReduce(features, function (previousValue, currentProperties, currentIndex) {
             *   //=previousValue
             *   //=currentProperties
             *   //=currentIndex
             *   return currentProperties
             * });
             */
            function propReduce(layer, callback, initialValue) {
                var previousValue = initialValue;
                propEach(layer, function (currentProperties, currentIndex) {
                    if (currentIndex === 0 && initialValue === undefined) {
                        previousValue = currentProperties;
                    } else {
                        previousValue = callback(previousValue, currentProperties, currentIndex);
                    }
                });
                return previousValue;
            }

            /**
             * Callback for featureEach
             *
             * @private
             * @callback featureEachCallback
             * @param {Feature<any>} currentFeature The current feature being processed.
             * @param {number} currentIndex The index of the current element being processed in the
             * array.Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
             */

            /**
             * Iterate over features in any GeoJSON object, similar to
             * Array.forEach.
             *
             * @name featureEach
             * @param {Object} layer any GeoJSON object
             * @param {Function} callback a method that takes (currentFeature, currentIndex)
             * @example
             * var features = {
             *   "type": "FeatureCollection",
             *   "features": [
             *     {
             *       "type": "Feature",
             *       "properties": {},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [26, 37]
             *       }
             *     },
             *     {
             *       "type": "Feature",
             *       "properties": {},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [36, 53]
             *       }
             *     }
             *   ]
             * };
             * turf.featureEach(features, function (currentFeature, currentIndex) {
             *   //=currentFeature
             *   //=currentIndex
             * });
             */
            function featureEach(layer, callback) {
                if (layer.type === 'Feature') {
                    callback(layer, 0);
                } else if (layer.type === 'FeatureCollection') {
                    for (var i = 0; i < layer.features.length; i++) {
                        callback(layer.features[i], i);
                    }
                }
            }

            /**
             * Callback for featureReduce
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
             * @private
             * @callback featureReduceCallback
             * @param {*} previousValue The accumulated value previously returned in the last invocation
             * of the callback, or initialValue, if supplied.
             * @param {Feature<any>} currentFeature The current Feature being processed.
             * @param {number} currentIndex The index of the current element being processed in the
             * array.Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
             */

            /**
             * Reduce features in any GeoJSON object, similar to Array.reduce().
             *
             * @name featureReduce
             * @param {Object} layer any GeoJSON object
             * @param {Function} callback a method that takes (previousValue, currentFeature, currentIndex)
             * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
             * @returns {*} The value that results from the reduction.
             * @example
             * var features = {
             *   "type": "FeatureCollection",
             *   "features": [
             *     {
             *       "type": "Feature",
             *       "properties": {"foo": "bar"},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [26, 37]
             *       }
             *     },
             *     {
             *       "type": "Feature",
             *       "properties": {"hello": "world"},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [36, 53]
             *       }
             *     }
             *   ]
             * };
             * turf.featureReduce(features, function (previousValue, currentFeature, currentIndex) {
             *   //=previousValue
             *   //=currentFeature
             *   //=currentIndex
             *   return currentFeature
             * });
             */
            function featureReduce(layer, callback, initialValue) {
                var previousValue = initialValue;
                featureEach(layer, function (currentFeature, currentIndex) {
                    if (currentIndex === 0 && initialValue === undefined) {
                        previousValue = currentFeature;
                    } else {
                        previousValue = callback(previousValue, currentFeature, currentIndex);
                    }
                });
                return previousValue;
            }

            /**
             * Get all coordinates from any GeoJSON object.
             *
             * @name coordAll
             * @param {Object} layer any GeoJSON object
             * @returns {Array<Array<number>>} coordinate position array
             * @example
             * var features = {
             *   "type": "FeatureCollection",
             *   "features": [
             *     {
             *       "type": "Feature",
             *       "properties": {},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [26, 37]
             *       }
             *     },
             *     {
             *       "type": "Feature",
             *       "properties": {},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [36, 53]
             *       }
             *     }
             *   ]
             * };
             * var coords = turf.coordAll(features);
             * //=coords
             */
            function coordAll(layer) {
                var coords = [];
                coordEach(layer, function (coord) {
                    coords.push(coord);
                });
                return coords;
            }

            /**
             * Iterate over each geometry in any GeoJSON object, similar to Array.forEach()
             *
             * @name geomEach
             * @param {Object} layer any GeoJSON object
             * @param {Function} callback a method that takes (currentGeometry, currentIndex)
             * @example
             * var features = {
             *   "type": "FeatureCollection",
             *   "features": [
             *     {
             *       "type": "Feature",
             *       "properties": {},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [26, 37]
             *       }
             *     },
             *     {
             *       "type": "Feature",
             *       "properties": {},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [36, 53]
             *       }
             *     }
             *   ]
             * };
             * turf.geomEach(features, function (currentGeometry, currentIndex) {
             *   //=currentGeometry
             *   //=currentIndex
             * });
             */
            function geomEach(layer, callback) {
                var i, j, g, geometry, stopG,
                    geometryMaybeCollection,
                    isGeometryCollection,
                    currentIndex = 0,
                    isFeatureCollection = layer.type === 'FeatureCollection',
                    isFeature = layer.type === 'Feature',
                    stop = isFeatureCollection ? layer.features.length : 1;

                // This logic may look a little weird. The reason why it is that way
                // is because it's trying to be fast. GeoJSON supports multiple kinds
                // of objects at its root: FeatureCollection, Features, Geometries.
                // This function has the responsibility of handling all of them, and that
                // means that some of the `for` loops you see below actually just don't apply
                // to certain inputs. For instance, if you give this just a
                // Point geometry, then both loops are short-circuited and all we do
                // is gradually rename the input until it's called 'geometry'.
                //
                // This also aims to allocate as few resources as possible: just a
                // few numbers and booleans, rather than any temporary arrays as would
                // be required with the normalization approach.
                for (i = 0; i < stop; i++) {

                    geometryMaybeCollection = (isFeatureCollection ? layer.features[i].geometry :
                    (isFeature ? layer.geometry : layer));
                    isGeometryCollection = geometryMaybeCollection.type === 'GeometryCollection';
                    stopG = isGeometryCollection ? geometryMaybeCollection.geometries.length : 1;

                    for (g = 0; g < stopG; g++) {
                        geometry = isGeometryCollection ?
                        geometryMaybeCollection.geometries[g] : geometryMaybeCollection;

                        if (geometry.type === 'Point' ||
                            geometry.type === 'LineString' ||
                            geometry.type === 'MultiPoint' ||
                            geometry.type === 'Polygon' ||
                            geometry.type === 'MultiLineString' ||
                            geometry.type === 'MultiPolygon') {
                            callback(geometry, currentIndex);
                            currentIndex++;
                        } else if (geometry.type === 'GeometryCollection') {
                            for (j = 0; j < geometry.geometries.length; j++) {
                                callback(geometry.geometries[j], currentIndex);
                                currentIndex++;
                            }
                        } else {
                            throw new Error('Unknown Geometry Type');
                        }
                    }
                }
            }

            /**
             * Callback for geomReduce
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
             * @private
             * @callback geomReduceCallback
             * @param {*} previousValue The accumulated value previously returned in the last invocation
             * of the callback, or initialValue, if supplied.
             * @param {*} currentGeometry The current Feature being processed.
             * @param {number} currentIndex The index of the current element being processed in the
             * array.Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
             */

            /**
             * Reduce geometry in any GeoJSON object, similar to Array.reduce().
             *
             * @name geomReduce
             * @param {Object} layer any GeoJSON object
             * @param {Function} callback a method that takes (previousValue, currentGeometry, currentIndex)
             * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
             * @returns {*} The value that results from the reduction.
             * @example
             * var features = {
             *   "type": "FeatureCollection",
             *   "features": [
             *     {
             *       "type": "Feature",
             *       "properties": {"foo": "bar"},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [26, 37]
             *       }
             *     },
             *     {
             *       "type": "Feature",
             *       "properties": {"hello": "world"},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [36, 53]
             *       }
             *     }
             *   ]
             * };
             * turf.geomReduce(features, function (previousValue, currentGeometry, currentIndex) {
             *   //=previousValue
             *   //=currentGeometry
             *   //=currentIndex
             *   return currentGeometry
             * });
             */
            function geomReduce(layer, callback, initialValue) {
                var previousValue = initialValue;
                geomEach(layer, function (currentGeometry, currentIndex) {
                    if (currentIndex === 0 && initialValue === undefined) {
                        previousValue = currentGeometry;
                    } else {
                        previousValue = callback(previousValue, currentGeometry, currentIndex);
                    }
                });
                return previousValue;
            }

            module.exports = {
                coordEach: coordEach,
                coordReduce: coordReduce,
                propEach: propEach,
                propReduce: propReduce,
                featureEach: featureEach,
                featureReduce: featureReduce,
                coordAll: coordAll,
                geomEach: geomEach,
                geomReduce: geomReduce
            };

        }, {}], 11: [function (require, module, exports) {
            var flatten = require('@turf/flatten');
            var featureEach = require('@turf/meta').featureEach;
            var lineString = require('@turf/helpers').lineString;
            var featureCollection = require('@turf/helpers').featureCollection;
            var getCoords = require('@turf/invariant').getCoords;

            /**
             * Creates a {@link FeatureCollection} of 2-vertex {@link LineString} segments from a {@link LineString}, {@link MultiLineString}, {@link MultiPolygon} or {@link Polygon}.
             *
             * @name lineSegment
             * @param {FeatureCollection|Feature<LineString|MultiLineString|MultiPolygon|Polygon>} geojson GeoJSON Polygon or LineString
             * @returns {FeatureCollection<LineString>} 2-vertex line segments
             * @example
             * var polygon = {
             *   "type": "Feature",
             *   "properties": {},
             *   "geometry": {
             *     "type": "Polygon",
             *     "coordinates": [[[-50, 5], [-40, -10], [-50, -10], [-40, 5], [-50, 5]]]
             *   }
             * }
             * var segments = turf.lineSegment(polygon);
             * //=segments
             */
            module.exports = function (geojson) {
                var results = [];
                var index = 0;
                featureEach(geojson, function (multiFeature) {
                    featureEach(flatten(multiFeature), function (feature) {
                        var coords = [];
                        var type = (feature.geometry) ? feature.geometry.type : feature.type;
                        switch (type) {
                            case 'Polygon':
                                coords = getCoords(feature);
                                break;
                            case 'LineString':
                                coords = [getCoords(feature)];
                        }
                        coords.forEach(function (coord) {
                            var segments = createSegments(coord, feature.properties);
                            segments.forEach(function (segment) {
                                segment.id = index;
                                results.push(segment);
                                index++;
                            });
                        });
                    });
                });
                return featureCollection(results);
            };

            /**
             * Create Segments from LineString coordinates
             *
             * @private
             * @param {LineString} coords LineString coordinates
             * @param {*} properties GeoJSON properties
             * @returns {Array<Feature<LineString>>} line segments
             */
            function createSegments(coords, properties) {
                var segments = [];
                coords.reduce(function (previousCoords, currentCoords) {
                    var segment = lineString([previousCoords, currentCoords], properties);
                    segment.bbox = bbox(previousCoords, currentCoords);
                    segments.push(segment);
                    return currentCoords;
                });
                return segments;
            }

            /**
             * Create BBox between two coordinates (faster than @turf/bbox)
             *
             * @private
             * @param {Array<Number>} coords1 Point coordinate
             * @param {Array<Number>} coords2 Point coordinate
             * @returns {BBox} [west, south, east, north]
             */
            function bbox(coords1, coords2) {
                var x1 = coords1[0];
                var y1 = coords1[1];
                var x2 = coords2[0];
                var y2 = coords2[1];
                var west = (x1 < x2) ? x1 : x2;
                var south = (y1 < y2) ? y1 : y2;
                var east = (x1 > x2) ? x1 : x2;
                var north = (y1 > y2) ? y1 : y2;
                return [west, south, east, north];
            }

        }, { "@turf/flatten": 12, "@turf/helpers": 13, "@turf/invariant": 14, "@turf/meta": 15 }], 12: [function (require, module, exports) {
            var featureEach = require('@turf/meta').featureEach;
            var geomEach = require('@turf/meta').geomEach;
            var getCoords = require('@turf/invariant').getCoords;
            var helpers = require('@turf/helpers');
            var point = helpers.point;
            var lineString = helpers.lineString;
            var polygon = helpers.polygon;
            var featureCollection = helpers.featureCollection;

            /**
             * Flattens any {@link GeoJSON} to a {@link FeatureCollection} inspired by [geojson-flatten](https://github.com/tmcw/geojson-flatten).
             *
             * @name flatten
             * @param {Feature} geojson any valid {@link GeoJSON} with multi-geometry {@link Feature}s
             * @returns {FeatureCollection} a flattened {@link FeatureCollection}
             * @example
             * var geometry = {
             *   "type": "MultiPolygon",
             *   "coordinates": [
             *     [[[102.0, 2.0], [103.0, 2.0], [103.0, 3.0], [102.0, 3.0], [102.0, 2.0]]],
             *      [[[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
             *      [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]]
             *    ]
             *  };
             *
             * var flattened = turf.flatten(geometry);
             *
             * //=flattened
             */
            function flatten(geojson) {
                var type = (geojson.geometry) ? geojson.geometry.type : geojson.type;
                switch (type) {
                    case 'MultiPoint':
                        return flattenMultiPoint(geojson);
                    case 'MultiPolygon':
                        return flattenMultiPolygon(geojson);
                    case 'MultiLineString':
                        return flattenMultiLineString(geojson);
                    case 'FeatureCollection':
                        return flattenFeatureCollection(geojson);
                    case 'GeometryCollection':
                        return flattenGeometryCollection(geojson);
                    case 'Point':
                    case 'LineString':
                    case 'Polygon':
                        return featureCollection([geojson]);
                }
            }
            module.exports = flatten;

            /**
             * Flatten MultiPoint
             *
             * @private
             * @param {Feature<MultiPoint>} geojson GeoJSON Feature
             * @returns {FeatureCollection<Point>} Feature Collection
             */
            function flattenMultiPoint(geojson) {
                var points = [];
                getCoords(geojson).forEach(function (coords) {
                    points.push(point(coords, geojson.properties));
                });
                return featureCollection(points);
            }

            /**
             * Flatten MultiLineString
             *
             * @private
             * @param {Feature<MultiLineString>} geojson GeoJSON Feature
             * @returns {FeatureCollection<LineString>} Feature Collection
             */
            function flattenMultiLineString(geojson) {
                var lines = [];
                getCoords(geojson).forEach(function (coords) {
                    lines.push(lineString(coords, geojson.properties));
                });
                return featureCollection(lines);
            }

            /**
             * Flatten MultiPolygon
             *
             * @private
             * @param {Feature<MultiPolygon>} geojson GeoJSON Feature
             * @returns {FeatureCollection<Polygon>} Feature Collection
             */
            function flattenMultiPolygon(geojson) {
                var polygons = [];
                getCoords(geojson).forEach(function (coords) {
                    polygons.push(polygon(coords, geojson.properties));
                });
                return featureCollection(polygons);
            }

            /**
             * Flatten FeatureCollection
             *
             * @private
             * @param {FeatureCollection<any>} geojson GeoJSON Feature
             * @returns {FeatureCollection<any>} Feature Collection
             */
            function flattenFeatureCollection(geojson) {
                var features = [];
                featureEach(geojson, function (multiFeature) {
                    switch (multiFeature.geometry.type) {
                        case 'MultiPoint':
                        case 'MultiLineString':
                        case 'MultiPolygon':
                            featureEach(flatten(multiFeature), function (feature) {
                                features.push(feature);
                            });
                            break;
                        default:
                            features.push(multiFeature);
                    }
                });
                return featureCollection(features);
            }

            /**
             * Flatten GeometryCollection
             *
             * @private
             * @param {GeometryCollection<any>} geojson GeoJSON Geometry Collection
             * @param {*} [properties] translate properties to Feature
             * @returns {FeatureCollection<any>} Feature Collection
             */
            function flattenGeometryCollection(geojson) {
                var features = [];
                geomEach(geojson, function (geometry) {
                    switch (geometry.type) {
                        case 'MultiPoint':
                        case 'MultiLineString':
                        case 'MultiPolygon':
                            featureEach(flatten(geometry), function (feature) {
                                features.push(feature);
                            });
                            break;
                        default:
                            var feature = {
                                type: 'Feature',
                                properties: {},
                                geometry: geometry
                            };
                            features.push(feature);
                    }
                });
                return featureCollection(features);
            }

        }, { "@turf/helpers": 13, "@turf/invariant": 14, "@turf/meta": 15 }], 13: [function (require, module, exports) {
            arguments[4][3][0].apply(exports, arguments)
        }, { "dup": 3 }], 14: [function (require, module, exports) {
            arguments[4][4][0].apply(exports, arguments)
        }, { "dup": 4 }], 15: [function (require, module, exports) {
            arguments[4][10][0].apply(exports, arguments)
        }, { "dup": 10 }], 16: [function (require, module, exports) {
            /**
             * Callback for coordEach
             *
             * @private
             * @callback coordEachCallback
             * @param {Array<Number>} currentCoords The current coordinates being processed.
             * @param {number} currentIndex The index of the current element being processed in the
             * array.Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
             */

            /**
             * Iterate over coordinates in any GeoJSON object, similar to Array.forEach()
             *
             * @name coordEach
             * @param {Object} layer any GeoJSON object
             * @param {Function} callback a method that takes (currentCoords, currentIndex)
             * @param {boolean} [excludeWrapCoord=false] whether or not to include
             * the final coordinate of LinearRings that wraps the ring in its iteration.
             * @example
             * var features = {
             *   "type": "FeatureCollection",
             *   "features": [
             *     {
             *       "type": "Feature",
             *       "properties": {},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [26, 37]
             *       }
             *     },
             *     {
             *       "type": "Feature",
             *       "properties": {},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [36, 53]
             *       }
             *     }
             *   ]
             * };
             * turf.coordEach(features, function (currentCoords, currentIndex) {
             *   //=currentCoords
             *   //=currentIndex
             * });
             */
            function coordEach(layer, callback, excludeWrapCoord) {
                var i, j, k, g, l, geometry, stopG, coords,
                    geometryMaybeCollection,
                    wrapShrink = 0,
                    currentIndex = 0,
                    isGeometryCollection,
                    isFeatureCollection = layer.type === 'FeatureCollection',
                    isFeature = layer.type === 'Feature',
                    stop = isFeatureCollection ? layer.features.length : 1;

                // This logic may look a little weird. The reason why it is that way
                // is because it's trying to be fast. GeoJSON supports multiple kinds
                // of objects at its root: FeatureCollection, Features, Geometries.
                // This function has the responsibility of handling all of them, and that
                // means that some of the `for` loops you see below actually just don't apply
                // to certain inputs. For instance, if you give this just a
                // Point geometry, then both loops are short-circuited and all we do
                // is gradually rename the input until it's called 'geometry'.
                //
                // This also aims to allocate as few resources as possible: just a
                // few numbers and booleans, rather than any temporary arrays as would
                // be required with the normalization approach.
                for (i = 0; i < stop; i++) {

                    geometryMaybeCollection = (isFeatureCollection ? layer.features[i].geometry :
                    (isFeature ? layer.geometry : layer));
                    isGeometryCollection = geometryMaybeCollection.type === 'GeometryCollection';
                    stopG = isGeometryCollection ? geometryMaybeCollection.geometries.length : 1;

                    for (g = 0; g < stopG; g++) {
                        geometry = isGeometryCollection ?
                        geometryMaybeCollection.geometries[g] : geometryMaybeCollection;
                        coords = geometry.coordinates;

                        wrapShrink = (excludeWrapCoord &&
                            (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon')) ?
                            1 : 0;

                        if (geometry.type === 'Point') {
                            callback(coords, currentIndex);
                            currentIndex++;
                        } else if (geometry.type === 'LineString' || geometry.type === 'MultiPoint') {
                            for (j = 0; j < coords.length; j++) {
                                callback(coords[j], currentIndex);
                                currentIndex++;
                            }
                        } else if (geometry.type === 'Polygon' || geometry.type === 'MultiLineString') {
                            for (j = 0; j < coords.length; j++)
                                for (k = 0; k < coords[j].length - wrapShrink; k++) {
                                    callback(coords[j][k], currentIndex);
                                    currentIndex++;
                                }
                        } else if (geometry.type === 'MultiPolygon') {
                            for (j = 0; j < coords.length; j++)
                                for (k = 0; k < coords[j].length; k++)
                                    for (l = 0; l < coords[j][k].length - wrapShrink; l++) {
                                        callback(coords[j][k][l], currentIndex);
                                        currentIndex++;
                                    }
                        } else if (geometry.type === 'GeometryCollection') {
                            for (j = 0; j < geometry.geometries.length; j++)
                                coordEach(geometry.geometries[j], callback, excludeWrapCoord);
                        } else {
                            throw new Error('Unknown Geometry Type');
                        }
                    }
                }
            }
            module.exports.coordEach = coordEach;

            /**
             * Callback for coordReduce
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
             * @private
             * @callback coordReduceCallback
             * @param {*} previousValue The accumulated value previously returned in the last invocation
             * of the callback, or initialValue, if supplied.
             * @param {Array<Number>} currentCoords The current coordinate being processed.
             * @param {number} currentIndex The index of the current element being processed in the
             * array.Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
             */

            /**
             * Reduce coordinates in any GeoJSON object, similar to Array.reduce()
             *
             * @name coordReduce
             * @param {Object} layer any GeoJSON object
             * @param {Function} callback a method that takes (previousValue, currentCoords, currentIndex)
             * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
             * @param {boolean} [excludeWrapCoord=false] whether or not to include
             * the final coordinate of LinearRings that wraps the ring in its iteration.
             * @returns {*} The value that results from the reduction.
             * @example
             * var features = {
             *   "type": "FeatureCollection",
             *   "features": [
             *     {
             *       "type": "Feature",
             *       "properties": {},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [26, 37]
             *       }
             *     },
             *     {
             *       "type": "Feature",
             *       "properties": {},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [36, 53]
             *       }
             *     }
             *   ]
             * };
             * turf.coordReduce(features, function (previousValue, currentCoords, currentIndex) {
             *   //=previousValue
             *   //=currentCoords
             *   //=currentIndex
             *   return currentCoords;
             * });
             */
            function coordReduce(layer, callback, initialValue, excludeWrapCoord) {
                var previousValue = initialValue;
                coordEach(layer, function (currentCoords, currentIndex) {
                    if (currentIndex === 0 && initialValue === undefined) {
                        previousValue = currentCoords;
                    } else {
                        previousValue = callback(previousValue, currentCoords, currentIndex);
                    }
                }, excludeWrapCoord);
                return previousValue;
            }
            module.exports.coordReduce = coordReduce;

            /**
             * Callback for propEach
             *
             * @private
             * @callback propEachCallback
             * @param {*} currentProperties The current properties being processed.
             * @param {number} currentIndex The index of the current element being processed in the
             * array.Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
             */

            /**
             * Iterate over properties in any GeoJSON object, similar to Array.forEach()
             *
             * @name propEach
             * @param {Object} layer any GeoJSON object
             * @param {Function} callback a method that takes (currentProperties, currentIndex)
             * @example
             * var features = {
             *   "type": "FeatureCollection",
             *   "features": [
             *     {
             *       "type": "Feature",
             *       "properties": {"foo": "bar"},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [26, 37]
             *       }
             *     },
             *     {
             *       "type": "Feature",
             *       "properties": {"hello": "world"},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [36, 53]
             *       }
             *     }
             *   ]
             * };
             * turf.propEach(features, function (currentProperties, currentIndex) {
             *   //=currentProperties
             *   //=currentIndex
             * });
             */
            function propEach(layer, callback) {
                var i;
                switch (layer.type) {
                    case 'FeatureCollection':
                        for (i = 0; i < layer.features.length; i++) {
                            callback(layer.features[i].properties, i);
                        }
                        break;
                    case 'Feature':
                        callback(layer.properties, 0);
                        break;
                }
            }
            module.exports.propEach = propEach;


            /**
             * Callback for propReduce
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
             * @private
             * @callback propReduceCallback
             * @param {*} previousValue The accumulated value previously returned in the last invocation
             * of the callback, or initialValue, if supplied.
             * @param {*} currentProperties The current properties being processed.
             * @param {number} currentIndex The index of the current element being processed in the
             * array.Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
             */

            /**
             * Reduce properties in any GeoJSON object into a single value,
             * similar to how Array.reduce works. However, in this case we lazily run
             * the reduction, so an array of all properties is unnecessary.
             *
             * @name propReduce
             * @param {Object} layer any GeoJSON object
             * @param {Function} callback a method that takes (previousValue, currentProperties, currentIndex)
             * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
             * @returns {*} The value that results from the reduction.
             * @example
             * var features = {
             *   "type": "FeatureCollection",
             *   "features": [
             *     {
             *       "type": "Feature",
             *       "properties": {"foo": "bar"},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [26, 37]
             *       }
             *     },
             *     {
             *       "type": "Feature",
             *       "properties": {"hello": "world"},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [36, 53]
             *       }
             *     }
             *   ]
             * };
             * turf.propReduce(features, function (previousValue, currentProperties, currentIndex) {
             *   //=previousValue
             *   //=currentProperties
             *   //=currentIndex
             *   return currentProperties
             * });
             */
            function propReduce(layer, callback, initialValue) {
                var previousValue = initialValue;
                propEach(layer, function (currentProperties, currentIndex) {
                    if (currentIndex === 0 && initialValue === undefined) {
                        previousValue = currentProperties;
                    } else {
                        previousValue = callback(previousValue, currentProperties, currentIndex);
                    }
                });
                return previousValue;
            }
            module.exports.propReduce = propReduce;

            /**
             * Callback for featureEach
             *
             * @private
             * @callback featureEachCallback
             * @param {Feature<any>} currentFeature The current feature being processed.
             * @param {number} currentIndex The index of the current element being processed in the
             * array.Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
             */

            /**
             * Iterate over features in any GeoJSON object, similar to
             * Array.forEach.
             *
             * @name featureEach
             * @param {Object} layer any GeoJSON object
             * @param {Function} callback a method that takes (currentFeature, currentIndex)
             * @example
             * var features = {
             *   "type": "FeatureCollection",
             *   "features": [
             *     {
             *       "type": "Feature",
             *       "properties": {},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [26, 37]
             *       }
             *     },
             *     {
             *       "type": "Feature",
             *       "properties": {},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [36, 53]
             *       }
             *     }
             *   ]
             * };
             * turf.featureEach(features, function (currentFeature, currentIndex) {
             *   //=currentFeature
             *   //=currentIndex
             * });
             */
            function featureEach(layer, callback) {
                if (layer.type === 'Feature') {
                    callback(layer, 0);
                } else if (layer.type === 'FeatureCollection') {
                    for (var i = 0; i < layer.features.length; i++) {
                        callback(layer.features[i], i);
                    }
                }
            }
            module.exports.featureEach = featureEach;

            /**
             * Callback for featureReduce
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
             * @private
             * @callback featureReduceCallback
             * @param {*} previousValue The accumulated value previously returned in the last invocation
             * of the callback, or initialValue, if supplied.
             * @param {Feature<any>} currentFeature The current Feature being processed.
             * @param {number} currentIndex The index of the current element being processed in the
             * array.Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
             */

            /**
             * Reduce features in any GeoJSON object, similar to Array.reduce().
             *
             * @name featureReduce
             * @param {Object} layer any GeoJSON object
             * @param {Function} callback a method that takes (previousValue, currentFeature, currentIndex)
             * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
             * @returns {*} The value that results from the reduction.
             * @example
             * var features = {
             *   "type": "FeatureCollection",
             *   "features": [
             *     {
             *       "type": "Feature",
             *       "properties": {"foo": "bar"},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [26, 37]
             *       }
             *     },
             *     {
             *       "type": "Feature",
             *       "properties": {"hello": "world"},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [36, 53]
             *       }
             *     }
             *   ]
             * };
             * turf.featureReduce(features, function (previousValue, currentFeature, currentIndex) {
             *   //=previousValue
             *   //=currentFeature
             *   //=currentIndex
             *   return currentFeature
             * });
             */
            function featureReduce(layer, callback, initialValue) {
                var previousValue = initialValue;
                featureEach(layer, function (currentFeature, currentIndex) {
                    if (currentIndex === 0 && initialValue === undefined) {
                        previousValue = currentFeature;
                    } else {
                        previousValue = callback(previousValue, currentFeature, currentIndex);
                    }
                });
                return previousValue;
            }
            module.exports.featureReduce = featureReduce;

            /**
             * Get all coordinates from any GeoJSON object.
             *
             * @name coordAll
             * @param {Object} layer any GeoJSON object
             * @returns {Array<Array<number>>} coordinate position array
             * @example
             * var features = {
             *   "type": "FeatureCollection",
             *   "features": [
             *     {
             *       "type": "Feature",
             *       "properties": {},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [26, 37]
             *       }
             *     },
             *     {
             *       "type": "Feature",
             *       "properties": {},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [36, 53]
             *       }
             *     }
             *   ]
             * };
             * var coords = turf.coordAll(features);
             * //=coords
             */
            function coordAll(layer) {
                var coords = [];
                coordEach(layer, function (coord) {
                    coords.push(coord);
                });
                return coords;
            }
            module.exports.coordAll = coordAll;

            /**
             * Iterate over each geometry in any GeoJSON object, similar to Array.forEach()
             *
             * @name geomEach
             * @param {Object} layer any GeoJSON object
             * @param {Function} callback a method that takes (currentGeometry, currentIndex)
             * @example
             * var features = {
             *   "type": "FeatureCollection",
             *   "features": [
             *     {
             *       "type": "Feature",
             *       "properties": {},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [26, 37]
             *       }
             *     },
             *     {
             *       "type": "Feature",
             *       "properties": {},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [36, 53]
             *       }
             *     }
             *   ]
             * };
             * turf.geomEach(features, function (currentGeometry, currentIndex) {
             *   //=currentGeometry
             *   //=currentIndex
             * });
             */
            function geomEach(layer, callback) {
                var i, j, g, geometry, stopG,
                    geometryMaybeCollection,
                    isGeometryCollection,
                    currentIndex = 0,
                    isFeatureCollection = layer.type === 'FeatureCollection',
                    isFeature = layer.type === 'Feature',
                    stop = isFeatureCollection ? layer.features.length : 1;

                // This logic may look a little weird. The reason why it is that way
                // is because it's trying to be fast. GeoJSON supports multiple kinds
                // of objects at its root: FeatureCollection, Features, Geometries.
                // This function has the responsibility of handling all of them, and that
                // means that some of the `for` loops you see below actually just don't apply
                // to certain inputs. For instance, if you give this just a
                // Point geometry, then both loops are short-circuited and all we do
                // is gradually rename the input until it's called 'geometry'.
                //
                // This also aims to allocate as few resources as possible: just a
                // few numbers and booleans, rather than any temporary arrays as would
                // be required with the normalization approach.
                for (i = 0; i < stop; i++) {

                    geometryMaybeCollection = (isFeatureCollection ? layer.features[i].geometry :
                    (isFeature ? layer.geometry : layer));
                    isGeometryCollection = geometryMaybeCollection.type === 'GeometryCollection';
                    stopG = isGeometryCollection ? geometryMaybeCollection.geometries.length : 1;

                    for (g = 0; g < stopG; g++) {
                        geometry = isGeometryCollection ?
                        geometryMaybeCollection.geometries[g] : geometryMaybeCollection;

                        if (geometry.type === 'Point' ||
                            geometry.type === 'LineString' ||
                            geometry.type === 'MultiPoint' ||
                            geometry.type === 'Polygon' ||
                            geometry.type === 'MultiLineString' ||
                            geometry.type === 'MultiPolygon') {
                            callback(geometry, currentIndex);
                            currentIndex++;
                        } else if (geometry.type === 'GeometryCollection') {
                            for (j = 0; j < geometry.geometries.length; j++) {
                                callback(geometry.geometries[j], currentIndex);
                                currentIndex++;
                            }
                        } else {
                            throw new Error('Unknown Geometry Type');
                        }
                    }
                }
            }
            module.exports.geomEach = geomEach;

            /**
             * Callback for geomReduce
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
             * @private
             * @callback geomReduceCallback
             * @param {*} previousValue The accumulated value previously returned in the last invocation
             * of the callback, or initialValue, if supplied.
             * @param {*} currentGeometry The current Feature being processed.
             * @param {number} currentIndex The index of the current element being processed in the
             * array.Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
             */

            /**
             * Reduce geometry in any GeoJSON object, similar to Array.reduce().
             *
             * @name geomReduce
             * @param {Object} layer any GeoJSON object
             * @param {Function} callback a method that takes (previousValue, currentGeometry, currentIndex)
             * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
             * @returns {*} The value that results from the reduction.
             * @example
             * var features = {
             *   "type": "FeatureCollection",
             *   "features": [
             *     {
             *       "type": "Feature",
             *       "properties": {"foo": "bar"},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [26, 37]
             *       }
             *     },
             *     {
             *       "type": "Feature",
             *       "properties": {"hello": "world"},
             *       "geometry": {
             *         "type": "Point",
             *         "coordinates": [36, 53]
             *       }
             *     }
             *   ]
             * };
             * turf.geomReduce(features, function (previousValue, currentGeometry, currentIndex) {
             *   //=previousValue
             *   //=currentGeometry
             *   //=currentIndex
             *   return currentGeometry
             * });
             */
            function geomReduce(layer, callback, initialValue) {
                var previousValue = initialValue;
                geomEach(layer, function (currentGeometry, currentIndex) {
                    if (currentIndex === 0 && initialValue === undefined) {
                        previousValue = currentGeometry;
                    } else {
                        previousValue = callback(previousValue, currentGeometry, currentIndex);
                    }
                });
                return previousValue;
            }
            module.exports.geomReduce = geomReduce;

        }, {}], 17: [function (require, module, exports) {
            var getCoords = require('@turf/invariant').getCoords;
            var helpers = require('@turf/helpers');
            var lineString = helpers.lineString;
            var multiLineString = helpers.multiLineString;
            var featureCollection = helpers.featureCollection;

            /**
             * Converts a {@link Polygon} or {@link MultiPolygon} to a {@link FeatureCollection} of {@link LineString} or {@link MultiLineString}.
             *
             * @name polygonToLineString
             * @param {Feature<Polygon|MultiPolygon>} polygon Feature to convert
             * @returns {FeatureCollection<LineString|MultiLinestring>} converted Feature to Lines
             * @example
             * var poly = {
             *   'type': 'Feature',
             *   'properties': {},
             *   'geometry': {
             *     'type': 'Polygon',
             *     'coordinates': [[[125, -30], [145, -30], [145, -20], [125, -20], [125, -30]]]
             *   }
             * }
             * var lines = turf.polygonToLineString(poly);
             * //addToMap
             * var addToMap = [lines]
             */
            module.exports = function (polygon) {
                var geom = getGeomType(polygon);
                var coords = getCoords(polygon);
                var properties = polygon.properties;
                if (!coords.length) throw new Error('polygon must contain coordinates');

                switch (geom) {
                    case 'Polygon':
                        return featureCollection([coordsToLine(coords, properties)]);
                    case 'MultiPolygon':
                        var lines = [];
                        coords.forEach(function (coord) {
                            lines.push(coordsToLine(coord, properties));
                        });
                        return featureCollection(lines);
                    default:
                        throw new Error('geom ' + geom + ' not supported');
                }
            };

            function coordsToLine(coords, properties) {
                if (coords.length > 1) return multiLineString(coords, properties);
                return lineString(coords[0], properties);
            }

            function getGeomType(feature) {
                return (feature.geometry) ? feature.geometry.type : feature.type;
            }

        }, { "@turf/helpers": 18, "@turf/invariant": 19 }], 18: [function (require, module, exports) {
            arguments[4][3][0].apply(exports, arguments)
        }, { "dup": 3 }], 19: [function (require, module, exports) {
            arguments[4][4][0].apply(exports, arguments)
        }, { "dup": 4 }], 20: [function (require, module, exports) {
            var turfBBox = require('@turf/bbox');
            var featureCollection = require('@turf/helpers').featureCollection;
            var featureEach = require('@turf/meta').featureEach;
            var rbush = require('rbush');

            /**
             * GeoJSON implementation of [RBush](https://github.com/mourner/rbush#rbush) spatial index.
             *
             * @name rbush
             * @param {number} [maxEntries=9] defines the maximum number of entries in a tree node. 9 (used by default) is a
             * reasonable choice for most applications. Higher value means faster insertion and slower search, and vice versa.
             * @returns {RBush} GeoJSON RBush
             * @example
             * var rbush = require('geojson-rbush')
             * var tree = rbush()
             */
            module.exports = function (maxEntries) {
                var tree = rbush(maxEntries);
                /**
                 * [insert](https://github.com/mourner/rbush#data-format)
                 *
                 * @param {Feature<any>} feature insert single GeoJSON Feature
                 * @returns {RBush} GeoJSON RBush
                 * @example
                 * var polygon = {
                 *   "type": "Feature",
                 *   "properties": {},
                 *   "geometry": {
                 *     "type": "Polygon",
                 *     "coordinates": [[[-78, 41], [-67, 41], [-67, 48], [-78, 48], [-78, 41]]]
                 *   }
                 * }
                 * tree.insert(polygon)
                 */
                tree.insert = function (feature) {
                    feature.bbox = feature.bbox ? feature.bbox : turfBBox(feature);
                    return rbush.prototype.insert.call(this, feature);
                };

                /**
                 * [load](https://github.com/mourner/rbush#bulk-inserting-data)
                 *
                 * @param {FeatureCollection<any>} features load entire GeoJSON FeatureCollection
                 * @returns {RBush} GeoJSON RBush
                 * @example
                 * var polygons = {
                 *   "type": "FeatureCollection",
                 *   "features": [
                 *     {
                 *       "type": "Feature",
                 *       "properties": {},
                 *       "geometry": {
                 *         "type": "Polygon",
                 *         "coordinates": [[[-78, 41], [-67, 41], [-67, 48], [-78, 48], [-78, 41]]]
                 *       }
                 *     },
                 *     {
                 *       "type": "Feature",
                 *       "properties": {},
                 *       "geometry": {
                 *         "type": "Polygon",
                 *         "coordinates": [[[-93, 32], [-83, 32], [-83, 39], [-93, 39], [-93, 32]]]
                 *       }
                 *     }
                 *   ]
                 * }
                 * tree.load(polygons)
                 */
                tree.load = function (features) {
                    var load = [];
                    featureEach(features, function (feature) {
                        feature.bbox = feature.bbox ? feature.bbox : turfBBox(feature);
                        load.push(feature);
                    });
                    return rbush.prototype.load.call(this, load);
                };

                /**
                 * [remove](https://github.com/mourner/rbush#removing-data)
                 *
                 * @param {Feature<any>} feature remove single GeoJSON Feature
                 * @returns {RBush} GeoJSON RBush
                 * @example
                 * var polygon = {
                 *   "type": "Feature",
                 *   "properties": {},
                 *   "geometry": {
                 *     "type": "Polygon",
                 *     "coordinates": [[[-78, 41], [-67, 41], [-67, 48], [-78, 48], [-78, 41]]]
                 *   }
                 * }
                 * tree.remove(polygon)
                 */
                tree.remove = function (feature) {
                    return rbush.prototype.remove.call(this, feature);
                };

                /**
                 * [clear](https://github.com/mourner/rbush#removing-data)
                 *
                 * @returns {RBush} GeoJSON Rbush
                 * @example
                 * tree.clear()
                 */
                tree.clear = function () {
                    return rbush.prototype.clear.call(this);
                };

                /**
                 * [search](https://github.com/mourner/rbush#search)
                 *
                 * @param {FeatureCollection|Feature<any>} geojson search with GeoJSON
                 * @returns {FeatureCollection<any>} all features that intersects with the given GeoJSON.
                 * @example
                 * var polygon = {
                 *   "type": "Feature",
                 *   "properties": {},
                 *   "geometry": {
                 *     "type": "Polygon",
                 *     "coordinates": [[[-78, 41], [-67, 41], [-67, 48], [-78, 48], [-78, 41]]]
                 *   }
                 * }
                 * tree.search(polygon)
                 */
                tree.search = function (geojson) {
                    var search = rbush.prototype.search.call(this, this.toBBox(geojson));
                    return featureCollection(search);
                };

                /**
                 * [collides](https://github.com/mourner/rbush#collisions)
                 *
                 * @param {FeatureCollection|Feature<any>} geojson collides with GeoJSON
                 * @returns {boolean} true if there are any items intersecting the given GeoJSON, otherwise false.
                 * @example
                 * var polygon = {
                 *   "type": "Feature",
                 *   "properties": {},
                 *   "geometry": {
                 *     "type": "Polygon",
                 *     "coordinates": [[[-78, 41], [-67, 41], [-67, 48], [-78, 48], [-78, 41]]]
                 *   }
                 * }
                 * tree.collides(polygon)
                 */
                tree.collides = function (geojson) {
                    return rbush.prototype.collides.call(this, this.toBBox(geojson));
                };

                /**
                 * [all](https://github.com/mourner/rbush#search)
                 *
                 * @returns {FeatureCollection<any>} all the features in RBush
                 * @example
                 * tree.all()
                 * //=FeatureCollection
                 */
                tree.all = function () {
                    var all = rbush.prototype.all.call(this);
                    return featureCollection(all);
                };

                /**
                 * [toJSON](https://github.com/mourner/rbush#export-and-import)
                 *
                 * @returns {any} export data as JSON object
                 * @example
                 * var exported = tree.toJSON()
                 * //=JSON object
                 */
                tree.toJSON = function () {
                    return rbush.prototype.toJSON.call(this);
                };

                /**
                 * [fromJSON](https://github.com/mourner/rbush#export-and-import)
                 *
                 * @param {any} json import previously exported data
                 * @returns {RBush} GeoJSON RBush
                 * @example
                 * var exported = {
                 *   "children": [
                 *     {
                 *       "type": "Feature",
                 *       "geometry": {
                 *         "type": "Point",
                 *         "coordinates": [110, 50]
                 *       },
                 *       "properties": {},
                 *       "bbox": [110, 50, 110, 50]
                 *     }
                 *   ],
                 *   "height": 1,
                 *   "leaf": true,
                 *   "minX": 110,
                 *   "minY": 50,
                 *   "maxX": 110,
                 *   "maxY": 50
                 * }
                 * tree.fromJSON(exported)
                 */
                tree.fromJSON = function (json) {
                    return rbush.prototype.fromJSON.call(this, json);
                };

                /**
                 * Converts GeoJSON to {minX, minY, maxX, maxY} schema
                 *
                 * @private
                 * @param {FeatureCollectio|Feature<any>} geojson feature(s) to retrieve BBox from
                 * @returns {Object} converted to {minX, minY, maxX, maxY}
                 */
                tree.toBBox = function (geojson) {
                    var bbox = geojson.bbox ? geojson.bbox : turfBBox(geojson);
                    return {
                        minX: bbox[0],
                        minY: bbox[1],
                        maxX: bbox[2],
                        maxY: bbox[3]
                    };
                };
                return tree;
            };

        }, { "@turf/bbox": 5, "@turf/helpers": 6, "@turf/meta": 16, "rbush": 23 }], 21: [function (require, module, exports) {
            'use strict';

            module.exports = lineclip;

            lineclip.polyline = lineclip;
            lineclip.polygon = polygonclip;


            // Cohen-Sutherland line clippign algorithm, adapted to efficiently
            // handle polylines rather than just segments

            function lineclip(points, bbox, result) {

                var len = points.length,
                    codeA = bitCode(points[0], bbox),
                    part = [],
                    i, a, b, codeB, lastCode;

                if (!result) result = [];

                for (i = 1; i < len; i++) {
                    a = points[i - 1];
                    b = points[i];
                    codeB = lastCode = bitCode(b, bbox);

                    while (true) {

                        if (!(codeA | codeB)) { // accept
                            part.push(a);

                            if (codeB !== lastCode) { // segment went outside
                                part.push(b);

                                if (i < len - 1) { // start a new line
                                    result.push(part);
                                    part = [];
                                }
                            } else if (i === len - 1) {
                                part.push(b);
                            }
                            break;

                        } else if (codeA & codeB) { // trivial reject
                            break;

                        } else if (codeA) { // a outside, intersect with clip edge
                            a = intersect(a, b, codeA, bbox);
                            codeA = bitCode(a, bbox);

                        } else { // b outside
                            b = intersect(a, b, codeB, bbox);
                            codeB = bitCode(b, bbox);
                        }
                    }

                    codeA = lastCode;
                }

                if (part.length) result.push(part);

                return result;
            }

            // Sutherland-Hodgeman polygon clipping algorithm

            function polygonclip(points, bbox) {

                var result, edge, prev, prevInside, i, p, inside;

                // clip against each side of the clip rectangle
                for (edge = 1; edge <= 8; edge *= 2) {
                    result = [];
                    prev = points[points.length - 1];
                    prevInside = !(bitCode(prev, bbox) & edge);

                    for (i = 0; i < points.length; i++) {
                        p = points[i];
                        inside = !(bitCode(p, bbox) & edge);

                        // if segment goes through the clip window, add an intersection
                        if (inside !== prevInside) result.push(intersect(prev, p, edge, bbox));

                        if (inside) result.push(p); // add a point if it's inside

                        prev = p;
                        prevInside = inside;
                    }

                    points = result;

                    if (!points.length) break;
                }

                return result;
            }

            // intersect a segment against one of the 4 lines that make up the bbox

            function intersect(a, b, edge, bbox) {
                return edge & 8 ? [a[0] + (b[0] - a[0]) * (bbox[3] - a[1]) / (b[1] - a[1]), bbox[3]] : // top
                       edge & 4 ? [a[0] + (b[0] - a[0]) * (bbox[1] - a[1]) / (b[1] - a[1]), bbox[1]] : // bottom
                       edge & 2 ? [bbox[2], a[1] + (b[1] - a[1]) * (bbox[2] - a[0]) / (b[0] - a[0])] : // right
                       edge & 1 ? [bbox[0], a[1] + (b[1] - a[1]) * (bbox[0] - a[0]) / (b[0] - a[0])] : // left
                       null;
            }

            // bit code reflects the point position relative to the bbox:

            //         left  mid  right
            //    top  1001  1000  1010
            //    mid  0001  0000  0010
            // bottom  0101  0100  0110

            function bitCode(p, bbox) {
                var code = 0;

                if (p[0] < bbox[0]) code |= 1; // left
                else if (p[0] > bbox[2]) code |= 2; // right

                if (p[1] < bbox[1]) code |= 4; // bottom
                else if (p[1] > bbox[3]) code |= 8; // top

                return code;
            }

        }, {}], 22: [function (require, module, exports) {
            'use strict';

            module.exports = partialSort;

            // Floyd-Rivest selection algorithm:
            // Rearrange items so that all items in the [left, k] range are smaller than all items in (k, right];
            // The k-th element will have the (k - left + 1)th smallest value in [left, right]

            function partialSort(arr, k, left, right, compare) {
                left = left || 0;
                right = right || (arr.length - 1);
                compare = compare || defaultCompare;

                while (right > left) {
                    if (right - left > 600) {
                        var n = right - left + 1;
                        var m = k - left + 1;
                        var z = Math.log(n);
                        var s = 0.5 * Math.exp(2 * z / 3);
                        var sd = 0.5 * Math.sqrt(z * s * (n - s) / n) * (m - n / 2 < 0 ? -1 : 1);
                        var newLeft = Math.max(left, Math.floor(k - m * s / n + sd));
                        var newRight = Math.min(right, Math.floor(k + (n - m) * s / n + sd));
                        partialSort(arr, k, newLeft, newRight, compare);
                    }

                    var t = arr[k];
                    var i = left;
                    var j = right;

                    swap(arr, left, k);
                    if (compare(arr[right], t) > 0) swap(arr, left, right);

                    while (i < j) {
                        swap(arr, i, j);
                        i++;
                        j--;
                        while (compare(arr[i], t) < 0) i++;
                        while (compare(arr[j], t) > 0) j--;
                    }

                    if (compare(arr[left], t) === 0) swap(arr, left, j);
                    else {
                        j++;
                        swap(arr, j, right);
                    }

                    if (j <= k) left = j + 1;
                    if (k <= j) right = j - 1;
                }
            }

            function swap(arr, i, j) {
                var tmp = arr[i];
                arr[i] = arr[j];
                arr[j] = tmp;
            }

            function defaultCompare(a, b) {
                return a < b ? -1 : a > b ? 1 : 0;
            }

        }, {}], 23: [function (require, module, exports) {
            'use strict';

            module.exports = rbush;

            var quickselect = require('quickselect');

            function rbush(maxEntries, format) {
                if (!(this instanceof rbush)) return new rbush(maxEntries, format);

                // max entries in a node is 9 by default; min node fill is 40% for best performance
                this._maxEntries = Math.max(4, maxEntries || 9);
                this._minEntries = Math.max(2, Math.ceil(this._maxEntries * 0.4));

                if (format) {
                    this._initFormat(format);
                }

                this.clear();
            }

            rbush.prototype = {

                all: function () {
                    return this._all(this.data, []);
                },

                search: function (bbox) {

                    var node = this.data,
                        result = [],
                        toBBox = this.toBBox;

                    if (!intersects(bbox, node)) return result;

                    var nodesToSearch = [],
                        i, len, child, childBBox;

                    while (node) {
                        for (i = 0, len = node.children.length; i < len; i++) {

                            child = node.children[i];
                            childBBox = node.leaf ? toBBox(child) : child;

                            if (intersects(bbox, childBBox)) {
                                if (node.leaf) result.push(child);
                                else if (contains(bbox, childBBox)) this._all(child, result);
                                else nodesToSearch.push(child);
                            }
                        }
                        node = nodesToSearch.pop();
                    }

                    return result;
                },

                collides: function (bbox) {

                    var node = this.data,
                        toBBox = this.toBBox;

                    if (!intersects(bbox, node)) return false;

                    var nodesToSearch = [],
                        i, len, child, childBBox;

                    while (node) {
                        for (i = 0, len = node.children.length; i < len; i++) {

                            child = node.children[i];
                            childBBox = node.leaf ? toBBox(child) : child;

                            if (intersects(bbox, childBBox)) {
                                if (node.leaf || contains(bbox, childBBox)) return true;
                                nodesToSearch.push(child);
                            }
                        }
                        node = nodesToSearch.pop();
                    }

                    return false;
                },

                load: function (data) {
                    if (!(data && data.length)) return this;

                    if (data.length < this._minEntries) {
                        for (var i = 0, len = data.length; i < len; i++) {
                            this.insert(data[i]);
                        }
                        return this;
                    }

                    // recursively build the tree with the given data from stratch using OMT algorithm
                    var node = this._build(data.slice(), 0, data.length - 1, 0);

                    if (!this.data.children.length) {
                        // save as is if tree is empty
                        this.data = node;

                    } else if (this.data.height === node.height) {
                        // split root if trees have the same height
                        this._splitRoot(this.data, node);

                    } else {
                        if (this.data.height < node.height) {
                            // swap trees if inserted one is bigger
                            var tmpNode = this.data;
                            this.data = node;
                            node = tmpNode;
                        }

                        // insert the small tree into the large tree at appropriate level
                        this._insert(node, this.data.height - node.height - 1, true);
                    }

                    return this;
                },

                insert: function (item) {
                    if (item) this._insert(item, this.data.height - 1);
                    return this;
                },

                clear: function () {
                    this.data = createNode([]);
                    return this;
                },

                remove: function (item, equalsFn) {
                    if (!item) return this;

                    var node = this.data,
                        bbox = this.toBBox(item),
                        path = [],
                        indexes = [],
                        i, parent, index, goingUp;

                    // depth-first iterative tree traversal
                    while (node || path.length) {

                        if (!node) { // go up
                            node = path.pop();
                            parent = path[path.length - 1];
                            i = indexes.pop();
                            goingUp = true;
                        }

                        if (node.leaf) { // check current node
                            index = findItem(item, node.children, equalsFn);

                            if (index !== -1) {
                                // item found, remove the item and condense tree upwards
                                node.children.splice(index, 1);
                                path.push(node);
                                this._condense(path);
                                return this;
                            }
                        }

                        if (!goingUp && !node.leaf && contains(node, bbox)) { // go down
                            path.push(node);
                            indexes.push(i);
                            i = 0;
                            parent = node;
                            node = node.children[0];

                        } else if (parent) { // go right
                            i++;
                            node = parent.children[i];
                            goingUp = false;

                        } else node = null; // nothing found
                    }

                    return this;
                },

                toBBox: function (item) { return item; },

                compareMinX: compareNodeMinX,
                compareMinY: compareNodeMinY,

                toJSON: function () { return this.data; },

                fromJSON: function (data) {
                    this.data = data;
                    return this;
                },

                _all: function (node, result) {
                    var nodesToSearch = [];
                    while (node) {
                        if (node.leaf) result.push.apply(result, node.children);
                        else nodesToSearch.push.apply(nodesToSearch, node.children);

                        node = nodesToSearch.pop();
                    }
                    return result;
                },

                _build: function (items, left, right, height) {

                    var N = right - left + 1,
                        M = this._maxEntries,
                        node;

                    if (N <= M) {
                        // reached leaf level; return leaf
                        node = createNode(items.slice(left, right + 1));
                        calcBBox(node, this.toBBox);
                        return node;
                    }

                    if (!height) {
                        // target height of the bulk-loaded tree
                        height = Math.ceil(Math.log(N) / Math.log(M));

                        // target number of root entries to maximize storage utilization
                        M = Math.ceil(N / Math.pow(M, height - 1));
                    }

                    node = createNode([]);
                    node.leaf = false;
                    node.height = height;

                    // split the items into M mostly square tiles

                    var N2 = Math.ceil(N / M),
                        N1 = N2 * Math.ceil(Math.sqrt(M)),
                        i, j, right2, right3;

                    multiSelect(items, left, right, N1, this.compareMinX);

                    for (i = left; i <= right; i += N1) {

                        right2 = Math.min(i + N1 - 1, right);

                        multiSelect(items, i, right2, N2, this.compareMinY);

                        for (j = i; j <= right2; j += N2) {

                            right3 = Math.min(j + N2 - 1, right2);

                            // pack each entry recursively
                            node.children.push(this._build(items, j, right3, height - 1));
                        }
                    }

                    calcBBox(node, this.toBBox);

                    return node;
                },

                _chooseSubtree: function (bbox, node, level, path) {

                    var i, len, child, targetNode, area, enlargement, minArea, minEnlargement;

                    while (true) {
                        path.push(node);

                        if (node.leaf || path.length - 1 === level) break;

                        minArea = minEnlargement = Infinity;

                        for (i = 0, len = node.children.length; i < len; i++) {
                            child = node.children[i];
                            area = bboxArea(child);
                            enlargement = enlargedArea(bbox, child) - area;

                            // choose entry with the least area enlargement
                            if (enlargement < minEnlargement) {
                                minEnlargement = enlargement;
                                minArea = area < minArea ? area : minArea;
                                targetNode = child;

                            } else if (enlargement === minEnlargement) {
                                // otherwise choose one with the smallest area
                                if (area < minArea) {
                                    minArea = area;
                                    targetNode = child;
                                }
                            }
                        }

                        node = targetNode || node.children[0];
                    }

                    return node;
                },

                _insert: function (item, level, isNode) {

                    var toBBox = this.toBBox,
                        bbox = isNode ? item : toBBox(item),
                        insertPath = [];

                    // find the best node for accommodating the item, saving all nodes along the path too
                    var node = this._chooseSubtree(bbox, this.data, level, insertPath);

                    // put the item into the node
                    node.children.push(item);
                    extend(node, bbox);

                    // split on node overflow; propagate upwards if necessary
                    while (level >= 0) {
                        if (insertPath[level].children.length > this._maxEntries) {
                            this._split(insertPath, level);
                            level--;
                        } else break;
                    }

                    // adjust bboxes along the insertion path
                    this._adjustParentBBoxes(bbox, insertPath, level);
                },

                // split overflowed node into two
                _split: function (insertPath, level) {

                    var node = insertPath[level],
                        M = node.children.length,
                        m = this._minEntries;

                    this._chooseSplitAxis(node, m, M);

                    var splitIndex = this._chooseSplitIndex(node, m, M);

                    var newNode = createNode(node.children.splice(splitIndex, node.children.length - splitIndex));
                    newNode.height = node.height;
                    newNode.leaf = node.leaf;

                    calcBBox(node, this.toBBox);
                    calcBBox(newNode, this.toBBox);

                    if (level) insertPath[level - 1].children.push(newNode);
                    else this._splitRoot(node, newNode);
                },

                _splitRoot: function (node, newNode) {
                    // split root node
                    this.data = createNode([node, newNode]);
                    this.data.height = node.height + 1;
                    this.data.leaf = false;
                    calcBBox(this.data, this.toBBox);
                },

                _chooseSplitIndex: function (node, m, M) {

                    var i, bbox1, bbox2, overlap, area, minOverlap, minArea, index;

                    minOverlap = minArea = Infinity;

                    for (i = m; i <= M - m; i++) {
                        bbox1 = distBBox(node, 0, i, this.toBBox);
                        bbox2 = distBBox(node, i, M, this.toBBox);

                        overlap = intersectionArea(bbox1, bbox2);
                        area = bboxArea(bbox1) + bboxArea(bbox2);

                        // choose distribution with minimum overlap
                        if (overlap < minOverlap) {
                            minOverlap = overlap;
                            index = i;

                            minArea = area < minArea ? area : minArea;

                        } else if (overlap === minOverlap) {
                            // otherwise choose distribution with minimum area
                            if (area < minArea) {
                                minArea = area;
                                index = i;
                            }
                        }
                    }

                    return index;
                },

                // sorts node children by the best axis for split
                _chooseSplitAxis: function (node, m, M) {

                    var compareMinX = node.leaf ? this.compareMinX : compareNodeMinX,
                        compareMinY = node.leaf ? this.compareMinY : compareNodeMinY,
                        xMargin = this._allDistMargin(node, m, M, compareMinX),
                        yMargin = this._allDistMargin(node, m, M, compareMinY);

                    // if total distributions margin value is minimal for x, sort by minX,
                    // otherwise it's already sorted by minY
                    if (xMargin < yMargin) node.children.sort(compareMinX);
                },

                // total margin of all possible split distributions where each node is at least m full
                _allDistMargin: function (node, m, M, compare) {

                    node.children.sort(compare);

                    var toBBox = this.toBBox,
                        leftBBox = distBBox(node, 0, m, toBBox),
                        rightBBox = distBBox(node, M - m, M, toBBox),
                        margin = bboxMargin(leftBBox) + bboxMargin(rightBBox),
                        i, child;

                    for (i = m; i < M - m; i++) {
                        child = node.children[i];
                        extend(leftBBox, node.leaf ? toBBox(child) : child);
                        margin += bboxMargin(leftBBox);
                    }

                    for (i = M - m - 1; i >= m; i--) {
                        child = node.children[i];
                        extend(rightBBox, node.leaf ? toBBox(child) : child);
                        margin += bboxMargin(rightBBox);
                    }

                    return margin;
                },

                _adjustParentBBoxes: function (bbox, path, level) {
                    // adjust bboxes along the given tree path
                    for (var i = level; i >= 0; i--) {
                        extend(path[i], bbox);
                    }
                },

                _condense: function (path) {
                    // go through the path, removing empty nodes and updating bboxes
                    for (var i = path.length - 1, siblings; i >= 0; i--) {
                        if (path[i].children.length === 0) {
                            if (i > 0) {
                                siblings = path[i - 1].children;
                                siblings.splice(siblings.indexOf(path[i]), 1);

                            } else this.clear();

                        } else calcBBox(path[i], this.toBBox);
                    }
                },

                _initFormat: function (format) {
                    // data format (minX, minY, maxX, maxY accessors)

                    // uses eval-type function compilation instead of just accepting a toBBox function
                    // because the algorithms are very sensitive to sorting functions performance,
                    // so they should be dead simple and without inner calls

                    var compareArr = ['return a', ' - b', ';'];

                    this.compareMinX = new Function('a', 'b', compareArr.join(format[0]));
                    this.compareMinY = new Function('a', 'b', compareArr.join(format[1]));

                    this.toBBox = new Function('a',
                        'return {minX: a' + format[0] +
                        ', minY: a' + format[1] +
                        ', maxX: a' + format[2] +
                        ', maxY: a' + format[3] + '};');
                }
            };

            function findItem(item, items, equalsFn) {
                if (!equalsFn) return items.indexOf(item);

                for (var i = 0; i < items.length; i++) {
                    if (equalsFn(item, items[i])) return i;
                }
                return -1;
            }

            // calculate node's bbox from bboxes of its children
            function calcBBox(node, toBBox) {
                distBBox(node, 0, node.children.length, toBBox, node);
            }

            // min bounding rectangle of node children from k to p-1
            function distBBox(node, k, p, toBBox, destNode) {
                if (!destNode) destNode = createNode(null);
                destNode.minX = Infinity;
                destNode.minY = Infinity;
                destNode.maxX = -Infinity;
                destNode.maxY = -Infinity;

                for (var i = k, child; i < p; i++) {
                    child = node.children[i];
                    extend(destNode, node.leaf ? toBBox(child) : child);
                }

                return destNode;
            }

            function extend(a, b) {
                a.minX = Math.min(a.minX, b.minX);
                a.minY = Math.min(a.minY, b.minY);
                a.maxX = Math.max(a.maxX, b.maxX);
                a.maxY = Math.max(a.maxY, b.maxY);
                return a;
            }

            function compareNodeMinX(a, b) { return a.minX - b.minX; }
            function compareNodeMinY(a, b) { return a.minY - b.minY; }

            function bboxArea(a) { return (a.maxX - a.minX) * (a.maxY - a.minY); }
            function bboxMargin(a) { return (a.maxX - a.minX) + (a.maxY - a.minY); }

            function enlargedArea(a, b) {
                return (Math.max(b.maxX, a.maxX) - Math.min(b.minX, a.minX)) *
                       (Math.max(b.maxY, a.maxY) - Math.min(b.minY, a.minY));
            }

            function intersectionArea(a, b) {
                var minX = Math.max(a.minX, b.minX),
                    minY = Math.max(a.minY, b.minY),
                    maxX = Math.min(a.maxX, b.maxX),
                    maxY = Math.min(a.maxY, b.maxY);

                return Math.max(0, maxX - minX) *
                       Math.max(0, maxY - minY);
            }

            function contains(a, b) {
                return a.minX <= b.minX &&
                       a.minY <= b.minY &&
                       b.maxX <= a.maxX &&
                       b.maxY <= a.maxY;
            }

            function intersects(a, b) {
                return b.minX <= a.maxX &&
                       b.minY <= a.maxY &&
                       b.maxX >= a.minX &&
                       b.maxY >= a.minY;
            }

            function createNode(children) {
                return {
                    children: children,
                    height: 1,
                    leaf: true,
                    minX: Infinity,
                    minY: Infinity,
                    maxX: -Infinity,
                    maxY: -Infinity
                };
            }

            // sort an array so that items come in groups of n unsorted items, with groups sorted between each other;
            // combines selection algorithm with binary divide & conquer approach

            function multiSelect(arr, left, right, n, compare) {
                var stack = [left, right],
                    mid;

                while (stack.length) {
                    right = stack.pop();
                    left = stack.pop();

                    if (right - left <= n) continue;

                    mid = left + Math.ceil((right - left) / n / 2) * n;
                    quickselect(arr, mid, left, right, compare);

                    stack.push(left, mid, mid, right);
                }
            }

        }, { "quickselect": 22 }]
    }, {}, [1])(1)
});