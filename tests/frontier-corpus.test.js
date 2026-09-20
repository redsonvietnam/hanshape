import test from "node:test";
import assert from "node:assert/strict";
import { FEATURE_CONCEPTS } from "../src/concepts.js";
import { FRONTIER_CONFUSION_FAMILIES } from "../data/frontier-confusion-families.js";

test("frontier corpus has explicit status and unique family ids", () => {
  const ids = new Set();
  for (const family of FRONTIER_CONFUSION_FAMILIES) {
    assert.ok(family.id);
    assert.ok(!ids.has(family.id));
    ids.add(family.id);
    assert.ok(["covered", "frontier"].includes(family.status));
    assert.ok(Array.isArray(family.chars) && family.chars.length >= 2);
    assert.ok(Array.isArray(family.usefulConcepts));
  }
  assert.ok(FRONTIER_CONFUSION_FAMILIES.length >= 5);
});

test("frontier concepts are not silently promoted to ontology", () => {
  const frontierCounts = new Map();

  for (const family of FRONTIER_CONFUSION_FAMILIES) {
    for (const concept of family.frontierConcepts ?? []) {
      frontierCounts.set(concept, (frontierCounts.get(concept) ?? 0) + 1);
    }
  }

  for (const concept of frontierCounts.keys()) {
    assert.equal(FEATURE_CONCEPTS[concept], undefined,
      "Frontier concept " + concept + " must remain experimental until promoted by review.");
  }
});
