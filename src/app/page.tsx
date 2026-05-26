'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase()
}

export default function HomePage() {
  const router = useRouter()
  const [mode, setMode] = useState<'top' | 'join'>('top')
  const [roomCode, setRoomCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function createRoom() {
    setLoading(true)
    setError('')
    let code = generateRoomCode()

    for (let i = 0; i < 5; i++) {
      const { data } = await supabase.from('rooms').select('id').eq('code', code).maybeSingle()
      if (!data) break
      code = generateRoomCode()
    }

    const { error: err } = await supabase.from('rooms').insert({ code })
    if (err) {
      setError('ルーム作成に失敗したたい。もう一度試してみてくれんね。')
      setLoading(false)
      return
    }

    router.push(`/room/${code}/gm`)
  }

  async function joinRoom() {
    if (!roomCode.trim()) return
    setLoading(true)
    setError('')

    const code = roomCode.trim().toUpperCase()
    const { data } = await supabase
      .from('rooms')
      .select('id, status')
      .eq('code', code)
      .maybeSingle()

    if (!data) {
      setError('そのルームコードは見つからなかったたい。確認してみてくれんね。')
      setLoading(false)
      return
    }
    if (data.status === 'finished') {
      setError('このルームはもう終了しとうよ。')
      setLoading(false)
      return
    }

    router.push(`/room/${code}/join`)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-indigo-600 mb-2">みんなでクイズ！</h1>
          <p className="text-gray-500 text-sm">友達とリアルタイムで楽しもう</p>
        </div>

        {mode === 'top' && (
          <div className="space-y-3">
            <button
              onClick={createRoom}
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '作成中...' : 'ゲームを作成する（GM）'}
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full py-4 bg-white text-indigo-600 font-bold rounded-xl shadow border-2 border-indigo-200 hover:border-indigo-400 transition-colors"
            >
              ゲームに参加する
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl shadow p-5">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                ルームコードを入力
              </label>
              <input
                type="text"
                maxLength={4}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                placeholder="XXXX"
                className="w-full text-center text-3xl font-extrabold tracking-widest border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-indigo-400"
              />
            </div>
            <button
              onClick={joinRoom}
              disabled={loading || roomCode.length < 4}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '確認中...' : '参加する'}
            </button>
            <button
              onClick={() => { setMode('top'); setError('') }}
              className="w-full py-3 text-gray-500 text-sm hover:text-gray-700"
            >
              ← 戻る
            </button>
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm text-center bg-red-50 rounded-lg p-3">{error}</p>
        )}
      </div>
    </main>
  )
}
