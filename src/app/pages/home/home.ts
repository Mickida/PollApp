import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SurveyCard } from '../../components/survey-card/survey-card';
import { PollService } from '../../services/poll.service';

/** Which tab is currently selected in the surveys section. */
type SurveyTab = 'active' | 'past';

/** Home page — hero, ending-soon strip, and the main surveys grid with tab/filter controls. */
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
  /** Prevents the CTA button from being clicked twice during the navigation delay. */
  readonly ctaClicked = signal(false);

  readonly endingSoon = this.pollService.endingSoon;

  readonly selectedTab = signal<SurveyTab>('active');
  readonly sortOpen = signal(false);
  readonly selectedCategory = signal<string | null>(null);

  readonly categories = this.pollService.categories;

  /** Polls shown in the grid — filtered by active/past tab and optional category. */
  readonly displayedPolls = computed(() => {
    const base =
      this.selectedTab() === 'active' ? this.pollService.active() : this.pollService.past();
    const cat = this.selectedCategory();
    return cat ? base.filter((p) => p.category === cat) : base;
  });

  readonly scrollProgress = signal(0);
  /** True when more than 6 polls are displayed, enabling the custom scrollbar. */
  readonly showScrollbar = computed(() => this.displayedPolls().length > 6);

  /** Switches the active/past tab and resets the scroll position. */
  selectTab(tab: SurveyTab, event: MouseEvent): void {
    (event.currentTarget as HTMLButtonElement).blur();
    this.selectedTab.set(tab);
    this.scrollProgress.set(0);
  }

  /** Toggles the category dropdown open/closed. */
  toggleSort(): void {
    this.sortOpen.update((v) => !v);
  }

  /** Selects a category filter; clicking the same category again clears the filter. */
  selectCategory(cat: string): void {
    this.selectedCategory.set(this.selectedCategory() === cat ? null : cat);
    this.sortOpen.set(false);
  }

  /** Tracks the scroll position of the surveys grid to drive the custom scrollbar thumb. */
  onGridScroll(event: Event) {
    const el = event.target as HTMLElement;
    const maxScroll = el.scrollHeight - el.clientHeight;
    this.scrollProgress.set(maxScroll > 0 ? el.scrollTop / maxScroll : 0);
  }

  /** Dismisses the "poll published" success toast. */
  dismissPublishedToast(): void {
    this.pollService.clearPublishedToast();
  }

  /** Handles the hero CTA click — navigates to /new after a short animation delay. */
  onCtaClick(event: Event): void {
    event.preventDefault();
    if (this.ctaClicked()) return;
    this.ctaClicked.set(true);
    setTimeout(() => this.router.navigate(['/new']), 1000);
  }
}
