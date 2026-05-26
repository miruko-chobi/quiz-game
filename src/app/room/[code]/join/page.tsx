'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import WaitingRoom from '@/components/WaitingRoom'
import { Player, Room } from '@/types'

export default function JoinPage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()

  const [nickname, setNickname] = useState('')
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  async function joinGame() {
    if (!nickname.trim()) return
    setLoading(true)
    setError('')

    const { data: room } = await supabase
      .from('rooms')
      .select('id')
      .eq('code', code)
      .maybeSingle()

    if (!room) {
      setError('その戦場は見つからなかったたい。')
      setLoading(false)
      return
    }

    const { data: player, error: err } = await supabase
      .from('players')
      .insert({ room_id: room.id, nickname: nickname.trim(), is_gm: false })
      .select()
      .single()

    if (err || !player) {
      setError('参戦に失敗したたい。')
      setLoading(false)
      return
    }

    setPlayerId(player.id)
    setLoading(false)
  }

  useEffect(() => {
    if (!playerId) return

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    let cancelled = false

    const init = async () => {
      const { data: room } = await supabase
        .from('rooms')
        .select('id')
        .eq('code', code)
        .maybeSingle()
      if (!room || cancelled) return

      const { data } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', room.id)
        .eq('is_gm', false)
      if (!cancelled) setPlayers(data ?? [])

      if (cancelled) return

      channelRef.current = supabase
        .channel(`room-${code}-join`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${room.id}` },
          async () => {
            const { data: updated } = await supabase
              .from('players')
              .select('*')
              .eq('room_id', room.id)
              .eq('is_gm', false)
            setPlayers(updated ?? [])
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` },
          (payload) => {
            const updated = payload.new as Room
            if (updated.status === 'playing') {
              router.push(`/room/${code}/play?pid=${playerId}`)
            }
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
  }, [playerId, code, router])

  if (!playerId) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-4">

          {/* 合言葉表示 */}
          <div className="text-center mb-4">
            <p className="text-xs text-[#c8a252] tracking-[0.3em] font-brush mb-1">― 合言葉 ―</p>
            <p className="text-4xl font-extrabold tracking-[0.3em] text-[#f5ede0] title-glow font-brush">
              {code}
            </p>
          </div>

          {/* ニックネーム入力 */}
          <div className="washi-card rounded-2xl p-6 space-y-4">
            <h2 className="font-extrabold text-[#1a1208] text-lg font-brush tracking-wider">
              ⚔️ 隊士の名を入力せよ
            </h2>
            <input
              type="text"
              maxLength={12}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && joinGame()}
              placeholder="例：炭治郎"
              className="washi-input w-full rounded-xl p-3 text-lg"
            />
            <button
              onClick={joinGame}
              disabled={loading || !nickname.trim()}
              className="btn-tomioka w-full py-3 rounded-xl tracking-wider"
            >
              {loading ? '参戦中...' : '🔥 参戦する'}
            </button>
          </div>

          {error && (
            <div className="washi-card rounded-xl p-3 border-[#8c1c2f]">
              <p className="text-[#8c1c2f] text-sm text-center font-bold font-brush">{error}</p>
            </div>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <WaitingRoom players={players} roomCode={code} />
    </main>
  )
}
