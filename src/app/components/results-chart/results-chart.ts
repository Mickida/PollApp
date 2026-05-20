import { Component, computed, input } from '@angular/core';
import { Poll } from '../../models/poll';

@Component({
  selector: 'app-results-chart',
  imports: [],
  templateUrl: './results-chart.html',
  styleUrl: './results-chart.css',
})
/**
 * Displays a bar-chart summary of all answers for a given poll.
 * Percentages are calculated per question, not across the entire poll.
 */
export class ResultsChart {
  /** The poll whose results are rendered. */
  readonly poll = input.required<Poll>();

  /** Total votes cast across all questions in the poll. */
  readonly total = computed(() =>
    this.poll().questions.reduce((sum, q) => sum + q.answers.reduce((qs, a) => qs + a.votes, 0), 0),
  );

  /** Sum of votes for a single question (used as the denominator for percentages). */
  protected questionTotal(questionIndex: number): number {
    const q = this.poll().questions[questionIndex];
    if (!q) return 0;
    return q.answers.reduce((s, a) => s + a.votes, 0);
  }

  /** Percentage share (0–100, rounded) of one answer within its question. */
  protected percent(questionIndex: number, answerIndex: number): number {
    const q = this.poll().questions[questionIndex];
    if (!q) return 0;
    const ans = q.answers[answerIndex];
    if (!ans) return 0;
    const total = this.questionTotal(questionIndex);
    if (total === 0) return 0;
    return Math.round((ans.votes / total) * 100);
  }

  /** Converts a zero-based answer index to its corresponding letter label (A, B, C …). */
  protected letter(answerIndex: number): string {
    return String.fromCharCode(65 + answerIndex);
  }
}
