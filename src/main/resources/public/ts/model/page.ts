import { Website } from './website';
import { Row, Rows } from './row';
import { templates } from './template';
import { idiom as lang } from 'entcore/entcore';
import { Mix, Selectable, Eventer } from 'toolkit';
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

    constructor(pageName?: string) {
        if (pageName && typeof pageName === 'string') {
            this.title = pageName;
            this.setTitleLink();
        }

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
            sass: this.sass
        }
    }

    async fromTemplate(templateName: string, website: Website): Promise<void> {
        this.rows.empty();
        await templates[templateName](this, website);
    }

    publish() {
        this.published = true;
        this.eventer.trigger('save');
    }

    unpublish() {
        this.published = false;
        this.eventer.trigger('save');
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
        this.titleLink = encodeURIComponent(lang.removeAccents(
            this.title.replace(/\ |\:|\?|#|%|\$|£|\^|\*|€|°|\(|\)|\[|\]|§|'|"|&|ç|ù|`|=|\+|<|@/g, '')
        ).toLowerCase())
    }

    copyFrom(page: Page){
        this.rows.all = JSON.parse(JSON.stringify(page.rows));
    }

    addRow() {
        return this.rows.addRow();
    }

    removeRow(row: Row) {
        this.rows.removeRow(row);
    }

    addFillerRow() {
        return this.rows.addFillerRow();
    }

    async remove(): Promise<void> {
        await this.website.removePage(this);
    }

    setLanding() {
        this.website.landingPage = this.titleLink;
        this.eventer.trigger('save');
    }

    duplicate() {
        let data = JSON.parse(JSON.stringify(this));
        let duplicate: Page = Mix.castAs(Page, data);
        duplicate.website = this.website;
        duplicate.title = this.title + ' (Copie)';
        duplicate.setTitleLink();
        this.website.pages.push(duplicate);
        this.eventer.trigger('save');
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
        this._all.forEach((p) => {
            p.eventer.on('save', () => this.eventer.trigger('save'));
        })
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

    landingPage(website: Website): Page {
        let match = this.all.filter(p => p.titleLink === website.landingPage && p.published !== false);
        if (match.length) {
            return match[0];
        }
        let published = this.all.filter((p) => p.published !== false);
        if (published.length) {
            return published[0];
        }
        return undefined;
    }

    matchingPath(path: string, website: Website): Page {
        let match = this.all.filter(p => p.titleLink === path);
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