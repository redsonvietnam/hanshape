import test from "node:test";
import assert from "node:assert/strict";
import { CHARACTER_MODEL } from "../src/character-model.js";
import { ADVERSARIAL_GROUPS } from "../data/adversarial-corpus.js";
import {
  observationCost,
  observationRecognitionCost
} from "../src/effort-model.js";
import {
  rankAdaptiveObservations,
  compareMultivalueObservationPaths
} from "../src/multivalue-observation.js";

const group = (...names) =>
  CHARACTER_MODEL.filter(character => names.includes(character.char));

test("human-effort proxy keeps flat observation cost at one", () => {
  const observation = {
    kind: "region",
    target: "C",
    path: ["geometry", "symmetry"],
    concept: "symmetry"
  };

  assert.equal(observationCost(observation), 1);
  assert.equal(observationCost(observation, { costMode: "flat" }), 1);
});

test("human-effort proxy uses the declared recognition weight", () => {
  const observation = {
    kind: "region",
    target: "C",
    path: ["topology", "junction"],
    concept: "junction"
  };

  assert.equal(
    observationRecognitionCost(observation),
    1.30
  );
  assert.equal(
    observationCost(observation, { costMode: "weighted" }),
    1.30
  );
});

test("weighted multivalue ranking exposes an effort score", () => {
  const candidates = group("木", "本", "未", "末");
  const ranked = rankAdaptiveObservations(candidates, {
    costMode: "weighted",
    limit: 20
  });

  assert.ok(ranked.length > 0);
  for (const observation of ranked) {
    assert.ok(Number.isFinite(observation.observationCost));
    assert.ok(Number.isFinite(observation.effortScore));
    assert.equal(
      observation.effortScore,
      observation.informationGain / observation.observationCost
    );
  }
});

test("weighted exact path never costs more than the weighted greedy path", () => {
  for (const names of ADVERSARIAL_GROUPS) {
    const candidates = group(...names);

    for (const target of candidates) {
      const result = compareMultivalueObservationPaths(
        candidates,
        target.char,
        { costMode: "weighted" }
      );

      assert.ok(result, names.join("/"));
      assert.ok(result.optimalCost <= result.greedyCost);
      assert.deepEqual(result.optimalRemaining, [target.char]);
      assert.deepEqual(result.greedyRemaining, [target.char]);
    }
  }
});
