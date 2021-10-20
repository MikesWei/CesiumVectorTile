//增加对shp格式的支持
/**
   * 
   * @namespace Cesium
   */

   
var VectorTileImageryProvider = require('./VectorTileImageryProvider-light');
VectorTileImageryProvider.shp = require('./Shp')
module.exports = VectorTileImageryProvider;