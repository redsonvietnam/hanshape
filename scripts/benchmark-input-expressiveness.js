import { CHARACTER_MODEL } from "../src/character-model.js";
import { ADVERSARIAL_GROUPS } from "../data/adversarial-corpus.js";
import { compareObservationPaths } from "../src/observation-path.js";
import { encodeObservationPath } from "../src/query-encoding.js";

const group = names => CHARACTER_MODEL.filter(character => names.includes(character.char));

function summarize(results) {
  const valid = results.filter(Boolean);
  const greedy = valid.map(result => encodeObservationPath(result.greedyPath));
  const optimal = valid.map(result => encodeObservationPath(result.optimalPath));

  const average = rows => rows.reduce((sum, row) => sum + row.coverage, 0) / rows.length;
  const supported = rows => rows.reduce((sum, row) => sum + row.supported, 0);
  const total = rows => rows.reduce((sum, row) => sum + row.total, 0);

  return {
    cases: valid.length,
    greedyCoverage: average(greedy),
    optimalCoverage: average(optimal),
    greedySupported: supported(greedy),
    greedyObservations: total(greedy),
    optimalSupported: supported(optimal),
    optimalObservations: total(optimal)
  };
}

const rows = [];
for (const names of ADVERSARIAL_GROUPS) {
  for (const target of group(names)) {
    const result = compareObservationPaths(group(names), target.char);
    if (!result) continue;

    const greedy = encodeObservationPath(result.greedyPath);
    const optimal = encodeObservationPath(result.optimalPath);
    rows.push({
      group: names.join("/"),
      target: target.char,
      greedyQuestions: result.greedyQuestions,
      greedyCoverage: Number(greedy.coverage.toFixed(3)),
      greedyUnsupported: greedy.unsupported,
      optimalQuestions: result.optimalQuestions,
      optimalCoverage: Number(optimal.coverage.toFixed(3)),
      optimalUnsupported: optimal.unsupported
    });
  }
}

console.log("HanShape input expressiveness benchmark");
console.log("========================================");
console.table(rows);
console.log("");
console.log("Aggregate");
console.table([summarize(rows.map((row, index) => ({
  greedyPath: rows[index].greedyQuestions > 0 ? [] : [],
  optimalPath: [],
  ...row
})))]);

const unsupportedConcepts = new Map();
for (const names of ADVERSARIAL_GROUPS) {
  for (const target of group(names)) {
    const result = compareObservationPaths(group(names), target.char);
    if (!result) continue;
    for (const item of encodeObservationPath(result.optimalPath).encoded) {
      if (!item.supported) unsupportedConcepts.set(item.reason, (unsupportedConcepts.get(item.reason) ?? 0) + 1);
    }
  }
}

console.log("");
console.log("Unexpressible optimal-path observation reasons");
console.table([...unsupportedConcepts.entries()].map(([reason, cases]) => ({ reason, cases })));
