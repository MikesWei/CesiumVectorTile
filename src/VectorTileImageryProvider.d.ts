import VectorStyle from "./VectorStyle";
export =VectorTileImageryProvider;
 
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
declare class VectorTileImageryProvider {

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

/**
 * 极坐标网格（雷达网格） 
 */
class PolarGridImageryProvider extends VectorTileImageryProvider {
    /**
     * 极坐标网格（雷达网格）
    * @example 
        var PolarGridImageryProvider = Cesium.PolarGridImageryProvider;
        var polarGridImageryProvider = new PolarGridImageryProvider({
            polarGrid: {
                header: {
                    Position: [100, 30],
                    Gates: [1000],
                    GateSizeOfReflectivity: 250,
                    BandNo: 0
                },
                azimuthGranularity: 30,
                radiusGranularity: 50 * 1000
            },
            zIndex: 92,
            showAxis:true,
            showTickLable:true
        })
        viewer.imageryLayers.addImageryProvider(polarGridImageryProvider)
        viewer.imageryLayers.orderByZIndex()  
     */
    constructor(options: {
        polarGrid: {
            type: string;
            header: Data.Radar.RadarNetHeader | {
                Position: number[]
                Gates: number[]
                GateSizeOfReflectivity: number
                BandNo: number
            };
            radiusGranularity: number
            azimuthGranularity: number
        }
        style: VectorStyle
        name: string
        zIndex: number
        showTickLable: boolean
        showAxis: boolean
    })
}


class RasterTileData {
    /**
    *  
    *@param {Object}options
    *@param {Number}options.width
    *@param {Number}options.height
    *@param {Array.<Number>|TypeArray}options.data
    *@param {Array.<Number>|TypeArray}options.bbox
    *@param {Number}[options.bandNo=1]
    */
    constructor(options)
}


/**
*定义了以动态切片的方式加载栅格数据的接口，内置envi格式栅格数据加载方法。
*内部调用流程图如下：<br/>
*<img src="https://www.plantuml.com/plantuml/png/LL6zJiD03DuZvHqyLUd20pG35Qe4I0mLuWMCuYGdNNF1vxGA6wfWOMNZ1JAoiF8sfV0ME9T68jlv-_5d-vPUaANPMBX5ByHtnjBr1WlYTirkQpBYmylpxxxx-TWVtxhlpwTZztfu_ugZO8oZXQcC6BJcaLAj2f9WlwIA6CLn2eeoFJJavOfG-_Mo6jdJgLG1KqsepNQbnaF2IhGmWmm50RTeBDuhFWDVkjtvF8u0nfOXBFsFz1kir3Y08MW2cHmICnbn3b9IbRJaGsjrJVcpOdWDEMIzZbYvKJkI5-sAScoi3AegCtcOGCQBtZXTDrDMkR1eVqDNnz5I0Vs1Fm00"/>
*@constructor
*@memberof Cesium.Scene
* 
*@param {Object}options
*@param {Cesium.RasterImageGenerator}options.imageGenerator
*@param {String}options.fileName
*@param {String}options.url 接口url，接口形如http://xxx?fileName={fileName}&xOffset={xOffset}&yOffset={yOffset}&xSize={xSize}&ySize={ySize}&stride={stride}&typeSize={typeSize}&headerSize={headerSize}&xBufferSize={xBufferSize}&yBufferSize={yBufferSize}
*@param {Number}[options.minimumLevel=0]
*@param {Number}[options.maximumLevel]
*@param {Number}[options.headerSize=0]
*@param {Number}[options.typeSize=1]
*@param {Array.<Number>}[options.bands] 加载的波段编号，波段编号从1开始
*@param {Array.<Number>}[options.defaultValidRange] 
*@param {Number}[options.nodataValue] 无效值，当显示为灰度图时，遇无效值则透明 
*@param {Cesium.Data.RasterData.enumDataType|Number}[options.dataType=Cesium.Data.RasterData.enumDataType.Byte] 
*@param {String}[options.hdrFileName]
*@param {Array.<Number>|Cesium.Rectangle}[options.rectangle] 图层地理范围
*@param {Array.<Number>|Cesium.Rectangle}[options.dataRectangle=Cesium.Rectangle.MAX_VALUE] 图层原始数据地理范围
*@param {Number}[options.zIndex]
*@param {Boolean}[options.compress=true]
*@param {Boolean}[options.userWebWorker=false]
*@param {Boolean}[options.enableServerCache=false]
*@param {Cesium.RasterTileImageryProvider~ParseHeaderCallback}options.parseHeader
*@param {Cesium.RasterTileImageryProvider~GetImageGeneratorCallback}options.getImageGenerator
*
*@see Cesium.AwxSateImageryProvider
*@see Cesium.GrADSRasterImageryProvider
*
*@example
    //1、示例一：加载awx格式云图
    var options={
        headerSize : 4096,
        getImageGenerator : function (header) {
            var sateNames = ['FY2E', 'F2E', 'FY2G', 'F2G', 'FY4A', 'HMW8']
            var dataNameParts = this.fileName.split(/[\._-]+/g);
            var sateName;
            for (var i = 0; i < dataNameParts.length; i++) {
                sateName = dataNameParts[i].toUpperCase()
                var exits = false;
                for (var j = 0; j < sateNames.length; j++) {
                    if (sateNames[j] == sateName) {
                        exits = true;
                        break;
                    }
                }
                if (exits) break;
            }
 
            var dataAttributes = header.Attributes;
            var bandNo = dataAttributes['通道号'];
 
            if (sateName == 'FY2E'
                || sateName == 'FY2G'
                || sateName == 'F2E'
                || sateName == 'F2G') {
 
                if (bandNo == 1 || bandNo == 3) {
                    imageGenerator = RasterImageGenerator.FY2G.IR01_02;
                } else if (bandNo == 2) {
                    imageGenerator = RasterImageGenerator.FY2G.IR03;
                } else {
                    imageGenerator = RasterImageGenerator.FY2G.IR4_VIS;
                }
            }
            else if (sateName == 'FY4A') {
 
                if (bandNo == 4) {
                    imageGenerator = RasterImageGenerator.FY4A.C01_C06;
                } else if (bandNo == 5) {
                    imageGenerator = RasterImageGenerator.FY4A.C07_C08;
                } else if (bandNo == 2) {
                    imageGenerator = RasterImageGenerator.FY4A.C09_C10;
                } else if (bandNo == 1) {
                    imageGenerator = RasterImageGenerator.FY4A.C11_C14;
                }
 
            } else if (sateName == 'HMW8') {
 
                if (bandNo == 4) {
                    imageGenerator = RasterImageGenerator.HMW8.B03;
                } else if (bandNo == 2) {
                    imageGenerator = RasterImageGenerator.HMW8.B08;
                } else if (bandNo == 1) {
                    imageGenerator = RasterImageGenerator.HMW8.B13;
                }
            }
            return imageGenerator;
        },
        parseHeader : function (headerBuffer, headerFileName) {
            this.header = new AwxRasterHeader(headerBuffer, headerFileName);
            this.width = this.header.Width;
            this.height = this.header.Height;
            var ce = this.header.CoordEnvelope;
            this.bbox = [ce.MinX, ce.MinY, ce.MaxX, ce.MaxY];
            this.rectangle = Cesium.Rectangle.fromDegrees(
                ce.MinX, ce.MinY, ce.MaxX, ce.MaxY, undefined, this.rectangle
            );
            this.headerSize = this.header.HeaderSize;
            return this.header;
        } 
    }
    var imgPrvd=new RasterTileImageryProvider(options);
    var layer=viewer.imageryLayers.addImageryProvider(imgPrvd);
 
   //2、示例二：加载envi格式云图
    var imgPrvdEnvi = new RasterTileImageryProvider({
        fileName: "FY4A-_AGRI--_N_DISK_1047E_L1-_FDI-_MULT_NOM_20180807080000_20180807081459_4000M_V0001.DN.DAT",
        hdrFileName: "FY4A-_AGRI--_N_DISK_1047E_L1-_FDI-_MULT_NOM_20180807080000_20180807081459_4000M_V0001.DN.hdr",
        url: "http://39.107.107.142:18880/hfs?dir=EnviData&path=FY4A/Demo",
        defaultValidRange: [0, 3000],
        compress: false,
        bands:[3,2,1]//大于等于三个波段时，默认按前三个波段做rgb合成
    });
    var layerEnvi = viewer.imageryLayers.addImageryProvider(imgPrvdEnvi);
*/
class RasterTileImageryProvider {
    /**
    *定义了以动态切片的方式加载栅格数据的接口，内置envi格式栅格数据加载方法。
    *内部调用流程图如下：<br/>
    *<img src="https://www.plantuml.com/plantuml/png/LL6zJiD03DuZvHqyLUd20pG35Qe4I0mLuWMCuYGdNNF1vxGA6wfWOMNZ1JAoiF8sfV0ME9T68jlv-_5d-vPUaANPMBX5ByHtnjBr1WlYTirkQpBYmylpxxxx-TWVtxhlpwTZztfu_ugZO8oZXQcC6BJcaLAj2f9WlwIA6CLn2eeoFJJavOfG-_Mo6jdJgLG1KqsepNQbnaF2IhGmWmm50RTeBDuhFWDVkjtvF8u0nfOXBFsFz1kir3Y08MW2cHmICnbn3b9IbRJaGsjrJVcpOdWDEMIzZbYvKJkI5-sAScoi3AegCtcOGCQBtZXTDrDMkR1eVqDNnz5I0Vs1Fm00"/>
    *@constructor
    *@memberof Cesium.Scene
    * 
    *@param {Object}options
    *@param {Cesium.RasterImageGenerator}options.imageGenerator
    *@param {String}options.fileName
    *@param {String}options.url 接口url，接口形如http://xxx?fileName={fileName}&xOffset={xOffset}&yOffset={yOffset}&xSize={xSize}&ySize={ySize}&stride={stride}&typeSize={typeSize}&headerSize={headerSize}&xBufferSize={xBufferSize}&yBufferSize={yBufferSize}
    *@param {Number}[options.minimumLevel=0]
    *@param {Number}[options.maximumLevel]
    *@param {Number}[options.headerSize=0]
    *@param {Number}[options.typeSize=1]
    *@param {Array.<Number>}[options.bands] 加载的波段编号，波段编号从1开始
    *@param {Array.<Number>}[options.defaultValidRange] 
    *@param {Number}[options.nodataValue] 无效值，当显示为灰度图时，遇无效值则透明 
    *@param {Cesium.Data.RasterData.enumDataType|Number}[options.dataType=Cesium.Data.RasterData.enumDataType.Byte] 
    *@param {String}[options.hdrFileName]
    *@param {Array.<Number>|Cesium.Rectangle}[options.rectangle] 图层地理范围
    *@param {Array.<Number>|Cesium.Rectangle}[options.dataRectangle=Cesium.Rectangle.MAX_VALUE] 图层原始数据地理范围
    *@param {Number}[options.zIndex]
    *@param {Boolean}[options.compress=true]
    *@param {Boolean}[options.userWebWorker=false]
    *@param {Boolean}[options.enableServerCache=false]
    *@param {Cesium.RasterTileImageryProvider~ParseHeaderCallback}options.parseHeader
    *@param {Cesium.RasterTileImageryProvider~GetImageGeneratorCallback}options.getImageGenerator
    *
    *@see Cesium.AwxSateImageryProvider
    *@see Cesium.GrADSRasterImageryProvider
    *
    *@example
        //1、示例一：加载awx格式云图
        var options={
            headerSize : 4096,
            getImageGenerator : function (header) {
                var sateNames = ['FY2E', 'F2E', 'FY2G', 'F2G', 'FY4A', 'HMW8']
                var dataNameParts = this.fileName.split(/[\._-]+/g);
                var sateName;
                for (var i = 0; i < dataNameParts.length; i++) {
                    sateName = dataNameParts[i].toUpperCase()
                    var exits = false;
                    for (var j = 0; j < sateNames.length; j++) {
                        if (sateNames[j] == sateName) {
                            exits = true;
                            break;
                        }
                    }
                    if (exits) break;
                }
        
                var dataAttributes = header.Attributes;
                var bandNo = dataAttributes['通道号'];
        
                if (sateName == 'FY2E'
                    || sateName == 'FY2G'
                    || sateName == 'F2E'
                    || sateName == 'F2G') {
        
                    if (bandNo == 1 || bandNo == 3) {
                        imageGenerator = RasterImageGenerator.FY2G.IR01_02;
                    } else if (bandNo == 2) {
                        imageGenerator = RasterImageGenerator.FY2G.IR03;
                    } else {
                        imageGenerator = RasterImageGenerator.FY2G.IR4_VIS;
                    }
                }
                else if (sateName == 'FY4A') {
        
                    if (bandNo == 4) {
                        imageGenerator = RasterImageGenerator.FY4A.C01_C06;
                    } else if (bandNo == 5) {
                        imageGenerator = RasterImageGenerator.FY4A.C07_C08;
                    } else if (bandNo == 2) {
                        imageGenerator = RasterImageGenerator.FY4A.C09_C10;
                    } else if (bandNo == 1) {
                        imageGenerator = RasterImageGenerator.FY4A.C11_C14;
                    }
        
                } else if (sateName == 'HMW8') {
        
                    if (bandNo == 4) {
                        imageGenerator = RasterImageGenerator.HMW8.B03;
                    } else if (bandNo == 2) {
                        imageGenerator = RasterImageGenerator.HMW8.B08;
                    } else if (bandNo == 1) {
                        imageGenerator = RasterImageGenerator.HMW8.B13;
                    }
                }
                return imageGenerator;
            },
            parseHeader : function (headerBuffer, headerFileName) {
                this.header = new AwxRasterHeader(headerBuffer, headerFileName);
                this.width = this.header.Width;
                this.height = this.header.Height;
                var ce = this.header.CoordEnvelope;
                this.bbox = [ce.MinX, ce.MinY, ce.MaxX, ce.MaxY];
                this.rectangle = Cesium.Rectangle.fromDegrees(
                    ce.MinX, ce.MinY, ce.MaxX, ce.MaxY, undefined, this.rectangle
                );
                this.headerSize = this.header.HeaderSize;
                return this.header;
            } 
        }
        var imgPrvd=new RasterTileImageryProvider(options);
        var layer=viewer.imageryLayers.addImageryProvider(imgPrvd);
        
        //2、示例二：加载envi格式云图
        var imgPrvdEnvi = new RasterTileImageryProvider({
            fileName: "FY4A-_AGRI--_N_DISK_1047E_L1-_FDI-_MULT_NOM_20180807080000_20180807081459_4000M_V0001.DN.DAT",
            hdrFileName: "FY4A-_AGRI--_N_DISK_1047E_L1-_FDI-_MULT_NOM_20180807080000_20180807081459_4000M_V0001.DN.hdr",
            url: "http://39.107.107.142:18880/hfs?dir=EnviData&path=FY4A/Demo",
            defaultValidRange: [0, 3000],
            compress: false,
            bands:[3,2,1]//大于等于三个波段时，默认按前三个波段做rgb合成
        });
        var layerEnvi = viewer.imageryLayers.addImageryProvider(imgPrvdEnvi);
    */
    constructor(options)
}

class GridDataImageryProviderOptions {
    /**
     * 格点数据数组,矢量数据时表示矢量大小
     */
    dataArray: ArrayBufferView | number[]
    /**
     * 矢量数据时表示方向
     */
    angleArray: ArrayBufferView | number[]

