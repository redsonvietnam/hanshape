import { matchSemantic } from "./matcher.js";

const TARGETS = ["C", "L", "R", "T", "B", "O", "I"];

const TARGET_LABELS = {
  C: "toàn chữ",
  L: "phần trái",
  R: "phần phải",
  T: "phần trên",
  B: "phần dưới",
  O: "phần ngoài",
  I: "phần trong"
};

const CONCEPT_PRIORITY = [
  "enclosure",
  "connectivity",
  "strokeType",
  "axis",
  "symmetry",
  "convergence",
  "curvature",
  "boundaryContact",
  "relativePosition",
  "relativeLength",
  "junction",
  "parallelism",
  "alignment",
  "density",
  "repetition"
];

const CONCEPT_COST = {
  enclosure: 0.80,
  connectivity: 0.80,
  strokeType: 0.90,
  axis: 0.90,
  symmetry: 0.90,
  convergence: 1.00,
  curvature: 1.05,
  boundaryContact: 1.00,
  relativePosition: 1.15,
  relativeLength: 1.20,
  junction: 1.30,
  parallelism: 1.25,
  alignment: 1.25,
  density: 1.40,
  repetition: 1.40
};

const VALUE_LABELS = {
  upper: "phía trên",
  middle: "ở giữa",
  lower: "phía dưới",
  left: "bên trái",
  center: "ở giữa",
  right: "bên phải",
  shorter: "ngắn hơn",
  equal: "bằng nhau",
  longer: "dài hơn",
  connected: "nối liền",
  disconnected: "tách rời",
  vertical: "dọc",
  horizontal: "ngang",
  diagonal: "chéo",
  curved: "cong",
  mixed: "có nét cong",
  none: "không",
  both: "cả hai bên",
  sparse: "thưa",
  medium: "vừa",
  dense: "dày"
};

const STROKE_LABELS = {
  dot: "chấm",
  horizontal: "nét ngang",
  vertical: "nét dọc",
  diagonal: "nét chéo",
  hook: "móc",
  curve: "nét cong"
};

const REF_LABELS = {
  hUpper: "nét ngang trên",
  hLower: "nét ngang dưới",
  hMain: "nét ngang chính",
  vMain: "nét dọc chính",
  mainAxis: "trục chính",
  dot: "chấm"
};

function featureSource(candidate, target) {
  return target === "C"
    ? candidate.regions?.C
    : candidate.regions?.[target];
}

function makeQuestion(id, query, label, concept, cost) {
  return { id, query, label, concept, cost };
}

