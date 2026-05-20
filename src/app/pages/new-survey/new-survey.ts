import { Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PollService } from '../../services/poll.service';
import {
  arrayLength,
  futureDate,
  requiredCategory,
  requiredText,
  uniqueAnswers,
} from '../../validators/survey-validators';

@Component({
  selector: 'app-new-survey',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './new-survey.html',
  styleUrl: './new-survey.css',
})
/** Page for creating a new poll — handles the reactive form and publishes to Supabase via PollService. */
export class NewSurvey {
  private readonly fb = inject(FormBuilder);
  private readonly pollService = inject(PollService);
  private readonly router = inject(Router);

  readonly categories = this.pollService.categories;
  readonly today = new Date().toISOString().split('T')[0];
  readonly catOpen = signal(false);
  /** Controls visibility of the "poll published" success toast. */
  readonly showToast = signal(false);

  /** Toggles the category dropdown open/closed. */
  toggleCatDropdown(): void {
    this.catOpen.update((v) => !v);
  }

  /** Sets the selected category value and closes the dropdown. */
  selectCat(cat: string): void {
    this.surveyForm.controls.category.setValue(cat);
    this.surveyForm.controls.category.markAsTouched();
    this.catOpen.set(false);
  }

  readonly surveyForm = this.fb.group({
    name: this.fb.control('', { validators: [requiredText(3)] }),
    description: this.fb.control(''),
    endDate: this.fb.control('', { validators: [futureDate] }),
    category: this.fb.control('', {
      validators: [requiredCategory(this.pollService.categories)],
    }),
    questions: this.fb.array([this.buildQuestion()], {
      validators: [arrayLength(1, 10)],
    }),
  });

  /** Returns the questions FormArray from the top-level form group. */
  get questions(): FormArray {
    return this.surveyForm.get('questions') as FormArray;
  }

  /** Returns the FormGroup at the given question index. */
  questionAt(index: number): FormGroup {
    return this.questions.at(index) as FormGroup;
  }

  /** Returns the answers FormArray for the question at the given index. */
  answersAt(qIndex: number): FormArray {
    return this.questionAt(qIndex).get('answers') as FormArray;
  }

  /** Appends a new blank question (max 10). */
  addQuestion(): void {
    if (this.questions.length < 10) {
      this.questions.push(this.buildQuestion());
    }
  }

  /** Removes the question at the given index (at least 1 question must remain). */
  removeQuestion(index: number): void {
    if (this.questions.length > 1) {
      this.questions.removeAt(index);
    }
  }

  /** Appends a new blank answer to the given question (max 6 answers). */
  addAnswer(qIndex: number): void {
    const answers = this.answersAt(qIndex);
    if (answers.length < 6) {
      answers.push(this.fb.control('', { validators: [requiredText(1)] }));
    }
  }

  /** Removes the answer at the given index (at least 2 answers must remain). */
  removeAnswer(qIndex: number, aIndex: number): void {
    const answers = this.answersAt(qIndex);
    if (answers.length > 2) {
      answers.removeAt(aIndex);
    }
  }

  /** Navigates back to the home page after a short exit-animation delay. */
  onCancel(): void {
    setTimeout(() => this.router.navigate(['/']), 100);
  }

  /** Validates the form, persists the poll, shows the toast, then redirects home. */
  onPublish(): void {
    this.surveyForm.markAllAsTouched();
    if (this.surveyForm.invalid) return;
    this.pollService.addPoll(this.buildAddPollInput());
    this.showToast.set(true);
    setTimeout(() => this.router.navigate(['/']), 2500);
  }

  /** Maps the raw form value to the shape expected by PollService.addPoll. */
  private buildAddPollInput() {
    const value = this.surveyForm.getRawValue();
    return {
      name: (value.name ?? '').trim(),
      description: value.description?.trim() || undefined,
      category: value.category ?? '',
      endDate: value.endDate || undefined,
      questions: (value.questions ?? []).map((q) => ({
        text: (q['text'] ?? '').trim(),
        allowMultiple: q['allowMultiple'] ?? false,
        answers: (q['answers'] ?? []).map((a: string) => (a ?? '').trim()),
      })),
    };
  }

  /** Closes the toast and navigates home. */
  closeToast(): void {
    this.showToast.set(false);
    this.router.navigate(['/']);
  }

  /** Builds a blank question FormGroup with two empty answer controls. */
  private buildQuestion(): FormGroup {
    return this.fb.group({
      text: this.fb.control('', { validators: [requiredText(3)] }),
      allowMultiple: this.fb.control(false),
      answers: this.fb.array(
        [
          this.fb.control('', { validators: [requiredText(1)] }),
          this.fb.control('', { validators: [requiredText(1)] }),
        ],
        { validators: [arrayLength(2, 6), uniqueAnswers] },
      ),
    });
  }
}
