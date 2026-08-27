'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Award } from 'lucide-react'
import { BadgePopup } from '@/components/badge-popup'
import { HomeScreen } from '@/components/home-screen'
import { LeaderboardScreen } from '@/components/leaderboard-screen'
import { QuizScreen, TOTAL_QUESTIONS, type SessionResult } from '@/components/quiz-screen'
import { ResultScreen } from '@/components/result-screen'
import { StudyScreen } from '@/components/study-screen'
import { WORDS } from '@/lib/words'
import { applyAnswer, createProgress, dueCount, masteredCount, type ProgressMap } from '@/lib/srs'
import {
  BADGE_THRESHOLD,
  loadBadges,
  loadLeaderboard,
  loadPlayerName,
  loadPoints,
  loadProgress,
  saveBadges,
  savePlayerName,
  savePoints,
  saveProgress,
  submitScore,
  type LeaderboardEntry,
} from '@/lib/storage'

type Screen = 'home' | 'study' | 'quiz' | 'result' | 'leaderboard'

const MASTER_BADGE = 'brain-training-master'
const WORD_IDS = WORDS.map((w) => w.id)

export default function Page() {
  const [screen, setScreen] = useState<Screen>('home')
  const [progress, setProgress] = useState<ProgressMap>({})
  const [points, setPoints] = useState(0)
  const [badges, setBadges] = useState<string[]>([])
  const [board, setBoard] = useState<LeaderboardEntry[]>([])
  const [playerName, setPlayerName] = useState('')
  const [result, setResult] = useState<SessionResult | null>(null)
  const [sessionKey, setSessionKey] = useState(0)
  const [badgeOpen, setBadgeOpen] = useState(false)

  useEffect(() => {
    setProgress(loadProgress())
    setPoints(loadPoints())
    setBadges(loadBadges())
    setBoard(loadLeaderboard())
    setPlayerName(loadPlayerName())
  }, [])

  const badgeEarned = badges.includes(MASTER_BADGE)

  const handleAnswer = useCallback(
    (id: string, isCorrect: boolean, gained: number) => {
      setProgress((prev) => {
        const next = { ...prev, [id]: applyAnswer(prev[id] ?? createProgress(id), isCorrect) }
        saveProgress(next)
        return next
      })

      if (gained <= 0) return
      setPoints((prev) => {
        const next = prev + gained
        savePoints(next)
        return next
      })
    },
    [],
  )

  // 누적 1,000포인트 달성 시 '두뇌 훈련 마스터' 배지 지급
  useEffect(() => {
    if (points < BADGE_THRESHOLD || badges.includes(MASTER_BADGE)) return
    const updated = [...badges, MASTER_BADGE]
    setBadges(updated)
    saveBadges(updated)
    setBadgeOpen(true)
  }, [points, badges])

  const handleFinish = useCallback((session: SessionResult) => {
    setResult(session)
    setScreen('result')
  }, [])

  const handleSubmitScore = useCallback(
    (name: string) => {
      const session = result
      if (!session) return board
      savePlayerName(name)
      setPlayerName(name)
      const entry: LeaderboardEntry = {
        id: `${Date.now()}`,
        name,
        score: session.score,
        points,
        accuracy: Math.round((session.correct / session.total) * 100),
        words: session.total,
        bestStreak: session.bestStreak,
        date: new Date().toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }),
      }
      const next = submitScore(entry)
      setBoard(next)
      return next
    },
    [board, points, result],
  )

  const startQuiz = () => {
    setSessionKey((k) => k + 1)
    setResult(null)
    setScreen('quiz')
  }

  const due = useMemo(() => dueCount(WORD_IDS, progress), [progress])
  const mastered = useMemo(() => masteredCount(progress), [progress])
  const topScore = board.length ? Math.max(...board.map((e) => e.score)) : 0

  return (
    <main className="min-h-dvh grid-lab">
      {screen !== 'home' && screen !== 'result' && (
        <div className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
            <button
              type="button"
              onClick={() => setScreen('home')}
              className="inline-flex items-center gap-1.5 rounded-lg px-1 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden="true" /> 홈
            </button>
            <div className="flex items-center gap-2.5">
              {badgeEarned && <Award className="size-4 text-primary" aria-label="두뇌 훈련 마스터 배지 보유" />}
              <span className="font-display text-sm text-primary" aria-live="polite">
                {points.toLocaleString()} P
              </span>
            </div>
          </div>
        </div>
      )}

      {screen === 'home' && (
        <HomeScreen
          totalPoints={points}
          badgeEarned={badgeEarned}
          dueCount={due}
          masteredCount={mastered}
          totalWords={WORDS.length}
          topScore={topScore}
          onStartQuiz={startQuiz}
          onStudy={() => setScreen('study')}
          onLeaderboard={() => setScreen('leaderboard')}
        />
      )}

      {screen === 'study' && <StudyScreen progress={progress} />}

      {screen === 'quiz' && (
        <QuizScreen
          key={sessionKey}
          progress={progress}
          onAnswer={handleAnswer}
          onFinish={handleFinish}
        />
      )}

      {screen === 'result' && result && (
        <ResultScreen
          result={result}
          totalPoints={points}
          defaultName={playerName}
          onSubmit={handleSubmitScore}
          onRestart={startQuiz}
          onLeaderboard={() => setScreen('leaderboard')}
        />
      )}

      {screen === 'leaderboard' && <LeaderboardScreen entries={board} onStart={startQuiz} />}

      {screen === 'result' && (
        <div className="mx-auto max-w-md px-5 pb-10 text-center">
          <button
            type="button"
            onClick={() => setScreen('home')}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            홈으로 돌아가기
          </button>
        </div>
      )}

      <BadgePopup open={badgeOpen} points={points} onClose={() => setBadgeOpen(false)} />

      <p className="sr-only">한 세션은 {TOTAL_QUESTIONS}문제로 구성됩니다.</p>
    </main>
  )
}
