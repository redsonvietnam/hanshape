const region = (data) => ({
  strokes: data.strokes,
  topology: {
    enclosure: false,
    connectivity: "connected",
    junction: 0,
    crossing: false,
    ...(data.topology || {})
  },
  geometry: {
    axis: "none",
    curvature: "straight",
    symmetry: "none",
    convergence: "none",
    ...(data.geometry || {})
  },
  strokeTypes: data.strokeTypes || [],
  composition: { density: "medium", ...(data.composition || {}) },
  relations: data.relations || [],
  content: data.content || null
});

const single = (char, pinyin, strokes, C) => ({
  char,
  pinyin,
  form: "SINGLE",
  strokes,
  regions: { C: region({ strokes, ...C }) }
});

/**
 * Experimental additions whose decisive observations are expected
 * to be expressible using already existing ontology concepts.
 */
export const EXTENDED_COVERED_MODEL = [
  single("王", "wáng", 4, {
    topology: { connectivity: "connected", junction: 3 },
    geometry: { axis: "vertical", symmetry: "vertical" },
    strokeTypes: ["horizontal", "vertical"]
  }),
  single("玉", "yù", 5, {
    topology: { connectivity: "disconnected", junction: 3 },
    geometry: { axis: "vertical", symmetry: "vertical" },
    strokeTypes: ["horizontal", "vertical", "dot"],
    relations: [
      { type: "relativePosition", a: "dot", b: "mainAxis", value: "right" }
    ]
  }),
  single("主", "zhǔ", 5, {
    topology: { connectivity: "disconnected", junction: 3 },
    geometry: { axis: "vertical", symmetry: "vertical" },
    strokeTypes: ["horizontal", "vertical", "dot"],
    relations: [
      { type: "relativePosition", a: "dot", b: "mainAxis", value: "center" }
    ]
  }),
  single("生", "shēng", 5, {
    topology: { connectivity: "connected", junction: 2 },
    geometry: { axis: "vertical", symmetry: "vertical" },
    strokeTypes: ["horizontal", "vertical", "diagonal"]
  }),
  single("口", "kǒu", 3, {
    topology: { enclosure: true, junction: 1 },
    geometry: { axis: "vertical", symmetry: "vertical" },
    strokeTypes: ["horizontal", "vertical"],
    content: { strokes: 0, boundaryContact: "none" }
  })
];
