var defaultValue=require('./defaultValue');
var getStringFromTypedArray=require('./getStringFromTypedArray');

    'use strict';

    /**
     * @private
     */
    function getMagic(uint8Array, byteOffset) {
        byteOffset = defaultValue(byteOffset, 0);
        return getStringFromTypedArray(uint8Array, byteOffset, Math.min(4, uint8Array.length));
    }

    module.exports= getMagic;
