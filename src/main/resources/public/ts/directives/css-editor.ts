import { ng, http } from 'entcore';
import { $ } from 'entcore';

declare let Prism: any;
declare let css_beautify: any;

export let cssEditor = ng.directive('cssEditor', function () {
    return {
        restrict: 'E',
        scope: {
            page: '='
        },
        template: `
            <div class="preview">
                <h2><i18n>preview</i18n></h2>
                <div class="preview-content">
                    <h1><i18n>editor.format.title1</i18n></h1>
                    <h2><i18n>editor.format.title2</i18n></h2>
                    <h3><i18n>editor.format.title3</i18n></h3>
                    <p><i18n>page.exemple.paragraph</i18n></p>
                    <hr />
                    <p>Exemple : 
                    <br />strong{
                    <br />&nbsp;&nbsp;&nbsp;&nbsp;color: red;
                    <br />}
                </div>
            </div>
            <div class="css-editor">
                <textarea ng-model="content"></textarea>
                <pre><code class="language-css"></code></pre>
            </div>
        `,
        transclude: true,
        link: function (scope, element, attributes) {
            if ($('.prism').length === 0) {
                $('body').append(
                    $('<link />')
                        .attr('rel', 'stylesheet')
                        .attr('type', 'text/css')
                        .addClass('prism')
                        .attr('href', '/infra/public/js/prism/prism.css')
                );

                http().get('/infra/public/js/prism/prism.js').done((d) => {
                    let f = new Function(d);
                    f();
                });
            }

            scope.content = scope.page.sass;

            scope.$watch('content', () => {
                element.find('code').html(scope.content);
                Prism.highlightAll();
                scope.page.sass = scope.content;
                scope.page.applySASS();
            });

            element.find('textarea').on('keydown', (e) => {
                var keyCode = e.keyCode || e.which;

                if (keyCode == 9) {
                    e.preventDefault();
                    let start = element.find('textarea').get(0).selectionStart;
                    let end = element.find('textarea').get(0).selectionEnd;
                    
                    element.find('textarea').val(element.find('textarea').val().substring(0, start)
                        + "\t"
                        + element.find('textarea').val().substring(end));
                    
                    element.find('textarea').get(0).selectionStart = element.find('textarea').get(0).selectionEnd = start + 1;
                    element.find('code').html(scope.content);
                    Prism.highlightAll();
                    scope.page.sass = scope.content;
                }
            })
        }
    }
});