

export interface ClassificationResult {
  categoryId: string
  tags: string[]
  confidence: number
}

export interface CategoryOption {
  id: string
  name: string
}

interface ChatRequestMessage {
  role: 'user' | 'assistant'
  content: string
}



const fallbackClassify = (categories: CategoryOption[]): ClassificationResult => {
  const fallbackCategory = categories.find((category) => category.id === 'other')?.id ?? categories[0]?.id ?? 'other'

  return {
    categoryId: fallbackCategory,
    tags: [],
    confidence: 0,
  }
}

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const DEFAULT_MODEL = 'gemini-2.5-flash'

interface GeminiRequest {
  contents: { role: string; parts: { text: string }[] }[]
  generationConfig?: {
    temperature?: number
    maxOutputTokens?: number
    responseMimeType?: string
  }
  systemInstruction?: { parts: { text: string }[] }
}

const callGemini = async (requestBody: GeminiRequest): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY is missing')
  }

  const response = await fetch(`${GEMINI_API_BASE}/models/${DEFAULT_MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Gemini API error: ${text}`)
  }

  const data = await response.json()
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!textContent) throw new Error('No successful output from Gemini')
  return textContent
}

const extractJsonObject = <T>(text: string): T | null => {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end < 0 || end < start) return null
  try {
    return JSON.parse(text.slice(start, end + 1)) as T
  } catch {
    return null
  }
}

export const classifyExpense = async (
  description: string,
  categories: CategoryOption[],
): Promise<ClassificationResult> => {
  try {
    const categoryPrompt = categories.length
      ? categories.map((c) => `- ${c.id}: ${c.name}`).join('\n')
      : '- other: Other'

    const prompt = [
      'You are a finance classification assistant.',
      'Classify the transaction description into one provided category.',
      'Return strict JSON only with schema:',
      '{"categoryId":"<one category id>","confidence":<0..1>,"tags":["tag1","tag2"]}',
      'Available categories:',
      categoryPrompt,
      `Transaction description: "${description}"`,
    ].join('\n')

    const aiText = await callGemini({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        maxOutputTokens: 180,
      },
    })

    const parsed = extractJsonObject<{ categoryId?: string; confidence?: number; tags?: string[] }>(aiText)
    if (parsed && parsed.categoryId) {
      return {
        categoryId: parsed.categoryId,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      }
    }
    return fallbackClassify(categories)
  } catch (error) {
    console.warn('classifyExpense fallback triggered', error)
    return fallbackClassify(categories)
  }
}

export const askFinanceAssistant = async (
  messages: ChatRequestMessage[],
  financialContext: string,
): Promise<string> => {
  try {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      return 'AI service is not configured yet. Add VITE_GEMINI_API_KEY to your environment.'
    }

    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    const answer = await callGemini({
      systemInstruction: {
        parts: [
          {
            text: [
              'You are FinSage, a premium AI-powered personal finance assistant.',
              'You have access to the user\'s real financial data provided as JSON context.',
              'Always reference their actual numbers — never use hypothetical or sample data.',
              '',
              'Capabilities you should leverage:',
              '- Financial Health Score (0-100 with 5 factors: savings rate, budget discipline, tracking consistency, spending diversity, month trend)',
              '- Budget progress and over-budget alerts',
              '- Month-over-month comparison data',
              '- Top spending categories with percentages',
              '- Loan/borrow tracking (who owes whom, overdue loans)',
              '- Spending anomaly detection',
              '',
              'Response guidelines:',
              '- Be specific with numbers, use the provided currency',
              '- Structure responses with bullet points or numbered steps',
              '- Give 2-3 actionable next steps at the end',
              '- For savings advice, calculate exact amounts based on their data',
              '- For budget advice, reference their actual over-budget categories',
              '- For loan queries, mention specific people and amounts',
              '- Use encouraging but honest tone — celebrate wins, flag risks',
              '- Keep responses concise (under 200 words when possible)',
              '- Do not provide legal or tax advice as definitive guidance',
            ].join('\n'),
          },
        ],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: `Financial context JSON:\n${financialContext || '{}'}\nUse this context when answering.` }],
        },
        ...contents,
      ],
      generationConfig: {
        temperature: 0.25,
        maxOutputTokens: 900,
      },
    })

    return answer
  } catch (error) {
    console.error('financeChat fallback triggered', error)
    return 'FinSage assistant is temporarily unavailable. Please try again shortly.'
  }
}
