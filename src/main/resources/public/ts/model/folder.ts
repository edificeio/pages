import { Websites, Website } from './website';
import { Pages, Page } from './page';
import { Cell, Cells } from './cell';
import { Row, Rows } from './row';
import http from 'axios';
import { Rights, Shareable, model, idiom } from 'entcore';
import { Mix, Provider, Selection, Selectable, Eventer } from 'entcore-toolkit';
import { _ } from 'entcore';

export class BaseFolder implements Selectable {
    websites: Websites;
    selected: boolean;
    name: string;
    static eventer: Eventer = new Eventer();

    constructor(){
        this.websites = new Websites();
    }
}

class HierarchicalFolder extends BaseFolder{
    children: Selection<Folder>;
    _id: string;
    _selection: (Website | Folder)[];
    websitesIds: string[];

    constructor() {
        super();
        this.children = new Selection([]);
        this.websitesIds = [];
    }

    get displayName(): string{
        if(this.name === "root"){
            return idiom.translate("projects.root");
        }
        return this.name;
    }

    get shortenedName(): string{
        let shortenedName = this.name;
        if(shortenedName === "root"){
            shortenedName = idiom.translate("projects.root");
        }
        if(shortenedName.length > 38){
            shortenedName = shortenedName.substr(0, 35) + '...';
        }
        return shortenedName;
    }

    async moveSelectionTo(folder: Folder) {
        for (let item of this.selection) {
            await item.moveTo(folder);
        }
        if(folder instanceof Folder){
            folder.save();
        }
        if(this instanceof Folder){
            this.save();
        }
    }

    contains(folder: Folder): boolean {
        if (!folder) {
            return false;
        }
        if (folder._id === this._id) {
            return true;
        }
        let result = false;
        for (let i = 0; i < this.children.all.length; i++) {
            result = this.children.all[i]._id === folder._id || this.children.all[i].contains(folder);
            if (result) {
                return true;
            }
        }

        return result;
    }

    get selectedLength(): number {
        return this.websites.sel.selected.length + this.children.selected.length;
    }

    async sync(): Promise<void> {
        await this.websites.fill(this.websitesIds);
        let folders = await Folders.folders();
        this.children.all = folders.filter(
            f => (f.parentId === this._id || f.parentId === this.name) && !f.trashed
        );
        this.children.all.forEach((c) => {
            c.children.all = folders.filter(f => f.parentId === c._id && !f.trashed);
        });
        BaseFolder.eventer.trigger('refresh');
    }

    get selection(): (Website|Folder)[] {
        let newSel = this.websites.sel.selected.concat(this.children.selected as any);
        if(!this._selection || newSel.length !== this._selection.length){
            this._selection = newSel;
        }
        return this._selection;
    }

    get selectionIsWebsites(): boolean {
        return _.find(this.selection, (e) => !(e instanceof Website)) === undefined;
    }

    get selectionIsFolders(): boolean {
        return _.find(this.selection, (e) => !(e instanceof Folder)) === undefined;
    }

    async removeSelection(): Promise<any> {
        for (let item of this.selection) {
            await item.toTrash();
        }
        await Folders.trash.sync();
        this.children.deselectAll();
        this.websites.deselectAll();
        await this.sync();
    }
}

export class Folder extends HierarchicalFolder implements Shareable{
    parentId: string;
    rights: Rights<Folder>;
    shared: any;
    owner: { userId: string, displayName: string };
    trashed: boolean;

    constructor() {
        super();
        this.rights = new Rights(this);
        this.rights.fromBehaviours();
    }

    get myRights() {
        return this.rights.myRights;
    }

    async create(): Promise<void>{
        let response = await http.post('/pages/folder', this);
        Mix.extend(this, response.data);
        this.owner = { userId: model.me.userId, displayName: model.me.firstName + ' ' + model.me.lastName };
        Folders.provideFolder(this);
    }

    async saveChanges(): Promise<void>{
        await http.put('/pages/folder/' + this._id, this);
    }

    async save(): Promise<void>{
        if(!this._id){
            await this.create();
        }
        else{
            await this.saveChanges();
        }
    }

