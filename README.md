# HanShape

A visual/morphological input method for Han characters.

## Current direction

HanShape is not intended to be a fixed per-character code like traditional mnemonic input systems. It is a progressive visual query language:

```
FORM → REGION → STROKE COUNT → FEATURE → RELATION
```

A partial query is valid. Collisions are expected. Refinement narrows the candidate set.

## v0.6 architecture

- `docs/FEATURE_ONTOLOGY.md` — feature concepts
- `docs/QUERY_GRAMMAR.md` — query syntax
- `src/concepts.js` — feature ontology
- `src/digit-binding.js` — human digit bindings
- `src/character-model.js` — morphology data model
- `src/parser.js` — code → abstract query
- `src/matcher.js` — abstract query → candidates
- `data/adversarial-corpus.js` — adversarial character groups
- `tests/matcher.test.js` — discrimination tests
- `prototype/index.html` — browser prototype

## Design rule

**Feature concept and feature digit are separate layers.**

A digit is an input binding, not the ontology itself.

## Status

Research prototype. v0.6 focuses on separating ontology from input bindings and testing visual discrimination on adversarial character groups.
