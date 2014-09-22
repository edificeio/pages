routes.define(function($routeProvider){
	$routeProvider
		.when('/website/:siteId', {
			action: 'viewSite',
			reloadOnSearch: false
		})
		.when('/website/:siteId/:pageLink', {
			action: 'viewPage',
			reloadOnSearch: false
		})
		.when('/list-sites', {
			action: 'listSites',
			reloadOnSearch: false
		})
		.otherwise({
			redirectTo: '/list-sites'
		});
});

function PagesController($scope, template, route, model, date, $location){
	$scope.websites = model.websites;
	$scope.template = template;
	$scope.date = date;
	$scope.display = {
		guideCols: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
		guideRows: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
		showEditButtons: true,
		search: '',
		mineOnly: false,
		snipletStep: 1
	};

	$scope.website = new Website();
	$scope.page = new Page();
	$scope.newCell = new Cell();

	template.open('grid', 'grid');
	template.open('grid-view', 'grid-view');

	function viewSite(siteId, pageLink){
		model.websites.on('sync', function(){
			var website = model.websites.findWhere({ '_id': siteId });
			if(website === undefined){
				return;
			}
			$scope.website = website;
			$scope.page = $scope.website.pages.findWhere({ 'titleLink': pageLink || $scope.website.landingPage });
			template.open('main', 'page-viewer');
		});
	}

	route({
		listSites: function(){
			template.open('main', 'websites-list');
		},
		viewSite: function(params){
			viewSite(params.siteId);
		},
		viewPage: function(params){
			viewSite(params.siteId, params.pageLink);
		}
	});

	$scope.mine = function(element){
		return !$scope.display.mineOnly || element.owner.userId === model.me.userId;
	};

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

	$scope.searchMatch = function(element){
		return lang.removeAccents(element.title.toLowerCase()).indexOf(lang.removeAccents($scope.display.search.toLowerCase())) !== -1;
	};

	$scope.viewSite = function(site){
		$scope.website = site;
		$scope.page = site.pages.findWhere({ 'titleLink': site.landingPage });
		template.open('main', 'page-viewer');
		$location.path('/website/' + $scope.website._id);
	};

	$scope.cancelEdit = function(){
		$scope.page = new Page();
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
		$scope.page = new Page();
		$scope.display.createNewSite = false;
		$scope.website.save();
		template.open('main', 'website-manager');
	};

	$scope.editWebsite = function(website){
		$scope.website = website;
		if(!website){
			$scope.website = $scope.websites.selection()[0];
		}

		$scope.page = new Page();
		template.open('main', 'website-manager');
		template.open('edit-view', 'pages-list');
	};

	$scope.switchSelectAllPages = function(){
		if($scope.display.selectAllPages){
			$scope.website.pages.selectAll();
		}
		else{
			$scope.website.pages.deselectAll();
		}
	};

	$scope.cancelPageCreation = function(){
		$scope.display.createNewPage = false;
		$scope.page = new Page();
	};

	$scope.createPage = function(){
		$scope.page.titleLink = encodeURIComponent(lang.removeAccents($scope.page.title.replace(/\ /g, '-')).toLowerCase());
		$scope.website.pages.push($scope.page);
		if($scope.website.pages.length() === 1){
			$scope.website.landingPage = $scope.page.titleLink;
		}
		$scope.website.save();
		$scope.display.createNewPage = false;
		template.open('main', 'page-editor');
		window.location.hash = '/website/' + $scope.website._id + '/' + $scope.page.titleLink;
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
		$scope.newCell.media.type = type;
		if(type === 'grid'){
			$scope.newCell.buildSubGrid();
		}
		if(type === 'video'){
			$scope.newCell.media.source = $scope.newCell.media.source.replace('http://', 'https://');
			if($scope.newCell.media.source.indexOf('youtube') !== -1){
				var sourceSplit = $scope.newCell.media.source.split('" frame');
				sourceSplit[0] += '?wmode=transparent';
				$scope.newCell.media.source = sourceSplit.join('" frame');
			}
			$scope.newCell.height = 6;
		}
		if(!row.addCell($scope.newCell)){
			$scope.page.addRowAt(row).addCell($scope.newCell);
		}
		$scope.newCell = new Cell();
		row.openSquareMenu = false;
	};

	$scope.sniplet = {};

	$scope.selectSnipletSource = function(template, application){
		$scope.sniplet = {
			template: template,
			application: application
		};
		$scope.display.snipletStep = 2;
	};

	$scope.addSniplet = function(row){
		$scope.newCell.media.type = 'sniplet';
		$scope.newCell.media.source = {
			template: $scope.sniplet.template,
			application: $scope.sniplet.application,
			source: $scope.sniplet.source
		};
		if(!row.addCell($scope.newCell)){
			$scope.page.addRowAt(row).addCell($scope.newCell);
		}
		$scope.display.snipletStep = 1;
		$scope.newCell = new Cell();
		row.openSquareMenu = false;
		$scope.display.selectSniplet = false;
	};

	$scope.setRow = function(cell, rowIndex){
		$scope.display.editGrid.moveCell(cell, rowIndex);
	};

	$scope.removeSelectedPages = function(){
		$scope.website.pages.removeSelection();
		$scope.website.save();
	};

	$scope.setLandingPage = function(){
		$scope.website.landingPage = $scope.website.pages.selection()[0].titleLink;
		$scope.website.save();
	};

	$scope.editGrid = function(page, event){
		if(event.target.className.indexOf('cke') !== -1 || template.contains('main', 'page-viewer')){
			return;
		}
		$scope.display.editGrid = page;
		event.stopPropagation();
	};

	$scope.cancelSiteCreation = function(){
		$scope.display.createNewSite = false;
		$scope.website = new Website();
	};

	$scope.pagePreview = function(){
		template.open('main', 'page-viewer');
		$scope.display.preview = true;
	};

	$scope.cancelView = function(){
		if($scope.display.preview){
			template.open('main', 'page-editor');
		}
		else{
			template.open('main', 'websites-list');
		}
		$scope.display.preview = false;
	};

	$scope.removeSelectedWebsites = function(){
		$scope.folder.websites.removeSelected();
	};

	$scope.closeWebsite = function(){
		$scope.website = new Website();
		model.websites.sync();
		template.open('main', 'websites-list');
	};
}