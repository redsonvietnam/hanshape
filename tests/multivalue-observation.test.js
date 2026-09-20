import test from "node:test";
import assert from "node:assert/strict";
import { CHARACTER_MODEL } from "../src/character-model.js";
import {
  rankAdaptiveObservations,
  chooseNextObservation,
  applyObservationAnswer,
  minimumMultivalueObservationPath,
  compareMultivalueObservationPaths
} from "../src/multivalue-observation.js";

const group = (...names) =>
  CHARACTER_MODEL.filter(character => names.includes(character.char));

test("multivalue observation can identify 日/曰/目 without repeated YES/NO boundary checks", () => {
  const candidates = group("日", "曰", "目");
  const ranked = rankAdaptiveObservations(candidates, { limit: 20 });

  const best = ranked[0];
  assert.ok(best);
  assert.equal(best.values.length >= 2, true);
  assert.equal(best.informationGain > 1, true);

  for (const target of candidates) {
    const path = minimumMultivalueObservationPath(candidates, target.char);
    assert.ok(path);
    assert.equal(path.questions, 1);
    assert.deepEqual(path.remaining, [target.char]);
  }
});

test("multivalue relation observation exposes 木/本/未/末 as a compact path", () => {
  const candidates = group("木", "本", "未", "末");

  for (const target of candidates) {
    const result = compareMultivalueObservationPaths(candidates, target.char);
    assert.ok(result);
    assert.equal(result.optimalQuestions <= 2, true);
    assert.deepEqual(result.optimalRemaining, [target.char]);
  }
});

test("multivalue observation separates 土/士/大 in two observations", () => {
  const candidates = group("大", "土", "士");

  for (const target of candidates) {
    const result = minimumMultivalueObservationPath(candidates, target.char);
    assert.ok(result);
    assert.equal(result.questions, 2);
  }
});

test("multivalue observation answer keeps exact branch semantics", () => {
  const candidates = group("日", "曰", "目");
  const observation = chooseNextObservation(candidates);
  assert.ok(observation);

  const target = candidates.find(candidate => candidate.char === "曰");
  const value = observation.partitionValues.find(partition =>
    partition.candidates.includes("曰")
  )?.value;

  assert.notEqual(value, undefined);
  const branch = applyObservationAnswer(candidates, observation, value);
  assert.ok(branch.some(candidate => candidate.char === target.char));
  assert.equal(branch.length < candidates.length, true);
});
