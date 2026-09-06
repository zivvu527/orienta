import assert from 'node:assert/strict';
import test from 'node:test';
import { parseDishExploreResult } from '../server/exploreDish.ts';

function validDishResult(dietaryNotes: string[] | string) {
  return {
    englishName: 'Mapo Tofu',
    chineseName: '麻婆豆腐',
    pinyin: 'má pó dòu fu',
    shortDescription: 'A tofu dish in a savory, spicy sauce.',
    origin: 'Sichuan',
    mainIngredients: ['tofu', 'minced meat'],
    flavorProfile: ['savory', 'spicy'],
    spiceLevel: 'Spicy',
    commonAllergens: ['soy'],
    dietaryNotes,
    howItIsServed: 'Hot with rice.',
    howToEat: 'Eat with rice.',
    portionGuide: 'Usually shared.',
    beginnerFriendly: true,
    orderingPhraseChinese: '我要一份麻婆豆腐。',
    orderingPhrasePinyin: 'Wǒ yào yí fèn mápó dòufu.',
    orderingPhraseEnglish: 'I would like one Mapo Tofu.',
    recognitionStatus: 'recognized',
  };
}

test('keeps dietaryNotes arrays unchanged', () => {
  const dietaryNotes = ['Often contains meat.', 'Ask about preparation.'];
  const result = parseDishExploreResult(validDishResult(dietaryNotes));
  assert.deepEqual(result.dietaryNotes, dietaryNotes);
});

test('normalizes a non-empty dietaryNotes string to one array item', () => {
  const result = parseDishExploreResult(validDishResult('  Often contains meat.  '));
  assert.deepEqual(result.dietaryNotes, ['Often contains meat.']);
});

test('normalizes an empty dietaryNotes string to an empty array', () => {
  const result = parseDishExploreResult(validDishResult('   '));
  assert.deepEqual(result.dietaryNotes, []);
});

test('keeps other array fields strict', () => {
  const candidate = validDishResult([]) as Record<string, unknown>;
  candidate.mainIngredients = 'tofu';
  assert.throws(() => parseDishExploreResult(candidate), /mainIngredients/);
});
