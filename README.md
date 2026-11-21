EXPLORE BÉNIN — VERSION FINALE

CONTENU
Explore-Benin-final/
├── index.html
├── css/style.css
├── js/ (animations, search, favorites, navigation, quiz, gallery)
└── assets/images/   (27 photos utilisées + dossier "reserve" avec 7 photos non utilisées)

OUVRIR LE SITE
Ouvre le dossier dans Visual Studio Code et lance index.html avec Live Server (ou double-clic sur index.html).
Internet est nécessaire pour les polices Google et pour ouvrir les vidéos hébergées sur YouTube/Facebook. Les aperçus vidéo et les photos du site sont des fichiers locaux.

PUBLIER (Git en ligne de commande)
git add .
git commit -m "Version finale Explore Bénin"
git push origin main

FONCTIONNALITÉS (pour la soutenance)
- Recherche et filtres des destinations (search.js)
- Favoris enregistrés avec LocalStorage (favorites.js)
- Galerie de 26 photos : filtres, recherche, fenêtre d'agrandissement avec description et récit historique/culturel pour chaque photo, liens vers des sources de référence et navigation par flèches (gallery.js)
- Quiz de 5 questions (quiz.js)
- Vidéos : les aperçus ouvrent directement les vidéos sur YouTube ou Facebook (pas de lecteur intégré).
- Menu mobile (navigation.js), animations d'apparition (animations.js)

PHOTOS
Les 9 photos récemment ajoutées ont été rangées dans assets/images/ et intégrées à la galerie : monument des morts, Présidence du Bénin, Afoké, Amazone sous le ciel, océan, arène d'Ouidah, Zangbéto, Novotel et Sofitel. Le dossier reserve/ contient 7 photos non utilisées : pour en afficher une, déplace-la dans assets/images/ et ajoute sa carte dans index.html.
Crédits : voir la note en pied de page ; à compléter si tu retrouves les auteurs.
