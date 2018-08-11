/// <reference path="appconfig.js" />

requirejs([
    "./requirejs.config.js",
    './src/Main'
], function(
    config,
    Cesium
) {


        VectorTileImageryProvider = Cesium.VectorTileImageryProvider;

        viewer = new Cesium.Viewer("cesiumContainer");
        var imageryProviderViewModels = viewer.baseLayerPicker.viewModel.imageryProviderViewModels;
        var terrainProviderViewModels = viewer.baseLayerPicker.viewModel.terrainProviderViewModels;
        viewer.baseLayerPicker.viewModel.selectedImagery = imageryProviderViewModels[imageryProviderViewModels.length - 1];
        viewer.baseLayerPicker.viewModel.selectedTerrain = terrainProviderViewModels[0];

        viewer.scene.debugShowFramesPerSecond = true;
        var provinceLayer = null;
        Cesium.loadText("./Assets/Data/json/bj.json").then(function(geojson) {
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
                    defaultStyle: {
                        outlineColor: "rgba(209,204,226,1)",
                        lineWidth: 2,
                        outline: true,
                        fill: true,
                        fillColor: "rgba(209,204,226,1)" ,
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
                bufferedOuterProvider.readyPromise.then(function() {
                    bufferedOuterLayer = viewer.imageryLayers.addImageryProvider(bufferedOuterProvider);
                });
                 
                var bufferedInnerProvider = new VectorTileImageryProvider({
                    source: bufferedInner,
                    defaultStyle: {
                        outlineColor: "rgba(185,169,199,1)",
                        lineWidth: 2,
                        outline: true,
                        fill: true,
                        fillColor: "rgba(185,169,199,1)" ,
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
                bufferedInnerProvider.readyPromise.then(function() {
                    bufferedInnerLayer = viewer.imageryLayers.addImageryProvider(bufferedInnerProvider);
                });


            } catch (e) {
                console.log(e);
            }


            Cesium.loadText("./Assets/Data/json/bjsx.json").then(function(bjsx) {
                bjsx = eval("(" + bjsx + ")");

                turf.featureEach(bjsx, function(feature, index) {
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
                provinceProvider.readyPromise.then(function() {
                    provinceLayer = viewer.imageryLayers.addImageryProvider(provinceProvider);

                });

                //添加区县
                viewer.imageryLayers.addImageryProvider(new VectorTileImageryProvider({
                    source: bjsx,
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
                    minimumLevel: 0,
                    simplify: false
                }));

            })
        })

        var shpPromises = [
            Cesium.loadBlob("./Assets/Data/shp/china/国界线.shp"),
            Cesium.loadBlob("./Assets/Data/shp/china/国界线.dbf"),
            Cesium.loadBlob("./Assets/Data/shp/china/国界线.prj"),
        ];
        var chinaLayer = null;
        Cesium.when.all(shpPromises, function(files) {
            files[0].name = "国界线.shp";
            files[1].name = "国界线.dbf";
            files[2].name = "国界线.prj";


            var shpProvider = new VectorTileImageryProvider({
                source: files,
                defaultStyle: {
                    outlineColor: "rgb(255,0,0)",
                    fillColor: "rgba(255,0,0,0.6)",
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
            shpProvider.readyPromise.then(function() {
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
        Cesium.when.all(shpPromises2, function(files) {
            files[0].name = "国家简化边界.shp";
            files[1].name = "国家简化边界.dbf";
            files[2].name = "国家简化边界.prj";

            var shpLayer = null;
            var shpProvider = new VectorTileImageryProvider({
                source: files,
                defaultStyle: {
                    outlineColor: "rgb(255,255,0)",
                    lineWidth: 1.5,
                    fill: false,
                    tileCacheSize: 200,
                    showMaker: false,
                    showCenterLabel: true,
                    fontColor: "rgba(255,0,0,1)",
                    labelOffsetX: 0,
                    labelOffsetY: 0,
                    fontSize: 9,
                    fontFamily: "黑体",
                    lineDash: [2, 5, 2, 5],
                    centerLabelPropertyName: "NAME"
                },
                maximumLevel: 20,
                minimumLevel: 1,
                simplify: true
            });
            shpProvider.readyPromise.then(function() {
                shpLayer = viewer.imageryLayers.addImageryProvider(shpProvider);
                viewer.imageryLayers.raiseToTop(chinaLayer);
            });

        });
    });