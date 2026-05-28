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
      setError('そのルームは見つかりませんでした。')
      setLoading(false)
      return
    }

    const { data: player, error: err } = await supabase
      .from('players')
      .insert({ room_id: room.id, nickname: nickname.trim(), is_gm: false })
      .select()
      .single()

    if (err || !player) {
      setError('参加に失敗しました。')
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
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-4">

          <div className="text-center mb-4">
            <p className="text-xs text-gray-500 tracking-[0.3em] mb-1">ルームコード</p>
            <p className="text-4xl font-extrabold tracking-[0.3em] text-indigo-700">{code}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="font-extrabold text-gray-800 text-lg">👤 ニックネームを入力</h2>
            <input
              type="text"
              maxLength={12}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && joinGame()}
              placeholder="例：たろう"
              className="w-full rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none p-3 text-lg"
            />
            <button
              onClick={joinGame}
              disabled={loading || !nickname.trim()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors"
            >
              {loading ? '参加中...' : '🚀 参加する'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-sm text-center font-bold">{error}</p>
            </div>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-6">
      <WaitingRoom players={players} roomCode={code} />
    </main>
  )
}
