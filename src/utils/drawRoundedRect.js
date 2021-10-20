
function Rect(x, y, w, h) {
    return { x: x, y: y, width: w, height: h };
}

var Point = function (x, y) {
    return { x: x, y: y };
}
/**
 *
* @memberof Cesium.Util
* @method
* @name drawRoundedRect
 * @param {Object} rect
 * @param {Number} radius
 * @param {CanvasRenderingContext2D} context2d
 */
function drawRoundedRect(rect, r, ctx) {
    var ptA = Point(rect.x + r, rect.y);
    var ptB = Point(rect.x + rect.width, rect.y);
    var ptC = Point(rect.x + rect.width, rect.y + rect.height);
    var ptD = Point(rect.x, rect.y + rect.height);
    var ptE = Point(rect.x, rect.y);

    ctx.beginPath();

    ctx.moveTo(ptA.x, ptA.y);
    ctx.arcTo(ptB.x, ptB.y, ptC.x, ptC.y, r);
    ctx.arcTo(ptC.x, ptC.y, ptD.x, ptD.y, r);
    ctx.arcTo(ptD.x, ptD.y, ptE.x, ptE.y, r);
    ctx.arcTo(ptE.x, ptE.y, ptA.x, ptA.y, r);


    ctx.fill();
    ctx.stroke();
}

module.exports = drawRoundedRect;