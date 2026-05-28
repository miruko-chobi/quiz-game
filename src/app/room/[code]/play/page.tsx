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
    const { data } = await supabase.from('answers').select('*').eq('player_id', pid)
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
        .from('players').select('*').eq('id', playerId).maybeSingle()
      if (!p || cancelled) return
      setPlayer(p)

      const { data: room } = await supabase
        .from('rooms').select('*').eq('code', code).maybeSingle()
      if (!room || cancelled) return
      setRoomId(room.id)
      setCurrentQuestion(room.current_question)
      setStatus(room.status as 'playing' | 'finished')

      await loadMyAnswers(playerId)
      await loadAllPlayers(room.id)

      const { data: existingAnswer } = await supabase
        .from('answers').select('*')
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

  // ── ローディング ──
  if (!player) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <p className="text-indigo-500 text-lg animate-pulse">読み込み中...</p>
      </main>
    )
  }

  // ── 結果画面 ──
  if (status === 'finished') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6 pb-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-extrabold text-center text-indigo-700 mb-6">
            🏆 最終結果発表！
          </h1>
          <ResultScreen player={player} allPlayers={allPlayers} answers={myAnswers} />
          <div className="mt-6">
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
            >
              🏠 最初の画面に戻る
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ── クイズ画面 ──
  const question = QUIZ_DATA[currentQuestion]

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* ヘッダー */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold bg-indigo-100 text-indigo-700 rounded-full px-3 py-1">
            第 {currentQuestion + 1} 問 / {QUIZ_DATA.length}
          </span>
          <span className="text-sm font-bold text-gray-600">👤 {player.nickname}</span>
        </div>

        <QuizCard
          question={question}
          selectedChoice={selectedChoice}
          submitted={submitted}
          onSelect={handleSelect}
        />

        {/* 送信ボタン */}
        {!submitted && selectedChoice !== null && (
          <button
            onClick={sendAnswer}
            disabled={sending}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-lg transition-colors"
          >
            {sending ? '送信中...' : `✅「${question.choices[selectedChoice]}」で回答する！`}
          </button>
        )}

        {/* 送信済みメッセージ */}
        {submitted && (
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-green-600 font-bold text-lg">✅ 回答を送信しました！</p>
            <p className="text-gray-400 text-sm mt-1">GMが次の問題に進むまでお待ちください</p>
          </div>
        )}
      </div>
    </main>
  )
}
