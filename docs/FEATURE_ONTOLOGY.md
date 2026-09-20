# HanShape Feature Ontology v0.6

## Principle

A feature concept describes an observable property of a character. A digit is only an input binding for that concept.

Do not let the numeric keyboard determine the ontology.

## Concept layers

### Form
Global arrangement of regions:
- LR — left/right
- UD — top/bottom
- ENC — enclosure
- SINGLE — single body
- TRIPLE_H — three horizontal regions
- TRIPLE_V — three vertical regions

### Region properties
- strokeCount
- enclosure
- axis
- intersection
- branching
- curvature
- strokeType
- density
- symmetry

### Relational properties
- relativePosition
- relativeLength
- alignment
- connectivity
- parallelism
- crossing
- containment

## Derived concepts

Some concepts should be derived rather than manually assigned:

- branching
- parallelism
- density
- symmetry
- relativeLength

The engine should eventually derive these from lower-level geometry/stroke data.

## Adversarial groups

The minimum v0.6 corpus tests:

1. 木 本 未 末
2. 人 入 八
3. 日 曰 目
4. 土 士
5. 大 太 犬
6. 明 林 朋 服

The purpose is to discover which observable concepts are actually necessary before assigning more digits.
