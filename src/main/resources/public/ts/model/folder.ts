import { Websites, Website } from './website';
import { Pages, Page } from './page';
import { Cell, Cells } from './cell';
import { Row, Rows } from './row';
import http from 'axios';
import { Rights, Shareable, model, idiom } from 'entcore';
import { Mix, Provider, Selection, Selectable, Eventer } from 'entcore-toolkit';
import { _ } from 'entcore';

//=== Utils
function uniq<T> (arrArg : T[]) {
    return arrArg.filter((elem, pos, arr) => {
        return arr.indexOf(elem) == pos;
    });
}
//
export class BaseFolder implements Selectable {
    websites: Websites;
    selected: boolean;
    name: string;
    static eventer: Eventer = new Eventer();

    constructor(){
        this.websites = new Websites();
    }
    findRessource(id: string): Website | undefined {
        return this.websites && this.websites.all.find(r => r._id == id);
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
            return idiom.translate("pages.projects.root");
        }
        return this.name;
    }

    get shortenedName(): string{
        let shortenedName = this.name;
        if(shortenedName === "root"){
            shortenedName = idiom.translate("pages.projects.root");
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

    findRessource(id: string): Website | undefined {
        const founded = super.findRessource(id);
        if (founded) {
            return founded;
        }
        for (let c of this.children.all) {
            const founded = c.findRessource(id);
            if (founded) {
                return founded;
            }
        }
        return undefined;
    }

    hasAttachedRessource(id: string): boolean {
        return this.websitesIds.filter(r => r == id).length > 0;
    }

    attachRessource(id: string) {
        //add uniq
        this.detachRessource(id);
        this.websitesIds.push(id);
    }

    detachRessource(id: string) {
        this.websitesIds = this.websitesIds.filter(r => r != id);
    }
    async restoreSelection(): Promise<void> {
        //get folders and resources recursively
        const uniqFolders: Folder[] = uniq(this.selection.filter(f=> f instanceof Folder)//only folders
                                    .map(f => f as Folder)//cast to folder
                                    );//return array
        const uniqResources : Website[] = uniq(this.selection.filter(f=> f instanceof Website) as Website[]);
        // restore folders FIRST (resource are unlink if parent still trashed)
        for (let item of uniqFolders) {
            await item.restore();
        }
        // restore resources
        for (let item of uniqResources) {
            await item.restore();
            
        }
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
    async restore(){
        this.trashed = false;
        await this.save();
        const ressources = await Folders.websites();
        const folders = await Folders.folders();
        const parent = folders.find(f=>f._id==this.parentId);
        const shouldUnlink = parent && parent.trashed;
        if(shouldUnlink){
            await this.moveTo("root")
        }
        //restore children
        const children = folders.filter(f=>f.parentId==this._id);
        for(let child of children){
            await child.restore();
        }
        //restore attached ressources
        const cRes = ressources.filter(res=>this.websitesIds.indexOf(res._id)>-1); 
        for(let res of cRes){
            await res.restore();
        }
    }
    async toTrash(): Promise<void> {
        this.trashed = true;
        //be sure tu sync ressources and children before trash recursive
        await this.sync();
        await this.websites.toTrash();
        await this.saveChanges();
        for(let child of this.children.all){
            await child.toTrash();
        }
        await Folders.trash.sync();
        //sync after trash
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
function timeout(ms:number){
    return new Promise((resolve)=>{
        setTimeout(resolve,ms)
    })
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
        await timeout(10)
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
}
export class Folders{
    private static publicWebsiteProvider: Provider<Website> = new Provider<Website>('/pages/pub/list/all', Website);
    private static websiteProvider: Provider<Website> = new Provider<Website>('/pages/list/all', Website);
    private static folderProvider: Provider<Folder> = new Provider<Folder>('/pages/folder/list/all', Folder);

    static async findFoldersContaining(ressource: Website): Promise<Folder[]> {
        let folders = await this.folders();
        const founded = folders.filter((f) => {
            return f.hasAttachedRessource(ressource._id);
        });
        return founded;
    }

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
