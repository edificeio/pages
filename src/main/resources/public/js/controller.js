routes.define(function($routeProvider){
	$routeProvider
		.when('/website/:siteId', {
			action: 'viewSite'
		})
		.when('/website/:siteId/:pageLink', {
			action: 'viewPage'
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
	$scope.display = {
		guideCols: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
		guideRows: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
		showEditButtons: true
	};

	$scope.website = new Website();
	$scope.page = new Page();
	$scope.cell = new Cell();

	template.open('grid', 'grid');
	template.open('grid-view', 'grid-view');

	function viewSite(siteId, pageLink){
		model.mySites.websites.on('sync', function(){
			var website = model.mySites.websites.findWhere({ '_id': siteId });
			if(website === undefined){
				return;
			}
			$scope.website = website;
			$scope.page = $scope.website.pages.findWhere({ 'titleLink': pageLink || $scope.website.landingPage });
			template.open('main', 'page-viewer');
		});

		model.sharedSites.websites.on('sync', function(){
			var website = model.sharedSites.websites.findWhere({ '_id': siteId });
			if(website === undefined){
				return;
			}
			$scope.website = website;
			$scope.page = $scope.website.pages.findWhere({ 'titleLink': pageLink || $scope.website.landingPage });
			template.open('main', 'page-viewer');
		});
		$scope.display.showEditButtons = false;
	}

	route({
		listMySites: function(){
			$scope.openFolder('mySites');
			template.open('websites-list', 'websites-table-list');
		},
		viewSite: function(params){
			viewSite(params.siteId);
			model.mySites.websites.sync();
			model.sharedSites.websites.sync();
		},
		viewPage: function(params){
			viewSite(params.siteId, params.pageLink);
			model.mySites.websites.sync();
			model.sharedSites.websites.sync();
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

	$scope.cancelEdit = function(){
		$scope.website.sync();
		template.open('main', 'website-manager');
	};

	$scope.removeSite = function(site){
		site.remove();
		$scope.openFolder($scope.folder);
		$scope.website = undefined;
		$scope.showConfirmRemove = false;
	};

	$scope.createSite = function(){
		$scope.website.save();
		template.open('main', 'website-manager');
	};

	$scope.createPage = function(){
		$scope.page.titleLink = lang.removeAccents($scope.page.title.replace(/\ /g, '-')).toLowerCase();
		$scope.website.pages.push($scope.page);
		$scope.website.save();
		template.open('main', 'page-editor');
	};

	$scope.editPage = function(page){
		$scope.page = page;
		template.open('main', 'page-editor');
	};

	$scope.removeCell = function(row, cell){
		row.cells.remove(cell);
		if(row.cells.length() === 0){
			$scope.page.rows.remove(row);
		}
	};

	$scope.addCell = function(row, type){
		$scope.cell.media.type = type;
		if(type === 'grid'){
			$scope.cell.media.source = new Page();
		}
		if(!row.addCell($scope.cell)){
			$scope.page.addRowAt(row).addCell($scope.cell);
		}
		$scope.cell = new Cell();
		row.openSquareMenu = false;
	};

	$scope.setRow = function(cell, rowIndex){
		$scope.page.moveCell(cell, rowIndex);
	};

	$scope.removeSelectedPages = function(){
		$scope.website.pages.removeSelection();
		$scope.website.save();
	};

	$scope.setLandingPage = function(){
		$scope.website.landingPage = $scope.website.pages.selection()[0].titleLink;
		$scope.website.save();
	};
}