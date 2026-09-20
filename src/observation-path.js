import {
  applyAdaptiveAnswer,
  chooseNextQuestion,
  rankAdaptiveQuestions
} from "./adaptive-matcher.js";

function candidateKey(candidates) {
  return candidates.map(candidate => candidate.char).sort().join("\u0000");
}

function targetInCandidates(candidates, targetChar) {
  return candidates.some(candidate => candidate.char === targetChar);
}

function branchForTarget(candidates, question, targetChar) {
  const answer = question.yesCandidates.includes(targetChar);
  return applyAdaptiveAnswer(candidates, question, answer);
}

function comparePaths(a, b) {
  if (!b) return a;
  if (a.questions !== b.questions) {
    return a.questions < b.questions ? a : b;
  }

  const aKey = a.path.map(question => question.id).join("\u0000");
  const bKey = b.path.map(question => question.id).join("\u0000");
  return aKey.localeCompare(bKey) <= 0 ? a : b;
}

/**
 * Find the shortest target-specific visual observation path available
 * in the current question generator.
 *
 * The target is used only by the simulator to determine which branch
 * the observed answer would take. The optimizer still has to choose
 * every observation from the same semantic question space available
 * to HanShape.
 *
 * With flat cost (the default), this answers:
 *   "How many binary visual observations are minimally sufficient
 *    to isolate this character from the current candidate set?"
 */
export function minimumObservationPath(candidates, targetChar, options = {}) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return null;
  }

  if (!targetInCandidates(candidates, targetChar)) {
    return null;
  }

  const costMode = options.costMode ?? "flat";
  const memo = new Map();

  function solve(current) {
    const key = `${costMode}:${candidateKey(current)}`;
    if (memo.has(key)) return memo.get(key);

    if (current.length === 1) {
      const terminal = {
        questions: 0,
        cost: 0,
        path: [],
        remaining: [current[0].char]
      };
      memo.set(key, terminal);
      return terminal;
    }

    const questions = rankAdaptiveQuestions(current, {
      limit: Number.POSITIVE_INFINITY,
      lookaheadDepth: 1,
      costMode
    }).sort((a, b) => {
      const aBranch = branchForTarget(current, a, targetChar);
      const bBranch = branchForTarget(current, b, targetChar);
      return aBranch.length - bBranch.length
        || b.informationGain - a.informationGain
        || a.label.localeCompare(b.label);
    });

    let best = null;

    for (const question of questions) {
      const branch = branchForTarget(current, question, targetChar);
      if (branch.length >= current.length) continue;

      const child = solve(branch);
      if (!child) continue;

      const candidate = {
        questions: 1 + child.questions,
        cost: question.recognitionCost + child.cost,
        path: [question, ...child.path],
        remaining: child.remaining
      };

      best = comparePaths(candidate, best);
    }

    memo.set(key, best);
    return best;
  }

  const result = solve([...candidates]);
  if (!result) return null;

  return {
    targetChar,
    candidateCount: candidates.length,
    lowerBound: Math.ceil(Math.log2(candidates.length)),
    ...result,
    statesExplored: memo.size
  };
}

/**
 * Simulate the currently implemented greedy adaptive policy for a target.
 * This is intentionally separate from the optimizer so benchmarks can
 * measure the gap between current behavior and the best path available
 * in the same question space.
 */
export function simulateGreedyObservationPath(candidates, targetChar, options = {}) {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  if (!targetInCandidates(candidates, targetChar)) return null;

  const costMode = options.costMode ?? "flat";
  let remaining = [...candidates];
  const path = [];
  let cost = 0;

  while (remaining.length > 1) {
    const question = chooseNextQuestion(remaining, {
      lookaheadDepth: 1,
      costMode
    });

    if (!question) {
      return null;
    }

    const answer = question.yesCandidates.includes(targetChar);
    remaining = applyAdaptiveAnswer(remaining, question, answer);
    path.push(question);
    cost += question.recognitionCost;
  }

  return {
    targetChar,
    candidateCount: candidates.length,
    questions: path.length,
    cost,
    lowerBound: Math.ceil(Math.log2(candidates.length)),
    path,
    remaining: remaining.map(candidate => candidate.char)
  };
}

export function compareObservationPaths(candidates, targetChar, options = {}) {
  const optimal = minimumObservationPath(candidates, targetChar, options);
  const greedy = simulateGreedyObservationPath(candidates, targetChar, options);

  if (!optimal || !greedy) return null;

  return {
    targetChar,
    candidateCount: candidates.length,
    lowerBound: optimal.lowerBound,
    optimalQuestions: optimal.questions,
    greedyQuestions: greedy.questions,
    questionGap: greedy.questions - optimal.questions,
    entropyGap: greedy.questions - optimal.lowerBound,
    optimalCost: optimal.cost,
    greedyCost: greedy.cost,
    costGap: greedy.cost - optimal.cost,
    optimalPath: optimal.path,
    greedyPath: greedy.path,
    statesExplored: optimal.statesExplored
  };
}
