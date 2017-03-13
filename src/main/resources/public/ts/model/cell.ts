import { Mix } from 'toolkit';
import { Page } from './page';
import { Rows, Row } from './row';
import { cleanJSON } from 'entcore/entcore';

export let cellSizes = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

let weights = {
    sniplet: 5,
    text: 0.3,
    image: 1,
    sound: 1,
    video: 5,
    grid: 3
};

export interface SnipletSource{
    application?: string;
    source?: any;
    template?: string;
}

export interface Media {
    source?: string | SnipletSource | Page;
    type?: string;
}

export class Cell {
    width: number;
    height: number;
    media: Media;
    className: string[];
    index: number;
    row: number;
    page: Page;
    style: any;
    title: string;
    flash: boolean;

    constructor() {
        this.media = {};
        this.style = {};
    }

    source(source: Media){
        this.media = source;
    }

    toJSON() {
        return {
            width: this.width,
            height: this.height,
            index: this.index,
            className: this.className,
            media: cleanJSON(this.media),
            style: cleanJSON(this.style),
            title: this.title
        }
    }

    fromJSON(data) {
        if (data.media.type === 'grid') {
            let source = Mix.castAs(Page, data.media.source);
            this.media.source = source;
        }
    }

    get weight(): number {
        return weights[this.media.type] || 0;
    }
}

export class Cells {
    private _all: Cell[];

    constructor(arr?: Cell[]) {
        this._all = [];
        if (arr instanceof Array) {
            this._all = arr;
        }
    }

    get length(): number{
        return this.all.length;
    }

    forEach(fn: (c: Cell, i: number) => void) {
        this.all.forEach(fn);
    }

    removeCell(cell: Cell) {
        let index = this.all.indexOf(cell);
        this._all.splice(index, 1);
    }

    removeAt(index: number) {
        this.all.splice(index, 1);
    }

    push(cell: Cell) {
        this.all.push(cell);
    }

    toJSON() {
        return this._all;
    }

    get all(): Cell[] {
        return this._all;
    }

    set all(list: Cell[]) {
        list = Mix.castArrayAs(Cell, list);
        this._all = list;
    }

    get last(): Cell {
        return this.all[this.all.length - 1];
    }

    get first(): Cell {
        return this.all[0];
    }

    previous(cell: Cell) {
        let index = this.all.indexOf(cell);
        if (index === 0) {
            return undefined;
        }
        return this.all[index - 1];
    }

    next(cell: Cell) {
        let index = this.all.indexOf(cell);
        if (index === this.all.length - 1) {
            return undefined;
        }
        return this.all[index + 1];
    }
}