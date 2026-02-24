import { httpsCallable } from 'firebase/functions'
import { functions, isFirebaseConfigured } from '@/services/firebase/config'

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

interface ChatResponse {
  answer: string
}

const fallbackClassify = (categories: CategoryOption[]): ClassificationResult => {
  const fallbackCategory = categories.find((category) => category.id === 'other')?.id ?? categories[0]?.id ?? 'other'

  return {
    categoryId: fallbackCategory,
    tags: [],
    confidence: 0,
  }
}

export const classifyExpense = async (
  description: string,
  categories: CategoryOption[],
): Promise<ClassificationResult> => {
  try {
    if (!isFirebaseConfigured) {
      return fallbackClassify(categories)
    }

    const callable = httpsCallable<{ description: string; categories: CategoryOption[] }, ClassificationResult>(
      functions,
      'classifyExpense',
    )

    const response = await callable({ description, categories })
    return response.data
  } catch {
    return fallbackClassify(categories)
  }
}

export const askFinanceAssistant = async (
  messages: ChatRequestMessage[],
  financialContext: string,
): Promise<string> => {
  if (!isFirebaseConfigured) {
    return 'AI service is not configured yet. Add Firebase env vars to enable Gemini-backed responses.'
  }

  const callable = httpsCallable<{ messages: ChatRequestMessage[]; financialContext: string }, ChatResponse>(
    functions,
    'financeChat',
  )

  try {
    const response = await callable({ messages, financialContext })
    return response.data.answer
  } catch {
    return 'FinSage assistant is temporarily unavailable. Please try again shortly.'
  }
}
