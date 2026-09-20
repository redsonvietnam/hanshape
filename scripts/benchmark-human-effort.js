import { CHARACTER_MODEL } from "../src/character-model.js";
import { ADVERSARIAL_GROUPS } from "../data/adversarial-corpus.js";
import { compareObservationPaths } from "../src/observation-path.js";
import { compareMultivalueObservationPaths } from "../src/multivalue-observation.js";

const group = names =>
  CHARACTER_MODEL.filter(character => names.includes(character.char));

function combinations(items, size) {
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

function benchmarkFamily(names) {
  const candidates = group(names);
  const rows = [];

  for (const target of candidates) {
    const binary = compareObservationPaths(candidates, target.char, {
      costMode: "weighted"
    });
    const flat = compareMultivalueObservationPaths(candidates, target.char);
    const weighted = compareMultivalueObservationPaths(
      candidates,
      target.char,
      { costMode: "weighted" }
    );

    rows.push({
      group: names.join("/"),
      target: target.char,
      binaryQuestions: binary?.greedyQuestions ?? null,
      binaryCost: binary?.greedyCost ?? null,
      flatQuestions: flat?.greedyQuestions ?? null,
      weightedQuestions: weighted?.greedyQuestions ?? null,
      weightedCost: weighted?.greedyCost ?? null,
      weightedOptimalCost: weighted?.optimalCost ?? null,
      weightedCostGap: weighted?.costGap ?? null
    });
  }

  return rows;
}

const familyRows = ADVERSARIAL_GROUPS.flatMap(benchmarkFamily);

console.log("HanShape human-effort proxy benchmark");
console.log("====================================");
console.log("IMPORTANT: weighted cost is a heuristic recognition proxy, not measured human data.");
console.table(familyRows);

function summarize(rows) {
  const valid = rows.filter(row =>
    row.binaryCost !== null &&
    row.weightedCost !== null &&
    row.weightedOptimalCost !== null
  );

  return {
    cases: valid.length,
    binaryAvgQuestions: valid.length
      ? valid.reduce((sum, row) => sum + row.binaryQuestions, 0) / valid.length
      : null,
    multivalueFlatAvgQuestions: valid.length
      ? valid.reduce((sum, row) => sum + row.flatQuestions, 0) / valid.length
      : null,
    binaryAvgCost: valid.length
      ? valid.reduce((sum, row) => sum + row.binaryCost, 0) / valid.length
      : null,
    multivalueWeightedAvgCost: valid.length
      ? valid.reduce((sum, row) => sum + row.weightedCost, 0) / valid.length
      : null,
    multivalueWeightedOptimalAvgCost: valid.length
      ? valid.reduce((sum, row) => sum + row.weightedOptimalCost, 0) / valid.length
      : null,
    weightedGreedyCostGapAvg: valid.length
      ? valid.reduce((sum, row) => sum + row.weightedCostGap, 0) / valid.length
      : null
  };
}

console.log("");
console.log("Adversarial summary");
console.table([summarize(familyRows)]);

const singles = CHARACTER_MODEL.filter(character => character.form === "SINGLE");
const subsets = combinations(singles, 4);
const allRows = [];
let weightedFirstChoiceChanges = 0;

for (const candidates of subsets) {
  const flatByTarget = new Map();

  for (const target of candidates) {
    const flat = compareMultivalueObservationPaths(candidates, target.char);
    const weighted = compareMultivalueObservationPaths(
      candidates,
      target.char,
      { costMode: "weighted" }
    );
    const binary = compareObservationPaths(
      candidates,
      target.char,
      { costMode: "weighted" }
    );

    allRows.push({
      target: target.char,
      binaryQuestions: binary?.greedyQuestions ?? null,
      binaryCost: binary?.greedyCost ?? null,
      flatQuestions: flat?.greedyQuestions ?? null,
      weightedQuestions: weighted?.greedyQuestions ?? null,
      weightedCost: weighted?.greedyCost ?? null,
      weightedOptimalCost: weighted?.optimalCost ?? null
    });

    flatByTarget.set(target.char, flat?.greedyPath?.[0]?.id ?? null);

    if (
      flat &&
      weighted &&
      (flat.greedyPath?.[0]?.id ?? null) !==
      (weighted.greedyPath?.[0]?.id ?? null)
    ) {
      weightedFirstChoiceChanges += 1;
    }
  }
}

const valid = allRows.filter(row =>
  row.binaryCost !== null &&
  row.weightedCost !== null &&
  row.weightedOptimalCost !== null
);

console.log("");
console.log("All 4-character SINGLE subsets");
console.log("==============================");
console.log(
  `subsets=${subsets.length} targetCases=${allRows.length} valid=${valid.length}`
);
console.log(
  `binaryAvgQuestions=${(
    valid.reduce((sum, row) => sum + row.binaryQuestions, 0) / valid.length
  ).toFixed(3)}`
);
console.log(
  `multivalueFlatAvgQuestions=${(
    valid.reduce((sum, row) => sum + row.flatQuestions, 0) / valid.length
  ).toFixed(3)}`
);
console.log(
  `binaryAvgCost=${(
    valid.reduce((sum, row) => sum + row.binaryCost, 0) / valid.length
  ).toFixed(3)}`
);
console.log(
  `multivalueWeightedAvgCost=${(
    valid.reduce((sum, row) => sum + row.weightedCost, 0) / valid.length
  ).toFixed(3)}`
);
console.log(
  `multivalueWeightedOptimalAvgCost=${(
    valid.reduce((sum, row) => sum + row.weightedOptimalCost, 0) / valid.length
  ).toFixed(3)}`
);
console.log(
  `weightedFirstChoiceChanges=${weightedFirstChoiceChanges}`
);

const failures = allRows.filter(row =>
  row.binaryCost === null ||
  row.weightedCost === null ||
  row.weightedOptimalCost === null
);

if (failures.length > 0) {
  console.error(
    `FAIL: ${failures.length} target cases could not be evaluated.`
  );
  process.exitCode = 1;
}
