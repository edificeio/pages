import { ng, sniplets } from 'entcore';
import { template, model } from 'entcore';
import { Website, Cell, Page, Folders } from '../model';

export let view = ng.controller('ViewController', [
    '$scope', 'model', 'route', '$route', '$location', function ($scope, model, route, $route, $location) {

    let params = $route.current.params;
    const findPage = async (): Promise<void> => {
        const websites = await Folders.websites();
        const website: Website = websites.find((w) => w._id === params.siteId);
        const editMode = website.myRights.update;
        $scope.website = website;

        if (params.pageId) {
            $scope.page = website.pages.matchingPath(params.pageId, website, editMode);
            if($scope.page){
                $scope.page.applySASS();
            }
        }
        else {
            $scope.website = website;
            $scope.page = website.pages.landingPage(website, editMode);
            if($scope.page){
                $scope.page.applySASS();
            }
        }

        $scope.websites = await Folders.websites();
        $scope.websites = $scope.websites.filter(w => !w.trashed);
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