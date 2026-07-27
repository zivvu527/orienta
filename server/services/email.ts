type ReplyEmailInput = {
  to: string;
  question: string;
  replyEnglish: string;
  usefulChinese?: string;
  privateUrl: string;
};

type AdminNotificationInput = {
  to: string;
  question: string;
  location?: string;
  context?: string;
  userEmail: string;
  createdAt: string;
  adminUrl: string;
  hasPhoto: boolean;
};

type EmailSendResult = {
  ok: boolean;
  mode: 'resend' | 'development' | 'not_configured';
  status: 'sent' | 'failed' | 'development_logged' | 'not_configured';
  provider?: string;
  providerMessageId?: string;
  error?: string;
};

export async function sendReplyEmail(input: ReplyEmailInput): Promise<EmailSendResult> {
  const subject = 'Your Orienta local answer';
  return sendTransactionalEmail({
    to: input.to,
    subject,
    html: buildReplyEmailHtml(input),
    text: buildReplyEmailText(input),
    logPreview: buildReplyEmailText(input).slice(0, 500),
  });
}

export async function sendAdminQuestionNotification(input: AdminNotificationInput): Promise<EmailSendResult> {
  const subject = 'New Ask a Local question';
  return sendTransactionalEmail({
    to: input.to,
    subject,
    html: buildAdminNotificationHtml(input),
    text: buildAdminNotificationText(input),
    logPreview: buildAdminNotificationText(input).slice(0, 500),
  });
}

async function sendTransactionalEmail({
  to,
  subject,
  html,
  text,
  logPreview,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
  logPreview: string;
}): Promise<EmailSendResult> {
  if (process.env.EMAIL_DEV_FORCE_FAIL === 'true') {
    return { ok: false, mode: 'development', status: 'failed', provider: 'development', error: 'Development forced email failure.' };
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const configuredFrom = process.env.EMAIL_FROM;
  const from = configuredFrom || 'Orienta <support@example.com>';
  const replyTo = process.env.EMAIL_REPLY_TO;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!resendApiKey) {
    if (isProduction) {
      console.error('[email:not-configured] RESEND_API_KEY is not configured. Email was not sent.');
      return { ok: false, mode: 'not_configured', status: 'not_configured', provider: 'resend', error: 'RESEND_API_KEY is not configured.' };
    }
    console.log('[email:development-only] No RESEND_API_KEY configured. Email was not sent to a real inbox.');
    console.log('[email:development-only]', {
      to: maskEmail(to),
      subject,
      preview: logPreview,
    });
    return { ok: true, mode: 'development', status: 'development_logged', provider: 'development' };
  }

  if (!configuredFrom && isProduction) {
    console.error('[email:not-configured] EMAIL_FROM is not configured. Email was not sent.');
    return { ok: false, mode: 'not_configured', status: 'not_configured', provider: 'resend', error: 'EMAIL_FROM is not configured.' };
  }

  const payload: Record<string, unknown> = {
    from,
    to: [to],
    subject,
    html,
    text,
  };
  if (replyTo) payload.reply_to = replyTo;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    return {
      ok: false,
      mode: 'resend',
      status: 'failed',
      provider: 'resend',
      error: `Email provider returned ${response.status}: ${body.slice(0, 180)}`,
    };
  }

  const body = await response.json().catch(() => null) as { id?: string } | null;
  return { ok: true, mode: 'resend', status: 'sent', provider: 'resend', providerMessageId: body?.id ?? '' };
}

