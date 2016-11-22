import { ng, ui } from 'entcore/entcore';
import { $ } from 'entcore/libs/jquery/jquery';
import { _ } from 'entcore/libs/underscore/underscore';
import { Row, Media, Blocks, Cell } from '../model';
import { Mix } from 'toolkit';
import http from 'axios';

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
        template: `
            <input type="color" ng-model="cell.style['background-color']" class="color-picker" />
            <div class="media-wrapper">
                <div class="media-container" ng-class="className" ng-transclude></div>
            </div>
            <dots-menu>
                <opt ng-click="removeCell()"><i18n>remove</i18n></opt>
                <opt ng-click="duplicate()"><i18n>duplicate</i18n></opt>
                <opt ng-click="setColor()"><i18n>cell.setBackground</i18n></opt>
                <opt ng-click="removeColor()" ng-if="cell.style['background-color']"><i18n>cell.removeBackground</i18n></opt>
            </dots-menu>
        `,
		transclude: true,
		link: function (scope, element, attributes) {
            var cellSizes = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
            setTimeout(() => {
                element.find('.media-container, .text-wrapper').css(scope.cell.style);
            }, 300);

            scope.styles = _.map(scope.cell.style, (val, key) => ({ name: key, val: val }));
            element.addClass('droppable');

            if (element.parents('.edit').length === 0) {
                element.children('.color-picker, dots-menu').remove();
            }

            element.on('editor-blur', 'editor', () => {
                scope.row.page.eventer.trigger('save');
            });

            element.on("dragover", function (event) {
                event.preventDefault();
                event.stopPropagation();
            });

            element.on("dragleave", function (event) {
                event.preventDefault();
                event.stopPropagation();
            });

            function setShadow(){
                let cell = scope.cell as Cell;
                if (cell.media.type === 'text') {
                    element.addClass('shadow');
                }
            }

            setShadow();

            element.on('drop', async (event, item) => {
                if (item.path) {
                    let response = await http.get(item.path);
                    let media: Media = {
                        type: 'text',
                        source: response.data
                    };
                    item = media;
                }

                scope.cell.source(JSON.parse(JSON.stringify(item)));
                scope.row.page.addFillerRow();
                setShadow();
                scope.$apply();
            });

            scope.removeCell = () => {
                scope.row.removeCell(scope.cell);
            };

			scope.$watch('w', function(newVal, oldVal){
				element.addClass(cellSizes[newVal]);
				if(newVal !== oldVal){
					element.removeClass(cellSizes[oldVal]);
                }

                let row: Row = scope.row;
                if (row.remainingSpace > 0 && scope.cell === row.cells.last) {
                    scope.cell.width += row.remainingSpace;
                }
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
                let newRow = Mix.castAs(Row, JSON.parse(JSON.stringify(scope.row)), scope.row.page) as Row;
                let currentRow = scope.row as Row;
                currentRow.cells.forEach((c, i) => {
                    if (c !== scope.cell) {
                        newRow.cells.all[i].media = {};
                    }
                });

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