import { ng, sniplets } from 'entcore/entcore';
import { template, idiom } from 'entcore/entcore';
import { Website, Cell, Page, Folders, Media, Rows, Blocks, Block } from '../model';
import { _ } from 'entcore/libs/underscore/underscore';
import { Autosave } from 'toolkit';

export let edit = ng.controller('EditController', [
    '$scope', 'model', 'route', '$route', '$location', function ($scope, model, route, $route, $location) {
        let params = $route.current.params;
        let findPage = async (): Promise<void> => {
            let websites = await Folders.websites();
            let website: Website = websites.find((w) => w._id === params.siteId);
            $scope.website = website;

            if (params.pageId) {
                $scope.page = website.pages.matchingPath(params.pageId, website);
            }
            else {
                $scope.page = website.pages.landingPage(website);
            }

            let page: Page = $scope.page;
            $scope.page.applySASS();

            website.watchChanges();
            $scope.websites = await Folders.websites();
            await Blocks.sync();
            $scope.blocks = Blocks;
            $scope.$apply();
        };

        model.on('route-changed', () => {
            Autosave.unwatchAll();
            params = $route.current.params;
            findPage();
        });

        template.open('view/grid', 'view/grid');
        template.open('editor/grid', 'editor/grid');

        $scope.media = [
            { type: 'sound' },
            { type: 'video' },
            { type: 'text' },
            { type: 'image' }
        ];

        $scope.currentVisibility = () => {
            if($scope.website.visibility !== 'PUBLIC'){
                return 'protected';
            }
            return $scope.website.visibility.toLowerCase();
        }

        $scope.snipletsSources = $scope.sniplets.map((s) => ({ 
                type: 'sniplet', 
                source: { application: s.application, template: s.template, title: s.sniplet.title } 
            })
        );

        $scope.publicSnipletsSources = _
            .filter($scope.sniplets, (s) => s.sniplet.public)
            .map((s) => ({
                type: 'sniplet',
                source: { application: s.application, template: s.template, title: s.sniplet.title }
            })
        );

        $scope.searchBlocks = (item: Block) => {
            return !$scope.display.searchBlocks || idiom.removeAccents(item.keywords.toLowerCase()).indexOf(
                idiom.removeAccents($scope.display.searchBlocks).toLowerCase()
            ) !== -1;
        };

        $scope.cellContent = (cell: Cell, content) => {
            cell.source(content);
        };

        $scope.dropContent = (row, cell, $item) => {
            cell.source($item);
            row.page.trigger('save');
        };

        $scope.removePage = () => {
            $scope.display.data.remove();
            $scope.lightbox('confirmRemovePage');
        };

        $scope.addPage = async () => {
            $scope.display.currentTemplate = undefined;
            let page = await $scope.website.useNewPage();
            $location.path('/website/' + $scope.website._id + '/' + page.titleLink)
            $scope.$apply();
        };

        $scope.preview = () => {
            if ($scope.website.visibility === 'PUBLIC') {
                if (params.pageId) {
                    window.location.href = '/pages/p/website#/preview/' + params.siteId + '/' + params.pageId;
                }
                else {
                    window.location.href = '/pages/p/website#/preview/' + params.siteId;
                }
            }
            else {
                if (params.pageId) {
                    $location.path('/preview/' + params.siteId + '/' + params.pageId)
                }
                else {
                    $location.path('/preview/' + params.siteId);
                }
            }
        };

        $scope.applySASS = (page: Page) => {
            page.applySASS();
        };

        $scope.closeManagePages = () => {
            $scope.lightbox('managePages');
            $scope.website.newPage = undefined;
            $scope.website.showStyle = undefined;
        };

        $scope.closeCellTitle = (save: boolean) => {
            if(save){
                $scope.display.data.title = $scope.display.data.newTitle;
            }
            delete $scope.display.data.newTitle;
            $scope.lightbox('setCellTitle');
        };
}])