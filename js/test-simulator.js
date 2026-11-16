
import { createSimulator } from "./simulator.js";

console.log("=== KOUROU SPACE SIMULATOR ===");
console.log("FLIGHT SIMULATION TEST");

// Création du simulateur
const simulator = createSimulator({

    durationSeconds: 10,

    targetAltitudeKm: 200,

    targetVelocityKms: 7.8,

    onUpdate: (state) => {

        console.log(
            `Progression: ${state.progress}% | ` +
            `Altitude: ${state.altitudeKm} km | ` +
            `Vitesse: ${state.velocityKms} km/s | ` +
            `Phase: ${state.phase} | ` +
            `Statut: ${state.status}`
        );
    },

    onComplete: (result) => {

        console.log("\nMISSION COMPLETED!");

        console.log("Résultat final :");

        console.log(result);
    }
});


// Démarrage
simulator.start();


// Pause après 3 secondes
setTimeout(() => {

    simulator.pause();

    console.log("\nSIMULATION PAUSED");

    console.log(simulator.getState());

    // Reprise après 2 secondes
    setTimeout(() => {

        console.log("\nSIMULATION RESUMED");

        simulator.resume();

    }, 2000);

}, 3000);


/*import { createSimulator } from "./simulator.js";

const simulator = createSimulator({
    durationSeconds: 10,

    onUpdate: (state) => {
        console.log(state);
    }
});

simulator.start();

setTimeout(() => {
    simulator.cancel();

    console.log("MISSION CANCELLED");
    console.log(simulator.getState());

}, 2000);*/