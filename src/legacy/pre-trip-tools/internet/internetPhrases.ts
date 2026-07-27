import type { CategoryLabel, Phrase } from '../../../data/types';

export const internetCategoryLabels: CategoryLabel[] = [{ id: 'internet', label: 'Troubleshooting' }];

export const internetPhrases: Phrase[] = [
  { id: 'internet-no-signal', category: 'internet', english: 'I have no signal.', chinese: '我的手机没有信号。' },
  { id: 'internet-wifi-broken', category: 'internet', english: 'Wi-Fi is not working.', chinese: 'Wi-Fi不能用。' },
  {
    id: 'internet-code',
    category: 'internet',
    english: 'I cannot receive a verification code.',
    chinese: '我收不到验证码。',
  },
  {
    id: 'internet-help-wifi',
    category: 'internet',
    english: 'I need help connecting to Wi-Fi.',
    chinese: '我需要帮忙连接Wi-Fi。',
  },
];
