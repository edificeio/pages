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

package fr.wseduc.pages.filters;

import com.mongodb.DBObject;
import com.mongodb.QueryBuilder;
import fr.wseduc.mongodb.MongoQueryBuilder;
import org.entcore.common.http.filter.MongoAppFilter;
import org.entcore.common.service.VisibilityFilter;
import org.entcore.common.user.UserInfos;
import org.vertx.java.core.Handler;
import org.vertx.java.core.http.HttpServerRequest;

import java.util.ArrayList;
import java.util.List;

public class PagesFilter extends MongoAppFilter {

	public PagesFilter(String collection) {
		super(collection);
	}

	public void pageRead(HttpServerRequest request, String sharedMethod,
			UserInfos user, Handler<Boolean> handler) {
		String id = request.params().get(resourceIdLabel);
		if (id != null && !id.trim().isEmpty()) {
			List<DBObject> groups = new ArrayList<>();
			groups.add(QueryBuilder.start("userId").is(user.getUserId())
					.put(sharedMethod).is(true).get());
			for (String gpId: user.getGroupsIds()) {
				groups.add(QueryBuilder.start("groupId").is(gpId)
						.put(sharedMethod).is(true).get());
			}
			QueryBuilder query = QueryBuilder.start("_id").is(id).or(
					QueryBuilder.start("owner.userId").is(user.getUserId()).get(),
					QueryBuilder.start("visibility").is(VisibilityFilter.PUBLIC.name()).get(),
					QueryBuilder.start("visibility").is(VisibilityFilter.PROTECTED.name()).get(),
					QueryBuilder.start("shared").elemMatch(
							new QueryBuilder().or(groups.toArray(new DBObject[groups.size()])).get()).get()
			);
			executeCountQuery(request, collection, MongoQueryBuilder.build(query), 1, handler);
		} else {
			handler.handle(false);
		}
	}

}
