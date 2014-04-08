var pagesWidget = model.widgets.findWidget('pages');

function Page(){ }
model.makeModel(Page);
model.makePermanent(Page, { fromApplication: 'pages' });

model.on('pages.sync', function(){
	pagesWidget.pages = model.pages.mixed.all;
	model.widgets.apply();
});