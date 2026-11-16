
import { createMission } from "./mission.js";

const mission = createMission({
    name: "Mission Alpha",
    launcherId: "ariane-6",
    orbit: "LEO",
    payloadName: "Satellite d'observation",
    payloadMassKg: 500
});

console.log(mission);
