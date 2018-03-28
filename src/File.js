/**
*
*@param {File|Blob}fileOrBlob
*@return {Promise.<ArrayBuffer>}
*/
File.readAsArrayBuffer = function (file) {
    var promise = Cesium.when.defer();
    var fr = new FileReader();
    fr.onload = function (e) {
        promise.resolve(e.target.result);
    }
    fr.onprogress = function (e) {
        promise.progress(e.target.result);
    }
    fr.onerror = function (e) {
        promise.reject(e.error);
    }
    fr.readAsArrayBuffer(file);
    return promise;
}
/**
*
*@param {File|Blob}fileOrBlob
*@return {Promise.<String>}
*/
File.readAsText = function (file) {
    var promise = Cesium.when.defer();
    var fr = new FileReader();
    fr.onload = function (e) {
        promise.resolve(e.target.result);
    }
    fr.onprogress = function (e) {
        promise.progress(e.target.result);
    }
    fr.onerror = function (e) {
        promise.reject(e.error);
    }
    fr.readAsText(file);
    return promise;
}
/**
*
*@param {File|Blob}fileOrBlob
*@return {Promise.<String>}
*/
File.readAllText = File.readAsText;
/**
*
*@param {File|Blob}fileOrBlob
*@return {Promise.<String>}
*/
File.ReadAllText = File.readAsText;
/**
*
*@param {File|Blob}fileOrBlob
*@return {Promise.<Uint8Array>}
*/
File.readAllBytes = function (file) {
    var promise = Cesium.when.defer();
    var fr = new FileReader();
    fr.onload = function (e) {
        promise.resolve(new Uint8Array(e.target.result));
    }
    fr.onprogress = function (e) {
        promise.progress(e.target.result);
    }
    fr.onerror = function (e) {
        promise.reject(e.error);
    }
    fr.readAsArrayBuffer(file);
    return promise;
}
/**
*
*@param {File|Blob}fileOrBlob
*@return {Promise.<Uint8Array>}
*/
File.ReadAllBytes = File.readAllBytes;
/**
*
*@param {File|Blob}fileOrBlob
*@return {Promise.<String>}
*/
File.readAsBinaryString = function (file) {
    var promise = Cesium.when.defer();
    var fr = new FileReader();
    fr.onload = function (e) {
        promise.resolve(e.target.result);
    }
    fr.onprogress = function (e) {
        promise.progress(e.target.result);
    }
    fr.onerror = function (e) {
        promise.reject(e.error);
    }
    fr.readAsBinaryString(file);
    return promise;
}
/**
*
*@param {File|Blob}fileOrBlob
*@return {Promise.<String>}
*/
File.readAsDataURL = function (file) {
    var promise = Cesium.when.defer();
    var fr = new FileReader();
    fr.onload = function (e) {
        promise.resolve(e.target.result);
    }
    fr.onprogress = function (e) {
        promise.progress(e.target.result);
    }
    fr.onerror = function (e) {
        promise.reject(e.error);
    }
    fr.readAsDataURL(file);
    return promise;
}