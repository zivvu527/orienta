# Restaurant Landing Design

## 1. Purpose

Restaurant Landing is the first screen after the user taps Restaurant from Home.

Its job is not to show a list of features.
Its job is to help the user recognize their current restaurant problem immediately.

The desired emotional response:

"This is exactly what I need right now."

The screen must feel calm, quick, and practical under restaurant pressure.

## 2. Design References

Restaurant Landing must follow:

- `design.md`
- Home V1 visual language
- `Restaurant-Spec.md`
- `Restaurant-Design-Guide.md`

It must not introduce a new brand style.

Use Home V1 as the visual foundation:

- Muted colorful cards.
- Soft Neo Brutalism structure.
- Thick but controlled borders.
- Light hard shadows.
- Editorial page title.
- Clear sans-serif card text.
- Simple icon marks in stable containers.
- Warm travel notebook feeling.

## 3. Page Structure

Recommended structure:

1. Top navigation
   - Back button.
   - Small page context: Restaurant.

2. Page title area
   - Main title: What do you need help with?
   - Short supporting line: Pick the situation that matches right now.

3. Primary entry card
   - Understand Menu.
   - Highest visual priority.

4. Secondary entry cards
   - Explore a Dish.
   - Restaurant Phrases.

5. Optional trust note
   - Short caution line about ingredients/allergens.
   - Should be quiet and not dominate the page.

Do not show:

- AI language.
- OCR language.
- Translate language.
- Long explanations.
- Menu history.
- Generic chatbot entry.
- Restaurant recommendations.

## 4. Card Layout

The page should use three scenario cards.

### 4.1 Understand Menu Card

Role:
Primary card.

Feature name:

Understand Menu

Scenario subtitle:

"I can't read this menu. What should I order?"

Visual priority:

- Largest card.
- Similar weight to Home's Restaurant main card, but adapted for a subpage.
- Should feel like a menu sheet or food note.

Layout:

- Icon container on the right or top-right.
- Text on the left.
- Feature name first.
- Scenario subtitle directly below.
- No extra explanation.

Color:

- Muted warm yellow or muted food blue.
- Should feel inviting and calm.
- Avoid saturated orange/yellow that feels childish.

Border:

- 2px border.
- Light hard shadow.

Typography:

- Feature name: strong sans-serif.
- Scenario subtitle: lighter sans-serif, readable, conversational.

### 4.2 Explore a Dish Card

Role:
Secondary card.

Feature name:

Explore a Dish

Scenario subtitle:

"My friend recommended Mapo Tofu. What is it?"

Visual priority:

- Smaller than Understand Menu.
- Same family as Home's secondary action cards.
- Should feel like a dish note.

Layout:

- Fixed icon container.
- Feature name.
- Scenario subtitle.
- Text must not wrap awkwardly.

Color:

- Muted sage or warm cream.
- Friendly and calm.

Border:

- 1.5px border.
- Light hard shadow.

### 4.3 Restaurant Phrases Card

Role:
Secondary card.

Feature name:

Restaurant Phrases

Scenario subtitle:

"How do I ask for less spicy food?"

Visual priority:

- Same weight as Explore a Dish.
- Should feel like a small phrase slip.

Layout:

- Fixed icon container.
- Feature name.
- Scenario subtitle.

Color:

- Muted lavender or warm pale surface.
- Should remain clearly clickable.

Border:

- 1.5px border.
- Light hard shadow.

## 5. Scenario Subtitle Rules

Scenario subtitles are not feature descriptions.

They should sound like the user's real thought in the restaurant.

Rules:

- Use first-person or direct user problem framing.
- Keep short.
- Make the situation concrete.
- Avoid technical capability wording.
- Avoid marketing language.

Good:

- "I can't read this menu. What should I order?"
- "My friend recommended Mapo Tofu. What is it?"
- "How do I ask for less spicy food?"

Bad:

- "Use AI to translate restaurant menus."
- "Scan OCR text from a menu."
- "Smart assistant for food discovery."
- "Translate phrases with powered AI."

The subtitle should reduce anxiety by making the user feel understood.

## 6. Use Of Home V1 Components

Reuse or extend these Home V1 patterns:

### Home Feature Card Pattern

Use for:

- Understand Menu.

Adaptation:

- Same strong object-card feeling.
- Similar border and shadow.
- Muted Restaurant-specific color.
- Scenario subtitle instead of short feature hint.

### Home Action Button Pattern

Use for:

- Explore a Dish.
- Restaurant Phrases.

Adaptation:

- May use 2-card grid or stacked cards depending on available text space.
- Maintain stable icon containers.
- Same border/shadow logic.
- Same text alignment rules.

### Home Icon Container Pattern

Use for:

- All three cards.

Rules:

- Fixed size.
- Rounded or circular.
- Consistent stroke weight.
- Icon should support recognition, not dominate.

### Home Typography Pattern

Use for:

- Page title.
- Card titles.
- Scenario subtitles.

Rules:

- Page title may use editorial style.
- Card titles use strong sans-serif.
- Scenario subtitles use lighter sans-serif.

## 7. Information Hierarchy

The first screen should answer:

What restaurant problem do you have right now?

Priority:

1. Main question.
2. Understand Menu.
3. Explore a Dish.
4. Restaurant Phrases.
5. Quiet safety note if needed.

The screen should not first show:

- How the technology works.
- Full descriptions.
- All phrase categories.
- Upload instructions before user chooses Understand Menu.

## 8. Emotional Design

Restaurant Landing should reduce anxiety by recognition.

The user should see one card and think:

- "Yes, that's my problem."
- "I know where to tap."
- "This won't take long."

The page should not make the user feel:

- They need to learn how the app works.
- They are starting a complex AI workflow.
- They are reading a food guide.

## 9. Visual Don'ts

Do not use:

- AI
- OCR
- Translate
- Assistant
- Smart
- Powered by AI
- Chatbot layout
- Generic feature directory layout
- SaaS dashboard cards
- Food delivery app styling
- Restaurant review styling
- Decorative food stickers
- Overly saturated childlike colors

## 10. Implementation Boundary

This document only defines Restaurant Landing design.

Do not implement until this design is confirmed.

When implementation begins:

- Modify only Restaurant Landing first.
- Do not redesign Menu Result, Dish Detail, Explore a Dish, or Phrase pages in the same step unless explicitly approved.
- Do not modify Home V1 except for bug fixes.
