import { AbstractControl, FormArray, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Requires a non-empty trimmed string of at least `min` characters.
 * Returns `{ required: true }` when blank, `{ minLength }` when too short.
 */
export function requiredText(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').toString().trim();
    if (value.length === 0) {
      return { required: true };
    }
    if (value.length < min) {
      return { minLength: { required: min, actual: value.length } };
    }
    return null;
  };
}

/**
 * Ensures the control value is one of the allowed category strings.
 * Returns `{ invalidCategory: true }` otherwise.
 */
export function requiredCategory(allowed: readonly string[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!allowed.includes(control.value)) {
      return { invalidCategory: true };
    }
    return null;
  };
}

/**
 * Ensures the date value lies strictly in the future (after today midnight).
 * Empty values are treated as valid — combine with `requiredText` if the field is mandatory.
 * Returns `{ pastDate: true }` when the date is today or earlier.
 */
export const futureDate: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (!value) {
    return null;
  }
  const date = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (isNaN(date.getTime()) || date <= today) {
    return { pastDate: true };
  }
  return null;
};

/**
 * Validates that a `FormArray` has between `min` and `max` items (inclusive).
 * Returns `{ tooFew }` or `{ tooMany }` on failure.
 */
export function arrayLength(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const arr = control as FormArray;
    if (arr.length < min) {
      return { tooFew: { min, actual: arr.length } };
    }
    if (arr.length > max) {
      return { tooMany: { max, actual: arr.length } };
    }
    return null;
  };
}

/**
 * Validates that all non-empty answer texts within a `FormArray` are unique (case-insensitive).
 * Returns `{ duplicates: true }` when at least two answers are identical.
 */
export const uniqueAnswers: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const arr = control as FormArray;
  const values = arr.controls
    .map((c) => (c.value ?? '').toString().trim().toLowerCase())
    .filter((v) => v.length > 0);
  const unique = new Set(values);
  if (unique.size !== values.length) {
    return { duplicates: true };
  }
  return null;
};

/**
 * Requires that a form control has a selected answer.
 * Handles both single-select (`number | null`) and multi-select (`number[]`) controls.
 * Returns `{ requiredAnswer: true }` when nothing is selected.
 */
export function requiredAnswer(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value;
    if (v === null || v === undefined) return { requiredAnswer: true };
    if (Array.isArray(v) && v.length === 0) return { requiredAnswer: true };
    return null;
  };
}
