var pagesBehaviours = {

};

Behaviours.register('pages', {
	behaviours: pagesBehaviours,
	resource: function(resource){

	},
	workflow: function(){
	},
	resourceRights: function(){
	},
	search: function(searchText, callback){
		http().get('/pages/list/all').done(function(websites){

			var pages = [];
			websites.forEach(function(website){
				pages = pages.concat(_.map(website.pages, function(page){
					page.icon = website.icon;
					page.title = website.title + ' - ' + page.title;
					page.owner = website.owner.userId;
					page.ownerName = website.owner.displayName;
					page.website = { _id: website._id };
					return page;
				}));
			});

			callback(
				_.map(
					_.filter(pages, function(page){
						return lang.removeAccents(page.title).toLowerCase().indexOf(lang.removeAccents(searchText).toLowerCase()) !== -1 || page._id === searchText
					}),
					function(page){
						if(page.icon){
							page.icon = page.thumbnail + '?thumbnail=120x120'
						}
						else{
							page.thumbnail = '/img/illustrations/pages.png';
						}
						return {
							title: page.title,
							owner: page.owner,
							ownerName: page.ownerName,
							icon: page.icon,
							path: '/pages#/website/' + page.website._id + '/' + page.titleLink,
							id: page.website._id
						};
					}
				)
			);
		});
	}
});