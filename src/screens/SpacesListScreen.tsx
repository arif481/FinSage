import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSpaces } from '@/hooks/useSpaces'
import { useUserProfile } from '@/hooks/useUserProfile'
import { createSpace, joinSpaceByCode, type CreateSpaceInput } from '@/services/firestore/spaces'
import { seedDefaultSpaceCategories } from '@/services/firestore/spaceCategories'
import { logActivity } from '@/services/firestore/spaceActivity'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { showToast } from '@/components/common/Toast'
import { useNavigate, useSearchParams } from 'react-router-dom'

const SPACE_ICONS = ['🏠', '💼', '🎯', '👫', '🏦', '🎓', '✈️', '🛒', '🎮', '💳', '🏢', '🤝', '🍕', '⚡', '🔥']
const SPACE_COLORS = ['#0ea5e9', '#8b5cf6', '#ef4444', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#06b6d4']

export const SpacesListScreen = () => {
    const { user } = useAuth()
    const { profile } = useUserProfile(user?.uid)
    const { spaces, loading, error } = useSpaces(user?.uid)
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const [showCreate, setShowCreate] = useState(false)
    const [showJoin, setShowJoin] = useState(false)
    const [saving, setSaving] = useState(false)

    // Create form
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [icon, setIcon] = useState('🏠')
    const [color, setColor] = useState('#0ea5e9')

    // Join form
    const [inviteCode, setInviteCode] = useState('')
    const inviteFromLink = searchParams.get('invite')?.toUpperCase().trim() ?? ''

    useEffect(() => {
        if (!inviteFromLink) return
        setInviteCode(inviteFromLink)
        setShowJoin(true)
        setShowCreate(false)
    }, [inviteFromLink])

    if (loading) return <LoadingScreen label="Loading spaces..." />

    const resetCreate = () => {
        setName('')
        setDescription('')
        setIcon('🏠')
        setColor('#0ea5e9')
        setShowCreate(false)
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !name.trim()) return

        setSaving(true)
        try {
            const input: CreateSpaceInput = {
                name: name.trim(),
                description: description.trim(),
                icon,
                color,
            }

            const displayName = profile?.displayName ?? user.displayName ?? 'User'
            const email = profile?.email ?? user.email ?? ''
            const spaceId = await createSpace(user.uid, displayName, email, input)
            await seedDefaultSpaceCategories(spaceId, user.uid)
            await logActivity(spaceId, {
                uid: user.uid,
                userName: displayName,
                action: 'created this space',
                targetType: 'space',
            })
            showToast('Space created! 🚀', 'success')
            resetCreate()
            navigate(`/spaces/${spaceId}`)
        } catch {
            showToast('Failed to create space.', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !inviteCode.trim()) return

        setSaving(true)
        try {
            const displayName = profile?.displayName ?? user.displayName ?? 'User'
            const email = profile?.email ?? user.email ?? ''
            const spaceId = await joinSpaceByCode(user.uid, displayName, email, inviteCode)

            if (spaceId) {
                await logActivity(spaceId, {
                    uid: user.uid,
                    userName: displayName,
                    action: 'joined the space',
                    targetType: 'member',
                })
                showToast('Joined space! 🎉', 'success')
                setInviteCode('')
                setShowJoin(false)
                navigate(`/spaces/${spaceId}`)
            } else {
                showToast('Invalid invite code. Check and try again.', 'error')
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : ''
            const blockedOrOffline =
                message.includes('ERR_BLOCKED_BY_CLIENT')
                || message.toLowerCase().includes('unavailable')
                || message.toLowerCase().includes('network')

            if (blockedOrOffline) {
                showToast('Join failed: network/ad-blocker blocked Firebase. Disable blocker for this site and try again.', 'error')
            } else {
                showToast('Failed to join space.', 'error')
            }
        } finally {
            setSaving(false)
        }
    }

    return (
        <main className="screen stack">
            {error ? <p className="error-text">Error: {error}</p> : null}

            <header className="screen-header" style={{ animation: 'fade-up 400ms ease both' }}>
                <div>
                    <h2>Spaces</h2>
                    <p className="section-subtitle">
                        Collaborative workspaces for shared finances — split bills, track loans, manage EMIs together.
                    </p>
                </div>
                <div className="button-row">
                    <button className="secondary-button" type="button" onClick={() => { setShowJoin(true); setShowCreate(false) }}>
                        🔗 Join space
                    </button>
                    <button className="primary-button" type="button" onClick={() => { setShowCreate(true); setShowJoin(false) }}>
                        + Create space
                    </button>
                </div>
            </header>

            {/* Join Form */}
            {showJoin && (
                <section className="card stack" style={{ animation: 'fade-up 400ms ease both' }}>
                    <h3>🔗 Join a Space</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Opened via invite link or enter an invite code to join a space.
                    </p>
                    <form onSubmit={(e) => void handleJoin(e)} style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-end' }}>
                        <label className="field" style={{ flex: 1 }}>
                            <span>Invite Code</span>
                            <input
                                type="text"
                                placeholder="FS-XXXXXX"
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                style={{ fontFamily: "'Space Grotesk', monospace", letterSpacing: '0.1em', fontSize: '1.1rem' }}
                                required
                            />
                        </label>
                        <button className="primary-button" type="submit" disabled={saving}>
                            {saving ? 'Joining...' : 'Join'}
                        </button>
                        <button className="secondary-button" type="button" onClick={() => setShowJoin(false)}>Cancel</button>
                    </form>
                </section>
            )}

            {/* Create Form */}
            {showCreate && (
                <section className="card stack" style={{ animation: 'fade-up 400ms ease both' }}>
                    <h3>✨ Create a new Space</h3>
                    <form onSubmit={(e) => void handleCreate(e)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label className="field">
                            <span>Space name</span>
                            <input type="text" placeholder="e.g. Roommates, Trip Fund, Family" value={name} onChange={(e) => setName(e.target.value)} required />
                        </label>

                        <label className="field">
                            <span>Description (optional)</span>
                            <input type="text" placeholder="What's this space for?" value={description} onChange={(e) => setDescription(e.target.value)} />
                        </label>

                        <div>
                            <span style={{ fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>Icon</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                {SPACE_ICONS.map((ic) => (
                                    <button
                                        key={ic}
                                        type="button"
                                        onClick={() => setIcon(ic)}
                                        className={icon === ic ? 'space-icon-btn space-icon-btn--active' : 'space-icon-btn'}
                                    >
                                        {ic}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <span style={{ fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>Color</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                {SPACE_COLORS.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setColor(c)}
                                        className={color === c ? 'space-color-btn space-color-btn--active' : 'space-color-btn'}
                                        style={{ background: c }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="button-row">
                            <button className="primary-button" type="submit" disabled={saving}>
                                {saving ? 'Creating...' : 'Create space'}
                            </button>
                            <button className="secondary-button" type="button" onClick={resetCreate}>Cancel</button>
                        </div>
                    </form>
                </section>
            )}

            {/* Space Cards */}
            {spaces.length > 0 ? (
                <section className="space-grid">
                    {spaces.map((space, i) => (
                        <article
                            key={space.id}
                            className="space-card"
                            style={{ '--space-color': space.color, '--stagger': i } as React.CSSProperties}
                            onClick={() => navigate(`/spaces/${space.id}`)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && navigate(`/spaces/${space.id}`)}
                        >
                            <div className="space-card__header">
                                <span className="space-card__icon">{space.icon}</span>
                                <div>
                                    <h3 className="space-card__name">{space.name}</h3>
                                    {space.description && (
                                        <p className="space-card__desc">{space.description}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-card__footer">
                                <div className="member-stack">
                                    {space.members.slice(0, 4).map((m) => (
                                        <span key={m.uid} className="member-avatar" title={m.displayName}>
                                            {m.displayName.charAt(0).toUpperCase()}
                                        </span>
                                    ))}
                                    {space.members.length > 4 && (
                                        <span className="member-avatar member-avatar--more">
                                            +{space.members.length - 4}
                                        </span>
                                    )}
                                </div>
                                <small style={{ color: 'var(--text-muted)' }}>
                                    {space.members.length} member{space.members.length !== 1 ? 's' : ''}
                                </small>
                            </div>
                        </article>
                    ))}
                </section>
            ) : !showCreate && !showJoin ? (
                <section className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <p style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🤝</p>
                    <h3>No spaces yet</h3>
                    <p className="section-subtitle" style={{ maxWidth: '420px', margin: '0.5rem auto 1.5rem' }}>
                        Create a shared workspace to track expenses, loans, and EMIs with friends, family, or roommates.
                    </p>
                    <div className="button-row" style={{ justifyContent: 'center' }}>
                        <button className="secondary-button" type="button" onClick={() => setShowJoin(true)}>🔗 Join with code</button>
                        <button className="primary-button" type="button" onClick={() => setShowCreate(true)}>✨ Create your first space</button>
                    </div>
                </section>
            ) : null}
        </main>
    )
}
