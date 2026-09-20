// Numeric namespaces are resolved by parser context.
// 0 may be an operator at the start of a refinement segment
// and a feature digit at the end of that same segment.

export const OPERATOR_DIGIT_BINDING = {
  0: { namespace: "operator", operator: "REFINE" }
};

export const FEATURE_DIGIT_BINDING = {
  0: { namespace: "feature", query: { path: "topology.enclosure", equals: true } },
  1: { namespace: "feature", query: { path: "geometry.axis", equals: "vertical" } },
  2: { namespace: "feature", query: { path: "geometry.axis", equals: "horizontal" } },
  3: { namespace: "feature", query: { path: "topology.junction", operator: "gt", value: 0 } },
  4: { namespace: "feature", query: { path: "topology.junction", operator: "gte", value: 3 } },
  5: { namespace: "feature", query: { path: "relations.parallelism", equals: true } },
  6: { namespace: "feature", query: { path: "strokeTypes", contains: "dot" } },
  7: { namespace: "feature", query: { path: "geometry.curvature", equals: "curved" } },
  8: { namespace: "feature", query: { path: "topology.crossing", equals: true } },
  9: { namespace: "feature", query: { path: "composition.density", equals: "dense" } }
};

export const FORM_DIGIT_BINDING = {
  8: "LR",
  2: "UD",
  5: "ENC",
  3: "SINGLE",
  6: "TRIPLE_H",
  9: "TRIPLE_V"
};

export const TARGET_DIGIT_BINDING = {
  4: "L",
  6: "R",
  8: "T",
  2: "B",
  5: "C"
};
