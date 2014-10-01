Behaviours.register('pages', {
	rights: {
		workflow: {
			create: 'fr.wseduc.pages.controllers.PagesController|add',
			share: 'fr.wseduc.pages.controllers.PagesController|share'
		},
		resource: {
			update: 'fr-wseduc-pages-controllers-PagesController|update',
			remove: 'owner',
			share: 'owner'
		}
	},
	loadResources: function(callback){
		http().get('/pages/list/all').done(function(websites){
			var pages = [];
			websites.forEach(function(website){
				if(website.thumbnail){
					website.thumbnail = website.thumbnail + '?thumbnail=48x48';
				}
				else{
					website.thumbnail = '/img/illustrations/pages-default.png'
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
		}.bind(this));
	},
	sniplets: {
		navigation: {
			title: 'Navigation',
			description: 'La navigation permet à vos visiteurs de parcourir les pages de votre site.',
			controller: {
				init: function(){
					var source = this.source;
					this.me = model.me;
					if(source.customLinks){
						this.links = source.customLinks;
						this.custom = true;
						this.snipletDisplay = {};
						return;
					}

					if(model.websites){
						this.links = _.map(model.websites.findWhere({ _id: source._id }).pages.all, function(page){
							return {
								text: page.title,
								href: '/pages#/website/' + source._id + '/' + page.titleLink
							}
						});

						return;
					}
					http().get('/pages/' + this.source._id).done(function(data){
						this.links = _.map(data.pages, function(page){
							return {
								title: page.title,
								titleLink: page.titleLink
							}
						});
						this.$apply('links');
					}.bind(this))
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
				},
				removeLink: function(index){
					this.source.customLinks.splice(index, 1);
				},
				addLink: function(){
					this.source.customLinks.push(this.newLink);
					this.snipletDisplay.enterLink = false;
					if(this.snipletResource && typeof this.snipletResource.save === 'function'){
						this.snipletResource.save();
					}
				}
			}

		}
	}
});