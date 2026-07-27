import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

const rootDir = process.cwd();
const dataDir = path.join(rootDir, 'server', 'data');
const uploadDir = path.resolve(process.env.QUESTION_UPLOAD_DIR ?? path.join(rootDir, 'server', 'private_uploads', 'questions'));
const dbPath = path.resolve(process.env.QUESTION_DB_PATH ?? path.join(dataDir, 'ask-local.sqlite'));
const dbDir = path.dirname(dbPath);
const sessions = new Map<string, { expiresAt: number }>();
const rateLimits = new Map<string, { count: number; resetAt: number }>();

const QuestionInputSchema = z.object({
  question: z.string().trim().min(1).max(1500),
  location: z.string().trim().max(200).optional().default(''),
  context: z.string().trim().max(1200).optional().default(''),
  email: z.string().trim().email().max(240),
});

const AnswerInputSchema = z.object({
  replyEnglish: z.string().trim().max(3000).optional().default(''),
  usefulChinese: z.string().trim().max(800).optional().default(''),
});

const allowedPhotoTypes: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });
if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec(`
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  private_token TEXT NOT NULL UNIQUE,
  question TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  context TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  photo_path TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  reply_english TEXT NOT NULL DEFAULT '',
  useful_chinese TEXT NOT NULL DEFAULT '',
  answer_status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  answered_at TEXT NOT NULL DEFAULT '',
  responder_id TEXT NOT NULL DEFAULT '',
  email_status TEXT NOT NULL DEFAULT 'pending',
  email_sent_at TEXT NOT NULL DEFAULT '',
  email_error TEXT NOT NULL DEFAULT '',
  email_provider TEXT NOT NULL DEFAULT '',
  email_provider_message_id TEXT NOT NULL DEFAULT '',
  email_attempted_at TEXT NOT NULL DEFAULT '',
  email_retry_count INTEGER NOT NULL DEFAULT 0,
  admin_notification_status TEXT NOT NULL DEFAULT 'pending',
  admin_notification_sent_at TEXT NOT NULL DEFAULT '',
  admin_notification_error TEXT NOT NULL DEFAULT '',
  admin_notification_provider TEXT NOT NULL DEFAULT '',
  admin_notification_provider_message_id TEXT NOT NULL DEFAULT '',
  admin_notification_attempted_at TEXT NOT NULL DEFAULT '',
  admin_notification_retry_count INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_questions_private_token ON questions(private_token);
CREATE INDEX IF NOT EXISTS idx_questions_status_created ON questions(status, created_at DESC);
`);
migrateQuestionEmailColumns();

export type QuestionRow = {
  id: number;
  private_token: string;
  question: string;
  location: string;
  context: string;
  email: string;
  photo_path: string;
  status: 'new' | 'answered' | 'closed';
  reply_english: string;
  useful_chinese: string;
  answer_status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  answered_at: string;
  responder_id: string;
  email_status: EmailDeliveryStatus;
  email_sent_at: string;
  email_error: string;
  email_provider: string;
  email_provider_message_id: string;
  email_attempted_at: string;
  email_retry_count: number;
  admin_notification_status: EmailDeliveryStatus;
  admin_notification_sent_at: string;
  admin_notification_error: string;
  admin_notification_provider: string;
  admin_notification_provider_message_id: string;
  admin_notification_attempted_at: string;
  admin_notification_retry_count: number;
};

export type EmailDeliveryStatus = 'pending' | 'sent' | 'failed' | 'development_logged' | 'not_configured';

export async function createLocalQuestion(input: unknown, file?: Express.Multer.File) {
  const parsed = QuestionInputSchema.parse(input);
  const now = new Date().toISOString();
  const privateToken = randomBytes(24).toString('base64url');
  const photoPath = file ? await saveQuestionPhoto(file) : '';

  db.prepare(`
    INSERT INTO questions (
      private_token, question, location, context, email, photo_path, status,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'new', ?, ?)
  `).run(privateToken, parsed.question, parsed.location, parsed.context, parsed.email, photoPath, now, now);

  return getQuestionByToken(privateToken);
}

