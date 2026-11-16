
import { createCountdown } from "./countdown.js";

console.log("=== KOUROU SPACE SIMULATOR ===");
console.log("TEST DU COMPTE A REBOURS");

// Créer un compte à rebours de 5 secondes
const countdown = createCountdown({
    duration: 5,

    onTick: (seconds) => {
        console.log(`T - ${seconds}`);
    },

    onComplete: () => {
        console.log("IGNITION ! DECOLLAGE !");
        console.log(countdown.getState());
    }
});

// Démarrer
countdown.start();

// Mettre en pause après 2 secondes
setTimeout(() => {
    countdown.pause();

    console.log("PAUSE :", countdown.getState());

    // Reprendre après 2 secondes de pause
    setTimeout(() => {
        countdown.resume();

        console.log("REPRISE :", countdown.getState());

    }, 2000);

}, 2000);
