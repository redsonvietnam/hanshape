# HanShape Observation Paths

## Purpose

The adaptive matcher answers:

> Given the current candidate set, which visual question should HanShape ask next?

The observation-path layer asks a different research question:

> For a known target character, what is the shortest sequence of currently observable binary features that can isolate it?

This is a **benchmarking tool**, not a replacement for the user interface.

## Why this matters

The greedy adaptive matcher may choose a reasonable next observation while still taking more observations than the best path available in the same ontology.

We therefore measure three quantities:

```text
entropy lower bound
        ↓
best path available in current ontology
        ↓
current greedy adaptive path
```

For `n` equally likely candidates, any binary strategy needs at least:

```text
ceil(log2(n))
```

observations in the ideal balanced case.

The exact observation-path solver then searches the existing question space to determine whether the current ontology and question generator can actually achieve that bound for a target.

## API

### `minimumObservationPath`

```js
minimumObservationPath(candidates, "未");
```

Returns:

- `questions` — minimum number of observations found
- `lowerBound` — information-theoretic binary lower bound
- `path` — the semantic questions used
- `statesExplored` — number of candidate states explored by the exact search

### `simulateGreedyObservationPath`

```js
simulateGreedyObservationPath(candidates, "未");
```

Runs the current default adaptive policy against the same target.

### `compareObservationPaths`

```js
compareObservationPaths(candidates, "未");
```

Returns the gap between the greedy and optimal paths:

```text
questionGap = greedyQuestions - optimalQuestions
entropyGap  = greedyQuestions - lowerBound
```

## Important interpretation

A zero `questionGap` does **not** prove that the final HanShape input language is easy to use.

It only proves that the current semantic question generator contains a path of the same length as the greedy policy.

Likewise, a positive `entropyGap` does not automatically mean the ontology is wrong. It may simply mean the available observations do not form balanced partitions for that candidate family.

The next research layer is therefore:

```text
semantic observation
        ↓
input token / gesture
        ↓
human recognition cost
```

The current solver deliberately stops before that layer.

## Benchmark

Run:

```bash
npm run benchmark:observation-path
```

The benchmark covers:

- the six adversarial groups
- the complete 19-character semantic model

The output reports the average greedy path length, average optimal path length, question gap, entropy gap, and search states explored.

## Research rule

Do not optimize the greedy selector merely because its path is longer than optimal.

First determine **why** the gap exists:

1. the ontology lacks a reusable observation;
2. the question generator fails to expose an existing observation;
3. the input grammar cannot express the observation;
4. the observation is expressible but expensive for a human to recognize.

Only the first case is an ontology problem.