export function getQuestionByToken(privateToken: string) {
  if (!/^[A-Za-z0-9_-]{24,80}$/.test(privateToken)) return null;

  const row = db.prepare('SELECT * FROM questions WHERE private_token = ?').get(privateToken) as QuestionRow | undefined;
  return row ? mapTravelerQuestion(row) : null;
}

export function listAdminQuestions(status: string) {
  const allowed = new Set(['new', 'answered', 'closed']);
  const rows = allowed.has(status)
    ? db.prepare('SELECT * FROM questions WHERE status = ? ORDER BY created_at DESC').all(status)
    : db.prepare('SELECT * FROM questions ORDER BY created_at DESC').all();

  return (rows as QuestionRow[]).map(mapAdminQuestionSummary);
}

export function getAdminQuestion(id: number) {
  const row = db.prepare('SELECT * FROM questions WHERE id = ?').get(id) as QuestionRow | undefined;
  return row ? mapAdminQuestion(row) : null;
}

export function getAdminQuestionByToken(privateToken: string) {
  if (!/^[A-Za-z0-9_-]{24,80}$/.test(privateToken)) return null;

  const row = db.prepare('SELECT * FROM questions WHERE private_token = ?').get(privateToken) as QuestionRow | undefined;
  return row ? mapAdminQuestion(row) : null;
}

export function saveAnswerDraft(id: number, input: unknown) {
  const parsed = AnswerInputSchema.parse(input);
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE questions
    SET reply_english = ?, useful_chinese = ?, answer_status = 'draft', updated_at = ?
    WHERE id = ?
  `).run(parsed.replyEnglish, parsed.usefulChinese, now, id);

  return getAdminQuestion(id);
}

export function publishAnswer(id: number, input: unknown) {
  const parsed = AnswerInputSchema.extend({
    replyEnglish: z.string().trim().min(1).max(3000),
  }).parse(input);
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT status FROM questions WHERE id = ?').get(id) as Pick<QuestionRow, 'status'> | undefined;
  if (!existing) {
    return { question: null, shouldSendEmail: false };
  }

  const shouldSendEmail = existing.status !== 'answered';

  db.prepare(`
    UPDATE questions
    SET reply_english = ?, useful_chinese = ?, answer_status = 'published',
        status = 'answered', updated_at = ?, answered_at = ?
    WHERE id = ?
  `).run(parsed.replyEnglish, parsed.usefulChinese, now, now, id);

  return {
    question: getAdminQuestion(id),
    shouldSendEmail,
  };
}

export function recordEmailDelivery(id: number, delivery: {
  status: EmailDeliveryStatus;
  error?: string;
  provider?: string;
  providerMessageId?: string;
}) {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE questions
    SET email_status = ?, email_sent_at = ?, email_error = ?,
        email_provider = ?, email_provider_message_id = ?,
        email_attempted_at = ?, email_retry_count = email_retry_count + 1,
        updated_at = ?
    WHERE id = ?
  `).run(
    delivery.status,
    delivery.status === 'sent' ? now : '',
    sanitizeEmailError(delivery.error ?? ''),
    delivery.provider ?? '',
    delivery.providerMessageId ?? '',
    now,
    now,
    id,
  );
  return getAdminQuestion(id);
}

export function recordAdminNotification(privateToken: string, delivery: {
  status: EmailDeliveryStatus;
  error?: string;
  provider?: string;
  providerMessageId?: string;
}) {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE questions
    SET admin_notification_status = ?, admin_notification_sent_at = ?, admin_notification_error = ?,
        admin_notification_provider = ?, admin_notification_provider_message_id = ?,
        admin_notification_attempted_at = ?, admin_notification_retry_count = admin_notification_retry_count + 1,
        updated_at = ?
    WHERE private_token = ?
  `).run(
    delivery.status,
    delivery.status === 'sent' ? now : '',
    sanitizeEmailError(delivery.error ?? ''),
    delivery.provider ?? '',
    delivery.providerMessageId ?? '',
    now,
    now,
    privateToken,
  );
  return getQuestionByToken(privateToken);
}

export function markEmailPending(id: number) {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE questions
    SET email_status = 'pending', email_error = '', updated_at = ?
    WHERE id = ?
  `).run(now, id);
  return getAdminQuestion(id);
}

