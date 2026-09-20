import { matchSemantic } from "./matcher.js";
import { parseBase } from "./parser.js";
import { relationTokenToSemanticQuery } from "./relation-token.js";

export const QUERY_LANGUAGE_VERSION = "0.9";

function setNested(root, path, value) {
  let current = root;
  for (let i = 0; i < path.length - 1; i += 1) {
    current[path[i]] ??= {};
    current = current[path[i]];
  }
  current[path[path.length - 1]] = value;
  return root;
}

function mergeDeep(base, extra) {
  const output = structuredClone(base || {});

  for (const [key, value] of Object.entries(extra || {})) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      output[key] &&
      typeof output[key] === "object" &&
      !Array.isArray(output[key])
    ) {
      output[key] = mergeDeep(output[key], value);
    } else {
      output[key] = structuredClone(value);
    }
  }

  return output;
}

function numericRefinementToQuery(refinement) {
  const path = refinement.query.path.split(".");

  if (path[0] === "relations" && path[1] === "parallelism") {
    return {
      relations: [{
        target: refinement.target,
        type: "parallelism",
        value: refinement.query.equals === true
      }]
    };
  }

  if (path[0] === "strokeTypes" && refinement.query.contains) {
    return {
      regions: {
        [refinement.target]: {
          strokeTypes: [refinement.query.contains]
        }
      }
    };
  }

  const region = {};
  const condition = {};

  if (refinement.query.operator) {
    condition[refinement.query.operator] = refinement.query.value;
  } else if (refinement.query.equals !== undefined) {
    setNested(region, path, refinement.query.equals);
    return {
      regions: {
        [refinement.target]: region
      }
    };
  } else {
    setNested(region, path, refinement.query.value);
  }

  setNested(region, path, condition);

  return {
    regions: {
      [refinement.target]: region
    }
  };
}

export function numericToSemanticQuery(parsed) {
  if (!parsed) return null;

  const query = {
    form: parsed.form
  };

  if (parsed.form === "SINGLE") {
    query.strokes = parsed.counts[0];
  } else {
    const targets = parsed.form === "LR"
      ? ["L", "R"]
      : parsed.form === "UD"
        ? ["T", "B"]
        : parsed.form === "ENC"
          ? ["O", "I"]
          : null;

    if (targets) {
      query.regions = {};
      targets.forEach((target, index) => {
        query.regions[target] = { strokes: parsed.counts[index] };
      });
    } else {
      query.counts = parsed.counts;
    }
  }

  for (const refinement of parsed.refinements) {
    const next = numericRefinementToQuery(refinement);

    if (next.form) query.form = next.form;
    if (next.strokes !== undefined) query.strokes = next.strokes;

    if (next.regions) {
      query.regions ??= {};
      for (const [target, region] of Object.entries(next.regions)) {
        query.regions[target] = mergeDeep(
          query.regions[target] || {},
          region
        );
      }
    }

    if (next.relations) {
      query.relations ??= [];
      query.relations.push(...next.relations);
    }
  }

  return query;
}

export function mergeSemanticQueries(base, extra) {
  if (!base) return extra ? structuredClone(extra) : null;
  if (!extra) return structuredClone(base);

  const merged = structuredClone(base);

  if (extra.form !== undefined) merged.form = extra.form;
  if (extra.strokes !== undefined) merged.strokes = extra.strokes;

  if (extra.regions) {
    merged.regions ??= {};
    for (const [target, region] of Object.entries(extra.regions)) {
      merged.regions[target] = mergeDeep(
        merged.regions[target] || {},
        region
      );
    }
  }

  if (extra.relations?.length) {
    merged.relations ??= [];
    merged.relations.push(...extra.relations);
  }

  if (extra.not) {
    merged.not = mergeSemanticQueries(merged.not, extra.not);
  }

  return merged;
}

export function parseInputToken(token) {
  const raw = String(token ?? "").trim();
  if (!raw) return null;

  if (/^\d+$/.test(raw)) {
    const parsed = parseBase(raw);
    if (!parsed) return null;
    return {
      kind: "numeric",
      raw,
      parsed,
      query: numericToSemanticQuery(parsed)
    };
  }

  const relationQuery = relationTokenToSemanticQuery(raw);
  if (relationQuery) {
    return {
      kind: "relation",
      raw,
      query: relationQuery
    };
  }

  return null;
}

export function parseInput(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return null;

  const tokens = raw.split(/\s+/).filter(Boolean);
  const parsedTokens = tokens.map(parseInputToken);
  if (parsedTokens.some(token => !token)) return null;

  return {
    raw,
    tokens: parsedTokens,
    query: parsedTokens.reduce(
      (query, token) => mergeSemanticQueries(query, token.query),
      null
    )
  };
}

export function matchInput(characters, input) {
  const parsed = parseInput(input);
  if (!parsed) return [];

  return matchSemantic(characters, parsed.query);
}
