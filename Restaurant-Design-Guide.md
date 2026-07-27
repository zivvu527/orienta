# Orienta Restaurant Design Guide

## 1. Purpose

This document defines how the Restaurant module expresses Orienta's design language.

It is based on:

- `design.md`: global Orienta brand system.
- Home V1: approved visual reference.
- `Restaurant-Spec.md`: Restaurant product requirements.

This guide describes design direction and component rules only.
It does not define implementation details.

The core design question:

How does Orienta's food experience look and feel?

The answer:

Restaurant should feel like a warm, practical food companion that turns menu uncertainty into ordering confidence.

It should not feel like OCR software, an AI chatbot, a food delivery app, or a generic translator.

## 2. Restaurant Visual Personality

Restaurant belongs to the same Orienta world as Home V1.

It should keep:

- Soft Neo Brutalism structure.
- Warm travel notebook feeling.
- Thick but controlled borders.
- Muted colorful cards.
- Clear hierarchy.
- Large touch targets.
- Simple icons.
- Direct, confidence-building actions.

Compared with Home, Restaurant should feel:

- More focused.
- More food-specific.
- Slightly warmer.
- More reassuring.
- More action-oriented under time pressure.

The user may be sitting in a restaurant with staff waiting.
The design should never feel slow, dense, or overly clever.

Restaurant should feel like:

- A small menu note.
- A food explanation card.
- A clear ordering slip.
- A calm local friend.

Not:

- A technical scanner.
- A translation dashboard.
- A recipe encyclopedia.
- A restaurant discovery app.

## 3. Visual System Translation From Home V1

Home V1 establishes the brand foundation:

- Cream and muted yellow background.
- Soft colored feature cards.
- Controlled thick borders.
- Light hard shadows.
- Editorial title hierarchy.
- Clear sans-serif functional text.
- Simple hand-drawn-style icons.

Restaurant should use the same rules, but with food-specific object metaphors.

Recommended object metaphors:

- Menu sheet.
- Dish card.
- Order slip.
- Ingredient tags.
- Staff-facing note.
- Small caution sticker.

These metaphors should be subtle.
Do not make the UI skeuomorphic.
Do not add random food illustrations.

## 4. Color Principles

Restaurant should use warm, appetite-friendly colors, but avoid childish saturation.

Recommended color roles:

- Background: warm paper / cream.
- Primary food action: muted menu yellow or warm butter.
- Recognized menu result: muted blue or sage.
- Dish detail surface: warm white.
- Beginner-friendly: sage green.
- Spice: warm amber to muted orange.
- Allergen / caution: soft warning yellow or muted coral.
- Severe warning: reserved red, used sparingly.

Rules:

- Red should not be used for ordinary spicy food unless it is a true warning state.
- Spice indicators should feel informative, not alarming.
- Allergen warnings must be visually noticeable, but not panic-inducing.
- AI status should not use tech blue or futuristic colors.

## 5. Typography Rules

Restaurant inherits Home V1's typography hierarchy.

### Page Titles

Use editorial title style.

Purpose:

- Create Orienta brand feeling.
- Make the page feel like a travel notebook, not a dashboard.

Rules:

- Short titles only.
- Avoid long explanatory headings.
- Use calm, direct language.

Examples:

- Restaurant
- Understand Menu
- Explore a Dish
- Show this to staff

### Functional Titles

Use clear sans-serif.

Purpose:

- Fast recognition.
- Strong touch targets.
- Practical reading under time pressure.

Rules:

- Same-level functional titles must use the same size and weight.
- Do not mix serif and sans-serif within the same component level.
- Avoid excessive bold weight.

### Descriptions

Use lighter sans-serif.

Purpose:

- Support quick understanding.
- Reduce anxiety without adding reading burden.

Rules:

- One short sentence.
- No paragraph blocks on first-level task screens.
- Use plain English.

### Chinese Display Text

Chinese text shown to staff must be the visual priority.

Rules:

- Very large.
- High contrast.
- No decorative font.
- Enough line height.
- Avoid cramped text.

## 6. Component Rules

### 6.1 Menu Result Card

Purpose:
Show a recognized dish from a menu photo.

Information hierarchy:

1. English dish name.
2. Original Chinese name.
3. Price, if visible.
4. One-line explanation.
5. Caution or confidence signals.

