# Orienta

Orienta is a scenario-based communication and action assistant for international travelers in China.

The current product focuses on travelers who are already in China and need to complete an immediate real-world task in places like restaurants, taxis, train stations, shops, or emergency situations.

Orienta is not currently focused on:
- Visa checks
- Pre-trip preparation
- Internet setup
- Payment account setup
- Full travel guides
- Trip planning

## Current Main Product Scenarios

Home shows the current MVP scenario list:

1. Restaurant
2. Address Helper
3. High-speed Rail
4. Quick Phrases
5. Shopping
6. Ask a Local

Emergency is available as a fixed quick action on the home screen rather than a normal scenario card. In the MVP it only covers immediate actions:

- Police: 110
- Ambulance: 120
- Fire Service: 119
- Traffic Accident: 122

Longer recovery workflows such as lost passport, lost phone, and robbery are outside the active MVP scope.

Payment and Internet are not standalone main-product scenarios. On-site payment phrases may still appear inside relevant live scenarios, such as Restaurant, when they help the traveler communicate in the moment.

## Product Principles

- Scenario first
- Task completion over translation
- Immediate use
- Mobile-first
- One task per screen
- Simple English
- Chinese text must be easy to show to local people
- Phrases are an assistant feature, not the whole product
- No open community in the MVP

## Translate Menu

Restaurant > Translate Menu is the first real AI-powered feature in the MVP.

It supports taking or uploading one menu image from the browser, previews the image before submission, sends it to the local server API, and renders structured dish cards. Images are processed in memory only and are not saved to disk or a database.

The server endpoint is:

```text
POST /api/translate-menu
```

Accepted image types:

- JPEG
- PNG
- WebP

Maximum image size:

- 8 MB on the server
- The frontend attempts to compress large mobile photos before upload

The AI result is validated at runtime with Zod before it is returned to the frontend. If the menu cannot be read clearly, the API should return an uncertain or unable-to-recognize result rather than inventing dishes or prices.

### Environment Variables

Create a local `.env` file based on `.env.example`:

```text
OPENAI_API_KEY=your_api_key_here
OPENAI_TEXT_MODEL=gpt-4.1-mini
OPENAI_VISION_MODEL=gpt-4.1-mini
OPENAI_MENU_MODEL=gpt-4.1-mini # optional fallback for older environments
OPENAI_TEXT_TIMEOUT_MS=45000
OPENAI_VISION_TIMEOUT_MS=90000
OPENAI_MENU_TIMEOUT_MS=150000
MAX_MENU_IMAGE_MB=8
API_PORT=8787
```

`.env` is ignored by git. Only `.env.example` should be committed.

### Local Development

Install dependencies:

```bash
pnpm install
```

Start the frontend and API server together:

```bash
pnpm dev:all
```

Or start them separately:

```bash
pnpm dev:api
pnpm dev
```

Open the app at:

```text
http://127.0.0.1:5173/
```

Test flow:

1. Open Orienta.
2. Tap Restaurant.
3. Tap Translate Menu.
4. Take a photo or upload a JPEG, PNG, or WebP menu image.
5. Confirm the preview.
6. Tap Translate Menu.
7. Review the structured menu result cards.
8. Use Try Again after a failed request or remove the image to choose another one.

Known limits:

- Menu recognition depends on image clarity and model behavior.
- Prices, ingredients, allergens, pork, nuts, seafood, and spiciness may be incomplete.
- Users should confirm important dietary or allergy information with restaurant staff.
- No OCR, AI output, or image data is permanently stored by the local MVP server.

## Explore A Dish

Restaurant > Explore a Dish lets a traveler enter a Chinese or English dish name and receive a structured AI dish guide.

The server endpoint is:

```text
POST /api/explore-dish
```

Request body:

```json
{
  "dishName": "Mapo Tofu"
}
```

The result includes dish names, pinyin, a short description, main ingredients, flavor, spice level, common allergens, dietary notes, serving style, eating guidance, portion guidance, beginner friendliness, and a Chinese ordering phrase.

