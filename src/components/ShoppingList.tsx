import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Trash2, Plus, ShoppingCart } from 'lucide-react'
import { getCategoryStyle } from '../lib/categories'
import { QUICK_ADD_ITEMS } from '../lib/itemDictionary'
import type { ShoppingItem } from '../types'

interface ShoppingListProps {
  items: ShoppingItem[]
  loading: boolean
  onAdd: (name: string, quantity: string, note: string, category?: string) => void
  onToggle: (id: string, is_completed: boolean) => void
  onDelete: (id: string) => void
  onClearCompleted?: () => void
  isShoppingMode?: boolean
}

export function ShoppingList({ items, loading, onAdd, onToggle, onDelete, onClearCompleted, isShoppingMode }: ShoppingListProps) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [note, setNote] = useState('')
  const [showExtra, setShowExtra] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed, quantity.trim() || '1', note.trim())
    setName('')
    setQuantity('1')
    setNote('')
  }

  const pending = items.filter((i) => !i.is_completed)
  const completed = items.filter((i) => i.is_completed)

  const groupByCategory = (list: ShoppingItem[]) => {
    const groups: Record<string, ShoppingItem[]> = {}
    for (const item of list) {
      const cat = item.category || 'General'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(item)
    }
    return groups
  }

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <p className="text-gray-900 text-lg">טוען רשימה...</p>
      </div>
    )
  }

  return (
    <div className={`space-y-5 transition-all duration-300 ${isShoppingMode ? 'text-[1.5rem]' : ''}`}>
      {/* Quick Add — פריטים נפוצים */}
      <div className="glass-card rounded-2xl p-3">
        <p className="text-xs text-gray-600 mb-2 px-1">הוספה מהירה</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_ADD_ITEMS.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => onAdd(label, '1', '')}
              className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-medium border border-gray-200 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* טופס הוספה */}
      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-4 sm:p-5">
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="מה להוסיף לרשימה?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="glass-input flex-1 min-w-0 rounded-xl px-4 py-3.5 text-lg"
          />
          <button
            type="submit"
            className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white font-semibold rounded-xl px-5 py-3.5 min-h-[52px] transition-colors border border-gray-800"
          >
            <Plus size={22} strokeWidth={2.5} />
            הוסף
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <button
            type="button"
            onClick={() => setShowExtra(!showExtra)}
            className="text-sm text-gray-700 hover:text-gray-900 underline-offset-2 hover:underline"
          >
            {showExtra ? 'הסתר כמות והערה' : '+ כמות והערה'}
          </button>
          {showExtra && (
            <>
              <input
                type="text"
                placeholder="כמות"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="glass-input w-20 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="הערה"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="glass-input flex-1 min-w-[120px] rounded-lg px-3 py-2 text-sm"
              />
            </>
          )}
        </div>
      </form>

      {items.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <p className="text-gray-800 text-lg">אין עדיין פריטים. הוסף פריט למעלה.</p>
        </div>
      ) : (
        <>
          {Object.entries(groupByCategory(pending)).map(([category, list]) => {
            const { label } = getCategoryStyle(category)
            return (
              <div
                key={category}
                className="glass-card rounded-2xl overflow-hidden"
              >
                <div className="px-4 py-2.5 bg-gray-100/90">
                  <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
                </div>
                <ul className="divide-y divide-gray-200">
                  <AnimatePresence initial={false}>
                    {list.map((item) => (
                      <motion.li
                        key={item.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ItemRow
                          item={item}
                          onToggle={onToggle}
                          onDelete={onDelete}
                          isShoppingMode={isShoppingMode}
                        />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
            )
          })}
          {completed.length > 0 && (
            <div className="glass-card rounded-2xl overflow-hidden opacity-95">
              <div className="px-4 py-2.5 bg-gray-100/90 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-900">הושלמו</h3>
                {onClearCompleted && (
                  <button
                    type="button"
                    onClick={onClearCompleted}
                    className="flex items-center gap-1 text-xs text-gray-700 hover:text-gray-900"
                  >
                    <ShoppingCart size={14} />
                    נקה הושלמו
                  </button>
                )}
              </div>
              <ul className="divide-y divide-gray-200">
                <AnimatePresence initial={false}>
                  {completed.map((item) => (
                    <motion.li
                      key={item.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ItemRow
                        item={item}
                        onToggle={onToggle}
                        onDelete={onDelete}
                        isShoppingMode={isShoppingMode}
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ItemRow({
  item,
  onToggle,
  onDelete,
  isShoppingMode,
}: {
  item: ShoppingItem
  onToggle: (id: string, is_completed: boolean) => void
  onDelete: (id: string) => void
  isShoppingMode?: boolean
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onToggle(item.id, !item.is_completed)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(item.id, !item.is_completed) } }}
      className="flex items-center gap-3 px-4 py-3.5 group hover:bg-gray-50 transition-colors cursor-pointer"
      aria-label={item.is_completed ? 'בטל סימון' : 'סמן כהושלם'}
    >
      <div
        className="flex-shrink-0 w-9 h-9 rounded-full border-2 border-gray-400 flex items-center justify-center group-hover:border-gray-600 group-hover:bg-gray-100 transition-colors"
        aria-hidden
      >
        {item.is_completed && <Check className="text-green-600" size={20} strokeWidth={2.5} />}
      </div>
      <div className="flex-1 min-w-0">
        <span
          className={`${isShoppingMode ? 'text-[1.1em]' : 'text-lg'} ${item.is_completed ? 'line-through text-gray-500' : 'text-gray-900'}`}
        >
          {item.name}
          {item.quantity !== '1' && (
            <span className="text-gray-700 mr-1"> × {item.quantity}</span>
          )}
        </span>
        {item.note && (
          <span className="block text-sm text-gray-600 truncate mt-0.5">{item.note}</span>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
        className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        aria-label="מחק"
      >
        <Trash2 size={20} />
      </button>
    </div>
  )
}
