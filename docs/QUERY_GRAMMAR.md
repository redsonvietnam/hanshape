# HanShape Query Grammar v0.9

## Numeric layer

Existing numeric syntax remains compatible:

- `844` — LR, 4 strokes + 4 strokes
- `244` — UD, 4 + 4
- `34` — SINGLE, 4 strokes
- `844040` — LR 4-4, refine L by digit 0

Refinement grammar:

```
REFINE := 0 TARGET FEATURE_DIGIT
```

The leading `0` is an operator in the refinement namespace. A final `0` may simultaneously be a feature digit in the feature namespace.

```text
044
^^^
││└─ feature digit namespace
│└── target namespace
└─── operator namespace
```

The parser resolves these namespaces by position/context; the semantic matcher receives only the resolved query.

## Abstract layer

The numeric parser resolves to a semantic query:

```js
{
  form: "LR",
  counts: [4, 4],
  refinements: [
    {
      operator: "REFINE",
      target: "L",
      query: {
        path: "topology.enclosure",
        equals: true
      }
    }
  ]
}
```

The matcher consumes this abstract representation. It does not need to know that enclosure happened to be assigned digit 0.

## Relations

Relations are semantic-first:

```js
{
  form: "SINGLE",
  strokes: 5,
  relations: [
    {
      type: "relativeLength",
      a: "hUpper",
      b: "hLower",
      value: "shorter"
    }
  ]
}
```

Do not assign numeric bindings to relations until the relation vocabulary is stable.

## Progressive resolution

```
R1  FORM
R2  REGION
R3  STROKE COUNT
R4  FEATURE
R5  RELATION
R6  EXACT STROKE SEQUENCE (last resort)
```

A collision at an earlier layer is valid. Refinement is expected.

## Semantic negative queries

The abstract semantic layer supports a top-level `not` operator:

```js
{
  not: {
    regions: {
      C: { strokeTypes: ["dot"] }
    }
  }
}
```

This means the observed fact is "the whole character does not contain a dot" without inventing a new ontology primitive.

`not` is semantic-layer functionality. It has no numeric digit binding yet.

Numeric negative syntax should be designed only after actual interaction data shows that negative observations are common enough to justify a compact encoding.
## Relation scope

Semantic relations are scoped to their source region:

```js
{
  relations: [{
    target: "L",
    type: "relativeLength",
    a: "hUpper",
    b: "hLower",
    value: "shorter"
  }]
}
```

A relation stored in `R` must not satisfy a query explicitly targeting `L`.

The draft textual relation syntax uses the same scope:

```text
len(L.hUpper,L.hLower)<
pos(C.dot,C.mainAxis)=R
```
## Unified input compiler

Numeric and semantic relation tokens now compile into the same semantic AST.

Examples:

```text
35
```

becomes:

```js
{
  form: "SINGLE",
  strokes: 5
}
```

While:

```text
35 len(C.hUpper,C.hLower)<
```

becomes:

```js
{
  form: "SINGLE",
  strokes: 5,
  relations: [{
    target: "C",
    type: "relativeLength",
    a: "hUpper",
    b: "hLower",
    value: "shorter"
  }]
}
```

Both are passed to the same deterministic semantic matcher.

Whitespace separates input tokens. This creates a progressive path without committing to a final numeric compression for relations:

```text
base numeric query
        +
semantic relation token
        ↓
one semantic query
        ↓
matcher
```
## Generic feature tokens

Scalar/enum/numeric ontology features can be entered without waiting for a numeric digit:

```text
feat(C.geometry.symmetry)=vertical
feat(C.topology.junction)>=3
feat(C.content.strokes)=2
feat(C.topology.connectivity)=disconnected
```

These compile directly to region-scoped semantic queries.

### Set membership

Set-valued features use `has(...)`:

```text
has(C.strokeTypes,dot)
has(C.strokeTypes,dot)=false
```

`has(...)=false` compiles to the semantic `not` operator. Numeric bindings remain separate; these tokens are the human-readable semantic language.

### Canonical path

```text
numeric token      ─┐
relation token     ─┼→ semantic AST → matcher
feature token      ─┤
membership token   ─┘
```

This is the intended direction for HanShape: semantic vocabulary first, compact numeric codec second.
## Language conformance

All current user-facing token families compile into the same semantic AST:

- numeric base/refinement tokens
- relation tokens such as `len(...)`, `pos(...)`, `contact(...)`
- scalar feature tokens `feat(...)`
- set-membership tokens `has(...)`

The numeric representation is therefore a codec, not a separate semantic language.
### Generic relation tokens

Relations without a dedicated human-readable shorthand use:

```text
rel(C.relation,parallelism)=true
rel(C.relation,alignment)=aligned
```

The relation token is still region-scoped and compiles to the same `relations[]` semantic AST.