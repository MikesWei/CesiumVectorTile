
var turfHelpers = require('@turf/helpers');
var turf = Object.assign({}, turfHelpers, {
    bbox: require('@turf/bbox').default,
    bboxPolygon: require('@turf/bbox-polygon').default,
    bboxClip: require('@turf/bbox-clip').default,
    polygonToLine: require('@turf/polygon-to-line').default,
    pointToLineDistance: require('@turf/point-to-line-distance').default,
    booleanPointInPolygon: require('@turf/boolean-point-in-polygon').default,
    simplify: require('@turf/simplify'),
    polygonToLineString: require('@turf/polygon-to-line').default,
    center: require('@turf/center').default,
    centerOfMass: require('@turf/center-of-mass').default,
    centroid: require('@turf/centroid').default,
    within: require('@turf/within'),
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
    }
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