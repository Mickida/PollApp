import { AbstractControl, FormArray, ValidationErrors, ValidatorFn } from '@angular/forms';

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

export function requiredCategory(allowed: readonly string[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!allowed.includes(control.value)) {
      return { invalidCategory: true };
    }
    return null;
  };
}

export const futureDate: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
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

export const uniqueAnswers: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
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

export function requiredAnswer(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value;
    if (v === null || v === undefined) return { requiredAnswer: true };
    if (Array.isArray(v) && v.length === 0) return { requiredAnswer: true };
    return null;
  };
}
