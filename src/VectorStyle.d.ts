export= VectorStyle;
/**
         * 矢量切片图层样式
         */
declare class VectorStyle {
    /**
     *
     *@param {Object} options
     *@param {Cesium.Color|String}[options.outlineColor=Cesium.Color.YELLOW] 线或边颜色，仅线、面数据有效。
     *@param {Cesium.Color|String}[options.fillColor=Cesium.Color.fromBytes(0, 255, 255, 30)] 填充颜色，仅面数据有效。
     *@param {Cesium.Color|String}[options.backgroundColor] 背景色
     *@param {Number}[options.lineWidth=1.5] 线宽，仅线数据有效。
     *@param {Boolean}[options.outline=true] 是否显示边，仅面数据有效。
     *@param {Boolean}[options.fill=true] 是否填充，仅面数据有效。
     *@param {Cesium.Color|String}[options.fontColor=Cesium.Color.BLACK] 注记文本颜色
     *@param {Number}[options.fontSize=16] 注记文本字体大小，仅在数据有点时有效。
     *@param {String}[options.fontFamily="宋体"] 注记文本字体名称，仅在数据有点时有效。
     *@param {Boolean}[options.labelStroke] 是否显示注记文本轮廓线，仅在数据有点时有效。
     *@param {String}[options.labelStrokeWidth=1] 注记文本轮廓线宽，仅在数据有点时有效。
     *@param {Cesium.Color|String}[options.labelStrokeColor] 注记文本轮廓线颜色，仅在数据有点时有效。
     * 
     *@param {Number}[options.pointSize=4] 注记点大小，仅在数据有点时有效。
     *@param {Cesium.Color|String}[options.pointColor=Cesium.Color.YELLOW] 注记点颜色，仅在数据有点时有效。
     *@param {String}[options.labelPropertyName='NAME'] 注记文本属性名称，仅在数据有点时有效。
     *@param {String}[options.makerImage=undefined] 注记点图标，如果设置点图标，则其他点样式参数无效，仅在数据有点时有效。
     *@param {Number}[options.ringRadius=2] 注记点样式为Ring时，圆心点大小（半径），仅在数据有点时有效。
     *@param {String}[options.pointStyle='Ring'] 注记点样式，仅在数据有点时有效。'Solid'为实心圆,'Ring'为带圆心的圆形,'Circle'为空心圆
     *@param {Number}[options.circleLineWidth=2] 注记点样式为Circle时，圆形线宽
     *@param {Boolean}[options.showMarker=true] 是否显示注记点，仅在数据有点时有效。
     *@param {Boolean}[options.showLabel=true] 是否显示文本，仅在数据有点时有效。
     *@param {Boolean}[options.showCenterLabel=true] 是否显示文本，仅对线和面数据有效。
     *@param {String}[options.centerLabelPropertyName] 几何中心注记文本属性名称，仅对线和面数据有效。
     *@param {Number}[options.labelOffsetX=10] 标注文本x方向偏移量，仅在数据有点时有效。以屏幕为参考，左上角为0，向右为正，单位为像素
     *@param {Number}[options.labelOffsetY=5] 标注文本y方向偏移量，仅在数据有点时有效。以屏幕为参考，左上角为0，向下为正，单位为像素 
     *@param {Array.<Number>}[options.lineDash=undefined] 虚线样式，不设置则为实线
     *@param {String}[options.lineCap="butt"] 设置线条末端线帽的样式。 butt——默认。向线条的每个末端添加平直的边缘；round——向线条的每个末端添加圆形线帽；square——向线条的每个末端添加正方形线帽。
     *@param {String}[options.shadowColor=undefined] 设置用于阴影的颜色
     *@param {Number}[options.shadowBlur=undefined] 设置用于阴影的模糊级别
     *@param {Number}[options.shadowOffsetX=undefined] 设置阴影距形状的水平距离
     *@param {Number}[options.shadowOffsetY=undefined] 设置阴影距形状的垂直距离
     *@param {String}[options.lineJoin="miter"] 设置当两条线交汇时所创建边角的类型。bevel——斜角；round——创建圆角；miter——默认。创建尖角。
     *@param {Number}[options.miterLimit=10] 设置最大斜接长度。 
     */
    constructor(options: {

        /**
         * 线或边颜色，仅线、面数据有效。
         * @default Cesium.Color.YELLOW
         */
        outlineColor: Cesium.Color | String
        /**
         * 填充颜色，仅面数据有效。
         * @default Cesium.Color.fromBytes(0, 255, 255, 30)
         */
        fillColor: Cesium.Color | String
        /**
         * 背景色
         */
        backgroundColor: Cesium.Color | String
        /**
         * 线宽，仅线数据有效。
         * @default 1.5
         */
        lineWidth: number

        /**
         * 是否显示边，仅面数据有效。
         * @default true
         */
        outline: boolean
        /**
         * 是否填充，仅面数据有效。
             * @default true
         */
        fill: boolean;
        /**
         * =Cesium.Color.BLACK]注记文本颜色
         * @default  
         */
        fontColor: string;
         /**
         * 注记文本字体大小,仅在数据有点时有效。
         */
        fontSize: number;
        /**
         * 注记文本字体名称，仅在数据有点时有效。
         * @default  "宋体"
         */
        fontFamily?: string;

        /**
         * 是否显示注记文本轮廓线，仅在数据有点时有效。
         */
        labelStroke: boolean;
        /**
         * 注记文本轮廓线宽，仅在数据有点时有效。
         * @default 1
         */
        labelStrokeWidth: number;
        /**
         *  注记文本轮廓线颜色，仅在数据有点时有效。
         */
        labelStrokeColor: string;

        /**
         *  =4] 注记点大小，仅在数据有点时有效。
         */
        pointSize: number;

        /**
         * =Cesium.Color.YELLOW] 注记点颜色，仅在数据有点时有效。
         */
        pointColor: string;
        /**
         * ='NAME'] 注记文本属性名称，仅在数据有点时有效。
         */
        labelPropertyName: string;
        /**
         *  注记点图标，如果设置点图标，则其他点样式参数无效，仅在数据有点时有效。
         */
        makerImage: string;
        /**
         * =2] 注记点样式为Ring时，圆心点大小（半径），仅在数据有点时有效。
         */
        ringRadius: number
        /**
         * ='Ring'] 注记点样式，仅在数据有点时有效。'Solid'为实心圆,'Ring'为带圆心的圆形,'Circle'为空心圆
         */
        pointStyle: string;
        /**
         * =2] 注记点样式为Circle时，圆形线宽
         */
        circleLineWidth: number;
        /**
         * =true] 是否显示注记点，仅在数据有点时有效。
         */
        showMarker: boolean;
        /**
         * =true] 是否显示文本，仅在数据有点时有效。
         */
        showLabel: boolean;
        /**
         * =true] 是否显示文本，仅对线和面数据有效。
         */
        showCenterLabel: boolean;
        /**
         *  几何中心注记文本属性名称，仅对线和面数据有效。
         */
        centerLabelPropertyName: string;
        /**
         * =10] 标注文本x方向偏移量，仅在数据有点时有效。以屏幕为参考，左上角为0，向右为正，单位为像素
         */
        labelOffsetX: number;
        /**
         * =5] 标注文本y方向偏移量，仅在数据有点时有效。以屏幕为参考，左上角为0，向下为正，单位为像素 
         */
        labelOffsetY: number;
        /**
         *  虚线样式，不设置则为实线
         */
        lineDash: number[];
        /**
         * ="butt"] 设置线条末端线帽的样式。 butt——默认。向线条的每个末端添加平直的边缘；round——向线条的每个末端添加圆形线帽；square——向线条的每个末端添加正方形线帽。
         */
        lineCap: string;
        /**
         *  设置用于阴影的颜色
         */
        shadowColor: Cesium.Color | string
        /**
         * 设置用于阴影的模糊级别
         */
        shadowBlur: number
        /**
         * 设置阴影距形状的水平距离
         */
        shadowOffsetX: number
        /**
         * 设置阴影距形状的垂直距离
         */
        shadowOffsetY: number
        /**
         * ="miter"] 设置当两条线交汇时所创建边角的类型。bevel——斜角；round——创建圆角；miter——默认。创建尖角。
         */
        lineJoin: string
        /**
         * =10] 设置最大斜接长度。
         */
        miterLimit: number
    })
    /**
         * 线或边颜色，仅线、面数据有效。
         * @default Cesium.Color.YELLOW
         */
        outlineColor: Cesium.Color | String
        /**
         * 填充颜色，仅面数据有效。
         * @default Cesium.Color.fromBytes(0, 255, 255, 30)
         */
        fillColor: Cesium.Color | String
        /**
         * 背景色
         */
        backgroundColor: Cesium.Color | String
        /**
         * 线宽，仅线数据有效。
         * @default 1.5
         */
        lineWidth: number

