import { ng } from 'entcore/entcore';
import { $ } from 'entcore/libs/jquery/jquery';
import { Row, Cell, Media, Page } from '../model';
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
            element.addClass('drawing-grid');

            let rows;
            element.on('dragover', '.new-row', (e, p) => {
                $(e.target).addClass('highlight');
            });

            element.on('dragout', '.new-row', (e) => {
                $(e.target).removeClass('highlight');
            });

            element.on('drop', '.new-row', async (e, item) => {
                let index = $(e.target).index();

                let cell: Cell = new Cell();
                if(item instanceof Cell){
                    item.removeFromRow();
                    cell = item;
                }

                if(!cell.media){
                    cell.media = { type: 'empty' };
                }
                let page: Page = scope.page;
                let row = page.addRowAt(index);
                row.addCell(cell);
                cell.width = 12;
                scope.$apply();
                if(!(item instanceof Cell)){
                    await cell.setContent(JSON.parse(JSON.stringify(item)));
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