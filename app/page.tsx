import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-blue-600 mb-4">
            <span className="text-white font-bold">CW</span>
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Welcome to CitiWise</h1>
          <p className="text-gray-600 mb-6">AI-powered real estate sales automation. Manage leads, create personalized deal pages, and hit your cash targets.</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/login" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Login</Link>
            <Link href="/dashboard" className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Go to Dashboard</Link>
          </div>
          <p className="text-xs text-gray-500 mt-3">Dashboard requires sign-in. Use your demo credentials.</p>
        </div>
      </div>
    </div>
  )
}
