// v0.6 semantic character model.
// Data is deliberately expressed in concepts rather than feature digits.

export const CHARACTER_MODEL = [
  // Group 1: 木 本 未 末
  {
    char: "木",
    pinyin: "mù",
    form: "SINGLE",
    strokes: 4,
    regions: { C: { strokes: 4 } },
    geometry: {
      vertical: "center",
      lowerHorizontal: false,
      upperHorizontal: false
    }
  },
  {
    char: "本",
    pinyin: "běn",
    form: "SINGLE",
    strokes: 5,
    regions: { C: { strokes: 5 } },
    geometry: {
      vertical: "center",
      lowerHorizontal: true
    }
  },
  {
    char: "未",
    pinyin: "wèi",
    form: "SINGLE",
    strokes: 5,
    regions: { C: { strokes: 5 } },
    geometry: {
      vertical: "center",
      upperHorizontal: "longer",
      lowerHorizontal: "shorter"
    }
  },
  {
    char: "末",
    pinyin: "mò",
    form: "SINGLE",
    strokes: 5,
    regions: { C: { strokes: 5 } },
    geometry: {
      vertical: "center",
      upperHorizontal: "shorter",
      lowerHorizontal: "longer"
    }
  },

  // Group 2: 人 入 八
  {
    char: "人",
    pinyin: "rén",
    form: "SINGLE",
    strokes: 2,
    regions: { C: { strokes: 2 } },
    geometry: { symmetry: "none", apex: "upper-center" }
  },
  {
    char: "入",
    pinyin: "rù",
    form: "SINGLE",
    strokes: 2,
    regions: { C: { strokes: 2 } },
    geometry: { symmetry: "none", apex: "lower-center" }
  },
  {
    char: "八",
    pinyin: "bā",
    form: "SINGLE",
    strokes: 2,
    regions: { C: { strokes: 2 } },
    geometry: { symmetry: "vertical", apex: "upper-center" }
  },

  // Group 3: 日 曰 目
  {
    char: "日",
    pinyin: "rì",
    form: "SINGLE",
    strokes: 4,
    regions: { C: { strokes: 4, enclosure: true } },
    geometry: { innerHorizontal: 1 }
  },
  {
    char: "曰",
    pinyin: "yuē",
    form: "SINGLE",
    strokes: 4,
    regions: { C: { strokes: 4, enclosure: true } },
    geometry: { innerHorizontal: 0 }
  },
  {
    char: "目",
    pinyin: "mù",
    form: "SINGLE",
    strokes: 5,
    regions: { C: { strokes: 5, enclosure: true } },
    geometry: { innerHorizontal: 2 }
  },

  // Group 4: 土 士
  {
    char: "土",
    pinyin: "tǔ",
    form: "SINGLE",
    strokes: 3,
    regions: { C: { strokes: 3 } },
    geometry: { horizontalPosition: "lower" }
  },
  {
    char: "士",
    pinyin: "shì",
    form: "SINGLE",
    strokes: 3,
    regions: { C: { strokes: 3 } },
    geometry: { horizontalPosition: "upper" }
  },

  // Group 5: 大 太 犬
  {
    char: "大",
    pinyin: "dà",
    form: "SINGLE",
    strokes: 3,
    regions: { C: { strokes: 3 } },
    geometry: { dot: false, branching: true }
  },
  {
    char: "太",
    pinyin: "tài",
    form: "SINGLE",
    strokes: 4,
    regions: { C: { strokes: 4 } },
    geometry: { dot: true, branching: true }
  },
  {
    char: "犬",
    pinyin: "quǎn",
    form: "SINGLE",
    strokes: 4,
    regions: { C: { strokes: 4 } },
    geometry: { dot: true, branching: true, dotPosition: "upper-right" }
  },

  // Group 6: 明 林 朋 服
  {
    char: "明",
    pinyin: "míng",
    form: "LR",
    regions: { L: { strokes: 4 }, R: { strokes: 4 } }
  },
  {
    char: "林",
    pinyin: "lín",
    form: "LR",
    regions: { L: { strokes: 4 }, R: { strokes: 4 } },
    geometry: { parallelism: "vertical", repeatedRegion: true }
  },
  {
    char: "朋",
    pinyin: "péng",
    form: "LR",
    regions: { L: { strokes: 4 }, R: { strokes: 4 } },
    geometry: { enclosure: true, repeatedRegion: true }
  },
  {
    char: "服",
    pinyin: "fú",
    form: "LR",
    regions: { L: { strokes: 4 }, R: { strokes: 4 } },
    geometry: { enclosure: false, rightComplexity: "high" }
  }
];
