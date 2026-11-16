
const STORAGE_KEY = "kourou_space_simulator_missions";

/**
 * Récupère toutes les missions sauvegardées.
 */
export function getAllMissions() {
    const savedMissions = localStorage.getItem(STORAGE_KEY);

    if (!savedMissions) {
        return [];
    }

    try {
        const missions = JSON.parse(savedMissions);

        return Array.isArray(missions) ? missions : [];
    } catch (error) {
        console.error("Erreur de lecture des missions :", error);
        return [];
    }
}

/**
 * Sauvegarde une mission.
 * Si elle existe déjà, elle est mise à jour.
 */
export function saveMission(mission) {
    if (!mission || typeof mission !== "object" || !mission.id) {
        throw new Error("Mission invalide : un identifiant est obligatoire.");
    }

    const missions = getAllMissions();

    const existingIndex = missions.findIndex(
        item => item.id === mission.id
    );

    if (existingIndex !== -1) {
        missions[existingIndex] = mission;
    } else {
        missions.push(mission);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(missions));

    return mission;
}

/**
 * Recherche une mission par son identifiant.
 */
export function getMissionById(id) {
    return getAllMissions().find(mission => mission.id === id) || null;
}

/**
 * Supprime une mission.
 */
export function deleteMission(id) {
    const missions = getAllMissions();

    const updatedMissions = missions.filter(
        mission => mission.id !== id
    );

    if (updatedMissions.length === missions.length) {
        return false;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMissions));

    return true;
}

/**
 * Supprime toutes les missions sauvegardées.
 */
export function clearMissions() {
    localStorage.removeItem(STORAGE_KEY);
}
