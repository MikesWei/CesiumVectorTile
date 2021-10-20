
var g = typeof window != "undefined" ? window : global;
if (typeof g.Cesium == 'undefined') {
    g.Cesium = require('./cesium-core');
}
g.Cesium.VectorTileImageryProvider = require('./VectorTileImageryProvider');
g.Cesium.proj4=require('proj4');
module.exports = g.Cesium;