import { Folder, Folders, Filters } from './folder';
import { Pages, Page, Row, Cell, SnipletSource } from './index';
import { Structure, Group, Publication, Application, Role } from './publish';
import { HttpResponse, Eventer, Mix, Selection, Selectable, TypedArray, Model, Autosave } from 'entcore-toolkit';
import http from "axios";
import { model, notify, Behaviours, sniplets, Shareable, Rights, cleanJSON } from 'entcore/entcore';
import { _ } from 'entcore/libs/underscore/underscore';
import { moment } from 'entcore/libs/moment/moment';

export class Website extends Model<Website> implements Selectable, Shareable {
    static eventer = new Eventer();
    selected: boolean;
    pages: Pages;
    newPage: Page;
    published: { [structure:string]: { application: Application, groups: Group[], role: Role }};
    icon: string;
    title: string;
    eventer: Eventer;
    _id: string;
    visibility: 'PUBLIC' | 'PRIVATE';
    landingPage: string;
    description: string;
    status: 'PUBLISHED' | 'DRAFT';
    rights: Rights<Website>;
    owner: { userId: string, displayName: string };
    shared: any;
    _backup: string;
    trashed: boolean;

    constructor() {
        super({
            update: '/pages/:_id',
            sync: '/pages/:_id'
        });

        this.pages = new Pages();
        this.eventer = new Eventer();
        this.eventer.on('save', () => Website.eventer.trigger('save'));
        this.rights = new Rights(this);
    }

    get myRights() {
        return this.rights.myRights;
    }

    get shortenedTitle(): string{
        let shortenedTitle = this.title;
        if(shortenedTitle.length > 30){
            shortenedTitle = shortenedTitle.substr(0, 26) + '...';
        }
        return shortenedTitle;
    }

    modified: {
        $date: number
    };
    created: {
        $date: number
    };

    get lastModified(): string {
        return moment(this.modified.$date).format('DD/MM/YYYY');
    }

    async toTrash(): Promise<void> {
        this.trashed = true;
        if(this.published){
            for(let structure in this.published){
                try{
                    await http.delete('/appregistry/application/external/' + this.published[structure].application.id)
                }
                catch(e){}
            }
        }
        delete this.published;
        await this.save();
        Folders.trash.sync();
        await this.save();
    }

    watchChanges(){
        Autosave.watch(() => this.update(), this);
    }

    url(params?: { relative?: boolean }): string {
        if (!this._id) {
            return '';
        }
        var path = window.location.origin + '/pages#/website/';
        if (this.visibility === 'PUBLIC') {
            path = window.location.origin + '/pages/p/website#/website/';
        }
        if (!params || !params.relative) {
            return path + this._id;
        }
        else {
            path = '/pages#/website/';
            if (this.visibility === 'PUBLIC') {
                path = '/pages/p/website#/website/';
            }
            return path + this._id;
        }
    }

    async updateApplication(): Promise<any> {
        let promises: Promise<HttpResponse>[] = [];

        if (model.me.functions.ADMIN_LOCAL && this.published) {
            for (var structureId in this.published) {
                let icon = "/img/illustrations/pages-default.png"
                if (this.icon) {
                    icon = this.icon + '?thumbnail=150x150'
                }
                promises.push(
                    http.put('/appregistry/application/conf/' + this.published[structureId].application.id, {
                        grantType: "authorization_code",
                        displayName: this.title,
                        secret: "",
                        address: this.url({ relative: true }),
                        icon: icon,
                        target: "",
                        scope: "",
                        name: this.title
                    })
                );
            }
        }

        return Promise.all(promises);
    }

    async removePage(page: Page): Promise<void> {
        this.pages.remove(page);
        await this.save();
    }

    async createWebsite (): Promise<any> {
        let path = '/pages';
        if (this.visibility === 'PUBLIC') {
            path = '/pages/p';
        }
        let response = await http.post(path, this);

        response.data.owner = {
            displayName: model.me.username,
            userId: model.me.userId
        };
        response.data.modified = { $date: new Date() };
        Mix.extend(this, response.data);
        this.eventer.trigger('post');
        Behaviours.findRights('pages', this);
        Folders.provideWebsite(this);
    }

    async save(): Promise<void> {
        if (this._backup === JSON.stringify(this)) {
            return;
        }
        this._backup = JSON.stringify(this);

        if (this._id) {
            await this.update();
        }
        else {
            await this.createWebsite();
        }

        Website.eventer.trigger('save');
    }

    async remove(): Promise<void> {
        Folders.unprovide(this);
        await http.delete('/pages/' + this._id);
    }

