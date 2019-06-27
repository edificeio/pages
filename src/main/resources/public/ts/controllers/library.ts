import { ng, template, idiom, notify } from 'entcore';
import { LocalAdmin, Folders, Root, Folder, Website, Filters, BaseFolder, Group } from '../model';
import { _ } from 'entcore';

//===Types
export interface LibraryControllerScope {
    display: {
        searchWebsites: string
        searchGroups: string
        lightbox: {
            managePages: boolean,
            properties: boolean
        }
        //
        warningDuplicate: boolean
        warningEditPage: boolean
        currentTemplate: string
        targetFolder: Folder
        wizardStep:number;
        saving: boolean
    }
    localAdmin: typeof LocalAdmin
    currentFolder: Folder | Root
    root: Root
    folder: Folder
    website: Website
    filters: typeof Filters
    can(right: string): boolean
    searchWebsites(item: Website): void
    searchGroups(item: Group): void
    saveProperties(): void
    lightbox(name: string): void
    editWebsiteProperties(): void
    openFolder(folder: Folder): void
    openPublish(): void
    createFolder(): void
    removeSelection(): void
    openTrash(): void
    openRoot(): void
    createWebsiteView(): void
    createWebsite(): void
    copyToClipboard(): void
    viewSite(website: Website): void
    open(item: Website | Folder): void
    dropTo(targetItem: string | Folder, $originalEvent): void
    selectionContains(folder: Folder): void
    managePagesView(website: Website): void
    duplicateWebsites(): void
    closeManagePages(): void
    restore(): void
    addPage(): void
    move(): void
    previewPath(website: Website): void
    $apply: any
}

//=== Utils
const copyStringToClipboard = (str: string) => {
    // Create new element
    var el = document.createElement('textarea');
    // Set value (string to be copied)
    el.value = str;
    // Set non-editable to avoid focus and move outside of view
    el.setAttribute('readonly', '');
    (el as any).style = { position: 'absolute', left: '-9999px' };
    document.body.appendChild(el);
    // Select text inside element
    el.select();
    // Copy text to clipboard
    document.execCommand('copy');
    // Remove temporary element
    document.body.removeChild(el);
}
function safeApply(that) {
	return new Promise((resolve, reject) => {
		let phase = that.$root.$$phase;
		if (phase === '$apply' || phase === '$digest') {
			if (resolve && (typeof (resolve) === 'function')) resolve();
		} else {
			if (resolve && (typeof (resolve) === 'function')) that.$apply(resolve);
			else that.$apply();
		}
	});
}

export let library = ng.controller('LibraryController', [
    '$scope', 'model', '$rootScope', '$location', function ($scope: LibraryControllerScope, model, $rootScope, $location) {

    $scope.display.lightbox['managePages'] = false;
    $scope.display.lightbox['properties'] = false;
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
    $scope.display.wizardStep = 0;

    template.open('library/create-website', 'library/create-website');
    template.open('library/toaster', 'library/toaster');
    template.open('library/publish', 'library/publish');
    template.open('library/properties', 'library/properties');
    template.open('library/move', 'library/move');

    BaseFolder.eventer.on('refresh', () => $scope.$apply());
    Website.eventer.on('save', () => $scope.$apply());

    $rootScope.$on('share-updated', async (event, changes) => {
        for (let website of $scope.currentFolder.selection) {
            await (website as Website).sync();
            (website as Website).synchronizeRights();
        }

        $scope.$apply();
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
        let folder: Folder = $scope.currentFolder as Folder;
        return _.find(folder.websites.sel.selected, (w: Website) => !w.myRights[right]) === undefined;
    };

    $scope.saveProperties = async () => {
        try{
            $scope.display.warningDuplicate = false;
            $scope.display.warningEditPage = false;
            $scope.display.saving = true;
            await $scope.website.save();
            $scope.lightbox('properties');
            $scope.website.updateApplication();
        }catch(e){
            if (e.response && e.response.status == 409) {
                $scope.display.warningDuplicate = true;
                $scope.display.warningEditPage = true;
                //avoid skip saving next time
                $scope.website._backup = null;
                $scope.$apply();
            } else {
                console.error(e);
            }
        } finally {
            $scope.display.saving = false;
            safeApply($scope);
        }
    }

    $scope.editWebsiteProperties = () => {
        $scope.website = $scope.currentFolder.selection[0] as Website;
        $scope.lightbox('properties');
    };

    $scope.openFolder = (folder) => {
        template.open('library/folder-content', 'library/folder-content');
        $scope.currentFolder = folder;
        $scope.currentFolder.sync();
    };

    $scope.openPublish = async () => {
        $scope.lightbox('showPublish');
        $scope.website = $scope.currentFolder.selection[0] as Website;
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
        try {
            $scope.display.warningDuplicate = false;
            $scope.display.warningEditPage = false;
            $scope.display.currentTemplate = undefined;
            $scope.website.newPage.title = idiom.translate('landingpage');
            $scope.display.saving = true;
            await $scope.website.useNewPage();
            //
            if ($scope.currentFolder && $scope.currentFolder._id) {
                await $scope.website.moveTo($scope.currentFolder as Folder);
            }
            if ($scope.currentFolder) {
                await $scope.currentFolder.sync();
            }
            $scope.lightbox('newSite');
            $location.path('/website/' + $scope.website._id);
            safeApply($scope);
            //
        } catch (e) {
            if (e.response && e.response.status == 409) {
                $scope.display.warningDuplicate = true;
                $scope.display.warningEditPage = true;
                //avoid skip saving next time
                $scope.website._backup = null;
                $scope.display.wizardStep = 0;
                setTimeout(()=>{
                    $scope.display.wizardStep = 1;
                    $scope.$apply();
                })
                $scope.$apply();
            } else {
                console.error(e);
            }
        } finally {
            $scope.display.saving = false;
        }
    };
    $scope.copyToClipboard = () => {
        const url = `${$scope.website.slugDomain}${$scope.website.slug}`
        copyStringToClipboard(url)
        notify.info("website.copy.clipboard")
    }
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
        if (!actualItem) {
            let folders = await Folders.folders();
            actualItem = folders.find(f => f._id === originalItem);
        }
        await actualItem.moveTo(targetItem);
        await $scope.currentFolder.sync();
        $scope.$apply();
        if (targetItem instanceof Folder) {
            targetItem.save();
        }
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
        $scope.lightbox('move')
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
        await $scope.currentFolder.restoreSelection();
        $scope.$apply();
    };

    $scope.closeManagePages = () => {
        $scope.lightbox('managePages');
        $scope.website.newPage = undefined;
        $scope.website.showStyle = undefined;
        $scope.website.save()
    };

    $scope.previewPath = (website) => {
        if (website.visibility === 'PUBLIC') {
            return '/pages/p/website#/preview/' + website._id;
        }
        else {
            return '/pages#/preview/' + website._id;
        }
    };
}]);