package fr.wseduc.pages;

import fr.wseduc.pages.controllers.ActionFilter;
import fr.wseduc.pages.controllers.PagesController;
import fr.wseduc.webutils.Server;
import fr.wseduc.webutils.request.filter.SecurityHandler;

public class Pages extends Server {

	@Override
	public void start() {
		super.start();

		PagesController controller = new PagesController(vertx, container, rm, securedActions);
		controller.get("", "view");

		SecurityHandler.addFilter(
				new ActionFilter(controller.securedUriBinding(), container.config(), vertx)
		);
	}

}
