import { FEATURE_CONCEPTS } from "./concepts.js";
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

function addScalarQuestions(list, target, pathBase, values, labelBase, concept, cost) {
  for (const value of values) {
    const query = {
      regions: {
        [target]: {
          [pathBase]: value
        }
      }
    };

    list.push(makeQuestion(
      JSON.stringify(query),
      query,
      `${labelBase}: ${VALUE_LABELS[value] ?? value}`,
      concept,
      cost
    ));
  }
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

      // Topology: boolean / enum concepts.
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

      // Geometry.
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

      // Stroke type presence.
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

      // Boundary contact is a semantic primitive used for enclosed content.
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

      // Junction: generate thresholds only where they can differ.
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

      // Relations are already semantic and can be queried directly.
      for (const relation of source.relations || []) {
        const query = {
          relations: [{
            type: relation.type,
            a: relation.a,
            b: relation.b,
            value: relation.value
          }]
        };

        const a = REF_LABELS[relation.a] ?? relation.a;
        const b = REF_LABELS[relation.b] ?? relation.b;
        const value = VALUE_LABELS[relation.value] ?? relation.value;

        let label = `${a} so với ${b}: ${value}`;
        if (relation.type === "relativePosition") label = `${a} nằm ${value} so với ${b}?`;
        if (relation.type === "relativeLength") label = `${a} ${value} ${b}?`;

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

function scoreQuestion(question, candidates) {
  const n = candidates.length;
  if (n < 2) return null;

  const yes = matchSemantic(candidates, question.query);
  const yesSet = new Set(yes.map(candidate => candidate.char));
  const no = candidates.filter(candidate => !yesSet.has(candidate.char));

  if (!yes.length || !no.length) return null;

  const yesProbability = yes.length / n;
  const informationGain = entropy(yesProbability);
  const expectedRemaining = Math.max(yes.length, no.length);
  const eliminationRatio = 1 - expectedRemaining / n;

  // Information gain is primary. Cost only breaks ties / near-ties.
  const score = informationGain / question.cost;

  return {
    ...question,
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

/**
 * Rank questions that can split the current candidate set.
 *
 * This is a greedy, one-step adaptive strategy:
 * choose the observable predicate with the highest information gain
 * relative to its recognition cost.
 */
export function rankAdaptiveQuestions(candidates, options = {}) {
  if (!Array.isArray(candidates) || candidates.length < 2) return [];

  const limit = options.limit ?? 5;
  const scored = collectQuestions(candidates)
    .map(question => scoreQuestion(question, candidates))
    .filter(Boolean);

  return scored.sort((a, b) =>
    b.score - a.score ||
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
