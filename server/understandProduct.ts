import OpenAI from 'openai';
import { ProductUnderstandResultSchema, productUnderstandJsonSchema } from './types';

const DEFAULT_TIMEOUT_MS = 45_000;

const productInstructions = [
  'You help international travelers in China understand a product from a photo.',
  'The product may be a snack, drink, medicine, skincare product, cosmetic, daily good, supermarket item, or souvenir.',
  'Read visible package text and visual clues. Return only structured JSON.',
  'Do not invent ingredients, allergens, medical effects, warnings, alcohol, caffeine, sugar, or usage details.',
  'If the image is unclear or not a product, set recognitionStatus to "unable_to_recognize".',
  'If some details are visible but uncertain, set recognitionStatus to "uncertain", confidence to "low" or "medium", and use notes for practical uncertainty only.',
  'Use simple natural English for travelers. Avoid technical wording.',
  'For food and snacks, focus on what it is, ingredients visible or strongly indicated, allergens, flavor, and goodFor.',
  'For drinks, focus on flavor, sugar, caffeine, and alcohol if visible or clearly indicated.',
  'For medicine, explain what it appears to be, how the package says it is used if visible, and warnings. Do not give diagnosis, dosage advice, or medical recommendations.',
  'For skincare and cosmetics, explain what it does, skin type if visible, and key ingredients if visible.',
  'Allergen and ingredient information may be incomplete. Mark uncertainty clearly.',
  'source and OCR analysis notes are internal; do not include them.',
  'recognitionStatus must be exactly one of: "recognized", "uncertain", "unable_to_recognize".',
  'category must be exactly one of: "food", "drink", "medicine", "skincare", "cosmetics", "daily_goods", "souvenir", "unknown".',
  'productName, originalName, description, flavor, sugar, caffeine, alcohol, whatItIs, howToUse, whatItDoes, and skinType must be strings, not arrays.',
  'notes, ingredients, allergens, warnings, goodFor, and keyIngredients must always be arrays of strings.',
  'Return strict JSON only. Do not output Markdown.',
].join(' ');

export async function understandProductImage(file: Express.Multer.File) {
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
    const imageUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const rawText = apiMode === 'chat'
      ? await understandWithChatCompletions(apiKey, baseURL, model, imageUrl, controller.signal)
      : await understandWithResponses(apiKey, baseURL, model, imageUrl, controller.signal);

    const parsed = JSON.parse(extractJsonText(rawText));
    return ProductUnderstandResultSchema.parse(normalizeProductResult(parsed));
  } finally {
    clearTimeout(timeout);
  }
}

async function understandWithResponses(
  apiKey: string,
  baseURL: string | undefined,
  model: string,
  imageUrl: string,
  signal: AbortSignal,
) {
  const client = new OpenAI({ apiKey, baseURL: baseURL || undefined });
  const response = await client.responses.create(
    {
      model,
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: productInstructions },
            { type: 'input_image', image_url: imageUrl, detail: 'high' },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'product_understanding',
          strict: true,
          schema: productUnderstandJsonSchema,
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

async function understandWithChatCompletions(
  apiKey: string,
  baseURL: string | undefined,
  model: string,
  imageUrl: string,
  signal: AbortSignal,
) {
  if (!baseURL) {
    throw new Error('OPENAI_BASE_URL is required when OPENAI_API_MODE=chat.');
  }

  const messages = [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `${productInstructions} Return JSON only. Include every field: recognitionStatus, productName, originalName, category, description, ingredients, allergens, warnings, goodFor, flavor, sugar, caffeine, alcohol, whatItIs, howToUse, whatItDoes, skinType, keyIngredients, notes, confidence, needsManualCheck.`,
        },
        {
          type: 'image_url',
          image_url: { url: imageUrl, detail: 'high' },
        },
      ],
    },
  ];

  const schemaResponse = await fetchProductChatCompletions({
    apiKey,
    baseURL,
    model,
    messages,
    responseFormat: { type: 'json_object' },
    signal,
  });

  if (schemaResponse.ok) {
    return schemaResponse.content;
  }

  if (!shouldRetryProductWithoutJsonFormat(schemaResponse.errorText)) {
    throw new Error(schemaResponse.errorText);
  }

  const fallbackResponse = await fetchProductChatCompletions({
    apiKey,
    baseURL,
    model,
    messages,
    responseFormat: undefined,
    signal,
  });

  if (!fallbackResponse.ok) {
    throw new Error(fallbackResponse.errorText);
  }

  return fallbackResponse.content;
}

