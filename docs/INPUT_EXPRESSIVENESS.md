# HanShape Input Expressiveness v0.9

## Question

An observation is useful to HanShape only when two conditions hold:

1. the ontology can describe it;
2. the input grammar can express it without changing its meaning.

The second condition is now measured explicitly.

## Encoder

`src/query-encoding.js` converts a semantic adaptive observation into a numeric refinement segment when an exact existing binding exists.

Examples:

- enclosure on the whole character → `050`
- dot in the left region → `046`
- parallelism → `055`

When no exact numeric binding exists, the encoder returns a reason instead of silently dropping the observation.

Current unbound categories include:

- relative length
- relative position
- boundary contact/content features
- other relation types without stable digit bindings

## Why this is separate from ontology

Suppose `relativeLength` is needed to distinguish 未 from 末.

If the ontology represents `relativeLength` correctly but the numeric grammar cannot encode it, the solution is **not** to add a new morphology primitive. It is an input-language problem.

This gives HanShape a clean diagnostic chain:

```text
visual distinction
      ↓
ontology
      ↓
semantic question
      ↓
numeric encoder
      ↓
supported / unbound
```

## Important invariant

A numeric binding must be executable end-to-end:

```text
digit
  ↓
parser
  ↓
abstract query
  ↓
matcher
  ↓
correct candidate set
```

Digit 5 (`parallelism`) exposed this invariant during development: the binding existed, but the matcher did not execute the relation path. The matcher has now been extended and an end-to-end regression test covers the path.

## Research metric

The benchmark measures the fraction of observations in greedy and optimal observation paths that can be encoded by the current numeric grammar.

Run:

```bash
npm run benchmark:input-expressiveness
```

A high semantic coverage with low numeric coverage means the ontology is ahead of the input language.

A low semantic coverage means the bottleneck is earlier: question generation or ontology.

The distinction matters because those are different engineering problems.

## Current policy

Do not add numeric digits simply to make one benchmark path fully encodable.

Prefer this order:

1. confirm the semantic distinction recurs;
2. determine whether an existing semantic relation can express it;
3. design the shortest clear input operator;
4. only then allocate a compact numeric binding if the interaction data justifies it.

## Language capability audit

`scripts/audit-language-capability.js` separates two questions:

1. can the semantic language parse and compile the concept?
2. does the current character corpus actually contain annotated data that can satisfy the query?

A concept with `syntax=supported` and `corpusMatches=0` is not necessarily a language failure. It may indicate that the character model has not yet been annotated with that concept.

This prevents confusing missing corpus annotations with missing grammar support.