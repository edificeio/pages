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
Dans l'application Pages, l'unité partageable est Website (nommé projet dans l'interface). Il est adressable en lecture à l'adresse suivante :
Privé : /pages#/preview/:id
Public : /pages/p/website#/preview/:id

Il est composé de la manière suivante :

* Un Folder contient des Folders et des Websites,
* Un Website contient une liste de Pages,
* Une Page contient une liste de Rows,
* Une Row contient une liste de Cells,
* Une Cell contient un Media.

Les Media peuvent être de type :

* Texte (string de HTML)
* Image (source de l'image)
* Audio (source de l'audio)
* Video (source de la vidéo)
* Sniplet (nom de l'application et identifiant du sniplet).

Le texte, image, audio et vidéo sont rendus directement dans l'application. Le sniplet est composé d'un template et d'un contrôleur téléchargés dans l'application correspondante (qui doit être listée dans applications-resources). Les sniplets ne sont pas exclusifs à Pages, et peuvent être utilisés dans divers services (Communautés, Frise chronologique, etc...). Pages est cependant l'application les utilisant de la manière la plus intensive.

Le panneau déroulant de pages permet de charger un contenu par drag-and-drop dans une ligne. Si le contenu est de type simple, la cellule contiendra un sélecteur permettant de choisir le contenu multimédia, ou l'éditeur afin de compléter le texte. S'il s'agit d'un sniplet, la directive sniplet-source est affichée jusqu'à ce que l'utilisateur choisisse une source, et par la suite la directive sniplet. Enfin, dans le cas d'un template, le contenu HTML du template est téléchargé depuis le fichier correspondant via une requête HTTP, puis affecté à la cellule.

En mode lecture, les directives de sélection sont remplacées par des composants d'affichage (editor devient bind-html, image-select img, etc...).

Les dossiers sont représentés sous forme de tableaux d'id de Website, et peuvent avoir un dossier parent. Puisque la visibilité sur les projets n'est pas la même d'un utilisateur à un autre, les dossiers ne *sont jamais partageables*. Ils sont toujours privés.

##Contrôleurs
####Library
Library sert à lister les projets et gérer les dossiers.
####Edit
####View

## Directives spécifiques
Des directives ont été ajoutées pour gérer des comportements UX spécifiques.

####Css-editor
L'éditeur CSS est un éditeur SASS. Il permet de modifier le style CSS d'une Page. Il est composé de deux parties : un aperçu permettant de visualiser les changements, et une zone d'édition. La zone d'édition est une textera recouverte par une simple div affichant la version du texte entré par l'utilisateur avec la coloration syntaxique. La coloration syntaxique est faite par la bibliothèque Prism.js, qui est également utilisée dans le cadre de l'éditeur pour l'édition HTML.

Une fois l'édition achevée, le contenu est compilé par sass-js afin de l'englober dans un namespace (la grille d'affichage de pages). Cela permet d'éviter que les styles customisés ne débordent sur le reste de l'ENT.

####Drawing-grid
Drawing-grid est la grille d'affichage des pages. Elle gère l'affichage des lignes, permet d'ajouter des lignes via le récepteur de drop add-row, et positionne l'éditeur. L'éditeur, dans le cadre de pages, est positionné par défaut sous le titre. Si l'utilisateur scroll en-dessous de la position de l'éditeur, il est replacé sous le portail. Quand le scroll revient vers sa position initiale, l'éditeur reprend sa place dans le flux du contenu.

Le comportement de l'éditeur diffère légèrement en mode affichage. Lorsque l'utilisateur a les droits d'édition sur la page, l'éditeur est placé comme en édition. Lorsqu'il dispose uniquement des droits de lecture, il est toujours affiché sous le portail, étant donné que l'espace dédié (la ligne contenant les boutons), est absente.

####Grid-cell
Grid-cell représente la cellule. Elle permet d'afficher un petit menu de customisation, de supprimer la cellule à la demande, et de charger un polyfill pour la sélection de couleur lorsque l'input color est absent (Safari par exemple).

####Grid-resizable
Grid-resizable permet de modifier la taille d'une cellule. Lors du déplacement de la limite par l'utilisateur, la taille de la cellule est calculée en fonction de la distance de la souris par rapport à la position d'origine. La taille des cellules voisines est modifiée pour que la somme des tailles des cellules correspondent toujours à une ligne (une ligne contenant une seule cellule n'est donc pas redimensionnable). Lors du lâché de l'utilisateur, la nouvelle taille de la cellule est calculée à partir de la grille CSS à douze colonnes. La taille de colonne la plus proche est appliquée.

Si la taille de colonne de toutes les cellules ne correspond pas à la taille de la ligne, l'ensemble des tailles sont recalculées pour remplir l'espace.

####Grid-row
Grid-row représente la ligne de la page. Elle permet de réceptionner du contenu : soit des cellules voisines, soit des blocs de contenu venant du panneau. Lors d'un drag over, les cellules sont redimensionnées à la taille cible. un margin-left est appliqué à la cellule à la position de la souris, afin de figurer l'espace que prendra la cellule une fois déposée.

Lors du drop, l'index de la cellule contenant un margin-left, ou l'index de la dernière cellule plus un si aucune cellule ne dispose d'un margin-left, est appliqué à la nouvelle cellule. La cellule est ajoutée à la ligne, avec son contenu cible.

####Panel
Le panneau est un dérivé du panel présent dans entcore. Il gère quelques outils supplémentaires, comme le chargement à la demande des templates, et dispose de quelques comportements spécifiques, telle la fermeture au début d'un drag.

## Sites publics

Les Websites peuvent être privés ou publics. Un projet public peut être visible de n'importe quel utilisateur à l'intérieur ou en dehors de l'ENT. Cela signifie que l'ensemble du contenu doit également être visible. En pratique :

* Les images et le son sont uploadés avec l'attribut visibility à public,
* L'éditeur est chargé en mode public, ce qui implique que les images, le son et les pièces jointes sont uploadés en public,
* Seuls les sniplets dont les droits importent peu sont disponibles : la navigation (puisque ses droits sont les mêmes que ceux du projet), ainsi que les documents et le carousel (avec l'upload en public également).

Les liens ajoutés dans l'éditeur restent donc privés s'ils pointent vers du contenu privé. Les contenus copiés-collé intégrant des images ou des sons privés restent privés.

## Edition de contenu

