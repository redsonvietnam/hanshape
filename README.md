# HanShape

A visual/morphological input method for Han characters.

## Current direction

HanShape is a progressive visual query language rather than a fixed per-character mnemonic code.

```
FORM → REGION → STROKE COUNT → FEATURE → RELATION
```

A partial query is valid. Collisions are expected. Refinement narrows the candidate set.

## Architecture

- `docs/FEATURE_ONTOLOGY.md` — primitive concepts
- `docs/QUERY_GRAMMAR.md` — numeric and abstract query grammar
- `docs/ADAPTIVE_MATCHER.md` — information-gain and multi-step question selection
- `src/concepts.js` — ontology
- `src/digit-binding.js` — digit/input bindings
- `src/character-model.js` — semantic morphology corpus
- `src/parser.js` — digits → abstract query
- `src/matcher.js` — abstract query → candidates
- `src/adaptive-matcher.js` — candidate set → next best visual observation
- `src/observation-path.js` — exact target-specific minimal observation paths
- `src/relation-token.js` — executable region-scoped relation token draft
- `src/query.js` — unified numeric + semantic input compiler
- `data/adversarial-corpus.js` — adversarial groups
- `tests/matcher.test.js` — deterministic matcher tests
- `tests/adaptive-matcher.test.js` — adaptive question tests
- `tests/observation-path.test.js` — observation-path optimality tests

## Design rules

1. Feature concept ≠ feature digit.
2. A digit is only an input binding.
3. A collision is a valid partial query.
4. Relations should be semantic before they are numeric.
5. Do not add a primitive merely to encode one character.
6. The adaptive layer selects observations; the matcher remains deterministic.
7. Measure greedy observation effort against an exact path before optimizing the selector.

## Adaptive search

Given the current candidate set, HanShape generates observable binary predicates and scores them with information gain:

```
candidate set
  ↓
question candidates
  ↓
YES / NO partition
  ↓
information gain
  ↓
recognition-cost adjustment
  ↓
next question
```

This is the beginning of the "20 Questions for Han characters" interaction model.


## Interactive demo

The repository includes a small browser demo for the adaptive matcher.

Run locally:

```bash
npm run demo
```

Then open:

```
http://localhost:4173
```

The demo lets you choose an adversarial candidate group, select a hidden target character for simulation, and answer YES/NO while HanShape recomputes the candidate set. The lookahead depth can be changed between 1 and 3.

## Research metric

The adaptive matcher is now paired with an exact target-specific observation-path solver. This measures the gap between the current greedy policy, the best path available in the current semantic question space, and the binary information lower bound.

The next layer measures a separate **input expressiveness gap**: whether those semantic observations can actually be encoded by the current numeric grammar. See `docs/INPUT_EXPRESSIVENESS.md` and run `npm run benchmark:input-expressiveness`.

The adaptive research layer now also tests multi-value observations and a semantic `not` operator so an observed value can flow back through the same matcher instead of creating a second matching system.

Run the benchmark with:

```bash
npm run benchmark:observation-path
```

See `docs/OBSERVATION_PATHS.md` for interpretation and research rules.

The adaptive demo remains a laboratory/debugging tool rather than the final HanShape interaction model.

## Status

Research prototype. The next bottlenecks are corpus coverage, input expressiveness, and human observation cost—not deeper lookahead by itself.

## Unified input path

Numeric and semantic relation tokens are compiled into one semantic AST before matching. This keeps numeric bindings as a codec layer instead of creating separate matching semantics.

## Direct Query Lab

The repository now includes a direct semantic query laboratory at `/demo/query-lab.html`.

It demonstrates:

- numeric input and relation-token input compiling into one semantic query;
- candidate-set filtering through the deterministic matcher;
- multi-value observation guidance;
- selecting an observed value without forcing it through a YES/NO interaction.

The existing adaptive demo remains a diagnostic simulator for the binary question model.
