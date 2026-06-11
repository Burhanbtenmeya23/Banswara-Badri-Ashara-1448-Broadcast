'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Papa from 'papaparse'

interface User {
  id: string
  its_id: string
  created_at: string
  last_login: string | null
  active_session_token: string | null
}

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
}

function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="glass-card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold" style={{ color: '#f5efe0' }}>{title}</h3>
          <button onClick={onClose} style={{ color: 'rgba(245,239,224,0.4)' }}
            className="hover:opacity-70 transition-opacity">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function UsersManager() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [addModal, setAddModal] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [importModal, setImportModal] = useState(false)
  const [formData, setFormData] = useState({ its_id: '', password: '' })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}&page=${page}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users ?? [])
        setTotal(data.total ?? 0)
      }
    } finally {
      setLoading(false)
    }
  }, [search, page])

  useEffect(() => { loadUsers() }, [loadUsers])

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error); return }
      setAddModal(false)
      setFormData({ its_id: '', password: '' })
      loadUsers()
    } finally {
      setFormLoading(false)
    }
  }

  async function handleEditUser(e: React.FormEvent) {
    e.preventDefault()
    if (!editUser) return
    setFormError('')
    setFormLoading(true)
    try {
      const body: Record<string, string> = {}
      if (formData.its_id && formData.its_id !== editUser.its_id) body.its_id = formData.its_id
      if (formData.password) body.password = formData.password

      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error); return }
      setEditUser(null)
      setFormData({ its_id: '', password: '' })
      loadUsers()
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteUser) return
    setFormLoading(true)
    try {
      await fetch(`/api/admin/users/${deleteUser.id}`, { method: 'DELETE' })
      setDeleteUser(null)
      loadUsers()
    } finally {
      setFormLoading(false)
    }
  }

  function openEdit(user: User) {
    setEditUser(user)
    setFormData({ its_id: user.its_id, password: '' })
    setFormError('')
  }

  function handleExport() {
    const csv = Papa.unparse(users.map(u => ({ its_id: u.its_id, last_login: u.last_login ?? '', created_at: u.created_at })))
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'users_export.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        setImportResult(null)
        setFormLoading(true)
        try {
          const res = await fetch('/api/admin/bulk-import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ users: results.data }),
          })
          const data = await res.json()
          setImportResult(data)
          loadUsers()
        } finally {
          setFormLoading(false)
          if (fileRef.current) fileRef.current.value = ''
        }
      },
    })
  }

  function formatDate(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: '#f5efe0' }}>User Management</h1>
          <p className="text-xs mt-1" style={{ color: 'rgba(245,239,224,0.4)' }}>{total} users total</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setImportModal(true)}
            className="px-3 py-2 text-xs rounded-lg transition-all"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
            Import CSV
          </button>
          <button onClick={handleExport}
            className="px-3 py-2 text-xs rounded-lg transition-all"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
            Export CSV
          </button>
          <button onClick={() => { setAddModal(true); setFormData({ its_id: '', password: '' }); setFormError('') }}
            className="btn-gold px-4 py-2 text-xs" style={{ width: 'auto' }}>
            + Add User
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          className="glass-input max-w-xs"
          placeholder="Search by ITS ID..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full admin-table">
            <thead>
              <tr>
                <th className="text-left">ITS ID</th>
                <th className="text-left">Created</th>
                <th className="text-left">Last Login</th>
                <th className="text-left">Status</th>
                <th className="text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8" style={{ color: 'rgba(245,239,224,0.35)' }}>Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8" style={{ color: 'rgba(245,239,224,0.35)' }}>No users found.</td></tr>
              ) : users.map((user) => (
                <tr key={user.id}>
                  <td className="font-mono font-medium">{user.its_id}</td>
                  <td>{formatDate(user.created_at)}</td>
                  <td>{formatDate(user.last_login)}</td>
                  <td>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: user.active_session_token ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.05)',
                        color: user.active_session_token ? '#34d399' : 'rgba(245,239,224,0.3)',
                        border: `1px solid ${user.active_session_token ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.08)'}`,
                      }}>
                      {user.active_session_token ? 'Active' : 'Idle'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(user)}
                        className="text-xs px-2 py-1 rounded"
                        style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.2)' }}>
                        Edit
                      </button>
                      <button onClick={() => setDeleteUser(user)}
                        className="text-xs px-2 py-1 rounded"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 px-5 py-4"
            style={{ borderTop: '1px solid rgba(201,168,76,0.1)' }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="text-xs px-3 py-1.5 rounded disabled:opacity-40"
              style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.2)' }}>
              ← Prev
            </button>
            <span className="text-xs" style={{ color: 'rgba(245,239,224,0.5)' }}>
              {page} / {totalPages}
            </span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              className="text-xs px-3 py-1.5 rounded disabled:opacity-40"
              style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.2)' }}>
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {addModal && (
        <Modal title="Add New User" onClose={() => setAddModal(false)}>
          <form onSubmit={handleAddUser} className="space-y-4">
            {formError && <p className="text-xs text-center py-2 px-3 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>{formError}</p>}
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'rgba(201,168,76,0.8)' }}>ITS ID (8 digits)</label>
              <input type="text" className="glass-input" placeholder="12345678"
                value={formData.its_id} onChange={e => setFormData(f => ({ ...f, its_id: e.target.value.replace(/\D/g, '').slice(0, 8) }))} required />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'rgba(201,168,76,0.8)' }}>Password</label>
              <input type="password" className="glass-input" placeholder="Min 6 characters"
                value={formData.password} onChange={e => setFormData(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <button type="submit" className="btn-gold" disabled={formLoading}>
              {formLoading ? 'Adding...' : 'Add User'}
            </button>
          </form>
        </Modal>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <Modal title={`Edit User: ${editUser.its_id}`} onClose={() => setEditUser(null)}>
          <form onSubmit={handleEditUser} className="space-y-4">
            {formError && <p className="text-xs text-center py-2 px-3 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>{formError}</p>}
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'rgba(201,168,76,0.8)' }}>ITS ID (8 digits)</label>
              <input type="text" className="glass-input"
                value={formData.its_id} onChange={e => setFormData(f => ({ ...f, its_id: e.target.value.replace(/\D/g, '').slice(0, 8) }))} />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'rgba(201,168,76,0.8)' }}>New Password <span style={{ color: 'rgba(245,239,224,0.3)' }}>(leave blank to keep)</span></label>
              <input type="password" className="glass-input" placeholder="New password..."
                value={formData.password} onChange={e => setFormData(f => ({ ...f, password: e.target.value }))} />
            </div>
            <p className="text-xs" style={{ color: 'rgba(245,239,224,0.35)' }}>
              Changing password will terminate active sessions.
            </p>
            <button type="submit" className="btn-gold" disabled={formLoading}>
              {formLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {deleteUser && (
        <Modal title="Delete User" onClose={() => setDeleteUser(null)}>
          <p className="text-sm mb-6" style={{ color: 'rgba(245,239,224,0.65)' }}>
            Are you sure you want to delete ITS ID <strong className="font-mono" style={{ color: '#f5efe0' }}>{deleteUser.its_id}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteUser(null)}
              className="flex-1 py-2.5 text-sm rounded-lg"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(245,239,224,0.6)' }}>
              Cancel
            </button>
            <button onClick={handleDelete} disabled={formLoading}
              className="flex-1 py-2.5 text-sm rounded-lg font-medium"
              style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
              {formLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}

      {/* Import Modal */}
      {importModal && (
        <Modal title="Import Users from CSV" onClose={() => { setImportModal(false); setImportResult(null) }}>
          <div className="space-y-4">
            <div className="p-4 rounded-lg text-xs" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)' }}>
              <p className="font-medium mb-2" style={{ color: '#c9a84c' }}>CSV Format Required:</p>
              <p className="font-mono" style={{ color: 'rgba(245,239,224,0.6)' }}>its_id,password</p>
              <p className="font-mono" style={{ color: 'rgba(245,239,224,0.6)' }}>12345678,password123</p>
              <p className="mt-2" style={{ color: 'rgba(245,239,224,0.4)' }}>
                Existing ITS IDs will be updated. Max 500 rows.
              </p>
            </div>

            <input ref={fileRef} type="file" accept=".csv" onChange={handleFileImport}
              className="block w-full text-xs"
              style={{ color: 'rgba(245,239,224,0.6)' }} />

            {formLoading && <p className="text-xs text-center" style={{ color: '#c9a84c' }}>Processing...</p>}

            {importResult && (
              <div className="p-4 rounded-lg text-xs space-y-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ color: '#34d399' }}>✓ {importResult.success} users imported successfully</p>
                {importResult.failed > 0 && (
                  <>
                    <p style={{ color: '#fca5a5' }}>✗ {importResult.failed} failed</p>
                    {importResult.errors.slice(0, 5).map((e, i) => (
                      <p key={i} style={{ color: 'rgba(252,165,165,0.6)' }}>• {e}</p>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
