import { ng } from 'entcore/entcore';
import { $ } from 'entcore/libs/jquery/jquery';

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

            element.addClass('drawing-grid');
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