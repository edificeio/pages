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

package fr.wseduc.pages.filters;

import com.mongodb.client.model.Filters;
import fr.wseduc.mongodb.MongoQueryBuilder;
import org.bson.conversions.Bson;
import org.entcore.common.http.filter.MongoAppFilter;
import org.entcore.common.service.VisibilityFilter;
import org.entcore.common.user.UserInfos;
import io.vertx.core.Handler;
import io.vertx.core.http.HttpServerRequest;

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
			List<Bson> groups = new ArrayList<>();
			groups.add(Filters.and(Filters.eq("userId", user.getUserId()),
					Filters.eq(sharedMethod, true)));
			for (String gpId: user.getGroupsIds()) {
				groups.add(Filters.and(Filters.eq("groupId", gpId),
						Filters.eq(sharedMethod, true)));
			}
			Bson query = Filters.and(Filters.eq("_id", id), Filters.or(
					Filters.eq("owner.userId", user.getUserId()),
					Filters.eq("visibility", VisibilityFilter.PUBLIC.name()),
					Filters.eq("visibility", VisibilityFilter.PROTECTED.name()),
					Filters.elemMatch("shared", Filters.or(groups))));
			executeCountQuery(request, collection, MongoQueryBuilder.build(query), 1, handler);
		} else {
			handler.handle(false);
		}
	}

}
