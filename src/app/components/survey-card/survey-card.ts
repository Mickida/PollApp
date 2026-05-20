import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Poll } from '../../models/poll';
import { DaysLeftPipe } from '../../pipes/days-left.pipe';

/** Controls the visual style of the card — 'large' for the ending-soon strip, 'compact' for the grid. */
export type SurveyCardVariant = 'large' | 'compact';

/**
 * Presentational card component for a single poll.
 * Renders differently based on the `variant` input.
 */
@Component({
  selector: 'app-survey-card',
  imports: [DaysLeftPipe, RouterLink],
  templateUrl: './survey-card.html',
  styleUrl: './survey-card.css',
})
export class SurveyCard {
  /** The poll data to display. */
  poll = input.required<Poll>();
  /** Visual variant — defaults to 'compact'. */
  variant = input<SurveyCardVariant>('compact');

  /** True when the poll's end date has passed. */
  readonly isPast = computed(() => {
    const endsAt = this.poll().endsAt;
    return !!endsAt && endsAt.getTime() <= Date.now();
  });
}
