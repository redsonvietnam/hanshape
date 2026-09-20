import { CHARACTER_MODEL } from "../src/character-model.js";
import { ADVERSARIAL_GROUPS } from "../data/adversarial-corpus.js";
import { compareObservationPaths } from "../src/observation-path.js";
import { encodeObservationPath } from "../src/query-encoding.js";

const group = names => CHARACTER_MODEL.filter(character => names.includes(character.char));

function summarize(rows) {
  const average = key =>
    rows.length === 0
      ? 0
      : rows.reduce((sum, row) => sum + row[key], 0) / rows.length;

  const greedyObservations = rows.reduce((sum, row) => sum + row.greedyQuestions, 0);
  const optimalObservations = rows.reduce((sum, row) => sum + row.optimalQuestions, 0);
  const greedyUnsupported = rows.reduce((sum, row) => sum + row.greedyUnsupported, 0);
  const optimalUnsupported = rows.reduce((sum, row) => sum + row.optimalUnsupported, 0);

  return {
    cases: rows.length,
    greedyCoverage: average("greedyCoverage"),
    optimalCoverage: average("optimalCoverage"),
    greedySupported: greedyObservations - greedyUnsupported,
    greedyObservations,
    optimalSupported: optimalObservations - optimalUnsupported,
    optimalObservations
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
console.table([summarize(rows)]);

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
