/// <reference path="appconfig.js" />

//requirejs([
//       "./requirejs.config.js", 
//       './src/Main'
//], function (
//       config, 
//       Cesium
//       ) {


VectorTileImageryProvider = Cesium.VectorTileImageryProvider;

viewer = new Cesium.Viewer("cesiumContainer");
var imageryProviderViewModels = viewer.baseLayerPicker.viewModel.imageryProviderViewModels;
var terrainProviderViewModels = viewer.baseLayerPicker.viewModel.terrainProviderViewModels;
viewer.baseLayerPicker.viewModel.selectedImagery = imageryProviderViewModels[imageryProviderViewModels.length - 1];
viewer.baseLayerPicker.viewModel.selectedTerrain = terrainProviderViewModels[0];

viewer.scene.debugShowFramesPerSecond = true;
var provinceLayer = null;
Cesium.loadText("./Assets/Data/json/bj.json").then(function (geojson) {
    geojson = eval("(" + geojson + ")");
    var provinceProvider = new VectorTileImageryProvider({
        source: geojson,
        defaultStyle: {
            outlineColor: "rgb(255,255,255)",
            lineWidth: 2,
            fill: false,
            tileCacheSize: 200,
            showMaker: false,
            showCenterLabel: true,
            fontColor: "rgba(255,0,0,1)",
            labelOffsetX: -10,
            labelOffsetY: -5,
            fontSize: 13,
            fontFamily: "黑体",
            centerLabelPropertyName: "NAME"
        },
        maximumLevel: 20,
        minimumLevel: 8,
        simplify: false
    });
    provinceProvider.readyPromise.then(function () {
        provinceLayer = viewer.imageryLayers.addImageryProvider(provinceProvider);

    });
})
Cesium.loadText("./Assets/Data/json/bjsx.json").then(function (geojson) {
    geojson = eval("(" + geojson + ")");
    viewer.imageryLayers.addImageryProvider(new VectorTileImageryProvider({
        source: geojson,
        defaultStyle: {
            outlineColor: "rgb(255,255,255)",
            lineWidth: 2,
            fill: false,
            tileCacheSize: 200,
            showMaker: false,
            showCenterLabel: true,
            fontColor: "rgba(255,0,0,1)",
            labelOffsetX: -10,
            labelOffsetY: -5,
            fontSize: 13,
            fontFamily: "黑体",
            centerLabelPropertyName: "NAME"
        },
        maximumLevel: 20,
        minimumLevel: 10,
        simplify: false
    }));
})



var shpPromises = [
    Cesium.loadBlob("./Assets/Data/shp/china/国界线.shp"),
    Cesium.loadBlob("./Assets/Data/shp/china/国界线.dbf"),
    Cesium.loadBlob("./Assets/Data/shp/china/国界线.prj"),
];
var chinaLayer = null;
Cesium.when.all(shpPromises, function (files) {
    files[0].name = "国界线.shp";
    files[1].name = "国界线.dbf";
    files[2].name = "国界线.prj";


    var shpProvider = new VectorTileImageryProvider({
        source: files,
        defaultStyle: {
            outlineColor: "rgb(255,0,0)",
            lineWidth: 2,
            fill: false,
            tileCacheSize: 200,
            showMaker: false,
            showCenterLabel: true,
            fontColor: "rgba(255,0,0,1)",
            labelOffsetX: -10,
            labelOffsetY: -5,
            fontSize: 13,
            fontFamily: "黑体",
            centerLabelPropertyName: "NAME"
        },
        maximumLevel: 20,
        minimumLevel: 1,
        simplify: false
    });
    shpProvider.readyPromise.then(function () {
        chinaLayer = viewer.imageryLayers.addImageryProvider(shpProvider);
        viewer.imageryLayers.raiseToTop(chinaLayer);

        viewer.flyTo(chinaLayer);
        Cesium.Camera.DEFAULT_VIEW_RECTANGLE = shpProvider.rectangle;
    });

});
var shpPromises2 = [
        Cesium.loadBlob("Assets/Data/shp/world/国家简化边界.shp"),
        Cesium.loadBlob("Assets/Data/shp/world/国家简化边界.dbf"),
        Cesium.loadBlob("Assets/Data/shp/world/国家简化边界.prj"),
];
Cesium.when.all(shpPromises2, function (files) {
    files[0].name = "国家简化边界.shp";
    files[1].name = "国家简化边界.dbf";
    files[2].name = "国家简化边界.prj";

    var shpLayer = null;
    var shpProvider = new VectorTileImageryProvider({
        source: files,
        defaultStyle: {
            outlineColor: "rgb(255,255,0)",
            lineWidth: 2,
            fill: false,
            tileCacheSize: 200,
            showMaker: false,
            showCenterLabel: true,
            fontColor: "rgba(255,0,0,1)",
            labelOffsetX: 0,
            labelOffsetY: 0,
            fontSize: 9,
            fontFamily: "黑体",
            centerLabelPropertyName: "NAME"
        },
        maximumLevel: 20,
        minimumLevel: 1,
        simplify: false
    });
    shpProvider.readyPromise.then(function () {
        shpLayer = viewer.imageryLayers.addImageryProvider(shpProvider);
        viewer.imageryLayers.raiseToTop(chinaLayer);
    });

});
//});