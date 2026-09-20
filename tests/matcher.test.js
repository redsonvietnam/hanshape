import { CHARACTER_MODEL } from "../src/character-model.js";
import { matchSemantic } from "../src/matcher.js";

const expectSet = (actual, expected) => {
  const a = actual.map(x => x.char).sort().join("");
  const e = [...expected].sort().join("");
  if (a !== e) throw new Error(`Expected [${e}], got [${a}]`);
};

// Group 1
expectSet(matchSemantic(CHARACTER_MODEL, { form: "SINGLE", strokes: 4 }), ["木", "日"]);

// Group 1 refinements
expectSet(matchSemantic(CHARACTER_MODEL, {
  form: "SINGLE",
  strokes: 5,
  geometry: { lowerHorizontal: true }
}), ["本"]);

// Group 2
expectSet(matchSemantic(CHARACTER_MODEL, { form: "SINGLE", strokes: 2 }), ["人", "入", "八"]);

// Group 3
expectSet(matchSemantic(CHARACTER_MODEL, {
  form: "SINGLE",
  strokes: 4,
  geometry: { innerHorizontal: 1 }
}), ["日"]);

// Group 4
expectSet(matchSemantic(CHARACTER_MODEL, {
  form: "SINGLE",
  strokes: 3,
  geometry: { horizontalPosition: "lower" }
}), ["土"]);

// Group 5
expectSet(matchSemantic(CHARACTER_MODEL, {
  form: "SINGLE",
  strokes: 3
}), ["大"]);

expectSet(matchSemantic(CHARACTER_MODEL, {
  form: "SINGLE",
  strokes: 4,
  geometry: { dot: true }
}), ["太", "犬"]);

// Group 6
expectSet(matchSemantic(CHARACTER_MODEL, {
  form: "LR",
  regions: { L: { strokes: 4 }, R: { strokes: 4 } }
}), ["明", "林", "朋", "服"]);

text("v0.6 matcher tests passed");
