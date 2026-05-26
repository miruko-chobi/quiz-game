'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { QUIZ_DATA, TOTAL_QUESTIONS } from '@/data/quiz'
import PlayerList from '@/components/PlayerList'
import { Player, Answer } from '@/types'

export default function GmPage() {
  const { code } = useParams<{ code: string }>()

  const [roomId, setRoomId] = useState<string | null>(null)
  const [status, setStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [players, setPlayers] = useState<Player[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [loading, setLoading] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const loadPlayers = useCallback(async (rid: string) => {
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', rid)
      .eq('is_gm', false)
    setPlayers(data ?? [])
  }, [])

  const loadAnswers = useCallback(async (rid: string, qIndex: number) => {
    const { data } = await supabase
      .from('answers')
      .select('*')
      .eq('room_id', rid)
      .eq('question_index', qIndex)
    setAnswers(data ?? [])
  }, [])

  useEffect(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    let cancelled = false

    const init = async () => {
      const { data: room } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code)
        .maybeSingle()
      if (!room || cancelled) return

      setRoomId(room.id)
      setStatus(room.status)
      setCurrentQuestion(room.current_question)
      await loadPlayers(room.id)
      await loadAnswers(room.id, room.current_question)

      if (cancelled) return

      channelRef.current = supabase
        .channel(`room-${code}-gm`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${room.id}` },
          () => loadPlayers(room.id)
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'answers', filter: `room_id=eq.${room.id}` },
          () => loadAnswers(room.id, room.current_question)
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
  }, [code, loadPlayers, loadAnswers])

  useEffect(() => {
    if (roomId) loadAnswers(roomId, currentQuestion)
  }, [currentQuestion, roomId, loadAnswers])

  async function startGame() {
    if (!roomId) return
    setLoading(true)
    await supabase
      .from('rooms')
      .update({ status: 'playing', current_question: 0 })
      .eq('id', roomId)
    setStatus('playing')
    setCurrentQuestion(0)
    setLoading(false)
  }

  async function nextQuestion() {
    if (!roomId) return
    setLoading(true)
    const next = currentQuestion + 1

    if (next >= TOTAL_QUESTIONS) {
      for (const player of players) {
        const { data: playerAnswers } = await supabase
          .from('answers')
          .select('is_correct')
          .eq('player_id', player.id)
          .eq('room_id', roomId)
        const score = playerAnswers?.filter((a) => a.is_correct).length ?? 0
        await supabase.from('players').update({ score }).eq('id', player.id)
      }
      await supabase.from('rooms').update({ status: 'finished' }).eq('id', roomId)
      setStatus('finished')
      await loadPlayers(roomId)
    } else {
      await supabase
        .from('rooms')
        .update({ current_question: next })
        .eq('id', roomId)
      setCurrentQuestion(next)
    }
    setLoading(false)
  }

  const answeredPlayerIds = answers.map((a) => a.player_id)
  const allAnswered = players.length > 0 && answeredPlayerIds.length >= players.length

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold text-indigo-600">GMダッシュボード</h1>
            <p className="text-sm text-gray-500">
              ルームコード：<span className="font-bold tracking-widest text-gray-800">{code}</span>
            </p>
          </div>
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium ${
              status === 'waiting'
                ? 'bg-yellow-100 text-yellow-700'
                : status === 'playing'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {status === 'waiting' ? '待機中' : status === 'playing' ? 'ゲーム中' : '終了'}
          </span>
        </div>

        {status === 'playing' && (
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <p className="text-xs text-gray-500 mb-1">
              問題 {currentQuestion + 1} / {TOTAL_QUESTIONS}
            </p>
            <p className="font-bold text-gray-800">{QUIZ_DATA[currentQuestion].question}</p>
            <p className="text-sm text-green-600 mt-2 font-medium">
              正解：{QUIZ_DATA[currentQuestion].choices[QUIZ_DATA[currentQuestion].correct]}
            </p>
          </div>
        )}

        <PlayerList
          players={players}
          answeredPlayerIds={answeredPlayerIds}
          currentQuestion={currentQuestion}
          totalQuestions={TOTAL_QUESTIONS}
        />

        {status === 'waiting' && (
          <button
            onClick={startGame}
            disabled={loading || players.length === 0}
            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '開始中...' : `ゲーム開始（${players.length}人参加中）`}
          </button>
        )}

        {status === 'playing' && (
          <div className="space-y-2">
            {allAnswered && (
              <p className="text-center text-green-600 text-sm font-medium">
                全員回答済み！次の問題に進められるよ
              </p>
            )}
            <button
              onClick={nextQuestion}
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading
                ? '処理中...'
                : currentQuestion + 1 >= TOTAL_QUESTIONS
                ? '結果発表！'
                : `次の問題へ（${currentQuestion + 2} / ${TOTAL_QUESTIONS}）`}
            </button>
            <p className="text-xs text-gray-400 text-center">
              ※ 全員が回答していなくても進められるばい
            </p>
          </div>
        )}

        {status === 'finished' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <p className="text-2xl font-bold text-indigo-600 mb-2">ゲーム終了！</p>
            <p className="text-gray-500 text-sm mb-4">各プレイヤーの画面に結果が表示されとうよ</p>
            <div className="space-y-2">
              {[...players]
                .sort((a, b) => b.score - a.score)
                .map((p, i) => (
                  <div key={p.id} className="flex justify-between items-center p-2 rounded-lg bg-gray-50">
                    <span className="text-gray-700">{i + 1}位　{p.nickname}</span>
                    <span className="font-bold text-indigo-600">{p.score} / {TOTAL_QUESTIONS}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
