var appConfig = {
    BaseURL: "./" 
}

if (typeof window == 'undefined') {
    window = self;
}
window.CESIUM_BASE_URL = appConfig.BaseURL + "ThirdParty/Cesium/";
if (typeof define === "function") {
    define(function () {
        return appConfig;
    });
} else if (typeof module === "undefined") {

} else {
    module.exports = appConfig;
}
window.appConfig = appConfig;