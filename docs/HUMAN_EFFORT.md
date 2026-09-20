# HanShape Human-Effort Proxy

## Purpose

The structural benchmarks count visual observations:

```text
1 observation = 1 unit
```

That is useful, but it assumes that every observation is equally easy for a person to recognize.

The human-effort layer therefore adds a second, explicitly **heuristic** cost model:

```text
visual concept
    ↓
recognition cost
    ↓
weighted observation path
```

This is **not measured human performance**. It is a research proxy that lets us test whether conclusions change when some concepts are assumed harder to recognize than others.

## Cost model

The proxy reuses the current adaptive matcher recognition-cost scale:

| Concept | Proxy cost |
| --- | ---: |
| enclosure | 0.80 |
| connectivity | 0.80 |
| strokeType | 0.90 |
| axis | 0.90 |
| symmetry | 0.90 |
| convergence | 1.00 |
| curvature | 1.05 |
| boundaryContact | 1.00 |
| relativePosition | 1.15 |
| relativeLength | 1.20 |
| junction | 1.30 |
| parallelism | 1.25 |
| alignment | 1.25 |
| density | 1.40 |
| repetition | 1.40 |

The scale is ordinal within this benchmark. A cost of `1.20` means that the concept is assumed harder than `0.90`; it does not mean 1.2 seconds.

## API

The multi-value observation engine accepts:

```js
{ costMode: "flat" }
```

or:

```js
{ costMode: "weighted" }
```

Weighted mode adds:

- `observationCost`
- `effortScore`
- `cost`
- `optimalCost`
- `greedyCost`
- `costGap`

The exact path solver minimizes weighted recognition cost in weighted mode. The default remains flat so existing structural benchmarks are unchanged.

## Benchmark

Run:

```bash
npm run benchmark:human-effort
```

The benchmark compares:

1. binary observation count;
2. flat multi-value observation count;
3. weighted binary recognition cost;
4. weighted multi-value recognition cost;
5. weighted optimal multi-value recognition cost.

It also reports how often the weighted model changes the greedy first observation.

## Interpretation rule

Do not treat a lower proxy cost as evidence that HanShape is easier for humans.

The proxy is useful for only two questions at this stage:

- Does adding recognition cost materially change the preferred observations?
- Does the relative advantage of multi-value observations survive when observations are not assumed equally difficult?

The next step after this benchmark is actual human timing and error data from representative users. Those measurements should eventually replace the heuristic weights rather than being forced to fit them.
