function Block(){

}

function Page(data){
	this.collection(Block);
	if(data && data.blocks){
		this.blocks.load(data.blocks);
	}
}

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
	http().postJson('/pages', this);
};

Website.prototype.saveModifications = function(){
	http().putJson('/pages', this);
};

Website.prototype.save = function(){
	if(this._id){
		this.saveModifications();
	}
	else{
		this.createWebsite();
	}
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
	this.makeModels([Block, Page, Website, Folder]);

	this.mySites = new Folder({ filter: 'owner' });
	this.sharedSites = new Folder({ filter: 'shared' });
};