    /**
     * 等值线分段数值
     */
    breaks?: number[]
    /**
     * 格点场宽度，经向格点数
     */
    width: number
    /**
     * 格点长高度，纬向格点数
     */
    height: number
    /**
     *  显示的地理范围 
     */
    rectangle: Cesium.Rectangle
    /**
     *   原始数据的地理范围 
     */
    dataRectangle?: Cesium.Rectangle

    /**
     * 是否填充颜色
     */
    fill?: boolean
    /**
     * 色斑图图例（调色板）
     */
    colorMap: Array

    minimumLevel?: number
    maximumLevel: number
    tileWidth?: number
    tileHeight?: number
    maximumCacheSize?: number
    /**
     * 是否插值
     */
    interpolate?: boolean
    isoLine?: boolean
    lineColor?: string
    lineWidth?: number
    /**
     *  是否显示点
     */
    point?: boolean
    pointColor?: Cesium.Color | string
    pointSize?: number
    /**
     *  是否显原始数据点数值
     */
    value?: boolean
    /**
     *  原始数据点数值显示颜色
     */
    valueColor?: Cesium.Color
    valueBackColor?: Cesium.Color
    valueStrokeColor?: Cesium.Color
    /**
     * 是否显原始数据点数值 
     */
    valueStroke?: boolean
    valueStrokeWidth?: number
    valueFontSize?: number
    valueFontFamily?: string
    valuePadding?: number
    /**
     *  是否显原始数据点数值
     */
    isoValue?: boolean
    /**
     * 原始数据点数值显示颜色
     */
    isoValueColor?: Cesium.Color
    isoValueBackColor?: Cesium.Color
    isoValueStrokeColor?: Cesium.Color
    /**
     *  是否显原始数据点数值 
     */
    isoValueStroke: boolean
    isoValueStrokeWidth?: number
    isoValueFontSize?: number
    isoValueFontFamily?: string
    isoValuePadding?: number
    maximumPointDensity?: number
    pointDensity?: number
    /**
     * ='single'|"fillColor"
     */
    lineColorType?: string
    /**
     *  大于该级别时不进行抽稀处理
     */
    maxSamplePointLevel: number
    beforeDrawPoint: (

        context: HTMLCanvas2DContext,
        args: {
            scalarValue: number
            vectorValue: number
            x: number
            y: number
            lon: number
            lat: number
            cancel: boolean
        }
    ) => void
    /**
     *  裁剪图层 
     */
    clipperLayer?: VectorTileImageryProvider
}

/**
 * 加载格点数据数据，内置等值线，色斑图，格点图以及箭头矢量图的显示功能
 */
class GridDataImageryProvider {
    /**
     * 加载格点数据数据，内置等值线，色斑图，格点图以及箭头矢量图的显示功能 
     * @example
     
        var GridData = Cesium.Data.Micaps.GridData;
        var GridDataColorMap = Cesium.GridDataColorMap;
        var GridDataImageryProvider=Cesium.GridDataImageryProvider;
     
        GridDataColorMap.fromMICAPSPalatteXml('Apps/rain1.xml').then(function (colorMap) {
             
            var start = new Date();
            loadArrayBuffer('Apps/RH85018090608.072').then(function (buf) {
                console.log("loadArrayBuffer:" + (new Date() - start))
                var gridData = new GridData();
                gridData.loadByteArray(buf);
                console.log("loadByteArray:" + (new Date() - start))
                var width = gridData.latitudeGridNumber,
                    height = gridData.longitudeGridNumber;
     
                var geoInfo = new Float32Array(4);
                var endLon = gridData.startLongitude + width * gridData.longitudeGridSpace
                if (endLon < 180) {
                    geoInfo[0] = gridData.startLongitude;
                    geoInfo[2] = gridData.endLongitude;
                } else {
                    geoInfo[0] = 180 - endLon;
                    geoInfo[2] = 180;
                }
                geoInfo[1] = gridData.startLatitude < gridData.endLatitude ? gridData.startLatitude : gridData.endLatitude;
                geoInfo[3] = gridData.startLatitude > gridData.endLatitude ? gridData.startLatitude : gridData.endLatitude;
     
                var imgPrvd = new GridDataImageryProvider({
                    zIndex: 9,
                    scene: viewer.scene,
     
                    //原始数据点显示设置
                    point: true,
                    pointSize: 2,
                    pointColor: Cesium.Color.fromBytes(128, 128, 128),
     
                    pointDensity:5,//指示点的密度，值越大越稀疏
                    maximumPointDensity :8,//指示当自动分级（pointDensity为0或者不设置）时点的密度，值越大越稀疏
     
                    //原始数据点数值显示设置
                    value: true,
                    valueColor: Cesium.Color.fromBytes(128, 128, 128),
                    valueBackColor: Cesium.Color.TRANSPARENT,
                    valueStroke: true,
                    valueStrokeWidth: 1,
                    valueStrokeColor: Cesium.Color.WHITE,
                    valueFontSize: 9,
                    //valueFontFamily: 'kaiti',
                    valuePadding: 0,
     
                    //等值线数值显示设置
                    isoValue: true,
                    isoValueColor: Cesium.Color.fromBytes(0, 0, 0),
                    isoValueBackColor: Cesium.Color.TRANSPARENT,
                    isoValueStroke: true,
                    isoValueStrokeWidth: 4,
                    isoValueStrokeColor: Cesium.Color.fromBytes(228,228,228),
                    isoValueFontSize: 12,
                    isoValueFontFamily: 'heiti',
                    isoValuePadding: 0,
     
                    //等值线显示设置
                    isoLine: true,
                    lineColor: Cesium.Color.WHITE,
                    lineWidth: 1,
                    lineDash:[5,0,5,0],//虚线样式，不设置则为实线
     
                    //栅格色斑图数据显示设置
                    fill: true,
                    colorMap: colorMap,
     
                    dataArray: gridData.dataArray,
                    width: width,
                    height: height,
                    breaks: [0, 5, 10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100],
                    maximumLevel: 6,
                    rectangle: Cesium.Rectangle.fromDegrees(
                        geoInfo[0], geoInfo[1], geoInfo[2], geoInfo[3]
                    )
                })
                viewer.imageryLayers.addImageryProvider(imgPrvd);
                console.log("addImageryProvider:" + (new Date() - start))
                viewer.imageryLayers.orderByZIndex();
                
     
            })
     
        })
     
     */
    constructor(options: {

        /**
         * 格点数据数组,矢量数据时表示矢量大小
         */
        dataArray: ArrayBufferView | number[]
        /**
         * 矢量数据时表示方向
         */
        angleArray: ArrayBufferView | number[]

        /**
         * 等值线分段数值
         */
        breaks?: number[]
        /**
         * 格点场宽度，经向格点数
         */
        width: number
        /**
         * 格点长高度，纬向格点数
         */
        height: number
        /**
         *  显示的地理范围 
         */
        rectangle: Cesium.Rectangle
        /**
         *   原始数据的地理范围 
         */
        dataRectangle?: Cesium.Rectangle

        /**
         * 是否填充颜色
         */
        fill?: boolean
        /**
         * 色斑图图例（调色板）
         */
        colorMap: Array

        minimumLevel?: number
        maximumLevel: number
        tileWidth?: number
        tileHeight?: number
        maximumCacheSize?: number
        /**
         * 是否插值
         */
        interpolate?: boolean
        isoLine?: boolean
        lineColor?: string
        lineWidth?: number
        /**
         *  是否显示点
         */
        point?: boolean
        pointColor?: Cesium.Color | string
        pointSize?: number
        /**
         *  是否显原始数据点数值
         */
        value?: boolean
        /**
         *  原始数据点数值显示颜色
         */
        valueColor?: Cesium.Color
        valueBackColor?: Cesium.Color
        valueStrokeColor?: Cesium.Color
        /**
         * 是否显原始数据点数值 
         */
        valueStroke?: boolean
        valueStrokeWidth?: number
        valueFontSize?: number
        valueFontFamily?: string
        valuePadding?: number
        /**
         *  是否显原始数据点数值
         */
        isoValue?: boolean
        /**
         * 原始数据点数值显示颜色
         */
        isoValueColor?: Cesium.Color
        isoValueBackColor?: Cesium.Color
        isoValueStrokeColor?: Cesium.Color
        /**
         *  是否显原始数据点数值 
         */
        isoValueStroke: boolean
        isoValueStrokeWidth?: number
        isoValueFontSize?: number
        isoValueFontFamily?: string
        isoValuePadding?: number
        maximumPointDensity?: number
        pointDensity?: number
        /**
         * ='single'|"fillColor"
         */
        lineColorType?: string
        /**
         *  大于该级别时不进行抽稀处理
         */
        maxSamplePointLevel: number
        beforeDrawPoint: (

            context: HTMLCanvas2DContext,
            args: {
                scalarValue: number
                vectorValue: number
                x: number
                y: number
                lon: number
                lat: number
                cancel: boolean
            }
        ) => void
        /**
         *  裁剪图层 
         */
        clipperLayer?: VectorTileImageryProvider

    })
    ds: Data.RasterDataset
} 