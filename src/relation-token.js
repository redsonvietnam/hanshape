const LENGTH_VALUES = {\n  "<": "shorter",\n  "=": "equal",\n  ">": "longer"\n};\n\nconst POSITION_VALUES = {\n  L: "left",\n  R: "right",\n  U: "upper",\n  D: "lower",\n  C: "center"\n};\n\nconst CONTACT_VALUES = new Set(["NONE", "LEFT", "RIGHT", "BOTH"]);\n\nfunction parseRef(ref) {\n  const [target, name] = String(ref).split(".");\n  if (!target || !name || !/^[CRLTBOI]$/.test(target)) return null;\n  return { target, name };\n}\n\nexport function parseRelationToken(token) {\n  const raw = String(token ?? "").trim();\n\n  let match = /^len\\(([^,]+),([^\\)]+)\\)([<=>])$/.exec(raw);\n  if (match) {\n    const a = parseRef(match[1]);\n    const b = parseRef(match[2]);\n    if (!a || !b || a.target !== b.target) return null;\n\n    return {\n      type: "relativeLength",\n      target: a.target,\n      a: a.name,\n      b: b.name,\n      value: LENGTH_VALUES[match[3]]\n    };\n  }\n\n  match = /^pos\\(([^,]+),([^\\)]+)\\)=([LRUDC])$/.exec(raw);\n  if (match) {\n    const a = parseRef(match[1]);\n    const b = parseRef(match[2]);\n    if (!a || !b || a.target !== b.target) return null;\n\n    return {\n      type: "relativePosition",\n      target: a.target,\n      a: a.name,\n      b: b.name,\n      value: POSITION_VALUES[match[3]]\n    };\n  }\n\n  match = /^contact\\(([^\\)]+)\\)=([A-Z]+)$/.exec(raw);\n  if (match) {\n    const ref = parseRef(match[1]);\n    if (!ref || ref.name !== "content" || !CONTACT_VALUES.has(match[2])) return null;\n\n    return {\n      target: ref.target,\n      path: ["content", "boundaryContact"],\n      value: match[2].toLowerCase()\n    };\n  }\n\n  return null;\n}\n\nexport function relationTokenToSemanticQuery(token) {\n  const relation = parseRelationToken(token);\n  if (!relation) return null;\n\n  if (relation.type === "relativeLength" || relation.type === "relativePosition") {\n    return {\n      relations: [{\n        target: relation.target,\n        type: relation.type,\n        a: relation.a,\n        b: relation.b,\n        value: relation.value\n      }]\n    };\n  }\n\n  return {\n    regions: {\n      [relation.target]: {\n        content: {\n          boundaryContact: relation.value\n        }\n      }\n    }\n  };\n}\n
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
