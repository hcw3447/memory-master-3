// 에빙하우스 망각곡선 기반 간격 반복(Spaced Repetition) 엔진

export const DAY = 24 * 60 * 60 * 1000

/** 단계별 다음 복습까지의 간격(일). 에빙하우스가 제안한 1일 → 3일 → 7일 → 2주 → 1개월 주기 */
export const REVIEW_INTERVALS_DAYS = [0, 1, 3, 7, 14, 30]

/** 세션 안에서 정답 단어가 "몇 문제 뒤"에 다시 등장할지 (단계가 오를수록 간격이 길어짐) */
export const IN_SESSION_GAPS = [2, 3, 5, 8, 12, 16]

export const MAX_STAGE = REVIEW_INTERVALS_DAYS.length - 1

export const STAGE_LABELS = ['신규', '1일 후', '3일 후', '7일 후', '14일 후', '30일 후']

export type WordProgress = {
  id: string
  /** 0 = 신규/재학습, 5 = 장기기억 정착 */
  stage: number
  correct: number
  wrong: number
  /** 다음 복습 예정 시각(ms) */
  dueAt: number
  lastSeenAt: number
}

export type ProgressMap = Record<string, WordProgress>

export function createProgress(id: string): WordProgress {
  return { id, stage: 0, correct: 0, wrong: 0, dueAt: Date.now(), lastSeenAt: 0 }
}

/** 정답이면 단계 +1(간격 확장), 오답이면 한 단계 강등 후 즉시 복습 대상으로 */
export function applyAnswer(prev: WordProgress, isCorrect: boolean, now = Date.now()): WordProgress {
  const stage = isCorrect ? Math.min(prev.stage + 1, MAX_STAGE) : Math.max(prev.stage - 1, 0)
  const intervalDays = isCorrect ? REVIEW_INTERVALS_DAYS[stage] : 0
  return {
    ...prev,
    stage,
    correct: prev.correct + (isCorrect ? 1 : 0),
    wrong: prev.wrong + (isCorrect ? 0 : 1),
    dueAt: now + intervalDays * DAY,
    lastSeenAt: now,
  }
}

/**
 * 예측 기억 유지율 R = e^(-t/S)
 * t = 마지막 학습 이후 경과 시간, S = 단계에 따라 커지는 기억 강도
 */
export function retention(p: WordProgress | undefined, now = Date.now()): number {
  if (!p || !p.lastSeenAt) return 0
  const strengthDays = Math.max(0.35, REVIEW_INTERVALS_DAYS[p.stage] || 0.35) * 1.6
  const elapsedDays = (now - p.lastSeenAt) / DAY
  return Math.min(1, Math.max(0, Math.exp(-elapsedDays / strengthDays)))
}

/** 복습 시점이 된 단어 우선, 그다음 신규 단어 순으로 출제 큐를 만든다 */
export function buildQueue(ids: string[], progress: ProgressMap, now = Date.now()): string[] {
  const due: string[] = []
  const fresh: string[] = []
  const future: string[] = []

  for (const id of ids) {
    const p = progress[id]
    if (!p || !p.lastSeenAt) fresh.push(id)
    else if (p.dueAt <= now) due.push(id)
    else future.push(id)
  }

  due.sort((a, b) => (progress[a].dueAt ?? 0) - (progress[b].dueAt ?? 0))
  future.sort((a, b) => retention(progress[a], now) - retention(progress[b], now))

  return [...due, ...fresh, ...future]
}

export function dueCount(ids: string[], progress: ProgressMap, now = Date.now()): number {
  return ids.filter((id) => {
    const p = progress[id]
    return p && p.lastSeenAt > 0 && p.dueAt <= now
  }).length
}

export function masteredCount(progress: ProgressMap): number {
  return Object.values(progress).filter((p) => p.stage >= MAX_STAGE).length
}

export function formatDue(p: WordProgress | undefined, now = Date.now()): string {
  if (!p || !p.lastSeenAt) return '학습 전'
  const diff = p.dueAt - now
  if (diff <= 0) return '복습 대기'
  const days = Math.ceil(diff / DAY)
  return `${days}일 후 복습`
}
