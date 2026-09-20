import test from "node:test";
import assert from "node:assert/strict";
import { CHARACTER_MODEL } from "../src/character-model.js";
import {
  minimumObservationPath,
  simulateGreedyObservationPath,
  compareObservationPaths
} from "../src/observation-path.js";

const group = (...names) =>
  CHARACTER_MODEL.filter(character => names.includes(character.char));

test("observation path — every separable pair has a one-observation optimum", () => {
  for (let i = 0; i < CHARACTER_MODEL.length; i += 1) {
    for (let j = i + 1; j < CHARACTER_MODEL.length; j += 1) {
      const candidates = [CHARACTER_MODEL[i], CHARACTER_MODEL[j]];
      for (const target of candidates) {
        const result = minimumObservationPath(candidates, target.char);
        assert.ok(result);
        assert.equal(result.questions, 1);
        assert.equal(result.targetLowerBound, 1);
        assert.equal(result.remaining[0], target.char);
      }
    }
  }
});

test("observation path — 土/士/大 reaches the target-specific optimum within two observations", () => {
  const candidates = group("大", "土", "士");

  let observedGap = false;

  for (const target of candidates) {
    const optimal = minimumObservationPath(candidates, target.char);
    const greedy = simulateGreedyObservationPath(candidates, target.char);

    assert.ok(optimal);
    assert.ok(greedy);
    assert.equal(optimal.targetLowerBound, 1);
    assert.equal(optimal.questions, 1);
    assert.ok(greedy.questions >= optimal.questions);
    assert.ok(greedy.questions <= 2);
    if (greedy.questions > optimal.questions) observedGap = true;
    assert.deepEqual(greedy.remaining, [target.char]);
  }

  assert.equal(observedGap, true);
});

test("observation path — 木/本/未/末 exposes exact gap rather than hiding it", () => {
  const candidates = group("木", "本", "未", "末");

  for (const target of candidates) {
    const result = compareObservationPaths(candidates, target.char);

    assert.ok(result);
    assert.ok(result.optimalQuestions >= result.targetLowerBound);
    assert.ok(result.greedyQuestions >= result.optimalQuestions);
    assert.deepEqual(result.optimalRemaining, [target.char]);
    assert.deepEqual(result.greedyRemaining, [target.char]);
    assert.equal(result.optimalPath.at(-1).label !== undefined, true);
    assert.equal(result.greedyPath.at(-1).label !== undefined, true);
  }
});

test("observation path — unknown target returns null", () => {
  assert.equal(
    minimumObservationPath(group("木", "本"), "森"),
    null
  );

  assert.equal(
    simulateGreedyObservationPath(group("木", "本"), "森"),
    null
  );
});

test("observation path — singleton needs zero observations", () => {
  const result = minimumObservationPath(group("木"), "木");

  assert.ok(result);
  assert.equal(result.questions, 0);
  assert.equal(result.targetLowerBound, 0);
  assert.deepEqual(result.path, []);
  assert.deepEqual(result.remaining, ["木"]);
});