function collectQuestions(candidates) {
  const questions = new Map();

  const add = q => {
    if (!questions.has(q.id)) questions.set(q.id, q);
  };

  for (const candidate of candidates) {
    for (const target of TARGETS) {
      const source = featureSource(candidate, target);
      if (!source) continue;

      for (const concept of ["enclosure", "connectivity", "crossing"]) {
        const value = source.topology?.[concept];
        if (value === undefined) continue;

        const query = { regions: { [target]: { topology: { [concept]: value } } } };
        add(makeQuestion(
          JSON.stringify(query),
          query,
          concept === "enclosure"
            ? `${TARGET_LABELS[target]} có khép thành khung không?`
            : concept === "connectivity"
              ? `${TARGET_LABELS[target]} có các nét nối liền nhau không?`
              : `${TARGET_LABELS[target]} có nét cắt/xuyên qua nhau không?`,
          concept,
          CONCEPT_COST[concept]
        ));
      }

      for (const concept of ["axis", "curvature", "symmetry", "convergence"]) {
        const value = source.geometry?.[concept];
        if (value === undefined || value === "none") continue;

        const query = { regions: { [target]: { geometry: { [concept]: value } } } };
        const conceptName = concept === "axis"
          ? "trục chính"
          : concept === "symmetry"
            ? "đối xứng"
            : concept === "convergence"
              ? "hội tụ"
              : "độ cong";

        add(makeQuestion(
          JSON.stringify(query),
          query,
          `${TARGET_LABELS[target]} có ${conceptName} ${VALUE_LABELS[value] ?? value}?`,
          concept,
          CONCEPT_COST[concept]
        ));
      }

      for (const strokeType of source.strokeTypes || []) {
        const query = {
          regions: {
            [target]: {
              strokeTypes: [strokeType]
            }
          }
        };

        add(makeQuestion(
          JSON.stringify(query),
          query,
          `${TARGET_LABELS[target]} có ${STROKE_LABELS[strokeType] ?? strokeType} không?`,
          "strokeType",
          CONCEPT_COST.strokeType
        ));
      }

      const boundaryContact = source.content?.boundaryContact;
      if (boundaryContact) {
        const query = {
          regions: {
            [target]: {
              content: { boundaryContact }
            }
          }
        };

        add(makeQuestion(
          JSON.stringify(query),
          query,
          `${TARGET_LABELS[target]}: nét bên trong chạm biên ${VALUE_LABELS[boundaryContact]}?`,
          "boundaryContact",
          CONCEPT_COST.boundaryContact
        ));
      }

      const junction = source.topology?.junction;
      if (Number.isFinite(junction)) {
        for (let threshold = 1; threshold <= junction; threshold += 1) {
          const query = {
            regions: {
              [target]: {
                topology: {
                  junction: { gte: threshold }
                }
              }
            }
          };

          add(makeQuestion(
            JSON.stringify(query),
            query,
            `${TARGET_LABELS[target]} có ít nhất ${threshold} nút giao không?`,
            "junction",
            CONCEPT_COST.junction
          ));
        }
      }

      for (const relation of source.relations || []) {
        const query = {
          relations: [{
            target,
            type: relation.type,
            a: relation.a,
            b: relation.b,
            value: relation.value
          }]
        };

        const a = REF_LABELS[relation.a] ?? relation.a;
        const b = REF_LABELS[relation.b] ?? relation.b;
        const value = VALUE_LABELS[relation.value] ?? relation.value;

        let label = `${TARGET_LABELS[target]}: ${a} so với ${b}: ${value}`;
        if (relation.type === "relativePosition") {
          label = `${TARGET_LABELS[target]}: ${a} nằm ${value} so với ${b}?`;
        }
        if (relation.type === "relativeLength") {
          label = `${TARGET_LABELS[target]}: ${a} ${value} ${b}?`;
        }

        add(makeQuestion(
          JSON.stringify(query),
          query,
          label,
          relation.type,
          CONCEPT_COST[relation.type] ?? 1.20
        ));
      }
    }
  }

  return [...questions.values()];
}

function entropy(probability) {
  if (probability <= 0 || probability >= 1) return 0;
  return -probability * Math.log2(probability)
    - (1 - probability) * Math.log2(1 - probability);
}

function priorityOf(concept) {
  const index = CONCEPT_PRIORITY.indexOf(concept);
  return index === -1 ? 999 : index;
}

function partitionCandidates(candidates, question) {
  const yes = matchSemantic(candidates, question.query);
  const yesSet = new Set(yes.map(candidate => candidate.char));
  const no = candidates.filter(candidate => !yesSet.has(candidate.char));
  return { yes, no };
}

function candidateKey(candidates) {
  return candidates.map(candidate => candidate.char).sort().join("\u0000");
}

function effectiveCost(question, options = {}) {
  return options.costMode === "flat" ? 1 : question.cost;
}

function scoreQuestion(question, candidates, options = {}) {
  const n = candidates.length;
  if (n < 2) return null;

  const { yes, no } = partitionCandidates(candidates, question);
  if (!yes.length || !no.length) return null;

  const yesProbability = yes.length / n;
  const informationGain = entropy(yesProbability);
  const expectedRemaining = Math.max(yes.length, no.length);
  const eliminationRatio = 1 - expectedRemaining / n;
  const recognitionCost = effectiveCost(question, options);
  const score = informationGain / recognitionCost;

  return {
    ...question,
    recognitionCost,
    yesCount: yes.length,
    noCount: no.length,
    candidateCount: n,
    informationGain,
    expectedRemaining,
    eliminationRatio,
    score,
    yesCandidates: yes.map(candidate => candidate.char),
    noCandidates: no.map(candidate => candidate.char)
  };
}

function normalizeLookaheadDepth(value) {
  const depth = Number(value);
  if (!Number.isFinite(depth)) return 1;
  return Math.max(1, Math.floor(depth));
}

function evaluatePlanQuestion(question, candidates, depth, memo, options = {}) {
  const immediate = scoreQuestion(question, candidates, options);
  if (!immediate) return null;

  if (depth <= 1) {
    return {
      ...immediate,
      lookaheadDepth: 1,
      expectedInformationGain: immediate.informationGain,
      expectedCost: immediate.recognitionCost,
      lookaheadScore: immediate.score
    };
  }

  const { yes, no } = partitionCandidates(candidates, question);
  const yesPlan = bestPlan(yes, depth - 1, memo, options);
  const noPlan = bestPlan(no, depth - 1, memo, options);

  const yesProbability = yes.length / candidates.length;
  const noProbability = no.length / candidates.length;

  const expectedInformationGain =
    immediate.informationGain +
    yesProbability * yesPlan.expectedInformationGain +
    noProbability * noPlan.expectedInformationGain;

  const expectedCost =
    immediate.recognitionCost +
    yesProbability * yesPlan.expectedCost +
    noProbability * noPlan.expectedCost;

  return {
    ...immediate,
    lookaheadDepth: depth,
    expectedInformationGain,
    expectedCost,
    lookaheadScore: expectedInformationGain / expectedCost
  };
}

