# HanShape Query Grammar v0.6

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
