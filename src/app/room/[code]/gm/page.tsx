'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { QUIZ_DATA, TOTAL_QUESTIONS } from '@/data/quiz'
import PlayerList from '@/components/PlayerList'
import { Player, Answer } from '@/types'

export default function GmPage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()

  const [roomId, setRoomId] = useState<string | null>(null)
  const [status, setStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [players, setPlayers] = useState<Player[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [loading, setLoading] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const currentQuestionRef = useRef(0)

  useEffect(() => {
    currentQuestionRef.current = currentQuestion
  }, [currentQuestion])

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
      currentQuestionRef.current = room.current_question
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
          () => loadAnswers(room.id, currentQuestionRef.current)
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
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="max-w-xl mx-auto space-y-4">

        {/* ヘッダー */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold text-indigo-700">🎮 GMダッシュボード</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              ルームコード：<span className="font-extrabold tracking-[0.2em] text-gray-800">{code}</span>
            </p>
          </div>
          <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${
            status === 'waiting'  ? 'bg-yellow-100 text-yellow-800' :
            status === 'playing'  ? 'bg-green-100 text-green-800' :
                                    'bg-gray-100 text-gray-600'
          }`}>
            {status === 'waiting' ? '待機中' : status === 'playing' ? 'ゲーム中' : '終了'}
          </span>
        </div>

        {/* 現在の問題（ゲーム中） */}
        {status === 'playing' && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <p className="text-xs text-gray-500 mb-1">
              第 {currentQuestion + 1} 問 / {TOTAL_QUESTIONS} 問
            </p>
            <p className="font-bold text-gray-800">{QUIZ_DATA[currentQuestion].question}</p>
            <hr className="my-3" />
            <p className="text-sm text-green-700 font-bold">
              ✅ 正解：{QUIZ_DATA[currentQuestion].choices[QUIZ_DATA[currentQuestion].correct]}
            </p>
          </div>
        )}

        <PlayerList
          players={players}
          answeredPlayerIds={answeredPlayerIds}
          currentQuestion={currentQuestion}
          totalQuestions={TOTAL_QUESTIONS}
        />

        {/* 待機中 → ゲーム開始ボタン */}
        {status === 'waiting' && (
          <button
            onClick={startGame}
            disabled={loading || players.length === 0}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-lg transition-colors"
          >
            {loading ? '準備中...' : `🎮 ゲーム開始（${players.length}人参加中）`}
          </button>
        )}

        {/* ゲーム中 → 次の問題 */}
        {status === 'playing' && (
          <div className="space-y-2">
            {allAnswered ? (
              <p className="text-center text-green-600 text-sm font-bold">
                全員回答済み！次に進めます ✅
              </p>
            ) : (
              <p className="text-center text-gray-500 text-sm">
                回答待ち… {answeredPlayerIds.length} / {players.length} 人
              </p>
            )}
            <button
              onClick={nextQuestion}
              disabled={loading || !allAnswered}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-lg transition-colors"
            >
              {loading
                ? '処理中...'
                : currentQuestion + 1 >= TOTAL_QUESTIONS
                ? '🏆 結果を発表する！'
                : `➡️ 次の問題へ（第 ${currentQuestion + 2} 問）`}
            </button>
          </div>
        )}

        {/* 終了 */}
        {status === 'finished' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <p className="text-2xl font-extrabold text-gray-800 mb-1">🎉 ゲーム終了！</p>
            <p className="text-gray-500 text-sm mb-4">プレイヤー画面に結果が表示されています</p>

            <div className="space-y-2 mb-6">
              {[...players]
                .sort((a, b) => b.score - a.score)
                .map((p, i) => (
                  <div
                    key={p.id}
                    className="flex justify-between items-center p-2 rounded-lg bg-gray-50"
                  >
                    <span className="text-gray-800 font-bold">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}位`}　{p.nickname}
                    </span>
                    <span className="font-extrabold text-indigo-700">{p.score} / {TOTAL_QUESTIONS}</span>
                  </div>
                ))}
            </div>

            <button
              onClick={() => router.push('/')}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
            >
              🏠 新しいゲームを始める
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
