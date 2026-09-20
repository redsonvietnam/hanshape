const LENGTH_VALUES = {
  "<": "shorter",
  "=": "equal",
  ">": "longer"
};

const POSITION_VALUES = {
  L: "left",
  R: "right",
  U: "upper",
  D: "lower",
  C: "center"
};

const CONTACT_VALUES = new Set(["NONE", "LEFT", "RIGHT", "BOTH"]);

function parseRef(ref) {
  const [target, name] = String(ref).split(".");
  if (!target || !name || !/^[CRLTBOI]$/.test(target)) return null;
  return { target, name };
}

export function parseRelationToken(token) {
  const raw = String(token ?? "").trim();

  let match = /^len\(([^,]+),([^\)]+)\)([<=>])$/.exec(raw);
  if (match) {
    const a = parseRef(match[1]);
    const b = parseRef(match[2]);
    if (!a || !b || a.target !== b.target) return null;

    return {
      type: "relativeLength",
      target: a.target,
      a: a.name,
      b: b.name,
      value: LENGTH_VALUES[match[3]]
    };
  }

  match = /^pos\(([^,]+),([^\)]+)\)=([LRUDC])$/.exec(raw);
  if (match) {
    const a = parseRef(match[1]);
    const b = parseRef(match[2]);
    if (!a || !b || a.target !== b.target) return null;

    return {
      type: "relativePosition",
      target: a.target,
      a: a.name,
      b: b.name,
      value: POSITION_VALUES[match[3]]
    };
  }

  match = /^contact\(([^\)]+)\)=([A-Z]+)$/.exec(raw);
  if (match) {
    const ref = parseRef(match[1]);
    if (!ref || ref.name !== "content" || !CONTACT_VALUES.has(match[2])) return null;

    return {
      type: "boundaryContact",
      target: ref.target,
      path: ["content", "boundaryContact"],
      value: match[2].toLowerCase()
    };
  }

  return null;
}

export function relationTokenToSemanticQuery(token) {
  const relation = parseRelationToken(token);
  if (!relation) return null;

  if (relation.type === "relativeLength" || relation.type === "relativePosition") {
    return {
      relations: [{
        target: relation.target,
        type: relation.type,
        a: relation.a,
        b: relation.b,
        value: relation.value
      }]
    };
  }

  return {
    regions: {
      [relation.target]: {
        content: {
          boundaryContact: relation.value
        }
      }
    }
  };
}

function requireTarget(target) {
  if (!target || !/^[CRLTBOI]$/.test(target)) {
    throw new Error("Invalid relation target");
  }
  return target;
}

export function semanticRelationToToken(relation) {
  if (!relation) return null;

  if (
    relation.type === "relativeLength" &&
    relation.target &&
    relation.a &&
    relation.b
  ) {
    const operator = Object.entries(LENGTH_VALUES)
      .find(([, value]) => value === relation.value)?.[0];

    if (!operator) return null;

    const target = requireTarget(relation.target);
    return "len(" + target + "." + relation.a + "," +
      target + "." + relation.b + ")" + operator;
  }

  if (
    relation.type === "relativePosition" &&
    relation.target &&
    relation.a &&
    relation.b
  ) {
    const value = Object.entries(POSITION_VALUES)
      .find(([, mapped]) => mapped === relation.value)?.[0];

    if (!value) return null;

    const target = requireTarget(relation.target);
    return "pos(" + target + "." + relation.a + "," +
      target + "." + relation.b + ")=" + value;
  }

  if (
    relation.type === "boundaryContact" &&
    relation.path?.length === 2 &&
    relation.path[0] === "content" &&
    relation.path[1] === "boundaryContact" &&
    relation.target
  ) {
    const value = String(relation.value ?? "").toUpperCase();
    if (!CONTACT_VALUES.has(value)) return null;

    const target = requireTarget(relation.target);
    return "contact(" + target + ".content)=" + value;
  }

  return null;
}

function relationQueryFromParts(target, type, value, a, b) {
  return {
    relations: [{
      target,
      type,
      ...(a ? { a } : {}),
      ...(b ? { b } : {}),
      value
    }]
  };
}

export function parseGenericRelationToken(token) {
  const raw = String(token ?? "").trim();
  const match = /^rel\(([^,]+),([^\)]+)\)(?:=)([^]+)$/.exec(raw);
  if (!match) return null;

  const ref = parseRef(match[1]);
  const type = match[2].trim();
  const valueRaw = match[3].trim();
  const value = valueRaw === "true"
    ? true
    : valueRaw === "false"
      ? false
      : /^[A-Z_]+$/.test(valueRaw)
        ? valueRaw.toLowerCase()
        : valueRaw;

  if (!ref || !type || value === "") return null;

  return {
    kind: "generic-relation",
    raw,
    target: ref.target,
    type,
    path: ref.name,
    value
  };
}

export function genericRelationTokenToSemanticQuery(token) {
  const parsed = typeof token === "string"
    ? parseGenericRelationToken(token)
    : token;
  if (!parsed) return null;

  return relationQueryFromParts(
    parsed.target,
    parsed.type,
    parsed.value
  );
}

export function genericRelationTokenFromParts(target, type, value) {
  const literal = typeof value === "string"
    ? value
    : String(value);
  return "rel(" + target + ".relation," + type + ")=" + literal;
}
