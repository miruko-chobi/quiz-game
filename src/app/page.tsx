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
      setError('戦場の開設に失敗したたい。もう一度試してみてくれんね。')
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
      setError('その合言葉は見つからなかったたい。確認してみてくれんね。')
      setLoading(false)
      return
    }
    if (data.status === 'finished') {
      setError('この戦いはもう終わっとうよ。')
      setLoading(false)
      return
    }

    router.push(`/room/${code}/join`)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-5">

        {/* タイトルエリア */}
        <div className="text-center mb-8">
          <div className="text-sm tracking-[0.4em] text-[#c8a252] mb-2 font-brush">
            ― 鬼殺隊 公認 ―
          </div>
          <h1 className="text-6xl font-extrabold title-glow font-brush mb-3 leading-tight">
            鬼滅クイズ
          </h1>
          <div className="kimetsu-divider text-xs my-3">
            <span>刃</span>
          </div>
          <p className="text-[#c8a252] text-sm tracking-widest font-brush">
            鬼の頸を斬れ！
          </p>
        </div>

        {mode === 'top' && (
          <div className="space-y-3">
            <button
              onClick={createRoom}
              disabled={loading}
              className="btn-tanjiro w-full py-4 rounded-xl text-lg tracking-wider"
            >
              {loading ? '戦場を準備中...' : '刃 戦場を開く（GM）'}
            </button>
            <button
              onClick={() => setMode('join')}
              className="btn-tomioka w-full py-4 rounded-xl text-lg tracking-wider"
            >
              🔥 戦に参加する
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-3">
            <div className="washi-card rounded-xl p-5">
              <label className="block text-sm font-bold mb-2 text-[#5a3a10] font-brush tracking-wider">
                合言葉（ルームコード）を入力
              </label>
              <input
                type="text"
                maxLength={4}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                placeholder="XXXX"
                className="washi-input w-full text-center text-4xl font-extrabold tracking-[0.4em] rounded-lg p-3"
              />
            </div>
            <button
              onClick={joinRoom}
              disabled={loading || roomCode.length < 4}
              className="btn-tomioka w-full py-4 rounded-xl text-lg tracking-wider"
            >
              {loading ? '確認中...' : '🔥 参加する'}
            </button>
            <button
              onClick={() => { setMode('top'); setError('') }}
              className="w-full py-3 text-[#c8a252] text-sm hover:text-[#e8d080] transition-colors font-brush tracking-wider"
            >
              ← 戻る
            </button>
          </div>
        )}

        {error && (
          <div className="washi-card rounded-xl p-3 border-[#8c1c2f]">
            <p className="text-[#8c1c2f] text-sm text-center font-bold">{error}</p>
          </div>
        )}

        <div className="text-center text-[#3a5a3a] text-xs mt-4 font-brush">
          全集中の呼吸で挑め
        </div>
      </div>
    </main>
  )
}
