# HanShape

A visual/morphological input method for Han characters.

## Current direction

HanShape is a progressive visual query language rather than a fixed per-character mnemonic code.

```
FORM → REGION → STROKE COUNT → FEATURE → RELATION
```

A partial query is valid. Collisions are expected. Refinement narrows the candidate set.

## v0.6 architecture

- `docs/FEATURE_ONTOLOGY.md` — primitive concepts and review findings
- `docs/QUERY_GRAMMAR.md` — numeric and abstract query grammar
- `src/concepts.js` — ontology
- `src/digit-binding.js` — input bindings only
- `src/character-model.js` — semantic morphology corpus
- `src/parser.js` — digits → abstract query
- `src/matcher.js` — abstract query → candidates
- `data/adversarial-corpus.js` — adversarial groups
- `tests/matcher.test.js` — executable discrimination tests

## Design rules

1. Feature concept ≠ feature digit.
2. A digit is only an input binding.
3. A collision is a valid partial query.
4. Relations should be semantic before they are numeric.
5. Do not add a primitive merely to encode one character.

## Status

Research prototype. v0.6 is an ontology stress-test, not a frozen specification.
