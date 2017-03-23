import { ng, idiom, template, sniplets, Behaviours, ui } from 'entcore/entcore';
import { $ } from 'entcore/libs/jquery/jquery';
import { moment } from 'entcore/libs/moment/moment';
import { _ } from 'entcore/libs/underscore/underscore';
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
        sliderTest: 1
    };

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
        setTimeout(() => model.trigger('route-changed'), 500);
        $scope.$apply();
    }

    route({
        listSites: async () => {
            await sniplets.load();
            $scope.sniplets = _.reject(sniplets.sniplets, (s) => s.sniplet.hidden);
            template.open('main', 'library');
            Autosave.unwatchAll();
            $scope.$apply();
        },
        site: async (params) => {
            await sniplets.load();
            $scope.sniplets = _.reject(sniplets.sniplets, (s) => s.sniplet.hidden);
            Autosave.unwatchAll();
            openSite(params);
            $scope.$apply();
        },
        page: async (params) => {
            await sniplets.load();
            $scope.sniplets = _.reject(sniplets.sniplets, (s) => s.sniplet.hidden);
            Autosave.unwatchAll();
            openSite(params);
            $scope.$apply();
        },
        previewSite: async (params) => {
            await sniplets.load();
            $scope.sniplets = _.reject(sniplets.sniplets, (s) => s.sniplet.hidden);
            Autosave.unwatchAll();
            params.preview = true;
            openSite(params);
            $scope.$apply();
        },
        previewPage: async (params) => {
            await sniplets.load();
            $scope.sniplets = _.reject(sniplets.sniplets, (s) => s.sniplet.hidden);
            Autosave.unwatchAll();
            params.preview = true;
            openSite(params);
            $scope.$apply();
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

    $scope.addPage = (website: Website) => {
        website.useNewPage();
        website.save();
        $scope.display.currentTemplate = undefined;
    };

    $scope.$apply();
}]);