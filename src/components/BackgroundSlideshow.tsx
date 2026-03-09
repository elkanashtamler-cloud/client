import { useEffect, useRef, useState } from 'react'

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']

function loadImage(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = src
  })
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function getInitialList(): string[] {
  if (typeof window === 'undefined') return []
  const w = window as Window & { __BG_LIST__?: string[] }
  if (Array.isArray(w.__BG_LIST__) && w.__BG_LIST__.length > 0) {
    return w.__BG_LIST__.filter((f) =>
      IMAGE_EXTENSIONS.some((ext) => String(f).toLowerCase().endsWith(ext))
    )
  }
  return []
}

/** רשימת תמונות — מההתחלה מ-list.js, אחר כך מחזקים מ-list.json */
export function useBackgroundImages(): string[] {
  const [images, setImages] = useState<string[]>(getInitialList)

  useEffect(() => {
    const fromWindow = getInitialList()
    if (fromWindow.length > 0) return
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/backgrounds/list.json')
        if (!res.ok) return
        const data = await res.json()
        if (!Array.isArray(data) || data.length === 0) return
        const list = data.filter((f: string) =>
          IMAGE_EXTENSIONS.some((ext) => String(f).toLowerCase().endsWith(ext))
        )
        if (!cancelled && list.length > 0) setImages(shuffle(list))
      } catch {
        const tryNames = ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg', '8.jpg', '9.jpg', '10.jpg',
          '1.png', '2.png', '3.png', '4.png', '5.png', '6.png', '7.png', '8.png', '9.png', '10.png']
        const found: string[] = []
        for (const name of tryNames) {
          if (cancelled) return
          const ok = await loadImage(`/backgrounds/${name}`)
          if (ok) found.push(name)
        }
        if (!cancelled && found.length > 0) setImages(shuffle(found))
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return images
}

const SLIDE_INTERVAL_MS = 12000

/** שני "slots" — מעדכנים רק את המוסתר לפני מעבר, כך שלא יהיה פלאש של התמונה הבאה */
export function BackgroundSlideshow({ imageUrls }: { imageUrls: string[] }) {
  const n = imageUrls.length
  const [visibleSlot, setVisibleSlot] = useState(0)
  const [slot0Index, setSlot0Index] = useState(0)
  const [slot1Index, setSlot1Index] = useState(n > 1 ? 1 : 0)
  const ref = useRef({ visibleSlot, slot0Index, slot1Index })
  ref.current = { visibleSlot, slot0Index, slot1Index }

  useEffect(() => {
    if (n <= 1) return
    const id = setInterval(() => {
      const { visibleSlot: v, slot0Index: s0, slot1Index: s1 } = ref.current
      const currentShowing = v === 0 ? s0 : s1
      const nextIndex = (currentShowing + 1) % n
      const hiddenSlot = v === 0 ? 1 : 0
      if (hiddenSlot === 0) setSlot0Index(nextIndex)
      else setSlot1Index(nextIndex)
      setVisibleSlot(hiddenSlot)
    }, SLIDE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [n])

  if (n === 0) return null

  const img0 = imageUrls[slot0Index]
  const img1 = imageUrls[slot1Index]

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0 bg-contain bg-center bg-no-repeat transition-opacity duration-500"
        style={{
          backgroundImage: `url(/backgrounds/${encodeURIComponent(img0)})`,
          opacity: visibleSlot === 0 ? 1 : 0,
        }}
      />
      {n > 1 && (
        <div
          className="absolute inset-0 bg-contain bg-center bg-no-repeat transition-opacity duration-500"
          style={{
            backgroundImage: `url(/backgrounds/${encodeURIComponent(img1)})`,
            opacity: visibleSlot === 1 ? 1 : 0,
          }}
        />
      )}
      <div className="absolute inset-0 bg-black/10" aria-hidden />
    </div>
  )
}
