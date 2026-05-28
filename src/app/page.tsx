'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

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
    const { data } = await supabase.from('rooms').select('id, status').eq('code', code).maybeSingle()
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
    <main className="relative overflow-hidden bg-black" style={{ height: '100dvh' }}>

      {/* ── 全画面背景画像 ── */}
      <div className="absolute inset-0">
        <Image
          src="/assets/title_background.png"
          alt="鬼滅クイズ"
          fill
          className="object-cover"
          style={{ objectPosition: 'center center' }}
          priority
        />
      </div>

      {/* ── トップ画面：ブラシストローク上に透明ボタンを重ねる ── */}
      {mode === 'top' && (
        <div className="absolute inset-0 z-10">

          {/* 左ボタン「戦場を開く（GM）」
              画像内のブラシストローク位置: x≈3.5%〜32%, y≈79%〜96% */}
          <button
            onClick={createRoom}
            disabled={loading}
            className="title-btn"
            style={{ left: '3.5%', top: '79%', width: '29%', height: '17%' }}
          >
            <span className="title-btn-text" style={{ color: '#ffe8b0' }}>
              {loading ? '準備中...' : '⚔️ 戦場を開く（GM）'}
            </span>
          </button>

          {/* 中央ボタン「戦に参加する」
              画像内のブラシストローク位置: x≈35%〜63%, y≈79%〜96% */}
          <button
            onClick={() => setMode('join')}
            className="title-btn"
            style={{ left: '35.5%', top: '79%', width: '28%', height: '17%' }}
          >
            <span className="title-btn-text" style={{ color: '#c8e8ff' }}>
              🔥 戦に参加する
            </span>
          </button>

          {error && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 ornate-card rounded-xl p-3 w-80 max-w-[90vw]">
              <p className="text-[#f08080] text-sm text-center font-bold font-brush">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* ── 参加モード：ブラー暗幕 + ルームコード入力 ── */}
      {mode === 'join' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm space-y-3">

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
                autoFocus
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
              className="w-full py-3 font-brush tracking-wider text-sm hover:opacity-80 transition-opacity"
              style={{ color: '#f5ede0', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
            >
              ← 戻る
            </button>

            {error && (
              <div className="ornate-card rounded-xl p-3">
                <p className="text-[#f08080] text-sm text-center font-bold font-brush">{error}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
