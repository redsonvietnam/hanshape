# HanShape Feature Ontology v0.6

## Review result

The first v0.6 draft exposed several character-specific fields. Those fields were replaced by reusable primitives.

Removed as primitives:

- `innerHorizontal`
- `apex`
- `horizontalPosition`
- `dotPosition`
- `rightComplexity`

They are now represented through generic topology, geometry, stroke and relation properties.

## Primitive set

### Topology

- `enclosure`
- `connectivity`
- `junction`
- `crossing`
- `boundaryContact`

### Geometry

- `orientation`
- `axis`
- `curvature`
- `symmetry`
- `convergence`

### Stroke

- `strokeType`

### Relation

- `relativePosition`
- `relativeLength`
- `parallelism`
- `alignment`

### Composition

- `density`
- `repetition`

## What the six groups teach us

### 木 / 本 / 未 / 末

Stroke count creates collisions. Relative position and relative length resolve them.

### 人 / 入 / 八

Stroke count alone is insufficient. Convergence and connectivity are visually useful.

### 日 / 曰 / 目

The enclosing form is not enough. A relation between the inner stroke and the enclosing boundary is useful. In standard character forms, the middle stroke distinction between 日 and 曰 is tied to boundary contact/opening, so `boundaryContact` is a reusable primitive rather than a one-off "inner horizontal" feature. citeturn749627search1turn749627search4

### 土 / 士

Relative length between the two horizontal strokes is more useful than inventing separate shape labels.

### 大 / 太 / 犬

Stroke type identifies the dot; relative position can distinguish the dot-bearing variants.

### 明 / 林 / 朋 / 服

The 4-4 base is intentionally ambiguous. Region-level topology and geometry provide the next refinement.

## Digit policy

A concept may exist without a digit.

A new digit must not be added merely because a new concept was discovered.

## Extraction boundary

The current corpus is semantic annotation, not automatic image analysis.

Future pipeline:

```
glyph / image
  ↓
stroke + geometry extraction
  ↓
semantic feature extraction
  ↓
HanShape abstract query
  ↓
matcher
```