function buildReplyEmailHtml(input: ReplyEmailInput) {
  const chineseBlock = input.usefulChinese
    ? `<h2>Useful Chinese</h2><p style="font-size:20px;font-weight:700;">${escapeHtml(input.usefulChinese)}</p>`
    : '';

  return `
<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#fffdf8;color:#17211d;font-family:Arial,sans-serif;">
    <main style="max-width:560px;margin:0 auto;">
      <h1 style="font-size:24px;line-height:1.2;">Your Orienta local answer</h1>
      <h2 style="margin-top:24px;font-size:14px;text-transform:uppercase;color:#66736d;">Your question</h2>
      <p style="font-size:16px;line-height:1.5;">${escapeHtml(input.question)}</p>
      <h2 style="margin-top:24px;font-size:14px;text-transform:uppercase;color:#66736d;">Reply from a Local Expert</h2>
      <p style="font-size:16px;line-height:1.5;">${escapeHtml(input.replyEnglish)}</p>
      ${chineseBlock}
      <p style="margin-top:28px;font-size:15px;line-height:1.5;">You can also view your question and reply here:</p>
      <p><a href="${escapeHtml(input.privateUrl)}" style="color:#bd3f30;font-weight:700;">Open your private question page</a></p>
      <p style="margin-top:24px;color:#66736d;font-size:13px;line-height:1.5;">Orienta is not an emergency service. For urgent police, ambulance, or fire help in China, use local emergency numbers immediately.</p>
      <p style="margin-top:28px;color:#66736d;font-size:13px;">Thank you for using Orienta.</p>
    </main>
  </body>
</html>`;
}

function buildReplyEmailText(input: ReplyEmailInput) {
  return [
    'Hi,',
    '',
    'Your question:',
    input.question,
    '',
    'Reply from a Local Expert:',
    input.replyEnglish,
    input.usefulChinese ? ['', 'Useful Chinese:', input.usefulChinese] : '',
    '',
    'You can also view your question and reply here:',
    input.privateUrl,
    '',
    'Orienta is not an emergency service. For urgent police, ambulance, or fire help in China, use local emergency numbers immediately.',
    '',
    'Thank you for using Orienta.',
  ].flat().filter(Boolean).join('\n');
}

function buildAdminNotificationHtml(input: AdminNotificationInput) {
  const contextBlock = input.context
    ? `<h2 style="margin-top:20px;font-size:14px;text-transform:uppercase;color:#66736d;">Context</h2><p style="font-size:16px;line-height:1.5;">${escapeHtml(input.context)}</p>`
    : '';

  return `
<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#fffdf8;color:#17211d;font-family:Arial,sans-serif;">
    <main style="max-width:560px;margin:0 auto;">
      <h1 style="font-size:24px;line-height:1.2;">New Ask a Local question</h1>
      <h2 style="margin-top:24px;font-size:14px;text-transform:uppercase;color:#66736d;">Question</h2>
      <p style="font-size:16px;line-height:1.5;">${escapeHtml(input.question)}</p>
      ${input.location ? `<p style="font-size:15px;color:#66736d;"><strong>City:</strong> ${escapeHtml(input.location)}</p>` : ''}
      ${contextBlock}
      <p style="font-size:15px;color:#66736d;"><strong>Submitted:</strong> ${escapeHtml(input.createdAt)}</p>
      <p style="font-size:15px;color:#66736d;"><strong>User email:</strong> ${escapeHtml(maskEmail(input.userEmail))}</p>
      <p style="font-size:15px;color:#66736d;"><strong>Attachment:</strong> ${input.hasPhoto ? 'Yes' : 'No'}</p>
      <p style="margin-top:28px;"><a href="${escapeHtml(input.adminUrl)}" style="color:#bd3f30;font-weight:700;">Open admin dashboard</a></p>
    </main>
  </body>
</html>`;
}

function buildAdminNotificationText(input: AdminNotificationInput) {
  return [
    'New Ask a Local question',
    '',
    'Question:',
    input.question,
    input.location ? ['', 'City:', input.location] : '',
    input.context ? ['', 'Context:', input.context] : '',
    '',
    `Submitted: ${input.createdAt}`,
    `User email: ${maskEmail(input.userEmail)}`,
    `Attachment: ${input.hasPhoto ? 'Yes' : 'No'}`,
    '',
    'Open admin dashboard:',
    input.adminUrl,
  ].flat().filter(Boolean).join('\n');
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function maskEmail(email: string) {
  const [name, domain] = email.split('@');
  if (!name || !domain) return 'hidden';
  return `${name.slice(0, 2)}***@${domain}`;
}
