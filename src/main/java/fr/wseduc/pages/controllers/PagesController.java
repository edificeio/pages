package fr.wseduc.pages.controllers;

import fr.wseduc.rs.Delete;
import fr.wseduc.rs.Get;
import fr.wseduc.rs.Post;
import fr.wseduc.rs.Put;
import fr.wseduc.security.ActionType;
import fr.wseduc.security.ResourceFilter;
import fr.wseduc.security.SecuredAction;
import org.entcore.common.mongodb.MongoDbControllerHelper;
import org.vertx.java.core.http.HttpServerRequest;

public class PagesController extends MongoDbControllerHelper {

	public PagesController() {
		super("pages");
	}

	@Get("")
	@SecuredAction("pages.view")
	public void view(HttpServerRequest request) {
		renderView(request);
	}

	@Get("/list/:filter")
	@SecuredAction("pages.list")
	public void list(HttpServerRequest request) {
		super.list(request);
	}

	@Post("")
	@SecuredAction("pages.add")
	public void add(HttpServerRequest request) {
		create(request);
	}

	@Get("/:id")
	@ResourceFilter("pageRead")
	@SecuredAction(value = "page.get", type = ActionType.RESOURCE)
	public void get(HttpServerRequest request) {
		retrieve(request);
	}

	@Put("/:id")
	@SecuredAction(value = "page.update", type = ActionType.RESOURCE)
	public void update(HttpServerRequest request) {
		super.update(request);
	}

	@Delete("/:id")
	@ResourceFilter("ownerOnly")
	@SecuredAction(value = "", type = ActionType.RESOURCE)
	public void delete(HttpServerRequest request) {
		super.delete(request);
	}

	@Get("/pub/:id")
	public void getPublic(HttpServerRequest request) {
		retrieve(request);
	}

	@Get("/pub/list/:filter")
	public void listPublic(HttpServerRequest request) {
		list(request);
	}

	@Get("/share/:id")
	@SecuredAction("page.share")
	public void share(HttpServerRequest request) {
		shareJson(request);
	}

	@Put("/share/:id")
	@SecuredAction("page.share")
	public void shareSubmit(HttpServerRequest request) {
		shareJsonSubmit(request, null);
	}

	@Put("/share/remove/:id")
	@SecuredAction("page.share")
	public void removeShare(HttpServerRequest request) {
		super.removeShare(request);
	}

}
