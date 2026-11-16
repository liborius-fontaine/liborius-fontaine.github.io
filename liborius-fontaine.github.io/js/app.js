import { createMissionManager } from "./missionManager.js";
import { createLaunchSequence } from "./launchSequence.js";
import { LAUNCHERS, ORBITS } from "./data.js";
import { saveMission } from "./storage.js";

const manager = createMissionManager();
const $ = (selector) => document.querySelector(selector);

const elements = {
  missionForm: $("#mission-form"),
  missionName: $("#mission-name"),
  launcher: $("#launcher-select"),
  orbit: $("#orbit-select"),
  launcherConfigField: $("#launcher-config-field"),
  launcherConfig: $("#launcher-config-select"),
  payloadName: $("#payload-name"),
  payloadMass: $("#payload-mass"),
  propellantSetting: $("#propellant-setting"),
  propellantSettingValue: $("#propellant-setting-value"),
  incidentRisk: $("#incident-risk-setting"),
  incidentRiskValue: $("#incident-risk-value"),
  prepare: $("#prepare-btn"),
  start: $("#start-btn"),
  pause: $("#pause-btn"),
  resume: $("#resume-btn"),
  cancel: $("#cancel-btn"),
  scene: $("#launch-scene"),
  rocket: $("#rocket-track"),
  countdown: $("#scene-countdown"),
  countdownNumber: $("#countdown-number"),
  status: $("#launch-state"),
  controlMessage: $("#control-message"),
  eventLog: $("#event-log"),
  history: $("#history-list"),
  summary: $("#mission-summary"),
  feedback: $("#preflight-feedback"),
};

let currentMission = null;
let currentSequence = null;
let currentPlan = null;
let currentTargetAltitude = 200;
let currentTargetVelocity = 7.8;
let currentProgress = 0;
let ignitionTimer = null;
let payloadDeploymentTimer = null;
const failedMissionIds = new Set();

const COUNTDOWN_SECONDS = 5;
const atmosphericIncidentTypes = [
  "Défaillance du système propulsif",
  "Perte de pression dans un réservoir",
  "Anomalie du système de guidage",
  "Surchauffe d'un équipement de bord",
];

const phaseLabels = {
  ready: "STANDBY",
  countdown: "COUNTDOWN",
  liftoff: "LIFTOFF",
  powered_ascent: "POWERED ASCENT",
  stage_separation: "STAGE SEPARATION",
  orbital_insertion: "ORBITAL INSERTION",
  orbit_achieved: "ORBIT ACHIEVED",
  flight: "ASCENSION",
  completed: "COMPLETED",
  paused: "PAUSED",
  cancelled: "ABORTED",
  error: "SYSTEM ERROR",
  failure: "FLIGHT FAILURE",
};

const statusLabels = {
  idle: "Système prêt",
  running: "Séquence en cours",
  paused: "Simulation en pause",
  completed: "Mission accomplie",
  cancelled: "Séquence annulée",
  error: "Erreur de séquence",
};

const orbitParameters = {
  LEO: { altitudeKm: 200, velocityKms: 7.8 },
  MEO: { altitudeKm: 20000, velocityKms: 3.9 },
  GEO: { altitudeKm: 35786, velocityKms: 3.07 },
  SSO: { altitudeKm: 600, velocityKms: 7.5 },
  HEO: { altitudeKm: 35000, velocityKms: 4.2 },
};

// Capacités constructeur publiées pour les orbites LEO et SSO.
// Les coefficients des autres orbites sont des estimations pédagogiques,
// et ne doivent pas être interprétés comme des performances garanties.
const launcherProfiles = {
  "ariane-6": {
    defaultConfiguration: "ariane-64",
    configurations: {
      "ariane-62": {
        label: "Ariane 62 · 2 boosters",
        payloadCapacityKg: { LEO: 11100, SSO: 8500 },
        nominalPropellantTonnes: 464,
      },
      "ariane-64": {
        label: "Ariane 64 · 4 boosters",
        payloadCapacityKg: { LEO: 22600, SSO: 18300 },
        nominalPropellantTonnes: 748,
      },
    },
  },
  "vega-c": {
    defaultConfiguration: "standard",
    configurations: {
      standard: {
        label: "Vega-C",
        payloadCapacityKg: { LEO: 3300, SSO: 2300 },
        nominalPropellantTonnes: 190.54,
      },
    },
  },
};

const orbitCapacityFactors = { MEO: 0.62, GEO: 0.42, HEO: 0.38 };
const orbitFuelThresholds = { LEO: 70, SSO: 74, MEO: 82, GEO: 90, HEO: 88 };

