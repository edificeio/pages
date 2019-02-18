import { Mix } from 'entcore-toolkit';
import { Page } from './page';
import { Rows, Row } from './row';
import { cleanJSON, idiom } from 'entcore';
import http from 'axios';

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
    showEmbedder: boolean;
}

export class Cell {
    focus: boolean;
    width: number;
    height: number;
    media: Media;
    className: string[];
    index: number;
    row: Row;
    page: Page;
    style: any;
    title: string;
    flash: boolean;

    constructor() {
        this.media = {showEmbedder: false};
        this.style = {};
    }

    removeFromRow(){
        this.row.removeCell(this);
    }

    setContent(item: any): Promise<any>{
        if(item.type === 'sniplet'){
            this.title = idiom.translate(item.source.title);
        }
        this.media = { type: 'empty', showEmbedder: false };
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (item.path) {
                    http.get(item.path).then(response => {
                        let media: Media = {
                            type: 'text',
                            source: response.data,
                            showEmbedder: false
                        };
                        item = media;
                        this.source(JSON.parse(JSON.stringify(item)));
                        resolve();
                    });
                    
                }
                else{
                    this.source(JSON.parse(JSON.stringify(item)));
                    resolve();
                }
            }, 250);
        });
        
    }

    source(source: Media){
        this.media = source;
    }

    toJSON() {
        const media: {source?, type?} = {};
        if(this.media.source) {
            media.source = this.media.source;
        }
        if(this.media.type) {
            media.type = this.media.type;
        }
        return {
            width: this.width,
            height: this.height,
            index: this.index,
            className: this.className,
            media: cleanJSON(media),
            style: cleanJSON(this.style),
            title: this.title
        }
    }

    fromJSON(data) {
        if (data.media.type === 'grid') {
            let source = Mix.castAs(Page, data.media.source);
            this.media.source = source;
            this.media.showEmbedder = false;
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
        if(list.length && !(list[0] instanceof Cell)){
            list = Mix.castArrayAs(Cell, list);
        }
        
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