Size:

- Medium card.
- Large enough for quick scanning.
- Should support a vertical list.

Spacing:

- Generous internal padding.
- Title and description should not feel crowded.
- Badge row should have enough space to wrap cleanly.

Color:

- Warm white or muted pale surface.
- Use small colored badges for signals.
- Do not make every dish card a different color.

Border:

- 1.5px border.
- Light hard shadow, smaller than Home main cards.

Typography:

- English name: strong sans-serif.
- Chinese name: medium-weight supporting text.
- Description: lighter sans-serif.

Icon usage:

- Optional small food/menu symbol.
- Do not place a large icon in every dish card.

Do not:

- Show raw OCR text.
- Show long AI explanations.
- Make the card look like a restaurant review tile.

### 6.2 Dish Card

Purpose:
Represent a dish as a selectable object.

Information hierarchy:

1. Dish name.
2. Short "what it is" explanation.
3. Confidence signals such as beginner-friendly, spice, allergens.
4. Price if from menu.

Size:

- Similar to a small menu slip.
- Taller than a simple list row.
- Not as dominant as a primary action card.

Color:

- Warm white base.
- Optional muted accent strip for section grouping.

Border:

- 1.5px border.
- Soft hard shadow.

Spacing:

- Enough room for 2 lines of title.
- Badges must not collide with text.

### 6.3 Dish Detail

Purpose:
Help the user decide whether to order.

Information hierarchy:

1. English name.
2. Chinese name and pinyin.
3. One-sentence explanation.
4. Confidence signals.
5. Ingredients.
6. Allergens and dietary notes.
7. How it is served / how to eat.
8. Portion guide.
9. Order This Dish action.

Layout:

- Scrollable.
- Use clear sections.
- Do not show everything as identical cards.
- Important decision signals should appear before secondary context.

Visual style:

- Calm and spacious.
- Looks like a food note, not a database record.

### 6.4 Spice Badge

Purpose:
Help the user quickly judge heat level.

Levels:

- Not spicy.
- Mild.
- Medium.
- Spicy.
- Very spicy.

Color:

- Not spicy: neutral or sage.
- Mild: warm pale yellow.
- Medium: muted amber.
- Spicy: muted orange.
- Very spicy: muted coral.

Rules:

- Do not use aggressive red except for severe warning contexts.
- Badge text must be readable.
- Badge should feel like a helpful label, not an alarm.

### 6.5 Ingredient Tags

Purpose:
Help users scan what a dish contains.

Style:

- Small rounded or softly rectangular tags.
- 1px or 1.5px border.
- Warm white or pale tinted background.

Typography:

- Small sans-serif.
- Medium weight.

Rules:

- Tags should wrap naturally.
- Do not make ingredients look like filters or settings.
- Keep spacing consistent.

### 6.6 Allergen Warning

Purpose:
Communicate uncertainty and caution responsibly.

Information hierarchy:

1. Clear warning label.
2. Possible allergen.
3. Confirmation guidance.

Visual style:

- Muted caution color.
- Strong enough to notice.
- Not visually panicked.

Border:

- 1.5px border.
- Slightly stronger than normal tags.

Copy tone:

- "May contain..."
- "Often contains..."
- "Ask the restaurant to confirm."

Do not:

- Say "safe".
- Say "guaranteed".
- Hide uncertainty.

### 6.7 Beginner Friendly Badge

Purpose:
Create a confidence moment.

Meaning:

This dish is likely understandable, approachable, and suitable for first-time travelers.

Visual style:

- Sage green or warm cream.
- Friendly, calm, small.
- Should feel like a reassuring sticker.

Rules:

- Use only when the AI result supports it.
- Do not overuse.
- Do not make it feel like a rating system.

Possible text:

- Good first choice.
- Easy to try.
- Usually mild.

### 6.8 Ordering Card

Purpose:
Let the user show a clear order phrase to restaurant staff.

Information hierarchy:

1. Large Chinese phrase.
2. Pinyin if useful.
3. Small English meaning.
4. Copy / audio / back actions.

Size:

- Large display card.
- Should fill enough screen area to be readable across a table.

Color:

- High-contrast warm surface.
- Chinese text should be dark and prominent.

Border:

- 2px border.
- Stronger object feeling, like a card handed to staff.

