import type { Phrase } from './types';

export type ShoppingPhrase = Phrase & {
  situation: string;
};

export type ShoppingPhraseGroup = {
  id: string;
  title: string;
  subtitle: string;
  phrases: ShoppingPhrase[];
};

export const shoppingPhraseGroups: ShoppingPhraseGroup[] = [
  {
    id: 'shopping-products',
    title: 'Looking at products',
    subtitle: 'When you are deciding what to buy.',
    phrases: [
      { id: 'shopping-price', category: 'products', english: 'How much is this?', chinese: '这个多少钱？', situation: 'I want to know the price.' },
      { id: 'shopping-recommend', category: 'products', english: 'Can you recommend one?', chinese: '你推荐哪个？', situation: 'I am not sure which one to choose.' },
      { id: 'shopping-popular', category: 'products', english: 'Which one is the most popular?', chinese: '哪个最受欢迎？', situation: 'I want a safe local choice.' },
      { id: 'shopping-see-this', category: 'products', english: 'Can I see this one?', chinese: '我可以看看这个吗？', situation: 'I want to take a closer look.' },
    ],
  },
  {
    id: 'shopping-size-color',
    title: 'Size and color',
    subtitle: 'When the item is not quite right.',
    phrases: [
      { id: 'shopping-size', category: 'size-color', english: 'Do you have another size?', chinese: '有其他尺码吗？', situation: 'I need a different size.' },
      { id: 'shopping-color', category: 'size-color', english: 'Do you have another color?', chinese: '有其他颜色吗？', situation: 'I want another color.' },
      { id: 'shopping-try-on', category: 'size-color', english: 'Can I try this on?', chinese: '我可以试穿吗？', situation: 'I want to try it before buying.' },
      { id: 'shopping-fitting-room', category: 'size-color', english: 'Where is the fitting room?', chinese: '试衣间在哪里？', situation: 'I need to try clothes on.' },
    ],
  },
  {
    id: 'shopping-payment',
    title: 'Price and payment',
    subtitle: 'When you are ready to pay.',
    phrases: [
      { id: 'shopping-discount', category: 'payment', english: 'Is there any discount?', chinese: '有优惠吗？', situation: 'I want to ask about discounts.' },
      { id: 'shopping-cheaper', category: 'payment', english: 'Can it be a little cheaper?', chinese: '可以便宜一点吗？', situation: 'I am shopping at a market or small shop.' },
      { id: 'shopping-alipay', category: 'payment', english: 'Can I pay with Alipay?', chinese: '可以用支付宝吗？', situation: 'I want to pay with Alipay.' },
      { id: 'shopping-wechat-pay', category: 'payment', english: 'Can I pay with WeChat Pay?', chinese: '可以用微信支付吗？', situation: 'I want to pay with WeChat Pay.' },
      { id: 'shopping-no-bag', category: 'payment', english: "I don't need a bag.", chinese: '我不需要袋子。', situation: 'I want to avoid an extra bag.' },
    ],
  },
];
