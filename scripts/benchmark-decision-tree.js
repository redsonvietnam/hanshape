import { CHARACTER_MODEL } from "../src/character-model.js";
import { rankAdaptiveQuestions, applyAdaptiveAnswer } from "../src/adaptive-matcher.js";
import { rankAdaptiveObservations, applyObservationAnswer } from "../src/multivalue-observation.js";

const singles = CHARACTER_MODEL.filter(character => character.form === "SINGLE");

function combinations(items, size) {
  const result = [];
  function visit(start, picked) {
    if (picked.length === size) {
      result.push(picked.slice());
      return;
    }
    for (let i = start; i <= items.length - (size - picked.length); i += 1) {
      picked.push(items[i]);
      visit(i + 1, picked);
      picked.pop();
    }
  }
  visit(0, []);
  return result;
}

function candidateKey(candidates) {
  return candidates.map(candidate => candidate.char).sort().join("\u0000");
}

function averageTargetDepthGreedyBinary(candidates) {
  const memo = new Map();

  function solve(current) {
    if (current.length <= 1) return 0;
    const key = candidateKey(current);
    if (memo.has(key)) return memo.get(key);

    const question = rankAdaptiveQuestions(current, {
      limit: 1,
      lookaheadDepth: 1,
      costMode: "flat"
    })[0];

    if (!question) return Number.POSITIVE_INFINITY;

    const yes = applyAdaptiveAnswer(current, question, true);
    const no = applyAdaptiveAnswer(current, question, false);
    const value = 1 +
      yes.length / current.length * solve(yes) +
      no.length / current.length * solve(no);

    memo.set(key, value);
    return value;
  }

  return solve(candidates);
}

function optimalTargetDepthBinary(candidates) {
  const memo = new Map();

  function solve(current) {
    if (current.length <= 1) return 0;
    const key = candidateKey(current);
    if (memo.has(key)) return memo.get(key);

    let best = Number.POSITIVE_INFINITY;
    const questions = rankAdaptiveQuestions(current, {
      limit: Number.POSITIVE_INFINITY,
      lookaheadDepth: 1,
      costMode: "flat"
    });

    for (const question of questions) {
      const yes = applyAdaptiveAnswer(current, question, true);
      const no = applyAdaptiveAnswer(current, question, false);
      if (!yes.length || !no.length) continue;

      const value = 1 +
        yes.length / current.length * solve(yes) +
        no.length / current.length * solve(no);
      best = Math.min(best, value);
    }

    memo.set(key, best);
    return best;
  }

  return solve(candidates);
}

function averageTargetDepthGreedyMulti(candidates) {
  const memo = new Map();

  function solve(current) {
    if (current.length <= 1) return 0;
    const key = candidateKey(current);
    if (memo.has(key)) return memo.get(key);

    const observation = rankAdaptiveObservations(current, {
      limit: 1
    })[0];

    if (!observation) return Number.POSITIVE_INFINITY;

    let value = 1;
    for (const partition of observation.partitionValues) {
      const branch = applyObservationAnswer(current, observation, partition.value);
      value += branch.length / current.length * solve(branch);
    }

    memo.set(key, value);
    return value;
  }

  return solve(candidates);
}

function optimalTargetDepthMulti(candidates) {
  const memo = new Map();

  function solve(current) {
    if (current.length <= 1) return 0;
    const key = candidateKey(current);
    if (memo.has(key)) return memo.get(key);

    let best = Number.POSITIVE_INFINITY;
    const observations = rankAdaptiveObservations(current, {
      limit: Number.POSITIVE_INFINITY
    });

    for (const observation of observations) {
      let value = 1;
      let valid = true;

      for (const partition of observation.partitionValues) {
        const branch = applyObservationAnswer(current, observation, partition.value);
        if (!branch.length || branch.length === current.length) {
          valid = false;
          break;
        }
        value += branch.length / current.length * solve(branch);
      }

      if (valid) best = Math.min(best, value);
    }

    memo.set(key, best);
    return best;
  }

  return solve(candidates);
}

function benchmark(subsets) {
  const rows = subsets.map(candidates => ({
    size: candidates.length,
    binaryGreedy: averageTargetDepthGreedyBinary(candidates),
    binaryOptimal: optimalTargetDepthBinary(candidates),
    multiGreedy: averageTargetDepthGreedyMulti(candidates),
    multiOptimal: optimalTargetDepthMulti(candidates)
  }));

  return {
    subsets: rows.length,
    binaryGreedyAvg: rows.reduce((sum, row) => sum + row.binaryGreedy, 0) / rows.length,
    binaryOptimalAvg: rows.reduce((sum, row) => sum + row.binaryOptimal, 0) / rows.length,
    multiGreedyAvg: rows.reduce((sum, row) => sum + row.multiGreedy, 0) / rows.length,
    multiOptimalAvg: rows.reduce((sum, row) => sum + row.multiOptimal, 0) / rows.length,
    binaryNonOptimal: rows.filter(row => row.binaryGreedy > row.binaryOptimal + 1e-12).length,
    multiNonOptimal: rows.filter(row => row.multiGreedy > row.multiOptimal + 1e-12).length
  };
}

const subsets4 = combinations(singles, 4);
const all5 = combinations(singles, 5);
const step5 = Math.max(1, Math.floor(all5.length / 512));
const subsets5 = all5.filter((_, index) => index % step5 === 0).slice(0, 512);

console.log("HanShape target-agnostic decision-tree benchmark");
console.log("=================================================");
console.log("4-character SINGLE subsets (exhaustive)");
console.table([benchmark(subsets4)]);
console.log("5-character SINGLE subsets (deterministic sample)");
console.table([benchmark(subsets5)]);
