import type { CategoryLabel, Phrase } from '../../../data/types';

export const hotelCategoryLabels: CategoryLabel[] = [{ id: 'hotel', label: 'Hotel Phrases' }];

export const hotelPhrases: Phrase[] = [
  { id: 'hotel-reservation', category: 'hotel', english: 'I have a reservation.', chinese: '我有预订。' },
  { id: 'hotel-passport', category: 'hotel', english: 'Here is my passport.', chinese: '这是我的护照。' },
  { id: 'hotel-wifi', category: 'hotel', english: 'What is the Wi-Fi password?', chinese: 'Wi-Fi密码是多少？' },
  { id: 'hotel-towel', category: 'hotel', english: 'I need another towel.', chinese: '我需要一条毛巾。' },
  {
    id: 'hotel-ac',
    category: 'hotel',
    english: 'The air conditioner is not working.',
    chinese: '空调坏了。',
  },
  { id: 'hotel-noisy', category: 'hotel', english: 'The room is too noisy.', chinese: '房间太吵了。' },
  {
    id: 'hotel-late-checkout',
    category: 'hotel',
    english: 'I would like a late check-out.',
    chinese: '我想延迟退房。',
  },
  { id: 'hotel-luggage', category: 'hotel', english: 'Can you store my luggage?', chinese: '可以帮我寄存行李吗？' },
  { id: 'hotel-taxi', category: 'hotel', english: 'Please call a taxi for me.', chinese: '请帮我叫一辆出租车。' },
];
