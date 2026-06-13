import Anthropic from '@anthropic-ai/sdk';
import type { Analysis, FoodItem } from '../types';

const SYSTEM_PROMPT = `You are the nutrition engine inside Macro Mate, a personal macro-tracking app.
The user sends a photo of food, a screenshot, and/or a text description, and you estimate the nutrition of what THEY are about to eat.

Before anything else, decide whether the input actually contains food, drink, or readable nutrition information. If it does NOT — e.g. a person, a pet, a landscape, a document, a screenshot unrelated to food, or any random object — do not try to estimate anything and do not deliberate at length: immediately return {"items": [], "notes": "No food identified in the image."} and stop.

Input types you must handle:
- A photo of a meal or food item: identify each distinct food, estimate the portion size from visual cues (plate size, utensils, packaging), and estimate nutrition for that portion.
- A screenshot of a nutrition label or of macro numbers (from another app, a menu, a website): read the values directly instead of estimating. If a serving count is ambiguous, assume one serving and say so in notes.
- A text description (possibly alongside a photo) with portion details like "200g" or "two slices": treat any user-provided measurements as authoritative and scale your estimate to them.

Rules:
- NEVER state a nutrient value you cannot ground in the image, a label, the user's text, or provided database data. If a nutrient is unknown but typically near zero for that food (e.g. sodium in a fruit soda, fat in black coffee), report 0 and mention the assumption in notes — do NOT fill in plausible-sounding nonzero values.
- When "Verified nutrition data" from a food database is provided and an entry matches the user's food, prefer those label values over your own estimate, scaled to the portion eaten.
- Report nutrition for the portion actually shown/described, not per 100g.
- kcal in calories; protein, carbs, fat, fiber, sugar in grams; sodium in milligrams.
- Split a plate into at most a handful of meaningful items (e.g. "Grilled chicken breast", "White rice", "Side salad"); don't itemize garnishes.
- Each item gets a single fitting emoji.
- "portion" is a short human-readable size like "1 bowl (~350 g)" or "2 slices".
- confidence: "high" when reading a label or the food is unambiguous, "medium" for typical photo estimates, "low" when the portion or preparation is largely a guess.
- Use "notes" for one short sentence of caveats worth knowing (hidden oils, dressing assumptions, ambiguous serving count). Empty string if nothing useful.
- When asked to revise a previous estimate, apply the user's feedback and any newly provided images, and return the COMPLETE corrected item list (including items that didn't change).
- If the image contains no food or readable nutrition info, return an empty items array and say so briefly in notes (e.g. "No food identified in the image.").`;

const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          emoji: { type: 'string' },
          portion: { type: 'string' },
          kcal: { type: 'number' },
          protein: { type: 'number' },
          carbs: { type: 'number' },
          fat: { type: 'number' },
          fiber: { type: 'number' },
          sugar: { type: 'number' },
          sodium: { type: 'number' },
          confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
        required: [
          'name',
          'emoji',
          'portion',
          'kcal',
          'protein',
          'carbs',
          'fat',
          'fiber',
          'sugar',
          'sodium',
          'confidence',
        ],
        additionalProperties: false,
      },
    },
    notes: { type: 'string' },
  },
  required: ['items', 'notes'],
  additionalProperties: false,
} as const;

export interface AnalyzeInput {
  apiKey: string;
  model: string;
  /** JPEG images, already resized + base64 encoded (no data: prefix). */
  images?: { data: string; mediaType: 'image/jpeg' | 'image/png' }[];
  /** Free-text description and/or portion hints. */
  text?: string;
  /** Refine a previous estimate using user feedback and/or extra images. */
  revision?: { previous: Omit<FoodItem, 'confidence'>[]; feedback: string };
  /** Pre-fetched verified nutrition data (e.g. OpenFoodFacts) to ground the estimate. */
  groundingData?: string;
}

/** Clamp and round a nutrient value coming back from the model. */
function num(v: unknown, max = 100000): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(Math.min(n, max) * 10) / 10;
}

