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
var exports=turf
    /**
     * 
     * @param {Array.<Number>} coords1
     * @param {Array.<Number>} coords2
     * @return {Boolean}
     * @memberof MeteoLib.Util.turf
     */
    exports.lineEquals=function (coords1, coords2) {
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
     * @memberof MeteoLib.Util.turf
     */
    exports.polygonEquals= function (ply1, ply2) {
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
     * @memberof MeteoLib.Util.turf
     */
    exports.removeDuplicate = function(geoJSON) {
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

    return turf;
})