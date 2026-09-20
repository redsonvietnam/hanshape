
const TARGETS = ["C", "L", "R", "T", "B", "O", "I"];
const MISSING = "__missing__";

const TARGET_LABELS = {
  C: "toàn chữ",
  L: "phần trái",
  R: "phần phải",
  T: "phần trên",
  B: "phần dưới",
  O: "phần ngoài",
  I: "phần trong"
};

const ENUM_SPECS = [
  ["topology", "enclosure"],
  ["topology", "connectivity"],
  ["topology", "crossing"],
  ["topology", "junction"],
  ["geometry", "axis"],
  ["geometry", "curvature"],
  ["geometry", "symmetry"],
  ["geometry", "convergence"]
];

const CONTENT_SPECS = [
  ["content", "strokes"],
  ["content", "boundaryContact"]
];

function featureSource(candidate, target) {
  return target === "C"
    ? candidate.regions?.C
    : candidate.regions?.[target];
}

function entropyFromCounts(counts, total) {
  if (!total || counts.length <= 1) return 0;

  return counts.reduce((sum, count) => {
    const probability = count / total;
    return probability <= 0
      ? sum
      : sum - probability * Math.log2(probability);
  }, 0);
}

function observationId(target, kind, path, relationKey = "") {
  return JSON.stringify({ target, kind, path, relationKey });
}

function relationKey(relation) {
  return [
    relation.type,
    relation.a ?? "",
    relation.b ?? ""
  ].join("|");
}

function relationLabel(relation) {
  const a = relation.a ?? "";
  const b = relation.b ?? "";
  return relation.type + ":" + a + ":" + b;
}

function makeObservation(data) {
  return { ...data };
}

function collectRelationSpecs(candidates, target) {
  const identities = new Map();

  for (const candidate of candidates) {
    const source = featureSource(candidate, target);
    if (!source) continue;

    for (const relation of source.relations || []) {
      const key = relationKey(relation);
      if (!identities.has(key)) {
        identities.set(key, relation);
      }
    }
  }

  return [...identities.values()];
}

function readObservationValue(candidate, observation) {
  const source = featureSource(candidate, observation.target);
  if (!source) return MISSING;

  if (observation.kind === "region") {
    const value = observation.path.reduce(
      (current, key) => current?.[key],
      source
    );
    return value === undefined ? MISSING : value;
  }

  if (observation.kind === "strokeType") {
    const strokeType = observation.path[0];
    return source.strokeTypes?.includes(strokeType) ?? false;
  }

  if (observation.kind === "relation") {
    const relation = (source.relations || []).find(
      item => relationKey(item) === observation.relationKey
    );
    return relation?.value ?? MISSING;
  }

  return MISSING;
}

function makeRegionObservations(candidates, target) {
  if (!candidates.every(candidate => featureSource(candidate, target))) return [];

  const observations = [];

  for (const [section, key] of [...ENUM_SPECS, ...CONTENT_SPECS]) {
    const path = [section, key];
    const values = new Set(
      candidates.map(candidate => readObservationValue(candidate, {
        target,
        kind: "region",
        path
      }))
    );

    if (values.size < 2) continue;

    observations.push(makeObservation({
      id: observationId(target, "region", path),
      target,
      kind: "region",
      path,
      query: null,
      label: TARGET_LABELS[target] + ": " + section + "." + key,
      concept: key,
      values: [...values]
    }));
  }

  const strokeTypes = new Set(
    candidates.flatMap(candidate =>
      featureSource(candidate, target)?.strokeTypes || []
    )
  );

  for (const strokeType of strokeTypes) {
    const path = [strokeType];
    const values = new Set(
      candidates.map(candidate => readObservationValue(candidate, {
        target,
        kind: "strokeType",
        path
      }))
    );

    if (values.size < 2) continue;

    observations.push(makeObservation({
      id: observationId(target, "strokeType", path),
      target,
      kind: "strokeType",
      path,
      query: null,
      label: TARGET_LABELS[target] + " có " + strokeType + " không?",
      concept: "strokeType",
      values: [...values]
    }));
  }

  for (const relation of collectRelationSpecs(candidates, target)) {
    const relationId = relationKey(relation);
    const values = new Set(
      candidates.map(candidate => readObservationValue(candidate, {
        target,
        kind: "relation",
        relationKey: relationId
      }))
    );

    if (values.size < 2) continue;

    observations.push(makeObservation({
      id: observationId(target, "relation", [], relationId),
      target,
      kind: "relation",
      relationKey: relationId,
      query: null,
      label: relationLabel(relation),
      concept: relation.type,
      values: [...values]
    }));
  }

  return observations;
}

function collectObservations(candidates) {
  const observations = new Map();

  for (const target of TARGETS) {
    for (const observation of makeRegionObservations(candidates, target)) {
      observations.set(observation.id, observation);
    }
  }

  return [...observations.values()];
}

