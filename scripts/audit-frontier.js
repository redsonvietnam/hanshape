import { FEATURE_CONCEPTS } from "../src/concepts.js";
import { FRONTIER_CONFUSION_FAMILIES } from "../data/frontier-confusion-families.js";

const coverage = new Map();
const frontier = new Map();

for (const family of FRONTIER_CONFUSION_FAMILIES) {
  for (const concept of family.usefulConcepts) {
    if (!coverage.has(concept)) coverage.set(concept, []);
    coverage.get(concept).push(family.id);
  }

  for (const concept of family.frontierConcepts ?? []) {
    if (!frontier.has(concept)) frontier.set(concept, []);
    frontier.get(concept).push(family.id);
  }
}

const rows = [...coverage.entries()]
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([concept, families]) => ({
    concept,
    ontologyStatus: FEATURE_CONCEPTS[concept] ? "present" : "missing",
    families: families.length,
    familyIds: families.join(",")
  }));

const frontierRows = [...frontier.entries()]
  .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
  .map(([concept, families]) => ({
    concept,
    families: families.length,
    familyIds: families.join(",")
  }));

console.log("HanShape frontier-corpus audit");
console.log("==============================");
console.log(`families=${FRONTIER_CONFUSION_FAMILIES.length}`);
console.log(`ontology concepts=${Object.keys(FEATURE_CONCEPTS).length}`);
console.log("");
console.log("Reusable concept coverage");
console.table(rows);
console.log("");
console.log("Unpromoted frontier concepts");
console.table(frontierRows);

for (const row of frontierRows) {
  if (FEATURE_CONCEPTS[row.concept]) {
    console.error(`ERROR: frontier concept is already in ontology: ${row.concept}`);
    process.exitCode = 1;
  }
}
