Behaviours.register('pages', {
	behaviours: pagesBehaviours,
	rights: {
		workflow: {
			create: 'fr.wseduc.pages.controllers.PagesController|add',
			share: 'fr.wseduc.pages.controllers.PagesController|share'
		},
		resource: {
			update: 'fr-wseduc-pages-controllers-PagesController|update',
			remove: 'owner',
			share: 'owner'
		}
	},
	loadResources: function(callback){
		http().get('/pages/list/all').done(function(){

		}.bind(this));
	}
});