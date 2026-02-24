import * as logger from 'firebase-functions/logger'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'

const geminiApiKey = defineSecret('GEMINI_API_KEY')

const REGION = 'us-central1'
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'
const GEMINI_API_BASE = process.env.GEMINI_API_BASE ?? 'https://generativelanguage.googleapis.com/v1beta'
const ENFORCE_APPCHECK = process.env.ENFORCE_APPCHECK === 'true'

interface ClassificationResult {
  categoryId: string
  confidence: number
  tags: string[]
}

interface CategoryOption {
  id: string
  name: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface GeminiPart {
  text: string
}

interface GeminiContent {
  role: 'user' | 'model'
  parts: GeminiPart[]
}

interface GeminiRequest {
  contents: GeminiContent[]
  generationConfig?: {
    maxOutputTokens?: number
    responseMimeType?: 'application/json'
    temperature?: number
  }
  systemInstruction?: {
    parts: GeminiPart[]
  }
}

interface GeminiCandidate {
  content?: {
    parts?: Array<{ text?: string }>
  }
}

interface GeminiResponse {
  candidates?: GeminiCandidate[]
}

interface ModelClassification {
  categoryId?: unknown
  confidence?: unknown
  tags?: unknown
}

const callableOptions = {
  cors: true,
  enforceAppCheck: ENFORCE_APPCHECK,
  region: REGION,
  secrets: [geminiApiKey],
}

const slugify = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value))
}

const extractJsonObject = <T>(text: string): T | null => {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')

  if (start < 0 || end < 0 || end < start) {
    return null
  }

  try {
    return JSON.parse(text.slice(start, end + 1)) as T
  } catch {
    return null
  }
}

const normalizeCategoryOptions = (rawValue: unknown): CategoryOption[] => {
  if (!Array.isArray(rawValue)) {
    return []
  }

  const seen = new Set<string>()
  const categories: CategoryOption[] = []

  for (const entry of rawValue) {
    if (typeof entry === 'string') {
      const name = entry.trim()
      if (!name) {
        continue
      }

      const id = slugify(name)
      if (!id || seen.has(id)) {
        continue
      }

      categories.push({ id, name })
      seen.add(id)
      continue
    }

    if (!entry || typeof entry !== 'object') {
      continue
    }

    const candidateId =
      typeof (entry as { id?: unknown }).id === 'string' ? (entry as { id: string }).id.trim() : ''
    const candidateName =
      typeof (entry as { name?: unknown }).name === 'string'
        ? (entry as { name: string }).name.trim()
        : ''

    const id = candidateId || slugify(candidateName)
    if (!id || !candidateName || seen.has(id)) {
      continue
    }

    categories.push({ id, name: candidateName })
    seen.add(id)
  }

  return categories
}

const normalizeChatMessages = (rawValue: unknown): ChatMessage[] => {
  if (!Array.isArray(rawValue)) {
    return []
  }

  const messages: ChatMessage[] = []

  for (const entry of rawValue) {
    if (!entry || typeof entry !== 'object') {
      continue
    }

    const rawRole = typeof (entry as { role?: unknown }).role === 'string' ? (entry as { role: string }).role : ''
    const rawContent =
      typeof (entry as { content?: unknown }).content === 'string'
        ? (entry as { content: string }).content.trim()
        : ''

    if (!rawContent) {
      continue
    }

    messages.push({
      role: rawRole === 'assistant' ? 'assistant' : 'user',
      content: rawContent.slice(0, 2000),
    })
  }

  return messages.slice(-16)
}

const fallbackClassification = (categories: CategoryOption[]): ClassificationResult => {
  const defaultCategory = categories.find((category) => category.id === 'other')?.id ?? categories[0]?.id ?? 'other'

  return {
    categoryId: defaultCategory,
    confidence: 0,
    tags: [],
  }
}

const callGemini = async (
  apiKey: string,
  requestBody: GeminiRequest,
  model = DEFAULT_GEMINI_MODEL,
): Promise<string> => {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  const controller = new AbortController()
  const timeoutHandle = setTimeout(() => controller.abort(), 20000)
  const normalizedModel = model.replace(/^models\//, '')

  try {
    const response = await fetch(
      `${GEMINI_API_BASE}/models/${encodeURIComponent(normalizedModel)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gemini API error ${response.status}: ${errorText.slice(0, 600)}`)
    }

    const payload = (await response.json()) as GeminiResponse

    const text = (payload.candidates ?? [])
      .flatMap((candidate) => candidate.content?.parts ?? [])
      .map((part) => part.text ?? '')
      .join('\n')
      .trim()

    if (!text) {
      throw new Error('Gemini response did not contain text output')
    }

    return text
  } finally {
    clearTimeout(timeoutHandle)
  }
}