Typography:

- Chinese: largest text on page.
- Pinyin: smaller, optional.
- English: small confirmation.

Rules:

- No clutter.
- No long explanation.
- No unnecessary badges.

### 6.9 Phrase Card

Purpose:
Help users say one practical sentence.

Information hierarchy:

1. English phrase.
2. Chinese phrase.
3. Show / copy / audio actions.

Size:

- Compact but tappable.
- Same category cards should use consistent height and padding.

Color:

- Warm white.
- Category accents can be subtle.

Border:

- 1.5px border.

Rules:

- Phrase cards must not feel like language flashcards.
- They should feel like practical communication slips.
- Do not include low-frequency textbook phrases.

## 7. Information Hierarchy

Restaurant should always show the most decision-relevant information first.

### Landing

First:

- What problem do you need help with?

Then:

- Understand Menu.
- Explore a Dish.
- Restaurant Phrases.

Never first:

- AI explanations.
- Long guide text.
- Menu history.
- Food articles.

### Menu Result

First:

- Clean dish list.

Then:

- Short explanation.
- Price.
- Confidence or caution signals.

Never first:

- Raw OCR.
- Full AI response.
- Technical confidence scores.

### Dish Detail

First:

- What this dish is.
- Whether it seems approachable.
- Possible concerns.

Then:

- Ingredients.
- Taste.
- Serving style.
- Portion guide.

Last:

- Secondary context such as origin or regional variation.

### Ordering

First:

- Chinese text to show staff.

Then:

- English confirmation.
- Supporting actions.

## 8. Emotional Design Rules

Restaurant exists to reduce anxiety.

The design should create moments where the user feels:

"I'm glad I have Orienta."

### Reassurance

Use calm, short wording.

Examples:

- "This looks like a good first choice."
- "This may be spicy."
- "Ask staff to confirm."

### Confidence

Use small confidence signals only when useful.

Examples:

- Good first choice.
- Usually shared.
- Mild.
- May contain peanuts.

### Honesty

Uncertainty should be visible but not scary.

Use:

- "May contain."
- "Usually."
- "Not clear from the menu."

Avoid:

- "Verified."
- "Safe."
- "Guaranteed."

### Calm Failure

Failure states should preserve trust.

Examples:

- "We couldn't read this menu clearly. Try taking the photo closer and flatter."
- "We couldn't identify this dish. Try the Chinese name if you have it."

Never show raw technical errors to users.

## 9. Icon Rules

Restaurant icons should feel like small hand-drawn marks from a travel notebook.

Allowed icon themes:

- Menu.
- Bowl.
- Chopsticks.
- Dish.
- Tag.
- Warning.
- Staff-facing card.

Rules:

- Simple linework.
- Rounded stroke.
- Small and supportive.
- Same visual weight within a component group.
- Icons must be inside stable containers when used as touch targets.

Avoid:

- Complex food illustrations.
- Realistic food drawings.
- Emoji.
- Generic AI sparkle icons.
- Default SaaS icon feel.

## 10. Spacing And Layout Rules

Restaurant should be usable under pressure.

Rules:

- Large touch targets.
- Clear vertical rhythm.
- No dense grids of information.
- Important actions should be reachable with one hand.
- Cards should not require careful reading to understand their role.
- Use normal document flow; avoid fragile absolute positioning.

Recommended structure:

- Page header.
- One clear task question.
- Primary card or result area.
- Supporting detail sections.
- Sticky or prominent action only when it reduces effort.

## 11. What Not To Do

Restaurant must not use:

- Generic translator UI.
- Chatbot layout.
- OCR scanner dashboard.
- Restaurant review style.
- Food delivery app style.
- Recipe app style.
- Nutrition tracker style.
- SaaS dashboard.
- AI startup visual language.
- Long article layout.
- Dense table layout.
- Raw model output.
- Generic identical cards everywhere.
- Overly cute food stickers.
- Random food decorations.
- Aggressive warning colors for normal uncertainty.

## 12. Approval Rule

This guide must be approved before Restaurant UI implementation begins.

Until approved:

- Do not create React components for Restaurant redesign.
- Do not write Restaurant CSS.
- Do not apply this system to other modules.

The next step after approval should be:

Design the Restaurant landing screen first, then validate the flow before redesigning result and detail screens.
