
/**
 * Kourou Space Simulator
 * Module : Mission Validation
 */

import {
    getLauncherById,
    getOrbitById
} from "./data.js";


// Vérification des informations d'une mission
export function validateMission(mission) {

    const errors = [];

    // Vérifier que la mission existe
    if (!mission || typeof mission !== "object") {
        return {
            valid: false,
            errors: ["Mission invalide."]
        };
    }

    // Vérifier le nom
    if (
        typeof mission.name !== "string" ||
        mission.name.trim() === ""
    ) {
        errors.push("Le nom de la mission est obligatoire.");
    }

    // Vérifier le lanceur
    if (!getLauncherById(mission.launcherId)) {
        errors.push("Veuillez sélectionner un lanceur valide.");
    }

    // Vérifier l'orbite
    if (!getOrbitById(mission.orbit)) {
        errors.push("L'orbite sélectionnée est invalide.");
    }

    // Vérifier la charge utile
    if (
        !mission.payload ||
        typeof mission.payload.name !== "string" ||
        mission.payload.name.trim() === ""
    ) {
        errors.push("Le nom de la charge utile est obligatoire.");
    }

    // Vérifier la masse
    if (
        !mission.payload ||
        !Number.isFinite(mission.payload.massKg) ||
        mission.payload.massKg <= 0
    ) {
        errors.push("La masse doit être un nombre positif.");
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
