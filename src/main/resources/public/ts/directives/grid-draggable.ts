import { ng, ui } from 'entcore/entcore';
import { $ } from 'entcore/libs/jquery/jquery';
import { _ } from 'entcore/libs/underscore/underscore';
import { Cell } from '../model/cell';

export let gridDraggable = ng.directive('gridDraggable', function($compile){
	return {
		restrict: 'A',
		link: function(scope, element, attributes){
            let header = element.find('.header').first();
            let mediaWrapper;
            let firstTick;
            let cells: { el: any, offset: any, width: number, height: number }[];
            let elPos;
            let swap = undefined;
            element.on('mousedown', () => {
                firstTick = true;
            });
            
            ui.extendElement.draggable(element, {
                tick: (e, mouse) => {
                    if (firstTick) {
                        let placeholder = $('<grid-cell></grid-cell>')
                            .addClass('media')
                            .addClass('placeholder')
                            .addClass('cell');
                        placeholder.width(element.width() - 8);
                        placeholder.height(element.height() + parseInt(element.css('padding-bottom')));
                        element.parent()[0].insertBefore(placeholder[0], element[0]);
                        element.css({ 'z-index': 9999 });
                        element.removeClass('grid-media');
                        element.find('.header').css({ height: '35px' });
                        firstTick = false;
                        cells = _.map(element.parents('drawing-grid').first().find('grid-cell'), (c) => {
                            return {
                                el: c,
                                offset: $(c).offset(),
                                width: $(c).width(),
                                height: $(c).height() + parseInt($(c).css('padding-bottom'))
                            }
                        });
                        cells.forEach((c) => {
                            $(c.el).height($(c.el).height());
                        });
                        
                        mediaWrapper = element;
                        mediaWrapper.css({ opacity: 0.7 });
                        elPos = element.offset();
                    }
                    
                    cells.forEach((cell) => {
                        if (cell.el === element[0] || $(cell.el).hasClass('placeholder')) {
                            return;
                        }

                        let top = mouse.y + window.scrollY;
                        if (cell.offset.left < mouse.x && cell.offset.left + cell.width > mouse.x &&
                            cell.offset.top < top && cell.offset.top + cell.height > top
                        ) {
                            if (swap === cell) {
                                return;
                            }

                            let targetMWrapper = $(cell.el).find('.media-wrapper');

                            targetMWrapper.offset({
                                top: parseInt(elPos.top),
                                left: parseInt(elPos.left + 7)
                            });
                            targetMWrapper.css({
                                opacity: 0.4,
                                padding: 0,
                                overflow: 'hidden',
                                position: 'absolute'
                            });
                            targetMWrapper.width(mediaWrapper.width() - 21);
                            targetMWrapper.height(
                                element.height() + parseInt(element.css('padding-bottom'))
                            );

                            $('.dragover').removeClass('dragover');
                            $(cell.el).addClass('dragover');

                            swap = cell;
                        }
                        else {
                            $(cell.el).removeClass('dragover');
                            $(cell.el).find('.media-wrapper').attr('style', '');
                            if (swap === cell) {
                                swap = undefined;
                            }
                        }
                    });
                },
                mouseUp: () => {
                    setTimeout(() => {
                        $('.placeholder').remove();
                        $('.dragover').removeClass('dragover');
                        element.addClass('grid-media');
                        mediaWrapper.attr('style', '');

                        cells.forEach((c) => {
                            if ($(c.el).hasClass('placeholder')) {
                                return;
                            }
                            $(c.el).attr('style', '');
                            let cell: Cell = angular.element(c.el).scope().cell;
                            $(c.el).find('.media-container, .media-wrapper, .text-wrapper').attr('style', '');
                            $(c.el).find('.media-container, .text-wrapper').css(cell.style);
                        });
                    }, 20);
                    
                    if (swap) {
                        let cell = angular.element(swap.el).scope().cell;
                        scope.row.swap(cell, scope.cell);
                    }
                    scope.$apply();
                    scope.row.page.eventer.trigger('save');
                }
            })
		}
	}
});