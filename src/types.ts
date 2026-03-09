export interface ShoppingItem {
  id: string
  created_at: string
  name: string
  quantity: string
  note: string | null
  category: string
  is_completed: boolean
  completed_at: string | null
}
