routes.define(function($routeProvider){
	$routeProvider
		.when('/view-page/:pageId', {
			action: 'viewPage'
		})
		.when('/view-site/:siteId', {
			action: 'viewSite'
		})
		.when('/list-my-sites', {
			action: 'listMySites'
		})
		.otherwise({
			redirectTo: '/list-my-sites'
		})
});

function PagesController($scope, template, route, model, date){
	$scope.mySites = model.mySites;
	$scope.sharedSites = model.sharedSites;
	$scope.folder = model.mySites;

	$scope.template = template;
	$scope.date = date;

	$scope.website = new Website();

	route({
		listMySites: function(){
			$scope.openFolder('mySites');
			template.open('websites-list', 'websites-table-list');
		}
	});

	$scope.openFolder = function(folder){
		if(typeof folder === 'string'){
			folder = model[folder];
		}
		folder.sync();
		folder.one('websites.sync', function(){
			template.open('main', 'folders');
		});
		$scope.folder = folder;
	};

	$scope.viewSite = function(site){
		$scope.website = site;
		template.open('main', 'website-manager');
	};

	$scope.removeSite = function(site){
		site.remove();
		$scope.openFolder($scope.folder);
		$scope.website = undefined;
		$scope.showConfirmRemove = false;
	};

	$scope.createSite = function(site){
		$scope.website.save();
		template.open('main', 'website-manager');
	};

	$scope.editPage = function(page){
		$scope.page = page;
		template.open('main', 'page-editor');
	};
}