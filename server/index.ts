import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { getExchangeRates } from './exchangeRates';
import { exploreDish } from './exploreDish';
import { formatDestinationAddress } from './formatDestination';
import {
  clearAdminCookie,
  clearAdminSession,
  closeQuestion,
  createLocalQuestion,
  findQuestionPhotoById,
  findQuestionPhotoByToken,
  getAdminQuestion,
  getAdminQuestionByToken,
  getQuestionByToken,
  isAdminLoggedIn,
  listAdminQuestions,
  loginAdmin,
  markEmailPending,
  publishAnswer,
  questionSubmissionRateLimit,
  recordAdminNotification,
  recordEmailDelivery,
  requireAdmin,
  saveAnswerDraft,
  setAdminCookie,
} from './localQuestions';
import { parseRailTicketImage } from './parseRailTicket';
import { sendAdminQuestionNotification, sendReplyEmail } from './services/email';
import { translateMenuImage } from './translateMenu';
import { understandProductImage } from './understandProduct';

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT ?? process.env.API_PORT ?? 8787);
const host = isProduction ? '0.0.0.0' : '127.0.0.1';
const distDir = path.resolve(process.cwd(), 'dist');
const indexHtmlPath = path.join(distDir, 'index.html');
const maxMenuImageMb = Number(process.env.MAX_MENU_IMAGE_MB ?? 8);
const maxMenuImageBytes = maxMenuImageMb * 1024 * 1024;
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const replyEmailSendLocks = new Set<number>();
const corsAllowedOrigins = new Set([
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.PUBLIC_SITE_URL,
  process.env.PUBLIC_APP_URL,
  ...(process.env.CORS_ALLOWED_ORIGINS ?? '').split(','),
].filter((origin): origin is string => Boolean(origin?.trim())).map((origin) => origin.trim().replace(/\/$/, '')));

process.on('unhandledRejection', (error) => {
  console.error('[process:unhandled-rejection]', error);
});

process.on('uncaughtException', (error) => {
  console.error('[process:uncaught-exception]', error);
});

app.use((request, response, next) => {
  const origin = request.headers.origin?.replace(/\/$/, '');

  if (origin && corsAllowedOrigins.has(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    response.setHeader('Vary', 'Origin');
  }

  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  next();
});

app.use(express.json({ limit: '32kb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxMenuImageBytes,
    files: 1,
  },
  fileFilter: (_request, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      callback(new Error('Unsupported file type.'));
      return;
    }

    callback(null, true);
  },
});

app.get('/api/health', (_request, response) => {
  response.json({ ok: true });
});

app.post('/api/local-questions', questionSubmissionRateLimit, upload.single('photo'), async (request, response) => {
  try {
    const result = await createLocalQuestion(request.body, request.file);
    if (!result) {
      response.status(500).json({ error: 'We could not submit your question. Please try again.' });
      return;
    }
    queueNewQuestionAdminNotification({
      privateToken: result.privateToken,
      question: result.question,
      location: result.location,
      context: result.context,
      email: typeof request.body?.email === 'string' ? request.body.email : '',
      createdAt: result.createdAt,
      hasPhoto: result.hasPhoto,
    });
    response.status(201).json(result);
  } catch (error) {
    console.error('[local-questions:create]', error);

    const message = error instanceof Error ? error.message : '';
    if (message.includes('File too large')) {
      response.status(413).json({ error: `Please choose an image smaller than ${maxMenuImageMb} MB.` });
      return;
    }

    if (message.includes('Unsupported file type')) {
      response.status(415).json({ error: 'Please choose a JPEG, PNG, or WebP image.' });
      return;
    }

    response.status(400).json({ error: 'We could not submit your question. Please check the form and try again.' });
  }
});

app.get('/api/questions/:privateToken', (request, response) => {
  const question = getQuestionByToken(request.params.privateToken);
  if (!question) {
    response.status(404).json({ error: 'Question not found.' });
    return;
  }

  response.json(question);
});

app.get('/api/questions/:privateToken/photo', (request, response) => {
  const photoPath = findQuestionPhotoByToken(request.params.privateToken);
  if (!photoPath) {
    response.status(404).json({ error: 'Photo not found.' });
    return;
  }

  response.sendFile(photoPath);
});

app.post('/api/admin/login', (request, response) => {
  try {
    const email = typeof request.body?.email === 'string' ? request.body.email : '';
    const password = typeof request.body?.password === 'string' ? request.body.password : '';
    const token = loginAdmin(email, password);

    if (!token) {
      response.status(401).json({ error: 'Invalid admin email or password.' });
      return;
    }

    setAdminCookie(response, token);
    response.json({ ok: true });
  } catch (error) {
    console.error('[admin:login]', error);
    response.status(500).json({ error: 'Admin login is not configured yet.' });
  }
});

