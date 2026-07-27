import type { CategoryLabel, Phrase } from '../../../data/types';

export const taxiCategoryLabels: CategoryLabel[] = [{ id: 'taxi', label: 'Taxi Phrases' }];

export const taxiPhrases: Phrase[] = [
  { id: 'taxi-meter', category: 'taxi', english: 'Please use the meter.', chinese: '请打表。' },
  { id: 'taxi-stop-here', category: 'taxi', english: 'Please stop here.', chinese: '请在这里停车。' },
  { id: 'taxi-wait', category: 'taxi', english: 'Please wait for me.', chinese: '请等我一下。' },
  { id: 'taxi-hurry', category: 'taxi', english: "I'm in a hurry.", chinese: '我赶时间。' },
  {
    id: 'taxi-pickup',
    category: 'taxi',
    english: 'I cannot find the pickup point.',
    chinese: '我找不到上车点。',
  },
  { id: 'taxi-highway', category: 'taxi', english: 'Please take the highway.', chinese: '请走高速。' },
  {
    id: 'taxi-correct-destination',
    category: 'taxi',
    english: 'Is this the correct destination?',
    chinese: '是这里吗？',
  },
  { id: 'taxi-pay-app', category: 'taxi', english: 'I will pay in the app.', chinese: '我会在手机上付款。' },
];
