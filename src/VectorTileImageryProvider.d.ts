import VectorStyle from "./VectorStyle";
 
/**
 * 
*@example
    //1.面数据
    viewer.imageryLayers.addImageryProvider(new VectorTileImageryProvider({
        source: appConfig.BaseURL + "Assets/VectorData/中国数据/陕西/榆林/county_sshanxi_yulin.shp",
        defaultStyle:{ outlineColor: Cesium.Color.WHITE, 
            fill: true
        },
        maximumLevel: 22,
        minimumLevel: 0
    }))
    //2.点数据
    viewer.imageryLayers.addImageryProvider(new VectorTileImageryProvider({
        source: appConfig.BaseURL + "Assets/VectorData/中国数据/陕西/榆林/town_sshanxi_yulin.shp"
        ,defaultStyle:{ 
            fontColor: Cesium.Color.WHITE
            , fontSize: 20
            , fontFamily: '微软雅黑'
            , markerImage: appConfig.BaseURL + "Assets/Images/Stations/autonew.png"
            , labelOffsetY: 5
            , labelOffsetX: 10
        }
            , maximumLevel: 22
            , minimumLevel: 9
    }))
    //3.线数据
    viewer.imageryLayers.addImageryProvider(new VectorTileImageryProvider({
        source: appConfig.BaseURL + "Assets/VectorData/中国数据/中国边界.shp" 
    }))
 
    //4.geojson
    viewer.imageryLayers.addImageryProvider(new VectorTileImageryProvider({
        source: appConfig.BaseURL + "Assets/SampleData/simplestyles.geojson",//VectorData/中国数据/中国边界.shp",
        defaultStyle:{
            fill: true
        },
            minimumLevel: 0
    }))
 
    5.使用样式函数（styleFilter）设置样式
    viewer.imageryLayers.addImageryProvider(new Cesium.VectorTileImageryProvider({
        source: appConfig.BaseURL + "Assets/VectorData/世界数据/Countries.shp",
        defaultStyle: {
            outlineColor: Cesium.Color.YELLOW,
            lineWidth: 2,
            fillColor: Cesium.Color.fromBytes(2, 24, 47, 200),
            fill: false,
            tileCacheSize: 200,
            showMarker: false,
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
        simplify: false ,
        styleFilter: function (feature, style) {
            if (feature.properties.hasOwnProperty("NAME") && feature.properties["NAME"].toLocaleLowerCase().indexOf("china") >= 0) {
                style.outlineColor = Cesium.Color.RED;
                style.fill = true;
                style.fillColor = Cesium.Color.AZURE.withAlpha(0.5);
            }
        }
    }))
 
6.配图示例
appConfig.map = appConfig.map ? appConfig.map : {
    focusAdminNames: ['北京', '天津', '河北'],
    focusPropertyName: "NAME"
};
imageryProviders.seaLandImgProvider = new VectorTileImageryProvider({
    source: appConfig.BaseURL + 'Assets/SampleData/sealand.geojson',
    zIndex: 999,
    minimumLevel: 0,
    defaultStyle: {
        fill: true,//是否填充海陆颜色
        outlineColor: 'rgba(138,138,138,1)',//边界颜色
        fillColor: 'rgba(235,235,235,1)',//陆地颜色
        backgroundColor: 'rgba(89,129,188,1)'//海区颜色
    }
});
imageryProviders.chinaBorderImgProvider = new VectorTileImageryProvider({
    source: appConfig.BaseURL + 'Assets/SampleData/ChinaBorder.geojson',
    zIndex: 999,
    minimumLevel: 0,
    defaultStyle: {
        lineWidth: 1.25,
        outlineColor: 'rgba(88,88,88,1)'
    }
});
 
imageryProviders.provinceImgProvider = new VectorTileImageryProvider({
    source: appConfig.BaseURL + 'Assets/SampleData/Province.geojson',
    zIndex: 998,
    minimumLevel: 0,
    defaultStyle: {
        lineWidth: 1,
        //lineDash: [1, 4],
        fill: true,
        outline: true,
        shadowColor: Cesium.Color.WHITE,
        outlineColor: 'rgba(118,118,118,1)',
        fillColor: 'rgba(225,225,225, .5)'
    },
    styleFilter: function (feature, style) {
 
        if (appConfig.map) {
            var highlight = false;
            for (var i = 0; i < appConfig.map.focusAdminNames.length; i++) {
                highlight = feature.properties[appConfig.map.focusPropertyName]
                    && feature.properties[appConfig.map.focusPropertyName].indexOf(appConfig.map.focusAdminNames[i]) >= 0;
                if (highlight) break;
            }
            if (highlight) {
                style.fill = false;
                style.outlineColor = Cesium.Color.BLACK;
                style.fillColor = Cesium.Color.WHITE;
                style.lineWidth = 1.25;
                style.lineDash = null;
            }
        }
 
        return style;
    }
});
 
imageryProviders.adminLabelImgProvider = new VectorTileImageryProvider({
    source: appConfig.BaseURL + 'Assets/SampleData/placeName.geojson',
    minimumLevel: 3,
    defaultStyle: {
        showLabel: true,
        labelPropertyName: "name",
        fontFamily: 'heiti',
        showMarker: true,
        labelOffsetY: -12,
        pointColor: 'rgba(118,118,118,1)',
        labelStrokeWidth: 4,
        fontSize: 12,
        labelStroke: true,
        fontColor: Cesium.Color.WHITE,
        labelStrokeColor: 'rgba(118,118,118,1)'//Cesium.Color.BLACK
    },
    styleFilter: function (fc, style, x, y, level) {
        var highlight = false;
        if (appConfig.map && fc.properties.province) {
 
            for (var i = 0; i < appConfig.map.focusAdminNames.length; i++) {
                highlight = fc.properties.province.indexOf(
                    appConfig.map.focusAdminNames[i]
                ) >= 0;
                if (highlight) break;
            }
        }
        if (highlight) {
            style.pointColor = Cesium.Color.BLACK;
        }
        if (fc.properties.adminType == 'province') {
            if (level > 14) {
                style.show = false;
            }
            style.showMarker = false;
            style.labelOffsetY = 0;
            style.fontSize = 16;
            if (highlight) {
                style.labelStrokeColor = Cesium.Color.fromBytes(160, 99, 57);
            } else {
                style.labelStrokeColor = Cesium.Color.fromBytes(140, 89, 47);
            }
        } else {
 
            if (fc.properties.adminType == 'city') {
                if (level < 6) {
                    style.show = false;
                }
            }
            if (fc.properties.adminType == 'county' && level < 10) {
                style.show = false;
            }
            if (fc.properties.adminType == 'country') {
                style.show = false;
            }
 
            if (level > 14) {
                style.fontSize = 18;
            }
 
            if (highlight) {
                style.labelStrokeColor = Cesium.Color.BLACK;
            }
        }
        if (level < 6) {
            style.fontSize = 9;
        }
        if (level > 4) {
            style.labelPropertyName = "name";
        } else {
            style.labelPropertyName = "nameabbrevation";
        }
 
        return style;
    }
})
imageryProviderViewModels.push(new Cesium.ProviderViewModel({
    name: '海陆模版',
    iconUrl: appConfig.BaseURL + 'Assets/Images/ImageryProviders/sealand.png',
    tooltip: '海陆模版',
    creationFunction: function () {
        setTimeout(function () {
            imageryProviderViewModels.onSelected(imageryProviders.seaLandImgProvider);
        }, 200);
        return imageryProviders.seaLandImgProvider;
    }
}));
 
//leaflet中使用,必须先引用leafletjs文件后引用MeteoLibjs文件
//VectorTileImageryLayer参数和MeteoLib.Scene.VectorTileImageryProvider的参数一样
var map = L.map('map', {
            crs: L.CRS.EPSG4326
        })
var vectorTileImageryLayer = new L.VectorTileImageryLayer({
    zIndex: 1,
    source: "../../../examples/Assets/Data/json/china_province.geojson",
    defaultStyle: {
        fill: true
    }
})
layerCtrl.addOverlay(vectorTileImageryLayer, '自定义矢量瓦片图层')
vectorTileImageryLayer.addTo(map)
 */
