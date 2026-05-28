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
    <main className="relative min-h-screen overflow-hidden">

      {/* ── 背景画像 ── */}
      <div className="absolute inset-0">
        <Image
          src="/assets/title_bg.png"
          alt="鬼滅クイズ"
          fill
          className="object-cover object-center"
          priority
        />
      </div>

      {/* ── トップ：ボタン2つ（画面下部・横並び） ── */}
      {mode === 'top' && (
        <>
          <div className="absolute bottom-10 left-0 right-0 z-10 flex justify-center gap-5 px-8">

            {/* 赤ボタン：戦場を開く（GM） */}
            <button
              onClick={createRoom}
              disabled={loading}
              className="relative flex-1 max-w-[240px] transition-transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:pointer-events-none"
            >
              <Image
                src="/assets/btn_setting_red.png"
                alt="戦場を開く（GM）"
                width={480}
                height={160}
                className="w-full h-auto drop-shadow-2xl"
              />
              <span
                className="absolute inset-0 flex items-center justify-center font-brush font-bold text-base leading-tight px-2 text-center"
                style={{
                  color: '#fff8e8',
                  textShadow: '0 1px 6px rgba(0,0,0,0.95), 0 0 14px rgba(0,0,0,0.8)',
                }}
              >
                {loading ? '準備中...' : '⚔️ 戦場を開く\n（GM）'}
              </span>
            </button>

            {/* 青ボタン：戦に参加する */}
            <button
              onClick={() => setMode('join')}
              className="relative flex-1 max-w-[240px] transition-transform hover:scale-105 active:scale-95"
            >
              <Image
                src="/assets/btn_setting_blue.png"
                alt="戦に参加する"
                width={480}
                height={160}
                className="w-full h-auto drop-shadow-2xl"
              />
              <span
                className="absolute inset-0 flex items-center justify-center font-brush font-bold text-base leading-tight px-2 text-center"
                style={{
                  color: '#e8f4ff',
                  textShadow: '0 1px 6px rgba(0,0,0,0.95), 0 0 14px rgba(0,0,0,0.8)',
                }}
              >
                🔥 戦に参加する
              </span>
            </button>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="absolute z-10 bottom-36 left-0 right-0 px-6">
              <div className="max-w-sm mx-auto ornate-card rounded-xl p-3">
                <p className="text-[#f08080] text-sm text-center font-bold font-brush">{error}</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── 参加モード：半透明オーバーレイ + ルームコード入力 ── */}
      {mode === 'join' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center px-6">
          {/* 暗幕 */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

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

            {/* 参加ボタン（青） */}
            <button
              onClick={joinRoom}
              disabled={loading || roomCode.length < 4}
              className="relative w-full transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Image
                src="/assets/btn_setting_blue.png"
                alt="参加する"
                width={480}
                height={160}
                className="w-full h-auto drop-shadow-xl"
              />
              <span
                className="absolute inset-0 flex items-center justify-center font-brush font-bold text-lg"
                style={{
                  color: '#e8f4ff',
                  textShadow: '0 1px 6px rgba(0,0,0,0.95)',
                }}
              >
                {loading ? '確認中...' : '🔥 参加する'}
              </span>
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