    async setTemplate(): Promise<void> {
        await this.newPage.fromTemplate(this);
    }

    trigger(event: string) {
        if (event === 'change') {
            this.save();
        }
        this.eventer.trigger(event);
    }

    async fromJSON(website){
        if (website.pages instanceof Array) {
            this.pages = new Pages(Mix.castArrayAs(Page, website.pages));
            this.pages.forEach((p) => p.website = this);
            this.pages.eventer.on('save', () => this.save());
        }
        await this.rights.fromBehaviours();
    }

    async useNewPage(): Promise<Page> {
        await this.save();
        
        let page = this.newPage;
        this.newPage.published = true;
        this.newPage.setTitleLink();
        this.newPage.fromTemplate(this);
        this.pages.push(this.newPage);
        if(!this.landingPage){
            this.landingPage = this.pages.all[0].titleLink;
        }
        this.newPage = undefined;
        this.eventer.trigger('page-added');
        return page;
    }

    initNewPage(){
        this.newPage = new Page();
        this.newPage.website = this;
    }

    toJSON(){
        let referencedResources = {};
        function getPagesReferencedResources(page: Page){
            page.rows.all.forEach(function (row: Row) {
                row.cells.all.forEach(function (cell: Cell) {
                    if (cell.media.source && cell.media.type === 'sniplet') {
                        let source = cell.media.source as SnipletSource;
                        if (!referencedResources[source.application]) {
                            referencedResources[source.application] = [];
                        }
                        var sniplet = _.findWhere(sniplets.sniplets, { application: source.application, template: source.template });
                        if (sniplet && typeof sniplet.sniplet.controller.getReferencedResources === 'function' && source.source) {
                            referencedResources[source.application] = referencedResources[source.application].concat(
                                sniplet.sniplet.controller.getReferencedResources(source.source)
                            );
                        }
                    }
                });
            });
        }

        this.pages.all.forEach(getPagesReferencedResources);

        return {
            title: this.title,
            pages: this.pages,
            landingPage: this.landingPage,
            description: this.description,
            published: cleanJSON(this.published),
            referencedResources: referencedResources,
            visibility: this.visibility,
            icon: this.icon,
            trashed: this.trashed
        };
    }

    synchronizeRights() {
        let referencedResources = JSON.parse(JSON.stringify(this)).referencedResources;
        for (let application in referencedResources) {
            Behaviours.copyRights({
                provider: {
                    application: 'pages',
                    resource: this
                },
                target: {
                    application: application,
                    resources: referencedResources[application]
                }
            });
        }
    }

    async moveTo(target: string | Folder): Promise<void> {
        await Folders.toRoot(this);

        if (target instanceof Folder && target._id) {
            target.websitesIds.push(this._id);
            await target.sync();
        }
        else {
            await Folders.root.sync();
            if (target === 'trash') {
                await this.toTrash();
            }
        }
        await this.save();
    }

    copy(): Website {
        let data = JSON.parse(JSON.stringify(this));
        data.published = undefined;
        data.title = "Copie_" + data.title;
        return Mix.castAs(Website, data);
    }
}

export class Websites {
    filtered: Website[];
    sel: Selection<Website>;

    get all(): Website[] {
        return this.sel.all;
    }

    set all(list: Website[]) {
        this.sel.all = list;
    }

    constructor() {
        this.sel = new Selection([]);
    }

    async fill(websitesIds: string[]): Promise<void> {
        let websites = await Folders.websites();
        this.all = websites.filter(
            w => websitesIds.indexOf(w._id) !== -1 && !w.trashed
        );
        this.refreshFilters();
    }

    async duplicateSelection(): Promise<void> {
        for (let website of this.sel.selected) {
            let copy = website.copy();
            await copy.save();
            await copy.rights.fromBehaviours();
            this.all.push(copy);
            Folders.provideWebsite(copy);
        }
        this.refreshFilters();
    }

    removeSelection() {
        this.sel.selected.forEach(function (website) {
            website.remove();
        });
        this.sel.removeSelection();
        notify.info('pages.websites.removed');
    }

    async toTrash(): Promise<any> {
        for (let website of this.all) {
            await website.toTrash();
        }
    }

    removeWebsite(website: Website) {
        let index = this.all.indexOf(website);
        this.all.splice(index, 1);
    }

    refreshFilters(){
        this.filtered = this.all.filter(
            w => (w.visibility === 'PUBLIC' && Filters.public) || (w.visibility !== 'PUBLIC' && Filters.protected)
        );
    }

    deselectAll() {
        this.sel.deselectAll();
    }
}
