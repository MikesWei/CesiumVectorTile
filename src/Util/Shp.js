define([
    "ThirdParty/shapefile-js-3.3.2/shp",
    "ThirdParty/geojson-topojson/lib",
    'File'
], function (
    shp,
    topojson,
    FileExtend
) {
    /**
    * 提供shapefile格式矢量文件解析相关工具
    *@class  shp
    *@memberof MeteoLib.Util
    */

    /**
     *
     *@param {Array.<File>}files
     *@return {Object}
     * @method 
     * @name groupFiles
     * @static
     * @memberof MeteoLib.Util.shp
     */
    shp.groupFiles = function (files) {
        var shpFile, dbfFile, prjFile;
        var group = {};
        for (var i = 0; i < files.length; i++) {
            var name = Path.ChangeExtension(files[i].name, "");
            if (!group[name]) {
                group[name] = [];
            }
            group[name].push(files[i]);
        }
        return group;
    }
    /**
    *
    * @param {Array<File>}files
    * @param {Boolean}[toTopojson=false]
    * @method 
    * @name parseShpFiles
    * @static
    * @memberof MeteoLib.Util.shp
    */

    shp.parseShpFiles = function (files, toTopojson) {
        if (!files || files.length > 0) {
            var promise = Cesium.when.defer();

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
                throw new Error("打开文件失败,请通过ctrl+同时选择shp、prj、dbf三个文件");
                return;
            }
            var readPromises = [
                File.readAsArrayBuffer(shpFile),
                File.readAsText(prjFile),
                File.readAsArrayBuffer(dbfFile)
            ];
            Cesium.when.all(readPromises, function (buffers) {
                var shpBuffer = buffers[0];
                var prjBuffer = buffers[1];
                var dbfBuffer = buffers[2];

                var parsed = shp.combine([shp.parseShp(shpBuffer, prjBuffer), shp.parseDbf(dbfBuffer)]);
                parsed.fileName = shpFile.name.toLocaleLowerCase();
                if (toTopojson) {
                    parsed = topojson.topology({
                        collection: parsed
                    }, {
                        "property-transform": function (obj, name, value) {
                            obj[name] = value;
                            return obj;
                        }
                    });
                    parsed.fileName = shpFile.name.toLocaleLowerCase();
                }
                promise.resolve(parsed);

            }, function (err) {
                promise.reject(err);
            });

            return promise;
        } else {
            throw new Error("文件列表不能为空");
        }
    }

    return shp;
})