# Relation Input Grammar — Research Draft

## Goal

The semantic layer already has reusable relations such as `relativeLength`, `relativePosition`, and `boundaryContact`. The current numeric grammar does not encode most of them.

The next layer should therefore be a compact relation syntax that is independent of digit assignment.

## Proposed semantic shorthand

Examples:

```text
len(hUpper,hLower)<
len(hUpper,hLower)=
len(hUpper,hLower)>

pos(dot,mainAxis)=R
pos(hLower,vMain)=B

contact(content)=L
contact(content)=BOTH
```

These are deliberately explicit rather than cryptic. Their job is to stabilize the semantic operation before compression into digits.

## Relation categories

### Relative length

```text
len(A,B)<   A shorter than B
len(A,B)=   A equal to B
len(A,B)>   A longer than B
```

`relativeLength` is currently the strongest candidate for the first compact relation binding because it recurs across independent confusion families such as 木/本/未/末 and 土/士.

### Relative position

```text
pos(A,B)=L
pos(A,B)=R
pos(A,B)=U
pos(A,B)=D
```

This should remain semantic until the reference labels (`A`, `B`) are standardized.

### Boundary contact

```text
contact(content)=NONE
contact(content)=L
contact(content)=R
contact(content)=BOTH
```

This maps directly to the existing ontology concept `boundaryContact`.

## Design constraints

1. A relation expression must map to exactly one semantic predicate.
2. A relation value is part of the observation, not a new ontology primitive.
3. The syntax should support multi-value observations directly.
4. Numeric compression must be a separate codec.
5. Do not allocate digits until interaction frequency and ambiguity are measured.

## Why not assign digits now

The current benchmark proves semantic demand, but it does not yet prove that one particular numeric encoding is the least costly input for humans.

The correct order is:

```text
semantic relation
      ↓
compact human-readable relation token
      ↓
interaction measurement
      ↓
numeric binding
```

## Current status

Research draft only. This grammar is not accepted as the v0.9 public syntax yet.
