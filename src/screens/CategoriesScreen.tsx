import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useFinanceCollections } from '@/hooks/useFinanceCollections'
import { addCategory, updateCategory, deleteCategory, mergeCategories } from '@/services/firestore/categories'
import { showToast } from '@/components/common/Toast'
import { Category } from '@/types/finance'

const COLOR_OPTIONS = [
    '#6c5ce7', '#0984e3', '#00b894', '#fdcb6e', '#e17055',
    '#d63031', '#e84393', '#636e72', '#2d3436', '#00cec9',
]

const ICON_OPTIONS = ['💰', '🏠', '🛒', '🚗', '🎬', '💊', '📚', '🍔', '✈️', '🎁', '💼', '🏋️']

export const CategoriesScreen = () => {
    const { user } = useAuth()
    const { categories } = useFinanceCollections(user?.uid)
    const [showForm, setShowForm] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [name, setName] = useState('')
    const [color, setColor] = useState(COLOR_OPTIONS[0])
    const [icon, setIcon] = useState(ICON_OPTIONS[0])
    const [saving, setSaving] = useState(false)
    const [mergeSource, setMergeSource] = useState<string | null>(null)
    const [mergeTarget, setMergeTarget] = useState('')

    const resetForm = () => {
        setName('')
        setColor(COLOR_OPTIONS[0])
        setIcon(ICON_OPTIONS[0])
        setEditingCategory(null)
        setShowForm(false)
    }

    const openEdit = (cat: Category) => {
        setEditingCategory(cat)
        setName(cat.name)
        setColor(cat.color)
        setIcon(cat.icon)
        setShowForm(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !name.trim()) return
        setSaving(true)
        try {
            if (editingCategory) {
                await updateCategory(user.uid, editingCategory.id, { name: name.trim(), color, icon })
                showToast('Category updated.', 'success')
            } else {
                await addCategory(user.uid, { name: name.trim(), color, icon })
                showToast('Category added!', 'success')
            }
            resetForm()
        } catch {
            showToast('Failed to save category.', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (catId: string) => {
        if (!user) return
        try {
            await deleteCategory(user.uid, catId)
            showToast('Category deleted.', 'success')
        } catch {
            showToast('Failed to delete.', 'error')
        }
    }

    const handleMerge = async () => {
        if (!user || !mergeSource || !mergeTarget || mergeSource === mergeTarget) return
        setSaving(true)
        try {
            await mergeCategories(user.uid, mergeSource, mergeTarget)
            const srcName = categories.find(c => c.id === mergeSource)?.name ?? 'source'
            const tgtName = categories.find(c => c.id === mergeTarget)?.name ?? 'target'
            showToast(`Merged "${srcName}" into "${tgtName}" — all transactions reassigned.`, 'success')
            setMergeSource(null)
            setMergeTarget('')
        } catch {
            showToast('Failed to merge.', 'error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <main className="screen stack">
            <header className="screen-header" style={{ animation: 'fade-up 400ms ease both' }}>
                <div>
                    <h2>Categories</h2>
                    <p className="section-subtitle">Customize, add, merge, or delete categories for your transactions.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="secondary-button" type="button" onClick={() => setMergeSource(mergeSource ? null : (categories[0]?.id ?? null))}>
                        {mergeSource ? '✕ Cancel merge' : '🔗 Merge'}
                    </button>
                    <button className="primary-button" type="button" onClick={() => { resetForm(); setShowForm(true) }}>
                        + New category
                    </button>
                </div>
            </header>

            <section className="insight-strip">
                {[
                    { label: 'Total categories', value: String(categories.length) },
                    { label: 'Most common', value: categories[0]?.name ?? '—' },
                ].map((item, i) => (
                    <article key={item.label} className="insight-strip__item" style={{ '--stagger': i } as React.CSSProperties}>
                        <small>{item.label}</small>
                        <strong>{item.value}</strong>
                    </article>
                ))}
            </section>

            {/* Merge panel */}
            {mergeSource && (
                <section className="card" style={{ animation: 'fade-up 300ms ease both', borderLeft: '4px solid var(--primary)' }}>
                    <h3>🔗 Merge categories</h3>
                    <p className="section-subtitle" style={{ marginBottom: '1rem' }}>
                        All transactions from the source will be reassigned to the target. The source category will then be deleted.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <label className="field">
                            <span>Source (will be removed)</span>
                            <select value={mergeSource} onChange={(e) => setMergeSource(e.target.value)}>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                            </select>
                        </label>
                        <span style={{ fontSize: '1.5rem', padding: '0.5rem' }}>→</span>
                        <label className="field">
                            <span>Target (will keep)</span>
                            <select value={mergeTarget} onChange={(e) => setMergeTarget(e.target.value)}>
                                <option value="">Select target...</option>
                                {categories.filter(c => c.id !== mergeSource).map(c => (
                                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                ))}
                            </select>
                        </label>
                        <button className="primary-button" type="button" disabled={!mergeTarget || saving}
                            onClick={() => void handleMerge()}>
                            {saving ? 'Merging...' : 'Merge'}
                        </button>
                    </div>
                </section>
            )}

            {/* Add/Edit form */}
            {showForm && (
                <section className="card stack" style={{ animation: 'fade-up 300ms ease both' }}>
                    <h3>{editingCategory ? '✏️ Edit category' : '➕ New category'}</h3>
                    <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label className="field">
                            <span>Name</span>
                            <input type="text" placeholder="e.g. Groceries" value={name} onChange={(e) => setName(e.target.value)} required />
                        </label>

                        <div>
                            <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Icon</small>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                {ICON_OPTIONS.map(ic => (
                                    <button key={ic} type="button" onClick={() => setIcon(ic)}
                                        style={{
                                            width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', fontSize: '1.2rem',
                                            border: icon === ic ? '2px solid var(--primary)' : '2px solid var(--border)',
                                            background: icon === ic ? 'color-mix(in srgb, var(--primary) 15%, transparent)' : 'var(--bg-elevated)',
                                            cursor: 'pointer', transition: 'all 0.2s',
                                        }}>
                                        {ic}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Color</small>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                {COLOR_OPTIONS.map(clr => (
                                    <button key={clr} type="button" onClick={() => setColor(clr)}
                                        style={{
                                            width: '2rem', height: '2rem', borderRadius: '50%', cursor: 'pointer',
                                            background: clr, border: color === clr ? '3px solid var(--text)' : '3px solid transparent',
                                            transition: 'all 0.2s',
                                        }} />
                                ))}
                            </div>
                        </div>

                        <div className="button-row">
                            <button className="primary-button" type="submit" disabled={saving}>
                                {saving ? 'Saving...' : editingCategory ? 'Update' : 'Add'}
                            </button>
                            <button className="secondary-button" type="button" onClick={resetForm}>Cancel</button>
                        </div>
                    </form>
                </section>
            )}

            {/* Category list */}
            <section className="stack" style={{ gap: '0.5rem' }}>
                {categories.map((cat, i) => (
                    <article key={cat.id} className="card" style={{
                        '--stagger': i + 1,
                        borderLeft: `4px solid ${cat.color}`,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    } as React.CSSProperties}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{
                                width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.2rem', background: `${cat.color}22`,
                            }}>
                                {cat.icon}
                            </span>
                            <div>
                                <strong>{cat.name}</strong>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.15rem' }}>
                                    <span style={{
                                        width: '0.75rem', height: '0.75rem', borderRadius: '50%',
                                        background: cat.color, display: 'inline-block',
                                    }} />
                                    <small style={{ color: 'var(--text-muted)' }}>{cat.color}</small>
                                </div>
                            </div>
                        </div>
                        <div className="button-row">
                            <button className="secondary-button" type="button" style={{ fontSize: '0.85rem' }}
                                onClick={() => openEdit(cat)}>✏️</button>
                            <button className="secondary-button" type="button" style={{ fontSize: '0.85rem', color: 'var(--danger)' }}
                                onClick={() => void handleDelete(cat.id)}>🗑</button>
                        </div>
                    </article>
                ))}
            </section>

            {categories.length === 0 && !showForm && (
                <section className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🗂️</p>
                    <h3>No categories yet</h3>
                    <p className="section-subtitle">Categories help organize your transactions.</p>
                    <button className="primary-button" type="button" onClick={() => setShowForm(true)} style={{ marginTop: '1rem' }}>
                        Create first category
                    </button>
                </section>
            )}
        </main>
    )
}
