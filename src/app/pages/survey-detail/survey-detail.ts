import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { DatePipe } from '@angular/common';
import { PollService } from '../../services/poll.service';
import { Poll } from '../../models/poll';
import { requiredAnswer } from '../../validators/survey-validators';
import { ResultsChart } from '../../components/results-chart/results-chart';

@Component({
  selector: 'app-survey-detail',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, ResultsChart],
  templateUrl: './survey-detail.html',
  styleUrl: './survey-detail.css',
})
export class SurveyDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  protected pollService = inject(PollService);

  readonly ctaClicked = signal(false);

  private readonly currentId = signal<number | null>(null);
  readonly justVoted = signal(false);
  readonly resultsExpanded = signal(false);

  readonly poll = computed<Poll | null>(() => {
    const id = this.currentId();
    if (id === null || !Number.isFinite(id)) return null;
    return this.pollService.polls().find((p) => p.id === id) ?? null;
  });

  readonly state = computed<'loading' | 'notFound' | 'ready'>(() => {
    if (!this.pollService.loaded()) return 'loading';
    const id = this.currentId();
    if (id === null) return 'loading';
    if (!Number.isFinite(id)) return 'notFound';
    return this.poll() ? 'ready' : 'notFound';
  });

  surveyForm: FormGroup = this.fb.group({
    questions: this.fb.array([]),
  });

  readonly isPast = computed(() => {
    const p = this.poll();
    if (!p || !p.endsAt) return false;
    return p.endsAt.getTime() <= Date.now();
  });

  readonly hasVoted = computed(() => {
    if (this.justVoted()) return true;
    const p = this.poll();
    return p ? this.pollService.hasVoted(p.id) : false;
  });

  readonly isReadonly = computed(() => this.isPast() || this.hasVoted());

  readonly hasResults = computed(() => {
    const p = this.poll();
    if (!p) return false;
    return p.questions.some((q) => q.answers.some((a) => a.votes > 0));
  });

  ngOnInit(): void {
    this.tryBuildForm();
  }

  private tryBuildForm(): void {
    if (!this.pollService.loaded()) {
      setTimeout(() => this.tryBuildForm(), 50);
      return;
    }
    this.resolveRouteId();
    const poll = this.poll();
    if (!poll) return;
    this.buildFormControls(poll);
    if (this.isReadonly()) this.surveyForm.disable();
  }

  private resolveRouteId(): void {
    const idParam = this.route.snapshot.paramMap.get('id') ?? '';
    const id = Number(idParam);
    if (!Number.isFinite(id)) {
      this.currentId.set(NaN);
      return;
    }
    this.currentId.set(id);
  }

  private buildFormControls(poll: Poll): void {
    const arr = this.questionsArray;
    arr.clear();
    for (const q of poll.questions) {
      if (q.allowMultiple) {
        arr.push(this.fb.control<number[]>([], { validators: [requiredAnswer()] }));
      } else {
        arr.push(this.fb.control<number | null>(null, { validators: [requiredAnswer()] }));
      }
    }
  }

  protected get questionsArray(): FormArray {
    return this.surveyForm.get('questions') as FormArray;
  }

  protected questionControl(qi: number): FormControl {
    return this.questionsArray.at(qi) as FormControl;
  }

  protected letter(ai: number): string {
    return String.fromCharCode(65 + ai);
  }

  protected toggleCheckbox(qi: number, answerId: number, checked: boolean): void {
    const ctrl = this.questionControl(qi);
    const current = (ctrl.value ?? []) as number[];
    if (checked) {
      if (!current.includes(answerId)) {
        ctrl.setValue([...current, answerId]);
      }
    } else {
      ctrl.setValue(current.filter((id) => id !== answerId));
    }
    ctrl.markAsDirty();
  }

  protected isChecked(qi: number, answerId: number): boolean {
    const v = this.questionControl(qi).value as number[] | null;
    return Array.isArray(v) && v.includes(answerId);
  }

  protected submit(): void {
    if (this.surveyForm.invalid) return;
    const poll = this.poll();
    if (!poll) return;
    this.surveyForm.disable();
    this.justVoted.set(true);
    this.pollService.vote(poll.id, this.collectAnswerIds());
  }

  private collectAnswerIds(): number[] {
    const answerIds: number[] = [];
    const values = this.questionsArray.value as Array<number | number[] | null>;
    for (const v of values) {
      if (v === null || v === undefined) continue;
      if (Array.isArray(v)) answerIds.push(...v);
      else answerIds.push(v);
    }
    return answerIds;
  }

  protected toggleResults(): void {
    this.resultsExpanded.update((v) => !v);
  }

  protected onCtaClick(event: Event): void {
    event.preventDefault();
    if (this.ctaClicked()) return;
    this.ctaClicked.set(true);
    setTimeout(() => this.router.navigate(['/new']), 1000);
  }
}
