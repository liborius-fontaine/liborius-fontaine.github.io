
import {
    LAUNCHERS,
    ORBITS,
    getLauncherById,
    getOrbitById,
    getAvailableLaunchers
} from "./data.js";


// TEST 1 : Afficher tous les lanceurs
console.log("TEST 1 - Tous les lanceurs");
console.log(LAUNCHERS);


// TEST 2 : Afficher toutes les orbites
console.log("TEST 2 - Toutes les orbites");
console.log(ORBITS);


// TEST 3 : Rechercher Ariane 6
console.log("TEST 3 - Recherche Ariane 6");
console.log(getLauncherById("ariane-6"));


// TEST 4 : Rechercher une orbite LEO
console.log("TEST 4 - Recherche LEO");
console.log(getOrbitById("LEO"));


// TEST 5 : Rechercher un lanceur inexistant
console.log("TEST 5 - Lanceur inexistant");
console.log(getLauncherById("unknown"));


// TEST 6 : Lanceurs disponibles
console.log("TEST 6 - Lanceurs disponibles");
console.log(getAvailableLaunchers());
