define([
    'VectorRenderer/VectorLayer',
    'VectorRenderer/VectorRenderer',
    'VectorRenderer/VectorStyle',
    'VectorTileImageryProvider/VectorTileImageryProvider'
], function (
    VectorLayer,
    VectorRenderer,
    VectorStyle,
    VectorTileImageryProvider
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
    return Cesium;
})