/** Validate + normalize the model's JSON into our Analysis shape. */
export function parseAnalysis(raw: string): Analysis {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('The AI returned an unreadable response. Please try again.');
  }
  const obj = data as { items?: unknown; notes?: unknown };
  if (!obj || !Array.isArray(obj.items)) {
    throw new Error('The AI response was missing food items. Please try again.');
  }
  const items: FoodItem[] = obj.items.map((it) => {
    const i = it as Record<string, unknown>;
    const confidence = i.confidence === 'low' || i.confidence === 'high' ? i.confidence : 'medium';
    return {
      name: String(i.name ?? 'Food').slice(0, 120),
      emoji: String(i.emoji ?? '🍽️').slice(0, 8) || '🍽️',
      portion: String(i.portion ?? '').slice(0, 120),
      kcal: num(i.kcal),
      protein: num(i.protein, 2000),
      carbs: num(i.carbs, 2000),
      fat: num(i.fat, 2000),
      fiber: num(i.fiber, 500),
      sugar: num(i.sugar, 2000),
      sodium: num(i.sodium, 50000),
      confidence,
    };
  });
  return { items, notes: String(obj.notes ?? '') };
}

/**
 * Map a response stop reason to a user-facing error, or null when the response
 * is usable. A non-food image can make the model think until it exhausts the
 * token budget (`max_tokens`), which otherwise surfaces as a confusing
 * "no answer" / "unreadable" error after a long, token-burning wait.
 */
export function stopReasonError(stopReason: string | null | undefined): string | null {
  if (stopReason === 'refusal') {
    return 'The AI declined to analyze this image. Try a different photo.';
  }
  if (stopReason === 'max_tokens') {
    return "Couldn't identify the food — the analysis ran long without finishing. Try a clearer photo or describe it instead.";
  }
  return null;
}

function supportsAdaptiveThinking(model: string): boolean {
  return /opus-4-[6-9]|opus-4-7|sonnet-4-6|fable|mythos/.test(model);
}

export async function analyzeFood(input: AnalyzeInput): Promise<Analysis> {
  if (!input.apiKey) {
    throw new Error('Add your Anthropic API key in Settings first.');
  }
  if (!input.images?.length && !input.text?.trim() && !input.revision) {
    throw new Error('Provide a photo or a description.');
  }

  // Personal-use PWA: the key is the user's own, stored only on their device,
  // so direct browser access is the intended deployment model here.
  const client = new Anthropic({ apiKey: input.apiKey, dangerouslyAllowBrowser: true });

  const content: Anthropic.ContentBlockParam[] = [];
  for (const img of input.images ?? []) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: img.mediaType, data: img.data },
    });
  }
  const parts: string[] = [];
  if (input.revision) {
    parts.push(`You previously estimated these items: ${JSON.stringify(input.revision.previous)}`);
    parts.push(
      input.revision.feedback.trim()
        ? `Revise the estimate based on this user feedback: ${input.revision.feedback.trim()}`
        : 'Revise the estimate based on the additional image(s) provided.',
    );
  }
  if (input.text?.trim()) {
    parts.push(`User notes / measurements: ${input.text.trim()}`);
  }
  if (input.groundingData?.trim()) {
    parts.push(input.groundingData.trim());
  }
  if (parts.length === 0) parts.push('Analyze this food.');
  content.push({ type: 'text', text: parts.join('\n') });

  let response: Anthropic.Message;
  try {
    response = await client.messages.create({
      model: input.model,
      max_tokens: 8000,
      ...(supportsAdaptiveThinking(input.model) ? { thinking: { type: 'adaptive' as const } } : {}),
      system: SYSTEM_PROMPT,
      output_config: {
        format: { type: 'json_schema', schema: ANALYSIS_SCHEMA as unknown as Record<string, unknown> },
      },
      messages: [{ role: 'user', content }],
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      throw new Error('Your API key was rejected. Check it in Settings.');
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new Error('Rate limited by the API. Wait a moment and try again.');
    }
    if (err instanceof Anthropic.APIConnectionError) {
      throw new Error('Could not reach the AI service. Check your connection.');
    }
    if (err instanceof Anthropic.APIError) {
      throw new Error(`AI request failed: ${err.message}`);
    }
    throw err;
  }

  const stopError = stopReasonError(response.stop_reason);
  if (stopError) {
    throw new Error(stopError);
  }
  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('The AI returned no answer. Please try again.');
  }
  return parseAnalysis(textBlock.text);
}
