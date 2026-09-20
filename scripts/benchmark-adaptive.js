import { CHARACTER_MODEL } from "../src/character-model.js";
import { ADVERSARIAL_GROUPS } from "../data/adversarial-corpus.js";
import {
  chooseNextQuestion,
  applyAdaptiveAnswer
} from "../src/adaptive-matcher.js";

const group = names =>
  CHARACTER_MODEL.filter(character => names.includes(character.char));

function identify(candidates, target, options) {
  let remaining = [...candidates];
  let questions = 0;
  const trace = [];

  while (remaining.length > 1 && questions < 20) {
    const question = chooseNextQuestion(remaining, options);
    if (!question) break;

    const answer = question.yesCandidates.includes(target.char);
    trace.push({
      n: remaining.length,
      concept: question.concept,
      label: question.label,
      answer
    });

    remaining = applyAdaptiveAnswer(remaining, question, answer);
    questions += 1;
  }

  return {
    success: remaining.length === 1 && remaining[0].char === target.char,
    questions,
    remaining: remaining.map(character => character.char),
    trace
  };
}

function stats(results) {
  const solved = results.filter(result => result.success);
  const failed = results.filter(result => !result.success);
  const average = results.reduce((sum, result) => sum + result.questions, 0) / results.length;
  const max = Math.max(...results.map(result => result.questions));
  return {
    cases: results.length,
    solved: solved.length,
    failed: failed.length,
    average,
    max
  };
}

const rows = [];

for (const names of ADVERSARIAL_GROUPS) {
  const candidates = group(names);
  for (const costMode of ["weighted", "flat"]) {
    for (const depth of [1, 2]) {
      const options = { lookaheadDepth: depth, costMode };
      const results = candidates.map(target =>
        identify(candidates, target, options)
      );
    const summary = stats(results);
    rows.push({
        group: names.join(""),
        costMode,
        depth,
        ...summary
      });

      for (const result of results) {
        if (!result.success) {
          console.log(
            `FAIL group=${names.join("/")} costMode=${costMode} depth=${depth} remaining=${result.remaining.join("/")}`
          );
        }
      }
    }
  }
}

console.log("");
console.log("HanShape adaptive benchmark");
console.log("===========================");
console.table(rows);
console.log("");

for (const costMode of ["weighted", "flat"]) {
  for (const depth of [1, 2]) {
    const selected = rows.filter(row => row.costMode === costMode && row.depth === depth);
    const totalCases = selected.reduce((sum, row) => sum + row.cases, 0);
    const totalSolved = selected.reduce((sum, row) => sum + row.solved, 0);
    const average = selected.reduce((sum, row) => sum + row.average * row.cases, 0) / totalCases;
    const max = Math.max(...selected.map(row => row.max));

    console.log(
      `costMode=${costMode} depth=${depth} cases=${totalCases} solved=${totalSolved}/${totalCases} averageQuestions=${average.toFixed(3)} maxQuestions=${max}`
    );
  }
}
