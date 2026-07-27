import type { Phrase } from './types';

export type QuickPhrase = Phrase & {
  situation: string;
};

export type QuickPhraseGroup = {
  id: string;
  title: string;
  subtitle: string;
  phrases: QuickPhrase[];
};

export const quickPhraseGroups: QuickPhraseGroup[] = [
  {
    id: 'first-words',
    title: 'First words',
    subtitle: 'Small phrases for starting politely.',
    phrases: [
      { id: 'quick-hello', category: 'first-words', english: 'Hello.', chinese: '你好。', situation: 'I want to greet someone.' },
      { id: 'quick-excuse-me', category: 'first-words', english: 'Excuse me.', chinese: '不好意思。', situation: 'I need to get someone’s attention.' },
      { id: 'quick-thanks', category: 'first-words', english: 'Thank you.', chinese: '谢谢。', situation: 'I want to say thanks.' },
      { id: 'quick-sorry', category: 'first-words', english: 'Sorry.', chinese: '对不起。', situation: 'I want to apologize.' },
    ],
  },
  {
    id: 'understanding',
    title: 'Understanding',
    subtitle: 'When communication is getting difficult.',
    phrases: [
      { id: 'quick-no-chinese', category: 'understanding', english: "I don’t understand Chinese.", chinese: '我听不懂中文。', situation: 'I need them to know I don’t understand.' },
      { id: 'quick-english', category: 'understanding', english: 'Can you speak English?', chinese: '你会说英语吗？', situation: 'I need to ask about English.' },
      { id: 'quick-slowly', category: 'understanding', english: 'Please speak more slowly.', chinese: '请说慢一点。', situation: 'They are speaking too fast.' },
      { id: 'quick-show-me', category: 'understanding', english: 'Please show me.', chinese: '请给我看一下。', situation: 'I need to see it instead.' },
      { id: 'quick-write', category: 'understanding', english: 'Please write it down.', chinese: '请写下来。', situation: 'I need the information written.' },
    ],
  },
  {
    id: 'getting-help',
    title: 'Getting help',
    subtitle: 'Useful when you are unsure what to do next.',
    phrases: [
      { id: 'quick-help', category: 'getting-help', english: 'I need help.', chinese: '我需要帮助。', situation: 'I need someone to help me.' },
      { id: 'quick-can-you-help', category: 'getting-help', english: 'Can you help me?', chinese: '可以帮我一下吗？', situation: 'I want to ask for help politely.' },
      { id: 'quick-place', category: 'getting-help', english: 'Where is this place?', chinese: '这个地方在哪里？', situation: 'I need help finding a place.' },
      { id: 'quick-restroom', category: 'getting-help', english: 'Where is the restroom?', chinese: '洗手间在哪里？', situation: 'I need to find a restroom.' },
      { id: 'quick-wait', category: 'getting-help', english: 'Please wait.', chinese: '请稍等。', situation: 'I need a moment.' },
      { id: 'quick-how-long', category: 'getting-help', english: 'How long will it take?', chinese: '需要多长时间？', situation: 'I need to know the wait time.' },
    ],
  },
];

export const quickPhrases: QuickPhrase[] = quickPhraseGroups.flatMap((group) => group.phrases);
