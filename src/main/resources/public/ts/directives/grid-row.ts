import { ng } from 'entcore/entcore';
import { Media, Cell, Row, cellSizes } from '../model';
import http from 'axios';
import { $ } from 'entcore/libs/jquery/jquery';

export let gridRow = ng.directive('gridRow', function($compile){
	return {
		restrict: 'E',
		transclude: true,
		replace: true,
		template: '<div class="row grid-row" ng-transclude></div>',
		scope: {
			index: '=',
			row: '='
		},
		link: function(scope, element, attributes){
			let row: Row = scope.row;
			element.addClass('row');
			element.addClass('droppable');

			let cellWidth;

			let newCellWidth;
			let firstDrag = true;

			let elementWidth;
			let elementOffset;

			let gridCells = element.find('grid-cell');
			let elementIndex;
			let previousElementIndex;

			let timerToken;
			let marginTime = false;

			element.on("dragover", function (event, e) {
                event.preventDefault();
                event.stopPropagation();
				if(firstDrag){
					firstDrag = false;
					elementWidth = element.width();
					elementOffset = element.offset();
					cellWidth = elementWidth / 12;
					gridCells = element.find('grid-cell');
					element.height(element.height());
					newCellWidth = parseInt(12 / (row.cells.length + 1));
					gridCells.each((index, item) => {
						$(item).removeClass(cellSizes[row.cells.all[index].width]);
						$(item).addClass(cellSizes[newCellWidth]);
					});
					timerToken = setTimeout(() => {
						marginTime = true
					}, 100);
				}
				
				elementIndex = parseInt((e.x - elementOffset.left) / (newCellWidth * cellWidth));
				
				if(elementIndex !== previousElementIndex && marginTime){
					gridCells.attr('style', '');
					$(gridCells[elementIndex]).css({ 'margin-left': (newCellWidth * cellWidth) + 'px' });
					previousElementIndex = elementIndex;
				}
            });

			element.on("dragout", function (event) {
				firstDrag = true;
				marginTime = false;
				clearTimeout(timerToken);
                event.preventDefault();
                event.stopPropagation();
				gridCells.attr('style', '');
				gridCells.each((index, item) => {
					$(item).removeClass(cellSizes[newCellWidth]);
					$(item).addClass(cellSizes[row.cells.all[index].width]);
				});
            });

			element.on('drop', (event, item) => {
				let cell = new Cell();
                cell.media = { type: 'empty' };
				cell.width = newCellWidth;
				gridCells.attr('style', '');
				row.cells.forEach(c => c.width = newCellWidth);
				setTimeout(() => {
					row.addCellAt(cell, elementIndex);
					scope.$apply();
					if (item.path) {
						http.get(item.path).then(response => {
							let media: Media = {
								type: 'text',
								source: response.data
							};
							item = media;
							cell.source(JSON.parse(JSON.stringify(item)));
							scope.$apply();
						});
						
					}
					else{
						cell.source(JSON.parse(JSON.stringify(item)));
						scope.$apply();
					}
				}, 250);
            });
		}
	}
});