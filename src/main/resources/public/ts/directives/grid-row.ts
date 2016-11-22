import { ng } from 'entcore/entcore';

export let gridRow = ng.directive('gridRow', function($compile){
	return {
		restrict: 'E',
		transclude: true,
		replace: true,
		template: '<div class="row grid-row" ng-transclude></div>',
		scope: {
			index: '='
		},
		link: function(scope, element, attributes){
			element.addClass('row');
		}
	}
});