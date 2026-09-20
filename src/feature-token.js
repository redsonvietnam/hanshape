const OPERATORS = new Map([
  ["=", "eq"],
  ["!=", "neq"],
  [">", "gt"],
  [">=", "gte"],
  ["<", "lt"],
  ["<=", "lte"]
]);

function parseTargetRef(ref) {
  const [target, ...path] = String(ref).split(".");
  if (!/^[CRLTBOI]$/.test(target) || path.length === 0) return null;
  return { target, path };
}

function parseLiteral(raw) {
  const value = String(raw).trim();
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
  if (/^[A-Z_]+$/.test(value)) return value.toLowerCase();
  if (/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(value)) return value;
  return null;
}

function nestedRegionQuery(target, path, operator, value) {
  const condition = operator === "eq"
    ? value
    : { [operator]: value };

  let current = condition;
  for (let i = path.length - 1; i >= 0; i -= 1) {
    current = { [path[i]]: current };
  }

  return {
    regions: {
      [target]: current
    }
  };
}

export function parseFeatureToken(token) {
  const raw = String(token ?? "").trim();
  const match = /^feat\(([^\)]+)\)(>=|<=|!=|=|>|<)([^]+)$/.exec(raw);
  if (!match) return null;

  const ref = parseTargetRef(match[1]);
  const operator = OPERATORS.get(match[2]);
  const value = parseLiteral(match[3]);

  if (!ref || !operator || value === null) return null;

  return {
    kind: "feature",
    raw,
    target: ref.target,
    path: ref.path,
    operator,
    value
  };
}

export function featureTokenToSemanticQuery(token) {
  const parsed = typeof token === "string"
    ? parseFeatureToken(token)
    : token;

  if (!parsed) return null;

  return nestedRegionQuery(
    parsed.target,
    parsed.path,
    parsed.operator,
    parsed.value
  );
}

export function featureTokenFromParts(target, path, operator, value) {
  const symbol = [...OPERATORS.entries()]
    .find(([, mapped]) => mapped === operator)?.[0];
  if (!symbol) return null;

  const literal = typeof value === "string" && /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(value)
    ? value
    : String(value);

  return "feat(" + target + "." + path.join(".") + ")" + symbol + literal;
}

function nestedHasQuery(target, path, value) {
  let current = [value];
  for (let i = path.length - 1; i >= 0; i -= 1) {
    current = { [path[i]]: current };
  }

  return {
    regions: {
      [target]: current
    }
  };
}

export function parseHasToken(token) {
  const raw = String(token ?? "").trim();
  const match = /^has\(([^,]+),([^\)]+)\)(?:=(true|false))?$/.exec(raw);
  if (!match) return null;

  const ref = parseTargetRef(match[1]);
  const value = parseLiteral(match[2]);
  if (!ref || value === null) return null;

  return {
    kind: "has",
    raw,
    target: ref.target,
    path: ref.path,
    value,
    expected: match[3] === undefined ? true : match[3] === "true"
  };
}

export function hasTokenToSemanticQuery(token) {
  const parsed = typeof token === "string"
    ? parseHasToken(token)
    : token;

  if (!parsed) return null;

  const positive = nestedHasQuery(parsed.target, parsed.path, parsed.value);
  return parsed.expected ? positive : { not: positive };
}

export function hasTokenFromParts(target, path, value, expected = true) {
  const literal = typeof value === "string" && /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(value)
    ? value
    : String(value);
  return "has(" + target + "." + path.join(".") + "," + literal + ")=" + String(expected);
}
