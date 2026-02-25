import { useEffect, useState } from 'react'

interface ToastItem {
    id: number
    message: string
    type: 'success' | 'error'
    exiting?: boolean
}

let toastId = 0
const listeners: Set<(toast: ToastItem) => void> = new Set()

export const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const toast: ToastItem = { id: ++toastId, message, type }
    for (const listener of listeners) {
        listener(toast)
    }
}

export const ToastContainer = () => {
    const [toasts, setToasts] = useState<ToastItem[]>([])

    useEffect(() => {
        const handler = (toast: ToastItem) => {
            setToasts((prev) => [...prev, toast])

            setTimeout(() => {
                setToasts((prev) =>
                    prev.map((t) => (t.id === toast.id ? { ...t, exiting: true } : t)),
                )
            }, 2800)

            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== toast.id))
            }, 3100)
        }

        listeners.add(handler)
        return () => { listeners.delete(handler) }
    }, [])

    if (toasts.length === 0) return null

    return (
        <div className="toast-container">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`toast toast--${toast.type}${toast.exiting ? ' toast--exiting' : ''}`}
                >
                    <span className="toast__icon">
                        {toast.type === 'success' ? '✓' : '✕'}
                    </span>
                    <span>{toast.message}</span>
                </div>
            ))}
        </div>
    )
}
