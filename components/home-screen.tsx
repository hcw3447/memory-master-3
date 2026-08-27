'use client'

import { Award, BookOpen, Brain, Play, Trophy, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ForgettingCurve } from '@/components/forgetting-curve'
import { BADGE_THRESHOLD } from '@/lib/storage'

const R = 52
const C = 2 * Math.PI * R

export function HomeScreen({
  totalPoints,
  badgeEarned,
  dueCount,
  masteredCount,
  totalWords,
  topScore,
  onStartQuiz,
  onStudy,
  onLeaderboard,
}: {
  totalPoints: number
  badgeEarned: boolean
  dueCount: number
  masteredCount: number
  totalWords: number
  topScore: number
  onStartQuiz: () => void
  onStudy: () => void
  onLeaderboard: () => void
}) {
  const ratio = Math.min(1, totalPoints / BADGE_THRESHOLD)

  return (
    <div className="mx-auto w-full max-w-md px-5 pb-28 pt-8">
      <header>
        <p className="font-display text-xs tracking-[0.22em] text-primary uppercase">Neurolexicon</p>
        <h1 className="font-display mt-2 text-3xl leading-tight font-bold text-balance">
          망각을 계산하는
          <br />
          영단어 훈련소
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
          에빙하우스 망각곡선 주기로 복습 문제를 재출제하고, 뜻·원어민 발음·연상 이미지를 한 번에 제시해
          두 개의 기억 경로에 새깁니다.
        </p>
      </header>

      {/* 시그니처 요소: 배지까지의 누적 포인트 링 */}
      <section className="mt-7 flex items-center gap-6 rounded-2xl border border-border bg-card p-6">
        <div className="relative shrink-0">
          <svg width={124} height={124} viewBox="0 0 124 124" role="img" aria-label={`누적 ${totalPoints} 포인트, 배지까지 ${Math.round(ratio * 100)}퍼센트 진행`}>
            <circle cx={62} cy={62} r={R} fill="none" stroke="currentColor" className="text-secondary" strokeWidth={8} />
            <circle
              cx={62}
              cy={62}
              r={R}
              fill="none"
              stroke="currentColor"
              className="text-primary transition-[stroke-dashoffset] duration-700"
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - ratio)}
              transform="rotate(-90 62 62)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-2xl font-bold">{totalPoints.toLocaleString()}</span>
            <span className="text-[0.7rem] text-muted-foreground">누적 포인트</span>
          </div>
        </div>
        <div className="min-w-0">
          {badgeEarned ? (
            <p className="font-display inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-xs text-primary">
              <Award className="size-3.5" aria-hidden="true" /> 두뇌 훈련 마스터
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              배지까지 {(BADGE_THRESHOLD - totalPoints).toLocaleString()} P
            </p>
          )}
          <p className="mt-2 text-sm leading-relaxed">
            <span className="font-display text-primary">{dueCount}</span>개 단어가 복습 시점에 도달했고,{' '}
            <span className="font-display text-primary">{masteredCount}</span>/{totalWords}개가 장기기억
            단계입니다.
          </p>
          {topScore > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              내 최고 점수 {topScore.toLocaleString()} P
            </p>
          )}
        </div>
      </section>

      <div className="mt-4 grid gap-2.5">
        <Button className="h-14 w-full text-base" onClick={onStartQuiz}>
          <Play className="size-4" aria-hidden="true" />
          {dueCount > 0 ? `복습 퀴즈 시작 (${dueCount}개 대기)` : '훈련 퀴즈 시작'}
        </Button>
        <div className="flex gap-2.5">
          <Button variant="outline" className="h-12 flex-1 text-base" onClick={onStudy}>
            <BookOpen className="size-4" aria-hidden="true" /> 단어 카드
          </Button>
          <Button variant="outline" className="h-12 flex-1 text-base" onClick={onLeaderboard}>
            <Trophy className="size-4" aria-hidden="true" /> 리더보드
          </Button>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-sm tracking-wide text-muted-foreground uppercase">
          Forgetting Curve
        </h2>
        <div className="mt-3">
          <ForgettingCurve />
        </div>
      </section>

      <section className="mt-8 grid gap-2.5">
        <h2 className="sr-only">학습 원리</h2>
        <article className="flex gap-3.5 rounded-xl border border-border bg-card p-5">
          <Brain className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h3 className="font-medium">간격 반복</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              맞힌 단어는 1일 → 3일 → 7일 → 14일 → 30일 주기로 복습 큐에 자동 재등록됩니다. 틀린 단어는
              같은 세션 안에서 다시 출제됩니다.
            </p>
          </div>
        </article>
        <article className="flex gap-3.5 rounded-xl border border-border bg-card p-5">
          <Volume2 className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
          <div>
            <h3 className="font-medium">이중 부호화</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              단어를 만날 때마다 뜻(언어 경로)과 연상 이미지(시각 경로)가 함께 제시되고, 기기 내장 TTS가
              미국 원어민 발음으로 읽어 줍니다.
            </p>
          </div>
        </article>
      </section>
    </div>
  )
}
