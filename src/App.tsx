import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { useItems } from './hooks/useItems'
import { useAppState } from './hooks/useAppState'
import { ShoppingList } from './components/ShoppingList'

export default function App() {
  const [session, setSession] = useState<{ email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const { items, loading: itemsLoading, addItem, toggleComplete, deleteItem, clearCompleted } = useItems()
  const { is_shopping, shopper_name, setShoppingMode } = useAppState()

  useEffect(() => {
    if (!is_shopping) return
    let lock: { release: () => Promise<void> } | null = null
    const req = async () => {
      const wakeLock = (navigator as { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock
      if (wakeLock) {
        try {
          lock = await wakeLock.request('screen')
        } catch {}
      }
    }
    req()
    return () => { lock?.release?.() }
  }, [is_shopping])

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s?.user ? { email: s.user.email ?? undefined } : null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s?.user ? { email: s.user.email ?? undefined } : null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!supabase) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-gray-800 text-white" dir="rtl">
        <h1 className="text-xl font-bold text-red-300">חסר קובץ הגדרות</h1>
        <p className="text-center max-w-md text-gray-300">
          צור קובץ <strong>.env</strong> בתיקיית <strong>client</strong> עם שני השורות.
        </p>
        <pre className="bg-black/40 p-4 rounded-lg text-sm w-full max-w-md overflow-x-auto">
{`VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...`}
        </pre>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen app-bg flex items-center justify-center">
        <div className="glass-card rounded-2xl px-8 py-6 text-gray-900 relative z-10">
          <p className="text-lg font-medium">טוען...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen app-bg flex flex-col items-center justify-center p-4 relative">
        <div className="glass-card rounded-3xl p-8 w-full max-w-md shadow-2xl relative z-10">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">רשימת קניות</h1>
          <p className="text-gray-600 text-center text-sm mb-6">התחבר כדי להמשיך</p>
          <LoginForm />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="app-bg-fixed" aria-hidden />
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="flex-shrink-0 max-w-2xl w-full mx-auto px-4 pt-6 pb-3">
          {shopper_name && is_shopping && (
            <div className="mb-3 py-2 px-4 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-center text-sm">
              {shopper_name} בסופרמרקט
            </div>
          )}
          <header className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h1 className="text-2xl font-bold text-gray-900">רשימת קניות</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-2 text-gray-800 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={is_shopping}
                  onChange={async (e) => {
                    const on = e.target.checked
                    const name = session?.email ? session.email.split('@')[0] : null
                    await setShoppingMode(on, name)
                  }}
                  className="rounded"
                />
                מצב סופרמרקט
              </label>
              <span className="text-sm text-gray-700 truncate max-w-[140px]">{session?.email}</span>
              <button
                type="button"
                onClick={() => supabase!.auth.signOut()}
                className="text-sm text-gray-700 hover:text-gray-900 underline underline-offset-2"
              >
                התנתק
              </button>
            </div>
          </header>
        </div>
        <div className="flex-1 min-h-0 max-w-2xl w-full mx-auto px-4 pb-12 overflow-y-auto">
          <ShoppingList
            items={items}
            loading={itemsLoading}
            onAdd={addItem}
            onToggle={toggleComplete}
            onDelete={deleteItem}
            onClearCompleted={clearCompleted}
            isShoppingMode={is_shopping}
          />
        </div>
      </div>
    </>
  )
}

function translateAuthError(message: string): string {
  if (message.includes('Invalid login credentials') || message.includes('invalid')) {
    return 'אימייל או סיסמה לא נכונים.'
  }
  if (message.includes('Email not confirmed')) {
    return 'האימייל טרם אושר.'
  }
  if (message.includes('User not found')) {
    return 'משתמש לא נמצא.'
  }
  return message
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { error: err } = await supabase!.auth.signInWithPassword({ email, password })
      if (err) {
        setError(translateAuthError(err.message))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה לא צפויה')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="email"
        placeholder="אימייל"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="glass-input rounded-xl px-4 py-3.5 w-full"
        required
        autoComplete="email"
      />
      <input
        type="password"
        placeholder="סיסמה"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="glass-input rounded-xl px-4 py-3.5 w-full"
        required
        autoComplete="current-password"
      />
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-900 rounded-xl p-3 text-sm">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-gray-900 hover:bg-black text-white font-semibold rounded-xl px-4 py-3.5 transition-colors disabled:opacity-60 border border-gray-800"
      >
        {submitting ? 'מתחבר...' : 'התחבר'}
      </button>
    </form>
  )
}
