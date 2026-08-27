'use client'

import { Crown, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { LeaderboardEntry } from '@/lib/storage'

const MEDALS = ['text-primary', 'text-accent', 'text-muted-foreground']

export function LeaderboardScreen({
  entries,
  onStart,
}: {
  entries: LeaderboardEntry[]
  onStart: () => void
}) {
  return (
    <div className="mx-auto w-full max-w-md px-5 pb-28 pt-6">
      <header>
        <p className="font-display text-xs tracking-[0.18em] text-primary uppercase">Leaderboard</p>
        <h1 className="font-display mt-1 text-xl font-bold">상위 10위 훈련생</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          세션 최고 점수 기준 · 이 기기에 저장된 기록입니다.
        </p>
      </header>

      {entries.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
          <Trophy className="mx-auto size-7 text-muted-foreground" aria-hidden="true" />
          <p className="mt-4 text-sm text-muted-foreground text-pretty">
            아직 기록이 없습니다. 첫 세션을 완료하고 1위를 차지하세요.
          </p>
          <Button className="mt-5 h-11 px-6" onClick={onStart}>
            퀴즈 시작
          </Button>
        </div>
      ) : (
        <ol className="mt-6 grid gap-2">
          {entries.map((entry, i) => (
            <li
              key={entry.id}
              className={[
                'flex items-center gap-4 rounded-xl border px-4 py-3.5',
                i === 0 ? 'border-primary/45 bg-primary/10' : 'border-border bg-card',
              ].join(' ')}
            >
              <span
                className={`font-display w-7 shrink-0 text-center text-lg font-bold ${
                  MEDALS[i] ?? 'text-muted-foreground'
                }`}
              >
                {i === 0 ? <Crown className="mx-auto size-5" aria-label="1위" /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{entry.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  정답률 {entry.accuracy}% · {entry.bestStreak}연속 · {entry.date}
                </p>
              </div>
              <p className="font-display shrink-0 text-lg font-bold text-primary">
                {entry.score.toLocaleString()}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
