'use client'

import { REVIEW_INTERVALS_DAYS } from '@/lib/srs'

const W = 320
const H = 130
const DAYS = 31

function y(retention: number) {
  return H - 10 - retention * (H - 26)
}
function x(day: number) {
  return 6 + (day / DAYS) * (W - 12)
}

function decayPath(startDay: number, endDay: number, strength: number, from = 1) {
  const points: string[] = []
  for (let d = startDay; d <= endDay; d += 0.5) {
    const r = from * Math.exp(-(d - startDay) / strength)
    points.push(`${d === startDay ? 'M' : 'L'}${x(d).toFixed(1)} ${y(r).toFixed(1)}`)
  }
  return points.join(' ')
}

/** 복습이 없을 때(점선)와 주기 복습을 넣었을 때(실선)의 기억 유지율 비교 그래프 */
export function ForgettingCurve() {
  const noReview = decayPath(0, DAYS, 2.2)

  const marks = REVIEW_INTERVALS_DAYS.filter((d) => d > 0)
  const segments: { d: string; day: number }[] = []
  let cursor = 0
  marks.forEach((day, i) => {
    const strength = 2.2 * Math.pow(1.9, i)
    segments.push({ d: decayPath(cursor, day, strength), day })
    cursor = day
  })
  segments.push({ d: decayPath(cursor, DAYS, 2.2 * Math.pow(1.9, marks.length)), day: DAYS })

  return (
    <figure className="rounded-xl border border-border bg-card/60 p-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="복습 주기에 따른 기억 유지율 비교 그래프">
        <line x1={6} y1={y(0)} x2={W - 6} y2={y(0)} stroke="currentColor" className="text-border" strokeWidth={1} />
        <line x1={6} y1={y(1)} x2={W - 6} y2={y(1)} stroke="currentColor" className="text-border" strokeWidth={1} strokeDasharray="2 4" />
        <path d={noReview} fill="none" stroke="currentColor" className="text-muted-foreground" strokeWidth={1.5} strokeDasharray="4 4" />
        {segments.map((s, i) => (
          <path key={i} d={s.d} fill="none" stroke="currentColor" className="text-primary" strokeWidth={2.5} strokeLinecap="round" />
        ))}
        {marks.map((day) => (
          <circle key={day} cx={x(day)} cy={y(1)} r={3.5} fill="currentColor" className="text-primary" />
        ))}
      </svg>
      <figcaption className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-primary" aria-hidden="true" />
          주기 복습 적용
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-muted-foreground/70" aria-hidden="true" />
          복습 없음
        </span>
        <span>복습 시점 · 1 · 3 · 7 · 14 · 30일</span>
      </figcaption>
    </figure>
  )
}
