
function readAsText(file, onProgress) {
    return new Promise(function (resolve, reject) {
        var fr = new FileReader();
        fr.onload = function (e) {
            resolve(e.target.result);
        }
        fr.onprogress = function (e) {
            if (onProgress) onProgress(e.target.result);
        }
        fr.onerror = function (e) {
            reject(e.error);
        }
        fr.readAsText(file);
    })
}
module.exports = readAsText;