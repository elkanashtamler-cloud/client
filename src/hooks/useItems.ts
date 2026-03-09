import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getCategoryFromDictionary } from '../lib/itemDictionary'
import type { ShoppingItem } from '../types'

export function useItems() {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchItems = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      return
    }
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('is_completed', { ascending: true })
      .order('created_at', { ascending: true })
    if (!error) setItems((data as ShoppingItem[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  useEffect(() => {
    if (!supabase) return
    const channel = supabase
      .channel('items-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => {
        fetchItems()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchItems])

  const resolveCategory = useCallback(async (itemName: string): Promise<string> => {
    if (!supabase) return 'General'
    const { data } = await supabase.from('product_map').select('category').eq('name', itemName.trim()).maybeSingle()
    if (data?.category) return data.category
    return getCategoryFromDictionary(itemName)
  }, [])

  const addItem = useCallback(async (name: string, quantity = '1', note = '', category?: string) => {
    if (!supabase) return
    const resolved = category ?? await resolveCategory(name)
    await supabase.from('items').insert({ name: name.trim(), quantity: quantity || '1', note: note || null, category: resolved })
    await supabase.from('product_map').upsert({ name: name.trim(), category: resolved, last_used: new Date().toISOString() }, { onConflict: 'name' })
    await fetchItems()
  }, [fetchItems, resolveCategory])

  const toggleComplete = async (id: string, is_completed: boolean) => {
    if (!supabase) return
    await supabase
      .from('items')
      .update({ is_completed, completed_at: is_completed ? new Date().toISOString() : null })
      .eq('id', id)
    await fetchItems()
  }

  const deleteItem = async (id: string) => {
    if (!supabase) return
    await supabase.from('items').delete().eq('id', id)
    await fetchItems()
  }

  const clearCompleted = async () => {
    if (!supabase) return
    await supabase.from('items').delete().eq('is_completed', true)
    await fetchItems()
  }

  return { items, loading, addItem, toggleComplete, deleteItem, clearCompleted, refetch: fetchItems }
}
