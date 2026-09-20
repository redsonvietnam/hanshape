# HanShape Observation Paths

## Purpose

The adaptive matcher answers:

> Given the current candidate set, which visual question should HanShape ask next?

The observation-path layer asks a different research question:

> For a known target character, what is the shortest sequence of currently observable binary features that can isolate it?

This is a **benchmarking tool**, not a replacement for the user interface.

## Why this matters

The greedy adaptive matcher may choose a reasonable next observation while still taking more observations than the best path available in the same ontology.

We distinguish two different bounds:

```text
worst-case decision-tree lower bound = ceil(log2(n))
target-specific path lower bound   = 1 for n > 1
```

The first applies to the maximum depth of a complete binary decision tree. The second is the only generally valid information-free lower bound for one known target's branch.

The exact target-specific solver therefore measures path length directly. It does not claim that a target path must be at least ceil(log2(n)) observations.

## API

### `minimumObservationPath`

```js
minimumObservationPath(candidates, "未");
```

Returns:

- `questions` — minimum number of observations found
- `decisionTreeLowerBound` — worst-case binary decision-tree lower bound
- `targetLowerBound` — trivial target-specific lower bound (0 for singleton, otherwise 1)
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
```

## Important interpretation

A zero `questionGap` does **not** prove that the final HanShape input language is easy to use.

It only proves that the current semantic question generator contains a path of the same length as the greedy policy.

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

The output reports average greedy path length, average optimal path length, question gap, and search states explored.

## Research rule

Do not optimize the greedy selector merely because its path is longer than optimal.

First determine **why** the gap exists:

1. the ontology lacks a reusable observation;
2. the question generator fails to expose an existing observation;
3. the input grammar cannot express the observation;
4. the observation is expressible but expensive for a human to recognize.

Only the first case is an ontology problem.
