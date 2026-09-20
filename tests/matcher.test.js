import test from "node:test";
import assert from "node:assert/strict";
import { CHARACTER_MODEL } from "../src/character-model.js";
import { matchSemantic, matchCharacters } from "../src/matcher.js";
import { parseBase } from "../src/parser.js";

const chars = result => result.map(x => x.char);

const group = (...names) =>
  CHARACTER_MODEL.filter(character => names.includes(character.char));

test("木/本/未/末", () => {
  const corpus = group("木", "本", "未", "末", "目");

  assert.deepEqual(chars(matchSemantic(corpus, {
    form: "SINGLE",
    strokes: 4
  })), ["木"]);

  assert.deepEqual(chars(matchSemantic(corpus, {
    form: "SINGLE",
    strokes: 5
  })), ["本", "未", "末", "目"]);

  assert.deepEqual(chars(matchSemantic(corpus, {
    form: "SINGLE",
    strokes: 5,
    relations: [{
      type: "relativeLength",
      a: "hUpper",
      b: "hLower",
      value: "shorter"
    }]
  })), ["未"]);

  assert.deepEqual(chars(matchSemantic(corpus, {
    form: "SINGLE",
    strokes: 5,
    relations: [{
      type: "relativeLength",
      a: "hUpper",
      b: "hLower",
      value: "longer"
    }]
  })), ["末"]);
});

test("木/日", () => {
  const corpus = group("木", "日");

  assert.deepEqual(chars(matchSemantic(corpus, {
    form: "SINGLE",
    strokes: 4
  })), ["木", "日"]);

  assert.deepEqual(chars(matchSemantic(corpus, {
    form: "SINGLE",
    strokes: 4,
    regions: { C: { topology: { enclosure: false } } }
  })), ["木"]);

  assert.deepEqual(chars(matchSemantic(corpus, {
    form: "SINGLE",
    strokes: 4,
    regions: { C: { topology: { enclosure: true } } }
  })), ["日"]);
});

test("人/入/八", () => {
  const corpus = group("人", "入", "八");

  assert.deepEqual(chars(matchSemantic(corpus, {
    form: "SINGLE",
    strokes: 2
  })), ["人", "入", "八"]);

  assert.deepEqual(chars(matchSemantic(corpus, {
    form: "SINGLE",
    strokes: 2,
    regions: { C: { geometry: { convergence: "upper", symmetry: "vertical" } } }
  })), ["人"]);

  assert.deepEqual(chars(matchSemantic(corpus, {
    form: "SINGLE",
    strokes: 2,
    regions: { C: { geometry: { convergence: "lower" } } }
  })), ["入"]);

  assert.deepEqual(chars(matchSemantic(corpus, {
    form: "SINGLE",
    strokes: 2,
    regions: { C: { topology: { connectivity: "disconnected" } } }
  })), ["八"]);
});

test("日/曰/目", () => {
  const corpus = group("日", "曰", "目");

  assert.deepEqual(chars(matchSemantic(corpus, {
    form: "SINGLE",
    regions: { C: { topology: { enclosure: true } } }
  })), ["日", "曰", "目"]);

  assert.deepEqual(chars(matchSemantic(corpus, {
    form: "SINGLE",
    strokes: 4,
    regions: {
      C: {
        topology: { enclosure: true },
        content: { strokes: 1, boundaryContact: "both" }
      }
    }
  })), ["日"]);

  assert.deepEqual(chars(matchSemantic(corpus, {
    form: "SINGLE",
    strokes: 4,
    regions: {
      C: {
        topology: { enclosure: true },
        content: { strokes: 1, boundaryContact: "left" }
      }
    }
  })), ["曰"]);

  assert.deepEqual(chars(matchSemantic(corpus, {
    form: "SINGLE",
    strokes: 5,
    regions: { C: { content: { strokes: 2 } } }
  })), ["目"]);
});

test("土/士", () => {
  const corpus = group("大", "土", "士");

  assert.deepEqual(chars(matchSemantic(corpus, {
    form: "SINGLE",
    strokes: 3
  })), ["土", "士", "大"]);

  assert.deepEqual(chars(matchSemantic(corpus, {
    form: "SINGLE",
    strokes: 3,
    relations: [{
      type: "relativeLength",
      a: "hLower",
      b: "hUpper",
      value: "longer"
    }]
  })), ["土"]);

  assert.deepEqual(chars(matchSemantic(corpus, {
    form: "SINGLE",
    strokes: 3,
    relations: [{
      type: "relativeLength",
      a: "hLower",
      b: "hUpper",
      value: "shorter"
    }]
  })), ["士"]);
});

