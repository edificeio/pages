console.log('pages behaviours file')

import { Behaviours, model, idiom as lang } from 'entcore';
import http from 'axios';
import { _ } from 'entcore';

Behaviours.register('pages', {
	rights: {
		workflow: {
			create: 'fr.wseduc.pages.controllers.PagesController|add',
			createFolder: 'fr.wseduc.pages.controllers.FoldersController|add',
			createPublic: 'fr.wseduc.pages.controllers.PagesController|addPublic',
			share: 'fr.wseduc.pages.controllers.PagesController|share',
			print: 'fr.wseduc.pages.controllers.PagesController|print'
		},
		resource: {
			update: { right: 'fr-wseduc-pages-controllers-PagesController|update' },
			remove: { right: 'fr-wseduc-pages-controllers-PagesController|delete' },
			share: { right: 'fr-wseduc-pages-controllers-PagesController|share' },
            read: { right: 'fr-wseduc-pages-controllers-PagesController|get' },
            manager: { right: 'fr-wseduc-pages-controllers-PagesController|share' },
            restore: { right: 'fr-wseduc-pages-controllers-PagesController|delete' }
		}
	},
    loadResources: async function (callback) {
        if (this.loading) {
            return;
        }
        this.loading = true;
        let response = await http.get('/pages/list/all');
        this.loading = false;
        let websites = response.data;
		let pages = [];
		websites.forEach(function(website){
			if(website.thumbnail){
				website.thumbnail = website.thumbnail + '?thumbnail=48x48';
			}
			else{
				website.thumbnail = '/img/illustrations/pages.svg'
			}
			website = {
				pages: website.pages,
				title: website.title,
				owner: {
					name: website.owner.displayName,
					userId: website.owner.userId
				},
				icon: website.thumbnail,
				path: '/pages#/website/' + website._id,
				_id: website._id
			};
			pages.push(website);

			website.pages.forEach(function(page){
				pages.push({
					title: page.title,
					owner: website.owner,
					icon: website.thumbnail,
					path: '/pages#/website/' + website._id + '/' + page.titleLink,
					_id: website.id + '/' + page.titleLink
				});
			});
		})
		this.resources = pages;
	},
	sniplets: {
        navigation: {
            public: true,
			title: 'pages.navigation.title',
			description: 'pages.navigation.desc',
			controller: {
				init: function(){
					var source = this.source;
					this.me = model.me;
					this.lang = lang;
					if(source.customLinks){
						this.links = source.customLinks;
						this.custom = true;
						this.snipletDisplay = {};
						return;
					}
                    this.source.landingPage = this.snipletResource.landingPage;
		    this.source._id = this.snipletResource._id;
                    this.links = _.map(this.snipletResource.pages.all, (page) => {
                        let href = '#/website/' + this.source._id + '/' + page.titleLink;
                        if (window.location.hash.startsWith('#/preview/')) {
                            href = '#/preview/' + this.source._id + '/' + page.titleLink;
                        }
						return {
							title: page.title,
                            href: href,
                            published: page.published,
							index: page.index
						}
                    });
					console.log(this.links);
                    this.links = _.reject(this.links, (l) => l.published === false);
					model.one('refresh-nav', () => this.init());
					this.$apply('links')
				},
				initSource: function(){
					Behaviours.applicationsBehaviours.pages.loadResources(function(resources){
						this.pages = resources;
						this.$apply('pages');
					}.bind(this));
				},
				setSource: function(source){
					if(source){
						this.setSnipletSource({
							_id: source._id
						});
					}
					else{
						this.setSnipletSource({
							customLinks: []
						});
                    }
                    this.snipletResource.save();
                },
                refreshIfNeeded(path: string) {
                    if (this.currentLink(path)) {
                        window.location.reload();
                    }
                },
				removeLink: function(index, $event){
					$event.preventDefault();
					this.source.customLinks.splice(index, 1);
				},
				addLink: function(){
					this.newLink.external = true;

					if(this.newLink.href.indexOf('http') === -1 && this.newLink.href.indexOf('/pages') !== -1){
						this.newLink.external = false;
					}

					this.source.customLinks.push(this.newLink);
					this.snipletDisplay.enterLink = false;
					this.newLink = {};
					if(this.snipletResource && typeof this.snipletResource.save === 'function'){
						this.snipletResource.save();
					}
				},
                currentLink: function (link) {
                    let samePath = link.href.split('#')[1] === window.location.hash.split('#')[1];
                    let landingPage = this.source.landingPage === link.href.split('/')[2];
					return samePath || landingPage;
				},
				getReferencedResources: function(source){
					return [];
				}
			}

		}
	}
});
