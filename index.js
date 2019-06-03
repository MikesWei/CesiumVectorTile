/// <reference path="appconfig.js" />

//requirejs([
//    "./requirejs.config.js",
//    './src/Main'
//], function (
//    config,
//    Cesium
//) {


VectorTileImageryProvider = Cesium.VectorTileImageryProvider;

viewer = new Cesium.Viewer("cesiumContainer");
var imageryProviderViewModels = viewer.baseLayerPicker.viewModel.imageryProviderViewModels;
var terrainProviderViewModels = viewer.baseLayerPicker.viewModel.terrainProviderViewModels;
viewer.baseLayerPicker.viewModel.selectedImagery = imageryProviderViewModels[imageryProviderViewModels.length - 1];
viewer.baseLayerPicker.viewModel.selectedTerrain = terrainProviderViewModels[0];

viewer.imageryLayers.layerAdded.addEventListener(function () {

    setTimeout(function () {
        viewer.imageryLayers.orderByZIndex();
    }, 200)

})
viewer.scene.debugShowFramesPerSecond = true;
var provinceLayer = null;

Cesium.loadText("./Assets/Data/json/bj.json").then(function (geojson) {
    geojson = eval("(" + geojson + ")");
    var turf = Cesium.turf;
    var mask = null;

    try {
        //缓冲区
        var bufferedOuter = turf.buffer(geojson.features[0], 2, "kilometers");

        var bufferedInner = turf.buffer(geojson.features[0], 1, "kilometers")
        bufferedInner = turf.difference(bufferedInner, geojson.features[0]);

        bufferedOuter = turf.difference(bufferedOuter, bufferedInner);

        bufferedInner = turf.featureCollection([bufferedInner]);
        bufferedOuter = turf.featureCollection([bufferedOuter]);

        var bufferedOuterProvider = new VectorTileImageryProvider({
            source: bufferedOuter,
            zIndex: 99,
            removeDuplicate: false,
            defaultStyle: {
                outlineColor: "rgba(209,204,226,1)",
                lineWidth: 2,
                outline: true,
                fill: true,
                fillColor: "rgba(209,204,226,1)",
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
            minimumLevel: 5,
            minimumLevel: 5,
            simplify: false
        });
        var bufferedOuterLayer;
        bufferedOuterProvider.readyPromise.then(function () {
            bufferedOuterLayer = viewer.imageryLayers.addImageryProvider(bufferedOuterProvider);
        });

        var bufferedInnerProvider = new VectorTileImageryProvider({
            source: bufferedInner,
            zIndex: 99,
            removeDuplicate: false,
            defaultStyle: {
                outlineColor: "rgba(185,169,199,1)",
                lineWidth: 2,
                outline: true,
                fill: true,
                fillColor: "rgba(185,169,199,1)",
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
            minimumLevel: 5,
            minimumLevel: 5,
            simplify: false
        });
        var bufferedInnerLayer;
        bufferedInnerProvider.readyPromise.then(function () {
            bufferedInnerLayer = viewer.imageryLayers.addImageryProvider(bufferedInnerProvider);
        });


    } catch (e) {
        console.log(e);
    }


    Cesium.loadText("./Assets/Data/json/bjsx.json").then(function (bjsx) {
        bjsx = eval("(" + bjsx + ")");

        turf.featureEach(bjsx, function (feature, index) {
            var name = feature.properties.NAME.replace(/\s+$/, '')
            if (name == "海淀区" || name == "门头沟区") {//挖孔
                mask = feature;
                if (mask) {
                    geojson = turf.difference(geojson.features[0], mask);
                    geojson = turf.featureCollection([geojson]);
                }
            }
        })

        var provinceProvider = new VectorTileImageryProvider({
            source: geojson,
            zIndex: 100,
            removeDuplicate: false,
            defaultStyle: {
                outlineColor: "rgb(255,255,255)",
                lineWidth: 2,
                fill: true,
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
            minimumLevel: 5,
            minimumLevel: 5,
            simplify: false
        });
        provinceProvider.readyPromise.then(function () {
            provinceLayer = viewer.imageryLayers.addImageryProvider(provinceProvider);

        });

        var countyVectorImgProvider = new VectorTileImageryProvider({
            source: bjsx,
            zIndex: 2,
            removeDuplicate: false,
            allowPick: true,
            defaultStyle: {
                fillColor: "rgba(255,0,0,125)",
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
            minimumLevel: 6,
            simplify: false
        })
        //添加区县
        viewer.imageryLayers.addImageryProvider(countyVectorImgProvider);

        var featuresPickedLayer = null;

        countyVectorImgProvider.featuresPicked.addEventListener(function (imageryProvider, pickedFeatures) {
            if (featuresPickedLayer) {
                viewer.imageryLayers.remove(featuresPickedLayer);
                featuresPickedLayer.imageryProvider.destroy();
                featuresPickedLayer = null; 
            }
            if (!pickedFeatures) return
            var features = [];
            pickedFeatures.forEach(function (fcInfo) {
                features.push(fcInfo.data)
            })

            features = turf.featureCollection(features, {
                Name: "区县高亮图层"
            })
            featuresPickedLayer = viewer.imageryLayers.addImageryProvider(new VectorTileImageryProvider({
                source: features,
                zIndex: 31,
                defaultStyle: {
                    fill: true,
                    lineWidth: 3,
                    outlineColor: Cesium.Color.fromBytes(255, 0, 0, 255),
                    fillColor: Cesium.Color.fromBytes(255, 0, 0, 50)
                }
            }))
        })



    })
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
        zIndex: 99,
        removeDuplicate: false,
        defaultStyle: {
            outlineColor: "rgb(255,0,0)",
            fillColor: "rgba(255,0,0,0.6)",
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
            centerLabelPropertyName: "NAME",
            lineCap: "round",
            shadowColor: "black",
            shadowOffsetX: 1,
            shadowOffsetY: -1,
            shadowBlur: 1,
            lineJoin: "round"
        },
        maximumLevel: 20,
        minimumLevel: 1,
        simplify: false
    });
    shpProvider.readyPromise.then(function () {
        chinaLayer = viewer.imageryLayers.addImageryProvider(shpProvider);

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
        removeDuplicate: false,
        zIndex: 1,
        defaultStyle: {
            // outlineColor: "rgb(255,255,0)",
            lineWidth: 1,
            fill: true,
            tileCacheSize: 200,
            showMaker: false,
            showCenterLabel: true,
            fontColor: Cesium.Color.WHITE,

            outlineColor: 'rgba(138,138,138,1)',//边界颜色
            fillColor: 'rgba(225,225,225,1)',//陆地颜色
            backgroundColor: 'rgba(89,129,188,1)',//海区颜色

            labelOffsetX: 0,
            labelOffsetY: 0,
            fontSize: 16,
            fontFamily: "黑体",
            // lineDash: [2, 5, 2, 5],
            labelStroke: true,
            labelStrokeWidth: 2,
            labelStrokeColor: "rgba(255,0,0,1)",
            centerLabelPropertyName: "NAME"
        },
        maximumLevel: 20,
        minimumLevel: 1,
        simplify: true,
        styleFilter: function (feature, style, x, y, level) {
            if (feature.properties
                && feature.properties.NAME
                && feature.properties.NAME.indexOf('CHINA') >= 0) {
                style.fillColor = Cesium.Color.fromBytes(255, 255, 255, 255);

            }
            return style;
        }
    });
    shpProvider.readyPromise.then(function () {
        shpLayer = viewer.imageryLayers.addImageryProvider(shpProvider);
        // viewer.imageryLayers.raiseToTop(chinaLayer);
        //viewer.imageryLayers.raiseToBottom(shpLayer);

    });

});
//});