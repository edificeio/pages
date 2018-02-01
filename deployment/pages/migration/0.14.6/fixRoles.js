db.pages.find({"published" : {"$exists" : true}}, {"_id":1,"published":1}).forEach(function(page) {
    var s = page.published;
    var update = false;
    //print(page);
    var publishKeys = Object.keys(s);
    for (var i = 0; i < publishKeys.length; i++) {
        var groups = s[publishKeys[i]].groups;
        for (var j = 0; j < groups.length; j++) {
            //print(groups[j].roles);
            var roles = groups[j].roles;
            for (var k = 0; k < roles.length; k++) {
                if (typeof roles[k] === 'object') {
                    //print(typeof roles[k] === 'object');
                    var rolesKeys = Object.keys(roles[k]);
                    update = true;
                    var roleId = "";
                    for (var l = 0; l < rolesKeys.length; l++) {
                        roleId += roles[k][rolesKeys[l]];
                        //print(roleId);
                    }
                    roles[k] = roleId;
                }
            }
        }
    }

    if (update) {
        //print(page._id);
        db.pages.update({"_id" :page._id}, { $set : { "published" : s}});
    }
});