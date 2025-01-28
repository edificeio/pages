/*
 * Copyright © "Open Digital Education" (SAS “WebServices pour l’Education”), 2014
 *
 * This program is published by "Open Digital Education" (SAS “WebServices pour l’Education”).
 * You must indicate the name of the software and the company in any production /contribution
 * using the software and indicate on the home page of the software industry in question,
 * "powered by Open Digital Education" with a reference to the website: https: //opendigitaleducation.com/.
 *
 * This program is free software, licensed under the terms of the GNU Affero General Public License
 * as published by the Free Software Foundation, version 3 of the License.
 *
 * You can redistribute this application and/or modify it since you respect the terms of the GNU Affero General Public License.
 * If you modify the source code and then use this modified source code in your creation, you must make available the source code of your modifications.
 *
 * You should have received a copy of the GNU Affero General Public License along with the software.
 * If not, please see : <http://www.gnu.org/licenses/>. Full compliance requires reading the terms of this license and following its directives.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 */

package fr.wseduc.pages.controllers;

import com.mongodb.client.model.Filters;
import fr.wseduc.bus.BusAddress;
import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.mongodb.MongoQueryBuilder;
import fr.wseduc.pages.Pages;
import fr.wseduc.pages.filters.PageReadFilter;
import fr.wseduc.rs.*;
import fr.wseduc.security.ActionType;
import fr.wseduc.security.SecuredAction;

import fr.wseduc.webutils.Either;
import fr.wseduc.webutils.I18n;
import fr.wseduc.webutils.Utils;
import fr.wseduc.webutils.http.Renders;
import fr.wseduc.webutils.request.RequestUtils;
import io.vertx.core.json.JsonArray;
import org.bson.conversions.Bson;
import org.entcore.common.controller.ControllerHelper;
import org.entcore.common.events.EventHelper;
import org.entcore.common.events.EventStore;
import org.entcore.common.events.EventStoreFactory;
import org.entcore.common.http.filter.ResourceFilter;
import org.entcore.common.http.response.DefaultResponseHandler;
import org.entcore.common.mongodb.MongoDbControllerHelper;
import org.entcore.common.service.VisibilityFilter;
import org.entcore.common.user.UserInfos;
import org.entcore.common.user.UserUtils;
import io.vertx.core.Handler;
import io.vertx.core.Vertx;
import io.vertx.core.eventbus.Message;
import io.vertx.core.http.HttpServerRequest;
import io.vertx.core.json.JsonObject;
import org.vertx.java.core.http.RouteMatcher;


import java.util.*;

import static org.entcore.common.bus.BusResponseHandler.busResponseHandler;

public class PagesController extends MongoDbControllerHelper {
	static final String PRIVATE_RESOURCE_NAME = "pages_internal";
	static final String PUBLIC_RESOURCE_NAME = "pages_public";

	private final EventHelper eventHelper;
	public static final String PAGES_COLLECTION = "pages";
	private final MongoDb mongo;
	@Override
	public void init(Vertx vertx, JsonObject config, RouteMatcher rm,
					 Map<String, fr.wseduc.webutils.security.SecuredAction> securedActions) {
		super.init(vertx, config, rm, securedActions);
	}

	public PagesController(MongoDb mongo) {
		super("pages");
		this.mongo = mongo;
		final EventStore eventStore = EventStoreFactory.getFactory().getEventStore(Pages.class.getSimpleName());
		this.eventHelper = new EventHelper(eventStore);
	}

	@Get("")
	@ApiDoc("Get page view")
	@SecuredAction("pages.view")
	public void view(HttpServerRequest request) {
		renderView(request);
		eventHelper.onAccess(request);
	}

	@Get("/p/website")
	public void websiteView(final HttpServerRequest request) {
		UserUtils.getUserInfos(eb, request, new io.vertx.core.Handler<UserInfos>() {
			@Override
			public void handle(UserInfos user) {
				JsonObject context = new JsonObject().put("notLoggedIn", user == null);
				renderView(request, context, "website.html", null);
			}
		});
	}

	@Override
	@Get("/list/:filter")
	@ApiDoc("List all authorized pages.")
	@SecuredAction("pages.list")
	public void list(HttpServerRequest request) {
		super.list(request);
	}

	private JsonObject beforeSave(JsonObject body){
		String visibility = body.getString("visibility", "");
		if(!"PUBLIC".equals(visibility)){
			body.remove("slug"); // sparse unique index
		}
		return body;
	}

	protected void doCreate(HttpServerRequest request, final String resourceName){
		UserUtils.getUserInfos(this.eb, request, user -> {
			if (user != null) {
				RequestUtils.bodyToJson(request, object -> {
					object = beforeSave(object);
					final Handler<Either<String,JsonObject>> handler = DefaultResponseHandler.notEmptyResponseHandler(request);
					crudService.create(object, user, eventHelper.onCreateResource(request, resourceName, handler));
				});
			} else {
				ControllerHelper.log.debug("User not found in session.");
				Renders.unauthorized(request);
			}
		});
	}

