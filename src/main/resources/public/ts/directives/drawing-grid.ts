import { ng } from 'entcore/entcore';
import { $ } from 'entcore/libs/jquery/jquery';
import { Row, Cell, Media } from '../model';
import http from 'axios';

export let drawingGrid = ng.directive('drawingGrid', function ($compile) {
    return {
        restrict: 'E',
        link: function (scope, element, attributes) {
            let placeToolbar = () => {
                let maxDistance = $('.height-marker').height();
                let initialPosition = element.offset().top - parseInt(element.css('margin-top'));
                let newPosition = initialPosition - $(window)[0].scrollY;
                if (newPosition < maxDistance) {
                    newPosition = maxDistance;
                    element.css({
                        'margin-top': '0'
                    });
                }
                else {
                    element.css({
                        'margin-top': ($('editor.focus editor-toolbar').height() + 20) + 'px'
                    });
                }
                $('editor-toolbar').css({
                    top: newPosition + 'px'
                });

                $('editor > popover').css({
                    top: newPosition + 'px'
                });
            };

            let newRow = element.find('.new-row');

            element.addClass('droppable');
            element.addClass('drawing-grid');

            let firstTick = true;
            let rows;
            element.on('dragover', (e, p) => {
                if(firstTick){
                    rows = element.find('.grid-row');
                    firstTick = false;
                }
                if(rows.length === 0 || p.y > rows.last().offset().top + rows.last().height() + 20){
                    if(!newRow.hasClass('highlight')){
                        newRow.addClass('highlight');
                    }
                }
                else{
                    newRow.removeClass('highlight');
                }
            });

            element.on('dragout', (e) => {
                firstTick = true;
                newRow.removeClass('highlight');
            });

            element.on('drop', async (e, item) => {
                if(newRow.hasClass('highlight')){
                    let row: Row = scope.page.addRow();
                    let cell = new Cell();
				    cell.width = 12;
                    row.addCell(cell);
                    scope.$apply();
                    await cell.setContent(item);
                    scope.$apply();
                }
            });

            element.on('editor-focus', 'editor', () => {
                setTimeout(() => {
                    if ($(window)[0].scrollY < element.offset().top - parseInt(element.css('margin-top'))) {
                        element.css({
                            'margin-top': ($('editor.focus editor-toolbar').height() +20) + 'px'
                        });
                    }
                    
                    placeToolbar();
                }, 100);
            });
            element.on('editor-blur', 'editor', () => {
                if (element.find('editor.focus').length === 0) {
                    element.css({
                        'margin-top': '0px'
                    });
                }
            });

            $(window).on('scroll', () => {
                placeToolbar();
            });
        }
    }
});