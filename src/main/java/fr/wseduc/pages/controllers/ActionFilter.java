package fr.wseduc.pages.controllers;

import fr.wseduc.webutils.http.Binding;
import fr.wseduc.webutils.request.filter.Filter;
import fr.wseduc.webutils.security.ActionType;
import fr.wseduc.webutils.security.SecureHttpServerRequest;
import org.vertx.java.core.Handler;
import org.vertx.java.core.Vertx;
import org.vertx.java.core.buffer.Buffer;
import org.vertx.java.core.http.HttpClient;
import org.vertx.java.core.http.HttpClientResponse;
import org.vertx.java.core.http.HttpServerRequest;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;


/**
 * This Filter only use HTTP to retrieve user's info.
 * It targets internal module and uses cookie to authorize user request
 */

public class ActionFilter implements Filter {

	private final Set<Binding> bindings;
	private final Vertx vertx;
	private final JsonObject conf;
	private final ResourcesProvider provider;
	private final boolean oauthEnabled;
	private final HttpClient httpClient;

	public ActionFilter(Set<Binding> bindings, JsonObject conf, Vertx vertx, ResourcesProvider provider, boolean oauthEnabled) {
		this.bindings = bindings;
		this.conf = conf;
		this.vertx = vertx;
		this.provider = provider;
		this.oauthEnabled = oauthEnabled;
		this.httpClient = vertx.createHttpClient()
				.setHost("localhost")
				.setPort(conf.getInteger("entcore.port", 80))
				.setMaxPoolSize(16);
	}

	public ActionFilter(Set<Binding> bindings, JsonObject conf, Vertx vertx, ResourcesProvider provider) {
		this(bindings, conf, vertx, provider, false);
	}

	public ActionFilter(Set<Binding> bindings, JsonObject conf, Vertx vertx) {
		this(bindings, conf, vertx, null);
	}

	public ActionFilter(List<Set<Binding>> bindings, JsonObject conf, Vertx vertx, ResourcesProvider provider, boolean oauthEnabled) {
		Set<Binding> b = new HashSet<>();
		if (bindings != null) {
			for (Set<Binding> bs: bindings) {
				b.addAll(bs);
			}
		}
		this.bindings = b;
		this.conf = conf;
		this.vertx = vertx;
		this.provider = provider;
		this.oauthEnabled = oauthEnabled;
		this.httpClient = vertx.createHttpClient()
				.setHost("localhost")
				.setPort(conf.getInteger("entcore.port", 80))
				.setMaxPoolSize(16);
	}

	public ActionFilter(List<Set<Binding>> bindings, JsonObject conf, Vertx vertx, ResourcesProvider provider) {
		this(bindings, conf, vertx, provider, false);
	}

	public ActionFilter(List<Set<Binding>> bindings, JsonObject conf, Vertx vertx) {
		this(bindings, conf, vertx, null);
	}

	@Override
	public void canAccess(final HttpServerRequest request, final Handler<Boolean> handler) {
		request.pause();
		httpClient.get("/auth/oauth2/userinfo", new Handler<HttpClientResponse>() {
			@Override
			public void handle(HttpClientResponse response) {
				response.bodyHandler(new Handler<Buffer>() {
					@Override
					public void handle(Buffer body) {
						request.resume();
						JsonObject session = new JsonObject(body.toString());
						if (session != null) {
							userIsAuthorized(request, session, handler);
						} else if (oauthEnabled && request instanceof SecureHttpServerRequest &&
								((SecureHttpServerRequest) request).getAttribute("client_id") != null) {
							clientIsAuthorizedByScope((SecureHttpServerRequest) request, handler);
						} else {
							handler.handle(false);
						}
					}
				});
			}
		})
				.putHeader("Cookie", request.headers().get("Cookie"))
				.end();
	}

	@Override
	public void deny(HttpServerRequest request) {
		request.response().setStatusCode(401).end();
	}

	private void userIsAuthorized(HttpServerRequest request, JsonObject session,
								  Handler<Boolean> handler) {
		Binding binding = requestBinding(request);
		if (ActionType.WORKFLOW.equals(binding.getActionType())) {
			authorizeWorkflowAction(session, binding, handler);
		} else if (ActionType.RESOURCE.equals(binding.getActionType())) {
			authorizeResourceAction(request, session, binding, handler);
		} else if (ActionType.AUTHENTICATED.equals(binding.getActionType())) {
			handler.handle(true);
		} else {
			handler.handle(false);
		}
	}

	private void authorizeResourceAction(HttpServerRequest request, JsonObject session,
										 Binding binding, Handler<Boolean> handler) {
		if (session != null && provider != null) {
			provider.authorize(request, binding, session, handler);
		} else {
			handler.handle(false);
		}
	}

	private void authorizeWorkflowAction(JsonObject session, Binding binding,
										 Handler<Boolean> handler) {
		JsonArray actions = session.getArray("authorizedActions");
		if (binding != null && binding.getServiceMethod() != null
				&& actions != null && actions.size() > 0) {
			for (Object a: actions) {
				JsonObject action = (JsonObject) a;
				if (binding.getServiceMethod().equals(action.getString("name"))) {
					handler.handle(true);
					return;
				}
			}
		}
		if ("SuperAdmin".equals(session.getString("type"))) {
			handler.handle(true);
			return;
		}
		handler.handle(false);
	}

	private Binding requestBinding(HttpServerRequest request) {
		for (Binding binding: bindings) {
			if (!request.method().equals(binding.getMethod().name())) {
				continue;
			}
			Matcher m = binding.getUriPattern().matcher(request.path());
			if (m.matches()) {
				return binding;
			}
		}
		return null;
	}

	private void clientIsAuthorizedByScope(SecureHttpServerRequest request, Handler<Boolean> handler) {
		String scope = request.getAttribute("scope");
		Binding b = requestBinding(request);
		handler.handle(scope.contains(b.getServiceMethod()));
	}

}