function partitionCandidates(candidates, observation) {
  const partitions = new Map();

  for (const candidate of candidates) {
    const value = readObservationValue(candidate, observation);
    if (!partitions.has(value)) partitions.set(value, []);
    partitions.get(value).push(candidate);
  }

  return partitions;
}

function scoreObservation(observation, candidates) {
  if (candidates.length < 2) return null;

  const partitions = partitionCandidates(candidates, observation);
  if (partitions.size < 2) return null;

  const informationGain = entropyFromCounts(
    [...partitions.values()].map(partition => partition.length),
    candidates.length
  );

  const largestPartition = Math.max(
    ...[...partitions.values()].map(partition => partition.length)
  );

  return {
    ...observation,
    candidateCount: candidates.length,
    informationGain,
    expectedRemaining: largestPartition,
    eliminationRatio: 1 - largestPartition / candidates.length,
    partitionValues: [...partitions.entries()].map(([value, branch]) => ({
      value,
      candidates: branch.map(candidate => candidate.char)
    }))
  };
}

function candidateKey(candidates) {
  return candidates.map(candidate => candidate.char).sort().join("\\u0000");
}

function comparePlans(a, b) {
  if (!b) return a;
  if (a.questions !== b.questions) {
    return a.questions < b.questions ? a : b;
  }

  const aKey = a.path.map(observation => observation.id).join("\\u0000");
  const bKey = b.path.map(observation => observation.id).join("\\u0000");
  return aKey.localeCompare(bKey) <= 0 ? a : b;
}

export function rankAdaptiveObservations(candidates, options = {}) {
  if (!Array.isArray(candidates) || candidates.length < 2) return [];

  const limit = options.limit ?? 5;

  return collectObservations(candidates)
    .map(observation => scoreObservation(observation, candidates))
    .filter(Boolean)
    .sort((a, b) =>
      b.informationGain - a.informationGain ||
      a.expectedRemaining - b.expectedRemaining ||
      a.label.localeCompare(b.label)
    )
    .slice(0, limit);
}

export function chooseNextObservation(candidates, options = {}) {
  return rankAdaptiveObservations(candidates, { ...options, limit: 1 })[0] ?? null;
}

export function applyObservationAnswer(candidates, observation, value) {
  return candidates.filter(
    candidate => readObservationValue(candidate, observation) === value
  );
}

function solveMinimumPath(candidates, targetChar, memo) {
  const key = candidateKey(candidates);
  if (memo.has(key)) return memo.get(key);

  if (candidates.length === 1) {
    const terminal = {
      questions: 0,
      path: [],
      remaining: [targetChar]
    };
    memo.set(key, terminal);
    return terminal;
  }

  let best = null;

  for (const observation of collectObservations(candidates)) {
    const target = candidates.find(candidate => candidate.char === targetChar);
    if (!target) return null;

    const branch = applyObservationAnswer(
      candidates,
      observation,
      readObservationValue(target, observation)
    );

    if (!branch.length || branch.length === candidates.length) continue;

    if (best && best.questions === 1) break;

    const child = solveMinimumPath(branch, targetChar, memo);
    if (!child) continue;

    const candidate = {
      questions: 1 + child.questions,
      path: [observation, ...child.path],
      remaining: child.remaining
    };

    best = comparePlans(candidate, best);
  }

  memo.set(key, best);
  return best;
}

export function minimumMultivalueObservationPath(candidates, targetChar) {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  if (!candidates.some(candidate => candidate.char === targetChar)) return null;

  const result = solveMinimumPath([...candidates], targetChar, new Map());
  if (!result) return null;

  return {
    targetChar,
    candidateCount: candidates.length,
    ...result
  };
}

export function simulateGreedyMultivaluePath(candidates, targetChar) {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  if (!candidates.some(candidate => candidate.char === targetChar)) return null;

  let remaining = [...candidates];
  const path = [];

  while (remaining.length > 1) {
    const observation = chooseNextObservation(remaining);
    if (!observation) return null;

    const target = remaining.find(candidate => candidate.char === targetChar);
    if (!target) return null;

    const value = readObservationValue(target, observation);
    remaining = applyObservationAnswer(remaining, observation, value);
    path.push(observation);
  }

  return {
    targetChar,
    candidateCount: candidates.length,
    questions: path.length,
    path,
    remaining: remaining.map(candidate => candidate.char)
  };
}

export function compareMultivalueObservationPaths(candidates, targetChar) {
  const optimal = minimumMultivalueObservationPath(candidates, targetChar);
  const greedy = simulateGreedyMultivaluePath(candidates, targetChar);

  if (!optimal || !greedy) return null;

  return {
    targetChar,
    candidateCount: candidates.length,
    optimalQuestions: optimal.questions,
    greedyQuestions: greedy.questions,
    questionGap: greedy.questions - optimal.questions,
    optimalPath: optimal.path,
    greedyPath: greedy.path,
    optimalRemaining: optimal.remaining,
    greedyRemaining: greedy.remaining
  };
}
