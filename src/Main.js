define([
    'VectorRenderer/VectorLayer',
    'VectorRenderer/VectorRenderer',
    'VectorRenderer/VectorStyle',
    'VectorTileImageryProvider/VectorTileImageryProvider',
    'Util/turf'
], function (
    VectorLayer,
    VectorRenderer,
    VectorStyle,
    VectorTileImageryProvider,
    turf
    ) {

    if (typeof window !== 'undefined' && !window.Cesium) {
        window.Cesium = {};
    } else if (typeof global !== 'undefined' && !global.Cesium) {
        global.Cesium = {};
    }
    Cesium.VectorRenderer = VectorRenderer;
    Cesium.VectorTileImageryProvider = VectorTileImageryProvider;
    Cesium.VectorLayer = VectorLayer;
    Cesium.VectorStyle = VectorStyle;
    Cesium.turf = turf;

    if (Cesium.ImageryLayerCollection) {

        /**
       * 根据zIndex属性调整图层顺序
       * @method orderByZIndex
       * @name orderByZIndex
       * @memberof Cesium.ImageryLayerCollection
       */

        Cesium.ImageryLayerCollection.prototype.orderByZIndex = function () {
            //调整带有index的图层顺序
            var layersHasIndex = [];
            for (var i = 0; i < this.length; i++) {
                var l = this.get(i);
                if ((l.imageryProvider.zIndex || l.zIndex)) {
                    layersHasIndex.push(l);
                    if (!l.zIndex) {
                        l.zIndex = l.imageryProvider.zIndex;
                    } else if (!l.imageryProvider.zIndex) {
                        l.imageryProvider.zIndex = l.zIndex;
                    }
                }
            }
            if (layersHasIndex && layersHasIndex.length) {
                layersHasIndex.sort(function (a, b) {
                    if (a.zIndex > b.zIndex) {
                        return 1;
                    } else if (a.zIndex < b.zIndex) {
                        return -1;
                    }
                    else {
                        return 0;
                    }
                })
            }
            var that = this;
            layersHasIndex.forEach(function (l) {
                that.raiseToTop(l);
            });

            for (var i = 0; i < this.length; i++) {
                var l = this.get(i);
                //调整矢量图层顺序
                if (!Cesium.defined(l.imageryProvider.zIndex)
                    && !Cesium.defined(l.zIndex)
                    && l.imageryProvider instanceof VectorTileImageryProvider) {
                    this.raiseToTop(l);
                }
            }

            for (var i = 0; i < this.length; i++) {
                var l = this.get(i);
                //调整矢量图层顺序
                if (!Cesium.defined(l.imageryProvider.zIndex)
                     && !Cesium.defined(l.zIndex)
                     && l.imageryProvider instanceof VectorTileImageryProvider
                    && (l.imageryProvider._lineOnly || l.imageryProvider._onlyPoint)) {
                    this.raiseToTop(l);
                }
            }
        }

    }
    return Cesium;
})