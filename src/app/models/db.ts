/** Raw answer row returned by Supabase. */
export type DbAnswer = {
  id: number;
  question_id: number;
  text: string;
  votes: number;
  position: number;
};

/** Raw question row returned by Supabase, including its nested answers. */
export type DbQuestion = {
  id: number;
  poll_id: number;
  text: string;
  allow_multiple: boolean;
  position: number;
  answers: DbAnswer[];
};

/** Raw poll row returned by Supabase, including its nested questions. */
export type DbPoll = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  ends_at: string | null;
  created_at: string;
  questions: DbQuestion[];
};
