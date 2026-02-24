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

const fallbackClassify = (description: string): ClassificationResult => {
  const text = description.toLowerCase()

  if (text.includes('uber') || text.includes('bus') || text.includes('gas')) {
    return { categoryId: 'transport', tags: ['travel'], confidence: 0.62 }
  }

  if (text.includes('coffee') || text.includes('restaurant') || text.includes('dinner')) {
    return { categoryId: 'dining', tags: ['food'], confidence: 0.64 }
  }

  if (text.includes('rent') || text.includes('lease')) {
    return { categoryId: 'rent', tags: ['housing'], confidence: 0.88 }
  }

  if (text.includes('walmart') || text.includes('market') || text.includes('grocery')) {
    return { categoryId: 'groceries', tags: ['necessities'], confidence: 0.8 }
  }

  return { categoryId: 'other', tags: [], confidence: 0.45 }
}

export const classifyExpense = async (
  description: string,
  categories: CategoryOption[],
): Promise<ClassificationResult> => {
  if (!isFirebaseConfigured) {
    return fallbackClassify(description)
  }

  const callable = httpsCallable<{ description: string; categories: CategoryOption[] }, ClassificationResult>(
    functions,
    'classifyExpense',
  )

  try {
    const response = await callable({ description, categories })
    return response.data
  } catch {
    return fallbackClassify(description)
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
