export default function TestPage() {
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f9fafb'}}>
      <div style={{background:'white',padding:24,borderRadius:12,boxShadow:'0 2px 12px rgba(0,0,0,0.08)'}}>
        <h1 style={{fontSize:18,fontWeight:600,marginBottom:8}}>Test Page</h1>
        <p style={{fontSize:14,color:'#374151'}}>If you can see this, rendering works. If other pages are blank, it is likely an auth/env or data-fetching error.</p>
      </div>
    </div>
  )
}