	protected void doUpdate(final HttpServerRequest request) {
		UserUtils.getUserInfos(this.eb, request, user -> {
			if (user != null) {
				RequestUtils.bodyToJson(request, object -> {
					String id = request.params().get("id");
					object = beforeSave(object);
					crudService.update(id, object, user, DefaultResponseHandler.notEmptyResponseHandler(request));
				});
			} else {
				ControllerHelper.log.debug("User not found in session.");
				Renders.unauthorized(request);
			}
		});
	}

	@Post("")
	@ApiDoc("Add page.")
	@SecuredAction("pages.add")
	public void add(HttpServerRequest request) {
		hasConflict(Optional.empty(),request, res->{
			if(res){
				conflict(request);
			}else{
				doCreate(request, PRIVATE_RESOURCE_NAME);
			}
		});
	}

	@Post("/p")
	@ApiDoc("Add page.")
	@SecuredAction("pages.add.public")
	public void addPublic(HttpServerRequest request) {
		hasConflict(Optional.empty(),request, res->{
			if(res){
				conflict(request);
			}else{
				doCreate(request, PUBLIC_RESOURCE_NAME);
			}
		});
	}

	@Get("/:id")
	@ApiDoc("Get page by id.")
	@ResourceFilter(PageReadFilter.class)
	@SecuredAction(value = "page.read", type = ActionType.RESOURCE)
	public void get(HttpServerRequest request) {
		retrieve(request);
	}

	@Override
	@Put("/:id")
	@ApiDoc("Update page by id.")
	@SecuredAction(value = "page.contrib", type = ActionType.RESOURCE)
	public void update(HttpServerRequest request) {
		String id = request.params().get("id");
		hasConflict(Optional.ofNullable(id),request, res->{
			if(res){
				conflict(request);
			}else{
				doUpdate(request);
			}
		});
	}

	@Override
	@Delete("/:id")
	@ApiDoc("Delete page by id.")
	@SecuredAction(value = "page.manager", type = ActionType.RESOURCE)
	public void delete(HttpServerRequest request) {
		super.delete(request);
	}

	@Get("/pub/:id")
	@ApiDoc("Get public page by id.")
	public void getPublic(HttpServerRequest request) {
		String slug = request.params().get("id");
		getPublicBySlugOrId(slug, request);
	}

	@Get("/pub/list/:filter")
	@ApiDoc("List public pages.")
	public void listPublic(HttpServerRequest request) {
		list(request);
	}

	@Get("/share/json/:id")
	@ApiDoc("Get share list.")
	@SecuredAction(value = "page.manager", type = ActionType.RESOURCE)
	public void share(HttpServerRequest request) {
		shareJson(request, false);
	}

	@Put("/share/json/:id")
	@ApiDoc("Share a page.")
	@SecuredAction(value = "page.manager", type = ActionType.RESOURCE)
	public void shareSubmit(final HttpServerRequest request) {
		UserUtils.getUserInfos(eb, request, new Handler<UserInfos>() {
			@Override
			public void handle(final UserInfos user) {
				if (user != null) {
					final String id = request.params().get("id");
					if(id == null || id.trim().isEmpty()) {
						badRequest(request, "invalid.id");
						return;
					}

					JsonObject params = new JsonObject()
							.put("uri", "/userbook/annuaire#" + user.getUserId() + "#" + user.getType())
							.put("username", user.getUsername())
							.put("pageUri", "/pages#/website/" + id);
					params.put("resourceUri", params.getString("pageUri"));

					JsonObject pushNotif = new JsonObject()
                            .put("title", "pages.push.notif.shared")
                            .put("body", I18n.getInstance()
                                    .translate(
                                            "pages.push.notif.shared.body",
                                            getHost(request),
                                            I18n.acceptLanguage(request),
                                            user.getUsername()
                                    ));
					params.put("pushNotif", pushNotif);

					shareJsonSubmit(request, "pages.shared", false, params, "title");
				}
			}
		});
	}

	private void cleanFolders(String id, UserInfos user, List<String> recipientIds){
		//owner style keep the reference to the ressource
		JsonArray jsonRecipients = new JsonArray(recipientIds).add(user.getUserId());
		JsonObject query = MongoQueryBuilder.build(Filters.and(Filters.eq("websitesIds", id), Filters.nin("owner.userId", jsonRecipients)));
		JsonObject update = new JsonObject().put("$pull", new JsonObject().put("websitesIds", new JsonObject().put("$nin",jsonRecipients)));
		mongo.update("pagesFolders", query, update, message -> {
			JsonObject body = message.body();
			if (!"ok".equals(body.getString("status"))) {
				String err = body.getString("error", body.getString("message", "unknown cleanFolder Error"));
				log.error("[cleanFolders] failed to clean folder because of: "+err);
			}
		});
	}

