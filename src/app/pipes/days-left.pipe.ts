import { Pipe, PipeTransform } from '@angular/core';

/**
 * Converts an expiry date into a human-readable countdown string.
 * Returns `'Ended'` when the date is in the past, `'Ends in N Days'` otherwise.
 * Returns an empty string when no date is provided.
 */
@Pipe({
  name: 'daysLeft',
})
export class DaysLeftPipe implements PipeTransform {
  /** @param value - the expiry date of the poll, or undefined for open-ended polls */
  transform(value: Date | undefined): string {
    if (!value) {
      return '';
    }
    const diffMs = value.getTime() - Date.now();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (days <= 0) {
      return 'Ended';
    }
    if (days === 1) {
      return 'Ends in 1 Day';
    }
    return `Ends in ${days} Days`;
  }
}
