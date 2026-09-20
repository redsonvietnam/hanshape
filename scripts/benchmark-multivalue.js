import { CHARACTER_MODEL } from "../src/character-model.js";
import { ADVERSARIAL_GROUPS } from "../data/adversarial-corpus.js";
import {
  applyAdaptiveAnswer,
  chooseNextQuestion,
  compareObservationPaths
} from "../src/adaptive-matcher.js";
import {
  applyObservationAnswer,
  chooseNextObservation,
  compareMultivalueObservationPaths
} from "../src/multivalue-observation.js";

const group = names =>
  CHARACTER_MODEL.filter(character => names.includes(character.char));

function identifyBinary(candidates, targetChar) {
  let remaining = [...candidates];
  let questions = 0;

  while (remaining.length > 1) {
    const question = chooseNextQuestion(remaining, {
      lookaheadDepth: 1,
      costMode: "flat"
    });

    if (!question) return null;

    const answer = question.yesCandidates.includes(targetChar);
    remaining = applyAdaptiveAnswer(remaining, question, answer);
    questions += 1;
  }

  return remaining.length === 1 && remaining[0].char === targetChar
    ? questions
    : null;
}

function identifyMultivalue(candidates, targetChar) {
  let remaining = [...candidates];
  let questions = 0;

  while (remaining.length > 1) {
    const observation = chooseNextObservation(remaining);
    if (!observation) return null;

    const target = remaining.find(candidate => candidate.char === targetChar);
    if (!target) return null;

    const value = observationValue(target, observation);
    remaining = applyObservationAnswer(remaining, observation, value);
    questions += 1;
  }

  return remaining.length === 1 && remaining[0].char === targetChar
    ? questions
    : null;
}

function observationValue(candidate, observation) {
  const source = observation.target === "C"
    ? candidate.regions?.C
    : candidate.regions?.[observation.target];

  if (!source) return "__missing__";

  if (observation.kind === "region") {
    return observation.path.reduce(
      (value, key) => value?.[key],
      source
    ) ?? "__missing__";
  }

  if (observation.kind === "strokeType") {
    return source.strokeTypes?.includes(observation.path[0]) ?? false;
  }

  if (observation.kind === "relation") {
    const relation = (source.relations || []).find(item =>
      [
        item.type,
        item.a ?? "",
        item.b ?? ""
      ].join("|") === observation.relationKey
    );

    return relation?.value ?? "__missing__";
  }

  return "__missing__";
}

function benchmarkFamily(names, mode = "full") {
  const candidates = group(names);
  const rows = [];

  for (const target of candidates) {
    if (mode === "full") {
      const binary = compareObservationPaths(candidates, target.char);
      const multi = compareMultivalueObservationPaths(candidates, target.char);

      rows.push({
        group: names.join("/"),
        target: target.char,
        binaryGreedy: binary?.greedyQuestions ?? null,
        binaryOptimal: binary?.optimalQuestions ?? null,
        multiGreedy: multi?.greedyQuestions ?? null,
        multiOptimal: multi?.optimalQuestions ?? null,
        multiVsBinary: binary && multi
          ? multi.greedyQuestions - binary.greedyQuestions
          : null
      });
    } else {
      const binaryGreedy = identifyBinary(candidates, target.char);
      const multiGreedy = identifyMultivalue(candidates, target.char);

      rows.push({
        group: names.join("/"),
        target: target.char,
        binaryGreedy,
        multiGreedy,
        multiVsBinary: (
          binaryGreedy !== null &&
          multiGreedy !== null
        )
          ? multiGreedy - binaryGreedy
          : null
      });
    }
  }

  return rows;
}

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



const demand = new Map();

function addDemand(concept, supported) {
  const row = demand.get(concept) ?? {
    concept,
    observations: 0,
    supportedNumeric: 0,
    unsupportedNumeric: 0
  };

  row.observations += 1;
  if (supported) row.supportedNumeric += 1;
  else row.unsupportedNumeric += 1;
  demand.set(concept, row);
}

