const TARGET_DIGIT_BY_ID = {
  C: "5",
  L: "4",
  R: "6",
  T: "8",
  B: "2"
};

const FEATURE_BINDINGS = [
  {
    digit: "0",
    kind: "topology",
    path: ["enclosure"],
    value: true
  },
  {
    digit: "1",
    kind: "geometry",
    path: ["axis"],
    value: "vertical"
  },
  {
    digit: "2",
    kind: "geometry",
    path: ["axis"],
    value: "horizontal"
  },
  {
    digit: "3",
    kind: "topology",
    path: ["junction"],
    operator: "gte",
    value: 1
  },
  {
    digit: "4",
    kind: "topology",
    path: ["junction"],
    operator: "gte",
    value: 3
  },
  {
    digit: "5",
    kind: "relations",
    path: ["parallelism"],
    value: true
  },
  {
    digit: "6",
    kind: "strokeTypes",
    path: ["dot"],
    value: true
  },
  {
    digit: "7",
    kind: "geometry",
    path: ["curvature"],
    value: "curved"
  },
  {
    digit: "8",
    kind: "topology",
    path: ["crossing"],
    value: true
  },
  {
    digit: "9",
    kind: "composition",
    path: ["density"],
    value: "dense"
  }
];

function exactKeys(object) {
  return Object.keys(object).sort();
}

function equalPrimitiveObject(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function classifyRegionFeature(expected) {
  const regionKeys = exactKeys(expected);

  if (regionKeys.length === 1 && regionKeys[0] === "topology") {
    const topology = expected.topology;
    const keys = exactKeys(topology);

    if (
      keys.length === 1 &&
      keys[0] === "enclosure" &&
      topology.enclosure === true
    ) {
      return { digit: "0", concept: "enclosure" };
    }

    if (
      keys.length === 1 &&
      keys[0] === "junction" &&
      topology.junction &&
      typeof topology.junction === "object" &&
      topology.junction.gte === 1
    ) {
      return { digit: "3", concept: "junction" };
    }

    if (
      keys.length === 1 &&
      keys[0] === "junction" &&
      topology.junction &&
      typeof topology.junction === "object" &&
      topology.junction.gte === 3
    ) {
      return { digit: "4", concept: "junction" };
    }

    if (
      keys.length === 1 &&
      keys[0] === "crossing" &&
      topology.crossing === true
    ) {
      return { digit: "8", concept: "crossing" };
    }

    return null;
  }

  if (regionKeys.length === 1 && regionKeys[0] === "geometry") {
    const geometry = expected.geometry;
    const keys = exactKeys(geometry);

    if (
      keys.length === 1 &&
      keys[0] === "axis" &&
      (geometry.axis === "vertical" || geometry.axis === "horizontal")
    ) {
      return {
        digit: geometry.axis === "vertical" ? "1" : "2",
        concept: "axis"
      };
    }

    if (
      keys.length === 1 &&
      keys[0] === "curvature" &&
      geometry.curvature === "curved"
    ) {
      return { digit: "7", concept: "curvature" };
    }

    return null;
  }

  if (regionKeys.length === 1 && regionKeys[0] === "strokeTypes") {
    const values = expected.strokeTypes;
    if (Array.isArray(values) && values.length === 1 && values[0] === "dot") {
      return { digit: "6", concept: "strokeType" };
    }
    return null;
  }

  if (regionKeys.length === 1 && regionKeys[0] === "composition") {
    const composition = expected.composition;
    const keys = exactKeys(composition);
    if (
      keys.length === 1 &&
      keys[0] === "density" &&
      composition.density === "dense"
    ) {
      return { digit: "9", concept: "density" };
    }
    return null;
  }

  return null;
}

/**
 * Convert one semantic adaptive question into the compact numeric
 * refinement segment, when an exact digit binding exists.
 *
 * The numeric grammar intentionally refuses lossy conversions.
 */
export function encodeSemanticQuestion(question) {
  if (!question?.query) {
    return {
      supported: false,
      reason: "missing-query"
    };
  }

  const query = question.query;

  if (Array.isArray(query.relations) && query.relations.length > 0) {
    return {
      supported: false,
      reason: "relation-not-bound",
      concept: query.relations[0].type
    };
  }

  const regions = query.regions;
  if (!regions || Object.keys(regions).length !== 1) {
    return {
      supported: false,
      reason: "multi-region-or-non-region-query"
    };
  }

  const [[target, expected]] = Object.entries(regions);
  const targetDigit = TARGET_DIGIT_BY_ID[target];
  if (!targetDigit) {
    return {
      supported: false,
      reason: "target-not-bound",
      target
    };
  }

  const feature = classifyRegionFeature(expected);
  if (!feature) {
    const topKeys = exactKeys(expected);
    if (topKeys.includes("content")) {
      return {
        supported: false,
        reason: "content-feature-not-bound"
      };
    }

    return {
      supported: false,
      reason: "feature-not-bound"
    };
  }

  return {
    supported: true,
    code: `0${targetDigit}${feature.digit}`,
    target,
    featureDigit: feature.digit,
    concept: feature.concept
  };
}

export function encodeObservationPath(path = []) {
  const encoded = path.map(encodeSemanticQuestion);
  const supported = encoded.filter(item => item.supported);
  const unsupported = encoded.filter(item => !item.supported);

  return {
    total: encoded.length,
    supported: supported.length,
    unsupported: unsupported.length,
    coverage: encoded.length === 0 ? 1 : supported.length / encoded.length,
    encoded,
    unsupportedReasons: [...new Set(unsupported.map(item => item.reason))]
  };
}
