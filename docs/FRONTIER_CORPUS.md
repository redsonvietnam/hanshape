# HanShape Frontier Corpus v0.9

The frontier corpus is the next stage after the six original adversarial groups.

Its purpose is not simply to increase the number of characters. It deliberately separates two cases:

1. covered families — current ontology primitives should be able to describe the decisive visual differences;
2. frontier families — the family exposes a recurring visual distinction that currently has no stable first-class concept.

This prevents a common failure mode in morphology projects: adding a new feature because one character happens to need it.

## Promotion rule

A frontier concept should not be promoted into `src/concepts.js` because it appears once.

Promotion requires evidence that the same visual distinction recurs across multiple independent confusion families, and that an existing concept cannot express it cleanly.

Current frontier examples:

- `boundaryProtrusion` — 田 / 由 / 甲 / 申
- `openDirection` — 己 / 已 / 巳
- `strokeOrdering` / `intersectionOffset` — 十 / 千 / 干

These are hypotheses, not frozen ontology primitives.

## Current families

The corpus currently includes:

- 王 / 玉 / 主 / 生
- 口 / 日 / 曰 / 目
- 大 / 天 / 夫 / 太
- 田 / 由 / 甲 / 申
- 工 / 土 / 士 / 干
- 己 / 已 / 巳
- 十 / 千 / 干

Three families are currently treated as covered hypotheses; two of them have experimental semantic annotations and pairwise tests in this branch. Four families are deliberate ontology-frontier probes.

## Research loop

```text
confusion family
      ↓
semantic annotation
      ↓
minimal observation path
      ↓
existing concept / frontier concept
      ↓
repeat across another family
      ↓
promote only when recurrence is demonstrated
```