test("大/太/犬", () => {
  const corpus = group("大", "太", "犬");

  assert.deepEqual(chars(matchSemantic(corpus, {
    form: "SINGLE",
    strokes: 3
  })), ["大"]);

  assert.deepEqual(chars(matchSemantic(corpus, {
    form: "SINGLE",
    strokes: 4,
    regions: { C: { strokeTypes: ["dot"] } }
  })), ["太", "犬"]);

  assert.deepEqual(chars(matchSemantic(corpus, {
    form: "SINGLE",
    strokes: 4,
    relations: [{
      type: "relativePosition",
      a: "dot",
      b: "mainAxis",
      value: "right"
    }]
  })), ["犬"]);
});

test("明/林/朋/服", () => {
  const corpus = group("明", "林", "朋", "服");

  assert.deepEqual(chars(matchSemantic(corpus, {
    form: "LR",
    regions: {
      L: { strokes: 4 },
      R: { strokes: 4 }
    }
  })), ["明", "林", "朋", "服"]);

  assert.deepEqual(chars(matchSemantic(corpus, {
    form: "LR",
    regions: {
      L: { topology: { enclosure: true } },
      R: { topology: { enclosure: false } }
    }
  })), ["明"]);

  assert.deepEqual(chars(matchSemantic(corpus, {
    form: "LR",
    regions: {
      L: { topology: { enclosure: false }, content: { strokes: 2 } },
      R: { topology: { enclosure: false }, content: { strokes: 2 } }
    }
  })), ["朋"]);

  assert.deepEqual(chars(matchSemantic(corpus, {
    form: "LR",
    regions: {
      L: { topology: { enclosure: false } },
      R: { geometry: { curvature: "mixed" } }
    }
  })), ["服"]);

  assert.deepEqual(chars(matchSemantic(corpus, {
    form: "LR",
    regions: {
      L: { topology: { enclosure: false }, content: null },
      R: {
        topology: { enclosure: false },
        geometry: { symmetry: "vertical" },
        content: null
      }
    }
  })), ["林"]);
});

test("numeric parser resolves operator and feature namespaces", () => {
  const parsed = parseBase("844040");
  assert.ok(parsed);
  assert.equal(parsed.form, "LR");
  assert.deepEqual(parsed.counts, [4, 4]);
  assert.deepEqual(parsed.refinements[0].query, {
    path: "topology.enclosure",
    equals: true
  });
});

test("semantic query is independent of digit binding", () => {
  const corpus = group("木", "日");
  const semantic = matchSemantic(corpus, {
    form: "SINGLE",
    strokes: 4,
    regions: { C: { topology: { enclosure: true } } }
  });

  assert.deepEqual(chars(semantic), ["日"]);
});

test("numeric parallelism binding reaches semantic matcher", () => {
  const corpus = [{
    char: "X",
    form: "SINGLE",
    strokes: 4,
    regions: {
      C: {
        strokes: 4,
        relations: [{ type: "parallelism", value: true }]
      }
    }
  }, {
    char: "Y",
    form: "SINGLE",
    strokes: 4,
    regions: {
      C: {
        strokes: 4,
        relations: []
      }
    }
  }];

  const parsed = parseBase("34055");
  assert.ok(parsed);
  assert.deepEqual(parsed.refinements[0].query, {
    path: "relations.parallelism",
    equals: true
  });
  
  const matched = chars(matchCharacters(corpus, parsed));
  assert.deepEqual(matched, ["X"]);
});

test("semantic negative query excludes matching stroke features", () => {
  const corpus = [{
    char: "X",
    form: "SINGLE",
    strokes: 4,
    regions: {
      C: {
        strokes: 4,
        strokeTypes: ["dot"]
      }
    }
  }, {
    char: "Y",
    form: "SINGLE",
    strokes: 4,
    regions: {
      C: {
        strokes: 4,
        strokeTypes: ["horizontal"]
      }
    }
  }];

  assert.deepEqual(
    chars(matchSemantic(corpus, {
      not: {
        regions: { C: { strokeTypes: ["dot"] } }
      }
    })),
    ["Y"]
  );
});

test("semantic relation query respects source region", () => {
  const corpus = [{
    char: "L",
    form: "LR",
    strokes: 4,
    regions: {
      L: {
        strokes: 2,
        relations: [{
          type: "relativeLength",
          a: "hUpper",
          b: "hLower",
          value: "shorter"
        }]
      },
      R: {
        strokes: 2,
        relations: [{
          type: "relativeLength",
          a: "hUpper",
          b: "hLower",
          value: "longer"
        }]
      }
    }
  }];

  assert.equal(
    matchSemantic(corpus, {
      relations: [{
        target: "L",
        type: "relativeLength",
        a: "hUpper",
        b: "hLower",
        value: "shorter"
      }]
    }).length,
    1
  );

  assert.equal(
    matchSemantic(corpus, {
      relations: [{
        target: "R",
        type: "relativeLength",
        a: "hUpper",
        b: "hLower",
        value: "shorter"
      }]
    }).length,
    0
  );
});
