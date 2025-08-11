# À propos de l'application pages
    
* Licence : [AGPL v3](http://www.gnu.org/licenses/agpl.txt) - Copyright Edifice
* Financeur(s) : Edifice
* Développeur(s) : Edifice
* Description : module de création de sites et d'espaces collaboratifs avec mise en page libre.

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

## Structure générale
Dans l'application Pages, l'unité partageable est Website (nommé projet dans l'interface).

Il est composé de la manière suivante :

* Un Folder contient des Folders et des Websites,
* Un Website contient une liste de Pages,
* Une Page contient une liste de Rows,
* Une Row contient une liste de Cells,
* Une Cell contient un Media.

Le panneau déroulant de pages permet de charger un contenu par drag-and-drop dans une ligne. Si le contenu est de type simple, la cellule contiendra un sélecteur permettant de choisir le contenu multimédia, ou l'éditeur afin de compléter le texte. S'il s'agit d'un sniplet, la directive sniplet-source est affichée jusqu'à ce que l'utilisateur choisisse une source, et par la suite la directive sniplet. Enfin, dans le cas d'un template, le contenu HTML du template est téléchargé depuis le fichier correspondant via une requête HTTP, puis affecté à la cellule.

En mode lecture, les directives de sélection sont remplacées par des composants d'affichage (editor devient bind-html, image-select img, etc...).

##Model

####Website
Il est adressable en lecture à l'adresse suivante :

Privé : /pages#/preview/:id
Public : /pages/p/website#/preview/:id

L'enregistrement des modifications est fait en majorité par l'enregistrement automatique, qui passe par toolkit/autosaver. Ce dernier est typiquement activé en édition.

Lors de l'enregistrement d'un projet, l'ensemble des sniplets dans ses pages est consulté pour récupérer les identifiants des autres ressources partageables. Lors du partage ou de l'ajout d'un sniplet, les droits sont propagés du projet vers le sniplet. Les droits existants vers d'autres groupes ou utilisateurs ne sont pas écrasés, mais les droits du projet sont ajoutés. Si des droits vers les groupes et utilisateurs vers lesquels le projet a été partagé existent déjà sur la ressource du sniplet, ils sont supprimés. Cela permet de gérer les cas suivants :

* Aucun droit d'existe : les droits du projet sont appliqués,
* Des droits sans rapport avec le projet (avec d'autres groupes ou d'autres utilisateurs) existent : les droits sont conservés, mais ceux du projet sont ajoutés,
* L'utilisateurs supprime ou diminue les droits du projets : les droits des sniplets sont diminués ou supprimés en conséquence.

Cela signifie que si un projet est en lecture vers un groupe, un autre en écriture vers ce même groupe, et que les deux utilisent les mêmes ressources dans leurs sniplets, les droits seront incompatibles.

####Page
Les pages sont également adressables, sous la forme :

Privé : /pages#/preview/:id_du_site/:lien_de_page
Public : /pages/p/website#/preview/:id_du_site/:lien_de_page

Le lien est le titre initial de la page, modifié pour ne contenir aucun caractère spécial, et numéroté si des pages déjà existantes ont le même titre. 

Les nouvelles pages sont générées avec un template prédéfini, contenant un sniplet de navigation et un tutoriel.

Chaque page dispose d'un SCSS customisé, qui sera wrappé dans un sélecteur drawing-grid. 

####Row
Les lignes des pages sont représentées sous forme de liste indexée. Elles contiennent des cellules, qui afficheront du contenu. Suivant la grille CSS utilisée dans l'ENT, les lignes font douze colonnes. Les cellules qu'elles contiennent s'additionnent donc toujours à 12.

####Cell
Chaque cellule contient un media qui représente la source de contenu affiché.
Les Media peuvent être de type :

* Texte (string de HTML)
* Image (source de l'image)
* Audio (source de l'audio)
* Video (source de la vidéo)
* Sniplet (nom de l'application et identifiant du sniplet).

Le texte, image, audio et vidéo sont rendus directement dans l'application. Le sniplet est composé d'un template et d'un contrôleur téléchargés dans l'application correspondante (qui doit être listée dans applications-resources). Les sniplets ne sont pas exclusifs à Pages, et peuvent être utilisés dans divers services (Communautés, Frise chronologique, etc...). Pages est cependant l'application les utilisant de la manière la plus intensive.

Chaque cellule dispose d'un objet style qui sera appliqué lors de son affichage, et d'un titre.

####Block

Les blocks sont de petits fragments de HTML permettant de simplifier la mise en page des cellules. Chaque block référence une url vers un fichier HTML qui contient son code. Les mots-clefs permettent de rechercher un type de block (image, titre, etc...).

Au niveau CSS, les blocks sont stylés depuis le thème, dans un fichier dédié page-template-blocks.scss.

####Folder

Les dossiers sont représentés sous forme de tableaux d'id de Website, et peuvent avoir un dossier parent. Puisque la visibilité sur les projets n'est pas la même d'un utilisateur à un autre, les dossiers ne *sont jamais partageables*. Ils sont toujours privés.

##Contrôleurs

####Main
Le contrôleur de base de l'application. Il gère les redirections et les fonctions génériques (par exemple ouverture et fermeture de lightboxes).

####Library
Library sert à lister les projets et gérer les dossiers. Les listes de projets et de dossiers sont gérées par l'outil toolkit Provider, qui permet télécharger les données à la demande et de les mettre en cache. Lors de l'ouverture de la librairie, tous les watchers sont éteints afin d'éviter les enregistrements intempestifs.

####Edit
Le mode édition de l'application. Il contient tous les outils de modifications de pages. Lors de son ouverture, le watcher du site correspondant est affiché.

####View
Le mode visualisation de l'application. Il désactive le watcher.

## Directives spécifiques
Des directives ont été ajoutées pour gérer des comportements UX spécifiques. La communication entre la majorité des directives repose sur un système de drag and drop, qui est géré par des outils d'entcore, dans ui.ts. Globalement, les éléments ayant la classe droppable ou la directive dropItem peuvent être des cibles de drop, et les éléments draggables utilisent la directive dragItem, ou directement la fonction extendElement.draggable dans Ui.

Le drag and drop n'est pas géré en natif pour plusieurs raisons :

* Le support sur mobile est quasi inexistant (et par extension sur tablettes également),
* Le positionnement des éléments n'est pas calculé sur Firefox,
* Les animations sont difficiles à appliquer en mode natif.

####Css-editor
L'éditeur CSS est un éditeur SASS. Il permet de modifier le style CSS d'une Page. Il est composé de deux parties : un aperçu permettant de visualiser les changements, et une zone d'édition. La zone d'édition est une textera recouverte par une simple div affichant la version du texte entré par l'utilisateur avec la coloration syntaxique. La coloration syntaxique est faite par la bibliothèque Prism.js, qui est également utilisée dans le cadre de l'éditeur pour l'édition HTML.

Une fois l'édition achevée, le contenu est compilé par sass-js afin de l'englober dans un namespace (la grille d'affichage de pages). Cela permet d'éviter que les styles customisés ne débordent sur le reste de l'ENT.

####Drawing-grid
Drawing-grid est la grille d'affichage des pages. Elle gère l'affichage des lignes, permet d'ajouter des lignes via le récepteur de drop add-row, et positionne l'éditeur. L'éditeur, dans le cadre de pages, est positionné par défaut sous le titre. Si l'utilisateur scroll en-dessous de la position de l'éditeur, il est replacé sous le portail. Quand le scroll revient vers sa position initiale, l'éditeur reprend sa place dans le flux du contenu.

Le comportement de l'éditeur diffère légèrement en mode affichage. Lorsque l'utilisateur a les droits d'édition sur la page, l'éditeur est placé comme en édition. Lorsqu'il dispose uniquement des droits de lecture, il est toujours affiché sous le portail, étant donné que l'espace dédié (la ligne contenant les boutons), est absente.

####Grid-cell
Grid-cell représente la cellule. Elle permet d'afficher un petit menu de customisation, de supprimer la cellule à la demande, et de charger un polyfill pour la sélection de couleur lorsque l'input color est absent (Safari par exemple).

Lors du drag de la cellule, sa taille est limitée à 400px. Le contenu est recentré pour que l'utilisateur garde sous sa souris le contenu sur lequel il a cliqué.

####Grid-resizable
Grid-resizable permet de modifier la taille d'une cellule. Lors du déplacement de la limite par l'utilisateur, la taille de la cellule est calculée en fonction de la distance de la souris par rapport à la position d'origine. La taille des cellules voisines est modifiée pour que la somme des tailles des cellules correspondent toujours à une ligne (une ligne contenant une seule cellule n'est donc pas redimensionnable). Lors du lâché de l'utilisateur, la nouvelle taille de la cellule est calculée à partir de la grille CSS à douze colonnes. La taille de colonne la plus proche est appliquée.

Si la taille de colonne de toutes les cellules ne correspond pas à la taille de la ligne, l'ensemble des tailles sont recalculées pour remplir l'espace.

####Grid-row
Grid-row représente la ligne de la page. Elle permet de réceptionner du contenu : soit des cellules voisines, soit des blocs de contenu venant du panneau. Lors d'un drag over, les cellules sont redimensionnées à la taille cible. un margin-left est appliqué à la cellule à la position de la souris, afin de figurer l'espace que prendra la cellule une fois déposée.

Lors du drop, l'index de la cellule contenant un margin-left, ou l'index de la dernière cellule plus un si aucune cellule ne dispose d'un margin-left, est appliqué à la nouvelle cellule. La cellule est ajoutée à la ligne, avec son contenu cible.

####Panel
Le panneau est un dérivé du panel présent dans entcore. Il gère quelques outils supplémentaires, comme le chargement à la demande des templates, et dispose de quelques comportements spécifiques, telle la fermeture au début d'un drag.

Tous les éléments du panel sont draggables.

## Sites publics

Les Websites peuvent être privés ou publics. Un projet public peut être visible de n'importe quel utilisateur à l'intérieur ou en dehors de l'ENT. Cela signifie que l'ensemble du contenu doit également être visible. En pratique :

* Les images et le son sont uploadés avec l'attribut visibility à public,
* L'éditeur est chargé en mode public, ce qui implique que les images, le son et les pièces jointes sont uploadés en public,
* Seuls les sniplets dont les droits importent peu sont disponibles : la navigation (puisque ses droits sont les mêmes que ceux du projet), ainsi que les documents et le carousel (avec l'upload en public également).

Les liens ajoutés dans l'éditeur restent donc privés s'ils pointent vers du contenu privé. Les contenus copiés-collé intégrant des images ou des sons privés restent privés.
