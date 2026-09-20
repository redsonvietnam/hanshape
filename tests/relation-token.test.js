import test from "node:test";
import assert from "node:assert/strict";
import { CHARACTER_MODEL } from "../src/character-model.js";
import { matchSemantic } from "../src/matcher.js";
import {
  parseRelationToken,
  relationTokenToSemanticQuery,
  semanticRelationToToken
} from "../src/relation-token.js";

test("relation token parses relative length", () => {
  assert.deepEqual(
    parseRelationToken("len(C.hUpper,C.hLower)<"),
    {
      type: "relativeLength",
      target: "C",
      a: "hUpper",
      b: "hLower",
      value: "shorter"
    }
  );
});

test("relation token parses relative position", () => {
  assert.deepEqual(
    parseRelationToken("pos(C.dot,C.mainAxis)=R"),
    {
      type: "relativePosition",
      target: "C",
      a: "dot",
      b: "mainAxis",
      value: "right"
    }
  );
});

test("relation token parses boundary contact", () => {
  assert.deepEqual(
    relationTokenToSemanticQuery("contact(C.content)=BOTH"),
    {
      regions: {
        C: {
          content: { boundaryContact: "both" }
        }
      }
    }
  );
});

test("relation token rejects cross-region comparisons", () => {
  assert.equal(
    parseRelationToken("len(L.hUpper,R.hLower)<"),
    null
  );
});

test("relation token rejects malformed syntax", () => {
  assert.equal(parseRelationToken("length(C.hUpper,C.hLower)<"), null);
  assert.equal(parseRelationToken("pos(C.dot,C.axis)=Z"), null);
  assert.equal(parseRelationToken("contact(C.other)=BOTH"), null);
});

test("semantic relation token round-trips relative length", () => {
  const relation = {
    type: "relativeLength",
    target: "C",
    a: "hUpper",
    b: "hLower",
    value: "shorter"
  };

  const token = semanticRelationToToken(relation);
  assert.equal(token, "len(C.hUpper,C.hLower)<");
  assert.deepEqual(parseRelationToken(token), relation);
});

test("relation token end-to-end identifies 未", () => {
  const query = relationTokenToSemanticQuery(
    "len(C.hUpper,C.hLower)<"
  );

  assert.deepEqual(
    matchSemantic(CHARACTER_MODEL, query).map(candidate => candidate.char),
    ["未"]
  );
});

test("relation token end-to-end identifies 犬", () => {
  const query = relationTokenToSemanticQuery(
    "pos(C.dot,C.mainAxis)=R"
  );

  assert.deepEqual(
    matchSemantic(CHARACTER_MODEL, query).map(candidate => candidate.char),
    ["犬"]
  );
});

test("relation token end-to-end identifies 曰", () => {
  const query = relationTokenToSemanticQuery(
    "contact(C.content)=LEFT"
  );

  assert.deepEqual(
    matchSemantic(CHARACTER_MODEL, query).map(candidate => candidate.char),
    ["曰"]
  );
});
