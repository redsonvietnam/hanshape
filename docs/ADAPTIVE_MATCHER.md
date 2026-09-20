# HanShape Adaptive Matcher v0.7

## Goal

Given the current candidate set, automatically choose the next visual question that is expected to reduce the candidate set the most.

This turns HanShape into a progressive visual search process:

```
candidate set
   ↓
generate observable predicates
   ↓
partition candidates into YES / NO
   ↓
measure information gain
   ↓
penalize recognition cost
   ↓
choose best next question
```

## Scoring

For a binary question with (n) candidates:

```
p = YES / n

H(p) = -p log2(p) - (1-p) log2(1-p)
```

`H(p)` is the information gain of the question.

The current v0.7 score is:

```
score = informationGain / recognitionCost
```

Information gain is primary. Cost is used to prefer easier visual questions when their discrimination is comparable.

## Why binary questions?

A candidate set may contain many values for one concept. Instead of asking the user to select among all values, the engine asks:

> "Có đặc điểm X không?"

After the answer, the engine recomputes the candidate set and chooses the next question.

This keeps the interaction simple.

## Question sources

The generator derives questions only from the current semantic character model:

- topology: enclosure, connectivity, crossing
- geometry: axis, curvature, symmetry, convergence
- stroke type: presence of dot/hook/etc.
- boundary contact
- junction thresholds
- semantic relations such as relativeLength and relativePosition

No new digit is required.

## Example

Starting from:

```text
SINGLE + 3 strokes
→ 大 / 土 / 士
```

The adaptive matcher may ask about symmetry or convergence, isolating 大.

Then the remaining:

```text
土 / 士
```

can be split by the relative length of the lower and upper horizontal strokes.

## Important architectural rule

The adaptive layer does NOT replace the matcher.

```
abstract query
      ↓
   matcher
      ↓
candidate set
      ↓
adaptive question selector
      ↓
new abstract query
      ↓
matcher
```

The matcher remains deterministic. The adaptive layer decides what to ask next.

## Current limitation

v0.7 is greedy and one-step. It does not yet search several questions ahead.

Future work can explore:

- multi-step expected depth
- user-dependent recognition cost
- negative queries
- uncertainty/confidence
- adaptive digit assignment
- learning from real user choices
