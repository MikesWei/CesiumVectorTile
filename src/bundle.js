/**
 * 功能：打包并压缩到dist文件夹。打包结果文件包含：
 * --CesiumVectorTile.js 
 * --CesiumVectorTile.js.map
 * --CesiumVectorTile.min.js
 * --CesiumVectorTile.min.js.map
 */

var browserify = require('browserify')
    , path = require('path')
    , fs = require('fs')
    , exorcist = require('exorcist')
    , basePath = '../'
    , entryFile = './src/index-standalone.js'
    , distFile = path.join(__dirname, basePath, 'dist/CesiumVectorTile.js')
    , distFile4doc = path.join(__dirname, basePath, 'dist/CesiumVectorTile.pure.js')
    , distMinFile = path.join(__dirname, basePath, 'dist/CesiumVectorTile.min.js')
    , mapfile = path.join(__dirname, basePath, 'dist/CesiumVectorTile.js.map')
    , minMapfile = path.join(__dirname, basePath, 'dist/CesiumVectorTile.min.js.map');

function bundleMain() {
    var dir=path.join(__dirname, basePath,'dist');
    if(!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    browserify(entryFile, {
        debug: true,
        standalone: "CesiumVectorTile",
        basedir: './'
        //false则不包含外部node_modules中的依赖项，在使用jsdoc导出注释文档时需要设置剔除依赖项，只导出MeteoLib库的注释
        //, bundleExternal: false
    })
    .bundle()
    .pipe(exorcist(mapfile))
    .pipe(fs.createWriteStream(distFile, 'utf8'))
    .on('close', function (err) {
  
        var UglifyJS = require('uglify-js')
        var result = UglifyJS.minify(distFile, {
            inSourceMap: mapfile,
            outSourceMap: path.basename(minMapfile)
        });
        if (result.error) {
            console.trace(result.error)
        } else {
            fs.writeFileSync(distMinFile, result.code);
            fs.writeFileSync(minMapfile, result.map);
        }

        buildDoc();

    })
}


/**
 * 生成文档
 */
function buildDoc() {
    var dir=path.join(__dirname, basePath,'dist');
    if(!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    browserify(entryFile, {
        debug: false,
        standalone: "CesiumVectorTile",
        basedir: './',
        bundleExternal: false
    })
        .bundle()
        .pipe(fs.createWriteStream(distFile4doc, 'utf8'))
        .on('close', function (err) {

            var str = fs.readFileSync(entryFile, {
                encoding: 'utf8'
            });
            str = str.substr(0, str.indexOf('var CesiumVectorTile'))
            str = Buffer.from(str, 'utf8');
            str = Buffer.concat([str, fs.readFileSync(distFile4doc)]);
            fs.writeFileSync(distFile4doc, str);

            // var child_process = require('child_process');
            // child_process.execSync('jsdoc ' + distFile4doc + ' -d ./doc -t v2/doc-templates/default');
            // fs.unlinkSync(distFile4doc);
        })
}

bundleMain();
// buildDoc();