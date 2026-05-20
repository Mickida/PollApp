import { Injectable, computed, signal } from '@angular/core';
import { Poll, PollQuestion } from '../models/poll';
import { DbPoll, DbQuestion } from '../models/db';
import { supabase } from './supabase-client';

@Injectable({
  providedIn: 'root',
})
export class PollService {
  readonly categories = [
    'Team activities',
    'Health & Wellness',
    'Gaming & Entertainment',
    'Healthy Lifestyle',
    'Food & Drink',
    'Workplace',
    'Books & Media',
  ] as const;

  readonly recentlyPublishedTitle = signal<string | null>(null);
  readonly loaded = signal(false);
  readonly polls = signal<Poll[]>([]);

  readonly active = computed(() =>
    this.polls().filter((p) => !p.endsAt || p.endsAt.getTime() > Date.now()),
  );

  readonly past = computed(() =>
    this.polls().filter((p) => p.endsAt !== undefined && p.endsAt.getTime() <= Date.now()),
  );

  readonly endingSoon = computed(() =>
    this.active()
      .filter((p): p is Poll & { endsAt: Date } => p.endsAt !== undefined)
      .sort((a, b) => a.endsAt.getTime() - b.endsAt.getTime())
      .slice(0, 3),
  );

  constructor() {
    this.loadAll();
    this.subscribeRealtime();
  }

  getPollById(id: number): Poll | undefined {
    return this.polls().find((p) => p.id === id);
  }

  async addPoll(input: {
    name: string;
    description?: string;
    category: string;
    endDate?: string;
    questions: { text: string; allowMultiple: boolean; answers: string[] }[];
  }): Promise<void> {
    const pollId = await this.insertPoll(input);
    if (pollId === null) return;
    for (let qi = 0; qi < input.questions.length; qi++) {
      const ok = await this.insertQuestion(pollId, input.questions[qi], qi + 1);
      if (!ok) return;
    }
  }

  clearPublishedToast(): void {
    this.recentlyPublishedTitle.set(null);
  }

  hasVoted(pollId: number): boolean {
    return localStorage.getItem(`pollapp:voted:${pollId}`) === 'true';
  }

  markAsVoted(pollId: number): void {
    localStorage.setItem(`pollapp:voted:${pollId}`, 'true');
  }

  async vote(pollId: number, answerIds: number[]): Promise<void> {
    const poll = this.getPollById(pollId);
    if (!poll) {
      console.error('Vote failed — poll not found', pollId);
      return;
    }
    const votesMap = this.buildVotesMap(poll);
    for (const answerId of answerIds) {
      const ok = await this.incrementVote(answerId, votesMap);
      if (!ok) return;
    }
    this.markAsVoted(pollId);
  }

  private async insertPoll(input: {
    name: string;
    description?: string;
    category: string;
    endDate?: string;
  }): Promise<number | null> {
    const { data: poll, error } = await supabase
      .from('polls')
      .insert({
        title: input.name,
        description: input.description ?? null,
        category: input.category,
        ends_at: input.endDate ? new Date(input.endDate).toISOString() : null,
      })
      .select()
      .single();
    if (error || !poll) {
      console.error('Insert poll failed', error);
      return null;
    }
    return poll.id;
  }

  private async insertQuestion(
    pollId: number,
    q: { text: string; allowMultiple: boolean; answers: string[] },
    position: number,
  ): Promise<boolean> {
    const { data: question, error } = await supabase
      .from('questions')
      .insert({ poll_id: pollId, text: q.text, allow_multiple: q.allowMultiple, position })
      .select()
      .single();
    if (error || !question) {
      console.error('Insert question failed', error);
      return false;
    }
    return this.insertAnswers(question.id, q.answers);
  }

  private async insertAnswers(questionId: number, answers: string[]): Promise<boolean> {
    const payload = answers.map((text, ai) => ({
      question_id: questionId,
      text,
      position: ai + 1,
    }));
    const { error } = await supabase.from('answers').insert(payload);
    if (error) {
      console.error('Insert answers failed', error);
      return false;
    }
    return true;
  }

  private buildVotesMap(poll: Poll): Map<number, number> {
    const map = new Map<number, number>();
    for (const q of poll.questions) {
      for (const a of q.answers) {
        map.set(a.id, a.votes);
      }
    }
    return map;
  }

  private async incrementVote(answerId: number, votesMap: Map<number, number>): Promise<boolean> {
    const current = votesMap.get(answerId);
    if (current === undefined) {
      console.error('Vote failed — answer not in poll', answerId);
      return true;
    }
    const { error } = await supabase
      .from('answers')
      .update({ votes: current + 1 })
      .eq('id', answerId);
    if (error) {
      console.error('Vote update failed', error);
      return false;
    }
    return true;
  }

  private async loadAll(): Promise<void> {
    const { data, error } = await supabase
      .from('polls')
      .select('*, questions(*, answers(*))')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Load polls failed', error);
      return;
    }
    this.polls.set((data ?? []).map((p) => this.mapDbPoll(p as DbPoll)));
    this.loaded.set(true);
  }

  private mapDbPoll(p: DbPoll): Poll {
    return {
      id: p.id,
      title: p.title,
      description: p.description ?? undefined,
      category: p.category,
      endsAt: p.ends_at ? new Date(p.ends_at) : undefined,
      questions: (p.questions ?? [])
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((q) => this.mapDbQuestion(q)),
    };
  }

  private mapDbQuestion(q: DbQuestion): PollQuestion {
    return {
      id: q.id,
      text: q.text,
      allowMultiple: q.allow_multiple,
      answers: (q.answers ?? [])
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((ans) => ({ id: ans.id, text: ans.text, votes: ans.votes })),
    };
  }

  private subscribeRealtime(): void {
    supabase
      .channel('polls-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, () =>
        this.loadAll(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, () =>
        this.loadAll(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'answers' }, () =>
        this.loadAll(),
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('Realtime channel error');
        }
      });
  }
}
