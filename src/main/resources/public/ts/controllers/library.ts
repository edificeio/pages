import { ng, template, idiom } from 'entcore/entcore';
import { LocalAdmin, Folders, Folder, Website, Filters, BaseFolder, Group } from '../model';
import { _ } from 'entcore/libs/underscore/underscore';

export let library = ng.controller('LibraryController', [
    '$scope', 'model', '$rootScope', '$location', function ($scope, model, $rootScope, $location) {

    template.open('library/folder-content', 'library/folder-content');
    $scope.localAdmin = LocalAdmin;
    $scope.currentFolder = Folders.root;
    $scope.currentFolder.sync();
    $scope.root = Folders.root;
    $scope.folder = new Folder();
    $scope.website = new Website();
    $scope.website.visibility = 'PRIVATE';
    $scope.filters = Filters;
    $scope.filters.protected = true;

    template.open('library/create-website', 'library/create-website');
    template.open('library/toaster', 'library/toaster');
    template.open('library/publish', 'library/publish');
    template.open('library/move', 'library/move');

    BaseFolder.eventer.on('refresh', () => $scope.$apply());
    Website.eventer.on('save', () => $scope.$apply());

    $rootScope.$on('share-updated', function (event, changes) {
        $scope.currentFolder.selection.forEach((website) => {
            website.synchronizeRights();
        });
    });

    $scope.searchGroups = (item: Group) => {
        let found = $scope.display.searchGroups && idiom.removeAccents(item.name.toLowerCase()).indexOf(
            idiom.removeAccents($scope.display.searchGroups).toLowerCase()
        ) !== -1;
        for (let structureId in $scope.website.published) {
            found = found && _.findWhere($scope.website.published[structureId].groups, { id: item.id }) === undefined;
        }
        return found;
    };

    $scope.searchWebsites = (item: Website) => {
        return !$scope.display.searchWebsites || idiom.removeAccents(item.title.toLowerCase()).indexOf(
            idiom.removeAccents($scope.display.searchWebsites).toLowerCase()
        ) !== -1;
    };

    $scope.can = (right: string) => {
        let folder: Folder = $scope.currentFolder;
        return _.find(folder.websites.sel.selected, (w: Website) => !w.myRights[right]) === undefined;
    };

    $scope.editWebsiteProperties = () => {
        $scope.website = $scope.currentFolder.selection[0];
        $scope.lightbox('properties');
    };

    $scope.openFolder = (folder) => {
        template.open('library/folder-content', 'library/folder-content');
        $scope.currentFolder = folder;
        $scope.currentFolder.sync();
    };

    $scope.openPublish = async () => {
        $scope.lightbox('showPublish');
        $scope.website = $scope.currentFolder.selection[0];
        if (!LocalAdmin.synced) {
            await LocalAdmin.structures.sync();
            $scope.$apply();
        }
    };

    $scope.createFolder = async () => {
        $scope.folder.parentId = $scope.currentFolder._id;
        $scope.display.lightbox['newFolder'] = false;
        $scope.currentFolder.children.push($scope.folder);
        await $scope.folder.save();
        $scope.folder = new Folder();
    };

    $scope.removeSelection = async () => {
        $scope.lightbox('confirmRemove');
        await $scope.currentFolder.removeSelection();
        $scope.$apply();
    }

    $scope.openTrash = () => {
        template.open('library/folder-content', 'library/trash');
        $scope.currentFolder = Folders.trash;
        Folders.trash.sync();
    };

    $scope.openRoot = () => {
        template.open('library/folder-content', 'library/folder-content');
        $scope.currentFolder = Folders.root;
        Folders.root.sync();
    };

    $scope.createWebsiteView = () => {
        $scope.website = new Website();
        $scope.website.visibility = 'PRIVATE';
        $scope.website.initNewPage();
        $scope.lightbox('newSite');
    };

    $scope.createWebsite = async () => {
        $scope.display.currentTemplate = undefined;
        $scope.website.newPage.title = idiom.translate('landingpage');
        await $scope.website.useNewPage();
        $scope.website.folderId = $scope.currentFolder._id;
        $scope.lightbox('newSite');
        $location.path('/website/' + $scope.website._id);
        $scope.$apply()
    };

    $scope.viewSite = (website: Website) => {
        $location.path('/website/' + website._id);
    };

    $scope.open = (item: Website | Folder) => {
        if (item instanceof Website) {
            $scope.viewSite(item);
        }
        else {
            $scope.openFolder(item);
        }
    };

    $scope.dropTo = async (targetItem: string | Folder, $originalEvent) => {
        let dataField = $originalEvent.dataTransfer.types.indexOf && $originalEvent.dataTransfer.types.indexOf("application/json") > -1 ? "application/json" : //Chrome & Safari
            $originalEvent.dataTransfer.types.contains && $originalEvent.dataTransfer.types.contains("Text") ? "Text" : //IE
                undefined;
        let originalItem: string = JSON.parse($originalEvent.dataTransfer.getData(dataField));

        if (targetItem instanceof Folder && originalItem === targetItem._id) {
            return;
        }
        let websites = await Folders.websites();
        let actualItem: Website | Folder = websites.find(w => w._id === originalItem);
        if(!actualItem) {
            let folders = await Folders.folders();
            actualItem = folders.find(f => f._id === originalItem);
        }
        await actualItem.moveTo(targetItem);
        await $scope.currentFolder.sync();
        $scope.$apply();
    };

    $scope.selectionContains = (folder: Folder) => {
        let contains = false;
        let selection: (Website | Folder)[] = $scope.currentFolder.selection;
        selection.forEach((item) => {
            if (item instanceof Folder) {
                contains = contains || item.contains(folder) || item._id === folder._id;
            }
        });

        return contains;
    }

    $scope.move = async () => {
        let folder = $scope.currentFolder as Folder;
        await folder.moveSelectionTo($scope.display.targetFolder);
        await Folders.root.sync();
        await $scope.currentFolder.sync();
        await $scope.display.targetFolder.sync();
        $scope.$apply();
    };

    $scope.managePagesView = (website: Website) => {
        $scope.lightbox('managePages');
        $scope.website = website;
    };

    $scope.addPage = async () => {
        $scope.display.currentTemplate = undefined;
        await $scope.website.useNewPage();
        $scope.$apply();
    };

    $scope.duplicateWebsites = async () => {
        let folder = $scope.currentFolder as Folder;
        await folder.websites.duplicateSelection();
        $scope.$apply();
    };

    $scope.restore = async () => {
        await Folders.trash.restoreSelection();
        $scope.$apply();
    };

    $scope.closeManagePages = () => {
        $scope.lightbox('managePages');
        $scope.website.newPage = undefined;
        $scope.website.showStyle = undefined;
        $scope.website.save()
    };
}]);