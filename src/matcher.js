function getRegionCounts(char, form) {
  if (form === "SINGLE") return [char.regions?.C?.strokes ?? char.strokes];
  if (form === "LR") return [char.regions?.L?.strokes, char.regions?.R?.strokes];
  if (form === "UD") return [char.regions?.T?.strokes, char.regions?.B?.strokes];
  if (form === "ENC") return [char.regions?.O?.strokes, char.regions?.I?.strokes];
  return [];
}

function matchNested(expected, actual) {
  if (expected === undefined) return true;
  if (actual === undefined) return false;
  if (Array.isArray(expected)) return expected.every(value => actual.includes(value));
  if (expected && typeof expected === "object") {
    return Object.entries(expected).every(([key, value]) => matchNested(value, actual?.[key]));
  }
  return actual === expected;
}

function getRegion(char, target) {
  return target === "C" ? char.regions?.C : char.regions?.[target];
}

function evaluateFeature(char, refinement) {
  const source = getRegion(char, refinement.target);
  if (!source) return false;
  const query = refinement.query;

  if (query.path === "strokeTypes" && query.contains) {
    return source.strokeTypes?.includes(query.contains) ?? false;
  }

  if (
    query.path === "relations.parallelism" &&
    query.equals === true
  ) {
    return source.relations?.some(relation =>
      relation.type === "parallelism" &&
      relation.value === true
    ) ?? false;
  }

  const value = query.path.split(".").reduce((v, key) => v?.[key], source);

  if (query.operator === "gt") return Number(value) > query.value;
  if (query.operator === "gte") return Number(value) >= query.value;
  if (query.operator === "contains") return Array.isArray(value) && value.includes(query.value);
  return value === query.equals;
}

export function matchesBase(char, query) {
  if (char.form !== query.form) return false;
  const counts = getRegionCounts(char, query.form);
  return query.counts.every((count, i) => counts[i] === count);
}

export function matchesRefinement(char, refinement) {
  return evaluateFeature(char, refinement);
}

export function matchCharacters(characters, query) {
  return characters.filter(char =>
    matchesBase(char, query) &&
    query.refinements.every(ref => matchesRefinement(char, ref))
  );
}

function matchRelations(char, relations = []) {
  const allRelations = Object.values(char.regions || {}).flatMap(region => region.relations || []);
  return relations.every(query => allRelations.some(actual =>
    actual.type === query.type &&
    (query.a === undefined || actual.a === query.a) &&
    (query.b === undefined || actual.b === query.b) &&
    (query.value === undefined || actual.value === query.value)
  ));
}

export function matchSemantic(characters, query) {
  return characters.filter(char => {
    if (query.form && char.form !== query.form) return false;
    if (query.strokes !== undefined && char.strokes !== query.strokes) return false;

    if (query.regions) {
      for (const [regionId, expected] of Object.entries(query.regions)) {
        const actual = char.regions?.[regionId];
        if (!actual || !matchNested(expected, actual)) return false;
      }
    }

    if (query.relations && !matchRelations(char, query.relations)) return false;

    return true;
  });
}
