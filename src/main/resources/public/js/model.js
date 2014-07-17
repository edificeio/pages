function Cell(){
	this.media = {};
	this.width = 3;
}

function Row(data){
	this.collection(Cell);
	if(data && data.cells){
		this.cells.load(data.cell);
	}
}

Row.prototype.addCell = function(){
	this.cells.push(new Cell());
};

Row.prototype.hasLeftOvers = function(){
	var currentWidth = 0;
	this.cells.forEach(function(cell){
		currentWidth += cell.width;
	});
	return currentWidth < 10;
};

function Page(data){
	this.collection(Row);
	if(data && data.rows){
		this.rows.load(data.rows);
	}
}

Page.prototype.addRow = function(){
	this.rows.push(new Row());
};

function Website(data){
	this.collection(Page);
	if(data && data.pages){
		this.pages.load(data.pages);
	}
}

Website.prototype.remove = function(){
	http().delete('/pages/' + this._id);
	notify.error('Le site a été supprimé');
	model.websites.remove(this);
};

Website.prototype.createWebsite = function(){
	http().postJson('/pages', this).done(function(data){
		this.updateData(data);
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

Website.prototype.toJSON = function(){
	return {
		title: this.title,
		pages: this.pages,
		icon: this.icon
	};
};

function Folder(params){
	this.collection(Website, {
		sync: function(){
			http().get('/pages/list/' + params.filter).done(function(websites){
				this.load(websites);
			}.bind(this));
		}
	})
}

model.build = function(){
	this.makeModels([Cell, Row, Page, Website, Folder]);

	this.mySites = new Folder({ filter: 'owner' });
	this.sharedSites = new Folder({ filter: 'shared' });
};