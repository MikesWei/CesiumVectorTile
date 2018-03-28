/// <reference path="appconfig.js" />

//requirejs([
//       "./requirejs.config.js",
//       "./appconfig.js",
//       './src/Main'
//], function (
//       config,
//       appconfig,
//       Cesium
//       ) {


VectorTileImageryProvider = Cesium.VectorTileImageryProvider;

viewer = new Cesium.Viewer("cesiumContainer");
var imageryProviderViewModels = viewer.baseLayerPicker.viewModel.imageryProviderViewModels;
viewer.baseLayerPicker.viewModel.selectedImagery = imageryProviderViewModels[imageryProviderViewModels.length - 1];
viewer.scene.debugShowFramesPerSecond = true;
var provinceLayer = null;
Cesium.loadText(appConfig.BaseURL + "Assets/Data/json/bj.js").then(function (geojson) {
    geojson = eval("(" + geojson + ")");
    var provinceProvider = new VectorTileImageryProvider({
        source: geojson,
        defaultStyle: {
            outlineColor: "rgb(255,255,255)",
            lineWidth: 2,
            fill: false,
            tileCacheSize: 200
        },
        maximumLevel: 20,
        minimumLevel: 1,
        simplify: false
    });
    provinceProvider.readyPromise.then(function () {
        provinceLayer = viewer.imageryLayers.addImageryProvider(provinceProvider);
    });
})

Cesium.loadBlob(appConfig.BaseURL + "Assets/Data/shp/world/国家简化边界.shp").then(function (blob) {
    console.log(blob);
})

var worldLayer = null;
var worldProvider = new VectorTileImageryProvider({
    source: appConfig.BaseURL + "Assets/Data/shp/world/国家简化边界.shp",
    defaultStyle: {
        outlineColor: "rgb(255,0,0)",
        lineWidth: 1,
        fill: false,
        tileCacheSize: 200
    },
    maximumLevel: 20,
    minimumLevel: 1,
    simplify: false
});
worldProvider.readyPromise.then(function () {
    worldLayer = viewer.imageryLayers.addImageryProvider(worldProvider);
});

//});