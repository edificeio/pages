/*
 * Copyright © WebServices pour l'Éducation, 2014
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package fr.wseduc.pages.controllers;

import fr.wseduc.bus.BusAddress;
import fr.wseduc.pages.Pages;
import fr.wseduc.pages.filters.PageReadFilter;
import fr.wseduc.rs.*;
import fr.wseduc.security.ActionType;
import fr.wseduc.security.SecuredAction;

import org.entcore.common.events.EventStore;
import org.entcore.common.events.EventStoreFactory;
import org.entcore.common.http.filter.ResourceFilter;
import org.entcore.common.mongodb.MongoDbControllerHelper;
import org.entcore.common.user.UserInfos;
import org.entcore.common.user.UserUtils;
import org.vertx.java.core.Handler;
import org.vertx.java.core.Vertx;
import org.vertx.java.core.eventbus.Message;
import org.vertx.java.core.http.HttpServerRequest;
import org.vertx.java.core.http.RouteMatcher;
import org.vertx.java.core.json.JsonObject;
import org.vertx.java.platform.Container;

import java.util.List;
import java.util.Map;

import static org.entcore.common.bus.BusResponseHandler.busResponseHandler;

public class PagesController extends MongoDbControllerHelper {

	private EventStore eventStore;
	private enum PagesEvent { ACCESS }

	@Override
	public void init(Vertx vertx, Container container, RouteMatcher rm,
					 Map<String, fr.wseduc.webutils.security.SecuredAction> securedActions) {
		super.init(vertx, container, rm, securedActions);
		eventStore = EventStoreFactory.getFactory().getEventStore(Pages.class.getSimpleName());
	}

	public PagesController() {
		super("pages");
	}

	@Get("")
	@ApiDoc("Get page view")
	@SecuredAction("pages.view")
	public void view(HttpServerRequest request) {
		renderView(request);
		eventStore.createAndStoreEvent(PagesEvent.ACCESS.name(), request);
	}

	@Get("/p/website")
	public void websiteView(final HttpServerRequest request) {
		UserUtils.getUserInfos(eb, request, new org.vertx.java.core.Handler<UserInfos>() {
			@Override
			public void handle(UserInfos user) {
				JsonObject context = new JsonObject().putBoolean("notLoggedIn", user == null);
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

	@Post("")
	@ApiDoc("Add page.")
	@SecuredAction("pages.add")
	public void add(HttpServerRequest request) {
		create(request);
	}

	@Post("/p")
	@ApiDoc("Add page.")
	@SecuredAction("pages.add.public")
	public void addPublic(HttpServerRequest request) {
		create(request);
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
		super.update(request);
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
		retrieve(request);
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
							.putString("uri", getScheme(request) + "://" + getHost(request) +
									"/userbook/annuaire#" + user.getUserId() + "#" + user.getType())
							.putString("username", user.getUsername())
							.putString("pageUri", getScheme(request) + "://" + getHost(request) +
									"/pages#/website/" + id);
					params.putString("resourceUri", params.getString("pageUri"));

					shareJsonSubmit(request, "pages.shared", false, params, "title");
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
				UserInfos user = UserUtils.sessionToUserInfos(message.body().getObject("user"));
				JsonObject page = message.body().getObject("page");
				crudService.create(page, user, busResponseHandler(message));
				break;
			case "share" :
				String userId = message.body().getString("userId");
				String groupId = message.body().getString("groupId");
				List<String> actions = message.body().getArray("actions").toList();
				shareService.groupShare(userId, groupId, pageId, actions, busResponseHandler(message));
				break;
			case "delete" :
				crudService.delete(pageId, busResponseHandler(message));
				break;
			case "get" :
				crudService.retrieve(pageId, busResponseHandler(message));
				break;
			case "update" :
				crudService.update(pageId, message.body().getObject("page"), busResponseHandler(message));
				break;
			default:
				message.reply(new JsonObject().putString("status", "error")
						.putString("message", "invalid.action"));
		}
	}

}
