const region = (data) => ({
  strokes: data.strokes,
  topology: { enclosure: false, connectivity: "connected", junction: 0, crossing: false, ...(data.topology || {}) },
  geometry: { axis: "none", curvature: "straight", symmetry: "none", convergence: "none", ...(data.geometry || {}) },
  strokeTypes: data.strokeTypes || [],
  composition: { density: "medium", ...(data.composition || {}) },
  relations: data.relations || [],
  content: data.content || null
});

const single = (char, pinyin, strokes, C) => ({
  char, pinyin, form: "SINGLE", strokes, regions: { C: region({ strokes, ...C }) }
});

export const CHARACTER_MODEL = [
  single("木", "mù", 4, { topology: { connectivity: "connected", junction: 1 }, geometry: { axis: "vertical", symmetry: "vertical" }, strokeTypes: ["horizontal", "vertical", "diagonal"] }),
  single("本", "běn", 5, { topology: { connectivity: "connected", junction: 1 }, geometry: { axis: "vertical", symmetry: "vertical" }, strokeTypes: ["horizontal", "vertical", "diagonal"], relations: [
    { type: "relativePosition", a: "hLower", b: "vMain", value: "lower" },
    { type: "relativeLength", a: "hLower", b: "hMain", value: "shorter" }
  ]}),
  single("未", "wèi", 5, { topology: { connectivity: "connected", junction: 1 }, geometry: { axis: "vertical", symmetry: "vertical" }, strokeTypes: ["horizontal", "vertical", "diagonal"], relations: [{ type: "relativeLength", a: "hUpper", b: "hLower", value: "shorter" }] }),
  single("末", "mò", 5, { topology: { connectivity: "connected", junction: 1 }, geometry: { axis: "vertical", symmetry: "vertical" }, strokeTypes: ["horizontal", "vertical", "diagonal"], relations: [{ type: "relativeLength", a: "hUpper", b: "hLower", value: "longer" }] }),

  single("人", "rén", 2, { topology: { connectivity: "connected", junction: 1 }, geometry: { axis: "none", symmetry: "vertical", convergence: "upper" }, strokeTypes: ["diagonal"] }),
  single("入", "rù", 2, { topology: { connectivity: "connected", junction: 1 }, geometry: { axis: "none", symmetry: "none", convergence: "lower" }, strokeTypes: ["diagonal"] }),
  single("八", "bā", 2, { topology: { connectivity: "disconnected", junction: 0 }, geometry: { axis: "none", symmetry: "vertical", convergence: "none" }, strokeTypes: ["diagonal"] }),

  single("日", "rì", 4, { topology: { enclosure: true, junction: 2 }, geometry: { axis: "vertical", symmetry: "vertical" }, strokeTypes: ["horizontal", "vertical"], content: { strokes: 1, boundaryContact: "both" } }),
  single("曰", "yuē", 4, { topology: { enclosure: true, junction: 2 }, geometry: { axis: "vertical", symmetry: "vertical" }, strokeTypes: ["horizontal", "vertical"], content: { strokes: 1, boundaryContact: "left" } }),
  single("目", "mù", 5, { topology: { enclosure: true, junction: 3 }, geometry: { axis: "vertical", symmetry: "vertical" }, strokeTypes: ["horizontal", "vertical"], content: { strokes: 2, boundaryContact: "none" } }),

  single("土", "tǔ", 3, { topology: { connectivity: "connected", junction: 1 }, geometry: { axis: "vertical" }, strokeTypes: ["horizontal", "vertical"], relations: [{ type: "relativeLength", a: "hLower", b: "hUpper", value: "longer" }] }),
  single("士", "shì", 3, { topology: { connectivity: "connected", junction: 1 }, geometry: { axis: "vertical" }, strokeTypes: ["horizontal", "vertical"], relations: [{ type: "relativeLength", a: "hLower", b: "hUpper", value: "shorter" }] }),

  single("大", "dà", 3, { topology: { connectivity: "connected", junction: 1 }, geometry: { symmetry: "vertical", convergence: "upper" }, strokeTypes: ["horizontal", "diagonal"] }),
  single("太", "tài", 4, { topology: { connectivity: "connected", junction: 1 }, geometry: { symmetry: "vertical", convergence: "upper" }, strokeTypes: ["horizontal", "diagonal", "dot"] }),
  single("犬", "quǎn", 4, { topology: { connectivity: "connected", junction: 1 }, geometry: { symmetry: "none", convergence: "upper" }, strokeTypes: ["horizontal", "diagonal", "dot"], relations: [{ type: "relativePosition", a: "dot", b: "mainAxis", value: "right" }] }),

  {
    char: "明", pinyin: "míng", form: "LR",
    regions: {
      L: region({ strokes: 4, topology: { enclosure: true, junction: 2 }, geometry: { axis: "vertical", symmetry: "vertical" }, strokeTypes: ["horizontal", "vertical"] }),
      R: region({ strokes: 4, topology: { enclosure: false, junction: 1 }, geometry: { axis: "vertical", symmetry: "vertical" }, strokeTypes: ["horizontal", "vertical"] })
    }
  },
  {
    char: "林", pinyin: "lín", form: "LR",
    regions: {
      L: region({ strokes: 4, topology: { enclosure: false, junction: 1 }, geometry: { axis: "vertical", symmetry: "vertical" }, strokeTypes: ["horizontal", "vertical", "diagonal"] }),
      R: region({ strokes: 4, topology: { enclosure: false, junction: 1 }, geometry: { axis: "vertical", symmetry: "vertical" }, strokeTypes: ["horizontal", "vertical", "diagonal"] })
    }
  },
  {
    char: "朋", pinyin: "péng", form: "LR",
    regions: {
      L: region({ strokes: 4, topology: { enclosure: false, junction: 2 }, geometry: { axis: "vertical", symmetry: "vertical" }, strokeTypes: ["horizontal", "vertical"], content: { strokes: 2, boundaryContact: "left" } }),
      R: region({ strokes: 4, topology: { enclosure: false, junction: 2 }, geometry: { axis: "vertical", symmetry: "vertical" }, strokeTypes: ["horizontal", "vertical"], content: { strokes: 2, boundaryContact: "left" } })
    }
  },
  {
    char: "服", pinyin: "fú", form: "LR",
    regions: {
      L: region({ strokes: 4, topology: { enclosure: false, junction: 1 }, geometry: { axis: "vertical", symmetry: "none" }, strokeTypes: ["horizontal", "vertical"] }),
      R: region({ strokes: 4, topology: { enclosure: false, junction: 1 }, geometry: { axis: "none", symmetry: "none", curvature: "mixed" }, strokeTypes: ["horizontal", "vertical", "diagonal", "hook"] })
    }
  }
];
