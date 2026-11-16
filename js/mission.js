
/**
 * Kourou Space Simulator
 * Module : Mission Management
 */

// Les différents états possibles d'une mission
export const MISSION_STATUS = {
    DRAFT: "draft",
    READY: "ready",
    IN_PROGRESS: "in_progress",
    COMPLETED: "completed",
    FAILED: "failed"
};

// Création d'une nouvelle mission
export function createMission({
    name,
    launcherId,
    orbit,
    payloadName,
    payloadMassKg
}) {
    const mission = {
        id: crypto.randomUUID(),

        name: String(name ?? "").trim(),

        launcherId: launcherId,

        orbit: orbit,

        payload: {
            name: String(payloadName ?? "").trim(),
            massKg: Number(payloadMassKg)
        },

        status: MISSION_STATUS.DRAFT,

        createdAt: new Date().toISOString(),

        simulation: null
    };

    return mission;
}