const parseClassification = (
  text: string,
  categories: CategoryOption[],
  fallback: ClassificationResult,
): ClassificationResult => {
  const parsed = extractJsonObject<ModelClassification>(text)

  if (!parsed) {
    return fallback
  }

  const validCategoryIds = new Set(categories.map((category) => category.id))
  const candidateCategoryId = typeof parsed.categoryId === 'string' ? parsed.categoryId.trim() : ''
  const categoryId = validCategoryIds.has(candidateCategoryId)
    ? candidateCategoryId
    : fallback.categoryId

  const confidence =
    typeof parsed.confidence === 'number' && Number.isFinite(parsed.confidence)
      ? clamp(parsed.confidence, 0, 1)
      : fallback.confidence

  const tags = Array.isArray(parsed.tags)
    ? parsed.tags
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .slice(0, 5)
    : fallback.tags

  return {
    categoryId,
    confidence,
    tags,
  }
}

const buildChatFallback = (question: string): string => {
  return [
    'I could not reach Gemini right now.',
    'Please retry in a moment or continue with manual budgeting updates.',
    `Most recent question: ${question}`,
  ].join(' ')
}

export const classifyExpense = onCall(callableOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to classify expenses.')
  }

  const description =
    typeof (request.data as { description?: unknown }).description === 'string'
      ? ((request.data as { description: string }).description ?? '').trim()
      : ''

  if (!description) {
    throw new HttpsError('invalid-argument', 'description is required.')
  }

  const categories = normalizeCategoryOptions((request.data as { categories?: unknown }).categories)
  const fallback = fallbackClassification(categories)

  logger.info('classifyExpense request', {
    categoryCount: categories.length,
    uid: request.auth.uid,
  })

  try {
    const categoryPrompt = categories.length
      ? categories.map((category) => `- ${category.id}: ${category.name}`).join('\n')
      : '- other: Other'

    const prompt = [
      'You are a finance classification assistant.',
      'Classify the transaction description into one provided category.',
      'Return strict JSON only with schema:',
      '{"categoryId":"<one category id>","confidence":<0..1>,"tags":["tag1","tag2"]}',
      'Do not use markdown or extra keys.',
      'Available categories:',
      categoryPrompt,
      `Transaction description: "${description.slice(0, 200)}"`,
    ].join('\n')

    const aiText = await callGemini(geminiApiKey.value(), {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        maxOutputTokens: 180,
      },
    })

    return parseClassification(aiText, categories, fallback)
  } catch (error) {
    logger.warn('classifyExpense fallback triggered', {
      error: error instanceof Error ? error.message : String(error),
      uid: request.auth.uid,
    })
    return fallback
  }
})

export const financeChat = onCall(callableOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to use the assistant.')
  }

  const messages = normalizeChatMessages((request.data as { messages?: unknown }).messages)
  const financialContext =
    typeof (request.data as { financialContext?: unknown }).financialContext === 'string'
      ? ((request.data as { financialContext: string }).financialContext ?? '').slice(0, 6000)
      : ''

  logger.info('financeChat request', {
    messageCount: messages.length,
    uid: request.auth.uid,
  })

  const latestQuestion = messages.at(-1)?.content ?? 'Please help me review my finances.'

  try {
    const contents: GeminiContent[] = messages.length
      ? messages.map((message) => ({
          role: message.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: message.content }],
        }))
      : [{ role: 'user', parts: [{ text: latestQuestion }] }]

    const answer = await callGemini(geminiApiKey.value(), {
      systemInstruction: {
        parts: [
          {
            text: [
              'You are FinSage, a personal finance assistant.',
              'Use only the information provided in this request.',
              'Keep responses practical, concise, and include clear next actions.',
              'Do not provide legal or tax advice as definitive guidance.',
            ].join(' '),
          },
        ],
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Financial context JSON:\n${financialContext || '{}'}\nUse this context when answering.`,
            },
          ],
        },
        ...contents,
      ],
      generationConfig: {
        temperature: 0.25,
        maxOutputTokens: 900,
      },
    })

    return {
      answer: answer.slice(0, 5000),
    }
  } catch (error) {
    logger.error('financeChat fallback triggered', {
      error: error instanceof Error ? error.message : String(error),
      uid: request.auth.uid,
    })

    return {
      answer: buildChatFallback(latestQuestion),
    }
  }
})
