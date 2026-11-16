
import { createTelemetry } from "./telemetry.js";
import { createCountdown } from "./countdown.js";


/**
 * Coordonne le compte à rebours et le vol spatial.
 */
export function createLaunchSequence({
    missionManager,
    missionId,
    countdownDuration = 10,
    simulationOptions = {},
    onCountdownTick,
    onLaunch,
    onUpdate,
    onComplete,
    onError
}) {
    if (!missionManager || !missionId) {
        throw new Error("Un gestionnaire et un identifiant de mission sont obligatoires.");
    }

    if (typeof missionManager.getById !== "function" ||
        typeof missionManager.startSimulation !== "function") {
        throw new Error("Gestionnaire de missions invalide.");
    }

    if (!Number.isFinite(countdownDuration) || countdownDuration <= 0) {
        throw new Error("La durée du compte à rebours doit être positive.");
    }

    const mission = missionManager.getById(missionId);

    if (!mission) {
        throw new Error("Mission introuvable.");
    }

    let phase = "ready";
    let status = "idle";
    let flightStarted = false;
    const telemetry = createTelemetry();
    
    const countdown = createCountdown({
        duration: countdownDuration,

        onTick: (remaining) => {
            if (phase !== "countdown") return;

            if (typeof onCountdownTick === "function") {
                onCountdownTick(remaining);
            }
        },

        onComplete: () => {
            if (status !== "running" || phase !== "countdown") return;

            phase = "flight";
            flightStarted = true;

            try {
                if (typeof onLaunch === "function") {
                    onLaunch(mission);
                }

                missionManager.startSimulation(missionId, {
                    ...simulationOptions,

                    onUpdate: (state) => {
                        if (status !== "running") return;

                        // Enregistrer automatiquement la mesure du vol.
                        telemetry.record(state);

                        // Transmettre la mesure à l'interface ou au test.
                        if (typeof onUpdate === "function") {
                            onUpdate(state);
                        }
            },

                    onComplete: (state) => {
                        status = "completed";
                        phase = "completed";

                        if (typeof onComplete === "function") {
                            onComplete(state);
                        }
                    }
                });
            } catch (error) {
                status = "error";
                phase = "error";

                if (typeof onError === "function") {
                    onError(error);
                }
            }
        }
    });

    function start() {
        if (status !== "idle") {
            throw new Error("La séquence a déjà été démarrée.");
        }

        status = "running";
        phase = "countdown";

        countdown.start();

        return getState();
    }

    function pause() {
        if (status !== "running") return false;

        if (phase === "countdown") {
            countdown.pause();
        } else if (phase === "flight") {
            missionManager.pauseSimulation(missionId);
        } else {
            return false;
        }

        status = "paused";

        return true;
    }

    function resume() {
        if (status !== "paused") return false;

        if (phase === "countdown") {
            countdown.resume();
        } else if (phase === "flight") {
            missionManager.resumeSimulation(missionId);
        } else {
            return false;
        }

        status = "running";

        return true;
    }

    function cancel() {
        if (status !== "running" && status !== "paused") {
            return false;
        }

        if (phase === "countdown") {
            countdown.cancel();
        } else if (phase === "flight" && flightStarted) {
            missionManager.cancelSimulation(missionId);
        }

        status = "cancelled";
        phase = "cancelled";

        return true;
    }

    function getState() {
    return {
        status,
        phase,
        countdown: countdown.getState(),
        mission: missionManager.getById(missionId),
        telemetry: {
            count: telemetry.getCount(),
            latest: telemetry.getLatest(),
            stats: telemetry.getStats()
        }
    };
    }

    return {
        start,
        pause,
        resume,
        cancel,
        getState,
        telemetry
    };
}
