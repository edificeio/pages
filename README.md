# Notes d'utilisation

## Construction

<pre>
		gradle copyMod
</pre>

## Déploier dans ent-core


## Configuration

Dans le fichier `/infra/src/main/resources/mod.json` :


Déclarer l'application dans `"one-modules"`:
<pre>
	{
		"name": "fr.wseduc~scrap-book~0.1-SNAPSHOT"
	}
</pre>


Associer une route d'entée à la configuration du module proxy intégré (`"name": "com.wse~http-proxy~1.0.0"`) :
<pre>
	{
		"location": "/scrapbook",
		"proxy_pass": "http://localhost:8020"
	}
</pre>

