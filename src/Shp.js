
var shp = require('shpjs/lib/index.js');
var readAsArrayBuffer = require('./utils/readAsArrayBuffer');
var readAsText = require('./utils/readAsText');
var Path = require('./utils/Path');

var Shp = Object.assign(shp, {
    groupFiles: function (files) {
        var group = {};
        for (var i = 0; i < files.length; i++) {
            var name = Path.ChangeExtension(files[i].name, "");
            if (!group[name]) {
                group[name] = [];
            }
            group[name].push(files[i]);
        }
        return group;
    },
    parseShpFiles: function (files, encoding) {
        if (!files || files.length > 0) {
            var shpFile, dbfFile, prjFile;
            for (var i = 0; i < files.length; i++) {
                if (files[i].name.toLocaleLowerCase().indexOf(".shp") > 0) {
                    shpFile = files[i];
                }
                if (files[i].name.toLocaleLowerCase().indexOf(".prj") > 0) {
                    prjFile = files[i];
                }
                if (files[i].name.toLocaleLowerCase().indexOf(".dbf") > 0) {
                    dbfFile = files[i];
                }
            }
            if (!shpFile || !prjFile || !dbfFile) {
                // throw new Error("打开文件失败,请通过ctrl+同时选择shp、prj、dbf三个文件");
                return Promise.reject(new Error("打开文件失败,请通过ctrl+同时选择shp、prj、dbf三个文件"));
            }

            return readAsArrayBuffer(shpFile).then(function (shpBuffer) {
                return readAsText(prjFile).then(function (prjBuffer) {
                    return readAsArrayBuffer(dbfFile).then(function (dbfBuffer) {
                        var parsed = shp.combine([shp.parseShp(shpBuffer, prjBuffer), shp.parseDbf(dbfBuffer, encoding)]);
                        parsed.fileName = shpFile.name.toLocaleLowerCase();
                        return parsed;
                    })
                })
            })
        } else {
            return Promise.reject(new Error("文件列表不能为空"));
        }
    }
});

module.exports = Shp;