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
  // ★ selectedChoice = 選択中（未送信）、submitted = 送信済み
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

  // ★ 選択のみ（DBには送らない）
  function handleSelect(choice: number) {
    if (submitted) return
    setSelectedChoice(choice)
  }

  // ★ 送信ボタンを押した時にDBに送信
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
        <p className="text-gray-500">読み込み中...</p>
      </main>
    )
  }

  if (status === 'finished') {
    return (
      <main className="min-h-screen p-6 pb-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-extrabold text-center text-indigo-600 mb-6">結果発表！</h1>
          <ResultScreen player={player} allPlayers={allPlayers} answers={myAnswers} />
          {/* ★ 最初に戻るボタン */}
          <div className="mt-6">
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
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
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm text-gray-500">
            問題 {currentQuestion + 1} / {QUIZ_DATA.length}
          </span>
          <span className="text-sm font-medium text-indigo-600">{player.nickname}</span>
        </div>

        <QuizCard
          question={question}
          selectedChoice={selectedChoice}
          submitted={submitted}
          onSelect={handleSelect}
        />

        {/* ★ 選択済みかつ未送信の時に送信ボタンを表示 */}
        {!submitted && selectedChoice !== null && (
          <div className="mt-4">
            <button
              onClick={sendAnswer}
              disabled={sending}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors text-lg"
            >
              {sending ? '送信中...' : `「${question.choices[selectedChoice]}」で回答する`}
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">
              ※ 送信前なら選び直せるたい
            </p>
          </div>
        )}

        {submitted && (
          <div className="mt-6 text-center bg-white rounded-xl shadow p-4">
            <p className="text-gray-600 font-medium">回答を送信したたい！</p>
            <p className="text-sm text-gray-400 mt-1">ゲームマスターが次の問題に進めるまで待っとってね</p>
          </div>
        )}
      </div>
    </main>
  )
}
