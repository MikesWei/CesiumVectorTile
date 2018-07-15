define([ 
     'ThirdParty/turf',
    'ThirdParty/TURFjs/turf-plugin',
], function ( 
    turf,
    turf2
    ) { 
    //turf.turfTaskProcessor = new Cesium.TaskProcessor('turfWorker', 2);
    //turf.turfTaskProcessor.execute = function (methodName,args) {
    //    return turf.turfTaskProcessor.scheduleTask({
    //        methodName: methodName,
    //        args: args
    //    });
    //}
    for (var i in turf2) {
        if (!turf[i]) {
            turf[i] = turf2[i];
        } 
    }
    return turf;
})