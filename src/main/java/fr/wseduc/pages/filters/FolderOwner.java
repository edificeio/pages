package fr.wseduc.pages.filters;

import com.mongodb.QueryBuilder;
import fr.wseduc.mongodb.MongoQueryBuilder;
import fr.wseduc.webutils.http.Binding;
import org.entcore.common.http.filter.MongoAppFilter;
import org.entcore.common.http.filter.ResourcesProvider;
import org.entcore.common.mongodb.MongoDbConf;
import org.entcore.common.user.UserInfos;
import org.vertx.java.core.Handler;
import org.vertx.java.core.http.HttpServerRequest;

public class FolderOwner implements ResourcesProvider {

	private MongoDbConf conf = MongoDbConf.getInstance();

	@Override
	public void authorize(HttpServerRequest request, Binding binding, UserInfos user, Handler<Boolean> handler) {
		String id = request.params().get(conf.getResourceIdLabel());
		if (id != null && !id.trim().isEmpty()) {
			QueryBuilder query = QueryBuilder.start("_id").is(id).put("owner.userId").is(user.getUserId());
			MongoAppFilter.executeCountQuery(request, "pagesFolder", MongoQueryBuilder.build(query), 1, handler);
		} else {
			handler.handle(false);
		}
	}

}