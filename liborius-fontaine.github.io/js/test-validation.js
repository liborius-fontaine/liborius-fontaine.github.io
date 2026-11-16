
import { createMission } from "./mission.js";
import { validateMission } from "./validation.js";

// TEST 1 : Mission correcte
const mission1 = createMission({
    name: "Mission Alpha",
    launcherId: "ariane-6",
    orbit: "LEO",
    payloadName: "Satellite d'observation",
    payloadMassKg: 500
});

const result1 = validateMission(mission1);

console.log("TEST 1 - Mission correcte");
console.log(result1);


// TEST 2 : Masse négative
const mission2 = createMission({
    name: "Mission Beta",
    launcherId: "unknown",
    orbit: "LEO",
    payloadName: "Satellite météo",
    payloadMassKg: -500
});

const result2 = validateMission(mission2);

console.log("TEST 2 - Masse négative");
console.log(result2);


// TEST 3 : Nom manquant
const mission3 = createMission({
    name: "",
    launcherId: "ariane-6",
    orbit: "LEO",
    payloadName: "Satellite scientifique",
    payloadMassKg: 300
});

const result3 = validateMission(mission3);

console.log("TEST 3 - Nom manquant");
console.log(result3);
