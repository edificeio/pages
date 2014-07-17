package fr.wseduc.pages.controllers;

import fr.wseduc.pages.filters.PageReadFilter;
import fr.wseduc.rs.*;
import fr.wseduc.security.ActionType;
import fr.wseduc.security.ResourceFilter;
import fr.wseduc.security.SecuredAction;
import org.entcore.common.http.filter.OwnerOnly;
import org.entcore.common.mongodb.MongoDbControllerHelper;
import org.vertx.java.core.http.HttpServerRequest;

public class PagesController extends MongoDbControllerHelper {

	public PagesController() {
		super("pages");
	}

	@Get("")
	@ApiDoc("Get page view")
	@SecuredAction("pages.view")
	public void view(HttpServerRequest request) {
		renderView(request);
	}

	@Get("/list/:filter")
	@ApiDoc("List all authorized pages.")
	@SecuredAction("pages.list")
	public void list(HttpServerRequest request) {
		super.list(request);
	}

	@Post("")
	@ApiDoc("Add page.")
	@SecuredAction("pages.add")
	public void add(HttpServerRequest request) {
		create(request);
	}

	@Get("/:id")
	@ApiDoc("Get page by id.")
	@ResourceFilter(PageReadFilter.class)
	@SecuredAction(value = "page.get", type = ActionType.RESOURCE)
	public void get(HttpServerRequest request) {
		retrieve(request);
	}

	@Put("/:id")
	@ApiDoc("Update page by id.")
	@SecuredAction(value = "page.update", type = ActionType.RESOURCE)
	public void update(HttpServerRequest request) {
		super.update(request);
	}

	@Delete("/:id")
	@ApiDoc("Delete page by id.")
	@ResourceFilter(OwnerOnly.class)
	@SecuredAction(value = "", type = ActionType.RESOURCE)
	public void delete(HttpServerRequest request) {
		super.delete(request);
	}

	@Get("/pub/:id")
	@ApiDoc("Get public page by id.")
	public void getPublic(HttpServerRequest request) {
		retrieve(request);
	}

	@Get("/pub/list/:filter")
	@ApiDoc("List public pages.")
	public void listPublic(HttpServerRequest request) {
		list(request);
	}

	@Get("/share/:id")
	@ApiDoc("Get share list.")
	@SecuredAction("page.share")
	public void share(HttpServerRequest request) {
		shareJson(request);
	}

	@Put("/share/:id")
	@ApiDoc("Share a page.")
	@SecuredAction("page.share")
	public void shareSubmit(HttpServerRequest request) {
		shareJsonSubmit(request, null);
	}

	@Put("/share/remove/:id")
	@ApiDoc("Remove share.")
	@SecuredAction("page.share")
	public void removeShare(HttpServerRequest request) {
		super.removeShare(request);
	}

}
