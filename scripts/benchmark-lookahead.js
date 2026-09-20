import { CHARACTER_MODEL } from "../src/character-model.js";
import { chooseNextQuestion, applyAdaptiveAnswer } from "../src/adaptive-matcher.js";

function combinations(items, size) {
  if (size === 0) return [[]];
  const result = [];
  function visit(start, picked) {
    if (picked.length === size) {
      result.push(picked.slice());
      return;
    }
    for (let i = start; i <= items.length - (size - picked.length); i += 1) {
      picked.push(items[i]);
      visit(i + 1, picked);
      picked.pop();
    }
  }
  visit(0, []);
  return result;
}

function identify(candidates, target, depth, policyCache) {
  let remaining = [...candidates];
  let questions = 0;

  while (remaining.length > 1 && questions < 20) {
    const key = `${depth}:${remaining.map(x => x.char).sort().join("\\0")}`;
    let question = policyCache.get(key);
    if (question === undefined) {
      question = chooseNextQuestion(remaining, { lookaheadDepth: depth });
      policyCache.set(key, question ?? null);
    }
    if (!question) return { success: false, questions };
    const answer = question.yesCandidates.includes(target.char);
    remaining = applyAdaptiveAnswer(remaining, question, answer);
    questions += 1;
  }

  return {
    success: remaining.length === 1 && remaining[0].char === target.char,
    questions
  };
}

const sizes = [4];
const MAX_SUBSETS = 512;
const results = [];

for (const size of sizes) {
  const allSubsets = combinations(CHARACTER_MODEL, size);
  const step = Math.max(1, Math.floor(allSubsets.length / MAX_SUBSETS));
  const subsets = allSubsets.filter((_, index) => index % step === 0).slice(0, MAX_SUBSETS);
  let cases = 0;
  let failed1 = 0;
  let failed2 = 0;
  let total1 = 0;
  let total2 = 0;
  let improvedCases = 0;
  let worsenedCases = 0;
  let changedTrees = 0;
  let bestImprovement = 0;
  let firstExamples = [];
  const policyCache = new Map();

  for (const subset of subsets) {
    const greedyFirst = chooseNextQuestion(subset, { lookaheadDepth: 1 });
    const lookaheadFirst = chooseNextQuestion(subset, { lookaheadDepth: 2 });
    if (!greedyFirst || !lookaheadFirst) continue;

    if (greedyFirst.id !== lookaheadFirst.id) {
      changedTrees += 1;
      if (firstExamples.length < 8) {
        firstExamples.push({
          chars: subset.map(x => x.char).join("/"),
          greedy: greedyFirst.label,
          lookahead: lookaheadFirst.label
        });
      }
    }

    for (const target of subset) {
      const a = identify(subset, target, 1, policyCache);
      const b = identify(subset, target, 2, policyCache);
      cases += 1;
      total1 += a.questions;
      total2 += b.questions;
      if (!a.success) failed1 += 1;
      if (!b.success) failed2 += 1;
      const improvement = a.questions - b.questions;
      if (improvement > 0) {
        improvedCases += 1;
        bestImprovement = Math.max(bestImprovement, improvement);
      } else if (improvement < 0) {
        worsenedCases += 1;
      }
    }
  }

  results.push({
    size,
    allSubsets: allSubsets.length,
    subsets: subsets.length,
    cases,
    avgDepth1: total1 / cases,
    avgDepth2: total2 / cases,
    failedDepth1: failed1,
    failedDepth2: failed2,
    changedFirstQuestion: changedTrees,
    improvedCases,
    worsenedCases,
    bestImprovement
  });

  console.log("");
  console.log(`First-question differences for size ${size}:`);
  console.table(firstExamples);
}

console.log("");
console.log("Lookahead comparison (deterministic sample of 4-character subsets)");
console.log("==============================");
console.table(results);
