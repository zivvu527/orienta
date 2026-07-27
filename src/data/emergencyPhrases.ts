import type { CategoryLabel, Phrase } from './types';

export const emergencyCategoryLabels: CategoryLabel[] = [{ id: 'emergency', label: 'Emergency Phrases' }];

export const emergencyPhrases: Phrase[] = [
  { id: 'emergency-police', category: 'emergency', english: 'I need the police.', chinese: '我需要警察。' },
  {
    id: 'emergency-ambulance',
    category: 'emergency',
    english: 'Please call an ambulance.',
    chinese: '请帮我叫救护车。',
  },
  { id: 'emergency-passport', category: 'emergency', english: 'My passport is missing.', chinese: '我的护照丢了。' },
  { id: 'emergency-phone', category: 'emergency', english: 'My phone was stolen.', chinese: '我的手机被偷了。' },
  {
    id: 'emergency-embassy',
    category: 'emergency',
    english: 'Please help me contact my embassy.',
    chinese: '请帮我联系我的大使馆。',
  },
];
