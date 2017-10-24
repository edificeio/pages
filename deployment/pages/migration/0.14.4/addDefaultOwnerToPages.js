db.pages.find({}, {"_id":1, "owner":1, "pages":1}).forEach(function(website) {
    var pages = website.pages;
    for (var i = 0; i < pages.length; i++) {
        pages[i]["owner"] = website.owner.userId;
    }

    db.pages.update({"_id" : website._id}, { $set : { "pages" : pages}});
});