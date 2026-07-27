import OpenAI from 'openai';
import {
  AddressTranslationResultSchema,
  addressTranslationJsonSchema,
  type AddressTranslationResult,
} from './types';

const DEFAULT_TIMEOUT_MS = 40_000;

const addressInstructions = [
  'You are a China address normalization assistant, not a general translator.',
  'First parse the address hierarchy and place structure, then generate both Chinese and English formatted addresses.',
  'Chinese addresses must use Chinese address order: broad area to specific location, compact and natural, without unnecessary commas.',
  'English addresses must use natural international address order: specific location, road, district, city, province, country.',
  'Prefer official or widely used English place names when known.',
  'For Chinese road direction words, format English naturally: 东路 as East ... Road, 西路 as West ... Road, 南路 as South ... Road, 北路 as North ... Road, 中路 as Middle ... Road, unless an official name is widely used.',
  'Do not output mechanical translations such as "Shanghai City Huangpu District Nanjing East Road 300 Number".',
  'For municipalities such as Beijing, Shanghai, Tianjin, and Chongqing, do not duplicate city names like "Shanghai City, Shanghai".',
  'If an official English name is uncertain, use pinyin or a cautious descriptive name, but do not invent a precise official name.',
  'Do not add street numbers, districts, postal codes, entrances, or coordinates that the user did not provide and you cannot reasonably confirm.',
  'Address translation is not map verification. Always set verificationStatus to "not_verified".',
  'Default to formatting the user input into a useful display card even when city or district is missing. Missing city is not by itself a reason to block formatting.',
  'Only ask for more information when the input is a generic ambiguous place name that clearly has many locations, such as KFC, Starbucks, Wanda Plaza, hotel, station, airport, mall, or restaurant without any city, district, road, number, or landmark.',
  'For simple partial addresses such as "Happy Road 50", "xx road no.49", or "快乐路50号", generate a formatted bilingual address card and keep verificationStatus as "not_verified".',
  'Do not create a confident-looking verified location. The output may be formatted and useful for showing, but it is never map-verified.',
  'Return strict JSON only. Do not output Markdown.',
].join(' ');

export async function formatDestinationAddress(destination: string) {
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
      ? await formatWithChatCompletions(apiKey, baseURL, model, destination, controller.signal)
      : await formatWithResponses(apiKey, baseURL, model, destination, controller.signal);

    const parsed = JSON.parse(extractJsonText(rawText));
    return normalizeAddressResult(AddressTranslationResultSchema.parse(parsed));
  } finally {
    clearTimeout(timeout);
  }
}

