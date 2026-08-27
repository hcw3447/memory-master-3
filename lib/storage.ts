import type { ProgressMap } from './srs'

const KEYS = {
  progress: 'neurolexicon.progress.v1',
  points: 'neurolexicon.points.v1',
  badges: 'neurolexicon.badges.v1',
  leaderboard: 'neurolexicon.leaderboard.v1',
  player: 'neurolexicon.player.v1',
}

export const BADGE_THRESHOLD = 1000

export type LeaderboardEntry = {
  id: string
  name: string
  score: number
  points: number
  accuracy: number
  words: number
  bestStreak: number
  date: string
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 저장 공간이 없거나 접근이 차단된 경우 무시
  }
}

export const loadProgress = () => read<ProgressMap>(KEYS.progress, {})
export const saveProgress = (p: ProgressMap) => write(KEYS.progress, p)

export const loadPoints = () => read<number>(KEYS.points, 0)
export const savePoints = (n: number) => write(KEYS.points, n)

export const loadBadges = () => read<string[]>(KEYS.badges, [])
export const saveBadges = (b: string[]) => write(KEYS.badges, b)

export const loadPlayerName = () => read<string>(KEYS.player, '')
export const savePlayerName = (n: string) => write(KEYS.player, n)

export const loadLeaderboard = () => read<LeaderboardEntry[]>(KEYS.leaderboard, [])

/** 최고 점수 기준 정렬 후 상위 10개만 보관. 같은 이름은 최고 기록만 남긴다. */
export function submitScore(entry: LeaderboardEntry): LeaderboardEntry[] {
  const current = loadLeaderboard()
  const key = entry.name.trim().toLowerCase()
  const previous = current.find((e) => e.name.trim().toLowerCase() === key)

  let next: LeaderboardEntry[]
  if (previous) {
    next = current.map((e) =>
      e === previous ? (entry.score > previous.score ? entry : { ...previous, id: previous.id }) : e,
    )
  } else {
    next = [...current, entry]
  }

  next.sort((a, b) => b.score - a.score || a.words - b.words)
  next = next.slice(0, 10)
  write(KEYS.leaderboard, next)
  return next
}

export function resetAll() {
  if (typeof window === 'undefined') return
  Object.values(KEYS).forEach((k) => window.localStorage.removeItem(k))
}
