# Orienta Restaurant Module Product Specification

## 1. Product Role

Restaurant is the core module of Orienta.

It is not a menu translator.
It is a confidence tool for international travelers eating in China.

The goal is to help a traveler quickly understand what they can order, avoid obvious mistakes, communicate with restaurant staff, and feel less anxious in a real dining situation.

Whenever multiple product directions are possible, choose the one that reduces user anxiety instead of adding more features.

## 2. User And Context

The primary user is an international traveler already sitting in, standing outside, or ordering from a Chinese restaurant.

They may be:

- Sitting at a table with a paper menu.
- Looking at a wall menu or QR-code menu.
- Standing in a small local restaurant with staff waiting.
- Traveling alone and unsure what portion size to order.
- Traveling with dietary restrictions or allergies.
- Using limited mobile data or unstable internet.
- Feeling time pressure because staff are waiting.
- Unfamiliar with Chinese dish names, regional cuisines, spices, ingredients, and dining norms.

They usually do not want to read a guide.
They want to know what to do next.

Their mental state is often:

- Curious about local food.
- Afraid of ordering the wrong thing.
- Unsure whether a translation is trustworthy.
- Worried about allergies or ingredients.
- Embarrassed about holding up staff.
- Looking for one safe next action.

The product should feel like a calm local friend who helps them make a decision quickly.

## 3. Core Product Promise

A traveler who does not read Chinese should be able to understand a restaurant menu, choose a dish, and show a clear ordering phrase within one minute.

The module should reduce these questions:

- What is this dish?
- Is it spicy?
- What is inside?
- Could it contain something I cannot eat?
- Is it suitable for one person?
- How do I order it?
- What can I say to staff?

## 4. Core User Journey

### Main Journey

1. User taps Restaurant from Home.
2. User chooses what they need help with.
3. User selects one of the main tasks:
   - Understand a menu.
   - Explore a dish.
   - Use restaurant phrases.
4. If understanding a menu:
   - User takes or uploads a menu image.
   - System extracts dishes into a clean translated list.
   - User sees dish names, short descriptions, prices, and caution notes.
   - User taps a dish for details.
   - User checks ingredients, spice level, allergens, and portion guidance.
   - User taps Order This Dish.
   - System shows a large Chinese ordering card.
5. If exploring a dish:
   - User types Chinese or English dish name.
   - System explains the dish in simple English.
   - User sees ingredients, taste, spice, allergens, serving style, and order phrase.
6. If using phrases:
   - User selects a real dining situation.
   - System shows a concise phrase.
   - User can show Chinese text to staff.
7. User orders confidently or exits the module.

### Anxiety-Reducing Principle

At every step, the product should make the next action obvious:

- Upload menu.
- Tap a dish.
- Check caution notes.
- Show this to staff.
- Go back.

The user should never need to decide between too many abstract tools.

## 5. Core Tasks

### Must-Have

1. Understand a Chinese menu from an image.
2. Show translated dish names and short plain-English explanations.
3. Show prices when visible.
4. Open dish details from a recognized menu item.
5. Explain a dish from user input.
6. Flag possible spice, pork, seafood, nuts, dairy, egg, gluten, alcohol, and vegetarian concerns.
7. Clearly state that ingredient and allergen information may be incomplete.
8. Generate a clear Chinese ordering phrase.
9. Provide common restaurant phrases for immediate communication.
10. Show large Chinese text suitable for handing the phone to staff.

### Nice-To-Have

- Most ordered or recommended dish detection when the menu suggests it.
- Portion guidance such as good for one person, good for sharing, or large dish.
- Regional food context.
- Save favorite dishes during one session.
- Copy Chinese dish name.
- Play Chinese audio.
- Offline saved phrase pack.

### Future Features

- OCR improvement with multi-image menus.
- QR menu page interpretation.
- Dietary profile saved locally.
- Restaurant staff mode with simplified Chinese questions.
- Dish comparison.
- User photo history.
- Verified restaurant-specific menu data.
- Human review for uncertain dishes.
- Integration with maps or restaurant listings.

## 6. Pain Points

### Menu Understanding

Chinese dish names often do not translate literally.
Examples like "ants climbing a tree" or regional names can confuse travelers.

The product should explain what the dish actually is, not just translate the words.

### Ingredient Uncertainty

Travelers may not know whether a dish contains pork, seafood, peanuts, dairy, egg, gluten, alcohol, or hidden meat stock.

The product should use cautious language:

- Often contains.
- May contain.
- Ask the restaurant to confirm.

It must never guarantee allergen safety.

### Spice Level

Many travelers underestimate regional spice levels.

The product should show a simple spice level and mention that restaurants may adjust it.

### Portion Size

Chinese restaurant dishes are often shared.
Solo travelers may accidentally order too much.

