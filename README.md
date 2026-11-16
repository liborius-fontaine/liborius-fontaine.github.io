# Kourou Space Simulator — interface V1.2

La V1.2 ajoute deux événements de simulation à l'interface V1.1 : les incidents atmosphériques et la libération visuelle de la charge utile à l'arrivée sur l'orbite cible.

## Installation dans le dépôt existant

À la racine de `liborius-fontaine.github.io` :

1. Copier `index.html` à la racine du dépôt.
2. Copier `css/style.css` dans le dossier `css/` existant.
3. Copier `js/app.js` dans le dossier `js/` existant.
4. **Ne pas remplacer** les modules techniques déjà développés : `mission.js`, `validation.js`, `data.js`, `countdown.js`, `simulator.js`, `storage.js`, `missionManager.js`, `launchSequence.js` et `telemetry.js`.
5. Conserver la configuration ES modules dans `package.json` (`"type": "module"`).
6. Ouvrir `index.html` avec Live Server ou un serveur HTTP local.

## Nouveautés V1.2

### 1. Incidents atmosphériques

- Un curseur « Risque d'incident en vol » règle une probabilité par mission, de 0 à 100 %.
- Valeur initiale : 10 %.
- À 0 %, aucun incident n'est programmé.
- À 100 %, un incident est garanti pendant le passage atmosphérique du scénario.
- Le type d'incident et son altitude de déclenchement (entre 25 et 90 km) sont choisis pour la mission.
- Les événements possibles comprennent une défaillance propulsive, une perte de pression, une anomalie de guidage ou une surchauffe d'un équipement.
- Quand l'incident se déclenche, la séquence est interrompue, l'animation d'explosion se joue et le statut est enregistré comme `failed`, avec le motif, l'altitude, la progression et l'heure de l'incident.

### 2. Libération orbitale de la charge utile

- Si le vol atteint la fin de la simulation sans incident, une animation de séparation se déclenche à l'arrivée sur l'orbite cible.
- Le satellite de démonstration s'éloigne du lanceur et ses panneaux solaires se déploient.
- Le nom de la charge utile préparée apparaît sous le satellite.
- Le journal confirme la séparation et la libération de la charge utile.

## Tester les deux scénarios

### Vol nominal et déploiement

1. Régler « Risque d'incident en vol » à `0 %`.
2. Préparer la mission.
3. Démarrer le compte à rebours.
4. Laisser la simulation aller jusqu'à 100 %.
5. Vérifier l'animation du satellite, le déploiement des panneaux et le journal.

### Incident et explosion

1. Régler « Risque d'incident en vol » à `100 %`.
2. Préparer une nouvelle mission.
3. Démarrer le compte à rebours.
4. Pendant l'ascension, attendre l'incident entre 25 et 90 km dans le scénario.
5. Vérifier l'explosion, l'arrêt du vol, le message d'alerte et le statut `ÉCHEC EN VOL` dans l'historique.

## Données et limites du modèle

- La probabilité d'incident est un paramètre de scénario pédagogique. Elle ne représente pas une probabilité statistique réelle de panne d'Ariane 6 ou Vega-C.
- Les types d'incident, l'altitude de déclenchement, la surchauffe affichée et l'explosion sont des événements visuels simplifiés ; ils ne constituent pas un modèle de sûreté ou de dynamique de vol.
- La séparation et le déploiement du satellite sont une animation illustrative, pas une simulation physique de séparation, d'attitude ou de mise en service d'un satellite réel.
- Le modèle d'altitude et de vitesse reste celui du simulateur JavaScript existant ; il n'est pas un simulateur certifié d'un lanceur réel.
- Aucune bibliothèque graphique externe n'est requise. Les graphiques de télémétrie sont dessinés avec Canvas.

## Vérification syntaxique

Depuis la racine du projet :

```bash
node --check js/app.js
```