function observationConcept(observation) {
  if (observation.kind === "relation") {
    return observation.relationKey.split("|")[0];
  }

  if (observation.kind === "strokeType") {
    return "strokeType";
  }

  return observation.path.at(-1);
}

function observationValueForTarget(candidate, observation) {
  const source = observation.target === "C"
    ? candidate.regions?.C
    : candidate.regions?.[observation.target];

  if (!source) return "__missing__";

  if (observation.kind === "region") {
    return observation.path.reduce(
      (value, key) => value?.[key],
      source
    ) ?? "__missing__";
  }

  if (observation.kind === "strokeType") {
    return source.strokeTypes?.includes(observation.path[0]) ?? false;
  }

  const relation = (source.relations || []).find(item =>
    [
      item.type,
      item.a ?? "",
      item.b ?? ""
    ].join("|") === observation.relationKey
  );

  return relation?.value ?? "__missing__";
}

const familyRows = ADVERSARIAL_GROUPS.flatMap(names =>
  benchmarkFamily(names, "full")
);

console.log("HanShape binary vs multi-value observation benchmark");
console.log("====================================================");
console.log("Adversarial families");
console.table(familyRows);
console.log("");

const singles = CHARACTER_MODEL.filter(character => character.form === "SINGLE");
const subsets = combinations(singles, 4);
const subsetRows = [];

for (const candidates of subsets) {
  const names = candidates.map(candidate => candidate.char);

  for (const target of candidates) {
    const binaryGreedy = identifyBinary(candidates, target.char);
    const multiGreedy = identifyMultivalue(candidates, target.char);

    subsetRows.push({
      group: names.join("/"),
      target: target.char,
      binaryGreedy,
      multiGreedy,
      delta: (
        binaryGreedy !== null &&
        multiGreedy !== null
      )
        ? binaryGreedy - multiGreedy
        : null
    });
  }
}

const valid = subsetRows.filter(row =>
  row.binaryGreedy !== null &&
  row.multiGreedy !== null
);

const improved = valid.filter(row => row.delta > 0);
const equal = valid.filter(row => row.delta === 0);
const worsened = valid.filter(row => row.delta < 0);

console.log("All 4-character SINGLE subsets");
console.log("==============================");
console.log(
  `subsets=${subsets.length} targetCases=${subsetRows.length} valid=${valid.length}`
);
console.log(
  `binaryGreedyAvg=${(
    valid.reduce((sum, row) => sum + row.binaryGreedy, 0) / valid.length
  ).toFixed(3)}`
);
console.log(
  `multiGreedyAvg=${(
    valid.reduce((sum, row) => sum + row.multiGreedy, 0) / valid.length
  ).toFixed(3)}`
);
console.log(
  `improved=${improved.length} equal=${equal.length} worsened=${worsened.length}`
);
console.log(
  `maxImprovement=${Math.max(...valid.map(row => row.delta))} maxWorsening=${Math.min(...valid.map(row => row.delta))}`
);

const failures = [
  ...familyRows.filter(row =>
    row.binaryGreedy === null ||
    row.binaryOptimal === null ||
    row.multiGreedy === null ||
    row.multiOptimal === null
  ),
  ...subsetRows.filter(row =>
    row.binaryGreedy === null ||
    row.multiGreedy === null
  )
];

for (const names of ADVERSARIAL_GROUPS) {
  const candidates = group(names);

  for (const target of candidates) {
    const result = compareMultivalueObservationPaths(candidates, target.char);
    if (!result) continue;

    for (const observation of result.multiOptimalPath) {
      const value = observationValueForTarget(target, observation);
      const encoded = encodeObservationValue(observation, value);
      addDemand(observationConcept(observation), encoded.supported);
    }
  }
}

console.log("");
console.log("Multi-value exact-path binding demand");
console.log("=====================================");
console.table(
  [...demand.values()]
    .sort((a, b) =>
      b.observations - a.observations ||
      a.concept.localeCompare(b.concept)
    )
);

if (failures.length > 0) {
  console.error(
    `FAIL: ${failures.length} target cases could not be identified.`
  );
  process.exitCode = 1;
}
