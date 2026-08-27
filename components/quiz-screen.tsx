'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Repeat2, Volume2, X, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSpeech } from '@/hooks/use-speech'
import { WORDS, WORD_MAP } from '@/lib/words'
import {
  IN_SESSION_GAPS,
  MAX_STAGE,
  REVIEW_INTERVALS_DAYS,
  buildQueue,
  type ProgressMap,
} from '@/lib/srs'

export const TOTAL_QUESTIONS = 12
const SEED_WORDS = 8
const TIME_LIMIT = 20

export type SessionResult = {
  score: number
  correct: number
  total: number
  bestStreak: number
  reviewHits: number
}

/** id + 회차로 고정된 순서를 만드는 간단한 결정적 셔플 (렌더마다 보기 순서가 바뀌지 않도록) */
function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const arr = [...items]
  for (let i = arr.length - 1 > 0 ? arr.length - 1 : 0; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    const j = Math.abs(h) % (i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function QuizScreen({
  progress,
  onAnswer,
  onFinish,
}: {
  progress: ProgressMap
  onAnswer: (id: string, isCorrect: boolean, gainedPoints: number) => void
  onFinish: (result: SessionResult) => void
}) {
  const { speak } = useSpeech()

  const pool = useMemo(() => buildQueue(WORDS.map((w) => w.id), progress), [])
  const poolCursor = useRef(SEED_WORDS)
  const [queue, setQueue] = useState<string[]>(() => pool.slice(0, SEED_WORDS))
  const [stages, setStages] = useState<Record<string, number>>(() =>
    Object.fromEntries(WORDS.map((w) => [w.id, progress[w.id]?.stage ?? 0])),
  )

  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<'question' | 'feedback'>('question')
  const [picked, setPicked] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)

  const [score, setScore] = useState(0)
  const [gained, setGained] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [reviewHits, setReviewHits] = useState(0)

  const currentId = queue[index] ?? queue[queue.length - 1]
  const word = WORD_MAP[currentId]
  // 이미 출제된 적이 있으면 복습 문제. 큐의 "지나간" 구간만 보므로 답을 채점해도 값이 바뀌지 않는다.
  const isReview = useMemo(() => queue.slice(0, index).includes(currentId), [queue, index, currentId])
  const mode: 'en2ko' | 'ko2en' = isReview || index % 3 === 2 ? 'ko2en' : 'en2ko'

  const options = useMemo(() => {
    const distractors = seededShuffle(
      WORDS.filter((w) => w.id !== currentId),
      `${currentId}-${index}-d`,
    ).slice(0, 3)
    return seededShuffle([WORD_MAP[currentId], ...distractors], `${currentId}-${index}-o`)
  }, [currentId, index])

  // 문제가 열리면 원어민 발음을 자동 재생 (뜻을 맞히는 문제일 때)
  useEffect(() => {
    if (phase !== 'question' || mode !== 'en2ko') return
    const t = window.setTimeout(() => speak(word.word), 200)
    return () => window.clearTimeout(t)
  }, [word.word, phase, mode, speak])

  const answer = useCallback(
    (choiceId: string | null) => {
      if (phase === 'feedback') return
      const isCorrect = choiceId === currentId
      const prevStage = stages[currentId] ?? 0
      const nextStage = isCorrect ? Math.min(prevStage + 1, MAX_STAGE) : Math.max(prevStage - 1, 0)

      const speedBonus = timeLeft > TIME_LIMIT * 0.6 ? 5 : 0
      const streakBonus = Math.min(streak, 5) * 2
      const points = isCorrect ? 10 + streakBonus + speedBonus : 0

      setPicked(choiceId)
      setPhase('feedback')
      setGained(points)
      setScore((s) => s + points)
      setStages((s) => ({ ...s, [currentId]: nextStage }))

      if (isCorrect) {
        setCorrectCount((c) => c + 1)
        setStreak((v) => {
          const next = v + 1
          setBestStreak((b) => Math.max(b, next))
          return next
        })
        if (isReview) setReviewHits((r) => r + 1)
      } else {
        setStreak(0)
      }

      // 간격 반복: 정답 단어는 단계에 맞는 간격 뒤에, 오답 단어는 곧바로 다시 큐에 넣는다
      setQueue((q) => {
        if (q.length >= TOTAL_QUESTIONS) return q
        const gap = isCorrect ? IN_SESSION_GAPS[nextStage] : 2
        const insertAt = Math.min(index + gap, q.length)
        const next = [...q]
        next.splice(insertAt, 0, currentId)
        return next
      })

      speak(word.word)
      onAnswer(currentId, isCorrect, points)
    },
    [currentId, index, isReview, onAnswer, phase, speak, stages, streak, timeLeft, word.word],
  )

  // 제한 시간
  useEffect(() => {
    if (phase !== 'question') return
    setTimeLeft(TIME_LIMIT)
    const started = Date.now()
    const id = window.setInterval(() => {
      const left = TIME_LIMIT - (Date.now() - started) / 1000
      if (left <= 0) {
        window.clearInterval(id)
        setTimeLeft(0)
        answer(null)
      } else {
        setTimeLeft(left)
      }
    }, 100)
    return () => window.clearInterval(id)
  }, [index, phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const next = () => {
    const answered = index + 1
    if (answered >= TOTAL_QUESTIONS) {
      onFinish({
        score,
        correct: correctCount,
        total: TOTAL_QUESTIONS,
        bestStreak,
        reviewHits,
      })
      return
    }
    setQueue((q) => {
      if (answered < q.length || q.length >= TOTAL_QUESTIONS) return q
      const extra = pool[poolCursor.current % pool.length]
      poolCursor.current += 1
      return [...q, extra]
    })
    setPicked(null)
    setGained(0)
    setPhase('question')
    setIndex(answered)
  }

  const isCorrect = picked === currentId
  const nextIntervalDays = REVIEW_INTERVALS_DAYS[stages[currentId] ?? 0]

  return (
    <div className="mx-auto w-full max-w-md px-5 pb-28 pt-6">
      <header>
        <div className="flex items-center justify-between text-sm">
          <p className="font-display tracking-wide text-muted-foreground">
            <span className="text-foreground">{index + 1}</span> / {TOTAL_QUESTIONS}
          </p>
          <div className="flex items-center gap-3">
            {streak > 1 && (
              <span className="font-display inline-flex items-center gap-1 text-xs text-primary">
                <Zap className="size-3.5" aria-hidden="true" /> {streak} 연속
              </span>
            )}
            <span className="font-display text-primary">{score.toLocaleString()} P</span>
          </div>
        </div>

        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${((index + (phase === 'feedback' ? 1 : 0)) / TOTAL_QUESTIONS) * 100}%` }}
          />
        </div>
        <div className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-secondary/70">
          <div
            className={`h-full rounded-full ${timeLeft < 6 ? 'bg-destructive' : 'bg-accent'}`}
            style={{ width: `${(timeLeft / TIME_LIMIT) * 100}%` }}
          />
        </div>
        <p className="sr-only" aria-live="polite">
          남은 시간 {Math.ceil(timeLeft)}초
        </p>
      </header>

      <section
        key={`${currentId}-${index}`}
        className="animate-rise mt-6 rounded-2xl border border-border bg-card p-6 text-center"
      >
        {isReview && (
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-1 text-xs text-accent">
            <Repeat2 className="size-3.5" aria-hidden="true" /> 복습 문제
          </span>
        )}

        {mode === 'en2ko' ? (
          <>
            <button
              type="button"
              onClick={() => speak(word.word)}
              className="mx-auto flex items-center gap-2.5 transition-opacity active:opacity-70"
              aria-label={`${word.word} 발음 다시 듣기`}
            >
              <span className="font-display text-4xl font-bold tracking-tight">{word.word}</span>
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Volume2 className="size-4" aria-hidden="true" />
              </span>
            </button>
            <p className="font-display mt-1.5 text-sm text-accent">{word.phonetic}</p>
            <p className="mt-4 text-sm text-muted-foreground">알맞은 뜻을 고르세요</p>
          </>
        ) : (
          <>
            <p className="font-display text-xs tracking-[0.18em] text-accent uppercase">Recall</p>
            <p className="mt-3 text-2xl font-bold text-balance">{word.meaning}</p>
            <p className="mt-4 text-sm text-muted-foreground">알맞은 영어 단어를 고르세요</p>
          </>
        )}
      </section>

      <ul className="mt-4 grid gap-2.5">
        {options.map((opt) => {
          const isRight = opt.id === currentId
          const isPicked = picked === opt.id
          const revealed = phase === 'feedback'
          return (
            <li key={opt.id}>
              <button
                type="button"
                disabled={revealed}
                onClick={() => answer(opt.id)}
                className={[
                  'flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-4 text-left transition-colors disabled:opacity-100',
                  revealed && isRight
                    ? 'border-primary bg-primary/15'
                    : revealed && isPicked
                      ? 'border-destructive bg-destructive/10 animate-shake'
                      : 'border-border bg-card hover:border-primary/50',
                ].join(' ')}
              >
                <span className={mode === 'en2ko' ? 'text-base' : 'font-display text-lg'}>
                  {mode === 'en2ko' ? opt.meaning : opt.word}
                </span>
                {revealed && isRight && <Check className="size-5 shrink-0 text-primary" aria-hidden="true" />}
                {revealed && isPicked && !isRight && (
                  <X className="size-5 shrink-0 text-destructive" aria-hidden="true" />
                )}
              </button>
            </li>
          )
        })}
      </ul>

      {phase === 'feedback' && (
        <div className="animate-rise mt-4 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex gap-4 p-4">
            <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-muted">
              <Image
                src={word.image || '/placeholder.svg'}
                alt={`${word.word}의 뜻 "${word.meaning}"을 연상시키는 이미지`}
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p
                className={`font-display text-sm font-bold ${isCorrect ? 'text-primary' : 'text-destructive'}`}
              >
                {isCorrect ? `정답 +${gained} P` : picked === null ? '시간 초과' : '오답'}
              </p>
              <button
                type="button"
                onClick={() => speak(word.word)}
                className="mt-1 flex items-center gap-2 text-left"
                aria-label={`${word.word} 발음 다시 듣기`}
              >
                <span className="font-display text-xl font-bold">{word.word}</span>
                <Volume2 className="size-3.5 text-primary" aria-hidden="true" />
              </button>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {word.meaning} · <span className="font-display">{word.phonetic}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => speak(word.example, { rate: 0.85 })}
            className="w-full border-t border-border px-4 py-3 text-left"
            aria-label="예문 발음 듣기"
          >
            <span className="block text-sm leading-relaxed">{word.example}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{word.exampleKo}</span>
          </button>
          <p className="border-t border-border bg-secondary/40 px-4 py-3 text-xs text-muted-foreground">
            {isCorrect
              ? `기억 강화 완료 · ${nextIntervalDays === 0 ? '오늘' : `${nextIntervalDays}일 후`} 복습 큐에 다시 등장합니다.`
              : '망각 구간으로 분류되어 이번 세션과 다음 학습에서 먼저 출제됩니다.'}
          </p>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 p-4 backdrop-blur">
        <div className="mx-auto max-w-md">
          <Button
            className="h-12 w-full text-base"
            disabled={phase !== 'feedback'}
            onClick={next}
          >
            {index + 1 >= TOTAL_QUESTIONS ? '결과 보기' : '다음 문제'}
          </Button>
        </div>
      </div>
    </div>
  )
}
