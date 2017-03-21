import { ng, ui } from 'entcore/entcore';
import { $ } from 'entcore/libs/jquery/jquery';

interface Directions{
	horizontal?: boolean;
	vertical?: boolean;
}

let removeCursorEffect = (element) => {
	element.removeClass('ns-resize-over');
	element.removeClass('ew-resize-over');
	element.removeClass('nwse-resize-over');
	element.css({ cursor: '' });
};

export let gridResizable = ng.directive('gridResizable', function($compile){
	return {
		restrict: 'A',
		link: function(scope, element, attributes){
			$('body').css({
				'-webkit-user-select': 'none',
				'-moz-user-select': 'none',
				'user-select' : 'none'
			});

			let cellSizes = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
			let parent = element.parents('.drawing-grid');

			element.addClass('grid-media');

            let lock: Directions = {};
            let resizeLimits: { horizontal: boolean, vertical: boolean };

			//cursor styles to indicate resizing possibilities
			element.on('mouseover', (e) => {
				element.on('mousemove.gridresize', (e) => {
					if(element.data('resizing') || element.data('lock')){
						return;
					}

					lock.vertical = (element.find('grid-cell, [vertical-lock]').length > 0);
					lock.horizontal = (element.find('grid-cell, [horizontal-lock]').length > 0) || 
						element.index() == element.parent().children('grid-cell').length - 1;

					let mouse = { x: e.pageX, y: e.pageY };
					resizeLimits = {
						horizontal:  element.offset().left + element.width() + 5 > mouse.x && mouse.x > element.offset().left + element.width() - 15 && !lock.horizontal,
						vertical: (element.offset().top + (element.height() + parseInt(element.css('padding-bottom'))) +
							5 > mouse.y && mouse.y > element.offset().top + (element.height() + parseInt(element.css('padding-bottom'))) - 15) && !lock.vertical
					};

					let orientations = {
						'ns': resizeLimits.vertical,
						'ew': resizeLimits.horizontal,
						'nwse': resizeLimits.vertical && resizeLimits.horizontal
					};

					let cursor = '';
					for(let orientation in orientations){
						if(orientations[orientation]){
							cursor = orientation;
						}
					}

					if(cursor){
						cursor = cursor + '-resize';
					}
					if(cursor !== element.css('cursor')){
						removeCursorEffect(element);
						if(cursor){
							element.addClass(cursor + '-over');
						}
						
						element.css({ cursor: cursor });
						element.children('*').css({ cursor: cursor })
					}
					
				});
				element.on('mouseout', (e) => {
					removeCursorEffect(element);
					element.removeClass(element.css('cursor'));
					element.off('mousemove');
				});
			});

			//actual resize
            element.on('mousedown.resize', (e) => {
                if (element.data('lock') === true || element.data('resizing') === true || (!resizeLimits.vertical && !resizeLimits.horizontal)) {
					return;
				}
				element.find('editor').css({ 'pointer-events': 'none' });
				element.addClass(element.css('cursor'));
				let mouse = { y: e.pageY, x: e.pageX };

				resizeLimits = {
					horizontal:  element.offset().left + element.width() + 5 > mouse.x && mouse.x > element.offset().left + element.width() - 15,
					vertical: (element.offset().top + (element.height() + parseInt(element.css('padding-bottom'))) +
						5 > mouse.y && mouse.y > element.offset().top + (element.height() + parseInt(element.css('padding-bottom'))) - 15) && !lock.vertical
				};

				let cellWidth = Math.ceil(element.parent().width() / 12) + 4;
				let cells = element.parent().children('grid-cell');
				let interrupt = false;
				let parentData = {
					pos: element.parents('.grid-row').offset(),
					size: {
						width: element.parents('.grid-row').width(),
						height: element.parents('.grid-row').height()
					}
				};

				if(resizeLimits.horizontal || resizeLimits.vertical){
					cells.data('lock', true);
				}

				function findResizableNeighbour(cell, step){
					let neighbour = cell.next('grid-cell');
					if(neighbour.next('grid-cell').length < 1){
						return neighbour;
					}
					if((neighbour.width() + 4) - step <= cellWidth * 2){
						return findResizableNeighbour(neighbour, step);
					}
					else{
						return neighbour;
					}
				}

				function parentRemainingSpace(el){
					let rowWidth = element.parent().width();
					let childrenSize = 0;
                    cells.each(function (index, cell) {
						if(cell !== el[0]){
                            childrenSize += $(cell).width() + 4;
                        }
					});
					return  rowWidth - childrenSize - 4;
				}

				e.preventDefault();

				$(document).off('mousemove.drag');
				$(document).on('mousemove.resize', function(e){
					mouse = {
						y: e.pageY,
						x: e.pageX
					};

					if(element.data('resizing')){
						return;
					}

                    element.data('resizing', true);
					cells.trigger('startResize');
					cells.removeClass('grid-media');

					//this makes sure the cursor doesn't change when we move the mouse outside the element
					$('.main').css({
						'cursor': element.css('cursor')
					});

					element.unbind("click");

					// the element height is converted in padding-bottom if vertical resize happens
					// this is done in order to keep it compatible with the grid, which is based on padding
                    if (resizeLimits.vertical) {
                        element.css({ overflow: 'hidden', 'min-height': 0 });
                        element.removeClass('height-zero');
                        element.removeClass('height-undefined');
						element.css({ 'padding-bottom': element.height() + 'px', height: 0 });
					}

					//animation for resizing
					let resize = function(){
						//current element resizing
						let newWidth = 0; let newHeight = 0;
						let p = element.offset();

						//horizontal resizing
						if(resizeLimits.horizontal){
							let distance = mouse.x - p.left;
							newWidth = distance;
							if (newWidth < cellWidth) {
								newWidth = cellWidth;
							}
							let diff = newWidth - element.width();

							//neighbour resizing
							let neighbour = findResizableNeighbour(element, distance - element.width() + 4);
							let neighbourWidth = parentRemainingSpace(neighbour);
								if(diff > 0){
									diff += 10;
									neighbourWidth -= diff;
								}
								if(neighbourWidth < cellWidth * 2){
									newWidth += neighbourWidth - cellWidth * 2;
									neighbourWidth = cellWidth * 2;
								}
								element.width(newWidth);
								neighbour.width(neighbourWidth);
						}

						//vertical resizing
						if(resizeLimits.vertical){
							let distance = mouse.y - p.top;
                            newHeight = distance;

                            if (element.offset().top + newHeight > window.scrollY + $(window).height() - 30) {
                                window.scrollTo(0, window.scrollY + 15);
                            }
                            if (element.offset().top + newHeight < window.scrollY + 30) {
                                window.scrollTo(0, window.scrollY - 15);
                            }

                            if (newHeight < cellWidth) {
                                newHeight = cellWidth;
                            }
                            
							element.css({ 'padding-bottom': newHeight });
						}
						if(!interrupt){
							requestAnimationFrame(resize);
						}
					};
					resize();
				});

				$(document).on('mouseup.resize', () => {
					cells.trigger('stopResize');
					interrupt = true;

                    cells.each((index, cell) => {
                        if ($(cell).parent().length === 0) {
                            scope.row.removeAt(index);
                            return;
                        }
                    });

                    cells.each((index, cell) => {
                        if ($(cell).parent().length === 0) {
                            return;
                        }
						let width = $(cell).width() + 4;
						let height = parseInt($(cell).css('padding-bottom'));
						if(height < cellWidth / 2){
							height = 0;
						}
						let cellWIndex = Math.round(width * 12 / parentData.size.width);
                        let cellHIndex = Math.round(height * 12 / parentData.size.width);

                        let cellScope = angular.element(cell).scope();
                        
						cellScope.cell.width = cellWIndex;
                        cellScope.cell.height = cellHIndex;
                        setTimeout(() => {
                            cellScope.$apply();
                        }, 10);
					});

					setTimeout(() => {
						cells.data('resizing', false);
						cells.data('lock', false);
						cells.attr('style', '');
                        cells.addClass('grid-media');
						removeCursorEffect(element);
						element.removeClass('ew-resize');
						element.removeClass('ns-resize');
						element.removeClass('nwse-resize');
                        element.find('*').css({ cursor: 'inherit' });
                        element.find('editor').css({ 'pointer-events': '' });
                        scope.row.page.eventer.trigger('save');
					}, 100);
					$(document).off('mousemove.resize');
					$(document).off('mouseup.resize');
					$('.main').css({'cursor': ''})
				});
			});
		}
	}
});