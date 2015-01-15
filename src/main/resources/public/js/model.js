function Group(data){

}

function Structure(data){
	var that = this;
	this.collection(Group, {
		sync: function(){
			http().get('/appregistry/groups/roles?structureId=' + that.id).done(function(groups){
				this.load(groups);
			}.bind(this))
		}
	});
	this.groups.sync();
}

function LocalAdmin(data){
	this.collection(Structure, {
		sync: function(){
			if(model.me.functions.ADMIN_LOCAL){
				this.load(_.map(model.me.functions.ADMIN_LOCAL.scope, function(id){
					return { id: id };
				}));
			}
		}
	})
}

model.build = function(){
	Behaviours.applicationsBehaviours.pages.model.Page.prototype.useTemplate = function(website, templateName){
		var cells = {
			content: function(row){
				var content = new Cell();
				content.media.type = 'text';
				content.media.source = '<h1>Votre page personnelle</h1>' +
				'<p>Vous pouvez entrer ici les informations que vous voulez : cliquez sur l\'encart de texte pour en modifier le contenu. ' +
				'Vous pouvez aussi modifier l\'image ci-dessus (ou la supprimer en cliquant sur la petite croix en haut à droite).' +
				'La navigation de gauche sera complétée automatiquement au fur et à mesure que vous ajouterez des pages.</p>' +
				'<h1>Publier votre page</h1>' +
				'<p>Afin de publier votre page, vous devez publier le site web qui la contient. Vous pouvez le faire dans la partie "propriétés" de l\'espace de gestion de votre site.' +
				'Lors de la publication de votre site, pensez à vérifier que tous les contenus que vous utilisez soient bien visibles des autres utilisateurs (blogs, liens, ...).</p>';
				row.addCell(content)
			},
			navigation: function(row){
				var navigation = new Cell();
				navigation.media.type = 'sniplet';
				navigation.media.source = {
					template: 'navigation',
					application: 'pages',
					source: { _id: website._id }
				};
				row.addCell(navigation);
				navigation.width = 3;
			},
			empty: function(row, width, height){
				var empty = new Cell();
				empty.media.type = 'text';
				row.addCell(empty);
				empty.width = width;
				empty.height = height;
			},
			image: function(row, width, height){
				var image = new Cell();
				image.width = width;
				image.height = height;
				image.media.type = 'image';
				image.media.source = '/pages/public/filler-images/' + width + 'x' + height + '.png';
				row.addCell(image);
			},
			blog: function(row, width, website, callback){
				var blog = new Cell();
				blog.media.type = 'sniplet';
				Behaviours.applicationsBehaviours.blog.model.register();

				var blogCaller = {
					blog: new Behaviours.applicationsBehaviours.blog.model.Blog(),
					snipletResource: website,
					setSnipletSource: function(newBlog){
						blog.media.source = {
							template: 'articles',
							application: 'blog',
							source: newBlog
						};
						row.addCell(blog);
						blog.width = width;
						if(typeof callback === 'function'){
							callback();
						}
						website.trigger('change');
					}
				};
				var blogSniplet = _.findWhere(sniplets.sniplets, { application: 'blog', template: 'articles' });
				blogSniplet.sniplet.controller.createBlog.call(blogCaller);
				website.synchronizeRights();
			},
			smallNote: function(row){
				var smallNote = new Cell();
				smallNote.media.type = 'text';
				smallNote.media.source = '<h2>A propos...</h2><p>Vous pouvez ajouter facilement de petits encarts ' +
				'de texte en créant un bloc de texte et en changeant la couleur de fond avec le pinceau.</p>';
				smallNote.className = ['black'];
				smallNote.width = 2;
				row.addCell(smallNote);
			},
			welcomeMessage: function(row){
				var welcome = new Cell();
				welcome.media.type = 'text';
				welcome.media.source = '<h1>Titre de mon site</h1>';
				row.addCell(welcome);
				welcome.width = 10;
				welcome.height = 1;
				var illustration = new Cell();
				illustration.media.type = 'image';
				illustration.media.source = '/pages/public/filler-images/2x1.png';
				illustration.height = 1;
				illustration.width = 2;
				row.addCell(illustration);
			},
			footpage: function(row){
				var footpage = new Cell();
				footpage.media.type = 'text';
				footpage.media.source = '<em class="low-importance centered-text twelve cell">pied de page<br />ajoutez ici vos informations de contact</em>';
				row.addCell(footpage);
				footpage.height = 1;
			}
		};

		var templates = {
			navigationAndContent: function(){
				var row = this.addRow();
				cells.image(row, 12, 1);
				row = this.addRow();
				cells.navigation(row);
				cells.content(row);
				row = this.addRow();
				cells.empty(row, 3, 1);
				cells.footpage(row);
			},
			navigationAndBlog: function(website){
				var row = this.addRow();
				cells.welcomeMessage(row);
				row = this.addRow();
				cells.navigation(row);
				cells.blog(row, 7, website, function(){
					cells.smallNote(row);
					website.save();
				});

			}
		};
		templates[templateName].call(this, website);
	};

	Behaviours.applicationsBehaviours.pages.model.Website.prototype.updateApplication = function(){
		if(model.me.functions.ADMIN_LOCAL && this.published){
			for(var structureId in this.published){
				var icon = "/img/illustrations/pages-default.png"
				if(this.icon){
					icon = this.icon + '?thumbnail=150x150'
				}
				http().putJson('/appregistry/application/conf/' + this.published[structureId].application.id, {
					grantType: "authorization_code",
					displayName: this.title,
					secret: "",
					address: this.url({ relative: true }),
					icon: icon,
					target: "",
					scope: "",
					name: this.title
				});
			}

		}
	};

	Behaviours.applicationsBehaviours.pages.model.Website.prototype.makeApplication = function(structure, cb){
		var icon = "/img/illustrations/pages-default.png"
		if(this.icon){
			icon = this.icon + '?thumbnail=150x150'
		}
		http().postJson('/appregistry/application/external?structureId=' + structure.id, {
			grantType: "authorization_code",
			displayName: this.title,
			secret: "",
			address: this.url({ relative: true }),
			icon: icon,
			target: "",
			scope: "",
			name: this.title
		})
			.done(function(newApp){
				http().postJson('/appregistry/role?structureId=' + structure.id, {
					role: this.title,
					actions: [this.title + "|address"]
				})
					.done(function(newRole){
						this.published[structure.id] = {
							role: newRole,
							groups: [],
							application: newApp
						};
						if(typeof cb === 'function'){
							cb();
						}
					}.bind(this))
			}.bind(this));
	};

	Behaviours.applicationsBehaviours.pages.model.Website.prototype.addRoleForGroup = function(structure, group){
		group.roles.push(this.published[structure.id].role.id);
		http().postJson('/appregistry/authorize/group?structureId=' + structure.id, {
			groupId: group.id,
			roleIds: group.roles
		})
			.done(function(){
				this.trigger('change');
			}.bind(this));
		this.published[structure.id].groups.push(group);
		this.save();
	};

	Behaviours.applicationsBehaviours.pages.model.Website.prototype.removeRoleForGroup = function(structure, group){
		var that = this;
		var rolesList = [];
		group.roles.forEach(function(role){
			if(role.id !== that.published[structure.id].role.id){
				rolesList.push(role);
			}
		});
		group.roles = rolesList;

		http().postJson('/appregistry/authorize/group?structureId=' + structure.id, {
			groupId: group.id,
			roleIds: group.roles
		});

		var groups = [];
		this.published[structure.id].groups.forEach(function(grp){
			if(grp.id !== group.id){
				groups.push(grp);
			}
		});
		this.published[structure.id].groups = groups;
		this.save();
	};

	Behaviours.applicationsBehaviours.pages.model.Website.prototype.publish = function(structure, group){
		if(!this.published){
			this.published = {};
		}
		if(!this.published[structure.id]){
			this.makeApplication(structure, function(){
				this.addRoleForGroup(structure, group)
			}.bind(this));
		}
		else{
			this.addRoleForGroup(structure, group);
		}
	};

	Behaviours.applicationsBehaviours.pages.model.register();
	this.makeModels([Group, LocalAdmin, Structure]);
	window.Cell = Behaviours.applicationsBehaviours.pages.model.Cell;
	window.Row = Behaviours.applicationsBehaviours.pages.model.Row;
	window.Page = Behaviours.applicationsBehaviours.pages.model.Page;
	window.Website = Behaviours.applicationsBehaviours.pages.model.Website;

	this.collection(Website, {
		behaviours: 'pages',
		sync: function(){
			http().get('/pages/list/all').done(function(websites){
				this.load(websites);
			}.bind(this));
		},
		removeSelection: function(){
			this.selection().forEach(function(website){
				website.remove();
			});
			notify.info('Les sites web ont été supprimés');
		}
	});

	this.localAdmin = new LocalAdmin();
};