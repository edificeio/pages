# Notes d'utilisation

## Installation

Builder l'application :

<pre>
	npm install
	gulp build
	gradle clean install
</pre>

Puis l'ajouter à la liste des applications à installer dans le springboard dans le fichier build.gradle. Ensuite, rebuilder le springboard :

<pre>
	gradle clean init
	gradle generateTestConf
</pre>

Enfin, lancer le springboard. Sous windows :
<pre>
	run.bat
</pre>

Sous Mac/Linux :
<pre>
	sh run.sh
</pre>