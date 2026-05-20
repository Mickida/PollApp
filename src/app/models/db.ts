export type DbAnswer = {
  id: number;
  question_id: number;
  text: string;
  votes: number;
  position: number;
};

export type DbQuestion = {
  id: number;
  poll_id: number;
  text: string;
  allow_multiple: boolean;
  position: number;
  answers: DbAnswer[];
};

export type DbPoll = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  ends_at: string | null;
  created_at: string;
  questions: DbQuestion[];
};
