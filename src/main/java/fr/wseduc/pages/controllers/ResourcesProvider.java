package fr.wseduc.pages.controllers;

import fr.wseduc.webutils.http.Binding;
import org.vertx.java.core.Handler;
import org.vertx.java.core.http.HttpServerRequest;
import org.vertx.java.core.json.JsonObject;

public interface ResourcesProvider {

	void authorize(HttpServerRequest resourceRequest, Binding binding,
				   JsonObject user, Handler<Boolean> handler);

}
