import { model, routes, ng } from 'entcore';
import { Websites } from './model';

import { library } from './controllers/library';
import { edit } from './controllers/edit';
import { view } from './controllers/view';
import { main } from './controllers/main';

import { gridCell } from './directives/grid-cell';
import { gridRow } from './directives/grid-row';
import { gridResizable } from './directives/grid-resizable';
import { drawingGrid } from './directives/drawing-grid';
import { panel } from './directives/panel';
import { cssEditor } from './directives/css-editor';

ng.controllers.push(library);
ng.controllers.push(edit);
ng.controllers.push(view);
ng.controllers.push(main);

ng.directives.push(gridCell);
ng.directives.push(gridRow);
ng.directives.push(gridResizable);
ng.directives.push(drawingGrid);
ng.directives.push(panel);
ng.directives.push(cssEditor);

routes.define(function ($routeProvider) {
    $routeProvider
        .when('/website/:siteId', {
            action: 'site'
        })
        .when('/website/:siteId/:pageId', {
            action: 'page'
        })
        .when('/preview/:siteId/:pageId', {
            action: 'previewPage'
        })
        .when('/preview/:siteId', {
            action: 'previewSite'
        })
        .when('/list-sites', {
            action: 'listSites'
        })
        .otherwise({
            redirectTo: '/list-sites'
        });
});