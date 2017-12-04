import { ng } from 'entcore';
import { $ } from 'entcore';
import { Blocks } from '../model';

export let panel = ng.directive('panel', () => {
    return {
        restrict: 'E',
        templateUrl: '/pages/public/template/directives/panel.html',
        link: (scope, element, attributes) => {
            let togglePanel = element.children('.toggle-panel');
            let icon = element.children('ul').children('li');

            //ignore edit opening click
            setTimeout(() => {
                $('body').on('click.openpanel', (e) => {
                    if (element.find(e.target).length === 0 && $(e.target).parents('.icons-tabs').length === 0 && !$(e.target).parents('.side-panel-opener').length) {
                        togglePanel.addClass('hide');
                        icon.removeClass('active');
                        setTimeout(() => {
                            if(togglePanel.hasClass('hide')){
                                Blocks.index = 0;
                                scope.$apply();
                            }
                        }, 200)
                    }
                });

                $('body').on('click.openpanel', '.side-panel-opener', () => {
                    togglePanel.removeClass('hide');
                    togglePanel.css({ 'overflow-y': 'auto', 'overflow-x': 'hidden' });
                    icon.addClass('active');
                    Blocks.index = 4;
                    scope.$apply();
                });
            }, 1);

            icon.on('click', () => {
                if (togglePanel.hasClass('hide')) {
                    togglePanel.removeClass('hide');
                    togglePanel.css({ 'overflow-y': 'auto', 'overflow-x': 'hidden' });
                    icon.addClass('active');
                    Blocks.index = 4;
                    scope.$apply();
                }
                else {
                    togglePanel.addClass('hide');
                    icon.removeClass('active');
                    Blocks.index = 0;
                    scope.$apply();
                }
            });

            element.on('startdrag', '[drag-item]', () => {
                togglePanel.addClass('hide');
                icon.removeClass('active');
                togglePanel.attr('style', 'overflow: visible');
                $('grid-cell').each((index, item) => {
                    $(item).height($(item).height());
                    $(item).css('overflow', 'hidden');
                });
                $('grid-cell').one('drop', () => {
                    togglePanel.removeClass('hide');
                    togglePanel.css({ 'overflow-y': 'auto', 'overflow-x': 'hidden' });
                    Blocks.index = 4;
                    scope.$apply();
                });
            });

            element.on('stopdrag', '[drag-item]', () => {
                togglePanel.css({ 'overflow-y': 'auto', 'overflow-x': 'hidden' });
                $('grid-cell').each((index, item) => {
                    $(item).css({
                        height: '',
                        overflow: ''
                    });
                });
            });

            scope.$on("$destroy", function() {
                $('body').off('click.openpanel');
            });
        }
    }
})