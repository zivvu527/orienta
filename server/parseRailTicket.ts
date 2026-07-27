import OpenAI from 'openai';
import { RailTicketResultSchema, railTicketJsonSchema } from './types';

const DEFAULT_TIMEOUT_MS = 45_000;

const railTicketInstructions = [
  'You help international travelers understand Chinese high-speed rail ticket or order screenshots.',
  'Read the image and extract only information visible in the screenshot.',
  'Supported sources include 12306 screenshots, Trip.com screenshots, China Railway e-ticket screenshots, and order pages.',
  'Do not invent train numbers, stations, times, gates, passenger names, order numbers, or seats.',
  'If a field is not visible or unclear, return an empty string for that field. Do not guess missing fields.',
  'If the image is not a rail ticket/order screenshot, set recognitionStatus to "unable_to_recognize".',
  'If some fields are readable but uncertain, set recognitionStatus to "uncertain", confidence to "low" or "medium", and explain uncertainty in notes.',
  'Normalize output into a clean traveler-facing journey card. Do not return raw OCR text.',
  'For Chinese stations, boarding gates, waiting halls, platforms, and check-in areas, keep the visible Chinese text in the original field and provide a simple English translation in the matching English field.',
  'Use common railway English when possible, such as "Qingdao North Railway Station", "Qingdao Railway Station", "Ticket Gate 8A, 2nd Floor", and "Second Class Seat".',
  'Split boardingGate, waitingHall, and platform carefully. Text containing "检票口", "Gate", "Check-in", or "Ticket Gate" should go into boardingGate, not waitingHall.',
  'Only fill waitingHall if the screenshot explicitly says "候车厅" or "Waiting Hall". Only fill platform if the screenshot explicitly shows a platform.',
  'For "检票口二楼 8A", return boardingGate as "检票口二楼 8A" and boardingGateEnglish as "Ticket Gate 8A, 2nd Floor".',
  'Clean coach and seat values. Remove leading zeros and units like 车, 号, Car, Coach, Seat. For example "03车" becomes "3" and "03F号" becomes "3F".',
  'Only include notes that help the traveler take action, such as unclear gate, unclear time, missing seat, or details they should confirm before boarding.',
  'Do not include internal notes about OCR, source classification, layout, confidence scoring, copyable order numbers, or why you classified the screenshot type.',
  'sourceType must be exactly one of: "12306", "trip_com", "china_railway_e_ticket", "order_screenshot", "unknown".',
  'notes must always be an array of strings, even if there is only one note.',
  'Return strict JSON only. Do not output Markdown.',
].join(' ');

