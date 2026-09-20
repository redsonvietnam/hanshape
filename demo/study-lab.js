import { CHARACTER_MODEL } from "../src/character-model.js";
import { matchSemantic } from "../src/matcher.js";
import { observationToSemanticQuery } from "../src/observation-query.js";
import {
  rankAdaptiveObservations,
  applyObservationAnswer
} from "../src/multivalue-observation.js";

const els = {
  target: document.querySelector("#target"),
  targetName: document.querySelector("#targetName"),
  newTask: document.querySelector("#newTask"),
  export: document.querySelector("#export"),
  status: document.querySelector("#status"),
  elapsed: document.querySelector("#elapsed"),
  actions: document.querySelector("#actions"),
  remaining: document.querySelector("#remaining"),
  guidance: document.querySelector("#guidance"),
  candidateState: document.querySelector("#candidateState")
};

const STUDY_CHARACTERS = CHARACTER_MODEL.filter(
  character => character.form === "SINGLE"
);

let target = null;
let candidates = [];
let sessionStartedAt = 0;
let lastActionAt = 0;
let timerId = null;
let completed = false;
let eventLog = [];
let actionCount = 0;

function now() {
  return performance.now();
}

function elapsedMs() {
  return sessionStartedAt ? now() - sessionStartedAt : 0;
}

function candidateChars() {
  return candidates.map(candidate => candidate.char);
}

function valueLabel(value) {
  if (value === "__missing__") return "không có";
  if (value === true) return "có";
  if (value === false) return "không";
  return String(value);
}

function targetSource(candidate, observation) {
  return observation.target === "C"
    ? candidate.regions?.C
    : candidate.regions?.[observation.target];
}

function readValue(candidate, observation) {
  const source = targetSource(candidate, observation);
  if (!source) return "__missing__";

  if (observation.kind === "region") {
    return observation.path.reduce(
      (value, key) => value?.[key],
      source
    ) ?? "__missing__";
  }

  if (observation.kind === "strokeType") {
    return source.strokeTypes?.includes(observation.path[0]) ?? false;
  }

  if (observation.kind === "relation") {
    const relation = (source.relations || []).find(item =>
      [
        item.type,
        item.a ?? "",
        item.b ?? ""
      ].join("|") === observation.relationKey
    );

    return relation?.value ?? "__missing__";
  }

  return "__missing__";
}

function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

function renderMetrics() {
  els.elapsed.textContent = (elapsedMs() / 1000).toFixed(1) + "s";
  els.actions.textContent = String(actionCount);
  els.remaining.textContent = String(candidates.length);
}

function renderState() {
  els.target.textContent = target?.char ?? "?";
  els.targetName.textContent = target
    ? (target.pinyin ? target.pinyin + " · " + target.strokes + " nét" : target.char)
    : "Chưa bắt đầu";

  renderMetrics();

  if (!target) {
    els.candidateState.textContent = "Nhấn Task mới để bắt đầu.";
    return;
  }

  const chars = candidateChars();
  els.candidateState.textContent = chars.length <= 12
    ? chars.join("  ")
    : chars.slice(0, 12).join("  ") + " … (" + chars.length + " candidates)";

  if (completed) {
    els.status.textContent = "Hoàn thành task.";
    els.status.className = "status success";
  }
}

