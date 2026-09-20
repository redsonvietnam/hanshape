import { FORM_DIGIT_BINDING, TARGET_DIGIT_BINDING, OPERATOR_DIGIT_BINDING, FEATURE_DIGIT_BINDING } from "./digit-binding.js";

export function parseBase(code) {
  const raw = String(code ?? "").replace(/\s+/g, "");
  if (!/^\d+$/.test(raw)) return null;

  const digits = raw.split("").map(Number);
  const form = FORM_DIGIT_BINDING[digits[0]];
  if (!form) return null;

  const coreLen = form === "SINGLE" ? 1 : ["LR", "UD", "ENC"].includes(form) ? 2 : 3;
  if (digits.length < 1 + coreLen) return null;

  const counts = digits.slice(1, 1 + coreLen);
  const refinements = [];
  const validTargets = {
    SINGLE: new Set(["C"]),
    LR: new Set(["L", "R"]),
    UD: new Set(["T", "B"]),
    ENC: new Set(["O", "I"]),
    TRIPLE_H: new Set(["C"]),
    TRIPLE_V: new Set(["C"])
  };

  for (let i = 1 + coreLen; i < digits.length; i += 3) {
    if (i + 2 >= digits.length) return null;

    const operator = OPERATOR_DIGIT_BINDING[digits[i]];
    if (!operator || operator.operator !== "REFINE") return null;

    const target = TARGET_DIGIT_BINDING[digits[i + 1]];
    const binding = FEATURE_DIGIT_BINDING[digits[i + 2]];
    if (
      !target ||
      !binding ||
      binding.namespace !== "feature" ||
      !validTargets[form]?.has(target)
    ) return null;

    refinements.push({
      operator: "REFINE",
      target,
      digit: digits[i + 2],
      query: binding.query
    });
  }

  return { raw, form, counts, refinements };
}
