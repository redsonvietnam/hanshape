export const FEATURE_CONCEPTS = {
  enclosure: {
    type: "topology",
    description: "A region forms a closed enclosure or frame."
  },
  axis: {
    type: "geometry",
    values: ["horizontal", "vertical", "diagonal"]
  },
  intersection: {
    type: "topology",
    description: "Strokes cross or intersect."
  },
  branching: {
    type: "topology",
    description: "A stroke structure branches from a junction."
  },
  curvature: {
    type: "geometry",
    description: "Presence or degree of curved/hooked geometry."
  },
  strokeType: {
    type: "primitive",
    values: ["dot", "horizontal", "vertical", "diagonal", "hook", "curve"]
  },
  density: {
    type: "composition",
    values: ["sparse", "medium", "dense"]
  },
  symmetry: {
    type: "geometry",
    values: ["none", "vertical", "horizontal", "radial"]
  },
  parallelism: {
    type: "relation"
  },
  relativePosition: {
    type: "relation",
    values: ["upper", "lower", "left", "right", "center"]
  },
  relativeLength: {
    type: "relation",
    values: ["shorter", "equal", "longer"]
  },
  alignment: {
    type: "relation"
  },
  connectivity: {
    type: "relation",
    values: ["connected", "disconnected"]
  }
};
