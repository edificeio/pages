console.log('pages behaviours file')

Behaviours.register('pages', {
	rights: {
		workflow: {
			create: 'fr.wseduc.pages.controllers.PagesController|add',
			share: 'fr.wseduc.pages.controllers.PagesController|share'
		},
		resource: {
			update: { right: 'fr-wseduc-pages-controllers-PagesController|update' },
			remove: { right: 'fr-wseduc-pages-controllers-PagesController|delete' },
			share: { right: 'fr-wseduc-pages-controllers-PagesController|share' },
			read: { right: 'fr-wseduc-pages-controllers-PagesController|get' }
		}
	},
	model: {
		Cell: function(index){
			if(typeof index !== 'object'){
				this.media = {
				};
				this.index = index;
				this.className = ['transparent'];
			}
			else{
				if(index.media.type === 'grid'){
					this.media.source = new Behaviours.applicationsBehaviours.pages.model.Page(index.media.source);
				}
			}
		},
		Row: function(data){
			this.collection(Behaviours.applicationsBehaviours.pages.model.Cell);
			if(data && data.cells){
				this.cells.load(data.cells);
			}
		},
		Page: function(data){
			this.collection(Behaviours.applicationsBehaviours.pages.model.Row);
			if(data && data.rows){
				this.rows.load(data.rows);
			}
		},
		Website: function(data){
			this.collection(Behaviours.applicationsBehaviours.pages.model.Page);
			if(data && data.pages){
				this.pages.load(data.pages);
			}
		},
		register: function(){
			this.Cell.prototype.buildSubGrid = function(){
				this.media.type = 'grid';
				var fillingCell = new Behaviours.applicationsBehaviours.pages.model.Cell();
				this.media.source = new Behaviours.applicationsBehaviours.pages.model.Page();
				this.media.source.addRow();
				this.media.source.rows.first().addCell(fillingCell);
				fillingCell = new Behaviours.applicationsBehaviours.pages.model.Cell();
				this.media.source.addRow();
				this.media.source.rows.all[1].addCell(fillingCell);
				this.className.push('sub-grid');
			};

			this.Row.prototype.remainingSpace = function(){
				var maxSize = 12;
				var usedSpace = 0;
				this.cells.forEach(function(cell){
					usedSpace += cell.width;
				});
				return maxSize - usedSpace;
			};

			this.Row.prototype.addCell = function(cell){
				cell.width = 1;
				cell.index = this.cells.length();
				cell.row = this.index;

				var remainingSpace = this.remainingSpace();

				if(remainingSpace === 0){
					var newSize = parseInt(12 / (this.cells.length() + 1));
					if(newSize > 3){
						this.cells.forEach(function(cell){
							cell.width = newSize;
						});
						setTimeout(function(){
							cell.width = newSize;
							this.cells.trigger('change');
						}.bind(this), 50);

						this.cells.push(cell);
						return cell;
					}
					return false;
				}
				if(remainingSpace > 0){
					cell.width = remainingSpace;
					this.cells.push(cell);
					return cell;
				}
			};

			this.Row.prototype.hasLeftOvers = function(){
				return this.cells.length() !== 12;
			};

			this.Row.prototype.setIndex = function(cell, index){
				this.cells.remove(cell);
				this.cells.insertAt(index, cell);
				this.cells.forEach(function(item, index){
					item.index = index;
				});
			};

			this.Page.prototype.addRow = function(){
				var row = new Behaviours.applicationsBehaviours.pages.model.Row();
				this.rows.push(row);
				row.index = this.rows.length() - 1;
				return row;
			};

			this.Page.prototype.addRowAt = function(previousRow){
				var row = new Behaviours.applicationsBehaviours.pages.model.Row();
				this.rows.insertAt(this.rows.getIndex(previousRow) + 1, row);
				row.index = this.rows.getIndex(previousRow) + 1;
				return row;
			};

			this.Page.prototype.moveRowUp = function(row){
				this.rows.moveUp(row);
			};

			this.Page.prototype.moveRowDown = function(row){
				this.rows.moveDown(row);
			};

			this.Page.prototype.moveCell = function(cell, newIndex){
				this.rows.find(function(row){
					return row.cells.all.indexOf(cell) !== -1;
				}).cells.remove(cell);
				this.rows.findWhere({ index: newIndex }).cells.insertAt(cell.index, cell);
			};

			this.Page.prototype.toJSON = function(){
				return {
					title: this.title,
					titleLink: this.titleLink,
					rows: this.rows,
					index: this.index
				}
			};

			this.Page.prototype.url = function(website){
				var path = window.location.origin + '/pages#/website/';
				if(website.visibility === 'PUBLIC'){
					path = window.location.origin + '/pages/p/website#/website/';
				}
				return path + website._id + '/' + this.titleLink;
			};

			this.Website.prototype.url = function(params){
				if(!this._id){
					return '';
				}
				var path = window.location.origin + '/pages#/website/';
				if(this.visibility === 'PUBLIC'){
					path = window.location.origin + '/pages/p/website#/website/';
				}
				if(!params || !params.relative){
					return path + this._id;
				}
				else{
					path = '/pages#/website/';
					if(this.visibility === 'PUBLIC'){
						path = '/pages/p/website#/website/';
					}
					return path + this._id;
				}
			};

			this.Website.prototype.remove = function(){
				http().delete('/pages/' + this._id);
				model.websites.remove(this);
			};

			this.Website.prototype.createWebsite = function(cb){
				http().postJson('/pages', this).done(function(data){
					data.owner = { displayName: model.me.username, userId: model.me.userId };
					this.updateData(data);
					this.behaviours('pages');
					if(model.websites){
						model.websites.push(this);
					}
					if(typeof cb === 'function'){
						cb();
					}
				}.bind(this));
			};

			this.Website.prototype.saveModifications = function(cb){
				http().putJson('/pages/' + this._id, this).done(function(){
					if(typeof cb === 'function'){
						cb();
					}
				});
			};

			this.Website.prototype.save = function(cb){
				if(this._id){
					this.saveModifications(cb);
				}
				else{
					this.createWebsite(cb);
				}
			};

			this.Website.prototype.sync = function(cb){
				http().get('/pages/' + this._id).done(function(data){
					this.updateData(data);
					if(typeof cb === 'function'){
						cb();
					}
				}.bind(this));
			};

			this.Website.prototype.toJSON = function(){
				var referencedResources = {};
				function getPagesReferencedResources(page){
					page.rows.forEach(function(row){
						row.cells.forEach(function(cell){
							if(cell.media.type === 'sniplet'){
								if(!referencedResources[cell.media.source.application]){
									referencedResources[cell.media.source.application] = [];
								}
								var sniplet = _.findWhere(sniplets.sniplets, { application: cell.media.source.application, template: cell.media.source.template });
								if(typeof sniplet.sniplet.controller.getReferencedResources === 'function'){
									referencedResources[cell.media.source.application] = referencedResources[cell.media.source.application].concat(
										sniplet.sniplet.controller.getReferencedResources(cell.media.source.source)
									);
								}
							}
							if(cell.media.type === 'grid'){
								getPagesReferencedResources(cell.media.source);
							}
						});
					});
				}

				this.pages.forEach(getPagesReferencedResources);

				return {
					title: this.title,
					pages: this.pages,
					landingPage: this.landingPage,
					description: this.description,
					published: this.published,
					referencedResources: referencedResources,
					markups: this.markups,
					visibility: this.visibility,
					icon: this.icon
				};
			};

			this.Website.prototype.synchronizeRights = function(){
				var referencedResources = JSON.parse(JSON.stringify(this)).referencedResources;
				for(var application in referencedResources){
					Behaviours.copyRights({
						provider: {
							application: 'pages',
							resource: this
						},
						target: {
							application: application,
							resources: referencedResources[application]
						}
					});
				}
			};

			model.makeModels(Behaviours.applicationsBehaviours.pages.model);
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
			this.resources = pages;
			callback(this.resources);
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
					this.lang = lang;
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
								href: '/pages#/website/' + source._id + '/' + page.titleLink,
								index: page.index
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
				currentLink: function(link){
					return link.href.split('#')[1] === window.location.hash.split('#')[1];
				},
				getReferencedResources: function(source){
					return [];
				}
			}

		}
	}
});