Test flow:

1. Open Orienta.
2. Tap Restaurant.
3. Tap Explore a Dish.
4. Enter `Mapo Tofu` or tap an example.
5. Tap Explore.
6. Review the dish guide.
7. Tap Order This Dish to show a large Chinese ordering card.

Known limits:

- Dish information may vary by region and restaurant.
- Allergy and dietary information is not a guarantee.
- Users should confirm important ingredients with restaurant staff.

## Address Helper

Address Helper > Translate an Address formats a Chinese, English, or mixed destination into a bilingual address card.

The server endpoint is:

```text
POST /api/format-destination
```

Request body:

```json
{
  "destination": "上海市黄浦区南京东路300号"
}
```

The result includes input type, detected language, structured address fields, formatted Chinese address, formatted English address, confidence, ambiguity state, and a driver card.

Current scope:

- Address understanding
- Address structure parsing
- Chinese and English formatting
- Driver card display
- Saved address reopening
- Saved address rename and delete

Current limits:

- Addresses are formatted, but not map-verified.
- No map API, geocoding, login, history, or saved validation is included yet.
- Ambiguous place names should ask for more details instead of inventing a destination.

Archived:

- `src/legacy/scenarios/taxi-phrases/`: earlier Taxi Phrases data removed from the active product.

## High-speed Rail

High-speed Rail helps travelers understand a rail ticket screenshot, follow the basic boarding flow, and show a few useful phrases to station staff.

The server endpoint for ticket understanding is:

```text
POST /api/parse-rail-ticket
```

Accepted screenshot types:

- JPEG
- PNG
- WebP

Current active rail functions:

- Understand My Ticket: upload one 12306, Trip.com, China Railway e-ticket, or order screenshot and render a structured ticket card.
- Boarding Steps: static, short step-by-step station flow.
- Railway Phrases: 8 high-frequency phrases only.

Current limits:

- Ticket information depends on screenshot clarity and model behavior.
- Results are not raw OCR; they are normalized into a clean ticket card.
- The feature does not search trains, book tickets, change tickets, refund tickets, check live status, or compare fares.
- Important details should still be confirmed in the original ticket app or with station staff.

## Shopping

Shopping helps travelers understand what they are buying, convert prices, and communicate with shop staff.

Current active shopping functions:

- Understand a Product: upload one product photo and render a structured product card.
- Currency Converter: convert CNY, USD, EUR, GBP, JPY, and KRW using current exchange rates.
- Shopping Phrases: 8 high-frequency in-store phrases.

The product understanding endpoint is:

```text
POST /api/understand-product
```

The exchange rate endpoint is:

```text
GET /api/exchange-rates?base=CNY
```

Product Card fields adapt by category:

- Food / snack: description, ingredients, allergens, flavor, good for.
- Drink: flavor, sugar, caffeine, alcohol when visible or clearly indicated.
- Medicine: what it appears to be, visible usage information, warnings, with no diagnosis or dosage advice.
- Skincare / cosmetics: what it does, skin type, key ingredients when visible.
- Other products: category, description, warnings, good for.

Current limits:

- Product recognition depends on photo clarity and package visibility.
- Ingredients, allergens, caffeine, sugar, alcohol, and usage details may be incomplete.
- Medicine results are for package understanding only and are not medical advice.
- Exchange rates come from a live public rate endpoint and are cached briefly by the local API server.

## Ask A Local

Ask a Local is a private human Q&A workflow, not an AI chatbot and not a public community.

Flow:

1. A traveler submits a question without creating an account.
2. The question is saved in local SQLite.
3. The traveler receives a private `/questions/{privateToken}` page as a backup.
4. An authenticated admin reviews the question in `/admin/questions`.
5. The admin saves a draft or publishes one official reply.
6. The server emails the published reply to the traveler.
7. The traveler can also revisit the private link to see the reply.
8. A new-question notification can be sent to the admin email when a traveler submits.

