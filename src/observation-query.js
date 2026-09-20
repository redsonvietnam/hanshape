function setNested(root, path, value) {
  let current = root;
  for (let i = 0; i < path.length - 1; i += 1) {
    current[path[i]] = {};
    current = current[path[i]];
  }
  current[path[path.length - 1]] = value;
  return root;
}

export function observationToSemanticQuery(observation, value) {
  if (!observation) return null;

  if (observation.kind === "region") {
    if (value === "__missing__") return null;

    const query = {
      regions: {
        [observation.target]: {}
      }
    };

    setNested(query.regions[observation.target], observation.path, value);
    return query;
  }

  if (observation.kind === "strokeType") {
    if (typeof value !== "boolean") return null;

    const region = observation.target;
    const positive = {
      regions: { [region]: { strokeTypes: [observation.path[0]] } }
    };

    return value ? positive : { not: positive };
  }

  if (observation.kind === "relation") {
    if (value === "__missing__") return null;

    const [type, a, b] = observation.relationKey.split("|");
    return {
      relations: [{
        target: observation.target,
        type,
        a: a || undefined,
        b: b || undefined,
        value
      }]
    };
  }

  return null;
}