async function formatWithResponses(
  apiKey: string,
  baseURL: string | undefined,
  model: string,
  destination: string,
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
              text: `${addressInstructions} User input: ${destination}`,
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'formatted_destination',
          strict: true,
          schema: addressTranslationJsonSchema,
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

async function formatWithChatCompletions(
  apiKey: string,
  baseURL: string | undefined,
  model: string,
  destination: string,
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
            addressInstructions,
            `User input: ${destination}`,
            'Return JSON only. The JSON must match this shape:',
            '{"inputType":"chinese_address|english_address|chinese_place_name|english_place_name|mixed|unknown","detectedLanguage":"zh|en|mixed|unknown","originalInput":"string","chineseAddress":"string","englishAddress":"string","shortChineseLabel":"string","shortEnglishLabel":"string","parsedAddress":{"country":"string","province":"string","municipality":"string","city":"string","district":"string","county":"string","town":"string","subdistrict":"string","road":"string","roadDirection":"string","roadNumber":"string","lane":"string","alley":"string","building":"string","buildingNumber":"string","unit":"string","floor":"string","room":"string","landmark":"string","placeName":"string","entrance":"string","gate":"string","nearbyReference":"string"},"confidence":"high|medium|low","isAmbiguous":false,"needsMoreInformation":false,"missingInformation":["string"],"ambiguityMessage":"string","formattingNotes":["string"],"verificationStatus":"not_verified","driverCard":{"destinationChinese":"string","destinationEnglish":"string","instructionChinese":"string","instructionEnglish":"string"}}',
          ].join(' '),
        },
      ],
      response_format: { type: 'json_object' },
    }),
    signal,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Destination formatting failed with status ${response.status}: ${text.slice(0, 300)}`);
  }

  const parsed = JSON.parse(text);
  const content = parsed?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Destination formatting returned no message content.');
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

function normalizeAddressResult(result: AddressTranslationResult) {
  const normalized = { ...result };
  normalized.inputType = normalizeInputType(normalized);
  normalized.originalInput = normalized.originalInput.trim();
  const simpleAddress = buildSimpleAddressFallback(normalized.originalInput);

  if (simpleAddress) {
    normalized.chineseAddress = normalized.chineseAddress || simpleAddress.chineseAddress;
    normalized.englishAddress = normalized.englishAddress || simpleAddress.englishAddress;
    normalized.shortChineseLabel = normalized.shortChineseLabel || simpleAddress.chineseAddress;
    normalized.shortEnglishLabel = normalized.shortEnglishLabel || simpleAddress.englishAddress;
    normalized.confidence = normalized.confidence === 'high' ? 'high' : 'medium';
    normalized.isAmbiguous = false;
    normalized.needsMoreInformation = false;
    normalized.ambiguityMessage = '';
    normalized.missingInformation = [];
    normalized.formattingNotes = [];
  }

  normalized.englishAddress = normalizeRoadDirection(normalized.englishAddress);
  normalized.shortEnglishLabel = normalizeRoadDirection(normalized.shortEnglishLabel ?? '');
  normalized.driverCard = {
    ...normalized.driverCard,
    destinationChinese: normalized.driverCard.destinationChinese || normalized.chineseAddress,
    destinationEnglish: normalizeRoadDirection(normalized.driverCard.destinationEnglish || normalized.englishAddress),
    instructionChinese: simpleAddress ? '请带我去这个地址。' : normalized.driverCard.instructionChinese || '请带我去这个地址。',
    instructionEnglish: simpleAddress ? 'Please take me to this address.' : normalized.driverCard.instructionEnglish || 'Please take me to this address.',
  };

  return normalized;
}

function normalizeInputType(result: AddressTranslationResult) {
  const hasChinese = /[\p{Script=Han}]/u.test(result.originalInput);
  const hasLatin = /[A-Za-z]/.test(result.originalInput);
  const looksLikeAddress = /\d|No\.|Room|Building|Road|Street|Avenue|Lane|District|区|路|号|室|楼/i.test(result.originalInput);

  if (hasChinese && hasLatin) return 'mixed';
  if (hasLatin && looksLikeAddress) return 'english_address';
  if (hasLatin) return 'english_place_name';
  if (hasChinese && looksLikeAddress) return 'chinese_address';
  if (hasChinese) return 'chinese_place_name';

  return result.inputType;
}

function normalizeRoadDirection(address: string) {
  if (!address) return address;

  return address
    .replace(/\bNanjing East Road\b/g, 'East Nanjing Road')
    .replace(/\bNanjing West Road\b/g, 'West Nanjing Road')
    .replace(/\bNanjing South Road\b/g, 'South Nanjing Road')
    .replace(/\bNanjing North Road\b/g, 'North Nanjing Road')
    .replace(/\bNanjing Middle Road\b/g, 'Middle Nanjing Road')
    .replace(/\b(\d+)\s+(East Nanjing Road)\b/g, 'No. $1 $2')
    .replace(/\b(\d+)\s+(West Nanjing Road)\b/g, 'No. $1 $2')
    .replace(/\b(\d+)\s+(South Nanjing Road)\b/g, 'No. $1 $2')
    .replace(/\b(\d+)\s+(North Nanjing Road)\b/g, 'No. $1 $2')
    .replace(/\b(\d+)\s+(Middle Nanjing Road)\b/g, 'No. $1 $2')
    .replace(/\bNo\.\s+(\d+),\s+(East|West|South|North|Middle)\s+Nanjing Road\b/g, 'No. $1 $2 Nanjing Road');
}

function buildSimpleAddressFallback(input: string) {
  const normalized = input
    .replace(/\s+/g, ' ')
    .replace(/,\s*/g, ', ')
    .trim();

  if (!normalized) return null;

  const hasChineseSpecificAddress = /[路街道巷弄]\s*\d+号?/.test(normalized);
  if (hasChineseSpecificAddress) {
    return {
      chineseAddress: normalized,
      englishAddress: normalized,
    };
  }

  const hasRoadWord = /\b(road|rd\.?|street|st\.?|avenue|ave\.?|lane|ln\.?|boulevard|blvd\.?|drive|dr\.?)\b/i.test(normalized);
  const hasNumber = /\b(?:no\.?\s*)?\d+[a-z]?\b/i.test(normalized);
  if (!hasRoadWord || !hasNumber) return null;

  const chineseAddress = normalized
    .replace(/\bno\.?\s*(\d+[a-z]?)\b/gi, '$1号')
    .replace(/\b(\d+[a-z]?)\s*,?\s*$/i, '$1号')
    .replace(/\broad\b|\brd\.?\b/gi, '路')
    .replace(/\bstreet\b|\bst\.?\b/gi, '街')
    .replace(/\bavenue\b|\bave\.?\b/gi, '大道')
    .replace(/\blane\b|\bln\.?\b/gi, '巷')
    .replace(/\bboulevard\b|\bblvd\.?\b/gi, '大道')
    .replace(/\bdrive\b|\bdr\.?\b/gi, '路')
    .replace(/,\s*/g, '')
    .replace(/\s+/g, '');

  return {
    chineseAddress,
    englishAddress: normalized,
  };
}
