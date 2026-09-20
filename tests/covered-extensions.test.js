import test from "node:test";
import assert from "node:assert/strict";
import { CHARACTER_MODEL } from "../src/character-model.js";
import { EXTENDED_COVERED_MODEL } from "../data/extended-covered-model.js";
import { rankAdaptiveQuestions } from "../src/adaptive-matcher.js";

const corpus = [...CHARACTER_MODEL, ...EXTENDED_COVERED_MODEL];
const group = (...names) => corpus.filter(character => names.includes(character.char));

function assertPairwiseSeparable(names) {
  const candidates = group(...names);
  for (let i = 0; i < candidates.length; i += 1) {
    for (let j = i + 1; j < candidates.length; j += 1) {
      const questions = rankAdaptiveQuestions([candidates[i], candidates[j]], {
        limit: 100,
        lookaheadDepth: 1,
        costMode: "flat"
      });
      assert.ok(
        questions.length > 0,
        `No current discriminator for ${candidates[i].char}/${candidates[j].char}`
      );
    }
  }
}

test("experimental 王/玉/主/生 family is pairwise separable", () => {
  assertPairwiseSeparable(["王", "玉", "主", "生"]);
});

test("experimental 口/日/曰/目 family is pairwise separable", () => {
  assertPairwiseSeparable(["口", "日", "曰", "目"]);
});
