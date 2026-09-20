import test from "node:test";
import assert from "node:assert/strict";
import { CHARACTER_MODEL } from "../src/character-model.js";
import { QUERY_LANGUAGE_VERSION, matchInput, parseInput, numericToSemanticQuery } from "../src/query.js";

test("numeric input compiles to semantic query", () => {
  const parsed = parseInput("35");
  assert.ok(parsed);
  assert.equal(parsed.tokens[0].kind, "numeric");
  assert.deepEqual(parsed.query, {
    form: "SINGLE",
    strokes: 5
  });
});

test("numeric refinement compiles to the same semantic query path", () => {
  const parsed = parseInput("34055");
  assert.ok(parsed);
  assert.deepEqual(parsed.query, {
    form: "SINGLE",
    strokes: 4,
    relations: [{
      target: "C",
      type: "parallelism",
      value: true
    }]
  });
});

test("relation token and numeric input share the same semantic matcher", () => {
  assert.deepEqual(
    matchInput(CHARACTER_MODEL, "35 len(C.hUpper,C.hLower)<")
      .map(candidate => candidate.char),
    ["未"]
  );
});

test("relation token alone identifies 犬", () => {
  assert.deepEqual(
    matchInput(CHARACTER_MODEL, "pos(C.dot,C.mainAxis)=R")
      .map(candidate => candidate.char),
    ["犬"]
  );
});

test("multiple numeric refinements merge instead of overwriting nested state", () => {
  const query = numericToSemanticQuery({
    form: "SINGLE",
    counts: [4],
    refinements: [
      {
        target: "C",
        query: { path: "topology.enclosure", equals: true }
      },
      {
        target: "C",
        query: { path: "topology.junction", operator: "gte", value: 2 }
      }
    ]
  });

  assert.deepEqual(query, {
    form: "SINGLE",
    strokes: 4,
    regions: {
      C: {
        topology: {
          enclosure: true,
          junction: { gte: 2 }
        }
      }
    }
  });
});

test("empty or malformed input returns no candidates", () => {
  assert.deepEqual(matchInput(CHARACTER_MODEL, ""), []);
  assert.deepEqual(matchInput(CHARACTER_MODEL, "not-a-token"), []);
});

test("numeric parser rejects a region that the selected form does not have", () => {
  assert.equal(parseInput("3440"), null);
});

test("unified query language exposes a stable research version", () => {
  assert.equal(QUERY_LANGUAGE_VERSION, "0.9");
});

test("all public token families compile into one semantic AST", () => {
  const numeric = parseInput("35");
  const relation = parseInput("len(C.hUpper,C.hLower)<");
  const feature = parseInput("feat(C.content.strokes)=2");
  const membership = parseInput("has(C.strokeTypes,dot)");

  assert.equal(numeric.tokens[0].kind, "numeric");
  assert.equal(relation.tokens[0].kind, "relation");
  assert.equal(feature.tokens[0].kind, "feature");
  assert.equal(membership.tokens[0].kind, "has");
  assert.ok(numeric.query.form);
  assert.ok(relation.query.relations);
  assert.ok(feature.query.regions);
  assert.ok(membership.query.regions);
});
