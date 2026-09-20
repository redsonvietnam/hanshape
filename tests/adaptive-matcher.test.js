import test from "node:test";
import assert from "node:assert/strict";
import { CHARACTER_MODEL } from "../src/character-model.js";
import { matchSemantic } from "../src/matcher.js";
import {
  chooseNextQuestion,
  rankAdaptiveQuestions,
  applyAdaptiveAnswer
} from "../src/adaptive-matcher.js";

const group = (...names) =>
  CHARACTER_MODEL.filter(character => names.includes(character.char));

test("adaptive matcher — 土/士 becomes a second-step perfect split", () => {
  const candidates = group("大", "土", "士");

  const first = chooseNextQuestion(candidates);
  assert.ok(first);
  assert.equal(first.candidateCount, 3);
  assert.equal(first.yesCount + first.noCount, 3);
  assert.ok(first.yesCount === 1 || first.noCount === 1);
  assert.ok(first.informationGain > 0.8);

  const remaining = applyAdaptiveAnswer(candidates, first, false);
  assert.equal(remaining.length, 2);

  const second = chooseNextQuestion(remaining);
  assert.ok(second);
  assert.equal(second.candidateCount, 2);
  assert.equal(second.yesCount, 1);
  assert.equal(second.noCount, 1);
});

test("adaptive matcher — 日/曰/目 uses a reusable ontology concept", () => {
  const candidates = group("日", "曰", "目");
  const candidatesWithEnclosure = matchSemantic(candidates, {
    form: "SINGLE",
    regions: { C: { topology: { enclosure: true } } }
  });

  const ranked = rankAdaptiveQuestions(candidatesWithEnclosure, { limit: 5 });
  assert.ok(ranked.length > 0);

  const top = ranked[0];
  assert.ok(top.informationGain > 0.8);
  assert.ok(
    top.concept === "boundaryContact" ||
    top.concept === "junction"
  );

  const yes = applyAdaptiveAnswer(candidatesWithEnclosure, top, true);
  assert.equal(yes.length, 1);
});

test("adaptive matcher — 明/林/朋/服 reduces the 4-4 collision", () => {
  const candidates = group("明", "林", "朋", "服");

  const question = chooseNextQuestion(candidates);
  assert.ok(question);
  assert.ok(question.yesCount > 0);
  assert.ok(question.noCount > 0);
  assert.equal(question.yesCount + question.noCount, 4);
  assert.ok(question.eliminationRatio >= 0.25);
});

test("adaptive matcher — 人/入/八 finds a high-information visual discriminator", () => {
  const candidates = group("人", "入", "八");

  const question = chooseNextQuestion(candidates);
  assert.ok(question);
  assert.ok(question.informationGain > 0.8);
  assert.equal(question.yesCount + question.noCount, 3);
});

test("adaptive matcher — no question remains for a singleton", () => {
  assert.equal(chooseNextQuestion(group("木")), null);
});

test("adaptive matcher — lookahead depth 2 includes a conditional next question", () => {
  const candidates = group("大", "土", "士");

  const greedy = chooseNextQuestion(candidates, { lookaheadDepth: 1 });
  const lookahead = chooseNextQuestion(candidates, { lookaheadDepth: 2 });

  assert.ok(greedy);
  assert.ok(lookahead);
  assert.equal(greedy.lookaheadDepth, 1);
  assert.equal(lookahead.lookaheadDepth, 2);

  assert.equal(greedy.expectedInformationGain, greedy.informationGain);
  assert.equal(greedy.expectedCost, greedy.cost);
  assert.equal(greedy.lookaheadScore, greedy.score);

  assert.ok(lookahead.expectedInformationGain > lookahead.informationGain);
  assert.ok(lookahead.expectedCost >= lookahead.cost);
  assert.ok(lookahead.lookaheadScore > 0);
});

test("adaptive matcher — deeper lookahead remains bounded by available information", () => {
  const candidates = group("木", "本", "未", "末");

  const question = chooseNextQuestion(candidates, { lookaheadDepth: 3 });
  assert.ok(question);

  const maximumInformation = Math.log2(candidates.length);
  assert.ok(question.expectedInformationGain <= maximumInformation + 1e-12);
  assert.ok(question.expectedCost >= question.cost);
});

test("adaptive matcher — flat cost mode removes hand-tuned cost bias", () => {
  const candidates = group("木", "未", "太", "犬");

  const defaultQuestion = chooseNextQuestion(candidates);
  const weighted = chooseNextQuestion(candidates, { costMode: "weighted" });
  const flat = chooseNextQuestion(candidates, { costMode: "flat" });

  assert.ok(defaultQuestion);
  assert.ok(weighted);
  assert.ok(flat);
  assert.equal(defaultQuestion.recognitionCost, 1);
  assert.equal(flat.recognitionCost, 1);
  assert.equal(flat.score, flat.informationGain);
  assert.equal(weighted.recognitionCost, weighted.cost);
});
