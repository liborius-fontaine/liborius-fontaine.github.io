
/**
 * Système de télémétrie du Kourou Space Simulator.
 */
export function createTelemetry({ maxSamples = 1000 } = {}) {
    if (!Number.isInteger(maxSamples) || maxSamples <= 0) {
        throw new Error("maxSamples doit être un entier positif.");
    }

    const history = [];

    /**
     * Enregistre une nouvelle mesure du vol.
     */
    function record(state) {
        if (!state || typeof state !== "object") {
            throw new Error("Les données de télémétrie sont invalides.");
        }

        const requiredFields = [
            "elapsedSeconds",
            "progress",
            "altitudeKm",
            "velocityKms",
            "phase",
            "status"
        ];

        for (const field of requiredFields) {
            if (!(field in state)) {
                throw new Error(`Donnée manquante : ${field}`);
            }
        }

        const numericFields = [
            "elapsedSeconds",
            "progress",
            "altitudeKm",
            "velocityKms"
        ];

        for (const field of numericFields) {
            if (!Number.isFinite(state[field])) {
                throw new Error(`Valeur numérique invalide : ${field}`);
            }
        }

        const sample = {
            timestamp: Date.now(),
            elapsedSeconds: state.elapsedSeconds,
            progress: state.progress,
            altitudeKm: state.altitudeKm,
            velocityKms: state.velocityKms,
            phase: state.phase,
            status: state.status
        };

        history.push(sample);

        // Conserve uniquement les dernières mesures.
        if (history.length > maxSamples) {
            history.shift();
        }

        return { ...sample };
    }

    /**
     * Récupère tout l'historique.
     */
    function getHistory() {
        return history.map(sample => ({ ...sample }));
    }

    /**
     * Récupère la dernière mesure.
     */
    function getLatest() {
        if (history.length === 0) {
            return null;
        }

        return { ...history[history.length - 1] };
    }

    /**
     * Récupère le nombre de mesures.
     */
    function getCount() {
        return history.length;
    }

    /**
     * Calcule quelques statistiques du vol.
     */
    function getStats() {
        if (history.length === 0) {
            return null;
        }

        const highestAltitude = Math.max(
            ...history.map(sample => sample.altitudeKm)
        );

        const highestVelocity = Math.max(
            ...history.map(sample => sample.velocityKms)
        );

        const latest = getLatest();

        return {
            totalSamples: history.length,
            highestAltitudeKm: highestAltitude,
            highestVelocityKms: highestVelocity,
            finalProgress: latest.progress,
            finalStatus: latest.status
        };
    }

    /**
     * Efface l'historique.
     */
    function clear() {
        history.length = 0;
    }

    return {
        record,
        getHistory,
        getLatest,
        getCount,
        getStats,
        clear
    };
}
