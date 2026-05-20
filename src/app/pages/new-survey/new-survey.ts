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
export class NewSurvey {
  private readonly fb = inject(FormBuilder);
  private readonly pollService = inject(PollService);
  private readonly router = inject(Router);

  readonly categories = this.pollService.categories;
  readonly catOpen = signal(false);
  readonly showToast = signal(false);

  toggleCatDropdown(): void {
    this.catOpen.update((v) => !v);
  }

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

  get questions(): FormArray {
    return this.surveyForm.get('questions') as FormArray;
  }

  questionAt(index: number): FormGroup {
    return this.questions.at(index) as FormGroup;
  }

  answersAt(qIndex: number): FormArray {
    return this.questionAt(qIndex).get('answers') as FormArray;
  }

  addQuestion(): void {
    if (this.questions.length < 10) {
      this.questions.push(this.buildQuestion());
    }
  }

  removeQuestion(index: number): void {
    if (this.questions.length > 1) {
      this.questions.removeAt(index);
    }
  }

  addAnswer(qIndex: number): void {
    const answers = this.answersAt(qIndex);
    if (answers.length < 6) {
      answers.push(this.fb.control('', { validators: [requiredText(1)] }));
    }
  }

  removeAnswer(qIndex: number, aIndex: number): void {
    const answers = this.answersAt(qIndex);
    if (answers.length > 2) {
      answers.removeAt(aIndex);
    }
  }

  onCancel(): void {
    setTimeout(() => this.router.navigate(['/']), 180);
  }

  onPublish(): void {
    this.surveyForm.markAllAsTouched();
    if (this.surveyForm.invalid) return;
    this.pollService.addPoll(this.buildAddPollInput());
    this.showToast.set(true);
    setTimeout(() => this.router.navigate(['/']), 2500);
  }

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

  closeToast(): void {
    this.showToast.set(false);
    this.router.navigate(['/']);
  }

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
