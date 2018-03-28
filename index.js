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

var shpPromises = [
    Cesium.loadBlob(appConfig.BaseURL + "Assets/Data/shp/world/国界线.shp"),
    Cesium.loadBlob(appConfig.BaseURL + "Assets/Data/shp/world/国界线.dbf"),
    Cesium.loadBlob(appConfig.BaseURL + "Assets/Data/shp/world/国界线.prj"),
     ];
Cesium.when.all(shpPromises, function (files) {
    files[0].name = "国界线.shp";
    files[1].name = "国界线.dbf";
    files[2].name = "国界线.prj";

    var worldLayer = null;
    var worldProvider = new VectorTileImageryProvider({
        source: files,
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

}); 

//});