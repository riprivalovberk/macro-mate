import Anthropic from '@anthropic-ai/sdk';
import type { Analysis, FoodItem } from '../types';

const SYSTEM_PROMPT = `You are the nutrition engine inside Macro Mate, a personal macro-tracking app.
The user sends a photo of food, a screenshot, and/or a text description, and you estimate the nutrition of what THEY are about to eat.

Input types you must handle:
- A photo of a meal or food item: identify each distinct food, estimate the portion size from visual cues (plate size, utensils, packaging), and estimate nutrition for that portion.
- A screenshot of a nutrition label or of macro numbers (from another app, a menu, a website): read the values directly instead of estimating. If a serving count is ambiguous, assume one serving and say so in notes.
- A text description (possibly alongside a photo) with portion details like "200g" or "two slices": treat any user-provided measurements as authoritative and scale your estimate to them.

Rules:
- Report nutrition for the portion actually shown/described, not per 100g.
- kcal in calories; protein, carbs, fat, fiber, sugar in grams; sodium in milligrams.
- Split a plate into at most a handful of meaningful items (e.g. "Grilled chicken breast", "White rice", "Side salad"); don't itemize garnishes.
- Each item gets a single fitting emoji.
- "portion" is a short human-readable size like "1 bowl (~350 g)" or "2 slices".
- confidence: "high" when reading a label or the food is unambiguous, "medium" for typical photo estimates, "low" when the portion or preparation is largely a guess.
- Use "notes" for one short sentence of caveats worth knowing (hidden oils, dressing assumptions, ambiguous serving count). Empty string if nothing useful.
- If the image contains no food or readable nutrition info, return an empty items array and explain in notes.`;

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

function supportsAdaptiveThinking(model: string): boolean {
  return /opus-4-[6-9]|opus-4-7|sonnet-4-6|fable|mythos/.test(model);
}

export async function analyzeFood(input: AnalyzeInput): Promise<Analysis> {
  if (!input.apiKey) {
    throw new Error('Add your Anthropic API key in Settings first.');
  }
  if (!input.images?.length && !input.text?.trim()) {
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
  content.push({
    type: 'text',
    text: input.text?.trim()
      ? `Analyze this food. User notes / measurements: ${input.text.trim()}`
      : 'Analyze this food.',
  });

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

  if (response.stop_reason === 'refusal') {
    throw new Error('The AI declined to analyze this image. Try a different photo.');
  }
  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('The AI returned no answer. Please try again.');
  }
  return parseAnalysis(textBlock.text);
}
