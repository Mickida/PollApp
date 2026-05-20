import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Poll } from '../../models/poll';
import { DaysLeftPipe } from '../../pipes/days-left.pipe';

export type SurveyCardVariant = 'large' | 'compact';

@Component({
  selector: 'app-survey-card',
  imports: [DaysLeftPipe, RouterLink],
  templateUrl: './survey-card.html',
  styleUrl: './survey-card.css',
})
export class SurveyCard {
  poll = input.required<Poll>();
  variant = input<SurveyCardVariant>('compact');

  readonly isPast = computed(() => {
    const endsAt = this.poll().endsAt;
    return !!endsAt && endsAt.getTime() <= Date.now();
  });
}