function renderGuidance() {
  els.guidance.replaceChildren();

  if (!target) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = "Chưa có task.";
    els.guidance.append(p);
    return;
  }

  if (completed || candidates.length <= 1) {
    const p = document.createElement("p");
    p.className = "success";
    p.textContent = candidates.length === 1 && candidates[0].char === target.char
      ? "Đúng chữ đích. Task đã hoàn thành."
      : "Candidate set không còn phù hợp với chữ đích.";
    els.guidance.append(p);
    return;
  }

  const observations = rankAdaptiveObservations(candidates, {
    limit: 5,
    costMode: "flat"
  });

  if (!observations.length) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = "Không còn observation tách được candidate set.";
    els.guidance.append(p);
    return;
  }

  for (const observation of observations) {
    const row = document.createElement("div");
    row.className = "obs-row";

    const title = document.createElement("b");
    title.textContent = observation.label;
    row.append(title);

    const meta = document.createElement("div");
    meta.className = "muted";
    meta.textContent =
      "IG " + observation.informationGain.toFixed(3) +
      " · còn lớn nhất " + observation.expectedRemaining +
      "/" + observation.candidateCount;
    row.append(meta);

    const values = document.createElement("div");
    values.className = "values";

    for (const partition of observation.partitionValues) {
      const button = document.createElement("button");
      button.textContent = valueLabel(partition.value);
      button.addEventListener("click", () =>
        applyObservedValue(observation, partition.value)
      );
      values.append(button);
    }

    row.append(values);
    els.guidance.append(row);
  }
}

function logEvent(event) {
  eventLog.push({
    ...event,
    elapsedMs: Math.round(elapsedMs())
  });
}

function completeTask() {
  completed = true;
  stopTimer();
  logEvent({
    type: "complete",
    target: target.char,
    candidateCount: candidates.length,
    actions: actionCount
  });
  els.export.disabled = false;
  renderState();
  renderGuidance();
}

function applyObservedValue(observation, value) {
  if (completed) return;

  const before = candidateChars();
  const observedQuery = observationToSemanticQuery(observation, value);
  const started = lastActionAt || sessionStartedAt;

  if (!observedQuery) {
    logEvent({
      type: "invalid_observation",
      observationId: observation.id,
      value
    });
    return;
  }

  const after = applyObservationAnswer(
    candidates,
    observation,
    value
  );

  candidates = after;
  actionCount += 1;

  logEvent({
    type: "observation_select",
    observationId: observation.id,
    concept: observation.concept,
    kind: observation.kind,
    targetRegion: observation.target,
    value,
    latencyMs: Math.round(now() - started),
    candidateCountBefore: before.length,
    candidateCountAfter: after.length,
    candidateCharactersBefore: before,
    candidateCharactersAfter: candidateChars()
  });

  lastActionAt = now();

  if (candidates.length === 1 && candidates[0].char === target.char) {
    completeTask();
    return;
  }

  if (!candidates.some(candidate => candidate.char === target.char)) {
    logEvent({
      type: "target_excluded",
      target: target.char
    });
    els.status.textContent = "Lựa chọn vừa rồi đã loại chữ đích. Hãy reset task.";
    els.status.className = "status";
  }

  renderState();
  renderGuidance();
}

function newTask() {
  const index = Math.floor(Math.random() * STUDY_CHARACTERS.length);
  target = STUDY_CHARACTERS[index];
  candidates = [...STUDY_CHARACTERS];
  sessionStartedAt = now();
  lastActionAt = sessionStartedAt;
  actionCount = 0;
  completed = false;
  eventLog = [];

  logEvent({
    type: "session_start",
    target: target.char,
    candidateCount: candidates.length,
    corpus: "CHARACTER_MODEL:SINGLE"
  });

  els.export.disabled = true;
  els.status.textContent = "";
  els.status.className = "status";
  stopTimer();
  timerId = setInterval(renderMetrics, 100);
  renderState();
  renderGuidance();
}

function exportSession() {
  if (!target) return;

  const payload = {
    schemaVersion: "0.1",
    createdAt: new Date().toISOString(),
    study: "HanShape Human Effort Study",
    corpus: "CHARACTER_MODEL:SINGLE",
    target: target.char,
    eventLog,
    summary: {
      elapsedMs: Math.round(elapsedMs()),
      actions: actionCount,
      completed
    }
  };

  const blob = new Blob(
    [JSON.stringify(payload, null, 2)],
    { type: "application/json" }
  );
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "hanshape-human-effort-" +
    new Date().toISOString().replace(/[:.]/g, "-") +
    ".json";
  anchor.click();
  URL.revokeObjectURL(url);
}

els.newTask.addEventListener("click", newTask);
els.export.addEventListener("click", exportSession);
renderState();
renderGuidance();
