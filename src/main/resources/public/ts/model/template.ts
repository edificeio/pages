import { Cell } from './cell';
import { Website } from './website';
import { Page } from './page';
import { Row } from './row';
import { idiom as lang, Behaviours, sniplets } from 'entcore/entcore';
import { _ } from 'entcore/libs/underscore/underscore';

let cells = {
    content: function (row) {
        let content = new Cell();
        content.width = 9;
        content.media.type = 'text';
        content.media.source = lang.translate('pages.default.content');
        row.addCell(content);
    },
    column: function (row, width) {
        let content = new Cell();
        content.width = width;
        content.media.type = 'text';
        content.media.source = lang.translate('pages.default.column');
        row.addCell(content);
    },
    navigation: function (row: Row, website: Website, width: number = 3) {
        let navigation = new Cell();
        navigation.media.type = 'sniplet';
        row.addCell(navigation);
        navigation.width = width;
        if (website._id) {
            navigation.media.source = {
                template: 'navigation',
                application: 'pages',
                source: { _id: website._id }
            };
        } else {
            website.eventer.on('page-added', () => {
                navigation.media.source = {
                    template: 'navigation',
                    application: 'pages',
                    source: { _id: website._id }
                };
                website.save();
            });
        }
    },
    empty: function (row, width, height) {
        let empty = new Cell();
        empty.media.type = undefined;
        row.addCell(empty);
        empty.width = width;
        empty.height = height;
    },
    image: function (row, width, height) {
        let image = new Cell();
        image.width = width;
        image.height = height;
        image.media.type = 'image';
        image.media.source = '/pages/public/filler-images/' + width + 'x' + height + '.png';
        row.addCell(image);
    },
    blog: async function (row, width, website: Website) {
        let blog = new Cell();
        blog.width = width;
        blog.media.type = 'sniplet';
        row.addCell(blog);
        Behaviours.applicationsBehaviours.blog.model.register();

        let createBlog = () => {
            return new Promise((resolve, reject) => {
                let blogCaller = {
                    blog: new Behaviours.applicationsBehaviours.blog.model.Blog(),
                    snipletResource: website,
                    setSnipletSource: function (newBlog) {
                        blog.media.source = {
                            template: 'articles',
                            application: 'blog',
                            source: { _id: newBlog._id }
                        };
                        
                        resolve();
                        website.trigger('change');
                    }
                };
                let blogSniplet = _.findWhere(sniplets.sniplets, { application: 'blog', template: 'articles' });
                blogSniplet.sniplet.controller.createBlog.call(blogCaller);
                website.synchronizeRights();
            });
        };

        website.eventer.on('page-added', () => {
            createBlog();
        });
    },
    smallNote: function (row) {
        let smallNote = new Cell();
        smallNote.media.type = 'text';
        smallNote.media.source = '<h2>' + lang.translate('pages.about') + '</h2><p>' + lang.translate('smallnote.desc') + '</p>';
        smallNote.className = ['black'];
        smallNote.width = 2;
        row.addCell(smallNote);
    },
    footpage: function (row) {
        let footpage = new Cell();
        footpage.width = 9;
        footpage.media.type = 'text';
        footpage.media.source = '<em class="low-importance centered-text twelve cell">' + lang.translate('pages.footer') + '<br />' + lang.translate('pages.footer.contact') + '</em>';
        row.addCell(footpage);
        footpage.height = 1;
    }
};

export let templates = {
    navigationAndContent: async function (page: Page, website: Website): Promise<void> {
        website.eventer.off('page-added');
        let row = page.addRow();
        cells.image(row, 12, 1);
        row = page.addRow();
        cells.navigation(row, website);
        cells.content(row);
        row = page.addRow();
        cells.empty(row, 3, 1);
        cells.footpage(row);
    },
    navigationAndBlog: async function (page: Page, website: Website): Promise<void> {
        website.eventer.off('page-added');
        let row = page.addRow();
        cells.navigation(row, website);
        await cells.blog(row, 7, website);
        cells.smallNote(row);
        row = page.addRow();
        cells.empty(row, 3, 1);
        cells.footpage(row);
    },
    oneColumn: async function (page: Page, website: Website): Promise<void> {
        website.eventer.off('page-added');
        let row = page.addRow();
        cells.content(row);
    },
    twoColumns: async function (page: Page, website: Website): Promise<void> {
        website.eventer.off('page-added');
        let row = page.addRow();
        cells.navigation(row, website, 2);
        cells.column(row, 5);
        cells.column(row, 5);
    }
};