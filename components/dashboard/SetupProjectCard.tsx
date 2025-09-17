'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function SetupProjectCard() {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    organizationName: 'Citiwise Org',
    ownerEmail: '',
    ownerName: '',
    projectName: '',
    city: '',
    targetAmount: 50000000,
    targetDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  })

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Setup failed')
      }
      if (typeof window !== 'undefined') window.location.reload()
    } catch (err: any) {
      alert(err?.message || 'Setup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Initialize Your Project</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Owner Email</label>
              <input
                type="email"
                name="ownerEmail"
                required
                value={form.ownerEmail}
                onChange={onChange}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Owner Name</label>
              <input
                type="text"
                name="ownerName"
                value={form.ownerName}
                onChange={onChange}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Your Name"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Project Name</label>
              <input
                type="text"
                name="projectName"
                required
                value={form.projectName}
                onChange={onChange}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Sunrise Residency"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">City</label>
              <input
                type="text"
                name="city"
                required
                value={form.city}
                onChange={onChange}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Pune"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Target Amount (₹)</label>
              <input
                type="number"
                name="targetAmount"
                required
                value={form.targetAmount}
                onChange={onChange}
                className="w-full border rounded px-3 py-2 text-sm"
                min={0}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Target Date</label>
              <input
                type="date"
                name="targetDate"
                required
                value={form.targetDate}
                onChange={onChange}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Setting up...' : 'Create Project'}
            </Button>
          </div>
        </form>
        <p className="text-xs text-gray-500 mt-3">
          This will create your organization, an OWNER user, a project with a cash target, and seed a small set of units.
        </p>
      </CardContent>
    </Card>
  )
}
