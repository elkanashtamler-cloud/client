import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface AppState {
  is_shopping: boolean
  shopper_name: string | null
}

export function useAppState() {
  const [state, setState] = useState<AppState>({ is_shopping: false, shopper_name: null })
  const [loading, setLoading] = useState(true)

  const fetchState = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase.from('app_state').select('is_shopping, shopper_name').eq('id', 1).single()
    if (data) setState({ is_shopping: data.is_shopping ?? false, shopper_name: data.shopper_name ?? null })
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchState()
  }, [fetchState])

  useEffect(() => {
    const client = supabase
    if (!client) return
    const channel = client
      .channel('app_state-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_state' }, () => fetchState())
      .subscribe()
    return () => {
      if (client) client.removeChannel(channel)
    }
  }, [fetchState])

  const setShoppingMode = useCallback(async (on: boolean, shopperName: string | null) => {
    if (!supabase) return
    await supabase.from('app_state').update({ is_shopping: on, shopper_name: shopperName }).eq('id', 1)
    await fetchState()
  }, [fetchState])

  return { ...state, loading, setShoppingMode, refetch: fetchState }
}