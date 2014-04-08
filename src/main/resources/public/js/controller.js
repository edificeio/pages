routes.define(function($routeProvider){
	$routeProvider
		.when('/view/:pageId', {
			action: 'viewPage'
		})
		.when('/list', {
			action: 'openList'
		})
		.otherwise({
			redirectTo: '/list'
		})
});

function PagesController($scope, template, route){
	$scope.template = template;

	route({
		viewPage: function(params){
			$scope.template.open('main', 'view-page');
			$scope.page = new Page({ _id: params.pageId });
			$scope.page.open();
			$scope.page.on('change', function(){
				$scope.$apply('page');
			});
		},
		openList: function(){
			$scope.template.open('main', 'display-pages');
		}
	});

	$scope.newPage = function(){
		var page = new Page();
		page.title = "Titre de la page";
		page.content = "Mon contenu";
		page.save();
	};

	$scope.openSingleElement = function(page){
		model.pages.mixed.closeAll();
		page.open();
	};

	model.on("pages.mixed.change", function(){
		$scope.$apply();
	});

	$scope.pages = model.pages.mixed;
}