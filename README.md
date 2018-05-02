Cesium VectorTileImageryProvider
支持geojson、shape文件矢量动态切片，实现贴地
<img src="https://mikeswei.github.io/CesiumVectorTile/screenshot.jpg" /><br/>
<img src="https://mikeswei.github.io/CesiumVectorTile/screenshot2.jpg" />


示例：
```javascript
        VectorTileImageryProvider = Cesium.VectorTileImageryProvider;

        viewer = new Cesium.Viewer("cesiumContainer");
        var imageryProviderViewModels = viewer.baseLayerPicker.viewModel.imageryProviderViewModels;
        viewer.baseLayerPicker.viewModel.selectedImagery = imageryProviderViewModels[imageryProviderViewModels.length - 1];
        viewer.scene.debugShowFramesPerSecond = true;
        
        var provinceLayer = null;
        var provinceProvider = new VectorTileImageryProvider({
            source: appConfig.BaseURL + "Assets/Data/json/china_province.geojson",
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
