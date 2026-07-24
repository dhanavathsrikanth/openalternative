'use client'

import { useState } from 'react'

interface Member {
  id: string
  userId: string
  name: string | null
  email: string
  imageUrl: string | null
  role: string
}

interface PendingInvite {
  id: string
  email: string
  role: string
  createdAt: Date
}

interface Props {
  orgSlug: string
  orgId: string
  currentUserId: string
  currentRole: string
  members: Member[]
  pendingInvites: PendingInvite[]
  ownerCount: number
}

const ROLES = [
  { value: 'org:owner', label: 'Owner' },
  { value: 'org:admin', label: 'Admin' },
  { value: 'org:editor', label: 'Editor' },
  { value: 'org:marketing', label: 'Marketing' },
  { value: 'org:viewer', label: 'Viewer' },
] as const

const ROLE_HIERARCHY: Record<string, number> = {
  'org:owner': 50, 'org:admin': 40, 'org:editor': 30, 'org:marketing': 20, 'org:viewer': 10,
}

function roleLabel(role: string) {
  return ROLES.find((r) => r.value === role)?.label ?? role.replace('org:', '')
}

export function TeamManager({
  orgSlug,
  orgId,
  currentUserId,
  currentRole,
  members,
  pendingInvites,
  ownerCount,
}: Props) {
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('org:viewer')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editingMember, setEditingMember] = useState<string | null>(null)

  const isOwnerOrAdmin = ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY['org:admin']

  async function invite() {
    if (!inviteEmail) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/dashboard/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to send invite' })
        return
      }
      setMessage({ type: 'success', text: `Invite sent to ${inviteEmail}` })
      setInviteEmail('')
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  async function changeRole(memberId: string, newRole: string) {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/dashboard/team/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to change role' })
        return
      }
      setMessage({ type: 'success', text: 'Role updated' })
      setEditingMember(null)
      window.location.reload()
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  async function removeMember(memberId: string) {
    if (!confirm('Remove this member from the organization?')) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/dashboard/team/${memberId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to remove member' })
        return
      }
      setMessage({ type: 'success', text: 'Member removed' })
      window.location.reload()
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  async function revokeInvite(inviteId: string) {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/dashboard/team/invite`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId: inviteId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to revoke invite' })
        return
      }
      setMessage({ type: 'success', text: 'Invite revoked' })
      window.location.reload()
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage members and invitations for your organization.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            message.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Invite form */}
      {isOwnerOrAdmin && (
        <section className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Invite member</h2>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-muted-foreground">Email address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="mt-1 rounded-lg border bg-background px-3 py-2 text-sm"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={invite}
              disabled={loading || !inviteEmail}
              className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
        </section>
      )}

      {/* Members */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Members ({members.length})</h2>
        <div className="space-y-2">
          {members.map((member) => {
            const isSelf = member.userId === currentUserId
            const isTargetOwner = member.role === 'org:owner'
            const isLastOwner = isTargetOwner && ownerCount <= 1
            const canManage = isOwnerOrAdmin && !isSelf

            return (
              <div
                key={member.id}
                className="flex items-center gap-4 rounded-xl border bg-card px-4 py-3"
              >
                {member.imageUrl ? (
                  <img src={member.imageUrl} alt="" className="h-8 w-8 rounded-full" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                    {(member.name || member.email)[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {member.name || member.email}
                    {isSelf && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                </div>

                <div className="flex items-center gap-2">
                  {editingMember === member.id ? (
                    <div className="flex items-center gap-2">
                      <select
                        defaultValue={member.role}
                        onChange={(e) => changeRole(member.id, e.target.value)}
                        disabled={loading || isLastOwner}
                        className="rounded border bg-background px-2 py-1 text-xs"
                      >
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setEditingMember(null)}
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                        {roleLabel(member.role)}
                      </span>
                      {canManage && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingMember(member.id)}
                            className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                            title="Change role"
                          >
                            Edit
                          </button>
                          {!isLastOwner ? (
                            <button
                              onClick={() => removeMember(member.id)}
                              className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                              title="Remove member"
                            >
                              Remove
                            </button>
                          ) : (
                            <span className="px-2 py-1 text-xs text-muted-foreground" title="Cannot remove the last owner">
                              Last Owner
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Pending invitations */}
      {pendingInvites.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Pending Invitations ({pendingInvites.length})</h2>
          <div className="space-y-2">
            {pendingInvites.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-4 rounded-xl border border-dashed bg-card px-4 py-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-medium text-muted-foreground">
                  ✉
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Invited as {roleLabel(inv.role)} · {new Date(inv.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {isOwnerOrAdmin && (
                  <button
                    onClick={() => revokeInvite(inv.id)}
                    disabled={loading}
                    className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
