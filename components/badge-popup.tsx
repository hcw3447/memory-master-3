'use client'

import { useEffect } from 'react'
import { Award, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Confetti } from '@/components/confetti'

export function BadgePopup({
  open,
  points,
  onClose,
}: {
  open: boolean
  points: number
  onClose: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <Confetti active={open} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="badge-title"
        className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 p-5 backdrop-blur-sm"
      >
        <div className="animate-pop-in relative w-full max-w-sm overflow-hidden rounded-2xl border border-primary/40 bg-card p-7 text-center shadow-2xl">
          <div
            className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="팝업 닫기"
          >
            <X className="size-4" />
          </button>

          <div className="animate-pulse-ring relative mx-auto flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Award className="size-10" aria-hidden="true" />
          </div>

          <p className="font-display mt-5 text-xs tracking-[0.2em] text-primary uppercase">
            Badge Unlocked
          </p>
          <h2 id="badge-title" className="font-display mt-2 text-2xl font-bold text-balance">
            두뇌 훈련 마스터
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
            누적 {points.toLocaleString()} 포인트 달성! 간격 반복 복습을 꾸준히 이어가며 단어를 장기기억으로
            옮기고 있어요.
          </p>

          <Button autoFocus onClick={onClose} className="mt-6 h-12 w-full text-base">
            훈련 계속하기
          </Button>
        </div>
      </div>
    </>
  )
}
