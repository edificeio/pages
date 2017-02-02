import { ng, idiom, template, sniplets, Behaviours, ui } from 'entcore/entcore';
import { $ } from 'entcore/libs/jquery/jquery';
import { moment } from 'entcore/libs/moment/moment';
import { Folders, Website } from '../model';
import { Autosave } from 'toolkit';

export let main = ng.controller('MainController', ['$scope', 'model', 'route', '$location',
    async function ($scope, model, route, $location): Promise<void> {
    $scope.lang = idiom;
    $scope.idiom = idiom;
    $scope.template = template;
    $scope.date = moment;

    $scope.display = {
        lightbox: {},
        currentTemplate: '',
        guideRows: [],
        guideCols: [],
        sliderTest: 1
    };

    for (let i = 0; i < 12; i++) {
        $scope.display.guideRows.push(i);
        $scope.display.guideCols.push(i);
    }

    template.open('editor/pages-manager', 'editor/pages-manager');
    template.open('editor/templates', 'editor/templates');

    let openSite = async (params) => {
        let websites = await Folders.websites();
        let website: Website = websites.find(w => w._id === params.siteId);
        $scope.snipletResource = website;
        await website.rights.fromBehaviours()
        if (website.myRights['update'] && !params.preview && $(window).width() > ui.breakpoints.tablette) {
            template.open('main', 'page-editor');
        }
        else {
            template.open('main', 'page-viewer');
        }
        model.trigger('route-changed');
        $scope.$apply();
    }

    route({
        listSites: function () {
            template.open('main', 'library');
            Autosave.unwatchAll();
        },
        site: async function (params) {
            Autosave.unwatchAll();
            openSite(params);
        },
        page: function (params) {
            Autosave.unwatchAll();
            openSite(params);
        },
        previewSite: async function (params) {
            Autosave.unwatchAll();
            params.preview = true;
            openSite(params);
        },
        previewPage: function (params) {
            Autosave.unwatchAll();
            params.preview = true;
            openSite(params);
        }
    });

    $scope.redirectTo = (path) => {
        if (window.location.href.indexOf('/p/') === -1) {
            $location.path(path);
        }
        else {
            window.location.href = '/pages#' + path;
        }
    };

    $scope.lightbox = function (lightboxName: string, data: any) {
        $scope.display.data = data;
        $scope.display.lightbox[lightboxName] = !$scope.display.lightbox[lightboxName];
    };

    $scope.setTemplate = async (templateName: string, website: Website) => {
        $scope.display.currentTemplate = templateName;
        await website.setTemplate(templateName);
    };

    $scope.addPage = (website: Website) => {
        website.useNewPage();
        website.save();
        $scope.display.currentTemplate = undefined;
    };

    await sniplets.load();
    $scope.sniplets = sniplets.sniplets;
    $scope.$apply();
}]);