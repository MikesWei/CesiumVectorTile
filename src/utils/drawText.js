
var drawRoundedRect = require('./drawRoundedRect');
var writeTextToCanvas=require('../cesium/Core/writeTextToCanvas');

/**
* Writes the given text into a new canvas.  The canvas will be sized to fit the text.
* If text is blank, returns undefined.
* - 依赖Cesium.writeTextToCanvas
* @memberof Cesium.Util
* @method
* @name drawText
* @param {String} text The text to write.
* @param {Object} [options] Object with the following properties:
* @param {String} [options.font='10px sans-serif'] The CSS font to use.
* @param {String} [options.textBaseline='bottom'] The baseline of the text.
* @param {Boolean} [options.fill=true] Whether to fill the text.
* @param {Boolean} [options.stroke=false] Whether to stroke the text.
* @param {Color} [options.fillColor=Cesium.Color.WHITE] The fill color.
* @param {Color} [options.strokeColor=Cesium.Color.BLACK] The stroke color.
* @param {Number} [options.strokeWidth=1] The stroke width.
* @param {Color} [options.backgroundColor=Cesium.Color.TRANSPARENT] The background color of the canvas.
* @param {Number} [options.padding=0] The pixel size of the padding to add around the text.
* @returns {Canvas} A new canvas with the given text drawn into it.  The dimensions object
*                   from measureText will also be added to the returned canvas. If text is
*                   blank, returns undefined.
*@example
    var opts={
        font:'10px sans-serif',
        textBaseline:'bottom',
        fill:true,
        stroke:false,
        strokeWidth:1,
        fillColor:Cesium.Color.WHITE,
        strokeColor:Cesium.Color.BLACK,
        backgroundColor:Cesium.Color.TRANSPARENT,
        padding:0
    };
    var textCanvas=drawText('hello world',opts)
*            
*/
function drawText(text, options) {
    options = options ? options : {
        font: "20px sans-serif"
    };
    var backcolor = options.backgroundColor;
    var padding = options.padding ? options.padding : 0;
    delete options.backgroundColor;
    delete options.padding;

    var lines = text.split(/[\r]?\n+/);
    var lineImgs = [];
    var w = 0, h = 0;
    for (var i = 0; i < lines.length; i++) {
        var tempCv = writeTextToCanvas(lines[i], options)
        if (tempCv) {
            lineImgs.push(tempCv);
            h += tempCv.height;
            w = Math.max(w, tempCv.width);
        }
    }
    options.backgroundColor = backcolor;
    options.padding = padding;

    var cv = options.canvas;
    if (!cv) {
        w += padding * 2;
        h += padding * 2.25;
        cv = document.createElement("canvas");
        cv.width = w;
        cv.height = h;
    }

    var ctx = cv.getContext("2d");
    if (backcolor) {
        ctx.fillStyle = backcolor.toCssColorString();
    } else {
        ctx.fillStyle = undefined;
    }

    if (options.border) {
        ctx.lineWidth = options.borderWidth;
        ctx.strokeStyle = options.borderColor.toCssColorString();
    }

    if (!options.borderRadius) {
        if (backcolor) {
            ctx.fillRect(0, 0, cv.width, cv.height);
        }

        if (options.border) {
            ctx.strokeRect(0, 0, cv.width, cv.height);
        }
    } else {
        drawRoundedRect({
            x: 0, y: 0, width: cv.width, height: cv.height
        }, options.borderRadius, ctx);
    }

    delete ctx.strokeStyle;
    delete ctx.fillStyle;
    var y = 0;
    for (var i = 0; i < lineImgs.length; i++) {
        ctx.drawImage(lineImgs[i], 0 + padding, y + padding);
        y += lineImgs[i].height;
    }
    return cv;
}

module.exports = drawText; 