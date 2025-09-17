'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const callbackUrl = '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn('credentials', { email, password, redirect: true, callbackUrl })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f9fafb',padding:16}}>
      <div style={{width:360,background:'white',padding:24,borderRadius:12,boxShadow:'0 2px 12px rgba(0,0,0,0.08)'}}>
        <h1 style={{fontSize:18,fontWeight:600,marginBottom:16}}>Sign in to CitiWise</h1>
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:12}}>
            <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
              style={{width:'100%',padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:8}} />
          </div>
          <div style={{marginBottom:16}}>
            <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required
              style={{width:'100%',padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:8}} />
          </div>
          <button type="submit" disabled={loading}
            style={{width:'100%',padding:'10px 12px',borderRadius:8,background:'#2563eb',color:'white',border:'none'}}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <div style={{fontSize:12,color:'#6b7280',marginTop:8}}>
            Demo creds env are optional; in open demo mode any email/password will work.
          </div>
        </form>
      </div>
    </div>
  )
}
