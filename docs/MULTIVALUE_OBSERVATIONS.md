# HanShape Multi-value Observations v0.9

## Why binary is not enough

The first adaptive matcher modeled every visual observation as YES/NO.

That was useful for proving that candidate-set-driven search works, but it does not match the intended HanShape interaction very well.

A user can often observe a categorical fact directly:

- relative length: shorter / equal / longer
- boundary contact: none / left / right / both
- convergence: upper / lower / none
- symmetry: none / vertical / horizontal / radial
- content stroke count: 0 / 1 / 2 / ...

One observation can therefore split the candidate set into more than two branches.

## Engine

`src/multivalue-observation.js` adds:

- `rankAdaptiveObservations`
- `chooseNextObservation`
- `applyObservationAnswer`
- `minimumMultivalueObservationPath`
- `simulateGreedyMultivaluePath`
- `compareMultivalueObservationPaths`

The engine ranks an observation by the entropy of its full partition rather than forcing the observation into a binary predicate.

```text
candidate set
      ↓
categorical observation
      ↓
value A / value B / value C / ...
      ↓
candidate branches
```

## Research interpretation

The multivalue engine is not replacing the binary matcher yet.

It is a research comparator answering:

> How much of the apparent cost of the 20-Questions model comes from forcing inherently categorical observations into YES/NO?

The six original adversarial groups are benchmarked in `scripts/benchmark-multivalue.js`.

Run:

```bash
npm run benchmark:multivalue
```

## Important limitation

An observation with four possible values is not automatically four times harder than a binary observation. Human recognition cost is still unknown.

Therefore the current benchmark uses equal observation cost and should be interpreted as a structural comparison, not a usability score.

## Design implication

If multivalue observations consistently reduce path length, the final HanShape interaction should probably be modeled as:

```text
user sees feature
      ↓
user enters observed value
      ↓
semantic query
      ↓
candidate set
```

rather than:

```text
engine asks yes/no question
      ↓
user answers
```

The latter remains useful as a simulator and as a diagnostic tool.
