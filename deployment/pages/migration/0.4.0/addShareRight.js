db.pages.find({"shared.fr-wseduc-pages-controllers-PagesController|delete" : true}, {"_id":1, "shared":1}).forEach(function(pages) {
  var s = pages.shared;
  for (var i = 0; i < s.length; i++) {
    if (s[i]["fr-wseduc-pages-controllers-PagesController|delete"] === true) {
      s[i]["fr-wseduc-pages-controllers-PagesController|shareSubmit"] = true;
      s[i]["fr-wseduc-pages-controllers-PagesController|share"] = true;
      s[i]["fr-wseduc-pages-controllers-PagesController|removeShare"] = true;
    }
  }
  db.pages.update({"_id" : pages._id}, { $set : { "shared" : s}});
});
