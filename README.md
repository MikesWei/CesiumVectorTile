Cesium VectorTileImageryProvider
支持小数据量的geojson、shape文件矢量动态切片，实现贴地
![](https://mikeswei.github.io/CesiumVectorTile/screenshot.jpg)
![](https://mikeswei.github.io/CesiumVectorTile/screenshot2.jpg)
![](https://mikeswei.github.io/CesiumVectorTile/screenshot3.jpg)
![](https://mikeswei.github.io/CesiumVectorTile/screenshot4.jpg)
![](https://mikeswei.github.io/CesiumVectorTile/screenshot5.jpg)
![](https://mikeswei.github.io/CesiumVectorTile/screenshot6.png)

npm 安装

        npm install cesiumvectortile

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
        worldProvider.readyPromise.then(function () {
            worldLayer = viewer.imageryLayers.addImageryProvider(worldProvider);
        });
```
#####  依赖
* [Cesium](https://github.com/AnalyticalGraphicsInc/cesium)
* [turf](https://github.com/Turfjs/turf)
* [shpjs](https://github.com/calvinmetcalf/shapefile-js)
* [proj4js](https://github.com/proj4js/proj4js)
* [text-encoding](https://github.com/inexorabletash/text-encoding)
* [geojson-topojson](https://github.com/JeffPaine/geojson-topojson)
#####  更新

###### 2019.06.03
* 1、支持要素查询：增加构造函数可选参数allowPick，事件featuresPicked

###### 2018.07.15：
* 1、支持虚线和阴影

###### 2018.07.14：
* 1、支持最新版Cesium；
* 2、支持以注记的方式显示关键属性，如地名等。