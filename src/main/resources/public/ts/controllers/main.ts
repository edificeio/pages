import { ng, idiom, template, sniplets, Behaviours, ui } from 'entcore';
import { $ } from 'entcore';
import { moment } from 'entcore';
import { _ } from 'entcore';
import { Folders, Website } from '../model';
import { Autosave } from 'entcore-toolkit';

export let main = ng.controller('MainController', ['$scope', 'model', 'route', '$location',
    async function ($scope, model, route, $location): Promise<void> {
    $scope.lang = idiom;
    $scope.idiom = idiom;
    $scope.template = template;
    $scope.date = moment;

    $scope.display = {
        lightbox: {},
        currentTemplate: '',
        sliderTest: 1,
        host: 'https://' + location.host
    };

    template.open('editor/pages-manager', 'editor/pages-manager');
    template.open('editor/templates', 'editor/templates');

    const openSite = async (params) => {
        const websites = await Folders.websites();
        const website: Website = websites.find(w => w._id === params.siteId || w.slug === params.siteId);
        if(!website || website.trashed){
            template.open('main', 'e404');
            $scope.$apply();
            return;
        }
        $scope.snipletResource = website;
        await website.rights.fromBehaviours();
        if (website.myRights['update'] 
            && !params.preview 
            && !params.print 
            && $(window).width() > ui.breakpoints.tablette) {
            template.open('main', 'page-editor');
        } else if (params.preview || website.myRights['read']) {
            template.open('main', 'page-viewer');
        } else if (params.print) {
            template.open('main', 'page-print');
        }
        setTimeout(() => model.trigger('route-changed'), 500);
        $scope.$apply();
    }

    function applyIfNeeded(){
        if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
            $scope.$apply();
        }
    }

    route({
        listSites: async () => {
            await sniplets.load();
            $scope.sniplets = _.reject(sniplets.sniplets, (s) => s.sniplet.hidden);
            template.open('main', 'library');
            Autosave.unwatchAll();
            applyIfNeeded();
        },
        site: async (params) => {
            await sniplets.load();
            $scope.sniplets = _.reject(sniplets.sniplets, (s) => s.sniplet.hidden);
            Autosave.unwatchAll();
            openSite(params);
            applyIfNeeded();
        },
        page: async (params) => {
            await sniplets.load();
            $scope.sniplets = _.reject(sniplets.sniplets, (s) => s.sniplet.hidden);
            Autosave.unwatchAll();
            openSite(params);
            applyIfNeeded();
        },
        previewSite: async (params) => {
            await sniplets.load();
            $scope.sniplets = _.reject(sniplets.sniplets, (s) => s.sniplet.hidden);
            Autosave.unwatchAll();
            params.preview = true;
            openSite(params);
            applyIfNeeded();
        },
        previewPage: async (params) => {
            await sniplets.load();
            $scope.sniplets = _.reject(sniplets.sniplets, (s) => s.sniplet.hidden);
            Autosave.unwatchAll();
            params.preview = true;
            openSite(params);
            applyIfNeeded();
        },
        print: async (params) => {
            await sniplets.load();
            $scope.sniplets = _.reject(sniplets.sniplets, (s) => s.sniplet.hidden);
            Autosave.unwatchAll();
            params.print = true;
            openSite(params);
            applyIfNeeded();
        }
    });
    $scope.redirectToLink=(path:string)=>{
        if(path.startsWith("http") || path.startsWith("www")){
            window.open(path)
        }else{
            $scope.redirectTo(path.split('#')[1])
        }
    }
    $scope.redirectTo = (path) => {
        if (window.location.href.indexOf('/p/') === -1 || (window as any).notLoggedIn) {
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

    $scope.closeLightbox = function (lightboxName: string, data: any) {
        $scope.display.data = data;
        $scope.display.lightbox[lightboxName] = false;
    };

    $scope.addPage = (website: Website) => {
        website.useNewPage();
        website.save();
        $scope.display.currentTemplate = undefined;
    };

    applyIfNeeded();
}]);