    toJSON(){
        return {
            parentId: this.parentId,
            name: this.name,
            trashed: this.trashed,
            websitesIds: this.websitesIds
        }
    }

    async toTrash(): Promise<void> {
        this.trashed = true;
        await this.websites.toTrash();
        await Folders.trash.sync();
        await this.saveChanges();
        await this.sync();
    }

    async moveTo(target: string | Folder): Promise<void> {
        if (target instanceof Folder && target._id) {
            this.parentId = target._id;
            target.sync();
        }
        else {
            if ((target instanceof Folder && target.name === 'root') || (target === 'root')) {
                this.parentId = 'root';
                Folders.root.sync();
            }
            if (target === 'trash') {
                await this.toTrash();
            }
        }

        await this.saveChanges();
    }

    async remove(): Promise<void> {
        await http.delete('/pages/folder/' + this._id);
        await this.sync();
    }
}

export class Root extends HierarchicalFolder {
    constructor() {
        super();
        this.name = 'root';
    }

    async sync(): Promise<void> {
        let websites = await Folders.websites();
        let folders = await Folders.folders();
        this.websites.all = [];
        websites.forEach((w) => {
            let inRoot = !w.trashed;
            folders.forEach((f) => {
                inRoot = inRoot && f.websitesIds.indexOf(w._id) === -1;
            });
            if (inRoot) {
                this.websites.all.push(w);
            }
        });

        this.websites.refreshFilters();

        this.children.all = folders.filter(
            f => (f.parentId === this.name || !f.parentId) && !f.trashed
        );
        this.children.all.forEach((c) => {
            c.children.all = folders.filter(f => f.parentId === c._id && !f.trashed);
        });
        BaseFolder.eventer.trigger('refresh');
    }
}

export class Trash extends HierarchicalFolder {
    name: string;
    filtered: (Website | Folder)[];

    constructor() {
        super();
        this.sync();
        this.name = 'trash';
        this._id = 'trash';
    }

    async sync(): Promise<void> {
        let websites = await Folders.websites();
        this.websites.all = websites.filter(
            w => w.trashed && w.myRights.manager
        );
        this.websites.refreshFilters();
        let folders = await Folders.folders();
        this.children.all = folders.filter(
            f => f.trashed
        );
        BaseFolder.eventer.trigger('refresh');
    }

    async removeSelection(): Promise<any> {
        for (let item of this.selection) {
            await item.remove();
            Folders.unprovide(item);
        }

        this.websites.deselectAll();
        this.children.deselectAll();
        await Folders.trash.sync();
    }

    async restoreSelection(): Promise<void> {
        for (let item of this.selection) {
            item.trashed = false;
            await item.save();
        }
        await this.sync();
    }
}

export class Folders{
    private static publicWebsiteProvider: Provider<Website> = new Provider<Website>('/pages/pub/list/all', Website);
    private static websiteProvider: Provider<Website> = new Provider<Website>('/pages/list/all', Website);
    private static folderProvider: Provider<Folder> = new Provider<Folder>('/pages/folder/list/all', Folder);

    static async websites(): Promise<Website[]> {
        let websites: Website[];
        if (model.me) {
            websites = await this.websiteProvider.data();
        }
        else {
            websites = await this.publicWebsiteProvider.data();
        }

        return websites;
    }

    static async folders(): Promise<Folder[]> {
        let folders: Folder[] = await this.folderProvider.data();
        return folders;
    }

    static provideWebsite(website: Website) {
        this.websiteProvider.push(website);
    }

    static provideFolder(folder: Folder) {
        this.folderProvider.push(folder);
    }

    static unprovide(item: Folder | Website) {
        if (item instanceof Folder) {
            this.folderProvider.remove(item);
        }
        else {
            this.websiteProvider.remove(item);
        }
    }

    static async toRoot(website: Website) {
        let folders = await this.folders();
        folders.forEach((f) => {
            let index = f.websitesIds.indexOf(website._id);
            if (index !== -1) {
                f.websitesIds.splice(index, 1);
            }
        });
    }

    static root: Root = new Root();
    static trash: Trash = new Trash();
}

export class Filters {
    static public: boolean;
    static protected: boolean;
}
