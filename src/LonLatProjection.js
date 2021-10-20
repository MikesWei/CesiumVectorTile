function LonLatProjection(width, height) {
    var imageSize = { width: width, height: height };
    function getBoundingRect(regions) {
        var LIMIT = Number.MAX_VALUE
        var min, max
        var boundingRect = { xMin: LIMIT, yMin: LIMIT, xMax: -LIMIT, yMax: -LIMIT }

        for (var i = 0, L = regions.length; i < L; i++) {
            var rect = regions[i].getBoundingRect()

            min = { x: rect.xMin, y: rect.yMin };
            max = { x: rect.xMax, y: rect.yMax }

            boundingRect.xMin = boundingRect.xMin < min.x ? boundingRect.xMin : min.x
            boundingRect.yMin = boundingRect.yMin < min.y ? boundingRect.yMin : min.y
            boundingRect.xMax = boundingRect.xMax > max.x ? boundingRect.xMax : max.x
            boundingRect.yMax = boundingRect.yMax > max.y ? boundingRect.yMax : max.y
        }

        return boundingRect
    }

    function project(coordinate, boundingRect) {
        var width = boundingRect.xMax - boundingRect.xMin;
        var height = boundingRect.yMin - boundingRect.yMax;
        var distanceX = Math.abs(coordinate[0] - boundingRect.xMin);
        var distanceY = coordinate[1] - boundingRect.yMax;

        var percentX = (distanceX / width);
        var percentY = (distanceY / height);

        var px = percentX * imageSize.width,
            py = percentY * imageSize.height;
        return { x: px, y: py };
    }

    function unproject(pt, boundingRect) {
        var width = boundingRect.xMax - boundingRect.xMin;
        var height = boundingRect.yMin - boundingRect.yMax;
        var lon = (pt.x / imageSize.width) * width,
            lat = (pt.y / imageSize.height) * height;
        return [lon, lat];
    }

    this.project = project;
    this.unproject = unproject;
    this.getBoundingRect = getBoundingRect;
}

module.exports = LonLatProjection;