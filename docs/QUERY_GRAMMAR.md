# HanShape Query Grammar v0.6

## Layers

```
FORM → REGION → COUNT → FEATURE → RELATION
```

A query may stop at any layer.

## Numeric compatibility syntax

Existing v0.5 examples remain valid:

- `844` — left/right, 4 strokes + 4 strokes
- `244` — top/bottom, 4 + 4
- `34` — single, 4 strokes
- `84404067` — base query plus refinement

The leading `0` in a refinement is an operator:

```
0 TARGET FEATURE
```

It means REFINE, not a feature concept.

## Important rule

Numeric syntax is an encoding of an abstract query. The matcher must never depend directly on digit meanings.

Conceptual query example:

```text
form = SINGLE
strokes = 5
horizontal.position = lower
```

can later receive a different numeric representation without changing the matcher.

## Future relation syntax

Relations such as relativeLength, relativePosition, alignment and connectivity should first exist in the abstract query model.

They should not be forced into the 0–9 digit namespace until the ontology is stable.
