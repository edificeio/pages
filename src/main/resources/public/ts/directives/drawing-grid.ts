import { ng } from 'entcore/entcore';
import { $ } from 'entcore/libs/jquery/jquery';
import { Row, Cell, Media, Page } from '../model';
import http from 'axios';

export let drawingGrid = ng.directive('drawingGrid', function ($compile) {
    return {
        restrict: 'E',
        link: function (scope, element, attributes) {
            let initialPosition;
            let maxDistance;
            let firstScroll = true;
            let placeToolbar = () => {
                if($('sticky-row').length === 0){
                    return;
                }
                
                if(firstScroll){
                    initialPosition = $('sticky-row').offset().top;
                    maxDistance = $('.height-marker').height();
                    firstScroll = false;
                }
                let newPosition = initialPosition - $(window)[0].scrollY;
                if (newPosition <= maxDistance) {
                    newPosition = maxDistance;
                    
                }

                if($('sticky-row').hasClass('floating')){
                    element.find('editor-toolbar, editor > popover').css({
                        top: newPosition + 'px'
                    });
                    $('.icons-tabs').css({
                        top: '156px'
                    });
                    $('.toggle-panel').css({
                        top: '156px',
                        height: 'calc(100% - 159px)'
                    });
                }
                else{
                    $('.icons-tabs').css({
                        top: '80px'
                    });
                    $('.toggle-panel').css({
                        top: '80px',
                        height: 'calc(100% - 85px)'
                    });
                    element.find('editor-toolbar, editor > popover').offset({
                        top: initialPosition
                    });
                }
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
                let index = 0;
                element.find('.new-row').each((i, item) => {
                    if(item === e.target){
                        index = i;
                    }
                });

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
                console.log('Adding row at index : ' + index);
                row.addCell(cell);
                cell.width = 12;
                scope.$apply();
                if(!(item instanceof Cell)){
                    await cell.setContent(JSON.parse(JSON.stringify(item)));
                    scope.$apply();
                }
            });

            element.on('editor-focus', 'editor', () => {
                placeToolbar();
                $('sticky-row').addClass('hide');
            });
            element.on('editor-blur', 'editor', () => {
                placeToolbar();
                if($('editor.focus').length === 0){
                    $('sticky-row').removeClass('hide');
                }
            });

            $(window).on('scroll', () => {
                placeToolbar();
            });
        }
    }
});