var pagesBehaviours = {
	workflow: {
		create: 'fr.wseduc.pages.controllers.PagesController|add',
		share: 'fr.wseduc.pages.controllers.PagesController|share'
	}
};

Behaviours.register('pages', {
	behaviours: pagesBehaviours,
	workflow: function(){
		var workflow = { };
		var pagesWorkflow = pagesBehaviours.workflow;
		for(var prop in pagesWorkflow){
			if(model.me.hasWorkflow(pagesWorkflow[prop])){
				workflow[prop] = true;
			}
		}

		return workflow;
	},
	resource: function(resource){
		if(model.me.hasRight(resource, 'fr-wseduc-pages-controllers-PagesController|update')){
			resource.myRights = {
				update: true
			}
		}
		if(resource.owner.userId === model.me.userId){
			resource.myRights = {
				update: true,
				remove: true,
				share: true
			}
		}

		return resource;
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