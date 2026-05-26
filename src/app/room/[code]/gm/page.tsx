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

  const statusBadge = {
    waiting: { cls: 'badge-waiting', label: '待機中' },
    playing: { cls: 'badge-playing', label: '戦闘中' },
    finished: { cls: 'badge-finished', label: '終了' },
  }[status]

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-xl mx-auto space-y-4">

        {/* ヘッダー */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold text-[#c8a252] font-brush title-glow">
              ⚔️ 指令官ダッシュボード
            </h1>
            <p className="text-sm text-[#7ab07a] font-brush mt-0.5">
              合言葉：<span className="font-extrabold tracking-[0.2em] text-[#f5ede0]">{code}</span>
            </p>
          </div>
          <span className={`status-badge text-xs px-3 py-1.5 rounded-full font-bold font-brush ${statusBadge.cls}`}>
            {statusBadge.label}
          </span>
        </div>

        {/* 現在の問題（ゲーム中） */}
        {status === 'playing' && (
          <div className="washi-card rounded-2xl p-5">
            <p className="text-xs text-[#8a6a30] mb-1 font-brush">
              第 {currentQuestion + 1} 問 / {TOTAL_QUESTIONS} 問
            </p>
            <p className="font-bold text-[#1a1208] font-brush">{QUIZ_DATA[currentQuestion].question}</p>
            <div className="kimetsu-divider text-xs my-2">
              <span className="text-[#c8a252]">◆</span>
            </div>
            <p className="text-sm text-[#1a6a30] font-bold font-brush">
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

        {/* 待機中 → ゲーム開始ボタン */}
        {status === 'waiting' && (
          <button
            onClick={startGame}
            disabled={loading || players.length === 0}
            className="btn-tanjiro w-full py-4 rounded-xl text-lg tracking-wider"
          >
            {loading ? '準備中...' : `⚔️ 戦いを始める（${players.length}名参加中）`}
          </button>
        )}

        {/* ゲーム中 → 次の問題 */}
        {status === 'playing' && (
          <div className="space-y-2">
            {allAnswered ? (
              <p className="text-center text-[#7adc8a] text-sm font-bold font-brush">
                全員回答済み！次に進めるたい ⚔️
              </p>
            ) : (
              <p className="text-center text-[#c8a252] text-sm font-brush">
                回答待ち… {answeredPlayerIds.length} / {players.length} 名
              </p>
            )}
            <button
              onClick={nextQuestion}
              disabled={loading || !allAnswered}
              className="btn-tanjiro w-full py-4 rounded-xl text-lg tracking-wider"
            >
              {loading
                ? '処理中...'
                : currentQuestion + 1 >= TOTAL_QUESTIONS
                ? '🏆 最終結果を発表する！'
                : `⚔️ 次の問題へ（第 ${currentQuestion + 2} 問）`}
            </button>
          </div>
        )}

        {/* 終了 */}
        {status === 'finished' && (
          <div className="washi-card rounded-2xl p-6 text-center">
            <p className="text-2xl font-extrabold text-[#8c1c2f] mb-1 font-brush">全集中の戦い、終わりたい！</p>
            <p className="text-[#5a3a10] text-sm mb-4 font-brush">各隊員の画面に結果が表示されとうよ</p>

            <div className="space-y-2 mb-6">
              {[...players]
                .sort((a, b) => b.score - a.score)
                .map((p, i) => (
                  <div
                    key={p.id}
                    className="flex justify-between items-center p-2 rounded-lg font-brush"
                    style={{ background: 'rgba(26,18,8,0.06)', border: '1px solid rgba(200,162,82,0.2)' }}
                  >
                    <span className="text-[#1a1208] font-bold">{i + 1}位　{p.nickname}</span>
                    <span className="font-extrabold text-[#1a4228]">{p.score} / {TOTAL_QUESTIONS}</span>
                  </div>
                ))}
            </div>

            <button
              onClick={() => router.push('/')}
              className="btn-tomioka w-full py-3 rounded-xl tracking-wider"
            >
              🏠 新たな戦いを始める
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
