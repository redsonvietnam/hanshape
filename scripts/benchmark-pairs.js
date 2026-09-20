import { CHARACTER_MODEL } from "../src/character-model.js";
import { rankAdaptiveQuestions } from "../src/adaptive-matcher.js";

const pairs = [];

for (let i = 0; i < CHARACTER_MODEL.length; i += 1) {
  for (let j = i + 1; j < CHARACTER_MODEL.length; j += 1) {
    pairs.push([CHARACTER_MODEL[i], CHARACTER_MODEL[j]]);
  }
}

const rows = pairs.map(([a, b]) => {
  const questions = rankAdaptiveQuestions([a, b], {
    limit: 100,
    lookaheadDepth: 1,
    costMode: "flat"
  });

  const concepts = [...new Set(questions.map(question => question.concept))];

  return {
    pair: `${a.char}/${b.char}`,
    discriminators: questions.length,
    concepts: concepts.length,
    conceptList: concepts.join(",")
  };
});

const unsplittable = rows.filter(row => row.discriminators === 0);
const fragile = rows.filter(row => row.concepts === 1);

const conceptCounts = new Map();
for (const row of rows) {
  for (const concept of row.conceptList ? row.conceptList.split(",") : []) {
    conceptCounts.set(concept, (conceptCounts.get(concept) ?? 0) + 1);
  }
}

console.log("HanShape pairwise discriminator benchmark");
console.log("========================================");
console.log(`characters=${CHARACTER_MODEL.length} pairs=${rows.length}`);
console.log(`unsplittable=${unsplittable.length}`);
console.log(`fragilePairs(one concept only)=${fragile.length}`);
console.log("");

console.table(rows.filter(row => row.discriminators === 0 || row.concepts === 1));

console.log("");
console.log("Concept coverage");
console.table(
  [...conceptCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([concept, pairs]) => ({ concept, pairs }))
);
