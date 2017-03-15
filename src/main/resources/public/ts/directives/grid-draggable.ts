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
                startDrag: () => {
                    element.addClass('dragging');
                    element.parent().height(element.parent.height());
                },
                dragOver: (item) => {
                    item.addClass('dragover');
                },
                dragOut: (item) => {
                    item.removeClass('dragover');
                },
                tick: (e, mouse) => {

                },
                mouseUp: () => {
                    
                    element.attr('style', '');
                    element.removeClass('dragging');
                    element.parent().css({ height: '' });
                    scope.$apply();
                }
            })
		}
	}
});