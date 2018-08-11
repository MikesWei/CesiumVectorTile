define([
    'VectorRenderer/VectorLayer',
    'VectorRenderer/VectorRenderer',
    'VectorRenderer/VectorStyle',
    'VectorTileImageryProvider/VectorTileImageryProvider',
    'Util/turf'
], function (
    VectorLayer,
    VectorRenderer,
    VectorStyle,
    VectorTileImageryProvider,
    turf
    ) {

    if (typeof window!=='undefined'&&!window.Cesium) {
        window.Cesium = {};
    } else if (typeof global !== 'undefined' && !global.Cesium) {
        global.Cesium = {};
    }
    Cesium.VectorRenderer = VectorRenderer;
    Cesium.VectorTileImageryProvider = VectorTileImageryProvider;
    Cesium.VectorLayer = VectorLayer;
    Cesium.VectorStyle = VectorStyle;
    Cesium.turf = turf;
    return Cesium;
})