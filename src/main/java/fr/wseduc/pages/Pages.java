package fr.wseduc.pages;

import fr.wseduc.pages.controllers.PagesController;
import fr.wseduc.pages.service.impl.PagesRepositoryEvents;
import fr.wseduc.rs.ApiPrefixDoc;
import org.entcore.common.http.BaseServer;
import org.entcore.common.http.filter.ShareAndOwner;
import org.entcore.common.mongodb.MongoDbConf;

@ApiPrefixDoc
public class Pages extends BaseServer {

	@Override
	public void start() {
		super.start();
		MongoDbConf.getInstance().setCollection("pages");
		setDefaultResourceFilter(new ShareAndOwner());
		setRepositoryEvents(new PagesRepositoryEvents());
		addController(new PagesController());
	}

}
