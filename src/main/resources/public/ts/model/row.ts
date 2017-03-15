import { Cell, Cells } from './cell';
import { Page } from './page';
import { Mix, Eventer } from 'toolkit';

export class Row {
    cells: Cells;
    index: number;
    page: Page;

    constructor(page: Page) {
        this.page = page;
        this.cells = new Cells();
    }

    toJSON() {
        return {
            cells: this.cells,
            index: this.index
        }
    }

    fromJSON(row) {
        this.cells = new Cells(Mix.castArrayAs(Cell, row.cells as any));
        this.cells.forEach((c) => {
            c.page = this.page;
            c.row = this;
        });
        this.cells.all.sort((c1, c2) => c1.index - c2.index);
    }

    get remainingSpace(): number {
        var maxSize = 12;
        var usedSpace = 0;
        this.cells.all.forEach((cell) => {
            usedSpace += cell.width;
        });
        return maxSize - usedSpace;
    }

    addEmptyCell(width: number, height: number) {
        let cell = new Cell();
        cell.height = height;
        cell.width = width;
        while (this.width > 12) {
            cell.width--;
        }
        this.addCell(cell);
    }

    addCellAt(cell: Cell, index: number): Cell {
        this.cells.forEach(c => {
            if(c.index >= index){
                c.index ++;
            }
        })
        cell.index = index;
        cell.page = this.page;
        cell.row = this;
        this.cells.push(cell);
        this.cells.all.sort((c1, c2) => c1.index - c2.index);
        this.cells.forEach((c, i) => {
            c.index = i;
        });
        return cell;
    }

    moveCell(cell: Cell, index: number){
        this.cells.forEach(c => {
            if(c.index >= index){
                c.index ++;
            }
        });
        cell.index = index;
        this.cells.all.sort((c1, c2) => c1.index - c2.index);
        this.cells.forEach((c, i) => {
            c.index = i;
        });
    }

    addCell(cell: Cell): Cell {
        cell.index = this.cells.all.length;
        cell.page = this.page;
        cell.row = this;
        this.cells.push(cell);
        this.cells.all.sort((c1, c2) => c1.index - c2.index);
        return cell;
    }

    swap(cell: Cell, cell2: Cell) {
        let temp = JSON.parse(JSON.stringify(cell.media));
        cell.media = JSON.parse(JSON.stringify(cell2.media));
        cell2.media = temp;
        let tempStyle = JSON.parse(JSON.stringify(cell.style));
        cell.style = JSON.parse(JSON.stringify(cell2.style));
        cell2.style = tempStyle;
        let tempTitle = cell.title;
        cell.title = cell2.title;
        cell2.title = tempTitle;
    }

    removeAt(index: number) {
        this.cells.removeAt(index);
        this.cells.forEach((c, i) => {
            c.index = i;
        });
    }

    removeCell(cell: Cell) {
        this.cells.removeCell(cell);
        if(this.cells.length === 0){
            this.page.removeRow(this);
            return;
        }
        let newCellWidth = 12 / this.cells.length;
        this.cells.forEach(c => c.width = newCellWidth);
        if(this.cells.length * newCellWidth < 12){
            let filler = this.cells.all[parseInt(this.cells.length / 2)];
            filler.width += 12 % (this.cells.length * newCellWidth);
        }
        this.cells.forEach((c, i) => {
            c.index = i;
        });
    }

    get weight(): number {
        let weight = 0;
        this.cells.forEach((c) => {
            weight += c.weight;
        });

        return weight;
    }

    get width(): number {
        let width = 0;
        this.cells.forEach((c) => width += c.width);
        return width;
    }
}

export class Rows {
    private _all: Row[];
    page: Page;
    static eventer: Eventer = new Eventer();

    constructor(page: Page, arr?: Row[]) {
        this.page = page;
        this._all = [];
        if (arr instanceof Array) {
            arr = arr.map(r => {
                r.page = page;
                return r;
            });
            this._all = arr;
        }
    }

    toJSON(){
        return this._all;
    }

    addRow(): Row {
        let row = new Row(this.page);
        this.all.push(row);
        Rows.eventer.trigger('add-row');
        return row;
    }

    removeRow(row: Row) {
        let index = this.all.indexOf(row);
        this.all.splice(index, 1);
    }

    insertAfter(newRow: Row, ref: Row) {
        let index = this.all.indexOf(ref);
        this.all.splice(index + 1, 0, newRow);
    }

    get last(): Row {
        return this.all[this.all.length - 1];
    }

    get all(): Row[] {
        return this._all;
    }

    set all(list: Row[]) {
        list = Mix.castArrayAs(Row, list);
        this._all = list;
    }

    empty() {
        this._all.splice(0, this.all.length);
    }
    
    forEach(fn: (item: Row) => void) {
        this.all.forEach(fn);
    }
}