import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'daysLeft',
})
export class DaysLeftPipe implements PipeTransform {
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
