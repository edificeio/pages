package fr.wseduc.pages;

import fr.wseduc.pages.controllers.PagesController;
import fr.wseduc.pages.filters.PagesFilter;
import fr.wseduc.rs.ApiPrefixDoc;
import org.entcore.common.http.BaseServer;
import org.entcore.common.http.filter.MongoAppFilter;

@ApiPrefixDoc
public class Pages extends BaseServer {

	@Override
	public void start() {
		setResourceProvider(new PagesFilter("pages"));
		super.start();
		addController(new PagesController());
	}

}
