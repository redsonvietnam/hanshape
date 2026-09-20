/**
 * Human-effort proxy for HanShape visual observations.
 *
 * These weights are heuristic recognition costs, not empirical human-time data.
 * They reuse the current adaptive matcher cost scale so binary and multi-value
 * research can be compared on the same rough recognition-cost axis.
 */

export const HUMAN_EFFORT_CONCEPT_COST = Object.freeze({
  enclosure: 0.80,
  connectivity: 0.80,
  strokeType: 0.90,
  axis: 0.90,
  symmetry: 0.90,
  convergence: 1.00,
  curvature: 1.05,
  boundaryContact: 1.00,
  relativePosition: 1.15,
  relativeLength: 1.20,
  junction: 1.30,
  parallelism: 1.25,
  alignment: 1.25,
  density: 1.40,
  repetition: 1.40,
  strokes: 1.05
});

export function observationRecognitionCost(observation) {
  const concept = observation?.concept
    ?? (
      observation?.kind === "relation"
        ? observation.relationKey?.split("|")[0]
        : observation?.kind === "strokeType"
          ? "strokeType"
          : observation?.path?.at(-1)
    );

  return HUMAN_EFFORT_CONCEPT_COST[concept] ?? 1.20;
}

/**
 * Resolve the cost used by an adaptive observation benchmark.
 *
 * - flat: every observation costs 1
 * - weighted: use the heuristic visual-recognition cost above
 */
export function observationCost(observation, options = {}) {
  return options.costMode === "weighted"
    ? observationRecognitionCost(observation)
    : 1;
}
