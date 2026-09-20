import { CHARACTER_MODEL } from "../src/character-model.js";
import { matchInput, parseInput } from "../src/query.js";
import { rankAdaptiveObservations, applyObservationAnswer } from "../src/multivalue-observation.js";

const els = {
  input: document.querySelector("#input"),
  status: document.querySelector("#status"),
  ast: document.querySelector("#ast"),
  candidates: document.querySelector("#candidates"),
  guidance: document.querySelector("#guidance"),
  examples: document.querySelector("#examples")
};

const EXAMPLES = [
  "35",
  "35 len(C.hUpper,C.hLower)<",
  "34 pos(C.dot,C.mainAxis)=R",
  "44 40",
  "84 len(L.hUpper,L.hLower)<"
];

let candidates = CHARACTER_MODEL;

function renderCandidates() {
  els.candidates.replaceChildren();
  for (const candidate of candidates) {
    const node = document.createElement("div");
    node.className = "char";
    node.textContent = candidate.char;
    node.title = candidate.pinyin;
    els.candidates.append(node);
  }
}

function observationValueLabel(value) {
  if (value === "__missing__") return "không có";
  if (value === true) return "có";
  if (value === false) return "không";
  return String(value);
}

function applyObservedValue(observation, value) {
  candidates = applyObservationAnswer(candidates, observation, value);
  renderState(null);
}

function renderGuidance() {
  els.guidance.replaceChildren();
  if (candidates.length <= 1) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = candidates.length === 1
      ? "Đã còn đúng một candidate."
      : "Candidate set rỗng.";
    els.guidance.append(p);
    return;
  }

  const observations = rankAdaptiveObservations(candidates, { limit: 4 });
  if (!observations.length) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = "Chưa có observation nào trong ontology hiện tại có thể tách candidate set này.";
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
    meta.textContent = "IG " + observation.informationGain.toFixed(3) +
      " · còn lớn nhất " + observation.expectedRemaining + "/" + observation.candidateCount;
    row.append(meta);

    const values = document.createElement("div");
    values.className = "values";
    for (const partition of observation.partitionValues) {
      const button = document.createElement("button");
      button.textContent = observationValueLabel(partition.value) +
        " → " + partition.candidates.join("");
      button.addEventListener("click", () => applyObservedValue(observation, partition.value));
      values.append(button);
    }
    row.append(values);
    els.guidance.append(row);
  }
}

function renderState(parsed) {
  els.ast.textContent = JSON.stringify(parsed?.query ?? null, null, 2);
  renderCandidates();
  renderGuidance();

  if (!parsed) {
    els.status.textContent = "Input không hợp lệ.";
    return;
  }

  els.status.textContent = candidates.length === 1
    ? "Đã xác định: " + candidates[0].char
    : "Còn " + candidates.length + " candidate(s).";
}

function parseAndReset() {
  const parsed = parseInput(els.input.value);
  candidates = parsed ? matchInput(CHARACTER_MODEL, els.input.value) : [];
  renderState(parsed);
}

for (const example of EXAMPLES) {
  const button = document.createElement("button");
  button.textContent = example;
  button.addEventListener("click", () => {
    els.input.value = example;
    parseAndReset();
  });
  els.examples.append(button);
}

els.input.addEventListener("input", parseAndReset);
parseAndReset();