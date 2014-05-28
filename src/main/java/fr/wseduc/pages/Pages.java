package fr.wseduc.pages;

import fr.wseduc.pages.controllers.PagesController;
import org.entcore.common.http.BaseServer;
import org.entcore.common.http.filter.MongoAppFilter;

public class Pages extends BaseServer {

	@Override
	public void start() {
		setResourceProvider(new MongoAppFilter("pages"));
		super.start();
		addController(new PagesController());
	}

}
