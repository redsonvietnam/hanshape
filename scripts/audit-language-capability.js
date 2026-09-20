import { CHARACTER_MODEL } from "../src/character-model.js";
import { EXTENDED_COVERED_MODEL } from "../data/extended-covered-model.js";
import { matchInput, parseInput } from "../src/query.js";
import { FEATURE_CONCEPTS } from "../src/concepts.js";

const LANGUAGE_MODEL = [...CHARACTER_MODEL, ...EXTENDED_COVERED_MODEL];

const FEATURE_PROBES = [
  ["enclosure", "feat(C.topology.enclosure)=true"],
  ["connectivity", "feat(C.topology.connectivity)=disconnected"],
  ["junction", "feat(C.topology.junction)>=3"],
  ["crossing", "feat(C.topology.crossing)=true"],
  ["boundaryContact", "feat(C.content.boundaryContact)=left"],
  ["orientation", "feat(C.geometry.orientation)=vertical"],
  ["axis", "feat(C.geometry.axis)=vertical"],
  ["curvature", "feat(C.geometry.curvature)=curved"],
  ["symmetry", "feat(C.geometry.symmetry)=vertical"],
  ["convergence", "feat(C.geometry.convergence)=upper"],
  ["density", "feat(C.composition.density)=dense"],
  ["repetition", "feat(C.composition.repetition)>=2"],
  ["strokeType", "has(C.strokeTypes,dot)"],
  ["content.strokes", "feat(C.content.strokes)=2"]
];

const RELATION_PROBES = [
  ["relativeLength", "len(C.hUpper,C.hLower)<"],
  ["relativePosition", "pos(C.dot,C.mainAxis)=R"],
  ["parallelism", "rel(C.relation,parallelism)=true"],
  ["alignment", "rel(C.relation,alignment)=aligned"]
];

function probe(concept, token) {
  const parsed = parseInput(token);
  const candidates = parsed ? matchInput(LANGUAGE_MODEL, token) : [];
  return {
    concept,
    token,
    syntax: parsed ? "supported" : "unsupported",
    corpusMatches: candidates.length,
    characters: candidates.map(candidate => candidate.char).join("")
  };
}

console.log("HanShape language capability audit");
console.log("==================================");
console.log(`ontology concepts=${Object.keys(FEATURE_CONCEPTS).length}`);
console.log("");
console.log("Feature probes");
console.table(FEATURE_PROBES.map(([concept, token]) => probe(concept, token)));
console.log("");
console.log("Relation probes");
console.table(RELATION_PROBES.map(([concept, token]) => probe(concept, token)));

const missingSyntax = [
  ...FEATURE_PROBES.map(([concept, token]) => [concept, token]),
  ...RELATION_PROBES.map(([concept, token]) => [concept, token])
].filter(([, token]) => !parseInput(token));

if (missingSyntax.length > 0) {
  console.error("ERROR: one or more declared language probes do not parse.");
  process.exitCode = 1;
}
