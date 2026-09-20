import test from "node:test";
import assert from "node:assert/strict";
import { observationToSemanticQuery } from "../src/observation-query.js";

test("region observation becomes a semantic region query", () => {
  const query = observationToSemanticQuery({
    kind: "region",
    target: "C",
    path: ["topology", "enclosure"]
  }, true);

  assert.deepEqual(query, {
    regions: { C: { topology: { enclosure: true } } }
  });
});

test("positive stroke observation becomes a stroke query", () => {
  const query = observationToSemanticQuery({
    kind: "strokeType",
    target: "C",
    path: ["dot"]
  }, true);

  assert.deepEqual(query, {
    regions: { C: { strokeTypes: ["dot"] } }
  });
});

test("negative stroke observation becomes a semantic NOT query", () => {
  const query = observationToSemanticQuery({
    kind: "strokeType",
    target: "C",
    path: ["dot"]
  }, false);

  assert.deepEqual(query, {
    not: {
      regions: { C: { strokeTypes: ["dot"] } }
    }
  });
});

test("relation observation becomes a relation query", () => {
  const query = observationToSemanticQuery({
    kind: "relation",
    target: "C",
    relationKey: "relativeLength|hUpper|hLower"
  }, "shorter");

  assert.deepEqual(query, {
    relations: [{
      target: "C",
      type: "relativeLength",
      a: "hUpper",
      b: "hLower",
      value: "shorter"
    }]
  });
});
