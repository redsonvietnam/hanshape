import { FORM_DIGIT_BINDING, TARGET_DIGIT_BINDING, DIGIT_BINDING } from "./digit-binding.js";

export function parseBase(code) {
  const digits = String(code).replace(/\\s+/g, "").split("").map(Number);
  if (!digits.length) return null;

  const formDigit = digits[0];
  const form = FORM_DIGIT_BINDING[formDigit];
  if (!form) return null;

  const coreLen = form === "SINGLE" ? 1 : form === "LR" || form === "UD" || form === "ENC" ? 2 : 3;
  if (digits.length < 1 + coreLen) return null;

  const counts = digits.slice(1, 1 + coreLen);
  const refinements = [];

  for (let i = 1 + coreLen; i < digits.length; i += 3) {
    if (digits[i] !== 0 || i + 2 >= digits.length) return null;

    const target = TARGET_DIGIT_BINDING[digits[i + 1]];
    const feature = DIGIT_BINDING[digits[i + 2]];
    if (!target || !feature || feature.namespace !== "feature") return null;

    refinements.push({
      target,
      concept: feature.value
    });
  }

  return { form, counts, refinements };
}