function formatNumber(value, digits = 1) {
  const safe = Number.isFinite(Number(value)) ? Number(value) : 0;
  return safe.toLocaleString("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatElapsed(seconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, "0");
  const remaining = String(safeSeconds % 60).padStart(2, "0");
  return `T+${minutes}:${remaining}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function log(message, type = "info") {
  const row = document.createElement("div");
  row.className = "log-entry";
  const time = document.createElement("time");
  time.textContent = new Date().toLocaleTimeString("fr-FR", { hour12: false });
  const marker = document.createElement("span");
  marker.className = `log-marker ${type}`;
  const text = document.createElement("p");
  text.textContent = message;
  row.append(time, marker, text);
  elements.eventLog.prepend(row);

  while (elements.eventLog.children.length > 35) {
    elements.eventLog.lastElementChild?.remove();
  }
}

function populateSelect(select, items, placeholder) {
  select.replaceChildren();
  if (!items.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = placeholder;
    select.append(option);
    select.disabled = true;
    return;
  }

  select.disabled = false;
  for (const item of items) {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.name || item.id;
    select.append(option);
  }
}

function getSelectedLauncher() {
  return LAUNCHERS.find((item) => item.id === elements.launcher.value) || null;
}

function getSelectedOrbit() {
  return ORBITS.find((item) => item.id === elements.orbit.value) || ORBITS[0] || null;
}

function syncLauncherConfiguration() {
  const family = launcherProfiles[elements.launcher.value];
  if (!family) {
    elements.launcherConfigField.hidden = true;
    return;
  }

  const configs = Object.entries(family.configurations).map(([id, profile]) => ({
    id,
    name: profile.label,
  }));
  populateSelect(elements.launcherConfig, configs, "Configuration indisponible");
  elements.launcherConfig.value = family.defaultConfiguration;
  elements.launcherConfigField.hidden = configs.length < 2;
}

function getSelectedLauncherProfile() {
  const family = launcherProfiles[elements.launcher.value];
  if (!family) return null;
  const configId = family.configurations[elements.launcherConfig.value]
    ? elements.launcherConfig.value
    : family.defaultConfiguration;
  const configuration = family.configurations[configId];
  return configuration ? { ...configuration, configurationId: configId } : null;
}

function getTargetAltitude(orbit) {
  if (!orbit) return 200;
  const candidate = orbit.targetAltitudeKm ?? orbit.altitudeKm ?? orbit.altitude;
  if (Number.isFinite(Number(candidate)) && Number(candidate) > 0) return Number(candidate);
  return orbitParameters[orbit.id]?.altitudeKm || 200;
}

function getTargetVelocity(orbit) {
  if (!orbit) return 7.8;
  const candidate = orbit.targetVelocityKms ?? orbit.velocityKms;
  if (Number.isFinite(Number(candidate)) && Number(candidate) > 0) return Number(candidate);
  return orbitParameters[orbit.id]?.velocityKms || 7.8;
}

function getPayloadCapacity(profile, orbit) {
  if (!profile || !orbit) return { capacityKg: 0, source: "indisponible" };
  const officialCapacity = profile.payloadCapacityKg?.[orbit.id];
  if (Number.isFinite(officialCapacity)) {
    return { capacityKg: officialCapacity, source: "référence publiée" };
  }

  const factor = orbitCapacityFactors[orbit.id];
  const leoCapacity = profile.payloadCapacityKg?.LEO;
  if (Number.isFinite(leoCapacity) && Number.isFinite(factor)) {
    return {
      capacityKg: Math.round(leoCapacity * factor),
      source: "estimation pédagogique",
    };
  }
  return { capacityKg: 0, source: "non renseignée" };
}

function assessPreflight() {
  const launcher = getSelectedLauncher();
  const orbit = getSelectedOrbit();
  const profile = getSelectedLauncherProfile();
  const payloadMassKg = Number(elements.payloadMass.value);
  const reservePercent = clamp(elements.propellantSetting.value, 0, 100);
  const incidentChancePercent = clamp(elements.incidentRisk.value, 0, 100);
  const capacity = getPayloadCapacity(profile, orbit);
  const hasCapacity = capacity.capacityKg > 0;
  const payloadRatio = hasCapacity ? payloadMassKg / capacity.capacityKg : 0;
  const baseFuel = orbitFuelThresholds[orbit?.id] ?? 80;
  const requiredFuelPercent = Math.min(98, Math.ceil(baseFuel + payloadRatio * 8));
  const errors = [];

  if (!launcher) errors.push("Aucun lanceur disponible.");
  if (!orbit) errors.push("Aucune orbite cible sélectionnée.");
  if (!elements.missionName.value.trim()) errors.push("Le nom de mission est obligatoire.");
  if (!elements.payloadName.value.trim()) errors.push("Le nom de la charge utile est obligatoire.");
  if (!Number.isFinite(payloadMassKg) || payloadMassKg <= 0) {
    errors.push("La masse de la charge utile doit être supérieure à zéro.");
  } else if (hasCapacity && payloadMassKg > capacity.capacityKg) {
    errors.push(`Charge utile trop lourde : ${formatNumber(payloadMassKg, 0)} kg pour une limite de ${formatNumber(capacity.capacityKg, 0)} kg.`);
  }
  if (reservePercent < requiredFuelPercent) {
    errors.push(`Réserve insuffisante : ${formatNumber(reservePercent, 0)} % disponibles, ${requiredFuelPercent} % estimés nécessaires.`);
  }

  return {
    valid: errors.length === 0,
    errors,
    launcher,
    orbit,
    profile,
    capacity,
    payloadMassKg,
    payloadRatio,
    reservePercent,
    requiredFuelPercent,
    incidentChancePercent,
  };
}

function renderPreflightFeedback(assessment, { show = true, prepared = false } = {}) {
  const hasErrors = assessment.errors.length > 0;
  elements.feedback.hidden = !show;
  elements.feedback.classList.toggle("is-no-go", hasErrors);
  const title = document.createElement("strong");
  title.textContent = hasErrors ? "NO-GO · DÉCOLLAGE INTERDIT" : prepared ? "GO · MISSION PRÊTE" : "CONTRÔLES · CONFIGURATION CONFORME";
  const detail = document.createElement("div");
  detail.textContent = hasErrors
    ? assessment.errors.join(" ")
    : `Charge utile et réserve vérifiées · seuil propulsif estimé : ${assessment.requiredFuelPercent} %.`;
  elements.feedback.replaceChildren(title, detail);

  const readiness = $("#preflight-status");
  readiness.textContent = hasErrors ? "NO-GO" : prepared ? "GO · PRÊT" : "À VÉRIFIER";
  const card = readiness.closest(".system-card");
  card.classList.toggle("is-go", !hasErrors && prepared);
  card.classList.toggle("is-no-go", hasErrors);
  $("#preflight-caption").textContent = hasErrors
    ? "Corrigez les paramètres avant le lancement."
    : prepared ? "Contrôles validés · séquence disponible." : "Les contrôles seront validés à la préparation.";
}

function updateLiveResourcePreview() {
  elements.propellantSettingValue.textContent = `${formatNumber(elements.propellantSetting.value, 0)} %`;
  elements.incidentRiskValue.textContent = `${formatNumber(elements.incidentRisk.value, 0)} %`;
  const assessment = assessPreflight();
  const capacity = assessment.capacity.capacityKg;
  const payloadMass = Number.isFinite(assessment.payloadMassKg) ? Math.max(0, assessment.payloadMassKg) : 0;
  const payloadRatio = capacity > 0 ? payloadMass / capacity : 0;

  $("#payload-reading").textContent = formatNumber(payloadMass, 0);
  $("#payload-capacity").textContent = capacity > 0 ? `/ ${formatNumber(capacity, 0)} kg` : "/ capacité N/D";
  $("#payload-fill").style.width = `${clamp(payloadRatio * 100, 0, 100)}%`;
  $("#payload-caption").textContent = capacity > 0
    ? `${assessment.capacity.source} · ${formatNumber(Math.max(0, capacity - payloadMass), 0)} kg de marge`
    : "Capacité non renseignée pour ce lanceur/orbite.";

  if (!currentPlan) {
    $("#propellant-remaining").textContent = formatNumber(assessment.reservePercent, 0);
    $("#propellant-fill").style.width = `${assessment.reservePercent}%`;
    const nominalLabel = assessment.profile?.nominalPropellantTonnes
      ? ` · ${formatNumber(assessment.profile.nominalPropellantTonnes, 2)} t nominaux` : "";
    $("#propellant-caption").textContent = `Seuil scénario : ${assessment.requiredFuelPercent} %${nominalLabel}`;
    renderPreflightFeedback(assessment, { show: assessment.errors.length > 0 });
  }
  return assessment;
}

function updateOrbitPreview() {
  const orbit = getSelectedOrbit();
  if (!orbit) return;
  currentTargetAltitude = getTargetAltitude(orbit);
  currentTargetVelocity = getTargetVelocity(orbit);
  $("#orbit-info").textContent = orbit.name || orbit.id;
  $("#target-altitude").innerHTML = `${formatNumber(currentTargetAltitude, 0)} <small>KM</small>`;
  updateLiveResourcePreview();
}

function updateClock() {
  const now = new Date();
  $("#live-date").textContent = now.toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  }).toUpperCase();
  $("#live-clock").textContent = now.toLocaleTimeString("fr-FR", { hour12: false });
}

function setMetricState({ altitude = 0, velocity = 0, progress = 0, phase = "ready", status = "idle", elapsedSeconds = 0 } = {}) {
  const safeProgress = clamp(progress, 0, 100);
  $("#metric-altitude").textContent = formatNumber(altitude, 1);
  $("#metric-velocity").textContent = formatNumber(velocity, 2);
  $("#metric-progress").textContent = formatNumber(safeProgress, 0);
  $("#progress-fill").style.width = `${safeProgress}%`;
  $("#metric-phase").textContent = phaseLabels[phase] || String(phase || "STANDBY").replaceAll("_", " ").toUpperCase();
  $("#metric-status").textContent = statusLabels[status] || status;
  $("#altitude-caption").textContent = status === "idle" ? "En attente du lancement" : `Temps de vol ${formatElapsed(elapsedSeconds)}`;
  $("#velocity-caption").textContent = status === "completed" ? "Vitesse finale atteinte" : "Vitesse instantanée";
  $("#progress-caption").textContent = status === "completed" ? "Objectif de simulation atteint" : `${formatElapsed(elapsedSeconds)} · Temps écoulé`;
  $("#chart-altitude-current").textContent = formatNumber(altitude, 1);
  $("#chart-velocity-current").textContent = formatNumber(velocity, 2);
}

function updateSequenceControls() {
  const state = currentSequence?.getState();
  const status = state?.status || "idle";
  const phase = state?.phase || "ready";
  elements.start.disabled = !currentSequence || status !== "idle" || !currentPlan?.preflightPassed;
  elements.pause.disabled = !currentSequence || status !== "running";
  elements.resume.disabled = !currentSequence || status !== "paused";
  elements.cancel.disabled = !currentSequence || !["running", "paused"].includes(status);

  elements.status.classList.toggle("is-running", status === "running" || status === "paused");
  elements.status.classList.toggle("is-complete", status === "completed");
  const label = status === "running" && phase === "countdown" ? "COMPTE À REBOURS" :
    status === "running" && phase === "flight" ? "VOL EN COURS" :
    status === "paused" ? "EN PAUSE" :
    status === "completed" ? "MISSION TERMINÉE" :
    status === "cancelled" ? "ANNULÉE" :
    status === "error" ? "ERREUR" :
    currentMission ? "MISSION PRÊTE" : "EN ATTENTE";
  elements.status.querySelector("span:last-child").textContent = label;

  if (status === "idle" && currentMission) elements.controlMessage.textContent = "Séquence prête : vous pouvez démarrer le compte à rebours.";
  else if (status === "running" && phase === "countdown") elements.controlMessage.textContent = "Compte à rebours engagé. Vérifications automatiques en cours.";
  else if (status === "running" && phase === "flight") elements.controlMessage.textContent = "Propulsion active · télémétrie en cours de réception.";
  else if (status === "paused") elements.controlMessage.textContent = "Séquence suspendue. Reprenez quand vous êtes prêt.";
  else if (status === "completed") elements.controlMessage.textContent = "Objectif de simulation atteint. Mission terminée.";
  else if (status === "cancelled") elements.controlMessage.textContent = "Séquence annulée. Préparez une nouvelle mission pour recommencer.";
  else if (status === "error") elements.controlMessage.textContent = "Une erreur a interrompu la séquence. Consultez le journal.";
  else elements.controlMessage.textContent = "Configurez une mission pour commencer.";
}

function updateScenePhaseLabel() {
  let label = "PAS DE TIR · KOUROU";
  if (currentProgress >= 100) label = "ORBITE · OBJECTIF ATTEINT";
  else if (currentProgress >= 48) label = "AU-DESSUS DES NUAGES";
  else if (currentProgress >= 20) label = "TRAVERSÉE DES NUAGES";
  else if (currentProgress >= 6) label = "ASCENSION ATMOSPHÉRIQUE";
  $("#scene-phase").textContent = label;
  $("#scene-flight-tag").textContent = label;
}

function setSceneState(status, phase) {
  elements.scene.classList.toggle("is-igniting", status === "running" && phase === "countdown");
  elements.scene.classList.toggle("is-launching", status === "running" && phase === "flight");
  elements.scene.classList.toggle("is-complete", status === "completed");
  elements.countdown.classList.toggle("visible", status === "running" && phase === "countdown");
  if (status === "paused") $("#scene-phase").textContent = "SIMULATION EN PAUSE";
  else if (status === "completed") $("#scene-phase").textContent = "ORBITE CIBLE ATTEINTE";
  else if (status === "cancelled") $("#scene-phase").textContent = "SÉQUENCE ANNULÉE";
  else if (status === "running" && phase === "countdown") $("#scene-phase").textContent = "ALLUMAGE DES MOTEURS";
  else updateScenePhaseLabel();
}

function updateRocketPosition(progress) {
  currentProgress = clamp(progress, 0, 100);
  const scale = currentProgress < 10 ? 1 : Math.max(0.42, 1 - (currentProgress / 100) * 0.58);
  const bottom = 17 + currentProgress * 2.15;
  elements.rocket.style.bottom = `${bottom}px`;
  elements.rocket.style.transform = `translateX(-50%) scale(${scale.toFixed(3)})`;
  elements.scene.classList.toggle("is-cloud-crossing", currentProgress >= 20 && currentProgress < 48);
  elements.scene.classList.toggle("is-above-clouds", currentProgress >= 48);
  updateScenePhaseLabel();
}

function updatePropellantReadings(progress) {
  if (!currentPlan) return;
  const used = currentPlan.requiredFuelPercent * clamp(progress, 0, 100) / 100;
  const remaining = clamp(currentPlan.reservePercent - used, 0, 100);
  $("#propellant-remaining").textContent = formatNumber(remaining, 0);
  $("#propellant-fill").style.width = `${remaining}%`;
  const nominalLabel = currentPlan.nominalPropellantTonnes
    ? ` · référence ${formatNumber(currentPlan.nominalPropellantTonnes, 2)} t` : "";
  $("#propellant-caption").textContent = `Consommation estimée : ${formatNumber(used, 0)} % · réserve restante${nominalLabel}`;
}

function updateEngineTemperature(value, caption) {
  const temperature = clamp(value, 24, 2800);
  $("#engine-temperature").textContent = formatNumber(temperature, 0);
  $("#temperature-fill").style.width = `${(temperature / 2800) * 100}%`;
  $("#engine-temperature-caption").textContent = caption;
}

function getEngineTemperature(progress) {
  // Indicateur visuel du projet : ce n'est pas un calcul thermodynamique.
  return Math.round(780 + clamp(progress, 0, 100) * 14.2);
}

function drawTelemetryCharts() {
  const history = currentSequence?.telemetry?.getHistory?.() || [];
  drawLineChart($("#altitude-chart"), history, "altitudeKm", "#38d8f2", currentTargetAltitude);
  drawLineChart($("#velocity-chart"), history, "velocityKms", "#a88bff", currentTargetVelocity);
  const latest = history[history.length - 1];
  const endLabel = latest ? formatElapsed(latest.elapsedSeconds) : "EN ATTENTE";
  $("#altitude-chart-end").textContent = endLabel;
  $("#velocity-chart-end").textContent = endLabel;
}

function drawLineChart(canvas, history, field, color, targetValue) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(280, rect.width || 280);
  const height = Math.max(100, rect.height || 128);
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const context = canvas.getContext("2d");
  if (!context) return;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);

  const pad = { top: 10, right: 8, bottom: 14, left: 8 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const values = history.map((point) => Number(point[field]) || 0);
  const observedMax = values.length ? Math.max(...values) : 0;
  const maxValue = Math.max(targetValue || 0, observedMax, field === "velocityKms" ? 1 : 10) * 1.12;

  context.lineWidth = 1;
  context.strokeStyle = "rgba(147,174,207,.12)";
  context.setLineDash([3, 5]);
  for (let index = 0; index <= 3; index += 1) {
    const y = pad.top + (plotHeight / 3) * index;
    context.beginPath();
    context.moveTo(pad.left, y);
    context.lineTo(width - pad.right, y);
    context.stroke();
  }
  context.setLineDash([]);

  if (history.length === 0) {
    context.fillStyle = "rgba(137,160,190,.6)";
    context.font = "10px DM Mono, monospace";
    context.textAlign = "center";
    context.fillText("EN ATTENTE DES DONNÉES", width / 2, height / 2 + 3);
    return;
  }

  const maxTime = Math.max(1, Number(history[history.length - 1].elapsedSeconds) || history.length - 1);
  const points = history.map((point, index) => {
    const time = Number(point.elapsedSeconds) || index;
    return {
      x: pad.left + (history.length === 1 ? 0 : (time / maxTime) * plotWidth),
      y: pad.top + plotHeight - ((Number(point[field]) || 0) / maxValue) * plotHeight,
    };
  });

  const gradient = context.createLinearGradient(0, pad.top, 0, height - pad.bottom);
  gradient.addColorStop(0, `${color}45`);
  gradient.addColorStop(1, `${color}00`);
  context.beginPath();
  context.moveTo(points[0].x, height - pad.bottom);
  for (const point of points) context.lineTo(point.x, point.y);
  context.lineTo(points[points.length - 1].x, height - pad.bottom);
  context.closePath();
  context.fillStyle = gradient;
  context.fill();

  context.beginPath();
  points.forEach((point, index) => {
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });
  context.lineWidth = 2;
  context.lineJoin = "round";
  context.lineCap = "round";
  context.strokeStyle = color;
  context.shadowColor = color;
  context.shadowBlur = 9;
  context.stroke();
  context.shadowBlur = 0;

  const latest = points[points.length - 1];
  context.beginPath();
  context.arc(latest.x, latest.y, 3.2, 0, Math.PI * 2);
  context.fillStyle = color;
  context.fill();
  context.beginPath();
  context.arc(latest.x, latest.y, 6.5, 0, Math.PI * 2);
  context.strokeStyle = `${color}65`;
  context.lineWidth = 1;
  context.stroke();
}

function renderMissionHistory() {
  const missions = manager.getAll()
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);
  $("#history-count").textContent = `${missions.length} MISSION${missions.length > 1 ? "S" : ""}`;
  elements.history.replaceChildren();

  if (!missions.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    const icon = document.createElement("span");
    icon.textContent = "◌";
    const text = document.createElement("p");
    text.textContent = "Aucune mission enregistrée pour le moment.";
    empty.append(icon, text);
    elements.history.append(empty);
    return;
  }

  for (const mission of missions) {
    const item = document.createElement("div");
    item.className = "history-item";
    const main = document.createElement("div");
    main.className = "history-item-main";
    const name = document.createElement("strong");
    name.textContent = mission.name || "Mission sans nom";
    const details = document.createElement("small");
    const date = mission.createdAt ? new Date(mission.createdAt).toLocaleDateString("fr-FR") : "Date inconnue";
    details.textContent = `${mission.launcherId || "—"} · ${mission.orbit || "—"} · ${date}`;
    main.append(name, details);
    const status = document.createElement("span");
    const missionStatus = failedMissionIds.has(mission.id) ? "failed" : (mission.status || "draft");
    status.className = `history-status ${missionStatus}`;
    status.textContent = ({ completed: "TERMINÉE", running: "EN VOL", paused: "EN PAUSE", cancelled: "ANNULÉE", failed: "ÉCHEC EN VOL", draft: "BROUILLON" })[missionStatus] || missionStatus.toUpperCase();
    item.append(main, status);
    elements.history.append(item);
  }
}

function showMissionSummary(mission, launcher, orbit, profile) {
  elements.summary.hidden = false;
  $("#summary-name").textContent = mission.name;
  const configurationName = profile?.label ? ` · ${profile.label}` : "";
  $("#summary-launcher").textContent = `${launcher?.name || launcher?.id || mission.launcherId}${configurationName}`;
  $("#summary-orbit").textContent = orbit?.name || orbit?.id || mission.orbit;
  $("#summary-payload").textContent = `${mission.payload.name} · ${formatNumber(mission.payload.massKg, 0)} kg`;
}

function setMissionFormLocked(locked) {
  elements.missionForm.querySelectorAll("input, select, button[type='submit']").forEach((control) => {
    control.disabled = locked;
  });
}

function resetTelemetry() {
  currentProgress = 0;
  setMetricState({ altitude: 0, velocity: 0, progress: 0, phase: "ready", status: "idle", elapsedSeconds: 0 });
  updateRocketPosition(0);
  updateEngineTemperature(24, "Moteurs à l'arrêt · valeur simulée");
  drawTelemetryCharts();
}

function triggerAtmosphericFailure(state) {
  if (!currentPlan || !currentPlan.incidentScheduled || currentPlan.incidentTriggered) return false;
  if (Number(state?.altitudeKm) < currentPlan.incidentAltitudeKm) return false;
  if (!currentSequence || currentSequence.getState().status !== "running") return false;

  currentPlan.incidentTriggered = true;
  const incident = currentPlan.incidentType;
  currentSequence.cancel();
  const failedMission = currentMission?.id ? manager.getById(currentMission.id) : null;
  if (failedMission) {
    failedMission.status = "failed";
    failedMission.failure = {
      reason: incident,
      altitudeKm: Number(state.altitudeKm) || 0,
      progress: Number(state.progress) || 0,
      occurredAt: new Date().toISOString(),
    };
    saveMission(failedMission);
  }
  clearTimeout(ignitionTimer);

  setMetricState({
    altitude: state.altitudeKm,
    velocity: state.velocityKms,
    progress: state.progress,
    phase: "failure",
    status: "cancelled",
    elapsedSeconds: state.elapsedSeconds,
  });
  updateRocketPosition(state.progress);
  updatePropellantReadings(state.progress);
  updateEngineTemperature(2760, "Alerte thermique · valeur d'incident simulée");
  drawTelemetryCharts();
  elements.countdown.classList.remove("visible");
  elements.scene.classList.remove("is-launching", "is-igniting", "is-complete", "is-payload-deployed");
  elements.scene.classList.add("is-flight-failure");
  $("#scene-phase").textContent = "PERTE DU VÉHICULE";
  $("#scene-flight-tag").textContent = "INCIDENT · VOL INTERROMPU";
  $("#scene-event-label").textContent = `INCIDENT CRITIQUE · ${incident}`;
  elements.controlMessage.textContent = `Échec en vol à ${formatNumber(state.altitudeKm, 1)} km : ${incident}.`;

  log(`ALERTE CRITIQUE : ${incident}. La fusée est perdue à ${formatNumber(state.altitudeKm, 1)} km dans le scénario.`, "error");
  log("Séquence interrompue automatiquement. Le statut de la mission est enregistré : ÉCHEC EN VOL.", "error");
  if (currentMission?.id) failedMissionIds.add(currentMission.id);
  updateSequenceControls();
  elements.controlMessage.textContent = `Échec en vol : ${incident}. Préparez une nouvelle mission pour recommencer.`;
  renderMissionHistory();
  return true;
}

function animatePayloadDeployment(mission) {
  clearTimeout(payloadDeploymentTimer);
  const payloadName = mission?.payload?.name || "Charge utile";
  $("#payload-deployment-name").textContent = payloadName;
  // Repositionner visuellement le lanceur pour que le satellite semble sortir du haut du véhicule.
  elements.rocket.style.bottom = "90px";
  elements.rocket.style.transform = "translateX(-50%) scale(.52)";
  elements.scene.classList.remove("is-launching", "is-igniting", "is-flight-failure");
  elements.scene.classList.add("is-complete", "is-above-clouds", "is-payload-deployed");
  $("#scene-phase").textContent = "CHARGE UTILE LIBÉRÉE";
  $("#scene-flight-tag").textContent = "ORBITE · DÉPLOIEMENT CONFIRMÉ";
  $("#scene-event-label").textContent = "SÉPARATION ORBITALE CONFIRMÉE";
  elements.controlMessage.textContent = `${payloadName} libéré sur l'orbite cible.`;
  log("Orbite cible atteinte. Séparation de la charge utile en cours.", "success");

  payloadDeploymentTimer = window.setTimeout(() => {
    log(`Charge utile libérée : ${payloadName}. Déploiement des panneaux solaires simulé.`, "success");
    renderMissionHistory();
  }, 1250);
}

function prepareMission(event) {
  event.preventDefault();
  if (currentSequence && ["running", "paused"].includes(currentSequence.getState().status)) {
    log("Terminez ou annulez la séquence actuelle avant de préparer une autre mission.", "warning");
    return;
  }

  const assessment = assessPreflight();
  if (!assessment.valid) {
    currentMission = null;
    currentSequence = null;
    currentPlan = null;
    renderPreflightFeedback(assessment);
    updateSequenceControls();
    log(`NO-GO : ${assessment.errors.join(" ")}`, "error");
    return;
  }

  const result = manager.create({
    name: elements.missionName.value.trim(),
    launcherId: assessment.launcher.id,
    orbit: assessment.orbit.id,
    payloadName: elements.payloadName.value.trim(),
    payloadMassKg: assessment.payloadMassKg,
  });

  if (!result?.success || !result.mission?.id) {
    const messages = result?.errors?.length ? result.errors.join(" · ") : "La mission n'a pas pu être créée.";
    renderPreflightFeedback({ ...assessment, errors: [messages] });
    log(`Erreur de validation : ${messages}`, "error");
    return;
  }

  currentMission = result.mission;
  currentTargetAltitude = getTargetAltitude(assessment.orbit);
  currentTargetVelocity = getTargetVelocity(assessment.orbit);
  currentPlan = {
    reservePercent: assessment.reservePercent,
    requiredFuelPercent: assessment.requiredFuelPercent,
    payloadCapacityKg: assessment.capacity.capacityKg,
    payloadCapacitySource: assessment.capacity.source,
    nominalPropellantTonnes: assessment.profile?.nominalPropellantTonnes ?? null,
    configurationLabel: assessment.profile?.label ?? assessment.launcher.name,
    incidentChancePercent: assessment.incidentChancePercent,
    incidentScheduled: Math.random() * 100 < assessment.incidentChancePercent,
    incidentAltitudeKm: 25 + Math.random() * 65,
    incidentType: atmosphericIncidentTypes[Math.floor(Math.random() * atmosphericIncidentTypes.length)],
    incidentTriggered: false,
    preflightPassed: true,
  };
  currentSequence = null;
  clearTimeout(ignitionTimer);
  clearTimeout(payloadDeploymentTimer);
  elements.scene.classList.remove("is-igniting", "is-launching", "is-complete", "is-cloud-crossing", "is-above-clouds", "is-flight-failure", "is-payload-deployed");
  $("#scene-event-label").textContent = "";
  elements.countdown.classList.remove("visible");
  elements.countdownNumber.textContent = `T − 00:${String(COUNTDOWN_SECONDS).padStart(2, "0")}`;
  elements.rocket.style.bottom = "17px";
  elements.rocket.style.transform = "translateX(-50%) scale(1)";
  showMissionSummary(currentMission, assessment.launcher, assessment.orbit, currentPlan);
  renderPreflightFeedback(assessment, { prepared: true });

  currentSequence = createLaunchSequence({
    missionManager: manager,
    missionId: currentMission.id,
    countdownDuration: COUNTDOWN_SECONDS,
    simulationOptions: {
      durationSeconds: 60,
      targetAltitudeKm: currentTargetAltitude,
      targetVelocityKms: currentTargetVelocity,
    },
    onCountdownTick: (remaining) => {
      elements.countdownNumber.textContent = `T − 00:${String(remaining).padStart(2, "0")}`;
      const preIgnition = Math.round(24 + ((COUNTDOWN_SECONDS - remaining) / COUNTDOWN_SECONDS) * 520);
      updateEngineTemperature(preIgnition, "Pré-allumage · température indicative");
      updateSequenceControls();
    },
    onLaunch: () => {
      log("Allumage des moteurs. Décollage de la fusée !", "warning");
      updateEngineTemperature(780, "Chambre moteur · valeur simulée");
      setSceneState("running", "flight");
      updateSequenceControls();
      ignitionTimer = window.setTimeout(() => {
        elements.scene.classList.remove("is-igniting");
        elements.scene.classList.add("is-launching");
      }, 250);
    },
    onUpdate: (state) => {
      if (triggerAtmosphericFailure(state)) return;
      setMetricState({
        altitude: state.altitudeKm,
        velocity: state.velocityKms,
        progress: state.progress,
        phase: state.phase,
        status: state.status,
        elapsedSeconds: state.elapsedSeconds,
      });
      updatePropellantReadings(state.progress);
      updateEngineTemperature(getEngineTemperature(state.progress), "Chambre moteur · indicateur pédagogique");
      updateRocketPosition(state.progress);
      drawTelemetryCharts();
      updateSequenceControls();
      setSceneState("running", "flight");
    },
    onComplete: (state) => {
      setMetricState({
        altitude: state.altitudeKm,
        velocity: state.velocityKms,
        progress: state.progress,
        phase: state.phase,
        status: "completed",
        elapsedSeconds: state.elapsedSeconds,
      });
      updatePropellantReadings(100);
      updateEngineTemperature(420, "Moteurs coupés · refroidissement simulé");
      updateRocketPosition(100);
      animatePayloadDeployment(currentMission);
      log("Mission terminée. Objectif orbital atteint dans le modèle pédagogique.", "success");
      updateSequenceControls();
      renderMissionHistory();
    },
    onError: (error) => {
      log(`Erreur de lancement : ${error.message}`, "error");
      updateSequenceControls();
      setMissionFormLocked(false);
    },
  });

  resetTelemetry();
  updatePropellantReadings(0);
  updateSequenceControls();
  setMissionFormLocked(true);
  renderMissionHistory();
  log(`Mission créée : ${currentMission.name} (${currentMission.id.slice(0, 8)}).`, "success");
  log(`Configuration prête : ${assessment.profile?.label || assessment.launcher.name} · ${assessment.orbit.name || assessment.orbit.id}.`);
  log(`Risque d'incident pédagogique configuré à ${formatNumber(currentPlan.incidentChancePercent, 0)} % par mission.`, "info");
  if (currentPlan.nominalPropellantTonnes) {
    log(`Charge propulsive nominale de référence : ${formatNumber(currentPlan.nominalPropellantTonnes, 2)} t.`, "info");
  }
}

function startSequence() {
  if (!currentSequence || !currentPlan?.preflightPassed) return;
  try {
    currentSequence.start();
    updateSequenceControls();
    setSceneState("running", "countdown");
    elements.countdownNumber.textContent = `T − 00:${String(COUNTDOWN_SECONDS).padStart(2, "0")}`;
    log("Séquence de lancement démarrée. Compte à rebours engagé.", "warning");
  } catch (error) {
    log(error.message, "error");
  }
}

function pauseSequence() {
  if (!currentSequence) return;
  const success = currentSequence.pause();
  log(success ? "Séquence mise en pause." : "Pause impossible dans l'état actuel.", success ? "warning" : "info");
  if (success) {
    updateSequenceControls();
    setSceneState("paused", currentSequence.getState().phase);
  }
}

function resumeSequence() {
  if (!currentSequence) return;
  const success = currentSequence.resume();
  log(success ? "Séquence reprise." : "Reprise impossible dans l'état actuel.", success ? "success" : "info");
  if (success) {
    updateSequenceControls();
    setSceneState("running", currentSequence.getState().phase);
  }
}

function cancelSequence() {
  if (!currentSequence) return;
  const success = currentSequence.cancel();
  log(success ? "Séquence annulée par l'opérateur." : "Annulation impossible : aucune séquence active.", success ? "warning" : "info");
  if (success) {
    clearTimeout(ignitionTimer);
    updateSequenceControls();
    setSceneState("cancelled", currentSequence.getState().phase);
    updateEngineTemperature(180, "Séquence interrompue · refroidissement simulé");
    renderMissionHistory();
  }
}

function resetForNewMission() {
  if (currentSequence && ["running", "paused"].includes(currentSequence.getState().status)) {
    log("Annulez ou terminez la séquence en cours avant de créer une nouvelle mission.", "warning");
    return;
  }
  currentMission = null;
  currentSequence = null;
  currentPlan = null;
  currentProgress = 0;
  setMissionFormLocked(false);
  elements.missionForm.reset();
  elements.missionName.value = "Mission Kourou — Démonstration";
  elements.payloadName.value = "Satellite d'observation";
  elements.payloadMass.value = "500";
  elements.propellantSetting.value = "100";
  elements.incidentRisk.value = "10";
  clearTimeout(ignitionTimer);
  clearTimeout(payloadDeploymentTimer);
  syncLauncherConfiguration();
  elements.summary.hidden = true;
  elements.feedback.hidden = true;
  elements.scene.classList.remove("is-igniting", "is-launching", "is-complete", "is-cloud-crossing", "is-above-clouds", "is-flight-failure", "is-payload-deployed");
  $("#scene-event-label").textContent = "";
  elements.countdown.classList.remove("visible");
  elements.countdownNumber.textContent = `T − 00:${String(COUNTDOWN_SECONDS).padStart(2, "0")}`;
  elements.rocket.style.bottom = "17px";
  elements.rocket.style.transform = "translateX(-50%) scale(1)";
  resetTelemetry();
  updateLiveResourcePreview();
  updateSequenceControls();
  log("Nouvelle configuration de mission prête.");
  $("#mission-config").scrollIntoView({ behavior: "smooth", block: "center" });
  elements.missionName.focus({ preventScroll: true });
}

function initialise() {
  const availableLaunchers = LAUNCHERS.filter((item) => item.available);
  populateSelect(elements.launcher, availableLaunchers, "Aucun lanceur disponible");
  populateSelect(elements.orbit, ORBITS, "Aucune orbite disponible");
  syncLauncherConfiguration();
  updateOrbitPreview();
  updateClock();
  window.setInterval(updateClock, 1000);
  resetTelemetry();
  updateLiveResourcePreview();
  renderMissionHistory();
  log("Centre de contrôle initialisé. Vérifications pré-vol disponibles.", "success");

  elements.missionForm.addEventListener("submit", prepareMission);
  elements.start.addEventListener("click", startSequence);
  elements.pause.addEventListener("click", pauseSequence);
  elements.resume.addEventListener("click", resumeSequence);
  elements.cancel.addEventListener("click", cancelSequence);
  elements.orbit.addEventListener("change", updateOrbitPreview);
  elements.launcher.addEventListener("change", () => {
    syncLauncherConfiguration();
    updateLiveResourcePreview();
  });
  elements.launcherConfig.addEventListener("change", updateLiveResourcePreview);
  elements.payloadMass.addEventListener("input", updateLiveResourcePreview);
  elements.propellantSetting.addEventListener("input", updateLiveResourcePreview);
  elements.incidentRisk.addEventListener("input", updateLiveResourcePreview);
  elements.payloadName.addEventListener("input", updateLiveResourcePreview);
  elements.missionName.addEventListener("input", updateLiveResourcePreview);
  $("#clear-log").addEventListener("click", () => {
    elements.eventLog.replaceChildren();
    log("Journal effacé.");
  });
  $("#focus-create").addEventListener("click", resetForNewMission);

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      document.querySelectorAll(".nav-link").forEach((item) => item.classList.remove("active"));
      link.classList.add("active");
    });
  });

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(() => drawTelemetryCharts());
    observer.observe($("#altitude-chart"));
    observer.observe($("#velocity-chart"));
  } else {
    window.addEventListener("resize", drawTelemetryCharts);
  }
}

initialise();
