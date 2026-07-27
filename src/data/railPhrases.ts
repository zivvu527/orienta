import type { CategoryLabel, Phrase } from './types';

export type RailPhrase = Phrase & {
  situation: string;
};

export type RailPhraseGroup = {
  id: string;
  title: string;
  subtitle: string;
  phrases: RailPhrase[];
};

export const railPhraseGroups: RailPhraseGroup[] = [
  {
    id: 'rail-place',
    title: 'Finding the right place',
    subtitle: 'When you are not sure where to wait or go next.',
    phrases: [
      { id: 'rail-wait', category: 'place', english: 'Where should I wait?', chinese: '我应该在哪里等车？', situation: 'I need to know where to wait.' },
      { id: 'rail-platform', category: 'place', english: 'Is this the correct platform?', chinese: '请问这是正确的站台吗？', situation: 'I want to make sure I am in the right place.' },
      { id: 'rail-find-train', category: 'place', english: 'Can you help me find this train?', chinese: '可以帮我找一下这趟车吗？', situation: 'I need staff to check my train.' },
    ],
  },
  {
    id: 'rail-boarding',
    title: 'Boarding',
    subtitle: 'When it is almost time to get on the train.',
    phrases: [
      { id: 'rail-boarding-started', category: 'boarding', english: 'Has boarding started?', chinese: '开始检票了吗？', situation: 'I am not sure if I can enter yet.' },
      { id: 'rail-correct-train', category: 'boarding', english: 'Is this the correct train?', chinese: '请问是这趟车吗？', situation: 'I want to confirm before boarding.' },
      { id: 'rail-coach', category: 'boarding', english: 'Can you help me find my coach?', chinese: '可以帮我找一下我的车厢吗？', situation: 'I need help finding the right coach.' },
    ],
  },
  {
    id: 'rail-seat',
    title: 'On the train',
    subtitle: 'When you are finding your place inside.',
    phrases: [
      { id: 'rail-my-seat', category: 'seat', english: 'Is this my seat?', chinese: '请问这是我的座位吗？', situation: 'I want to confirm my seat.' },
      { id: 'rail-find-seat', category: 'seat', english: 'Can you help me find my seat?', chinese: '可以帮我找一下我的座位吗？', situation: 'I cannot find my seat.' },
    ],
  },
  {
    id: 'rail-problems',
    title: 'Problems',
    subtitle: 'When something does not feel right.',
    phrases: [
      { id: 'rail-missed', category: 'problems', english: 'I missed my train.', chinese: '我错过了这趟车。', situation: 'I need help after missing the train.' },
      { id: 'rail-take-this', category: 'problems', english: 'Can I take this train?', chinese: '我可以坐这趟车吗？', situation: 'I need staff to confirm.' },
      { id: 'rail-check-ticket', category: 'problems', english: 'Please help me check this ticket.', chinese: '请帮我看一下这张车票。', situation: 'I want staff to check my ticket.' },
    ],
  },
];

export const railCategoryLabels: CategoryLabel[] = railPhraseGroups.map((group) => ({
  id: group.id,
  label: group.title,
}));

export const railPhrases: Phrase[] = railPhraseGroups.flatMap((group) =>
  group.phrases.map((phrase) => ({ ...phrase, category: group.id })),
);
