import OpenAI from 'openai';
import { DishExploreResultSchema, dishExploreJsonSchema } from './types';

const DEFAULT_TIMEOUT_MS = 35_000;

const dishInstructions = [
  'You are helping an international traveler in China understand one Chinese dish before ordering.',
  'Use simple, natural English. Avoid complex cooking terms unless you explain them plainly.',
  'If the dish is unclear, misspelled, too broad, or impossible to identify, set recognitionStatus to "unable_to_confirm".',
  'If the dish is likely but not certain, set recognitionStatus to "uncertain" and clearly use words like usually, often, may, or can.',
  'Do not invent exact ingredients, allergens, origin, or spiciness. Many dishes vary by region and restaurant.',
  'For allergens and dietary notes, use cautious wording such as Often contains, May contain, or Ask the restaurant to confirm.',
  'If a dish varies a lot by region or restaurant, mention that in dietaryNotes or shortDescription.',
  'Return JSON only and include every requested field.',
].join(' ');

export async function exploreDish(dishName: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MENU_MODEL;
  const baseURL = process.env.OPENAI_BASE_URL;
  const apiMode = process.env.OPENAI_API_MODE ?? 'responses';

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  if (!model) {
    throw new Error('OPENAI_MENU_MODEL is not configured.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const rawText = apiMode === 'chat'
      ? await exploreWithChatCompletions(apiKey, baseURL, model, dishName, controller.signal)
      : await exploreWithResponses(apiKey, baseURL, model, dishName, controller.signal);

    const parsed = JSON.parse(extractJsonText(rawText));
    return DishExploreResultSchema.parse(parsed);
  } finally {
    clearTimeout(timeout);
  }
}

async function exploreWithResponses(
  apiKey: string,
  baseURL: string | undefined,
  model: string,
  dishName: string,
  signal: AbortSignal,
) {
  const client = new OpenAI({
    apiKey,
    baseURL: baseURL || undefined,
  });

  const response = await client.responses.create(
    {
      model,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `${dishInstructions} Dish name: ${dishName}`,
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'dish_explainer',
          strict: true,
          schema: dishExploreJsonSchema,
        },
      },
    },
    { signal },
  );

  if (!response.output_text) {
    throw new Error('OpenAI returned no output_text.');
  }

  return response.output_text;
}

async function exploreWithChatCompletions(
  apiKey: string,
  baseURL: string | undefined,
  model: string,
  dishName: string,
  signal: AbortSignal,
) {
  if (!baseURL) {
    throw new Error('OPENAI_BASE_URL is required when OPENAI_API_MODE=chat.');
  }

  const response = await fetch(`${baseURL.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'BackpackInChinaLocal/1.0',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [
            dishInstructions,
            `Dish name: ${dishName}`,
            'Return JSON only. The JSON must match this shape:',
            '{"englishName":"string","chineseName":"string","pinyin":"string","shortDescription":"string","origin":"string","mainIngredients":["string"],"flavorProfile":["string"],"spiceLevel":"Not spicy|Mild|Medium|Spicy|Very spicy","commonAllergens":["string"],"dietaryNotes":["string"],"howItIsServed":"string","howToEat":"string","portionGuide":"string","beginnerFriendly":true,"orderingPhraseChinese":"string","orderingPhrasePinyin":"string","orderingPhraseEnglish":"string","recognitionStatus":"recognized|uncertain|unable_to_confirm"}',
          ].join(' '),
        },
      ],
      response_format: { type: 'json_object' },
    }),
    signal,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Dish exploration failed with status ${response.status}: ${text.slice(0, 300)}`);
  }

  const parsed = JSON.parse(text);
  const content = parsed?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Dish exploration returned no message content.');
  }

  return content;
}

function extractJsonText(rawText: string) {
  const trimmed = rawText.trim();
  if (!trimmed.startsWith('```')) {
    return trimmed;
  }

  return trimmed
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
}
