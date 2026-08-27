'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/** 미국 원어민 목소리를 우선순위로 고른다 (기기별 내장 TTS 이름이 달라 후보를 넓게 잡음) */
const PREFERRED = [
  'google us english',
  'samantha',
  'microsoft aria',
  'microsoft jenny',
  'microsoft guy',
  'microsoft zira',
  'alex',
  'ava',
  'allison',
  'nicky',
  'aaron',
]

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const en = voices.filter((v) => /^en[-_]us/i.test(v.lang))
  const pool = en.length ? en : voices.filter((v) => /^en/i.test(v.lang))
  if (!pool.length) return null

  for (const name of PREFERRED) {
    const hit = pool.find((v) => v.name.toLowerCase().includes(name))
    if (hit) return hit
  }
  return pool.find((v) => v.localService) ?? pool[0]
}

export function useSpeech() {
  const [supported, setSupported] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [voiceName, setVoiceName] = useState<string | null>(null)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    setSupported(true)

    const load = () => {
      const voice = pickVoice(window.speechSynthesis.getVoices())
      voiceRef.current = voice
      setVoiceName(voice?.name ?? null)
    }

    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    // 일부 브라우저는 목록을 늦게 채워 넣는다
    const t = window.setTimeout(load, 700)

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', load)
      window.clearTimeout(t)
      window.speechSynthesis.cancel()
    }
  }, [])

  const speak = useCallback(
    (text: string, opts?: { rate?: number; pitch?: number }) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) return
      const synth = window.speechSynthesis
      synth.cancel()

      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = voiceRef.current?.lang || 'en-US'
      if (voiceRef.current) utter.voice = voiceRef.current
      utter.rate = opts?.rate ?? 0.92
      utter.pitch = opts?.pitch ?? 1
      utter.onstart = () => setSpeaking(true)
      utter.onend = () => setSpeaking(false)
      utter.onerror = () => setSpeaking(false)

      synth.speak(utter)
    },
    [],
  )

  const stop = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  return { speak, stop, speaking, supported, voiceName }
}
