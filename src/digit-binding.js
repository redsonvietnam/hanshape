// Digits are UI/input bindings only.
// They are intentionally separate from FEATURE_CONCEPTS.

export const DIGIT_BINDING = {
  0: { namespace: "operator", value: "REFINE" },

  // Feature bindings inherited from the v0.5 prototype.
  // These may change without changing the ontology.
  1: { namespace: "feature", value: "axis.vertical" },
  2: { namespace: "feature", value: "axis.horizontal" },
  3: { namespace: "feature", value: "intersection" },
  4: { namespace: "feature", value: "branching" },
  5: { namespace: "feature", value: "parallelism" },
  6: { namespace: "feature", value: "strokeType.dot" },
  7: { namespace: "feature", value: "curvature" },
  8: { namespace: "feature", value: "connectivity.passThrough" },
  9: { namespace: "feature", value: "density.dense" }
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