app.post('/api/admin/logout', (request, response) => {
  clearAdminSession(request);
  clearAdminCookie(response);
  response.json({ ok: true });
});

app.get('/api/admin/session', (request, response) => {
  response.json({ authenticated: isAdminLoggedIn(request) });
});

app.get('/api/admin/questions', requireAdmin, (request, response) => {
  const status = typeof request.query.status === 'string' ? request.query.status : 'all';
  response.json({ questions: listAdminQuestions(status) });
});

app.get('/api/admin/questions/:id', requireAdmin, (request, response) => {
  const question = getAdminQuestion(Number(request.params.id));
  if (!question) {
    response.status(404).json({ error: 'Question not found.' });
    return;
  }

  response.json(question);
});

app.get('/api/admin/questions/:id/photo', requireAdmin, (request, response) => {
  const photoPath = findQuestionPhotoById(Number(request.params.id));
  if (!photoPath) {
    response.status(404).json({ error: 'Photo not found.' });
    return;
  }

  response.sendFile(photoPath);
});

app.put('/api/admin/questions/:id/draft', requireAdmin, (request, response) => {
  const question = saveAnswerDraft(Number(request.params.id), request.body);
  if (!question) {
    response.status(404).json({ error: 'Question not found.' });
    return;
  }

  response.json(question);
});

app.put('/api/admin/questions/:id/publish', requireAdmin, async (request, response) => {
  try {
    const result = publishAnswer(Number(request.params.id), request.body);
    const question = result.question;
    if (!question) {
      response.status(404).json({ error: 'Question not found.' });
      return;
    }

    if (!result.shouldSendEmail) {
      response.json({
        question,
        emailDeliveryMessage: 'Reply updated. Email was not resent automatically.',
      });
      return;
    }

    const deliveredQuestion = await sendQuestionReplyEmail(question.id);
    response.json({
      question: deliveredQuestion ?? question,
      emailDeliveryMessage: getReplyEmailMessage(deliveredQuestion?.emailStatus),
    });
  } catch {
    response.status(400).json({ error: 'Write a reply before publishing.' });
  }
});

app.post('/api/admin/questions/:id/email', requireAdmin, async (request, response) => {
  try {
    const question = getAdminQuestion(Number(request.params.id));
    if (!question) {
      response.status(404).json({ error: 'Question not found.' });
      return;
    }

    if (question.answerStatus !== 'published' || !question.replyEnglish.trim()) {
      response.status(400).json({ error: 'Publish a reply before sending email.' });
      return;
    }

    const deliveredQuestion = await sendQuestionReplyEmail(question.id);
    response.json({
      question: deliveredQuestion ?? question,
      emailDeliveryMessage: getRetryEmailMessage(deliveredQuestion?.emailStatus),
    });
  } catch (error) {
    console.error('[admin:question-email]', error);
    response.status(500).json({ error: 'Email could not be sent. The reply is still saved.' });
  }
});

app.put('/api/admin/questions/:id/close', requireAdmin, (request, response) => {
  const question = closeQuestion(Number(request.params.id));
  if (!question) {
    response.status(404).json({ error: 'Question not found.' });
    return;
  }

  response.json(question);
});

app.post('/api/translate-menu', upload.single('menu_image'), async (request, response) => {
  try {
    if (!request.file) {
      response.status(400).json({ error: 'Please choose one menu image.' });
      return;
    }

    const result = await translateMenuImage(request.file);
    response.json(result);
  } catch (error) {
    console.error('[translate-menu]', error);

    const message = error instanceof Error ? error.message : '';
    if (message.includes('File too large')) {
      response.status(413).json({ error: `Please choose an image smaller than ${maxMenuImageMb} MB.` });
      return;
    }

    if (message.includes('Unsupported file type')) {
      response.status(415).json({ error: 'Please choose a JPEG, PNG, or WebP image.' });
      return;
    }

    if (isAiConfigurationError(message)) {
      response.status(500).json({ error: 'Menu translation is not configured yet.' });
      return;
    }

    response.status(500).json({
      error: 'We could not translate this menu. Please try another photo.',
    });
  }
});

app.post('/api/parse-rail-ticket', upload.single('ticket_image'), async (request, response) => {
  try {
    if (!request.file) {
      response.status(400).json({ error: 'Please choose one ticket screenshot.' });
      return;
    }

    const result = await parseRailTicketImage(request.file);
    response.json(result);
  } catch (error) {
    console.error('[parse-rail-ticket]', error);

    const message = error instanceof Error ? error.message : '';
    if (message.includes('File too large')) {
      response.status(413).json({ error: `Please choose an image smaller than ${maxMenuImageMb} MB.` });
      return;
    }

    if (message.includes('Unsupported file type')) {
      response.status(415).json({ error: 'Please choose a JPEG, PNG, or WebP image.' });
      return;
    }

    if (isAiConfigurationError(message)) {
      response.status(500).json({ error: 'Ticket understanding is not configured yet.' });
      return;
    }

    response.status(500).json({
      error: 'We could not read this ticket. Try uploading a clearer screenshot.',
    });
  }
});

