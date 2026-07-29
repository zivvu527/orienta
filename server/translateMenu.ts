import OpenAI from 'openai';
import { extractJsonText, getAiApiKey, getAiApiMode, getAiBaseUrl, getAiModel, getAiTimeoutMs, withAiTimeout } from './aiConfig';
import { TranslateMenuResultSchema, translateMenuJsonSchema } from './types';

const menuInstructions = [
  'You are helping an international traveler understand a restaurant menu in China.',
  'Read the menu image and return only the requested JSON structure.',
  'The menu may be a standard printed menu, a wall poster, a photo-heavy menu board, a collage layout, or a non-standard restaurant flyer.',
  'Do not give up just because the layout is decorative, scattered, photo-heavy, or not arranged as a table.',
  'For dense or large menus, prioritize the clearest readable dishes first instead of trying to transcribe everything.',
  'Return a useful partial menu when only part of the image is readable. Partial useful extraction is better than failure.',
  'Aim for roughly 8 to 15 clear dish items when the menu is crowded, but include more only if they are clearly readable and do not require guessing.',
  'Do not invent dish names, prices, restaurant names, ingredients, allergens, or spiciness.',
  'Only set recognition_status to "unable_to_recognize" when no menu dish text can be read at all.',
  'If some items are readable but uncertain, set recognition_status to "uncertain" and include the readable items. Keep uncertain fields empty or explain uncertainty in notes.',
  'Set partial_menu_notice to a short traveler-friendly English note only when the result may cover part of the menu, for example: "This looks like a large menu, so I picked the clearest dishes first. For more items, take a closer photo of one section." Otherwise use an empty string.',
  'Use stable unique ids for every section and item.',
  'Descriptions should be short, practical English explanations for travelers.',
  'Normalize prices for travelers: always use ¥ instead of 元, RMB, or yuan, and translate common Chinese price units into concise English such as ¥98 / portion, ¥78 / dozen, ¥22 / 5 fish, ¥42 / medium pot, or ¥62 / large pot.',
  'If a price unit is unclear, keep the price with ¥ and omit the uncertain unit rather than guessing.',
  'Notes may mention possible spiciness, pork, nuts, seafood, or other concerns only when visible or reasonably indicated by the menu text. Mark uncertainty clearly.',
].join(' ');

const relaxedMenuInstructions = [
  menuInstructions,
  'Second attempt: be more tolerant. This image may be a clear but unusual Chinese restaurant menu poster.',
  'Focus on reading visible Chinese dish names, English dish names if present, and prices.',
  'Group scattered items under one section called "Your menu" if section headings are unclear.',
  'Return recognized or uncertain if you can read at least one dish item.',
].join(' ');

function getMenuTimeoutMs() {
  const fallback = Math.max(getAiTimeoutMs('vision'), 150_000);
  const value = Number(process.env.OPENAI_MENU_TIMEOUT_MS ?? fallback);

  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export async function translateMenuImage(file: Express.Multer.File) {
  const apiKey = getAiApiKey();
  const model = getAiModel('vision');
  const baseURL = getAiBaseUrl();
  const apiMode = getAiApiMode();

  const client = new OpenAI({
    apiKey,
    baseURL: baseURL || undefined,
  });

  const imageUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  const menuTimeoutMs = getMenuTimeoutMs();
  const rawText = await withAiTimeout('vision', (signal) => (
    apiMode === 'chat'
      ? translateWithChatCompletionsRaw(apiKey, baseURL, model, imageUrl, menuInstructions, signal)
      : translateWithResponses(client, model, imageUrl, menuInstructions, signal)
  ), menuTimeoutMs);

  const firstResult = parseMenuResult(rawText);

  if (!shouldRetryMenuRecognition(firstResult)) {
    return firstResult;
  }

  const relaxedRawText = await withAiTimeout('vision', (signal) => (
    apiMode === 'chat'
      ? translateWithChatCompletionsRaw(apiKey, baseURL, model, imageUrl, relaxedMenuInstructions, signal)
      : translateWithResponses(client, model, imageUrl, relaxedMenuInstructions, signal)
  ), menuTimeoutMs);

  return parseMenuResult(relaxedRawText);
}

async function translateWithResponses(
  client: OpenAI,
  model: string,
  imageUrl: string,
  instructions: string,
  signal: AbortSignal,
) {
  const response = await client.responses.create(
    {
      model,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: instructions,
            },
            {
              type: 'input_image',
              image_url: imageUrl,
              detail: 'high',
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'translated_menu',
          strict: true,
          schema: translateMenuJsonSchema,
        },
      },
    },
    { signal },
  );

  const rawText = response.output_text;
  if (!rawText) {
    throw new Error('OpenAI returned no output_text.');
  }

  return rawText;
}

