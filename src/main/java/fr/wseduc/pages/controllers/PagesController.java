package fr.wseduc.pages.controllers;


import fr.wseduc.security.SecuredAction;
import fr.wseduc.webutils.Controller;
import org.vertx.java.core.Vertx;
import org.vertx.java.core.http.HttpServerRequest;
import org.vertx.java.core.http.RouteMatcher;
import org.vertx.java.platform.Container;

import java.util.Map;

public class PagesController extends Controller {

	public PagesController(Vertx vertx, Container container, RouteMatcher rm,
			Map<String, fr.wseduc.webutils.security.SecuredAction> securedActions) {
		super(vertx, container, rm, securedActions);
	}

	@SecuredAction("pages.view")
	public void view(HttpServerRequest request) {
		renderView(request);
	}

}
