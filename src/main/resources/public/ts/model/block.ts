import http from "axios";
import { _ } from 'entcore/libs/underscore/underscore';
import { idiom } from 'entcore';

export interface Block {
    name: string;
    title: string;
    description: string;
    keywords: string;
    path: string;
}

export class Blocks {
    static all: Block[];
    static index: number = 4;

    static async sync(): Promise<void> {
        let response = await http.get('/pages/public/template/blocks/index.json');
        this.all = _.map(response.data, (blockName) => ({
            name: blockName,
            title: idiom.translate('blocks.' + blockName + '.title'),
            description: idiom.translate('blocks.' + blockName + '.description'),
            keywords: idiom.translate('blocks.' + blockName + '.keywords'),
            path: '/pages/public/template/blocks/' + blockName + '.html'
        }));
    }

    static next() {
        this.index += 3;
    }
}