import type { CategoryLabel, Phrase } from '../../../data/types';

export const hospitalCategoryLabels: CategoryLabel[] = [
  { id: 'symptoms', label: 'Describe Symptoms' },
  { id: 'hospital', label: 'Hospital Phrases' },
];

export const hospitalPhrases: Phrase[] = [
  { id: 'hospital-fever', category: 'symptoms', english: 'I have a fever.', chinese: '我发烧了。' },
  { id: 'hospital-headache', category: 'symptoms', english: 'I have a headache.', chinese: '我头疼。' },
  { id: 'hospital-stomach', category: 'symptoms', english: 'I have stomach pain.', chinese: '我肚子疼。' },
  { id: 'hospital-chest', category: 'symptoms', english: 'I have chest pain.', chinese: '我胸口疼。' },
  { id: 'hospital-dizzy', category: 'symptoms', english: 'I feel dizzy.', chinese: '我头晕。' },
  {
    id: 'hospital-breathing',
    category: 'symptoms',
    english: 'I have difficulty breathing.',
    chinese: '我呼吸困难。',
    notes: 'High-risk symptom. Seek urgent medical help.',
  },
  { id: 'hospital-injury', category: 'symptoms', english: 'I am injured.', chinese: '我受伤了。' },
  {
    id: 'hospital-allergic-reaction',
    category: 'symptoms',
    english: 'I am having an allergic reaction.',
    chinese: '我出现过敏反应了。',
    notes: 'High-risk symptom. Seek urgent medical help.',
  },
  { id: 'hospital-doctor', category: 'hospital', english: 'I need a doctor.', chinese: '我需要医生。' },
  {
    id: 'hospital-english-doctor',
    category: 'hospital',
    english: 'I need an English-speaking doctor.',
    chinese: '我需要一位会说英语的医生。',
  },
  {
    id: 'hospital-medicine-allergy',
    category: 'hospital',
    english: 'I am allergic to this medicine.',
    chinese: '我对这种药过敏。',
  },
  {
    id: 'hospital-taking-medicine',
    category: 'hospital',
    english: 'I am taking this medication.',
    chinese: '我正在服用这种药。',
  },
  { id: 'hospital-register', category: 'hospital', english: 'Where should I register?', chinese: '我应该在哪里挂号？' },
  {
    id: 'hospital-ambulance',
    category: 'hospital',
    english: 'Please call an ambulance.',
    chinese: '请帮我叫救护车。',
    notes: 'Use for urgent situations.',
  },
];
