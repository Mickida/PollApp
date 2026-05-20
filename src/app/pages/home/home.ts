import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SurveyCard } from '../../components/survey-card/survey-card';
import { PollService } from '../../services/poll.service';

type SurveyTab = 'active' | 'past';

@Component({
  selector: 'app-home',
  imports: [SurveyCard],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private pollService = inject(PollService);
  private router = inject(Router);

  readonly recentlyPublishedTitle = this.pollService.recentlyPublishedTitle;
  readonly ctaClicked = signal(false);

  readonly endingSoon = this.pollService.endingSoon;

  readonly selectedTab = signal<SurveyTab>('active');
  readonly sortOpen = signal(false);
  readonly selectedCategory = signal<string | null>(null);

  readonly categories = this.pollService.categories;

  readonly displayedPolls = computed(() => {
    const base =
      this.selectedTab() === 'active' ? this.pollService.active() : this.pollService.past();
    const cat = this.selectedCategory();
    return cat ? base.filter((p) => p.category === cat) : base;
  });

  readonly scrollProgress = signal(0);
  readonly showScrollbar = computed(() => this.displayedPolls().length > 6);

  selectTab(tab: SurveyTab, event: MouseEvent): void {
    (event.currentTarget as HTMLButtonElement).blur();
    this.selectedTab.set(tab);
    this.scrollProgress.set(0);
  }

  toggleSort(): void {
    this.sortOpen.update((v) => !v);
  }

  selectCategory(cat: string): void {
    this.selectedCategory.set(this.selectedCategory() === cat ? null : cat);
    this.sortOpen.set(false);
  }

  onGridScroll(event: Event) {
    const el = event.target as HTMLElement;
    const maxScroll = el.scrollHeight - el.clientHeight;
    this.scrollProgress.set(maxScroll > 0 ? el.scrollTop / maxScroll : 0);
  }

  dismissPublishedToast(): void {
    this.pollService.clearPublishedToast();
  }

  onCtaClick(event: Event): void {
    event.preventDefault();
    if (this.ctaClicked()) return;
    this.ctaClicked.set(true);
    setTimeout(() => this.router.navigate(['/new']), 1000);
  }
}
