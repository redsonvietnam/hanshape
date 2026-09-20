export const FEATURE_CONCEPTS = {
  form: { type: "structure", valueType: "enum", values: ["SINGLE", "LR", "UD", "ENC", "TRIPLE_H", "TRIPLE_V"] },
  enclosure: { type: "topology", valueType: "boolean" },
  connectivity: { type: "topology", valueType: "enum", values: ["connected", "disconnected"] },
  junction: { type: "topology", valueType: "number" },
  crossing: { type: "topology", valueType: "boolean" },
  boundaryContact: { type: "topology", valueType: "enum", values: ["none", "left", "right", "both"] },
  orientation: { type: "geometry", valueType: "set", values: ["horizontal", "vertical", "diagonal"] },
  axis: { type: "geometry", valueType: "enum", values: ["horizontal", "vertical", "diagonal", "none"] },
  curvature: { type: "geometry", valueType: "enum", values: ["straight", "curved", "mixed"] },
  symmetry: { type: "geometry", valueType: "enum", values: ["none", "vertical", "horizontal", "radial"] },
  convergence: { type: "geometry", valueType: "enum", values: ["upper", "lower", "none"] },
  strokeType: { type: "stroke", valueType: "set", values: ["dot", "horizontal", "vertical", "diagonal", "hook", "curve"] },
  relativePosition: { type: "relation", valueType: "enum" },
  relativeLength: { type: "relation", valueType: "enum", values: ["shorter", "equal", "longer"] },
  parallelism: { type: "relation", valueType: "boolean" },
  alignment: { type: "relation", valueType: "enum", values: ["aligned", "offset"] },
  density: { type: "composition", valueType: "enum", values: ["sparse", "medium", "dense"] },
  repetition: { type: "composition", valueType: "number" }
};

export const DERIVED_FEATURES = {
  verticalAxis: { concept: "axis", value: "vertical" },
  horizontalAxis: { concept: "axis", value: "horizontal" },
  branching: { concept: "junction", operator: "gte", value: 3 },
  hasDot: { concept: "strokeType", value: "dot" },
  isDense: { concept: "density", value: "dense" }
};
