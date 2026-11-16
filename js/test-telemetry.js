
import { createTelemetry } from "./telemetry.js";

const telemetry = createTelemetry();

console.log("=== TEST TELEMETRY ===");

// Mesure 1
telemetry.record({
    elapsedSeconds: 1,
    progress: 10,
    altitudeKm: 5,
    velocityKms: 1.2,
    phase: "powered_ascent",
    status: "running"
});

// Mesure 2
telemetry.record({
    elapsedSeconds: 2,
    progress: 20,
    altitudeKm: 15,
    velocityKms: 2.5,
    phase: "powered_ascent",
    status: "running"
});

// Mesure 3
telemetry.record({
    elapsedSeconds: 3,
    progress: 100,
    altitudeKm: 200,
    velocityKms: 7.8,
    phase: "orbit_achieved",
    status: "completed"
});

// Test des fonctions
console.log("1. Historique :", telemetry.getHistory());

console.log("2. Dernière mesure :", telemetry.getLatest());

console.log("3. Nombre de mesures :", telemetry.getCount());

console.log("4. Statistiques :", telemetry.getStats());

// Test de la suppression
telemetry.clear();

console.log("5. Après nettoyage :", telemetry.getCount());
