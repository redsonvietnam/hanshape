function getRegionCounts(char, form) {
  if (form === "SINGLE") return [char.strokes];
  if (form === "LR") return [char.regions?.L?.strokes, char.regions?.R?.strokes];
  if (form === "UD") return [char.regions?.T?.strokes, char.regions?.B?.strokes];
  if (form === "ENC") return [char.regions?.O?.strokes, char.regions?.I?.strokes];
  return [];
}

function getFeatureValue(char, target, concept) {
  const source = target === "C"
    ? char.geometry || {}
    : char.regions?.[target] || {};

  const aliases = {
    "axis.vertical": "axis",
    "axis.horizontal": "axis",
    "intersection": "intersection",
    "branching": "branching",
    "parallelism": "parallelism",
    "curvature": "curvature",
    "connectivity.passThrough": "connectivity"
  };

  const key = aliases[concept];
  if (!key) return undefined;

  if (concept === "axis.vertical") return source.axis === "vertical";
  if (concept === "axis.horizontal") return source.axis === "horizontal";
  return source[key];
}

export function matchesBase(char, query) {
  if (char.form !== query.form) return false;

  const counts = getRegionCounts(char, query.form);
  return query.counts.every((count, i) => counts[i] === count);
}

export function matchesRefinement(char, refinement) {
  const value = getFeatureValue(char, refinement.target, refinement.concept);
  return value === true || value === refinement.concept || Boolean(value);
}

export function matchCharacters(characters, query) {
  return characters.filter(char =>
    matchesBase(char, query) &&
    query.refinements.every(ref => matchesRefinement(char, ref))
  );
}

// Semantic matcher for concepts not yet assigned to digits.
// This is the important separation between ontology and keyboard binding.
export function matchSemantic(characters, query) {
  return characters.filter(char => {
    if (query.form && char.form !== query.form) return false;
    if (query.strokes !== undefined && char.strokes !== query.strokes) return false;

    if (query.geometry) {
      for (const [key, expected] of Object.entries(query.geometry)) {
        if (char.geometry?.[key] !== expected) return false;
      }
    }

    if (query.regions) {
      for (const [region, expected] of Object.entries(query.regions)) {
        for (const [key, value] of Object.entries(expected)) {
          if (char.regions?.[region]?.[key] !== value) return false;
        }
      }
    }

    return true;
  });
}
