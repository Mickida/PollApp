export interface Poll {
  id: number;
  title: string;
  description?: string;
  category: string;
  endsAt?: Date;
  questions: PollQuestion[];
}

export interface PollQuestion {
  id: number;
  text: string;
  allowMultiple: boolean;
  answers: PollAnswer[];
}

export interface PollAnswer {
  id: number;
  text: string;
  votes: number;
}