async function translateWithChatCompletionsRaw(
  apiKey: string,
  baseURL: string | undefined,
  model: string,
  imageUrl: string,
  instructions: string,
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
          text: `${instructions} Return JSON only. The JSON must match this shape: {"restaurant_name":"string","recognition_status":"recognized|uncertain|unable_to_recognize","partial_menu_notice":"string","sections":[{"id":"string","title":"string","items":[{"id":"string","original_name":"string","translated_name":"string","description":"string","price":"string","notes":"string"}]}]}`,
        },
        {
          type: 'image_url',
          image_url: {
            url: imageUrl,
            detail: 'high',
          },
        },
      ],
    },
  ];

  const schemaResponse = await fetchChatCompletions({
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

  if (!shouldRetryWithoutJsonSchema(schemaResponse.errorText)) {
    throw new Error(schemaResponse.errorText);
  }

  const fallbackResponse = await fetchChatCompletions({
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

async function fetchChatCompletions({
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
      errorText: `Chat completions failed with status ${response.status}: ${text.slice(0, 300)}`,
    };
  }

  try {
    const parsed = JSON.parse(text);
    const content = parsed?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      return {
        ok: false as const,
        errorText: 'Chat completions returned no message content.',
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
        ? `Could not parse chat completions response: ${error.message}`
        : 'Could not parse chat completions response.',
    };
  }
}

function shouldRetryWithoutJsonSchema(error: unknown) {
  const message = error instanceof Error
    ? error.message.toLowerCase()
    : String(error).toLowerCase();

  return message.includes('response_format')
    || message.includes('json_schema')
    || message.includes('unsupported')
    || message.includes('invalid');
}

function parseMenuResult(rawText: string) {
  const parsed = JSON.parse(extractJsonText(rawText));
  return TranslateMenuResultSchema.parse(normalizeMenuResult(parsed));
}

function shouldRetryMenuRecognition(result: { recognition_status: string; sections: Array<{ items: unknown[] }> }) {
  const itemCount = result.sections.reduce((total, section) => total + section.items.length, 0);
  return result.recognition_status === 'unable_to_recognize' || itemCount === 0;
}

function normalizeMenuResult(value: unknown) {
  if (!value || typeof value !== 'object') {
    return {
      restaurant_name: '',
      recognition_status: 'unable_to_recognize',
      sections: [],
    };
  }

  const source = value as Record<string, unknown>;
  const result: Record<string, unknown> = { ...source };

  result.restaurant_name = toStringValue(
    result.restaurant_name
      ?? result.restaurantName
      ?? result.restaurant
      ?? result.name,
  );
  result.partial_menu_notice = toStringValue(
    result.partial_menu_notice
      ?? result.partialMenuNotice
      ?? result.partial_notice
      ?? result.notice,
  );

  const rawStatus = toStringValue(
    result.recognition_status
      ?? result.recognitionStatus
      ?? result.status,
  ).trim().toLowerCase().replace(/[\s-]+/g, '_');

  const statusAliases: Record<string, string> = {
    recognized: 'recognized',
    success: 'recognized',
    successful: 'recognized',
    readable: 'recognized',
    menu_read: 'recognized',
    uncertain: 'uncertain',
    partial: 'uncertain',
    partially_recognized: 'uncertain',
    low_confidence: 'uncertain',
    unclear: 'uncertain',
    unable: 'unable_to_recognize',
    failed: 'unable_to_recognize',
    failure: 'unable_to_recognize',
    not_recognized: 'unable_to_recognize',
    unable_to_recognize: 'unable_to_recognize',
    unable_to_read: 'unable_to_recognize',
    not_a_menu: 'unable_to_recognize',
  };

  result.recognition_status = statusAliases[rawStatus] ?? 'uncertain';

  const rawSections = pickArray(
    result.sections,
    result.menu_sections,
    result.categories,
  );
  const rawItems = pickArray(
    result.items,
    result.menu_items,
    result.dishes,
    result.food_items,
  );

  const normalizedSections = rawSections.length > 0
    ? rawSections.map((section, sectionIndex) => normalizeMenuSection(section, sectionIndex)).filter((section) => section.items.length > 0)
    : [];

  if (normalizedSections.length === 0 && rawItems.length > 0) {
    normalizedSections.push({
      id: 'section-menu-items',
      title: 'Your menu',
      items: rawItems.map((item, itemIndex) => normalizeMenuItem(item, itemIndex)).filter(hasMenuItemName),
    });
  }

  result.sections = normalizedSections;

  if (normalizedSections.some((section) => section.items.length > 0) && result.recognition_status === 'unable_to_recognize') {
    result.recognition_status = 'uncertain';
  }

  if (normalizedSections.some((section) => section.items.length > 0) && !rawStatus) {
    result.recognition_status = 'recognized';
  }

  const itemCount = normalizedSections.reduce((total, section) => total + section.items.length, 0);
  if (!result.partial_menu_notice && itemCount >= 12 && result.recognition_status === 'uncertain') {
    result.partial_menu_notice = 'This looks like a large menu, so I picked the clearest dishes first. For more items, take a closer photo of one section.';
  }

  return result;
}

function normalizeMenuSection(value: unknown, index: number) {
  const section = value && typeof value === 'object'
    ? value as Record<string, unknown>
    : {};
  const items = pickArray(section.items, section.dishes, section.menu_items, section.food_items)
    .map((item, itemIndex) => normalizeMenuItem(item, itemIndex))
    .filter(hasMenuItemName);

  return {
    id: toStringValue(section.id) || `section-${index + 1}`,
    title: toStringValue(section.title ?? section.name ?? section.category),
    items,
  };
}

function normalizeMenuItem(value: unknown, index: number) {
  const item = value && typeof value === 'object'
    ? value as Record<string, unknown>
    : {};

  return {
    id: toStringValue(item.id) || `item-${index + 1}`,
    original_name: toStringValue(item.original_name ?? item.originalName ?? item.chinese_name ?? item.chineseName ?? item.name_cn ?? item.name),
    translated_name: toStringValue(item.translated_name ?? item.translatedName ?? item.english_name ?? item.englishName ?? item.name_en ?? item.translation),
    description: toStringValue(item.description ?? item.what_it_is ?? item.whatItIs),
    price: formatMenuPriceForTraveler(toStringValue(item.price)),
    notes: toStringValue(item.notes ?? item.note ?? item.warning ?? item.warnings),
  };
}

function formatMenuPriceForTraveler(price: string): string {
  if (!price) return '';

  const unitMap: Record<string, string> = {
    份: 'portion',
    例: 'portion',
    打: 'dozen',
    串: 'skewer',
    手: 'set',
    个: 'piece',
    只: 'piece',
    条: 'fish',
    位: 'person',
    人: 'person',
    斤: 'jin (500g)',
    两: 'liang (50g)',
    盒: 'box',
    瓶: 'bottle',
    杯: 'cup',
    碗: 'bowl',
    盘: 'plate',
    小份: 'small portion',
    中份: 'medium portion',
    大份: 'large portion',
    小煲: 'small pot',
    中煲: 'medium pot',
    大煲: 'large pot',
  };

  let normalized = price
    .replace(/[￥¥]/g, '¥')
    .replace(/\b(?:RMB|CNY|yuan)\b/gi, '¥')
    .replace(/人民币/g, '¥')
    .replace(/元/g, '¥')
    .replace(/[：]/g, ':')
    .replace(/[；]/g, ';')
    .replace(/\s+/g, ' ')
    .trim();

  normalized = normalized.replace(/¥\s*([0-9]+(?:\.[0-9]+)?)/g, '¥$1');
  normalized = normalized.replace(/([0-9]+(?:\.[0-9]+)?)\s*¥/g, '¥$1');

  const unitsByLength = Object.keys(unitMap).sort((a, b) => b.length - a.length);
  normalized = normalized.replace(new RegExp(`/\\s*([0-9]+(?:\\.[0-9]+)?)\\s*(${unitsByLength.join('|')})`, 'g'), (_match, amount: string, unit: string) => ` / ${amount} ${unitMap[unit]}`);
  for (const unit of unitsByLength) {
    normalized = normalized.replace(new RegExp(`/\\s*${unit}`, 'g'), ` / ${unitMap[unit]}`);
  }

  return normalized.replace(/\s*;\s*/g, '; ').replace(/\s*,\s*/g, ', ');
}

function hasMenuItemName(item: { original_name: string; translated_name: string }) {
  return Boolean(item.original_name || item.translated_name);
}

function pickArray(...values: unknown[]) {
  for (const value of values) {
    if (Array.isArray(value)) return value;
  }

  return [];
}

function toStringValue(value: unknown): string {
  if (value == null) return '';
  if (Array.isArray(value)) {
    return value
      .map((item) => toStringValue(item))
      .filter(Boolean)
      .join(', ');
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  return '';
}
