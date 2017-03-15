import { ng, ui } from 'entcore/entcore';
import { $ } from 'entcore/libs/jquery/jquery';
import { _ } from 'entcore/libs/underscore/underscore';
import { Row, Media, Blocks, Cell, cellSizes } from '../model';
import { Mix } from 'toolkit';


let flashCell = (element) => {
    let addFlash = async () => {
        await ui.scrollToId('flash');
        element.removeAttr('id');

        let flash = $('<div></div>')
            .appendTo(element)
            .addClass('flash')
            .fadeOut();
    };

    setTimeout(() => {
        element.attr('id', 'flash');
        addFlash();
    }, 100);
};

export let gridCell = ng.directive('gridCell', function($compile){
	return {
		restrict: 'E',
		scope: {
			w: '=',
			h: '=',
			row: '=',
            cell: '=',
			className: '=',
			onIndexChange: '&',
			onRowChange: '&'
		},
        templateUrl: '/pages/public/template/directives/grid-cell.html',
		transclude: true,
		link: function (scope, element, attributes) {
            if(scope.cell.flash){
                flashCell(element);
            }
            
            setTimeout(() => {
                element.find('.media-container, .text-wrapper').css(scope.cell.style);
            }, 300);

            scope.styles = _.map(scope.cell.style, (val, key) => ({ name: key, val: val }));
            
            element.addClass('twelve-mobile');

            if (element.parents('.edit').length === 0) {
                element.children('.color-picker, dots-menu').remove();
            }

            element.on('editor-blur', 'editor', () => {
				element.removeClass('editor-focus');
            });
            element.on('editor-focus', 'editor', () => {
                element.addClass('editor-focus');
            });

            function setShadow(){
                let cell = scope.cell as Cell;
                if (cell.media.type === 'text') {
                    element.addClass('shadow');
                }
            }

            setShadow();

            scope.setTitle = () => {
                scope.cell.newTitle = scope.cell.title;
                scope.$parent.lightbox('setCellTitle', scope.cell);
            };

            scope.removeTitle = () => {
                scope.cell.title = undefined;
                scope.row.page.eventer.trigger('save');
            };

            scope.removeCell = () => {
                scope.row.removeCell(scope.cell);
                scope.$parent.$apply();
            };

			scope.$watch('w', function(newVal, oldVal){
				element.addClass(cellSizes[newVal]);
				if(newVal !== oldVal){
					element.removeClass(cellSizes[oldVal]);
                }

                let row: Row = scope.row;
			});

			scope.$watch('h', function(newVal, oldVal){
				if(ui.breakpoints.checkMaxWidth("tablette")){
			        element.removeClass('height-' + cellSizes[newVal]);
			    }
			    else {
			        element.addClass('height-' + cellSizes[newVal]);
			    }
				if(newVal !== oldVal){
					element.removeClass('height-' + cellSizes[oldVal]);
				}
			});

			$(window).on('resize', function () {
				if(ui.breakpoints.checkMaxWidth("tablette")){
			        element.removeClass('height-' + cellSizes[scope.h]);
			    }
			    else {
			        element.addClass('height-' + cellSizes[scope.h]);
			    }
			});

            scope.$watch('className', function (newVal) {
                element.addClass(newVal);
            });

            element.find('input[type=color]').on('change', (e) => {
                element.find('.media-container, .text-wrapper').css(scope.cell.style);
                scope.row.page.eventer.trigger('save');
            });

            element.on('click', '.start-write', () => {
                let cell: Cell = scope.cell;
                cell.source({ type: 'text' });
                setTimeout(() => {
                    element.find('[contenteditable]').click();
                    element.find('[contenteditable]').focus();
                }, 300);
            });

            scope.duplicate = () => {
                let newRow = new Row(scope.row.page);
                let newCell: Cell = Mix.castAs(Cell, JSON.parse(JSON.stringify(scope.cell)));
                newCell.flash = true;
                newRow.addCell(newCell);
                let currentRow = scope.row as Row;

                currentRow.page.rows.insertAfter(newRow, currentRow);
                scope.$apply();
            };

            scope.setColor = () => {
                element.children('.color-picker').click();
            };

            scope.removeColor = () => {
                scope.cell.style['background-color'] = '';
                scope.cell.style['color'] = '';
                element.find('.media-container, .text-wrapper').css(scope.cell.style);
                scope.row.page.eventer.trigger('save');
            };
		}
	}
});
