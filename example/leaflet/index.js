
var appConfig = {
    "Map": {
        "tiandituAppKey": "13a4ccbd53eb28f333121838937f7038",//天地图授权码
        "tiandituHostUsed": "tiandituHostPublic",//本系统使用的天地图地址
        "tiandituHostPublic": "//t0.tianditu.com",//天地图公网访问地址
        TianDiTu: {
            Normal: {
                Map: "https://t{s}.tianditu.gov.cn/vec_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk={token}",
                Annotion: "https://t{s}.tianditu.gov.cn/cva_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk={token}"
            },
            Satellite: {
                Map: "https://t{s}.tianditu.gov.cn/img_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk={token}",
                Annotion: "https://t{s}.tianditu.gov.cn/cia_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk={token}"
            },
            Terrain: {
                Map: "https://t{s}.tianditu.gov.cn/ter_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ter&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk={token}",
                Annotion: "https://t{s}.tianditu.gov.cn/cta_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cta&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk={token}"
            },
            Subdomains: ['0', '1', '2', '3', '4', '5', '6', '7']

        }
    }
}
//leaflet中使用,必须先引用leafletjs文件后引用MeteoLibjs文件
//VectorTileImageryLayer参数和MeteoLib.Scene.VectorTileImageryProvider的参数一样
var map = L.map('map', {
    crs: L.CRS.EPSG4326,
    zoom: 4,
    center: [30, 100]
})



L.tileLayer(appConfig.Map.TianDiTu.Normal.Map.replace(/{token}/g, appConfig.Map.tiandituAppKey), {
    subdomains: appConfig.Map.TianDiTu.Subdomains,
    zoomOffset: 1
}).addTo(map);
L.tileLayer(appConfig.Map.TianDiTu.Normal.Annotion.replace(/{token}/g, appConfig.Map.tiandituAppKey), {
    subdomains: appConfig.Map.TianDiTu.Subdomains,
    zoomOffset: 1
}).addTo(map);

var vectorTileImageryLayer = new L.VectorTileImageryLayer({
    zIndex: 1,
    source: "../../Assets/Data/json/china_province.geojson",
    defaultStyle: {
        fill: true
    }
})
vectorTileImageryLayer.addTo(map)