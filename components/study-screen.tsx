'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Lightbulb, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSpeech } from '@/hooks/use-speech'
import { WORDS } from '@/lib/words'
import { formatDue, retention, STAGE_LABELS, type ProgressMap } from '@/lib/srs'

export function StudyScreen({ progress }: { progress: ProgressMap }) {
  const [index, setIndex] = useState(0)
  const { speak, speaking, supported, voiceName } = useSpeech()
  const word = WORDS[index]
  const p = progress[word.id]

  // 이중 부호화: 카드가 열리면 이미지 + 뜻 + 발음이 동시에 제시된다
  useEffect(() => {
    const t = window.setTimeout(() => speak(word.word), 260)
    return () => window.clearTimeout(t)
  }, [word.word, speak])

  const go = (delta: number) => setIndex((i) => (i + delta + WORDS.length) % WORDS.length)

  return (
    <div className="mx-auto w-full max-w-md px-5 pb-28 pt-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="font-display text-xs tracking-[0.18em] text-primary uppercase">Dual Coding</p>
          <h1 className="font-display mt-1 text-xl font-bold">단어 카드</h1>
        </div>
        <p className="font-display text-sm text-muted-foreground">
          {index + 1} / {WORDS.length}
        </p>
      </header>

      <article key={word.id} className="animate-rise mt-5 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="relative aspect-[4/3] w-full bg-muted">
          <Image
            src={word.image || '/placeholder.svg'}
            alt={`${word.word}의 뜻 "${word.meaning}"을 연상시키는 이미지`}
            fill
            sizes="(max-width: 480px) 100vw, 448px"
            className="object-cover"
            priority={index === 0}
          />
          <span className="absolute left-3 top-3 rounded-full bg-background/85 px-2.5 py-1 text-xs text-muted-foreground backdrop-blur">
            연상 이미지
          </span>
        </div>

        <div className="p-5">
          <button
            type="button"
            onClick={() => speak(word.word)}
            className="group flex w-full items-center gap-3 rounded-xl text-left transition-opacity active:opacity-70"
            aria-label={`${word.word} 원어민 발음 듣기`}
          >
            <span className="font-display text-3xl font-bold tracking-tight">{word.word}</span>
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary ${
                speaking ? 'animate-pulse-ring' : ''
              }`}
            >
              <Volume2 className="size-4" aria-hidden="true" />
            </span>
          </button>

          <p className="font-display mt-1 text-sm text-accent">{word.phonetic}</p>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
              {word.pos}
            </span>
            <p className="text-lg font-medium">{word.meaning}</p>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{word.meaningExtra}</p>

          <button
            type="button"
            onClick={() => speak(word.example, { rate: 0.85 })}
            className="mt-5 w-full rounded-xl border border-border bg-background/40 p-4 text-left transition-colors hover:border-primary/40"
            aria-label="예문 발음 듣기"
          >
            <span className="flex items-center gap-2 text-[0.68rem] tracking-widest text-muted-foreground uppercase">
              <Volume2 className="size-3" aria-hidden="true" /> Example
            </span>
            <span className="mt-2 block leading-relaxed">{word.example}</span>
            <span className="mt-1.5 block text-sm text-muted-foreground">{word.exampleKo}</span>
          </button>

          <div className="mt-4 flex gap-2.5 rounded-xl bg-primary/10 p-4">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-pretty">{word.mnemonic}</p>
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
            <div>
              <dt className="text-xs text-muted-foreground">복습 단계</dt>
              <dd className="font-display mt-1 text-sm">{STAGE_LABELS[p?.stage ?? 0]}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">기억 유지율</dt>
              <dd className="font-display mt-1 text-sm text-primary">
                {Math.round(retention(p) * 100)}%
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">다음 복습</dt>
              <dd className="font-display mt-1 text-sm">{formatDue(p)}</dd>
            </div>
          </dl>
        </div>
      </article>

      {!supported && (
        <p className="mt-3 text-xs text-muted-foreground">
          이 브라우저는 내장 TTS를 지원하지 않아 발음 재생이 제한됩니다.
        </p>
      )}
      {supported && voiceName && (
        <p className="mt-3 text-xs text-muted-foreground">원어민 음성: {voiceName}</p>
      )}

      <div className="mt-5 flex gap-3">
        <Button variant="outline" className="h-12 flex-1 text-base" onClick={() => go(-1)}>
          <ArrowLeft className="size-4" aria-hidden="true" /> 이전
        </Button>
        <Button className="h-12 flex-1 text-base" onClick={() => go(1)}>
          다음 <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
