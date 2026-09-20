import { CHARACTER_MODEL } from "../src/character-model.js";
import {
  adaptiveState,
  applyAdaptiveAnswer
} from "../src/adaptive-matcher.js";

const GROUPS = {
  "人 / 入 / 八": ["人", "入", "八"],
  "日 / 曰 / 目": ["日", "曰", "目"],
  "土 / 士 / 大": ["土", "士", "大"],
  "大 / 太 / 犬": ["大", "太", "犬"],
  "木 / 本 / 未 / 末": ["木", "本", "未", "末"],
  "明 / 林 / 朋 / 服": ["明", "林", "朋", "服"]
};

const byChars = names =>
  CHARACTER_MODEL.filter(character => names.includes(character.char));

const els = {
  group: document.querySelector("#group"),
  target: document.querySelector("#target"),
  depth: document.querySelector("#depth"),
  depthValue: document.querySelector("#depthValue"),
  reset: document.querySelector("#reset"),
  reveal: document.querySelector("#reveal"),
  candidates: document.querySelector("#candidates"),
  count: document.querySelector("#count"),
  asked: document.querySelector("#asked"),
  question: document.querySelector("#question"),
  status: document.querySelector("#status"),
  yes: document.querySelector("#yes"),
  no: document.querySelector("#no"),
  alternatives: document.querySelector("#alternatives")
};

let candidates = [];
let target = null;
let asked = 0;

function currentDepth() {
  return Number(els.depth.value);
}

function candidateGroup() {
  return GROUPS[els.group.value] ?? [];
}

function renderCandidates() {
  els.candidates.replaceChildren();
  for (const candidate of candidates) {
    const node = document.createElement("div");
    node.className = "char";
    if (target && candidates.length === 1 && candidate.char === target.char) {
      node.classList.add("target");
    }
    node.textContent = candidate.char;
    node.title = candidate.pinyin;
    els.candidates.append(node);
  }
  els.count.textContent = String(candidates.length);
  els.asked.textContent = String(asked);
}

function renderState() {
  const state = adaptiveState(candidates, {
    lookaheadDepth: currentDepth(),
    limit: 5
  });

  renderCandidates();
  els.alternatives.replaceChildren();

  for (const item of state.alternatives) {
    const node = document.createElement("div");
    node.className = "alternative";
    node.innerHTML = [
      `<b>${item.label}</b>`,
      `<div class="subtle">IG ${item.informationGain.toFixed(3)} · score ${item.lookaheadScore.toFixed(3)} · còn kỳ vọng ${item.expectedRemaining}/${item.candidateCount}</div>`
    ].join("");
    els.alternatives.append(node);
  }

  if (candidates.length === 0) {
    els.question.textContent = "Candidate set rỗng.";
    els.status.textContent = "Có câu trả lời mâu thuẫn với corpus/model.";
    els.yes.disabled = true;
    els.no.disabled = true;
    return;
  }

  if (candidates.length === 1) {
    els.question.textContent = `Đã xác định: ${candidates[0].char}`;
    els.status.textContent = target && candidates[0].char === target.char
      ? "✓ HanShape đã tìm đúng chữ bí mật."
      : "Engine đang dẫn tới một ứng viên khác với đáp án mô phỏng.";
    els.yes.disabled = true;
    els.no.disabled = true;
    els.reveal.disabled = false;
    return;
  }

  const question = state.nextQuestion;
  if (!question) {
    els.question.textContent = "Không còn câu hỏi khả dụng.";
    els.status.textContent = "Ontology hiện tại chưa phân biệt được candidate set này.";
    els.yes.disabled = true;
    els.no.disabled = true;
    return;
  }

  els.question.textContent = question.label;
  els.status.textContent =
    `Depth ${currentDepth()} · ${question.yesCount} YES / ${question.noCount} NO · IG ${question.informationGain.toFixed(3)}`;
  els.yes.disabled = false;
  els.no.disabled = false;
}

function resetGame() {
  candidates = byChars(candidateGroup());
  const selected = els.target.value;
  target = candidates.find(candidate => candidate.char === selected) ?? candidates[0] ?? null;
  asked = 0;
  els.reveal.disabled = false;
  els.status.textContent = "";
  renderState();
}

function answer(value) {
  const state = adaptiveState(candidates, {
    lookaheadDepth: currentDepth(),
    limit: 5
  });
  const question = state.nextQuestion;
  if (!question || !target) return;

  candidates = applyAdaptiveAnswer(candidates, question, value
    ? question.yesCandidates.includes(target.char)
    : question.noCandidates.includes(target.char));

  asked += 1;
  renderState();
}

function renderTargetOptions() {
  const names = candidateGroup();
  els.target.replaceChildren();
  for (const name of names) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    els.target.append(option);
  }
}

function renderGroupOptions() {
  els.group.replaceChildren();
  for (const [label] of Object.entries(GROUPS)) {
    const option = document.createElement("option");
    option.value = label;
    option.textContent = label;
    els.group.append(option);
  }
}

function reveal() {
  if (!target) return;
  els.status.textContent = `Đáp án mô phỏng: ${target.char} (${target.pinyin})`;
  els.reveal.disabled = true;
}

els.group.addEventListener("change", () => {
  renderTargetOptions();
  resetGame();
});
els.target.addEventListener("change", resetGame);
els.depth.addEventListener("input", () => {
  els.depthValue.textContent = els.depth.value;
  if (candidates.length > 1) renderState();
});
els.reset.addEventListener("click", resetGame);
els.reveal.addEventListener("click", reveal);
els.yes.addEventListener("click", () => answer(true));
els.no.addEventListener("click", () => answer(false));

renderGroupOptions();
renderTargetOptions();
resetGame();
