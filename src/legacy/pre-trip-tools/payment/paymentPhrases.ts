import type { CategoryLabel, Phrase } from '../../../data/types';

export const paymentCategoryLabels: CategoryLabel[] = [{ id: 'payment', label: 'Payment Phrases' }];

export const paymentPhrases: Phrase[] = [
  { id: 'payment-alipay', category: 'payment', english: 'Can I pay with Alipay?', chinese: '可以用支付宝吗？' },
  { id: 'payment-wechat', category: 'payment', english: 'Can I pay with WeChat Pay?', chinese: '可以用微信支付吗？' },
  { id: 'payment-card', category: 'payment', english: 'Can I pay by card?', chinese: '可以刷卡吗？' },
  { id: 'payment-cash', category: 'payment', english: 'Can I pay with cash?', chinese: '可以用现金吗？' },
  { id: 'payment-failed', category: 'payment', english: 'The payment failed.', chinese: '支付失败了。' },
  { id: 'payment-try-again', category: 'payment', english: 'Please try again.', chinese: '请再试一次。' },
  {
    id: 'payment-went-through',
    category: 'payment',
    english: 'Did the payment go through?',
    chinese: '付款成功了吗？',
  },
  { id: 'payment-paid', category: 'payment', english: 'I have already paid.', chinese: '我已经付款了。' },
];