Server endpoints:

```text
POST /api/local-questions
GET /api/questions/:privateToken
GET /api/questions/:privateToken/photo
POST /api/admin/login
POST /api/admin/logout
GET /api/admin/session
GET /api/admin/questions
GET /api/admin/questions/:id
GET /api/admin/questions/:id/photo
PUT /api/admin/questions/:id/draft
PUT /api/admin/questions/:id/publish
POST /api/admin/questions/:id/email
PUT /api/admin/questions/:id/close
```

Local admin defaults in `.env`:

```text
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-local-password
ADMIN_PASSWORD_HASH=
PUBLIC_APP_URL=http://127.0.0.1:5173
PUBLIC_SITE_URL=http://127.0.0.1:5173
RESEND_API_KEY=
EMAIL_FROM=Orienta <hello@mail.orienta.cn>
EMAIL_REPLY_TO=support@mail.orienta.cn
ADMIN_NOTIFICATION_EMAIL=
```

Email delivery:

- Traveler email is required for new questions.
- Reply emails are sent by the Express server when an admin first publishes a reply.
- The current provider is Resend, configured with `RESEND_API_KEY`.
- Only a successful Resend API response is recorded as `sent`.
- If `RESEND_API_KEY` is empty, local development logs a development-only email preview instead of sending a real email and records `development_logged`, not `sent`.
- In production, a missing `RESEND_API_KEY` records `not_configured` and no real email is sent.
- `ADMIN_NOTIFICATION_EMAIL` receives new-question notifications. If it is empty, the app falls back to `ADMIN_EMAIL`.
- First publish sends automatically. Later edits update the saved reply but do not resend automatically; use the admin `Resend Email` / `Retry Email` button.
- Failed delivery is recorded on the question and can be retried from the admin detail page.
- Delivery records include provider, provider message ID, attempted time, sent time, retry count, and sanitized error message.
- In production, the `EMAIL_FROM` domain must be verified with Resend. Do not use a personal Gmail address as the production sender.
- `PUBLIC_SITE_URL` is used for links in emails. `PUBLIC_APP_URL` is still supported for local compatibility.

For production-like use, generate a password hash and set `ADMIN_PASSWORD_HASH` instead of `ADMIN_PASSWORD`:

```bash
pnpm admin:hash "your-strong-password"
```

Storage:

- SQLite database: `server/data/ask-local.sqlite`
- Private uploads: `server/private_uploads/questions`
- Both are ignored by git.
- Photos are not served from `public/`; they are returned through private token or authenticated admin routes.

Current limits:

- Admin sessions are in memory, so restarting the local API logs admins out.
- SQLite and private uploads need persistent server storage when deployed; hosts with ephemeral filesystems may lose questions or uploaded photos after redeploy.
- There is one admin account in the MVP, but the schema leaves room for responder fields later.

## Render Web Service Deployment Plan

The recommended public beta deployment is one Render Web Service that serves both:

- the built Vite frontend from `dist/`
- the Express API from `server/index.ts`

Ask a Local data should stay on a Render Persistent Disk so questions, answers, email delivery status, and uploaded photos survive restarts and redeployments.

### Render Commands

Build command:

```bash
pnpm install --frozen-lockfile && pnpm build
```

Start command:

```bash
pnpm start
```

Health check path:

```text
/api/health
```

### Persistent Disk

Create one Render Persistent Disk and mount it at:

```text
/var/data/orienta
```

Use these production paths:

```text
QUESTION_DB_PATH=/var/data/orienta/data/ask-local.sqlite
QUESTION_UPLOAD_DIR=/var/data/orienta/uploads/questions
```

The server creates the missing `data` and `uploads/questions` folders automatically.

Important: do not place Ask a Local uploads in `public/` or `dist/`. Uploaded photos are private and are only returned through:

```text
GET /api/questions/:privateToken/photo
GET /api/admin/questions/:id/photo
```

### Required Render Environment Variables