app.post('/api/understand-product', upload.single('product_image'), async (request, response) => {
  try {
    if (!request.file) {
      response.status(400).json({ error: 'Please choose one product image.' });
      return;
    }

    const result = await understandProductImage(request.file);
    response.json(result);
  } catch (error) {
    console.error('[understand-product]', error);

    const message = error instanceof Error ? error.message : '';
    if (message.includes('File too large')) {
      response.status(413).json({ error: `Please choose an image smaller than ${maxMenuImageMb} MB.` });
      return;
    }

    if (message.includes('Unsupported file type')) {
      response.status(415).json({ error: 'Please choose a JPEG, PNG, or WebP image.' });
      return;
    }

    if (isAiConfigurationError(message)) {
      response.status(500).json({ error: 'Product understanding is not configured yet.' });
      return;
    }

    response.status(500).json({
      error: 'We could not understand this product. Try uploading a clearer photo.',
    });
  }
});

app.post('/api/explore-dish', async (request, response) => {
  try {
    const dishName = typeof request.body?.dishName === 'string' ? request.body.dishName.trim() : '';

    if (!dishName) {
      response.status(400).json({ error: 'Enter a dish name first.' });
      return;
    }

    if (dishName.length > 120) {
      response.status(400).json({ error: 'Please enter a shorter dish name.' });
      return;
    }

    const result = await exploreDish(dishName);
    response.json(result);
  } catch (error) {
    console.error('[explore-dish]', error);

    const message = error instanceof Error ? error.message : '';
    if (isAiConfigurationError(message)) {
      response.status(500).json({ error: 'Dish exploration is not configured yet.' });
      return;
    }

    response.status(500).json({
      error: "We couldn't identify this dish. Try entering the Chinese name or checking the spelling.",
    });
  }
});

app.post('/api/format-destination', async (request, response) => {
  try {
    const destination = typeof request.body?.destination === 'string' ? request.body.destination.trim() : '';

    if (!destination) {
      response.status(400).json({ error: 'Enter a destination first.' });
      return;
    }

    if (destination.length < 2 || !/[\p{L}\p{N}\p{Script=Han}]/u.test(destination)) {
      response.status(400).json({ error: 'Try adding a real address, place name, city, or nearby landmark.' });
      return;
    }

    if (destination.length > 240) {
      response.status(400).json({ error: 'Please enter a shorter destination.' });
      return;
    }

    const result = await formatDestinationAddress(destination);
    response.json(result);
  } catch (error) {
    console.error('[format-destination]', error);

    const message = error instanceof Error ? error.message : '';
    if (isAiConfigurationError(message)) {
      response.status(500).json({ error: 'Destination formatting is not configured yet.' });
      return;
    }

    response.status(500).json({
      error: "We couldn't format this destination. Try adding the city, district, or a nearby landmark.",
    });
  }
});

app.get('/api/exchange-rates', async (request, response) => {
  try {
    const base = typeof request.query.base === 'string' ? request.query.base : 'CNY';
    const result = await getExchangeRates(base);
    response.json(result);
  } catch (error) {
    console.error('[exchange-rates]', error);
    response.status(500).json({
      error: 'We could not load exchange rates. Please try again.',
    });
  }
});

if (isProduction) {
  if (existsSync(indexHtmlPath)) {
    app.use(express.static(distDir));
    app.get(/^(?!\/api(?:\/|$)).*/, (request, response, next) => {
      if (request.method !== 'GET') {
        next();
        return;
      }

      if (request.path.startsWith('/private_uploads') || request.path.startsWith('/server/private_uploads')) {
        response.status(404).json({ error: 'Not found.' });
        return;
      }

      response.sendFile(indexHtmlPath);
    });
  } else {
    console.warn(`Production frontend build not found at ${indexHtmlPath}. Run pnpm build before pnpm start.`);
  }
}

app.use((error: Error, _request: express.Request, response: express.Response, next: express.NextFunction) => {
  if (!error) {
    next();
    return;
  }

  if (error.message.includes('Unsupported file type')) {
    response.status(415).json({ error: 'Please choose a JPEG, PNG, or WebP image.' });
    return;
  }

  if (error.message.includes('File too large')) {
    response.status(413).json({ error: `Please choose an image smaller than ${maxMenuImageMb} MB.` });
    return;
  }

  console.error('[api:error]', error);
  response.status(500).json({ error: 'Something went wrong. Please try again.' });
});

app.use((_request, response) => {
  response.status(404).json({ error: 'Not found.' });
});

