# HanShape v0.9 Reference Baseline

This baseline is a structural reference calculated from the current 19-character semantic model. It is not a CI report.

## Six adversarial families

Across 19 target cases:

| Metric | Binary | Multi-value |
| --- | ---: | ---: |
| Greedy average observations | 1.789 | 1.421 |
| Exact-path average observations | 1.158 | 1.105 |

The multi-value greedy path is therefore shorter in aggregate on the current adversarial corpus, while individual targets can move in either direction.

## Exhaustive same-form subset reference

All 1,365 four-character subsets of the 15-character `SINGLE` corpus were evaluated as 5,460 target cases:

- binary greedy average: 2.044 observations
- multi-value greedy average: 1.750 observations
- multi-value used fewer observations in 1,544 cases
- equal in 3,857 cases
- multi-value used more observations in 59 cases
- maximum improvement: 2 observations
- maximum worsening: 1 observation

These figures are a reference calculation against the current semantic model. The repository benchmark reproduces the same comparison when run locally/CI.

## Multi-value exact-path binding demand

Across exact multi-value paths in the six adversarial families, the most frequent semantic concepts were:

| Concept | Observations | Current numeric support |
| --- | ---: | --- |
| `relativeLength` | 7 | no |
| `boundaryContact` | 4 | no |
| `convergence` | 3 | no |
| `strokeType` | 3 | partial (`dot` only) |
| `symmetry` | 3 | no |
| `enclosure` | 1 | yes |

The implication is not to add six digits. It is to identify which semantic relations deserve a compact relation syntax first, then allocate numeric bindings only after that syntax is stable.

## Target-agnostic decision-tree reference

An additional reference calculation optimized the complete decision tree rather than a target-specific path.

On all 1,365 four-character SINGLE subsets:

- binary entropy-greedy average depth: 2.044
- binary exact-tree average depth: 2.044
- multi-value entropy-greedy average depth: 1.750
- multi-value exact-tree average depth: 1.750
- no subset had a greedy tree-depth gap in either model.

On a deterministic sample of 512 five-character SINGLE subsets:

- binary greedy average depth: 2.418
- binary exact-tree average depth: 2.418
- multi-value greedy average depth: 2.071
- multi-value exact-tree average depth: 2.071
- no sampled subset had a greedy tree-depth gap.

This suggests that additional lookahead is not currently the main optimization target. Corpus expansion and input expressiveness remain more valuable.
## Bound interpretation correction

The target-specific observation-path solver does not use `ceil(log2(n))` as a lower bound for an individual target branch. That quantity belongs to worst-case complete binary decision trees.

The target-specific benchmark now reports direct path length and greedy-vs-optimal gap. The target-agnostic decision-tree benchmark remains the place to compare complete-tree depth.