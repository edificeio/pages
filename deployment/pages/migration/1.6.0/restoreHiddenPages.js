//===Measure utils
var startTime, endTime;
function startMeasure(name) {
    print("event;start measuring;" + name);
    startTime = new Date();
}
function endMeasure(name) {
    endTime = new Date();
    var timeDiffMs = endTime - startTime; //in ms
    var timeDiffSeconds = (timeDiffMs / 1000);
    var timeDiffMinutes = timeDiffSeconds / 60;
    var seconds = Math.round(timeDiffSeconds);
    var minutes = Math.round(timeDiffMinutes);
    print("event;end measuring:" + minutes + " minutes (" + seconds + "seconds);" + name);
}
//===Filter
Array.prototype.es5Filter = function(callback, context) {
    var arr = [];
    for (var i = 0; i < this.length; i++) {
        if (callback.call(context, this[i], i, this))
            arr.push(this[i]);
    }
    return arr;
};
//
var PAGES_COLLECTION = "pages";
var FOLDER_COLLECTION = "pagesFolders";
var reports = [];
startMeasure("all")
db[FOLDER_COLLECTION].find({trashed:true}).forEach(function (folder) {
    var toRemove = []
    db[PAGES_COLLECTION].find({"_id":{$in:folder.websitesIds}, shared:{$exists: true, $not: {$size: 0}}}).forEach(function(doc){
        toRemove.push(doc._id)
    })
    if(toRemove.length>0){
        var websitesIds = folder.websitesIds.es5Filter(function(value,index){
            return toRemove.indexOf(value) == -1;
        })
        //set
        var update = { '$set': {} }
        update["$set"]["websitesIds"] = websitesIds;
        db[FOLDER_COLLECTION].update({ _id: folder._id }, update)
        reports.push({
            skip:false,
            websiteBefore: folder.websitesIds.length,
            websiteAfter: websitesIds.length,
            folderId: folder._id,
            removed: JSON.stringify(websitesIds)
        })
    }else{
        reports.push({skip:true, folderId: folder._id})
    }
});
//
endMeasure("all")
//
print("start report")
print("skip;folderId;websiteBefore;websiteAfter;removed")
reports.forEach(function(report){
    print(report.skip + ";" + report.folderId + ";" + report.websiteBefore+ ";" + report.websiteAfter+ ";" + report.removed)
})
print("end report")