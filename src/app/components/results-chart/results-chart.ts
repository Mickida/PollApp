import { Component, computed, input } from '@angular/core';
import { Poll } from '../../models/poll';

@Component({
  selector: 'app-results-chart',
  imports: [],
  templateUrl: './results-chart.html',
  styleUrl: './results-chart.css',
})
export class ResultsChart {
  readonly poll = input.required<Poll>();

  readonly total = computed(() =>
    this.poll().questions.reduce(
      (sum, q) => sum + q.answers.reduce((qs, a) => qs + a.votes, 0),
      0
    )
  );

  protected questionTotal(questionIndex: number): number {
    const q = this.poll().questions[questionIndex];
    if (!q) return 0;
    return q.answers.reduce((s, a) => s + a.votes, 0);
  }

  protected percent(questionIndex: number, answerIndex: number): number {
    const q = this.poll().questions[questionIndex];
    if (!q) return 0;
    const ans = q.answers[answerIndex];
    if (!ans) return 0;
    const total = this.questionTotal(questionIndex);
    if (total === 0) return 0;
    return Math.round((ans.votes / total) * 100);
  }

  protected letter(answerIndex: number): string {
    return String.fromCharCode(65 + answerIndex);
  }
}
