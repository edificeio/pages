package fr.wseduc.pages.service.impl;

import org.entcore.common.service.impl.MongoDbRepositoryEvents;
import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonArray;

public class PagesRepositoryEvents extends MongoDbRepositoryEvents {

	public PagesRepositoryEvents() {
		super("fr-wseduc-pages-controllers-PagesController|delete");
	}

	@Override
	public void exportResources(String exportId, String userId, JsonArray groups, String exportPath, String locale, String host, final Handler<Boolean> handler) {

	}

}
