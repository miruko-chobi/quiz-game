'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { QUIZ_DATA } from '@/data/quiz'
import QuizCard from '@/components/QuizCard'
import ResultScreen from '@/components/ResultScreen'
import { Player, Answer, Room } from '@/types'

export default function PlayPage() {
  const { code } = useParams<{ code: string }>()
  const searchParams = useSearchParams()
  const playerId = searchParams.get('pid')
  const router = useRouter()

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [status, setStatus] = useState<'playing' | 'finished'>('playing')
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [player, setPlayer] = useState<Player | null>(null)
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [myAnswers, setMyAnswers] = useState<Answer[]>([])
  const [roomId, setRoomId] = useState<string | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const loadMyAnswers = useCallback(async (pid: string) => {
    const { data } = await supabase
      .from('answers')
      .select('*')
      .eq('player_id', pid)
    setMyAnswers(data ?? [])
  }, [])

  const loadAllPlayers = useCallback(async (rid: string) => {
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', rid)
      .eq('is_gm', false)
    setAllPlayers(data ?? [])
  }, [])

  useEffect(() => {
    if (!playerId) return

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    let cancelled = false

    const init = async () => {
      const { data: p } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .maybeSingle()
      if (!p || cancelled) return
      setPlayer(p)

      const { data: room } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code)
        .maybeSingle()
      if (!room || cancelled) return
      setRoomId(room.id)
      setCurrentQuestion(room.current_question)
      setStatus(room.status as 'playing' | 'finished')

      await loadMyAnswers(playerId)
      await loadAllPlayers(room.id)

      const { data: existingAnswer } = await supabase
        .from('answers')
        .select('*')
        .eq('player_id', playerId)
        .eq('question_index', room.current_question)
        .maybeSingle()
      if (existingAnswer && !cancelled) {
        setSelectedChoice(existingAnswer.selected_choice)
        setSubmitted(true)
      }

      if (cancelled) return

      channelRef.current = supabase
        .channel(`room-${code}-play-${playerId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` },
          async (payload) => {
            const updated = payload.new as Room
            if (updated.status === 'finished') {
              await loadMyAnswers(playerId)
              await loadAllPlayers(room.id)
              setStatus('finished')
              return
            }
            setCurrentQuestion(updated.current_question)
            setSelectedChoice(null)
            setSubmitted(false)
          }
        )
        .subscribe()
    }

    init()

    return () => {
      cancelled = true
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [playerId, code, loadMyAnswers, loadAllPlayers])

  function handleSelect(choice: number) {
    if (submitted) return
    setSelectedChoice(choice)
  }

  async function sendAnswer() {
    if (!playerId || !roomId || submitted || selectedChoice === null) return
    setSending(true)

    const question = QUIZ_DATA[currentQuestion]
    const isCorrect = selectedChoice === question.correct

    const { error } = await supabase.from('answers').insert({
      room_id: roomId,
      player_id: playerId,
      question_index: currentQuestion,
      selected_choice: selectedChoice,
      is_correct: isCorrect,
    })

    if (!error) {
      setSubmitted(true)
      if (isCorrect) {
        await supabase
          .from('players')
          .update({ score: (player?.score ?? 0) + 1 })
          .eq('id', playerId)
        setPlayer((prev) => prev ? { ...prev, score: prev.score + 1 } : prev)
      }
    }
    setSending(false)
  }

  if (!player) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#c8a252] font-brush text-lg animate-pulse">全集中...</p>
        </div>
      </main>
    )
  }

  if (status === 'finished') {
    return (
      <main className="min-h-screen p-6 pb-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-extrabold text-center text-[#c8a252] mb-6 font-brush title-glow">
            🏆 最終結果発表！
          </h1>
          <ResultScreen player={player} allPlayers={allPlayers} answers={myAnswers} />
          <div className="mt-6">
            <button
              onClick={() => router.push('/')}
              className="btn-tomioka w-full py-3 rounded-xl tracking-wider"
            >
              🏠 最初の画面に戻る
            </button>
          </div>
        </div>
      </main>
    )
  }

  const question = QUIZ_DATA[currentQuestion]

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">

        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <span
              className="text-xs px-3 py-1 rounded-full font-bold font-brush"
              style={{ background: 'linear-gradient(135deg, #1a4228, #0d2818)', color: '#c8a252', border: '1px solid #c8a252' }}
            >
              第 {currentQuestion + 1} 問 / {QUIZ_DATA.length}
            </span>
          </div>
          <span
            className="text-sm font-bold text-[#c8a252] font-brush"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
          >
            ⚔️ {player.nickname}
          </span>
        </div>

        <QuizCard
          question={question}
          selectedChoice={selectedChoice}
          submitted={submitted}
          onSelect={handleSelect}
        />

        {/* 回答送信ボタン */}
        {!submitted && selectedChoice !== null && (
          <div className="mt-5">
            <button
              onClick={sendAnswer}
              disabled={sending}
              className="btn-tomioka w-full py-4 rounded-xl text-lg tracking-wider"
            >
              {sending ? '送信中...' : `🔥「${question.choices[selectedChoice]}」で攻める！`}
            </button>
            <p className="text-xs text-[#7a9a7a] text-center mt-2 font-brush">
              ※ 送信前なら選び直せるたい
            </p>
          </div>
        )}

        {/* 送信済み */}
        {submitted && (
          <div className="mt-6 text-center washi-card rounded-xl p-4">
            <p className="text-[#1a4228] font-bold font-brush">⚔️ 回答を送った！</p>
            <p className="text-sm text-[#5a3a10] mt-1 font-brush">
              指令官が次の問題に進めるまで待っとってね
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
