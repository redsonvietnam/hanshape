import test from "node:test";
import assert from "node:assert/strict";
import { CHARACTER_MODEL } from "../src/character-model.js";
import { matchSemantic } from "../src/matcher.js";
import { parseBase } from "../src/parser.js";

const chars = result => result.map(x => x.char).sort();

test("木/本/未/末", () => {
  assert.deepEqual(chars(matchSemantic(CHARACTER_MODEL, { form: "SINGLE", strokes: 5 })), ["本", "未", "末", "目"]);
  assert.deepEqual(chars(matchSemantic(CHARACTER_MODEL, { form: "SINGLE", strokes: 5, relations: [{ type: "relativeLength", a: "hUpper", b: "hLower", value: "shorter" }] })), ["未"]);
  assert.deepEqual(chars(matchSemantic(CHARACTER_MODEL, { form: "SINGLE", strokes: 5, relations: [{ type: "relativeLength", a: "hUpper", b: "hLower", value: "longer" }] })), ["末"]);
});

test("木/日", () => {
  assert.deepEqual(chars(matchSemantic(CHARACTER_MODEL, { form: "SINGLE", strokes: 4 })), ["木", "日"]);
  assert.deepEqual(chars(matchSemantic(CHARACTER_MODEL, { form: "SINGLE", strokes: 4, regions: { C: { topology: { enclosure: false } } } })), ["木"]);
  assert.deepEqual(chars(matchSemantic(CHARACTER_MODEL, { form: "SINGLE", strokes: 4, regions: { C: { topology: { enclosure: true } } } })), ["日"]);
});

test("人/入/八", () => {
  assert.deepEqual(chars(matchSemantic(CHARACTER_MODEL, { form: "SINGLE", strokes: 2 })), ["人", "入", "八"]);
  assert.deepEqual(chars(matchSemantic(CHARACTER_MODEL, { form: "SINGLE", strokes: 2, regions: { C: { geometry: { convergence: "upper", symmetry: "vertical" } } } })), ["人"]);
  assert.deepEqual(chars(matchSemantic(CHARACTER_MODEL, { form: "SINGLE", strokes: 2, regions: { C: { geometry: { convergence: "lower" } } } })), ["入"]);
  assert.deepEqual(chars(matchSemantic(CHARACTER_MODEL, { form: "SINGLE", strokes: 2, regions: { C: { topology: { connectivity: "disconnected" } } } })), ["八"]);
});

test("日/曰/目", () => {
  assert.deepEqual(chars(matchSemantic(CHARACTER_MODEL, { form: "SINGLE", regions: { C: { topology: { enclosure: true } } } })), ["日", "曰", "目"]);
  assert.deepEqual(chars(matchSemantic(CHARACTER_MODEL, { form: "SINGLE", strokes: 4, regions: { C: { topology: { enclosure: true }, content: { strokes: 1, boundaryContact: "both" } } } })), ["日"]);
  assert.deepEqual(chars(matchSemantic(CHARACTER_MODEL, { form: "SINGLE", strokes: 4, regions: { C: { topology: { enclosure: true }, content: { strokes: 1, boundaryContact: "left" } } } })), ["曰"]);
  assert.deepEqual(chars(matchSemantic(CHARACTER_MODEL, { form: "SINGLE", strokes: 5, regions: { C: { content: { strokes: 2 } } } })), ["目"]);
});

test("土/士", () => {
  assert.deepEqual(chars(matchSemantic(CHARACTER_MODEL, { form: "SINGLE", strokes: 3 })), ["大", "土", "士"]);
  assert.deepEqual(chars(matchSemantic(CHARACTER_MODEL, { form: "SINGLE", strokes: 3, relations: [{ type: "relativeLength", a: "hLower", b: "hUpper", value: "longer" }] })), ["土"]);
  assert.deepEqual(chars(matchSemantic(CHARACTER_MODEL, { form: "SINGLE", strokes: 3, relations: [{ type: "relativeLength", a: "hLower", b: "hUpper", value: "shorter" }] })), ["士"]);
});

test("大/太/犬", () => {
  assert.deepEqual(chars(matchSemantic(CHARACTER_MODEL, { form: "SINGLE", strokes: 3 })), ["大"]);
  assert.deepEqual(chars(matchSemantic(CHARACTER_MODEL, { form: "SINGLE", strokes: 4, regions: { C: { strokeTypes: ["dot"] } } })), ["太", "犬"]);
  assert.deepEqual(chars(matchSemantic(CHARACTER_MODEL, { form: "SINGLE", strokes: 4, relations: [{ type: "relativePosition", a: "dot", b: "mainAxis", value: "right" }] })), ["犬"]);
});

test("明/林/朋/服", () => {
  assert.deepEqual(chars(matchSemantic(CHARACTER_MODEL, { form: "LR", regions: { L: { strokes: 4 }, R: { strokes: 4 } } })), ["明", "林", "朋", "服"]);
  assert.deepEqual(chars(matchSemantic(CHARACTER_MODEL, { form: "LR", regions: { L: { topology: { enclosure: true } }, R: { topology: { enclosure: false } } } })), ["明"]);
  assert.deepEqual(chars(matchSemantic(CHARACTER_MODEL, { form: "LR", regions: {
    L: { topology: { enclosure: false }, content: { strokes: 2 } },
    R: { topology: { enclosure: false }, content: { strokes: 2 } }
  } })), ["朋"]);
  assert.deepEqual(chars(matchSemantic(CHARACTER_MODEL, { form: "LR", regions: { L: { topology: { enclosure: false } }, R: { geometry: { curvature: "mixed" } } } })), ["服"]);
  assert.deepEqual(chars(matchSemantic(CHARACTER_MODEL, { form: "LR", regions: { L: { topology: { enclosure: false } }, R: { topology: { enclosure: false }, geometry: { symmetry: "vertical" } } } })), ["林"]);
});

test("numeric parser resolves digit to abstract query", () => {
  const parsed = parseBase("844040");
  assert.equal(parsed.form, "LR");
  assert.deepEqual(parsed.counts, [4, 4]);
  assert.deepEqual(parsed.refinements[0].query, { path: "topology.enclosure", equals: true });
});

test("same semantic query remains valid if digit binding changes", () => {
  const semantic = matchSemantic(CHARACTER_MODEL, { form: "SINGLE", strokes: 4, regions: { C: { topology: { enclosure: true } } } });
  assert.deepEqual(chars(semantic), ["日"]);
});
