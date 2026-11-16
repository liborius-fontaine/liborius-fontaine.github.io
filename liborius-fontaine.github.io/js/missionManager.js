
import { createMission } from "./mission.js";
import { validateMission } from "./validation.js";
import {
    saveMission,
    getAllMissions,
    getMissionById,
    deleteMission
} from "./storage.js";
import { createSimulator } from "./simulator.js";

/**
 * Gestionnaire central des missions.
 */
export function createMissionManager() {
    // Conserve les simulateurs actifs en mémoire.
    const activeSimulators = new Map();

    /**
     * Crée, valide et sauvegarde une mission.
     */
    function create(data) {
        const mission = createMission(data);
        const validation = validateMission(mission);

        if (!validation.valid) {
            return {
                success: false,
                errors: validation.errors,
                mission: null
            };
        }

        saveMission(mission);

        return {
            success: true,
            errors: [],
            mission
        };
    }

    /**
     * Récupère toutes les missions.
     */
    function getAll() {
        return getAllMissions();
    }

    /**
     * Récupère une mission par son ID.
     */
    function getById(id) {
        return getMissionById(id);
    }

    /**
     * Supprime une mission.
     */
    function remove(id) {
        const simulator = activeSimulators.get(id);

        if (simulator) {
            simulator.cancel();
            activeSimulators.delete(id);
        }

        return deleteMission(id);
    }

    /**
     * Démarre la simulation d'une mission.
     */
    function startSimulation(id, options = {}) {
        const mission = getMissionById(id);

        if (!mission) {
            throw new Error("Mission introuvable.");
        }

        if (activeSimulators.has(id)) {
            throw new Error("Une simulation existe déjà pour cette mission.");
        }

        if (mission.status === "completed" || mission.status === "cancelled") {
            throw new Error("Cette mission ne peut plus être démarrée.");
        }

        const simulator = createSimulator({
            durationSeconds: options.durationSeconds ?? 60,
            targetAltitudeKm: options.targetAltitudeKm ?? 200,
            targetVelocityKms: options.targetVelocityKms ?? 7.8,

            onUpdate: (state) => {
                mission.simulation = state;

                if (typeof options.onUpdate === "function") {
                    options.onUpdate(state);
                }
            },

            onComplete: (state) => {
                mission.status = "completed";
                mission.simulation = state;

                saveMission(mission);
                activeSimulators.delete(id);

                if (typeof options.onComplete === "function") {
                    options.onComplete(state);
                }
            }
        });

        mission.status = "running";
        saveMission(mission);

        activeSimulators.set(id, simulator);

        simulator.start();

        return simulator.getState();
    }

    /**
     * Met en pause une simulation.
     */
    function pauseSimulation(id) {
        const simulator = activeSimulators.get(id);

        if (!simulator) {
            return false;
        }

        simulator.pause();

        const mission = getMissionById(id);

        if (mission) {
            mission.status = "paused";
            mission.simulation = simulator.getState();
            saveMission(mission);
        }

        return true;
    }

    /**
     * Reprend une simulation en pause.
     */
    function resumeSimulation(id) {
        const simulator = activeSimulators.get(id);

        if (!simulator) {
            return false;
        }

        simulator.resume();

        const mission = getMissionById(id);

        if (mission) {
            mission.status = "running";
            saveMission(mission);
        }

        return true;
    }

    /**
     * Annule une simulation.
     */
    function cancelSimulation(id) {
        const simulator = activeSimulators.get(id);

        if (!simulator) {
            return false;
        }

        simulator.cancel();

        const mission = getMissionById(id);

        if (mission) {
            mission.status = "cancelled";
            mission.simulation = simulator.getState();
            saveMission(mission);
        }

        activeSimulators.delete(id);

        return true;
    }

    return {
        create,
        getAll,
        getById,
        remove,
        startSimulation,
        pauseSimulation,
        resumeSimulation,
        cancelSimulation
    };
}