async function fetchProductChatCompletions({
  apiKey,
  baseURL,
  model,
  messages,
  responseFormat,
  signal,
}: {
  apiKey: string;
  baseURL: string;
  model: string;
  messages: unknown[];
  responseFormat: unknown;
  signal: AbortSignal;
}) {
  const response = await fetch(`${baseURL.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'BackpackInChinaLocal/1.0',
    },
    body: JSON.stringify({
      model,
      messages,
      ...(responseFormat ? { response_format: responseFormat } : {}),
    }),
    signal,
  });

  const text = await response.text();
  if (!response.ok) {
    return {
      ok: false as const,
      errorText: `Product understanding failed with status ${response.status}: ${text.slice(0, 300)}`,
    };
  }

  try {
    const parsed = JSON.parse(text);
    const content = parsed?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      return {
        ok: false as const,
        errorText: 'Product understanding returned no message content.',
      };
    }

    return {
      ok: true as const,
      content,
    };
  } catch (error) {
    return {
      ok: false as const,
      errorText: error instanceof Error
        ? `Could not parse product chat response: ${error.message}`
        : 'Could not parse product chat response.',
    };
  }
}

function shouldRetryProductWithoutJsonFormat(errorText: string) {
  const normalized = errorText.toLowerCase();
  return [
    'response_format',
    'json_object',
    'json schema',
    'unsupported',
    'not support',
    'invalid parameter',
    'bad request',
  ].some((pattern) => normalized.includes(pattern));
}

function normalizeProductResult(value: unknown) {
  if (!value || typeof value !== 'object') {
    return value;
  }

  const result = { ...(value as Record<string, unknown>) };
  const stringFields = [
    'productName',
    'originalName',
    'description',
    'flavor',
    'sugar',
    'caffeine',
    'alcohol',
    'whatItIs',
    'howToUse',
    'whatItDoes',
    'skinType',
  ];

  for (const field of stringFields) {
    if (Array.isArray(result[field])) {
      result[field] = result[field]
        .filter((item: unknown) => typeof item === 'string' && item.trim())
        .join(', ');
    }

    if (result[field] == null) result[field] = '';
  }

  for (const field of ['ingredients', 'allergens', 'warnings', 'goodFor', 'keyIngredients', 'notes']) {
    if (typeof result[field] === 'string') {
      result[field] = String(result[field]).trim() ? [String(result[field]).trim()] : [];
    }

    if (!Array.isArray(result[field])) {
      result[field] = [];
    }
  }

  if (typeof result.recognitionStatus === 'string') {
    const normalizedStatus = result.recognitionStatus.trim().toLowerCase().replace(/[\s-]+/g, '_');
    const statusAliases: Record<string, string> = {
      recognized: 'recognized',
      success: 'recognized',
      readable: 'recognized',
      uncertain: 'uncertain',
      partial: 'uncertain',
      unclear: 'uncertain',
      failed: 'unable_to_recognize',
      unable: 'unable_to_recognize',
      not_a_product: 'unable_to_recognize',
      unable_to_recognize: 'unable_to_recognize',
    };
    result.recognitionStatus = statusAliases[normalizedStatus] ?? 'uncertain';
  } else {
    result.recognitionStatus = 'uncertain';
  }

  if (typeof result.category === 'string') {
    const normalizedCategory = result.category.trim().toLowerCase().replace(/[\s-]+/g, '_');
    const categoryAliases: Record<string, string> = {
      food: 'food',
      snack: 'food',
      snacks: 'food',
      drink: 'drink',
      beverage: 'drink',
      medicine: 'medicine',
      medication: 'medicine',
      drug: 'medicine',
      skincare: 'skincare',
      skin_care: 'skincare',
      cosmetics: 'cosmetics',
      cosmetic: 'cosmetics',
      daily_goods: 'daily_goods',
      daily_good: 'daily_goods',
      household: 'daily_goods',
      souvenir: 'souvenir',
      unknown: 'unknown',
    };
    result.category = categoryAliases[normalizedCategory] ?? 'unknown';
  } else {
    result.category = 'unknown';
  }

  if (typeof result.confidence === 'string') {
    const normalizedConfidence = result.confidence.trim().toLowerCase();
    result.confidence = ['high', 'medium', 'low'].includes(normalizedConfidence) ? normalizedConfidence : 'medium';
  } else {
    result.confidence = result.recognitionStatus === 'recognized' ? 'medium' : 'low';
  }

  if (typeof result.needsManualCheck !== 'boolean') {
    result.needsManualCheck = result.recognitionStatus !== 'recognized' || result.confidence !== 'high';
  }

  result.notes = (Array.isArray(result.notes) ? result.notes : []).filter((note: unknown) => {
    if (typeof note !== 'string') return false;
    const normalizedNote = note.toLowerCase();
    return !['ocr', 'source', 'classification', 'layout', 'confidence'].some((pattern) => normalizedNote.includes(pattern));
  });

  return result;
}

function extractJsonText(rawText: string) {
  const trimmed = rawText.trim();
  if (!trimmed.startsWith('```')) return trimmed;

  return trimmed
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
}
