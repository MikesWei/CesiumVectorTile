define(function () {
    /**
     *
     *@param {Object} options
     *@param {Cesium.Color}[options.outlineColor=Cesium.Color.YELLOW] 线或边颜色，仅线、面数据有效。
     *@param {Cesium.Color}[options.fillColor=Cesium.Color.fromBytes(0, 255, 255, 30)] 填充颜色，仅面数据有效。
     *@param {Number}[options.lineWidth=1.5] 线宽，仅线数据有效。
     *@param {Boolean}[options.outline=true] 是否显示边，仅面数据有效。
     *@param {Boolean}[options.fill=true] 是否填充，仅面数据有效。
     *@param {Boolean}[options.fontColor=Cesium.Color.BLACK] 注记文本颜色
     *@param {Boolean}[options.fontSize=16] 注记文本字体大小，仅在数据有点时有效。
     *@param {Boolean}[options.fontFamily="宋体"] 注记文本字体名称，仅在数据有点时有效。
     *@param {Boolean}[options.pointSize=4] 注记点大小，仅在数据有点时有效。
     *@param {Boolean}[options.pointColor=Cesium.Color.YELLOW] 注记点颜色，仅在数据有点时有效。
     *@param {Boolean}[options.labelPropertyName='NAME'] 注记文本属性名称，仅在数据有点时有效。
     *@param {String}[options.makerImage=undefined] 注记点图标，如果设置点图标，则其他点样式参数无效，仅在数据有点时有效。
     *@param {Boolean}[options.ringRadius=2] 注记点样式为Ring时，圆心点大小（半径），仅在数据有点时有效。
     *@param {String}[options.pointStyle='Ring'] 注记点样式，仅在数据有点时有效。'Solid'为实心圆,'Ring'为带圆心的圆形,'Circle'为空心圆
     *@param {Boolean}[options.circleLineWidth=2] 注记点样式为Circle时，圆形线宽
     *@param {Boolean}[options.showMaker=true] 是否显示注记点，仅在数据有点时有效。
     *@param {Boolean}[options.showLabel=true] 是否显示文本，仅在数据有点时有效。
     *@param {Boolean}[options.labelOffsetX=10] 标注文本x方向偏移量，仅在数据有点时有效。以屏幕为参考，左上角为0，向右为正，单位为像素
     *@param {Boolean}[options.labelOffsetY=5] 标注文本y方向偏移量，仅在数据有点时有效。以屏幕为参考，左上角为0，向下为正，单位为像素 
     *@memberof Cesium
     *@constructor 
     */
    function VectorStyle(options) {
        options = Cesium.defaultValue(options, Cesium.defaultValue.EMPTY_OBJECT);
        //面样式
        this.fillColor = Cesium.defaultValue(options.fillColor, Cesium.Color.fromBytes(0, 255, 255, 30));
        if (typeof this.fillColor == 'string') {
            this.fillColor = Cesium.Color.fromCssColorString(this.fillColor);
        }
        this.fill = Cesium.defaultValue(options.fill, true);

        //线样式
        this.outlineColor = Cesium.defaultValue(options.outlineColor, Cesium.Color.YELLOW);
        if (typeof this.outlineColor == 'string') {
            this.outlineColor = Cesium.Color.fromCssColorString(this.outlineColor);
        }

        this.lineWidth = Cesium.defaultValue(options.lineWidth, 1.5);
        this.outline = Cesium.defaultValue(options.outline, true);

        //注记样式
        this.fontColor = Cesium.defaultValue(options.fontColor, Cesium.Color.BLACK);
        if (typeof this.fontColor == 'string') {
            this.fontColor = Cesium.Color.fromCssColorString(this.fontColor);
        }

        this.fontSize = Cesium.defaultValue(options.fontSize, 16);
        this.fontFamily = Cesium.defaultValue(options.fontFamily, "宋体");
        this.pointSize = Cesium.defaultValue(options.pointSize, 4);
        this.pointColor = Cesium.defaultValue(options.pointColor, Cesium.Color.YELLOW);
        if (typeof this.pointColor == 'string') {
            this.pointColor = Cesium.Color.fromCssColorString(this.pointColor);
        }

        this.pointStyle = Cesium.defaultValue(options.pointStyle, 'Ring');//'Solid','Ring','Circle'
        this.labelPropertyName = Cesium.defaultValue(options.labelPropertyName, 'NAME');
        this.ringRadius = Cesium.defaultValue(options.ringRadius, 2);
        this.circleLineWidth = Cesium.defaultValue(options.circleLineWidth, 2);
        this.showMaker = Cesium.defaultValue(options.showMaker, true);
        this.showLabel = Cesium.defaultValue(options.showLabel, true);
        this.labelOffsetX = Cesium.defaultValue(options.labelOffsetX, 0);
        this.labelOffsetY = Cesium.defaultValue(options.labelOffsetY, 0);
        this.makerImage = options.makerImage;
        this.makerImageEl = null;
        var makerImagePromise = null;
        this.readyPromise = Cesium.when.defer();
        var that = this;
        if (typeof this.makerImage == 'string') {

            var image = new Image();
            image.onload = function () {
                that.makerImageEl = this;
                that.readyPromise.resolve(true);
            }
            image.onerror = function (err) {
                that.readyPromise.reject(err);
            }
            image.src = this.makerImage;
        } else {
            if (this.makerImage instanceof Image) {
                this.makerImageEl = this.makerImage;
            }
            setTimeout(function () {
                  
                that.readyPromise.resolve(true);
            }, 10)
        }

    }

    /**
    *
    *@return {Cesium.VectorStyle}
    */
    VectorStyle.prototype.clone = function () {
        var style = new VectorStyle();
        for (var i in this) {

            if (this.hasOwnProperty(i)) {
                if (this[i] instanceof Cesium.Color) {
                    style[i] = Cesium.Color.clone(this[i]);
                } else {
                    style[i] = this[i];
                }
            }
        }
        return style;
    }

    /**
    *
    *@type {Cesium.VectorStyle}
    */
    VectorStyle.Default = new VectorStyle();

    return VectorStyle;
})