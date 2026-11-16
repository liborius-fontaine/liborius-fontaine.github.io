
/**
 * Kourou Space Simulator
 * Module : Space Data Management
 */

// =====================================
// 1. DONNÉES DES LANCEURS
// =====================================

export const LAUNCHERS = [
    {
        id: "ariane-6",
        name: "Ariane 6",
        agency: "ESA",
        type: "Heavy-lift launcher",
        description: "Lanceur spatial européen conçu pour placer différentes charges utiles en orbite.",
        available: true
    },

    {
        id: "vega-c",
        name: "Vega-C",
        agency: "ESA",
        type: "Light-lift launcher",
        description: "Lanceur européen destiné notamment aux missions d'observation et scientifiques.",
        available: true
    }
];


// =====================================
// 2. DONNÉES DES ORBITES
// =====================================

export const ORBITS = [
    {
        id: "LEO",
        name: "Low Earth Orbit",
        description: "Orbite terrestre basse."
    },

    {
        id: "MEO",
        name: "Medium Earth Orbit",
        description: "Orbite terrestre moyenne."
    },

    {
        id: "GEO",
        name: "Geostationary Orbit",
        description: "Orbite géostationnaire."
    },

    {
        id: "SSO",
        name: "Sun-Synchronous Orbit",
        description: "Orbite héliosynchrone."
    },

    {
        id: "HEO",
        name: "Highly Elliptical Orbit",
        description: "Orbite terrestre fortement elliptique."
    }
];


// =====================================
// 3. RÉCUPÉRER UN LANCEUR PAR SON ID
// =====================================

export function getLauncherById(id) {
    return LAUNCHERS.find(
        launcher => launcher.id === id
    ) || null;
}


// =====================================
// 4. RÉCUPÉRER UNE ORBITE PAR SON ID
// =====================================

export function getOrbitById(id) {
    return ORBITS.find(
        orbit => orbit.id === id
    ) || null;
}


// =====================================
// 5. RÉCUPÉRER LES LANCEURS DISPONIBLES
// =====================================

export function getAvailableLaunchers() {
    return LAUNCHERS.filter(
        launcher => launcher.available
    );
}