The product should indicate whether a dish is usually individual, shared, small snack, soup, or large plate when reasonably inferable.

### Ordering Pressure

Restaurant staff may be waiting.
The product should avoid long reading flows and should always offer a direct phrase card.

### Translation Trust

AI output can sound confident even when uncertain.
The product must show uncertainty clearly without overwhelming the user.

### Regional Variation

The same dish can vary by region or restaurant.
The product should say "usually" or "often" when appropriate.

### Etiquette And Interaction

Travelers may not know how to ask for recommendations, water, less spice, no coriander, packing food, or the bill.

Restaurant Phrases should cover real situations, not language-learning phrases.

## 7. Version 1 Feature Set

Version 1 should include only three entry points.

### 7.1 Understand Menu

Purpose:
Help the user turn a menu photo into a clear list of understandable dishes.

Input:

- One menu image.

Output:

- Restaurant name, if visible.
- Menu sections, if visible.
- Dish cards with:
  - Original Chinese name.
  - English name.
  - Short plain-English description.
  - Price, if visible.
  - Notes for possible spice, allergens, pork, seafood, or uncertainty.

Behavior:

- Do not display raw OCR or raw AI text.
- Do not invent prices.
- If the image is unclear, ask for a clearer photo.
- If a dish is uncertain, mark it as uncertain instead of hiding uncertainty.

### 7.2 Explore A Dish

Purpose:
Help the user understand one dish before ordering.

Input:

- Chinese or English dish name.

Output:

- English name.
- Chinese name.
- Pinyin, if known.
- Short description.
- Main ingredients.
- Flavor profile.
- Spice level.
- Common allergens.
- Dietary notes.
- How it is served.
- How to eat.
- Portion guide.
- Beginner-friendly signal.
- Chinese ordering phrase.

Behavior:

- Use simple English.
- Avoid expert culinary terms.
- Explain uncertainty.
- Do not guarantee allergy or dietary safety.

### 7.3 Restaurant Phrases

Purpose:
Help the user communicate quickly with staff.

Content should be short and scenario-based:

- Ordering.
- Dietary needs.
- Payment.
- Other common needs.

Every phrase should be something a traveler would realistically say in a Chinese restaurant.

Each phrase should support:

- English confirmation.
- Large Chinese display.
- Copy Chinese.
- Play Chinese audio if available.

## 8. Information Architecture

### Restaurant Landing

The first screen should answer:

What problem do you have right now?

Primary options:

1. Understand Menu
2. Explore a Dish
3. Restaurant Phrases

The first screen should not show:

- Long restaurant guide content.
- City recommendations.
- Food articles.
- Large AI chat box.
- Too many phrase categories.
- Saved history as the main focus.
- Restaurant ranking or reviews.

### Understand Menu Result

Priority order:

1. Clear status: menu recognized or needs another photo.
2. Dish list.
3. Price if available.
4. Short description.
5. Caution notes.
6. Tap for details.

Do not make users read a long explanation before seeing dishes.

### Dish Detail

Priority order:

1. Dish name in English and Chinese.
2. One-sentence explanation.
3. Spice level and caution badges.
4. Main ingredients.
5. Allergen and dietary notes.
6. How it is served and eaten.
7. Portion guidance.
8. Order This Dish.

### Ordering Card

Priority order:

1. Large Chinese phrase.
2. Pinyin if useful.
3. Small English meaning.
4. Back or Done.
5. Copy or audio as supporting actions.

## 9. Data And AI Requirements

AI should return structured data only.

The frontend should render structured fields, not raw generated prose.

AI should be instructed to:

- Explain in simple English.
- Avoid making up information.
- Return null or uncertainty when unclear.
- Use "often", "usually", "may contain", and "ask staff to confirm" when appropriate.
- Avoid absolute safety claims.
- Keep descriptions short.

The product should distinguish:

- Recognized information.
- Likely information.
- Uncertain information.

Uncertainty should reduce anxiety by being clear, not by showing technical confidence scores.

## 10. Safety And Trust Rules

Restaurant can help with food understanding, but it must not make medical guarantees.

For allergies and dietary restrictions:

- Always treat information as incomplete.
- Encourage confirming with restaurant staff.
- Provide a Chinese phrase for confirmation when possible.

Example:

"Ingredients and allergen information may be incomplete. Confirm with restaurant staff."

The product must not say:

- Safe for peanut allergy.
- Definitely vegetarian.
- Guaranteed no pork.
- Certified gluten-free.

## 11. Success Criteria

Restaurant V1 is successful if:

- A first-time traveler can understand a menu photo in under one minute.
- A traveler can decide whether a dish is worth ordering without reading a long guide.
- A traveler can identify possible spice and allergen concerns quickly.
- A traveler can show a clear Chinese ordering phrase to staff.
- The product feels calm and trustworthy under time pressure.
- The user does not feel like they are using a generic translator.