export function closeQuestion(id: number) {
  const now = new Date().toISOString();
  db.prepare("UPDATE questions SET status = 'closed', updated_at = ? WHERE id = ?").run(now, id);
  return getAdminQuestion(id);
}

export function findQuestionPhotoByToken(privateToken: string) {
  const row = db.prepare('SELECT photo_path FROM questions WHERE private_token = ?').get(privateToken) as { photo_path?: string } | undefined;
  return row?.photo_path ? getSafePhotoPath(row.photo_path) : null;
}

export function findQuestionPhotoById(id: number) {
  const row = db.prepare('SELECT photo_path FROM questions WHERE id = ?').get(id) as { photo_path?: string } | undefined;
  return row?.photo_path ? getSafePhotoPath(row.photo_path) : null;
}

export function loginAdmin(email: string, password: string) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const plainPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || (!passwordHash && !plainPassword)) {
    throw new Error('Admin authentication is not configured.');
  }

  const emailMatches = email.trim().toLowerCase() === adminEmail.trim().toLowerCase();
  const passwordMatches = passwordHash
    ? verifyPassword(password, passwordHash)
    : plainPassword === password;

  if (!emailMatches || !passwordMatches) {
    return null;
  }

  const token = randomBytes(32).toString('base64url');
  sessions.set(token, { expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  return token;
}

export function requireAdmin(request: Request, response: Response, next: NextFunction) {
  const token = parseCookies(request.headers.cookie ?? '').admin_session;
  const session = token ? sessions.get(token) : null;

  if (!session || session.expiresAt < Date.now()) {
    response.status(401).json({ error: 'Admin login required.' });
    return;
  }

  next();
}

export function clearAdminSession(request: Request) {
  const token = parseCookies(request.headers.cookie ?? '').admin_session;
  if (token) sessions.delete(token);
}

export function isAdminLoggedIn(request: Request) {
  const token = parseCookies(request.headers.cookie ?? '').admin_session;
  const session = token ? sessions.get(token) : null;
  return Boolean(session && session.expiresAt >= Date.now());
}

export function questionSubmissionRateLimit(request: Request, response: Response, next: NextFunction) {
  const ip = request.ip || request.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateLimits.get(ip);

  if (!entry || entry.resetAt < now) {
    rateLimits.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
    next();
    return;
  }

  if (entry.count >= 8) {
    response.status(429).json({ error: 'Too many questions. Please try again later.' });
    return;
  }

  entry.count += 1;
  next();
}

export function setAdminCookie(response: Response, token: string) {
  response.cookie('admin_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAdminCookie(response: Response) {
  response.cookie('admin_session', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 0,
    path: '/',
  });
}

export function createPasswordHash(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

async function saveQuestionPhoto(file: Express.Multer.File) {
  const extension = allowedPhotoTypes[file.mimetype];
  if (!extension) {
    throw new Error('Unsupported file type.');
  }

  const filename = `${randomBytes(20).toString('hex')}${extension}`;
  const absolutePath = path.join(uploadDir, filename);
  await writeFile(absolutePath, file.buffer);
  return filename;
}

function getSafePhotoPath(filename: string) {
  const absolutePath = path.resolve(uploadDir, filename);
  if (!absolutePath.startsWith(uploadDir)) return null;
  return absolutePath;
}

function verifyPassword(password: string, storedHash: string) {
  const [scheme, salt, hash] = storedHash.split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return expected.length === candidate.length && timingSafeEqual(candidate, expected);
}

function parseCookies(cookieHeader: string) {
  const cookies: Record<string, string> = {};
  for (const item of cookieHeader.split(';')) {
    const [key, ...value] = item.trim().split('=');
    if (!key) continue;
    cookies[key] = decodeURIComponent(value.join('='));
  }
  return cookies;
}

function mapTravelerQuestion(row: QuestionRow) {
  const answerPublished = row.answer_status === 'published' && Boolean(row.reply_english);
  return {
    privateToken: row.private_token,
    question: row.question,
    location: row.location,
    context: row.context,
    hasPhoto: Boolean(row.photo_path),
    status: answerPublished ? 'answered' : row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    answeredAt: answerPublished ? row.answered_at : '',
    replyEnglish: answerPublished ? row.reply_english : '',
    usefulChinese: answerPublished ? row.useful_chinese : '',
  };
}

function mapAdminQuestionSummary(row: QuestionRow) {
  return {
    id: row.id,
    status: row.status,
    question: row.question,
    location: row.location,
    context: row.context,
    hasPhoto: Boolean(row.photo_path),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    emailStatus: row.email_status,
    adminNotificationStatus: row.admin_notification_status,
  };
}

function mapAdminQuestion(row: QuestionRow) {
  return {
    id: row.id,
    privateToken: row.private_token,
    question: row.question,
    location: row.location,
    context: row.context,
    email: row.email,
    hasPhoto: Boolean(row.photo_path),
    status: row.status,
    replyEnglish: row.reply_english,
    usefulChinese: row.useful_chinese,
    answerStatus: row.answer_status,
    emailStatus: row.email_status,
    emailSentAt: row.email_sent_at,
    emailError: row.email_error,
    emailProvider: row.email_provider,
    emailProviderMessageId: row.email_provider_message_id,
    emailAttemptedAt: row.email_attempted_at,
    emailRetryCount: row.email_retry_count,
    adminNotificationStatus: row.admin_notification_status,
    adminNotificationSentAt: row.admin_notification_sent_at,
    adminNotificationError: row.admin_notification_error,
    adminNotificationProvider: row.admin_notification_provider,
    adminNotificationProviderMessageId: row.admin_notification_provider_message_id,
    adminNotificationAttemptedAt: row.admin_notification_attempted_at,
    adminNotificationRetryCount: row.admin_notification_retry_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    answeredAt: row.answered_at,
  };
}

function migrateQuestionEmailColumns() {
  const columns = db.prepare('PRAGMA table_info(questions)').all() as Array<{ name: string }>;
  const existingColumns = new Set(columns.map((column) => column.name));
  const migrations = [
    ["context", "ALTER TABLE questions ADD COLUMN context TEXT NOT NULL DEFAULT ''"],
    ["email_status", "ALTER TABLE questions ADD COLUMN email_status TEXT NOT NULL DEFAULT 'pending'"],
    ["email_sent_at", "ALTER TABLE questions ADD COLUMN email_sent_at TEXT NOT NULL DEFAULT ''"],
    ["email_error", "ALTER TABLE questions ADD COLUMN email_error TEXT NOT NULL DEFAULT ''"],
    ["email_provider", "ALTER TABLE questions ADD COLUMN email_provider TEXT NOT NULL DEFAULT ''"],
    ["email_provider_message_id", "ALTER TABLE questions ADD COLUMN email_provider_message_id TEXT NOT NULL DEFAULT ''"],
    ["email_attempted_at", "ALTER TABLE questions ADD COLUMN email_attempted_at TEXT NOT NULL DEFAULT ''"],
    ["email_retry_count", "ALTER TABLE questions ADD COLUMN email_retry_count INTEGER NOT NULL DEFAULT 0"],
    ["admin_notification_status", "ALTER TABLE questions ADD COLUMN admin_notification_status TEXT NOT NULL DEFAULT 'pending'"],
    ["admin_notification_sent_at", "ALTER TABLE questions ADD COLUMN admin_notification_sent_at TEXT NOT NULL DEFAULT ''"],
    ["admin_notification_error", "ALTER TABLE questions ADD COLUMN admin_notification_error TEXT NOT NULL DEFAULT ''"],
    ["admin_notification_provider", "ALTER TABLE questions ADD COLUMN admin_notification_provider TEXT NOT NULL DEFAULT ''"],
    ["admin_notification_provider_message_id", "ALTER TABLE questions ADD COLUMN admin_notification_provider_message_id TEXT NOT NULL DEFAULT ''"],
    ["admin_notification_attempted_at", "ALTER TABLE questions ADD COLUMN admin_notification_attempted_at TEXT NOT NULL DEFAULT ''"],
    ["admin_notification_retry_count", "ALTER TABLE questions ADD COLUMN admin_notification_retry_count INTEGER NOT NULL DEFAULT 0"],
  ] as const;

  for (const [name, sql] of migrations) {
    if (!existingColumns.has(name)) {
      db.exec(sql);
    }
  }
}

function sanitizeEmailError(error: string) {
  return error
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email hidden]')
    .slice(0, 500);
}