export async function parseRailTicketImage(file: Express.Multer.File) {
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
      ? await parseWithChatCompletions(apiKey, baseURL, model, imageUrl, controller.signal)
      : await parseWithResponses(apiKey, baseURL, model, imageUrl, controller.signal);

    const parsed = JSON.parse(extractJsonText(rawText));
    return RailTicketResultSchema.parse(normalizeRailTicketResult(parsed));
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeRailTicketResult(value: unknown) {
  if (!value || typeof value !== 'object') {
    return value;
  }

  const result = { ...(value as Record<string, unknown>) };
  const stringFields = [
    'trainNumber',
    'fromStation',
    'fromStationEnglish',
    'toStation',
    'toStationEnglish',
    'departureDate',
    'departureTime',
    'arrivalDate',
    'arrivalTime',
    'carriage',
    'seat',
    'seatClass',
    'passengerName',
    'boardingGate',
    'boardingGateEnglish',
    'waitingHall',
    'waitingHallEnglish',
    'platform',
    'platformEnglish',
    'gate',
    'gateEnglish',
    'checkIn',
    'checkInEnglish',
    'coach',
    'ticketNumber',
    'orderNumber',
  ];

  for (const field of stringFields) {
    if (result[field] == null) {
      result[field] = '';
    }
  }

  normalizeSourceAndStatus(result);

  if (typeof result.needsManualCheck !== 'boolean') {
    result.needsManualCheck = result.recognitionStatus !== 'recognized' || result.confidence !== 'high';
  }

  result.carriage = cleanCoachValue(result.carriage);
  result.coach = cleanCoachValue(result.coach);
  result.seat = cleanSeatValue(result.seat);
  result.seatClass = cleanSeatClass(result.seatClass);

  if (!result.boardingGate && typeof result.gate === 'string' && isBoardingGateText(result.gate)) {
    result.boardingGate = result.gate;
    result.boardingGateEnglish = typeof result.gateEnglish === 'string' ? result.gateEnglish : '';
    result.gate = '';
    result.gateEnglish = '';
  }

  if (!result.boardingGate && typeof result.checkIn === 'string' && isBoardingGateText(result.checkIn)) {
    result.boardingGate = result.checkIn;
    result.boardingGateEnglish = typeof result.checkInEnglish === 'string' ? result.checkInEnglish : '';
    result.checkIn = '';
    result.checkInEnglish = '';
  }

  if (typeof result.waitingHall === 'string' && result.waitingHall && !isWaitingHallText(result.waitingHall)) {
    if (!result.boardingGate && isBoardingGateText(result.waitingHall)) {
      result.boardingGate = result.waitingHall;
      result.boardingGateEnglish = typeof result.waitingHallEnglish === 'string' ? result.waitingHallEnglish : '';
    }

    result.waitingHall = '';
    result.waitingHallEnglish = '';
  }

  if (typeof result.notes === 'string') {
    result.notes = result.notes.trim() ? [result.notes.trim()] : [];
  }

  if (!Array.isArray(result.notes)) {
    result.notes = [];
  }

  result.notes = filterUsefulNotes(Array.isArray(result.notes) ? result.notes : []);

  return result;
}

function normalizeSourceAndStatus(result: Record<string, unknown>) {
  if (typeof result.sourceType === 'string') {
    const normalizedSource = result.sourceType.trim().toLowerCase().replace(/[\s-]+/g, '_');
    const sourceAliases: Record<string, string> = {
      '12306': '12306',
      china_railway: 'china_railway_e_ticket',
      china_railway_e_ticket: 'china_railway_e_ticket',
      china_railway_ticket: 'china_railway_e_ticket',
      china_railway_order: 'order_screenshot',
      trip: 'trip_com',
      trip_com: 'trip_com',
      'trip.com': 'trip_com',
      order: 'order_screenshot',
      order_page: 'order_screenshot',
      order_screenshot: 'order_screenshot',
      screenshot: 'order_screenshot',
      unknown: 'unknown',
      unclear: 'unknown',
    };

    result.sourceType = sourceAliases[normalizedSource] ?? 'unknown';
  }

  if (typeof result.recognitionStatus === 'string') {
    const normalizedStatus = result.recognitionStatus.trim().toLowerCase().replace(/[\s-]+/g, '_');
    const statusAliases: Record<string, string> = {
      recognized: 'recognized',
      success: 'recognized',
      successful: 'recognized',
      readable: 'recognized',
      recognized_ticket: 'recognized',
      uncertain: 'uncertain',
      partial: 'uncertain',
      partially_recognized: 'uncertain',
      partial_recognition: 'uncertain',
      low_confidence: 'uncertain',
      unclear: 'uncertain',
      unable: 'unable_to_recognize',
      failed: 'unable_to_recognize',
      failure: 'unable_to_recognize',
      not_recognized: 'unable_to_recognize',
      unable_to_recognize: 'unable_to_recognize',
      unable_to_read: 'unable_to_recognize',
      not_a_ticket: 'unable_to_recognize',
    };

    result.recognitionStatus = statusAliases[normalizedStatus] ?? 'uncertain';
  } else {
    result.recognitionStatus = 'uncertain';
  }

  if (typeof result.confidence === 'string') {
    const normalizedConfidence = result.confidence.trim().toLowerCase().replace(/[\s-]+/g, '_');
    const confidenceAliases: Record<string, string> = {
      high: 'high',
      confident: 'high',
      reliable: 'high',
      medium: 'medium',
      moderate: 'medium',
      partial: 'medium',
      uncertain: 'medium',
      low: 'low',
      unclear: 'low',
      poor: 'low',
      very_low: 'low',
    };

    result.confidence = confidenceAliases[normalizedConfidence] ?? 'medium';
  } else {
    result.confidence = result.recognitionStatus === 'recognized' ? 'medium' : 'low';
  }
}

function cleanCoachValue(value: unknown) {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .replace(/^(car|coach)\s*/i, '')
    .replace(/[车号]/g, '')
    .replace(/^0+(?=\d)/, '');
}

function cleanSeatValue(value: unknown) {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .replace(/^seat\s*/i, '')
    .replace(/[车号]/g, '')
    .replace(/^0+(?=\d)/, '');
}

function cleanSeatClass(value: unknown) {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .replace('二等座', 'Second Class Seat')
    .replace('一等座', 'First Class Seat')
    .replace('商务座', 'Business Class Seat');
}

function isBoardingGateText(value: string) {
  return /检票口|check-?in|boarding\s*gate|ticket\s*gate|gate/i.test(value);
}

function isWaitingHallText(value: string) {
  return /候车厅|waiting\s*hall/i.test(value);
}

function filterUsefulNotes(notes: unknown[]) {
  const hiddenPatterns = [
    'copyable',
    'order number',
    'source',
    'classified',
    'classification',
    'layout',
    'ocr',
    'confidence',
    'not explicit',
    'based on',
    'screenshot type',
    'ticket/platform',
  ];

  return notes.filter((note): note is string => {
    if (typeof note !== 'string') return false;
    const normalizedNote = note.toLowerCase();
    return !hiddenPatterns.some((pattern) => normalizedNote.includes(pattern));
  });
}

async function parseWithResponses(
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
            { type: 'input_text', text: railTicketInstructions },
            { type: 'input_image', image_url: imageUrl, detail: 'high' },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'rail_ticket',
          strict: true,
          schema: railTicketJsonSchema,
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

async function parseWithChatCompletions(
  apiKey: string,
  baseURL: string | undefined,
  model: string,
  imageUrl: string,
  signal: AbortSignal,
) {
  if (!baseURL) {
    throw new Error('OPENAI_BASE_URL is required when OPENAI_API_MODE=chat.');
  }

  const endpoint = `${baseURL.replace(/\/$/, '')}/chat/completions`;
  const withJsonFormat = await fetchRailChatCompletions(endpoint, apiKey, model, imageUrl, signal, { type: 'json_object' });

  if (withJsonFormat.ok) {
    return extractChatContent(await withJsonFormat.text());
  }

  const errorText = await withJsonFormat.text();
  if (!shouldRetryWithoutResponseFormat(errorText)) {
    throw new Error(`Rail ticket parsing failed with status ${withJsonFormat.status}: ${errorText.slice(0, 300)}`);
  }

  const fallback = await fetchRailChatCompletions(endpoint, apiKey, model, imageUrl, signal);
  const fallbackText = await fallback.text();

  if (!fallback.ok) {
    throw new Error(`Rail ticket parsing failed with status ${fallback.status}: ${fallbackText.slice(0, 300)}`);
  }

  return extractChatContent(fallbackText);
}

function fetchRailChatCompletions(
  endpoint: string,
  apiKey: string,
  model: string,
  imageUrl: string,
  signal: AbortSignal,
  responseFormat?: { type: 'json_object' },
) {
  return fetch(endpoint, {
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
            {
              type: 'text',
              text: `${railTicketInstructions} Return JSON only. The JSON must include every field: recognitionStatus, sourceType, trainNumber, fromStation, fromStationEnglish, toStation, toStationEnglish, departureDate, departureTime, arrivalDate, arrivalTime, carriage, seat, seatClass, passengerName, boardingGate, boardingGateEnglish, waitingHall, waitingHallEnglish, platform, platformEnglish, gate, gateEnglish, checkIn, checkInEnglish, coach, ticketNumber, orderNumber, notes, confidence, needsManualCheck.`,
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl, detail: 'high' },
            },
          ],
        },
      ],
      ...(responseFormat ? { response_format: responseFormat } : {}),
    }),
    signal,
  });
}

function extractChatContent(rawText: string) {
  const parsed = JSON.parse(rawText);
  const content = parsed?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Rail ticket parsing returned no message content.');
  }

  return content;
}

function shouldRetryWithoutResponseFormat(errorText: string) {
  const normalized = errorText.toLowerCase();
  return ['response_format', 'json_object', 'unsupported', 'not support', 'invalid parameter', 'bad request'].some((pattern) => normalized.includes(pattern));
}

function extractJsonText(rawText: string) {
  const trimmed = rawText.trim();
  if (!trimmed.startsWith('```')) return trimmed;

  return trimmed
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
}
