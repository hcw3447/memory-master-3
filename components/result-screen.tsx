'use client'

import { useState } from 'react'
import { Repeat2, Target, Trophy, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SessionResult } from '@/components/quiz-screen'
import type { LeaderboardEntry } from '@/lib/storage'

export function ResultScreen({
  result,
  totalPoints,
  defaultName,
  onSubmit,
  onRestart,
  onLeaderboard,
}: {
  result: SessionResult
  totalPoints: number
  defaultName: string
  onSubmit: (name: string) => LeaderboardEntry[]
  onRestart: () => void
  onLeaderboard: () => void
}) {
  const [name, setName] = useState(defaultName)
  const [rank, setRank] = useState<number | null>(null)
  const accuracy = Math.round((result.correct / result.total) * 100)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = name.trim() || '익명 훈련생'
    const board = onSubmit(clean)
    const position = board.findIndex((entry) => entry.name.trim().toLowerCase() === clean.toLowerCase())
    setRank(position >= 0 ? position + 1 : null)
  }

  const stats = [
    { icon: Target, label: '정답률', value: `${accuracy}%` },
    { icon: Zap, label: '최고 연속', value: `${result.bestStreak}연속` },
    { icon: Repeat2, label: '복습 성공', value: `${result.reviewHits}개` },
  ]

  return (
    <div className="mx-auto w-full max-w-md px-5 pb-16 pt-10">
      <div className="animate-rise rounded-2xl border border-border bg-card p-7 text-center">
        <p className="font-display text-xs tracking-[0.2em] text-primary uppercase">Session Complete</p>
        <p className="font-display mt-4 text-5xl font-bold text-primary">
          {result.score.toLocaleString()}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">이번 세션 획득 포인트</p>

        <p className="mt-3 text-sm">
          {result.correct} / {result.total} 정답 · 누적{' '}
          <span className="font-display text-primary">{totalPoints.toLocaleString()} P</span>
        </p>

        <dl className="mt-6 grid grid-cols-3 gap-2">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl bg-secondary/50 px-2 py-3">
              <Icon className="mx-auto size-4 text-accent" aria-hidden="true" />
              <dt className="mt-1.5 text-xs text-muted-foreground">{label}</dt>
              <dd className="font-display mt-0.5 text-sm">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {rank === null ? (
        <form onSubmit={submit} className="mt-4 rounded-2xl border border-border bg-card p-5">
          <label htmlFor="player-name" className="text-sm font-medium">
            리더보드에 기록 남기기
          </label>
          <p className="mt-1 text-xs text-muted-foreground">최고 점수만 기기에 저장됩니다.</p>
          <div className="mt-3 flex gap-2">
            <input
              id="player-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={12}
              placeholder="닉네임"
              className="h-12 min-w-0 flex-1 rounded-xl border border-input bg-background px-4 text-base outline-none focus-visible:border-primary"
            />
            <Button type="submit" className="h-12 px-5 text-base">
              등록
            </Button>
          </div>
        </form>
      ) : (
        <div className="animate-pop-in mt-4 flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-5">
          <Trophy className="size-5 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-sm leading-relaxed">
            리더보드 <span className="font-display font-bold text-primary">{rank}위</span>에 기록되었습니다.
          </p>
        </div>
      )}

      <div className="mt-4 flex gap-3">
        <Button variant="outline" className="h-12 flex-1 text-base" onClick={onLeaderboard}>
          리더보드
        </Button>
        <Button className="h-12 flex-1 text-base" onClick={onRestart}>
          다시 도전
        </Button>
      </div>
    </div>
  )
}