	@Override
	public void doShareSucceed(HttpServerRequest request, String id, UserInfos user,JsonObject sharePayload, JsonObject result, boolean sendNotify){
		super.doShareSucceed(request, id, user, sharePayload, result, sendNotify);
		if(sharePayload!=null){
			Set<String> userIds = sharePayload.getJsonObject("users", new JsonObject()).getMap().keySet();
			Set<String> groupIds = sharePayload.getJsonObject("groups", new JsonObject()).getMap().keySet();
			UserUtils.getUserIdsForGroupIds(groupIds,user.getUserId(),this.eb, founded->{
				if(founded.succeeded()){
					List<String> userToKeep = new ArrayList<>(userIds);
					userToKeep.addAll(founded.result());
					cleanFolders(id, user, userToKeep);
				}else{
					log.error("[doShareSucceed] failed to found recipient because:",founded.cause());
				}
			});
		}
	}

	@Put("/share/resource/:id")
	@ApiDoc("Share a page.")
	@SecuredAction(value = "page.manager", type = ActionType.RESOURCE)
	public void shareResource(final HttpServerRequest request) {
		UserUtils.getUserInfos(eb, request, new Handler<UserInfos>() {
			@Override
			public void handle(final UserInfos user) {
				if (user != null) {
					final String id = request.params().get("id");
					if(id == null || id.trim().isEmpty()) {
						badRequest(request, "invalid.id");
						return;
					}

					JsonObject params = new JsonObject()
							.put("uri", "/userbook/annuaire#" + user.getUserId() + "#" + user.getType())
							.put("username", user.getUsername())
							.put("pageUri", "/pages#/website/" + id);
					params.put("resourceUri", params.getString("pageUri"));

					shareResource(request, "pages.shared", false, params, "title");
				}
			}
		});
	}

	@Override
	@Put("/share/remove/:id")
	@ApiDoc("Remove share.")
	@SecuredAction(value = "page.manager", type = ActionType.RESOURCE)
	public void removeShare(HttpServerRequest request) {
		super.removeShare(request, false);
	}

	@BusAddress("pages")
	public void busApi(Message<JsonObject> message) {
		String action = message.body().getString("action", "");
		final String pageId = message.body().getString("pageId");
		switch (action) {
			case "create" :
				UserInfos user = UserUtils.sessionToUserInfos(message.body().getJsonObject("user"));
				JsonObject page = message.body().getJsonObject("page");
				crudService.create(page, user, busResponseHandler(message));
				break;
			case "share" :
				String userId = message.body().getString("userId");
				String groupId = message.body().getString("groupId");
				List<String> actions = message.body().getJsonArray("actions").getList();
				shareService.groupShare(userId, groupId, pageId, actions, busResponseHandler(message));
				break;
			case "delete" :
				crudService.delete(pageId, busResponseHandler(message));
				break;
			case "get" :
				crudService.retrieve(pageId, busResponseHandler(message));
				break;
			case "update" :
				crudService.update(pageId, message.body().getJsonObject("page"), busResponseHandler(message));
				break;
			default:
				message.reply(new JsonObject().put("status", "error")
						.put("message", "invalid.action"));
		}
	}

	@Get("/print/pages")
	@SecuredAction("pages.print")
	public void print(HttpServerRequest request) {
		renderView(request, null,"print.html", null);
	}

	private void hasConflict(Optional<String> pageId, HttpServerRequest request, Handler<Boolean> handler){
		RequestUtils.bodyToJson(request, data -> {
			String slug = data.getString("slug");
			String visibility = data.getString("visibility");
			//validate slug only for public pages
			if (VisibilityFilter.PUBLIC.name().equals(visibility)) {
				Bson queryM = Filters.eq("slug", slug);
				if (pageId.isPresent()) {
					queryM = Filters.and(queryM, Filters.ne("_id", pageId.get()));
				}
				JsonObject query = MongoQueryBuilder.build(queryM);
				mongo.count(PAGES_COLLECTION, query, event -> {
					JsonObject res = (JsonObject) event.body();
					handler.handle(res != null && "ok".equals(res.getString("status")) && 0 != res.getInteger("count"));
				});
			} else {
				handler.handle(false);
			}
		});
	}

	private void getPublicBySlugOrId(String slug, HttpServerRequest request) {
		// get by public first then by id (legacy links)
		Bson querySlug = Filters.eq("slug", slug);
		mongo.findOne(PAGES_COLLECTION, MongoQueryBuilder.build(querySlug),event -> {
			Either<String,JsonObject> eitherPage = Utils.validResult(event);
			if(eitherPage.isRight()){
				renderJson(request, eitherPage.right().getValue());
			}else{
				retrieve(request);
			}
		});
	}
}
