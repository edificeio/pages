import { Website } from './website';
import { Row, Rows } from './row';
import { Cell } from './cell';
import { idiom as lang, model } from 'entcore/entcore';
import { Mix, Selectable, Eventer } from 'entcore-toolkit';
import { $ } from 'entcore/libs/jquery/jquery';
import { _ } from 'entcore/libs/underscore/underscore';

let Sass = require('sass.js');
Sass.setWorkerUrl('/pages/public/dist/sass-js/sass.worker.js');

let sass = new Sass();

export class Page implements Selectable {
    titleLink: string;
    title: string;
    rows: Rows;
    index: number;
    selected: boolean;
    website: Website;
    eventer: Eventer;
    published: boolean;
    show: any;
    sass: string;
    hasGrids: boolean;
    owner: string;

    constructor(pageName?: string) {
        if (pageName && typeof pageName === 'string') {
            this.title = pageName;
            this.setTitleLink();
        }

        this.owner = model.me.userId;
        this.eventer = new Eventer();
        this.rows = new Rows(this);
    }

    get weight(): number {
        let weight = 0;
        this.rows.forEach((r) => {
            weight += r.weight;
        });

        return weight;
    }

    applySASS() {
        if ($('.page-sass').length === 0) {
            $('<style>')
                .addClass('page-sass')
                .attr('type', 'text/css')
                .appendTo('body');
        }

        let sassNode = $('.page-sass');
        sass.compile('.pages-grid, css-editor .preview{' + (this.sass || '') + '}', function (result) {
            sassNode.text(result.text);
        });
    }

    fromJSON(page) {
        this.hasGrids = _.find(page.rows, (r) => _.find(r.cells, (c) => c.media.type === 'grid') !== undefined) !== undefined;
        this.rows = new Rows(this, Mix.castArrayAs(Row, JSON.parse(JSON.stringify(page.rows)), this));
        if (page.published === undefined) {
            this.published = true;
        }
    }

    toJSON() {
        return {
            title: this.title,
            titleLink: this.titleLink,
            href: this.url(),
            rows: this.rows,
            index: this.index,
            published: this.published,
            sass: this.sass,
            owner: this.owner
        }
    }

    fromTemplate(website: Website) {
        this.rows.empty();
        website.eventer.off('page-added');
        let row = this.addRow();
        
        let navigation = new Cell();
        navigation.media.type = 'sniplet';
        row.addCell(navigation);
        navigation.width = 3;
        navigation.media.source = {
            template: 'navigation',
            application: 'pages',
            source: { _id: website._id }
        };

        let content = new Cell();
        content.width = 9;
        content.media.type = 'text';
        content.media.source = lang.translate('pages.default.content');
        row.addCell(content);
    }

    publish() {
        this.published = true;
    }

    unpublish() {
        this.published = false;
    }

    url() {
        if (!this.website) {
            return '';
        }
        var path = '/pages#/website/';
        if (this.website.visibility === 'PUBLIC') {
            path = '/pages/p/website#/website/';
        }
        return path + this.website._id + '/' + this.titleLink;
    }

    setTitleLink(){
        let titleLink = encodeURIComponent(lang.removeAccents(
            this.title.replace(/\ |\:|\?|#|%|\$|£|\^|\*|€|°|\(|\)|\[|\]|§|'|"|&|ç|ù|`|=|\+|<|@/g, '')
        ).toLowerCase());

        let i = 1;
        let findName = (append) => {
            if (_.findWhere(this.website.pages.all, { titleLink: titleLink + append }) !== undefined) {
                append = '-' + i;
                i++;
                return findName(append);
            }
            else{
                return titleLink + append;
            }
        }
        let foundName = findName('');
        this.titleLink = foundName;
    }

    copyFrom(page: Page){
        this.rows.all = JSON.parse(JSON.stringify(page.rows));
    }

    addRow() {
        return this.rows.addRow();
    }

    addRowAt(index: number) {
        return this.rows.addRowAt(index);
    }

    removeRow(row: Row) {
        this.rows.removeRow(row);
    }

    async remove(): Promise<void> {
        await this.website.removePage(this);
    }

    setLanding() {
        this.website.landingPage = this.titleLink;
    }

    duplicate() {
        let data = JSON.parse(JSON.stringify(this));
        let duplicate: Page = Mix.castAs(Page, data);
        duplicate.website = this.website;
        duplicate.title = this.title + ' (Copie)';
        duplicate.setTitleLink();
        this.website.pages.push(duplicate);
    }
}

export class Pages {
    private _all: Page[];
    eventer: Eventer;

    constructor(arr?: Page[]) {
        this._all = [];
        if (arr instanceof Array) {
            this._all = arr;
        }
        this.eventer = new Eventer();
    }

    forEach(cb: (p: Page) => void) {
        this.all.forEach(cb);
    }

    setLinks() {
        this.all.forEach((p) => p.setTitleLink());
    }

    push(page: Page){
        this._all.push(page);
    }

    get all(): Page[] {
        return this._all;
    }

    set all(list: Page[]) {
        list = Mix.castArrayAs(Page, list);
        this._all = list;
    }

    toJSON(){
        return this._all;
    }

    landingPage(website: Website, editMode: boolean = false): Page {
        let match = this.all.filter(p => p.titleLink === website.landingPage && (p.published !== false || editMode));
        if (match.length) {
            return match[0];
        }
        let published = this.all.filter((p) => p.published !== false || editMode);
        if (published.length) {
            return published[0];
        }
        return undefined;
    }

    matchingPath(path: string, website: Website, editMode: boolean = false): Page {
        const match = this.all.filter(p => p.titleLink === path && (p.published || editMode));
        if (match.length) {
            return match[0];
        }
        return this.landingPage(website);
    }

    remove(page: Page) {
        let index = this._all.indexOf(page);
        this._all.splice(index, 1);
    }
}