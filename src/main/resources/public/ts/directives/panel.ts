import { ng } from 'entcore';
import { $ } from 'entcore/libs/jquery/jquery';
import { Blocks } from '../model';

export let panel = ng.directive('panel', () => {
    return {
        restrict: 'E',
        templateUrl: '/pages/public/template/directives/panel.html',
        link: (scope, element, attributes) => {
            let togglePanel = element.children('.toggle-panel');
            togglePanel.addClass('hide');
            let icon = element.children('ul').children('li');

            $('body').on('click', (e) => {
                if (element.find(e.target).length === 0 && $(e.target).parents('.icons-tabs').length === 0 && !$(e.target).parents('.side-panel-opener').length) {
                    togglePanel.addClass('hide');
                    icon.removeClass('active');
                    setTimeout(() => {
                        if(togglePanel.hasClass('hide')){
                            Blocks.index = 0;
                            scope.$apply();
                        }
                    }, 200);
                }
            });

            $('body').on('click', '.side-panel-opener', () => {
                togglePanel.removeClass('hide');
                icon.addClass('active');
                Blocks.index = 4;
                scope.$apply();
            });

            icon.on('click', () => {
                if (togglePanel.hasClass('hide')) {
                    togglePanel.removeClass('hide');
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
                togglePanel.css({ overflow: 'visible' });
                $('grid-cell').one('drop', () => {
                    togglePanel.removeClass('hide');
                    Blocks.index = 4;
                    scope.$apply();
                });
            });

            element.on('stopdrag', '[drag-item]', () => {
                togglePanel.css({ 'overflow-y': 'auto', 'overflow-x': 'hidden' });
            });
        }
    }
})