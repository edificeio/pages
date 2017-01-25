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
        this.cells.forEach((c) => c.page = this.page);
    }

    get remainingSpace(): number {
        var maxSize = 12;
        var usedSpace = 0;
        this.cells.all.forEach((cell) => {
            usedSpace += cell.width;
        });
        return maxSize - usedSpace;
    }

    addFillerCell() {
        let cell = new Cell();
        cell.page = this.page;
        cell.width = 4;
        cell.row = this.index;

        cell.media = {};
        this.cells.all.push(cell);
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

    addCell(cell: Cell): Cell {
        cell.index = this.cells.all.length;
        cell.page = this.page;
        cell.row = this.index;
        this.cells.push(cell);
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
    }

    removeCell(cell: Cell) {
        let leftNeighbour = this.cells.previous(cell);
        let rightNeighbour = this.cells.next(cell);
        if (leftNeighbour && rightNeighbour) {
            leftNeighbour.width += cell.width / 2;
            rightNeighbour.width += cell.width / 2 + cell.width % 2;
        }
        if (!leftNeighbour) {
            if (!rightNeighbour) {
                this.page.removeRow(this);
                return;
            }
            rightNeighbour.width += cell.width;
        }
        if (!rightNeighbour) {
            leftNeighbour.width += cell.width;
        }
        this.cells.removeCell(cell);
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
        this.addFillerRow();
    }

    addFillerRow(): Row {
        let hasFillerRow = false;
        if (this.last) {
            hasFillerRow = true;
            this.last.cells.forEach((c) => {
                hasFillerRow = hasFillerRow && !c.media.type
            });
        }
        
        if (hasFillerRow) {
            return;
        }
        let row = this.addRow();
        for (let i = 0; i < 3; i++) {
            row.addFillerCell();
        }
        return row;
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