import { CHARACTER_MODEL } from "../src/character-model.js";
import { ADVERSARIAL_GROUPS } from "../data/adversarial-corpus.js";
import { compareObservationPaths } from "../src/observation-path.js";
import { compareMultivalueObservationPaths } from "../src/multivalue-observation.js";

const group = names => CHARACTER_MODEL.filter(character => names.includes(character.char));

function benchmark(names) {
  const candidates = group(names);
  const rows = [];

  for (const target of candidates) {
    const binary = compareObservationPaths(candidates, target.char);
    const multi = compareMultivalueObservationPaths(candidates, target.char);

    rows.push({
      group: names.join("/"),
      target: target.char,
      binaryGreedy: binary?.greedyQuestions ?? null,
      binaryOptimal: binary?.optimalQuestions ?? null,
      multiGreedy: multi?.greedyQuestions ?? null,
      multiOptimal: multi?.optimalQuestions ?? null,
      multiVsBinary: multi && binary
        ? multi.greedyQuestions - binary.greedyQuestions
        : null
    });
  }

  return rows;
}

const rows = ADVERSARIAL_GROUPS.flatMap(benchmark);

console.log("HanShape binary vs multi-value observation benchmark");
console.log("====================================================");
console.table(rows);
console.log("");

const summary = [];
for (const names of ADVERSARIAL_GROUPS) {
  const family = rows.filter(row => row.group === names.join("/"));
  summary.push({
    group: names.join("/"),
    cases: family.length,
    binaryGreedyAvg: family.reduce((sum, row) => sum + row.binaryGreedy, 0) / family.length,
    binaryOptimalAvg: family.reduce((sum, row) => sum + row.binaryOptimal, 0) / family.length,
    multiGreedyAvg: family.reduce((sum, row) => sum + row.multiGreedy, 0) / family.length,
    multiOptimalAvg: family.reduce((sum, row) => sum + row.multiOptimal, 0) / family.length
  });
}

console.log("Family summary");
console.table(summary);

const failures = rows.filter(row =>
  row.binaryGreedy === null ||
  row.binaryOptimal === null ||
  row.multiGreedy === null ||
  row.multiOptimal === null
);

if (failures.length > 0) {
  console.error("FAIL: at least one target could not be identified by one of the observation engines.");
  process.exitCode = 1;
}
