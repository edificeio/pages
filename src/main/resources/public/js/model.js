function Cell(index){
	if(typeof index !== 'object'){
		this.media = {
		};
		this.index = index;
		this.className = ['transparent'];
	}
	else{
		if(index.media.type === 'grid'){
			this.media.source = new Page(index.media.source);
		}
	}
}

Cell.prototype.buildSubGrid = function(){
	this.media.type = 'grid';
	var fillingCell = new Cell();
	this.media.source = new Page();
	this.media.source.addRow();
	this.media.source.rows.first().addCell(fillingCell);
	fillingCell = new Cell();
	this.media.source.addRow();
	this.media.source.rows.all[1].addCell(fillingCell);
	this.className.push('sub-grid');
};

function Row(data){
	this.collection(Cell);
	if(data && data.cells){
		this.cells.load(data.cells);
	}
}

Row.prototype.remainingSpace = function(){
	var maxSize = 12;
	var usedSpace = 0;
	this.cells.forEach(function(cell){
		usedSpace += cell.width;
	});
	return maxSize - usedSpace;
};

Row.prototype.addCell = function(cell){
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

Row.prototype.hasLeftOvers = function(){
	return this.cells.length() !== 12;
};

Row.prototype.setIndex = function(cell, index){
	this.cells.remove(cell);
	this.cells.insertAt(index, cell);
	this.cells.forEach(function(item, index){
		item.index = index;
	})
};

function Page(data){
	this.collection(Row);
	if(data && data.rows){
		this.rows.load(data.rows);
	}
}

Page.prototype.addRow = function(){
	var row = new Row();
	this.rows.push(row);
	row.index = this.rows.length() - 1;
	return row;
};

Page.prototype.addRowAt = function(previousRow){
	var row = new Row();
	this.rows.insertAt(this.rows.getIndex(previousRow) + 1, row);
	row.index = this.rows.getIndex(previousRow) + 1;
	return row;
};

Page.prototype.moveCell = function(cell, newIndex){
	this.rows.find(function(row){
		return row.cells.all.indexOf(cell) !== -1;
	}).cells.remove(cell);
	this.rows.findWhere({ index: newIndex }).cells.insertAt(cell.index, cell);
};

Page.prototype.toJSON = function(){
	return {
		title: this.title,
		titleLink: this.titleLink,
		rows: this.rows
	}
};

Page.prototype.url = function(website){
	return window.location.origin + '/pages#/website/' + website._id + '/' + this.titleLink;
};

Page.prototype.useTemplate = function(website, templateName){
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

			var blogCaller = {
				blog: {},
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
			blogCaller.copyRights = blogSniplet.sniplet.controller.copyRights;
			blogSniplet.sniplet.controller.createBlog.call(blogCaller);
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

function Website(data){
	this.collection(Page);
	if(data && data.pages){
		this.pages.load(data.pages);
	}
}

Website.prototype.url = function(){
	if(!this._id){
		return '';
	}
	return window.location.origin + '/pages#/website/' + this._id;
};

Website.prototype.remove = function(){
	http().delete('/pages/' + this._id);
	model.websites.remove(this);
};

Website.prototype.createWebsite = function(){
	http().postJson('/pages', this).done(function(data){
		data.owner = { displayName: model.me.username, userId: model.me.userId };
		this.updateData(data);
		model.websites.push(this);
	}.bind(this));
};

Website.prototype.saveModifications = function(){
	http().putJson('/pages/' + this._id, this);
};

Website.prototype.save = function(){
	if(this._id){
		this.saveModifications();
	}
	else{
		this.createWebsite();
	}
};

Website.prototype.sync = function(){
	http().get('/pages/' + this._id).done(function(data){
		this.updateData(data);
	}.bind(this));
};

Website.prototype.toJSON = function(){
	return {
		title: this.title,
		pages: this.pages,
		icon: this.icon,
		landingPage: this.landingPage,
		description: this.description
	};
};

Website.prototype.copyRightsToSniplets = function(data){
	var website = this;
	this.pages.forEach(function(page){
		page.rows.forEach(function(row){
			row.cells.forEach(function(cell){
				if(cell.media.type !== 'sniplet'){
					return;
				}
				var sniplet = _.findWhere(sniplets.sniplets, { application: cell.media.source.application, template: cell.media.source.template });
				if(typeof sniplet.sniplet.controller.copyRights === 'function'){
					sniplet.sniplet.controller.copyRights(data, cell.media.source.source);
				}
			});
		});
	});
};

model.build = function(){
	this.makeModels([Cell, Row, Page, Website]);

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
};