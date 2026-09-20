import { CHARACTER_MODEL } from "../src/character-model.js";
import { EXTENDED_COVERED_MODEL } from "../data/extended-covered-model.js";
import { rankAdaptiveQuestions } from "../src/adaptive-matcher.js";

const cases = [
  ["王", "玉", "主", "生"],
  ["口", "日", "曰", "目"]
];

const all = [...CHARACTER_MODEL, ...EXTENDED_COVERED_MODEL];
const byChars = names => all.filter(character => names.includes(character.char));

function audit(names) {
  const candidates = byChars(names);
  const rows = [];

  for (let i = 0; i < candidates.length; i += 1) {
    for (let j = i + 1; j < candidates.length; j += 1) {
      const [a, b] = [candidates[i], candidates[j]];
      const discriminators = rankAdaptiveQuestions([a, b], {
        limit: 100,
        lookaheadDepth: 1,
        costMode: "flat"
      });
      rows.push({
        pair: `${a.char}/${b.char}`,
        discriminators: discriminators.length,
        concepts: [...new Set(discriminators.map(item => item.concept))].join(",")
      });
    }
  }

  return rows;
}

let failed = false;
console.log("HanShape experimentally-covered corpus benchmark");
console.log("===============================================");

for (const names of cases) {
  const rows = audit(names);
  console.log("");
  console.log(names.join(" / "));
  console.table(rows);
  const unsplittable = rows.filter(row => row.discriminators === 0);
  if (unsplittable.length > 0) {
    failed = true;
    console.error(`UNSPLITTABLE: ${unsplittable.map(row => row.pair).join(", ")}`);
  }
}

if (failed) process.exitCode = 1;
