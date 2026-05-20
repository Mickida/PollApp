/** A single answer option within a poll question. */
export interface PollAnswer {
  id: number;
  text: string;
  votes: number;
}

/** A question belonging to a poll, containing one or more answer options. */
export interface PollQuestion {
  id: number;
  text: string;
  /** When true the user may select more than one answer. */
  allowMultiple: boolean;
  answers: PollAnswer[];
}

/** A poll as used throughout the application. */
export interface Poll {
  id: number;
  title: string;
  description?: string;
  category: string;
  /** Undefined means the poll has no expiry date. */
  endsAt?: Date;
  questions: PollQuestion[];
}