```text
NODE_ENV=production
PUBLIC_SITE_URL=https://orienta.cn
PUBLIC_APP_URL=https://orienta.cn
QUESTION_DB_PATH=/var/data/orienta/data/ask-local.sqlite
QUESTION_UPLOAD_DIR=/var/data/orienta/uploads/questions

OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_API_MODE=responses
OPENAI_TEXT_MODEL=
OPENAI_VISION_MODEL=
OPENAI_MENU_MODEL=
OPENAI_TEXT_TIMEOUT_MS=45000
OPENAI_VISION_TIMEOUT_MS=90000
OPENAI_MENU_TIMEOUT_MS=150000
MAX_MENU_IMAGE_MB=8

RESEND_API_KEY=
EMAIL_FROM=Orienta <hello@mail.orienta.cn>
EMAIL_REPLY_TO=support@mail.orienta.cn
ADMIN_NOTIFICATION_EMAIL=

ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=
```

Render provides `PORT` automatically. Do not hard-code it.

For production admin login, generate a password hash locally:

```bash
pnpm admin:hash "your-strong-password"
```

Then put the generated value in `ADMIN_PASSWORD_HASH`. Do not use `ADMIN_PASSWORD` in production.

### Domain Setup

Custom domain setup will be done later in Render:

- `orienta.cn` should point to the Render Web Service.
- `www.orienta.cn` can redirect to `orienta.cn`.
- Do not change the existing Resend DNS records for `mail.orienta.cn`.

### Backup Warning

The persistent disk is the source of truth for Ask a Local. Back up both:

```text
/var/data/orienta/data/ask-local.sqlite
/var/data/orienta/uploads/questions
```

Before major deploys or schema changes, create a backup. If the persistent disk is deleted, Ask a Local questions and uploaded photos are lost.

## iOS Capacitor Shell

The iOS app uses the same React/Vite frontend as the Web Beta. The app shell is generated with Capacitor and calls the deployed Express API over HTTPS.

### What stays shared

- Product screens, UI, and interaction logic stay in `src/`.
- OpenAI, Resend, SQLite, and private uploads stay on the Render server.
- The iOS app does not include server secrets.

### Local Web Development

Leave `VITE_API_BASE_URL` empty for normal web development:

```text
VITE_API_BASE_URL=
```

The Vite dev server will continue proxying `/api` to the local Express server.

### iOS Build API URL

Before syncing the iOS shell, build with the public HTTPS API:

```text
VITE_API_BASE_URL=https://orienta.cn pnpm build
pnpm cap:sync
```

On Windows PowerShell:

```powershell
$env:VITE_API_BASE_URL="https://orienta.cn"
pnpm build
pnpm cap:sync
```

### iOS Project

The iOS project lives in:

```text
ios/
```

To run it on a simulator or real iPhone, open the project on a Mac with Xcode:

```text
pnpm cap:ios
```

If running from Windows, copy or pull the repository on a Mac first, then run the Xcode steps there.

### CORS

The Express API allows Capacitor origins by default:

```text
capacitor://localhost
ionic://localhost
```

If more origins are needed later, add them with:

```text
CORS_ALLOWED_ORIGINS=capacitor://localhost,ionic://localhost
```

### Current iOS Phase

Phase 2 only adds the iOS shell, API base URL support, and CORS. Camera plugin integration and HEIC-specific image handling are intentionally deferred until Home and basic navigation are verified on iPhone.

## Legacy

Archived prototypes and removed directions live under `src/legacy/`.

`CT` is retained only as an internal development codename and should not appear in user-facing product UI.

- `src/legacy/visa-workflow/`: earlier China travel workflow and visa prototype
- `src/legacy/pre-trip-tools/payment/`: earlier standalone Payment tool
- `src/legacy/pre-trip-tools/internet/`: earlier standalone Internet tool
- `src/legacy/scenarios/hotel/`: earlier standalone Hotel scenario
- `src/legacy/scenarios/hospital/`: earlier standalone Hospital scenario
