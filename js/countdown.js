
/**
 * Kourou Space Simulator
 * Module : Countdown Management
 */

// Création d'un compte à rebours
export function createCountdown({
    duration,
    onTick = () => {},
    onComplete = () => {}
}) {

    // Vérifier la durée
    if (!Number.isInteger(duration) || duration <= 0) {
        throw new Error("La durée doit être un entier positif.");
    }

    // Variables internes
    let remainingSeconds = duration;
    let intervalId = null;
    let endTime = null;
    let status = "idle";


    // Arrêter le timer interne
    function clearTimer() {
        if (intervalId !== null) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }


    // Mettre à jour le compte à rebours
    function tick() {

        const newRemaining = Math.max(
            0,
            Math.ceil((endTime - Date.now()) / 1000)
        );

        if (newRemaining !== remainingSeconds) {
            remainingSeconds = newRemaining;
            onTick(remainingSeconds);
        }

        if (remainingSeconds === 0) {
            clearTimer();

            status = "completed";

            onComplete();
        }
    }


    // Démarrer le compte à rebours
    function start() {

        if (status !== "idle") return;

        status = "running";

        endTime = Date.now() + remainingSeconds * 1000;

        onTick(remainingSeconds);

        intervalId = setInterval(tick, 250);
    }


    // Mettre en pause
    function pause() {

        if (status !== "running") return;

        remainingSeconds = Math.max(
            0,
            Math.ceil((endTime - Date.now()) / 1000)
        );

        clearTimer();

        status = "paused";

        onTick(remainingSeconds);
    }


    // Reprendre le compte à rebours
    function resume() {

        if (status !== "paused") return;

        status = "running";

        endTime = Date.now() + remainingSeconds * 1000;

        intervalId = setInterval(tick, 250);

        onTick(remainingSeconds);
    }


    // Annuler le compte à rebours
    function cancel() {

        if (status === "completed" || status === "cancelled") {
            return;
        }

        clearTimer();

        status = "cancelled";
    }


    // Consulter l'état actuel
    function getState() {

        return {
            remainingSeconds,
            status
        };
    }


    // Exposer les fonctions publiques
    return {
        start,
        pause,
        resume,
        cancel,
        getState
    };
}
