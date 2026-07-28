export type AiTaskKind = 'text' | 'vision';

export function getAiApiKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  return apiKey;
}

export function getAiBaseUrl() {
  return process.env.OPENAI_BASE_URL;
}

export function getAiApiMode() {
  return process.env.OPENAI_API_MODE ?? 'responses';
}

export function getAiModel(kind: AiTaskKind) {
  const model = kind === 'vision'
    ? process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MENU_MODEL
    : process.env.OPENAI_TEXT_MODEL || process.env.OPENAI_MENU_MODEL;

  if (!model) {
    throw new Error(kind === 'vision'
      ? 'OPENAI_VISION_MODEL is not configured.'
      : 'OPENAI_TEXT_MODEL is not configured.');
  }

  return model;
}

export function getAiTimeoutMs(kind: AiTaskKind) {
  const rawValue = kind === 'vision'
    ? process.env.OPENAI_VISION_TIMEOUT_MS
    : process.env.OPENAI_TEXT_TIMEOUT_MS;
  const fallback = kind === 'vision' ? 90_000 : 45_000;
  const value = Number(rawValue ?? fallback);

  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export async function withAiTimeout<T>(
  kind: AiTaskKind,
  task: (signal: AbortSignal) => Promise<T>,
  timeoutMs = getAiTimeoutMs(kind),
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await task(controller.signal);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`${kind === 'vision' ? 'Vision' : 'Text'} model request timed out.`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function extractJsonText(rawText: string) {
  const trimmed = rawText.trim();
  if (!trimmed.startsWith('```')) {
    const objectStart = trimmed.indexOf('{');
    const objectEnd = trimmed.lastIndexOf('}');
    if (objectStart >= 0 && objectEnd > objectStart) {
      return trimmed.slice(objectStart, objectEnd + 1);
    }

    return trimmed;
  }

  return trimmed
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
}