async function sendQuestionReplyEmail(id: number) {
  if (replyEmailSendLocks.has(id)) {
    return getAdminQuestion(id);
  }

  replyEmailSendLocks.add(id);
  const pendingQuestion = markEmailPending(id);
  try {
    if (!pendingQuestion) return null;

    const appUrl = getPublicSiteUrl();
    const privateUrl = `${appUrl}/questions/${pendingQuestion.privateToken}`;

    try {
      const result = await sendReplyEmail({
        to: pendingQuestion.email,
        question: pendingQuestion.question,
        replyEnglish: pendingQuestion.replyEnglish,
        usefulChinese: pendingQuestion.usefulChinese,
        privateUrl,
      });

      return recordEmailDelivery(pendingQuestion.id, {
        status: result.status,
        error: result.error,
        provider: result.provider,
        providerMessageId: result.providerMessageId,
      });
    } catch (error) {
      console.error('[email:send-reply]', error instanceof Error ? error.message : error);
      return recordEmailDelivery(pendingQuestion.id, {
        status: 'failed',
        error: 'Email service temporarily unavailable.',
        provider: 'resend',
      });
    }
  } finally {
    replyEmailSendLocks.delete(id);
  }
}

function getReplyEmailMessage(status?: string) {
  if (status === 'sent') return 'Reply published and email sent.';
  if (status === 'development_logged') return 'Reply published. Development only - no email was sent.';
  if (status === 'not_configured') return 'Reply published, but email service is not configured.';
  return 'Reply published, but email delivery failed.';
}

function getRetryEmailMessage(status?: string) {
  if (status === 'sent') return 'Email sent.';
  if (status === 'development_logged') return 'Development only - no email was sent.';
  if (status === 'not_configured') return 'Email service is not configured.';
  return 'Email delivery failed.';
}

function isAiConfigurationError(message: string) {
  return [
    'OPENAI_API_KEY',
    'OPENAI_MENU_MODEL',
    'OPENAI_TEXT_MODEL',
    'OPENAI_VISION_MODEL',
  ].some((name) => message.includes(name));
}

function queueNewQuestionAdminNotification(question: {
  privateToken: string;
  question: string;
  location: string;
  context: string;
  email: string;
  createdAt: string;
  hasPhoto: boolean;
}) {
  setImmediate(() => {
    sendNewQuestionAdminNotification(question).catch((error) => {
      console.error('[email:admin-notification:unhandled]', error instanceof Error ? error.message : error);
      safeRecordAdminNotification(question.privateToken, {
        status: 'failed',
        error: 'Admin notification failed after question submission.',
        provider: 'resend',
      });
    });
  });
}

async function sendNewQuestionAdminNotification(question: {
  privateToken: string;
  question: string;
  location: string;
  context: string;
  email: string;
  createdAt: string;
  hasPhoto: boolean;
}) {
  try {
    const adminNotificationEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL;
    if (!adminNotificationEmail) {
      safeRecordAdminNotification(question.privateToken, {
        status: 'not_configured',
        error: 'Admin notification email is not configured.',
        provider: 'resend',
      });
      return;
    }

    const appUrl = getPublicSiteUrl();
    const adminQuestion = getAdminQuestionByToken(question.privateToken);
    const result = await sendAdminQuestionNotification({
      to: adminNotificationEmail,
      question: question.question,
      location: question.location,
      context: question.context,
      userEmail: question.email,
      createdAt: question.createdAt,
      hasPhoto: question.hasPhoto,
      adminUrl: adminQuestion ? `${appUrl}/admin/questions/${adminQuestion.id}` : `${appUrl}/admin/questions`,
    });
    safeRecordAdminNotification(question.privateToken, {
      status: result.status,
      error: result.error,
      provider: result.provider,
      providerMessageId: result.providerMessageId,
    });
  } catch (error) {
    console.error('[email:admin-notification]', error instanceof Error ? error.message : error);
    safeRecordAdminNotification(question.privateToken, {
      status: 'failed',
      error: 'Admin notification failed.',
      provider: 'resend',
    });
  }
}

function safeRecordAdminNotification(privateToken: string, delivery: {
  status: 'pending' | 'sent' | 'failed' | 'development_logged' | 'not_configured';
  error?: string;
  provider?: string;
  providerMessageId?: string;
}) {
  try {
    recordAdminNotification(privateToken, delivery);
  } catch (error) {
    console.error('[email:admin-notification:record]', error instanceof Error ? error.message : error);
  }
}

function getPublicSiteUrl() {
  return (process.env.PUBLIC_SITE_URL || process.env.PUBLIC_APP_URL || 'http://127.0.0.1:5173').replace(/\/$/, '');
}

export const server = app.listen(port, host, () => {
  console.log(`Orienta server running at http://${host}:${port}`);
});