        /**
         * 是否显示边，仅面数据有效。
         * @default true
         */
        outline: boolean
        /**
         * 是否填充，仅面数据有效。
             * @default true
         */
        fill: boolean;
        /**
         * =Cesium.Color.BLACK]注记文本颜色
         * @default  
         */
        fontColor: string;
        /**
        * 注记文本字体大小,仅在数据有点时有效。
        */
        fontSize: number;
        /**
         * 注记文本字体名称，仅在数据有点时有效。
         * @default  "宋体"
         */
        fontFamily?: string;

        /**
         * 是否显示注记文本轮廓线，仅在数据有点时有效。
         */
        labelStroke: boolean;
        /**
         * 注记文本轮廓线宽，仅在数据有点时有效。
         * @default 1
         */
        labelStrokeWidth: number;
        /**
         *  注记文本轮廓线颜色，仅在数据有点时有效。
         */
        labelStrokeColor: string;

        /**
         *  =4] 注记点大小，仅在数据有点时有效。
         */
        pointSize: number;

        /**
         * =Cesium.Color.YELLOW] 注记点颜色，仅在数据有点时有效。
         */
        pointColor: string;
        /**
         * ='NAME'] 注记文本属性名称，仅在数据有点时有效。
         */
        labelPropertyName: string;
        /**
         *  注记点图标，如果设置点图标，则其他点样式参数无效，仅在数据有点时有效。
         */
        makerImage: string;
        /**
         * =2] 注记点样式为Ring时，圆心点大小（半径），仅在数据有点时有效。
         */
        ringRadius: number
        /**
         * ='Ring'] 注记点样式，仅在数据有点时有效。'Solid'为实心圆,'Ring'为带圆心的圆形,'Circle'为空心圆
         */
        pointStyle: string;
        /**
         * =2] 注记点样式为Circle时，圆形线宽
         */
        circleLineWidth: number;
        /**
         * =true] 是否显示注记点，仅在数据有点时有效。
         */
        showMarker: boolean;
        /**
         * =true] 是否显示文本，仅在数据有点时有效。
         */
        showLabel: boolean;
        /**
         * =true] 是否显示文本，仅对线和面数据有效。
         */
        showCenterLabel: boolean;
        /**
         *  几何中心注记文本属性名称，仅对线和面数据有效。
         */
        centerLabelPropertyName: string;
        /**
         * =10] 标注文本x方向偏移量，仅在数据有点时有效。以屏幕为参考，左上角为0，向右为正，单位为像素
         */
        labelOffsetX: number;
        /**
         * =5] 标注文本y方向偏移量，仅在数据有点时有效。以屏幕为参考，左上角为0，向下为正，单位为像素 
         */
        labelOffsetY: number;
        /**
         *  虚线样式，不设置则为实线
         */
        lineDash: number[];
        /**
         * ="butt"] 设置线条末端线帽的样式。 butt——默认。向线条的每个末端添加平直的边缘；round——向线条的每个末端添加圆形线帽；square——向线条的每个末端添加正方形线帽。
         */
        lineCap: string;
        /**
         *  设置用于阴影的颜色
         */
        shadowColor: Cesium.Color | string
        /**
         * 设置用于阴影的模糊级别
         */
        shadowBlur: number
        /**
         * 设置阴影距形状的水平距离
         */
        shadowOffsetX: number
        /**
         * 设置阴影距形状的垂直距离
         */
        shadowOffsetY: number
        /**
         * ="miter"] 设置当两条线交汇时所创建边角的类型。bevel——斜角；round——创建圆角；miter——默认。创建尖角。
         */
        lineJoin: string
        /**
         * =10] 设置最大斜接长度。
         */
        miterLimit: number
}