export default class VectorTileImageryProvider {

    /**
    *动态矢量切片提供程序，支持esri shapefile、geojson文件，也可以直接加载geojson对象和Polygon,PolyLine
    *
    *@example
        //1.面数据
        viewer.imageryLayers.addImageryProvider(new VectorTileImageryProvider({
            source: appConfig.BaseURL + "Assets/VectorData/中国数据/陕西/榆林/county_sshanxi_yulin.shp",
            defaultStyle:{ outlineColor: Cesium.Color.WHITE, 
                fill: true
            },
            maximumLevel: 22,
            minimumLevel: 0
        }))
        //2.点数据
        viewer.imageryLayers.addImageryProvider(new VectorTileImageryProvider({
            source: appConfig.BaseURL + "Assets/VectorData/中国数据/陕西/榆林/town_sshanxi_yulin.shp"
            ,defaultStyle:{ 
                fontColor: Cesium.Color.WHITE
                , fontSize: 20
                , fontFamily: '微软雅黑'
                , markerImage: appConfig.BaseURL + "Assets/Images/Stations/autonew.png"
                , labelOffsetY: 5
                , labelOffsetX: 10
            }
                , maximumLevel: 22
                , minimumLevel: 9
        }))
        //3.线数据
        viewer.imageryLayers.addImageryProvider(new VectorTileImageryProvider({
            source: appConfig.BaseURL + "Assets/VectorData/中国数据/中国边界.shp" 
        }))
    
        //4.geojson
        viewer.imageryLayers.addImageryProvider(new VectorTileImageryProvider({
            source: appConfig.BaseURL + "Assets/SampleData/simplestyles.geojson",//VectorData/中国数据/中国边界.shp",
            defaultStyle:{
                fill: true
            },
                minimumLevel: 0
        }))
    
        5.使用样式函数（styleFilter）设置样式
        viewer.imageryLayers.addImageryProvider(new Cesium.VectorTileImageryProvider({
            source: appConfig.BaseURL + "Assets/VectorData/世界数据/Countries.shp",
            defaultStyle: {
                outlineColor: Cesium.Color.YELLOW,
                lineWidth: 2,
                fillColor: Cesium.Color.fromBytes(2, 24, 47, 200),
                fill: false,
                tileCacheSize: 200,
                showMarker: false,
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
            simplify: false ,
            styleFilter: function (feature, style) {
                if (feature.properties.hasOwnProperty("NAME") && feature.properties["NAME"].toLocaleLowerCase().indexOf("china") >= 0) {
                    style.outlineColor = Cesium.Color.RED;
                    style.fill = true;
                    style.fillColor = Cesium.Color.AZURE.withAlpha(0.5);
                }
            }
        }))
    
    6.配图示例
    appConfig.map = appConfig.map ? appConfig.map : {
        focusAdminNames: ['北京', '天津', '河北'],
        focusPropertyName: "NAME"
    };
    imageryProviders.seaLandImgProvider = new VectorTileImageryProvider({
        source: appConfig.BaseURL + 'Assets/SampleData/sealand.geojson',
        zIndex: 999,
        minimumLevel: 0,
        defaultStyle: {
            fill: true,//是否填充海陆颜色
            outlineColor: 'rgba(138,138,138,1)',//边界颜色
            fillColor: 'rgba(235,235,235,1)',//陆地颜色
            backgroundColor: 'rgba(89,129,188,1)'//海区颜色
        }
    });
    imageryProviders.chinaBorderImgProvider = new VectorTileImageryProvider({
        source: appConfig.BaseURL + 'Assets/SampleData/ChinaBorder.geojson',
        zIndex: 999,
        minimumLevel: 0,
        defaultStyle: {
            lineWidth: 1.25,
            outlineColor: 'rgba(88,88,88,1)'
        }
    });
    
    imageryProviders.provinceImgProvider = new VectorTileImageryProvider({
        source: appConfig.BaseURL + 'Assets/SampleData/Province.geojson',
        zIndex: 998,
        minimumLevel: 0,
        defaultStyle: {
            lineWidth: 1,
            //lineDash: [1, 4],
            fill: true,
            outline: true,
            shadowColor: Cesium.Color.WHITE,
            outlineColor: 'rgba(118,118,118,1)',
            fillColor: 'rgba(225,225,225, .5)'
        },
        styleFilter: function (feature, style) {
    
            if (appConfig.map) {
                var highlight = false;
                for (var i = 0; i < appConfig.map.focusAdminNames.length; i++) {
                    highlight = feature.properties[appConfig.map.focusPropertyName]
                        && feature.properties[appConfig.map.focusPropertyName].indexOf(appConfig.map.focusAdminNames[i]) >= 0;
                    if (highlight) break;
                }
                if (highlight) {
                    style.fill = false;
                    style.outlineColor = Cesium.Color.BLACK;
                    style.fillColor = Cesium.Color.WHITE;
                    style.lineWidth = 1.25;
                    style.lineDash = null;
                }
            }
    
            return style;
        }
    });
    
    imageryProviders.adminLabelImgProvider = new VectorTileImageryProvider({
        source: appConfig.BaseURL + 'Assets/SampleData/placeName.geojson',
        minimumLevel: 3,
        defaultStyle: {
            showLabel: true,
            labelPropertyName: "name",
            fontFamily: 'heiti',
            showMarker: true,
            labelOffsetY: -12,
            pointColor: 'rgba(118,118,118,1)',
            labelStrokeWidth: 4,
            fontSize: 12,
            labelStroke: true,
            fontColor: Cesium.Color.WHITE,
            labelStrokeColor: 'rgba(118,118,118,1)'//Cesium.Color.BLACK
        },
        styleFilter: function (fc, style, x, y, level) {
            var highlight = false;
            if (appConfig.map && fc.properties.province) {
    
                for (var i = 0; i < appConfig.map.focusAdminNames.length; i++) {
                    highlight = fc.properties.province.indexOf(
                        appConfig.map.focusAdminNames[i]
                    ) >= 0;
                    if (highlight) break;
                }
            }
            if (highlight) {
                style.pointColor = Cesium.Color.BLACK;
            }
            if (fc.properties.adminType == 'province') {
                if (level > 14) {
                    style.show = false;
                }
                style.showMarker = false;
                style.labelOffsetY = 0;
                style.fontSize = 16;
                if (highlight) {
                    style.labelStrokeColor = Cesium.Color.fromBytes(160, 99, 57);
                } else {
                    style.labelStrokeColor = Cesium.Color.fromBytes(140, 89, 47);
                }
            } else {
    
                if (fc.properties.adminType == 'city') {
                    if (level < 6) {
                        style.show = false;
                    }
                }
                if (fc.properties.adminType == 'county' && level < 10) {
                    style.show = false;
                }
                if (fc.properties.adminType == 'country') {
                    style.show = false;
                }
    
                if (level > 14) {
                    style.fontSize = 18;
                }
    
                if (highlight) {
                    style.labelStrokeColor = Cesium.Color.BLACK;
                }
            }
            if (level < 6) {
                style.fontSize = 9;
            }
            if (level > 4) {
                style.labelPropertyName = "name";
            } else {
                style.labelPropertyName = "nameabbrevation";
            }
    
            return style;
        }
    })
    imageryProviderViewModels.push(new Cesium.ProviderViewModel({
        name: '海陆模版',
        iconUrl: appConfig.BaseURL + 'Assets/Images/ImageryProviders/sealand.png',
        tooltip: '海陆模版',
        creationFunction: function () {
            setTimeout(function () {
                imageryProviderViewModels.onSelected(imageryProviders.seaLandImgProvider);
            }, 200);
            return imageryProviders.seaLandImgProvider;
        }
    }));
 
    //leaflet中使用,必须先引用leafletjs文件后引用MeteoLibjs文件
    //VectorTileImageryLayer参数和MeteoLib.Scene.VectorTileImageryProvider的参数一样
    var map = L.map('map', {
                crs: L.CRS.EPSG4326
            })
    var vectorTileImageryLayer = new L.VectorTileImageryLayer({
        zIndex: 1,
        source: "../../../examples/Assets/Data/json/china_province.geojson",
        defaultStyle: {
            fill: true
        }
    })
    layerCtrl.addOverlay(vectorTileImageryLayer, '自定义矢量瓦片图层')
    vectorTileImageryLayer.addTo(map)
    */
    constructor(options: {
        /**
         *  Cesium.Util.Contour.PolyLine及MeteoLib.Util.Contour.Polygon数组、矢量文件url、矢量文件列表或者geojson对象
         */
        source: String | turf.FeatureCollection | Object | Array<Cesium.Util.Contour.PolyLine | Cesium.Util.Contour.Polygon | File>
        /**
         * 默认样式 
         */
        defaultStyle?: VectorStyle;
        /**
         * true则简化，默认不简化
         */
        simplify?: boolean;
        /**
         * 简化公差
         */
        simplifyTolerance: number;
        /**
         * 最小级别
         */
        minimumLevel?: number;
        /**
         *  最大级别
         */
        maximumLevel?: number;
        /**
         *  当超出最大级别时是否继续显示
         */
        showMaximumLevel?: boolean;
        /**
         *  是否剔除重复的多边形
         */
        removeDuplicate?: boolean;
        /**
         *  是否支持要素查询，如果支持要素查询则保留原始的geojson，会多占用系统内存
         */
        allowPick?: boolean;

        /**
         * 样式函数
         */
        StyleFilterCallback?: (

            /**
             * 当前要素（用Geojson.Feature存储）
             */
            feature: object,
            /**
             * 即将应用与当前要素的样式，可以通过修改该参数中的各样式设置选项来针对当前要素进行特殊的样式设置。
             * 修改后只对当前要素有效，不会修改MeteoLib.Scene.VectorTileImageryProvider的默认样式
             */
            style: VectorStyle,
            x: number,
            y: number,
            level: number
        ) => VectorStyle
    })
    readyPromise:Promise<this>
    clearCache(): void
    requestImage(x: number, y: number, level: number, distance: number): Promise<HTMLImageElement | HTMLCanvasElement>

    /**
    *同步导出瓦片 
    */
    requestImageSync(x: number, y: number, level: number): HTMLCanvasElement
    /**
    *合并图层并出图
    *@param {Array.<Cesium.VectorTileImageryProvider>}vectorTileImageryProviders
    *@param {Cesium.Rectangle}rectangle
    *@param {Number}level
    *@param {Number}[tileWidth=256]
    *@param {Number}[tileHeight=256] 
    */
    static compose(vectorTileImageryProviders: VectorTileImageryProvider[], rectangle: {
        west: number; south: number; east: number; north: number
    }, level: number, tileWidth?: number, tileHeight?: number): HTMLCanvasElement
}
