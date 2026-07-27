export type Phrase = {
  id: string;
  category: string;
  english: string;
  chinese: string;
  notes?: string;
  mostUsed?: boolean;
};

export type CategoryLabel = {
  id: string;
  label: string;
};
