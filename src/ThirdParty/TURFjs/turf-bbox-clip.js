(function (f) {
    if (typeof exports === "object" && typeof module !== "undefined") { module.exports = f() }
    else if (typeof define === "function" && define.amd) { define([], f) }
    else {
        var g; if (typeof window !== "undefined") { g = window }
        else if (typeof global !== "undefined") { g = global } else if (typeof self !== "undefined") { g = self } else { g = this }
        g.turf2 = f()
    }
})(function () {
    var define, module, exports; return (function e(t, n, r) { function s(o, u) { if (!n[o]) { if (!t[o]) { var a = typeof require == "function" && require; if (!u && a) return a(o, !0); if (i) return i(o, !0); var f = new Error("Cannot find module '" + o + "'"); throw f.code = "MODULE_NOT_FOUND", f } var l = n[o] = { exports: {} }; t[o][0].call(l.exports, function (e) { var n = t[o][1][e]; return s(n ? n : e) }, l, l.exports, e, t, n, r) } return n[o].exports } var i = typeof require == "function" && require; for (var o = 0; o < r.length; o++) s(r[o]); return s })({
        1: [function (require, module, exports) {
            module.exports = {
                bboxClip: require('@turf/bbox-clip')
            };
        }, { "@turf/bbox-clip": 2 }], 2: [function (require, module, exports) {
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

        }, { "@turf/helpers": 3, "@turf/invariant": 4, "lineclip": 5 }], 3: [function (require, module, exports) {
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

        }, {}]
    }, {}, [1])(1)
});