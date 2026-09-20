import test from "node:test";
import assert from "node:assert/strict";
import { encodeSemanticQuestion, encodeObservationPath, encodeObservationValue } from "../src/query-encoding.js";

test("numeric encoder maps enclosure to the existing refinement namespace", () => {
  const result = encodeSemanticQuestion({
    query: { regions: { C: { topology: { enclosure: true } } } }
  });

  assert.equal(result.supported, true);
  assert.equal(result.code, "050");
});

test("numeric encoder maps target-specific dot feature", () => {
  const result = encodeSemanticQuestion({
    query: { regions: { L: { strokeTypes: ["dot"] } } }
  });

  assert.equal(result.supported, true);
  assert.equal(result.code, "046");
});

test("numeric encoder preserves the bound parallelism feature", () => {
  const result = encodeSemanticQuestion({
    query: { relations: [{ type: "parallelism", value: true }] }
  });

  assert.equal(result.supported, true);
  assert.equal(result.code, "055");
});

test("numeric encoder refuses unbound relations", () => {
  const result = encodeSemanticQuestion({
    query: { relations: [{ type: "relativeLength", a: "hUpper", b: "hLower", value: "shorter" }] }
  });

  assert.equal(result.supported, false);
  assert.equal(result.reason, "relation-not-bound");
});

test("numeric encoder refuses boundary-contact features", () => {
  const result = encodeSemanticQuestion({
    query: { regions: { C: { content: { boundaryContact: "both" } } } }
  });

  assert.equal(result.supported, false);
  assert.equal(result.reason, "content-feature-not-bound");
});

test("path encoding reports coverage instead of silently losing observations", () => {
  const result = encodeObservationPath([
    { query: { regions: { C: { topology: { enclosure: true } } } } },
    { query: { relations: [{ type: "relativeLength", value: "shorter" }] } }
  ]);

  assert.equal(result.total, 2);
  assert.equal(result.supported, 1);
  assert.equal(result.unsupported, 1);
  assert.equal(result.coverage, 0.5);
  assert.ok(result.unsupportedReasons.includes("relation-not-bound"));
});

test("numeric expressiveness audit accepts supported multivalue facts", () => {
  const result = encodeObservationValue({
    kind: "region",
    target: "C",
    path: ["topology", "enclosure"]
  }, true);

  assert.equal(result.supported, true);
  assert.equal(result.code, "050");
});

test("numeric expressiveness audit reports unbound multivalue relations", () => {
  const result = encodeObservationValue({
    kind: "relation",
    relationKey: "relativeLength|hUpper|hLower"
  }, "shorter");

  assert.equal(result.supported, false);
  assert.equal(result.reason, "relation-not-bound");
});

test("numeric expressiveness audit reports unsupported negative observations", () => {
  const result = encodeObservationValue({
    kind: "strokeType",
    target: "C",
    path: ["dot"]
  }, false);

  assert.equal(result.supported, false);
  assert.equal(result.reason, "feature-not-bound");
});