function betterPlan(a, b) {
  if (!b) return a;
  if (a.lookaheadScore !== b.lookaheadScore) {
    return a.lookaheadScore > b.lookaheadScore ? a : b;
  }
  if (a.expectedInformationGain !== b.expectedInformationGain) {
    return a.expectedInformationGain > b.expectedInformationGain ? a : b;
  }
  if (a.expectedCost !== b.expectedCost) {
    return a.expectedCost < b.expectedCost ? a : b;
  }
  if (a.informationGain !== b.informationGain) {
    return a.informationGain > b.informationGain ? a : b;
  }
  if (a.recognitionCost !== b.recognitionCost) {
    return a.recognitionCost < b.recognitionCost ? a : b;
  }
  return priorityOf(a.concept) - priorityOf(b.concept) <= 0 ? a : b;
}

function bestPlan(candidates, depth, memo, options = {}) {
  if (candidates.length < 2 || depth < 1) {
    return {
      question: null,
      expectedInformationGain: 0,
      expectedCost: 0,
      lookaheadScore: 0
    };
  }

  const key = `${options.costMode ?? "flat"}:${depth}: ${candidateKey(candidates)}`;
  if (memo.has(key)) return memo.get(key);

  let best = null;
  for (const question of collectQuestions(candidates)) {
    const scored = evaluatePlanQuestion(question, candidates, depth, memo, options);
    if (!scored) continue;
    best = betterPlan(scored, best);
  }

  const result = best ?? {
    question: null,
    expectedInformationGain: 0,
    expectedCost: 0,
    lookaheadScore: 0
  };

  memo.set(key, result);
  return result;
}

/**
 * Rank questions that can split the current candidate set.
 *
 * With lookaheadDepth=1 this is the original greedy strategy:
 *
 *   score = informationGain / recognitionCost
 *
 * With lookaheadDepth>1, the score becomes:
 *
 *   expectedInformationGain / expectedCost
 *
 * where both values include the best conditional questions in the
 * future branches up to the requested depth.
 */
export function rankAdaptiveQuestions(candidates, options = {}) {
  if (!Array.isArray(candidates) || candidates.length < 2) return [];

  const limit = options.limit ?? 5;
  const lookaheadDepth = normalizeLookaheadDepth(options.lookaheadDepth);
  const costMode = options.costMode ?? "flat";
  const scoringOptions = { costMode };
  const memo = new Map();

  const scored = collectQuestions(candidates)
    .map(question =>
      evaluatePlanQuestion(question, candidates, lookaheadDepth, memo, scoringOptions)
    )
    .filter(Boolean);

  return scored.sort((a, b) =>
    b.lookaheadScore - a.lookaheadScore ||
    b.expectedInformationGain - a.expectedInformationGain ||
    a.expectedCost - b.expectedCost ||
    b.informationGain - a.informationGain ||
    a.cost - b.cost ||
    priorityOf(a.concept) - priorityOf(b.concept) ||
    a.label.localeCompare(b.label)
  ).slice(0, limit);
}

export function chooseNextQuestion(candidates, options = {}) {
  return rankAdaptiveQuestions(candidates, { ...options, limit: 1 })[0] ?? null;
}

export function applyAdaptiveAnswer(candidates, question, answer) {
  if (!question) return [...candidates];

  const matching = matchSemantic(candidates, question.query);
  const matchingSet = new Set(matching.map(candidate => candidate.char));

  return candidates.filter(candidate =>
    answer === true
      ? matchingSet.has(candidate.char)
      : !matchingSet.has(candidate.char)
  );
}

export function adaptiveState(candidates, options = {}) {
  const nextQuestion = chooseNextQuestion(candidates, options);

  return {
    candidateCount: candidates.length,
    candidateCharacters: candidates.map(candidate => candidate.char),
    nextQuestion,
    alternatives: rankAdaptiveQuestions(candidates, {
      ...options,
      limit: options.limit ?? 5
    })
  };
}
