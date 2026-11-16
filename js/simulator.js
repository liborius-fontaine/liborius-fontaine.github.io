
/**
 * Kourou Space Simulator
 * Module : Flight Simulation Engine
 */

// Création du moteur de simulation
export function createSimulator({
    durationSeconds = 60,
    targetAltitudeKm = 200,
    targetVelocityKms = 7.8,
    onUpdate = () => {},
    onComplete = () => {}
} = {}) {

    // Vérification des paramètres
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
        throw new Error("La durée doit être positive.");
    }

    if (!Number.isFinite(targetAltitudeKm) || targetAltitudeKm <= 0) {
        throw new Error("L'altitude cible doit être positive.");
    }

    if (!Number.isFinite(targetVelocityKms) || targetVelocityKms <= 0) {
        throw new Error("La vitesse cible doit être positive.");
    }

    // Variables internes
    let elapsedSeconds = 0;
    let startedAt = null;
    let intervalId = null;
    let status = "idle";


    // Déterminer la phase actuelle du vol
    function getFlightPhase(progress) {

        if (progress < 0.10) {
            return "liftoff";
        }

        if (progress < 0.45) {
            return "powered_ascent";
        }

        if (progress < 0.65) {
            return "stage_separation";
        }

        if (progress < 0.90) {
            return "orbital_insertion";
        }

        return "orbit_achieved";
    }


    // Calculer les données du vol
    function calculateState() {

        const progress = Math.min(
            elapsedSeconds / durationSeconds,
            1
        );

        // Évolution progressive de l'altitude
        const altitude = targetAltitudeKm *
            Math.pow(progress, 1.6);

        // Évolution progressive de la vitesse
        const smoothProgress =
            3 * Math.pow(progress, 2) -
            2 * Math.pow(progress, 3);

        const velocity =
            targetVelocityKms * smoothProgress;

        return {
            elapsedSeconds: Number(elapsedSeconds.toFixed(1)),

            progress: Number((progress * 100).toFixed(1)),

            altitudeKm: Number(altitude.toFixed(2)),

            velocityKms: Number(velocity.toFixed(2)),

            phase: getFlightPhase(progress),

            status: status
        };
    }


    // Arrêter le timer
    function clearTimer() {

        if (intervalId !== null) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }


    // Mettre à jour la simulation
    function update() {

        if (status !== "running") return;

        elapsedSeconds = Math.min(
            (Date.now() - startedAt) / 1000,
            durationSeconds
        );

        const isCompleted =
            elapsedSeconds >= durationSeconds;

        if (isCompleted) {

            elapsedSeconds = durationSeconds;

            clearTimer();

            status = "completed";
        }

        const state = calculateState();

        onUpdate(state);

        if (isCompleted) {
            onComplete(state);
        }
    }


    // Démarrer la simulation
    function start() {

        if (status !== "idle") return;

        status = "running";

        startedAt = Date.now() - elapsedSeconds * 1000;

        update();

        if (status === "running") {
            intervalId = setInterval(update, 100);
        }
    }


    // Mettre en pause
    function pause() {

        if (status !== "running") return;

        elapsedSeconds = Math.min(
            (Date.now() - startedAt) / 1000,
            durationSeconds
        );

        clearTimer();

        status = "paused";

        onUpdate(calculateState());
    }


    // Reprendre la simulation
    function resume() {

        if (status !== "paused") return;

        status = "running";

        startedAt = Date.now() - elapsedSeconds * 1000;

        if (elapsedSeconds >= durationSeconds) {
            update();
            return;
        }

        onUpdate(calculateState());

        intervalId = setInterval(update, 100);
    }


    // Annuler la simulation
    function cancel() {

        if (
            status === "completed" ||
            status === "cancelled"
        ) {
            return;
        }

        clearTimer();

        status = "cancelled";

        onUpdate(calculateState());
    }


    // Obtenir les données actuelles
    function getState() {
        return calculateState();
    }


    // Fonctions accessibles à l'extérieur
    return {
        start,
        pause,
        resume,
        cancel,
        getState
    };
}
