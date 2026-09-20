import { CHARACTER_MODEL } from "../src/character-model.js";
import { ADVERSARIAL_GROUPS } from "../data/adversarial-corpus.js";
import { compareObservationPaths } from "../src/observation-path.js";

const group = names =>
  CHARACTER_MODEL.filter(character => names.includes(character.char));

function summarize(rows) {
  const solved = rows.filter(row => row.optimalQuestions !== null);
  const gaps = solved.map(row => row.questionGap);
  const entropyGaps = solved.map(row => row.entropyGap);

  return {
    cases: solved.length,
    averageGreedy: solved.reduce((sum, row) => sum + row.greedyQuestions, 0) / solved.length,
    averageOptimal: solved.reduce((sum, row) => sum + row.optimalQuestions, 0) / solved.length,
    averageQuestionGap: solved.reduce((sum, row) => sum + row.questionGap, 0) / solved.length,
    maxQuestionGap: Math.max(...gaps),
    averageEntropyGap: solved.reduce((sum, row) => sum + row.entropyGap, 0) / solved.length,
    optimalAtEntropyBound: entropyGaps.filter(value => value === 0).length
  };
}

function benchmark(name, candidates) {
  const rows = [];

  for (const target of candidates) {
    const result = compareObservationPaths(candidates, target.char);

    rows.push({
      group: name,
      target: target.char,
      candidates: candidates.length,
      lowerBound: result?.lowerBound ?? null,
      optimalQuestions: result?.optimalQuestions ?? null,
      greedyQuestions: result?.greedyQuestions ?? null,
      questionGap: result?.questionGap ?? null,
      entropyGap: result?.entropyGap ?? null,
      statesExplored: result?.statesExplored ?? null
    });
  }

  return rows;
}

const rows = [];

for (const names of ADVERSARIAL_GROUPS) {
  rows.push(...benchmark(names.join("/"), group(names)));
}

rows.push(...benchmark(
  "full-model",
  CHARACTER_MODEL
));

console.log("HanShape observation-path benchmark");
console.log("===================================");
console.table(rows);

console.log("");
console.log("Adversarial groups summary");
console.table(
  [...new Set(ADVERSARIAL_GROUPS.map(names => names.join("/")))].map(name => ({
    group: name,
    ...summarize(rows.filter(row => row.group === name))
  }))
);

console.log("");
console.log("Full model summary");
console.table([summarize(rows.filter(row => row.group === "full-model"))]);

const failures = rows.filter(row =>
  row.optimalQuestions === null ||
  row.greedyQuestions === null
);

if (failures.length > 0) {
  console.error("FAIL: one or more targets could not be identified.");
  process.exitCode = 1;
}
