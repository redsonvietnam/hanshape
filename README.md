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
- `src/adaptive-matcher.js` — candidate set → next best question
- `data/adversarial-corpus.js` — adversarial groups
- `tests/matcher.test.js` — deterministic matcher tests
- `tests/adaptive-matcher.test.js` — adaptive question tests

## Design rules

1. Feature concept ≠ feature digit.
2. A digit is only an input binding.
3. A collision is a valid partial query.
4. Relations should be semantic before they are numeric.
5. Do not add a primitive merely to encode one character.
6. The adaptive layer selects questions; the matcher remains deterministic.

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

## Status

Research prototype. The ontology is being stress-tested while the adaptive matcher is developed incrementally.
