﻿import { ng, sniplets } from 'entcore/entcore';
import { template, model } from 'entcore/entcore';
import { Website, Cell, Page, Folders } from '../model';

export let view = ng.controller('ViewController', [
    '$scope', 'model', 'route', '$route', '$location', function ($scope, model, route, $route, $location) {

    let params = $route.current.params;
    let findPage = async (): Promise<void> => {
        if (params.pageId) {
            let websites = await Folders.websites();
            let website: Website = websites.find((w) => w._id === params.siteId);
            $scope.website = website;
            $scope.page = website.pages.matchingPath(params.pageId, website);
            $scope.page.applySASS();
        }
        else {
            let websites = await Folders.websites();
            let website: Website = websites.find((w) => w._id === params.siteId);
            $scope.website = website;
            $scope.page = website.pages.landingPage(website);
            $scope.page.applySASS();
        }

        $scope.websites = await Folders.websites();
        $scope.$apply();
    };

    findPage();
    model.on('route-changed', () => {
        params = $route.current.params;
        findPage();
    });

    $scope.me = model.me;
    template.open('view/grid', 'view/grid');

    $scope.edit = () => {
        if ($scope.website.visibility === 'PUBLIC') {
            if (params.pageId) {
                window.location.href = '/pages#/website/' + params.siteId + '/' + params.pageId;
            }
            else {
                window.location.href = '/pages#/website/' + params.siteId;
            }
        }
        else {
            if (params.pageId) {
                $location.path('/website/' + params.siteId + '/' + params.pageId)
            }
            else {
                $location.path('/website/' + params.siteId);
            }
        }
    };
}])