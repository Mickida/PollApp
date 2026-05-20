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
/**
 * Detail page for a single poll.
 * Renders the voting form or the read-only results view depending on
 * whether the user has already voted or the poll has expired.
 */
export class SurveyDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  protected pollService = inject(PollService);

  /** Prevents the CTA button from being clicked twice during the navigation delay. */
  readonly ctaClicked = signal(false);

  private readonly currentId = signal<number | null>(null);
  /** Set to true immediately after the user submits their vote. */
  readonly justVoted = signal(false);
  /** Controls the results accordion on the voting form. */
  readonly resultsExpanded = signal(false);

  /** The currently loaded poll, or null while loading / when not found. */
  readonly poll = computed<Poll | null>(() => {
    const id = this.currentId();
    if (id === null || !Number.isFinite(id)) return null;
    return this.pollService.polls().find((p) => p.id === id) ?? null;
  });

  /** Page loading state — drives the loading skeleton and 404 view. */
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

  /** True when the poll's end date has passed. */
  readonly isPast = computed(() => {
    const p = this.poll();
    if (!p || !p.endsAt) return false;
    return p.endsAt.getTime() <= Date.now();
  });

  /** True when the user has already submitted a vote (in this session or a previous one). */
  readonly hasVoted = computed(() => {
    if (this.justVoted()) return true;
    const p = this.poll();
    return p ? this.pollService.hasVoted(p.id) : false;
  });

  /** Form is disabled when the poll is past or the user has already voted. */
  readonly isReadonly = computed(() => this.isPast() || this.hasVoted());

  /** True when at least one answer in the poll has received a vote. */
  readonly hasResults = computed(() => {
    const p = this.poll();
    if (!p) return false;
    return p.questions.some((q) => q.answers.some((a) => a.votes > 0));
  });

  /** Current form selections — updated on every value change, drives the live preview. */
  private readonly formSnapshot = signal<Array<number | number[] | null> | null>(null);

  /** Poll with the user's current selections added as +1 preview votes. Falls back to the real poll when readonly or no selection exists. */
  readonly previewPoll = computed<Poll | null>(() => {
    const p = this.poll();
    const snapshot = this.formSnapshot();
    if (!p) return null;
    if (this.isReadonly() || !snapshot) return p;
    return this.buildPreviewPoll(p, snapshot);
  });

  /** Returns a shallow copy of the poll with +1 votes on every selected answer. */
  private buildPreviewPoll(p: Poll, selections: Array<number | number[] | null>): Poll {
    return {
      ...p,
      questions: p.questions.map((q, qi) => {
        const selected = selections[qi] ?? null;
        const selectedIds = Array.isArray(selected)
          ? selected
          : selected !== null
            ? [selected]
            : [];
        return {
          ...q,
          answers: q.answers.map((a) => ({
            ...a,
            votes: selectedIds.includes(a.id) ? a.votes + 1 : a.votes,
          })),
        };
      }),
    };
  }

  ngOnInit(): void {
    this.tryBuildForm();
  }

  /** Polls until PollService has loaded, then resolves the route id and builds the form. */
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

  /** Parses the route `:id` param and writes it to `currentId`. Sets NaN on invalid input. */
  private resolveRouteId(): void {
    const idParam = this.route.snapshot.paramMap.get('id') ?? '';
    const id = Number(idParam);
    if (!Number.isFinite(id)) {
      this.currentId.set(NaN);
      return;
    }
    this.currentId.set(id);
  }

  /** Creates one form control per question — array control for multi-select, scalar for single. */
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
    this.surveyForm.valueChanges.subscribe(() => {
      const raw = this.surveyForm.getRawValue() as { questions: Array<number | number[] | null> };
      this.formSnapshot.set(raw.questions ?? null);
    });
  }

  /** Returns the questions FormArray from the voting form. */
  protected get questionsArray(): FormArray {
    return this.surveyForm.get('questions') as FormArray;
  }

  /** Returns the form control for the question at the given index. */
  protected questionControl(qi: number): FormControl {
    return this.questionsArray.at(qi) as FormControl;
  }

  /** Converts a zero-based answer index to its letter label (A, B, C …). */
  protected letter(ai: number): string {
    return String.fromCharCode(65 + ai);
  }

  /** Adds or removes an answer id from the multi-select control at the given question index. */
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

  /** Returns true when the given answer is currently selected in a multi-select question. */
  protected isChecked(qi: number, answerId: number): boolean {
    const v = this.questionControl(qi).value as number[] | null;
    return Array.isArray(v) && v.includes(answerId);
  }

  /** Collects all selected answer ids and submits the vote to PollService. */
  protected submit(): void {
    if (this.surveyForm.invalid) return;
    const poll = this.poll();
    if (!poll) return;
    this.surveyForm.disable();
    this.justVoted.set(true);
    this.pollService.vote(poll.id, this.collectAnswerIds());
  }

  /** Flattens all selected answer ids across every question into a single array. */
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

  /** Toggles the results accordion between expanded and collapsed. */
  protected toggleResults(): void {
    this.resultsExpanded.update((v) => !v);
  }

  /** Handles the "create new survey" CTA click — navigates to /new after an animation delay. */
  protected onCtaClick(event: Event): void {
    event.preventDefault();
    if (this.ctaClicked()) return;
    this.ctaClicked.set(true);
    setTimeout(() => this.router.navigate(['/new']), 200);
  }
}
