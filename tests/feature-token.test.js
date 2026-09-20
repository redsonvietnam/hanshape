import test from "node:test";
import assert from "node:assert/strict";
import { CHARACTER_MODEL } from "../src/character-model.js";
import { matchInput, parseInput } from "../src/query.js";
import {
  parseFeatureToken,
  featureTokenToSemanticQuery,
  featureTokenFromParts,
  parseHasToken,
  hasTokenToSemanticQuery,
  hasTokenFromParts
} from "../src/feature-token.js";
import {
  parseGenericRelationToken,
  genericRelationTokenToSemanticQuery,
  genericRelationTokenFromParts
} from "../src/relation-token.js";

test("feature token parses enum-valued geometry", () => {
  assert.deepEqual(
    parseFeatureToken("feat(C.geometry.symmetry)=vertical"),
    {
      kind: "feature",
      raw: "feat(C.geometry.symmetry)=vertical",
      target: "C",
      path: ["geometry", "symmetry"],
      operator: "eq",
      value: "vertical"
    }
  );
});

test("feature token parses numeric comparison", () => {
  assert.deepEqual(
    parseFeatureToken("feat(C.topology.junction)>=3"),
    {
      kind: "feature",
      raw: "feat(C.topology.junction)>=3",
      target: "C",
      path: ["topology", "junction"],
      operator: "gte",
      value: 3
    }
  );
});

test("feature token compiles to nested semantic query", () => {
  assert.deepEqual(
    featureTokenToSemanticQuery("feat(C.content.strokes)=2"),
    {
      regions: { C: { content: { strokes: 2 } } }
    }
  );
});

test("feature token end-to-end identifies 目", () => {
  assert.deepEqual(
    matchInput(CHARACTER_MODEL, "feat(C.content.strokes)=2")
      .map(candidate => candidate.char),
    ["目"]
  );
});

test("feature token comparison end-to-end identifies 目", () => {
  assert.deepEqual(
    matchInput(CHARACTER_MODEL, "feat(C.topology.junction)>=3")
      .map(candidate => candidate.char),
    ["目"]
  );
});

test("feature token connectivity end-to-end identifies 八", () => {
  assert.deepEqual(
    matchInput(CHARACTER_MODEL, "feat(C.topology.connectivity)=disconnected")
      .map(candidate => candidate.char),
    ["八"]
  );
});

test("has token supports set membership", () => {
  assert.deepEqual(
    parseHasToken("has(C.strokeTypes,dot)"),
    {
      kind: "has",
      raw: "has(C.strokeTypes,dot)",
      target: "C",
      path: ["strokeTypes"],
      value: "dot",
      expected: true
    }
  );
});

test("has token end-to-end identifies dot-bearing variants", () => {
  assert.deepEqual(
    matchInput(CHARACTER_MODEL, "has(C.strokeTypes,dot)")
      .map(candidate => candidate.char),
    ["太", "犬"]
  );
});

test("negative has token excludes dot-bearing variants", () => {
  assert.deepEqual(
    matchInput(CHARACTER_MODEL, "has(C.strokeTypes,dot)=false")
      .map(candidate => candidate.char),
    ["木", "本", "未", "末", "人", "入", "八", "日", "曰", "目", "土", "士", "大", "明", "林", "朋", "服"]
  );
});

test("feature token round-trips", () => {
  const token = featureTokenFromParts("C", ["topology", "junction"], "gte", 3);
  assert.equal(token, "feat(C.topology.junction)>=3");
  assert.deepEqual(parseFeatureToken(token)?.value, 3);
});

test("has token serializes deterministically", () => {
  assert.equal(
    hasTokenFromParts("C", ["strokeTypes"], "dot", true),
    "has(C.strokeTypes,dot)=true"
  );
});

test("feature tokens compose with numeric input", () => {
  const parsed = parseInput("35 feat(C.content.strokes)=2");
  assert.ok(parsed);
  assert.equal(parsed.tokens[1].kind, "feature");
  assert.deepEqual(parsed.query.regions.C.content.strokes, 2);
});

test("malformed feature and membership tokens are rejected", () => {
  assert.equal(parseFeatureToken("feat(C)=true"), null);
  assert.equal(parseFeatureToken("feat(X.geometry.axis)=vertical"), null);
  assert.equal(parseHasToken("has(C.strokeTypes)"), null);
});

test("generic relation token parses parallelism", () => {
  assert.deepEqual(
    parseGenericRelationToken("rel(C.relation,parallelism)=true"),
    {
      kind: "generic-relation",
      raw: "rel(C.relation,parallelism)=true",
      target: "C",
      type: "parallelism",
      path: "relation",
      value: true
    }
  );
});

test("generic relation token compiles to region-scoped semantic relation", () => {
  assert.deepEqual(
    genericRelationTokenToSemanticQuery("rel(C.relation,alignment)=aligned"),
    {
      relations: [{
        target: "C",
        type: "alignment",
        value: "aligned"
      }]
    }
  );
});

test("generic relation token end-to-end matches a scoped relation", () => {
  const corpus = [{
    char: "X",
    form: "SINGLE",
    strokes: 4,
    regions: {
      C: {
        strokes: 4,
        relations: [{ type: "parallelism", value: true }]
      }
    }
  }, {
    char: "Y",
    form: "SINGLE",
    strokes: 4,
    regions: {
      C: {
        strokes: 4,
        relations: []
      }
    }
  }];

  assert.deepEqual(
    matchInput(corpus, "rel(C.relation,parallelism)=true").map(candidate => candidate.char),
    ["X"]
  );
});

test("generic relation token serializer is deterministic", () => {
  assert.equal(
    genericRelationTokenFromParts("C", "parallelism", true),
    "rel(C.relation,parallelism)=true"
  );
});
