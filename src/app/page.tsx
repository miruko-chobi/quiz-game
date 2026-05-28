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
      setError('ルームの作成に失敗しました。もう一度試してください。')
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
    const { data } = await supabase.from('rooms').select('id, status').eq('code', code).maybeSingle()
    if (!data) {
      setError('そのルームコードは見つかりませんでした。')
      setLoading(false)
      return
    }
    if (data.status === 'finished') {
      setError('このゲームはすでに終了しています。')
      setLoading(false)
      return
    }
    router.push(`/room/${code}/join`)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-indigo-700 mb-2">🎯 みんなでクイズ！</h1>
          <p className="text-gray-500 text-sm">リアルタイムクイズゲーム</p>
        </div>

        {mode === 'top' && (
          <div className="space-y-3">
            <button
              onClick={createRoom}
              disabled={loading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-lg transition-colors"
            >
              {loading ? '作成中...' : '🎮 ゲームを作成（GM）'}
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full py-4 bg-white hover:bg-gray-50 text-indigo-700 font-bold rounded-xl text-lg border-2 border-indigo-300 transition-colors"
            >
              🚀 ゲームに参加
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <label className="block text-sm font-bold mb-2 text-gray-700">
                ルームコードを入力
              </label>
              <input
                type="text"
                maxLength={4}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                placeholder="XXXX"
                className="w-full text-center text-4xl font-extrabold tracking-[0.4em] rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:outline-none p-3"
                autoFocus
              />
            </div>
            <button
              onClick={joinRoom}
              disabled={loading || roomCode.length < 4}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-lg transition-colors"
            >
              {loading ? '確認中...' : '✅ 参加する'}
            </button>
            <button
              onClick={() => { setMode('top'); setError('') }}
              className="w-full py-3 text-gray-500 hover:text-gray-700 font-bold text-sm transition-colors"
            >
              ← 戻る
            </button>
          </div>
        )}

        {error && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-red-600 text-sm text-center font-bold">{error}</p>
          </div>
        )}
      </div>
    </main>
  )
}
