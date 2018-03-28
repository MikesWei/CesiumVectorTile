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

    if (!window.Cesium ) {
        window.Cesium = {};
    }
    Cesium.VectorRenderer = VectorRenderer;
    Cesium.VectorTileImageryProvider = VectorTileImageryProvider;
    Cesium.VectorLayer = VectorLayer;
    Cesium.VectorStyle = VectorStyle;
    return Cesium;
})