## 12. Delight & Confidence Moments

Restaurant should not only explain food.
It should create small moments where the traveler feels relieved, understood, and ready to act.

These moments should not add complexity.
They should make existing flows feel more human and reassuring.

### 12.1 Restaurant Landing

Emotional moment:
The user should immediately feel that the app understands their situation.

Instead of presenting tools as technical features, the landing experience should make the user feel:

"I can solve this in a few taps."

Confidence cues:

- Short task labels.
- No long explanations.
- A calm first choice such as understanding the menu.
- Clear separation between menu help, dish help, and speaking to staff.

Avoid:

- Making the user choose between many similar AI tools.
- Presenting the page like a feature directory.

### 12.2 Understand Menu

Emotional moment:
After uploading a menu photo, the user should feel:

"This menu is no longer intimidating."

Confidence cues:

- A calm loading message that says the menu is being understood, not just scanned.
- A clean result that turns dense Chinese text into a small number of readable dish cards.
- Clear handling of uncertainty, such as "Some dishes may need confirmation" instead of a technical error.
- Prices shown only when visible, so the result feels trustworthy.

The delight should come from seeing chaos become understandable.

### 12.3 Menu Dish List

Emotional moment:
The user should quickly find at least one dish that feels safe to consider.

Confidence cues:

- Beginner-friendly indicators when appropriate.
- Small caution badges for possible spice, pork, seafood, nuts, or uncertainty.
- Simple descriptions that explain what the dish actually is.
- No raw OCR text.

Possible wording:

- "Good first choice"
- "Usually shared"
- "May be spicy"
- "Ask staff to confirm"

These should be used carefully and only when supported by the structured result.

### 12.4 Dish Detail

Emotional moment:
The user should feel:

"Now I understand what I am about to order."

Confidence cues:

- One clear summary sentence before detailed fields.
- Taste, spice, ingredients, allergens, and portion guidance shown in plain language.
- Uncertainty written in a reassuring way.
- Beginner-friendly signal when appropriate.

The page should reduce decision anxiety, not overwhelm the user with food encyclopedia content.

### 12.5 Allergy Or Dietary Concern

Emotional moment:
The user should feel protected from overconfidence.

Confidence cues:

- Honest warnings.
- Clear "may contain" language.
- A direct Chinese confirmation phrase when needed.

Example:

"This dish may contain peanuts. Please confirm with the restaurant."

The product should feel careful and responsible, especially when it cannot be certain.

### 12.6 Order This Dish

Emotional moment:
The user should feel:

"I can actually order this now."

Confidence cues:

- A large Chinese phrase that can be shown directly to staff.
- Small English confirmation so the user knows what they are showing.
- Optional pinyin for reassurance.
- A calm Done or Back action.

This is one of the most important confidence moments in the whole module.
It turns understanding into action.

### 12.7 Restaurant Phrases

Emotional moment:
The user should feel:

"I have the exact sentence I need."

Confidence cues:

- Phrases organized by real restaurant situations.
- No textbook filler.
- Large Chinese display.
- Copy and audio as supporting actions.

The phrase list should feel like a small survival kit, not a language lesson.

### 12.8 Empty And Failure States

Emotional moment:
Even when something fails, the user should not feel stuck.

Confidence cues:

- Explain what happened in simple English.
- Give one clear next action.
- Avoid technical language.

Examples:

- "We couldn't read this menu clearly. Try taking the photo closer and flatter."
- "We couldn't identify this dish. Try the Chinese name if you have it."
- "Some information is unclear. You can still show this question to staff."

Failure states should preserve trust.

### 12.9 Leaving The Flow

Emotional moment:
After ordering or checking a dish, the user should feel a small sense of completion.

Confidence cues:

- Clear Done action.
- Easy return to the dish or menu.
- No pressure to save, share, rate, or continue browsing.

The best ending is quiet:

"You have what you need."

## 13. Product Non-Goals

Restaurant V1 should not become:

- A restaurant discovery app.
- A food review platform.
- A delivery app.
- A recipe app.
- A nutrition tracker.
- A full dietary safety certification tool.
- A general AI chatbot.
- A social food community.

## 14. Design Direction For Future UI

The UI should follow Home V1's approved visual foundation:

- Colorful but controlled.
- Structured but friendly.
- Neo Brutalism influence without harshness.
- Travel notebook feeling.
- Clear hierarchy.
- Large touch targets.
- No SaaS dashboard style.

However, UI design should come after the product flow is confirmed.

The Restaurant module should feel like:

A calm food companion that helps travelers understand, choose, and order.

Not:

A technical OCR tool.

Not:

A phrasebook.

Not:

A restaurant encyclopedia.
