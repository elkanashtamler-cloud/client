// קטגוריות לפי המפרט — קבוצות ויצוג ויזואלי
export const CATEGORY_CONFIG: Record<string, { label: string; bg: string }> = {
  General: { label: 'כללי', bg: 'bg-gray-100/90' },
  'ירקות ופירות': { label: 'ירקות ופירות', bg: 'bg-green-100/90' },
  'מוצרי חלב': { label: 'מוצרי חלב', bg: 'bg-blue-100/90' },
  'בשר ועוף': { label: 'בשר ועוף', bg: 'bg-red-100/90' },
  'מאפיה': { label: 'מאפיה', bg: 'bg-yellow-100/90' },
  'מזון יבש': { label: 'מזון יבש', bg: 'bg-orange-100/90' },
  'ניקיון ומשק בית': { label: 'ניקיון ומשק בית', bg: 'bg-purple-100/90' },
}

export function getCategoryStyle(category: string): { label: string; bg: string } {
  return CATEGORY_CONFIG[category] ?? { label: category, bg: 'bg-gray-100/90' }
}
