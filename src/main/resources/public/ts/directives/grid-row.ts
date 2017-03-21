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
			let filling = 0;
			let firstDrag = true;

			let elementWidth;
			let elementOffset;

			let gridCells = element.find('grid-cell');
			let elementIndex;
			let previousElementIndex;

			let timerToken;
			let marginTime = false;

			let newLength;
			let dragCell = false;

			let margin = '';

			scope.$watch('row', () => {
				row = scope.row;
			});

			let initialCalc = () => {
				margin = ((newCellWidth + filling) * cellWidth) + 'px';
				newLength = row.cells.length + 1;
				dragCell = false;
				if(element.children('.dragging').length > 0){
					newLength--;
					dragCell = true;
					margin = (element.children('.dragging').width() - 4) + 'px';
				}
				firstDrag = true;
				elementWidth = element.width();
				elementOffset = element.offset();
				cellWidth = elementWidth / 12;
				gridCells = element.find('grid-cell');
				newCellWidth = parseInt(12 / newLength);
				filling = 12 % (newCellWidth * newLength);
			};

			element.on("dragover", function (event, e) {
                event.preventDefault();
                event.stopPropagation();
				if(firstDrag){
					initialCalc();
					gridCells.each((index, item) => {
						$(item).height($(item).height());
						$(item).css('overflow', 'hidden');
					});
					if(!dragCell){
						gridCells.each((index, item) => {
							$(item).removeClass(cellSizes[row.cells.all[index].width]);
							$(item).addClass(cellSizes[newCellWidth]);
						});
					}

					timerToken = setTimeout(() => {
						marginTime = true;
					}, 100);
				}
				
				elementIndex = parseInt((e.x - elementOffset.left) / (newCellWidth * cellWidth));
				if(elementIndex !== previousElementIndex && marginTime){
					gridCells.each((index, item) => {
						if(!$(item).hasClass('dragging')){
							$(item).css('margin-left', '');
						}
					});

					if((elementIndex < gridCells.length - 1 && dragCell) || (elementIndex < gridCells.length && !dragCell)){
						if(!$(gridCells[elementIndex]).hasClass('dragging')){
							$(gridCells[elementIndex]).css({ 'margin-left': margin });
						}
						else{
							$(gridCells[elementIndex]).next().css({ 'margin-left': margin });
						}
					}

					previousElementIndex = elementIndex;
				}
            });

			element.on("dragout", function (event) {
				clearTimeout(timerToken);
				initialCalc();
                event.preventDefault();
                event.stopPropagation();
				gridCells.each((index, gc) => {
					if(!$(gc).hasClass('dragging')){
						$(gc).attr('style', '');
					}
				});
				element.css({ height: '' });
				firstDrag = true;
				marginTime = false;
				previousElementIndex = undefined;
				gridCells.each((index, item) => {
					if(!$(item).hasClass('dragging')){
						$(item).removeClass(cellSizes[newCellWidth]);
						$(item).addClass(cellSizes[row.cells.all[index].width]);
					}
				});
            });

			element.on('drop', async (event, item) => {
				firstDrag = true;
				previousElementIndex = undefined;
				gridCells.attr('style', '');

				if(item instanceof Cell && dragCell){
					row.moveCell(item, elementIndex);
					scope.$apply();
					return;
				}

				let cell: Cell = new Cell();
				if(item instanceof Cell){
					item.removeFromRow();
					cell = item;
				}

				if(!cell.media){
					cell.media = { type: 'empty' };
				}
				row.addCellAt(cell, elementIndex);
				row.cells.forEach(c => c.width = newCellWidth);
				cell.width = newCellWidth + filling;
				
				scope.$apply();
				if(!(item instanceof Cell)){
					await cell.setContent(JSON.parse(JSON.stringify(item)));
					scope.$apply();
				}
            });
		}
	}
});