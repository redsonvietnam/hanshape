/**
 * Research frontier corpus for HanShape v0.9.
 *
 * Each family is deliberately tagged as either:
 *   - covered: current ontology should be able to express the key distinction
 *   - frontier: the family exposes a recurring visual distinction that is
 *              not yet a first-class concept in the current ontology.
 *
 * This file is a research inventory, not character-model ground truth.
 */

export const FRONTIER_CONFUSION_FAMILIES = [
  {
    id: "wang-yu-zhu-sheng",
    chars: ["王", "玉", "主", "生"],
    status: "covered",
    basePattern: "SINGLE / 4-5 strokes",
    usefulConcepts: ["strokeType", "relativePosition", "symmetry", "axis"],
    notes: "Tests dot-bearing variants and whether the extra stroke is described by reusable stroke/position concepts."
  },
  {
    id: "kou-ri-yue-mu",
    chars: ["口", "日", "曰", "目"],
    status: "covered",
    basePattern: "SINGLE / enclosure family",
    usefulConcepts: ["enclosure", "junction", "boundaryContact"],
    notes: "Tests enclosure with increasing interior stroke counts and inner-boundary contact."
  },
  {
    id: "gong-tu-shi-gan",
    chars: ["工", "土", "士", "干"],
    status: "frontier",
    basePattern: "SINGLE / 2-3 strokes",
    usefulConcepts: ["relativePosition", "relativeLength", "axis", "connectivity"],
    frontierConcepts: ["axisExtension"],
    notes: "土 / 士 are covered by relative length, but 干 introduces the recurring question of whether the main axis extends beyond a component boundary."
  },
  {
    id: "da-tian-fu-tai",
    chars: ["大", "天", "夫", "太"],
    status: "covered",
    basePattern: "SINGLE / cross-like skeleton",
    usefulConcepts: ["strokeType", "relativePosition", "symmetry", "convergence"],
    notes: "Tests whether added top horizontal or dot-like strokes can be described without character-specific names."
  },
  {
    id: "tian-you-jia-shen",
    chars: ["田", "由", "甲", "申"],
    status: "frontier",
    basePattern: "SINGLE / box-like family",
    usefulConcepts: ["enclosure", "boundaryContact"],
    frontierConcepts: ["boundaryProtrusion", "axisExtension"],
    notes: "The decisive difference is whether an internal axis protrudes beyond one or both enclosing boundaries. Current ontology has boundary contact, but not explicit boundary protrusion."
  },
  {
    id: "ji-yi-si",
    chars: ["己", "已", "巳"],
    status: "frontier",
    basePattern: "SINGLE / 3-stroke hooked family",
    usefulConcepts: ["curvature", "connectivity", "convergence"],
    frontierConcepts: ["openDirection", "endpointTopology"],
    notes: "The important visual distinction is the shape/opening direction of the hooked stroke system; current ontology does not directly encode endpoint topology."
  },
  {
    id: "shi-qian-gan",
    chars: ["十", "千", "干"],
    status: "frontier",
    basePattern: "SINGLE / cross-like skeleton",
    usefulConcepts: ["relativePosition", "axis", "strokeType"],
    frontierConcepts: ["strokeOrdering", "intersectionOffset"],
    notes: "The extra or displaced horizontal/diagonal relation can depend on which stroke crosses or extends beyond the main axis; current model has crossing and position, but not stroke-identity/order as a first-class observation."
  }
];
