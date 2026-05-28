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
    <>
      {/*
       * ── 背景画像：position fixed + next/image で iOS 完全対応 ──
       *
       * ポイント：
       * 1. fixed コンテナ → ビューポート直参照、親の height: dvh 問題を回避
       * 2. next/image → 9.6MB の PNG を自動で WebP 変換＋モバイル用にリサイズ
       *    iOS Safari は CSS background-image で 5MB 超の画像を無視する場合がある
       * 3. sizes="100vw" → ビューポート幅に合わせた最適サイズを配信
       */}
      <div
        aria-hidden
        style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      >
        <Image
          src="/assets/title_background.png"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </div>

      {/* ── トップ画面：ブラシストローク上に fixed オーバーレイボタン ── */}
      {mode === 'top' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10 }}>

          {/* 左ブラシストローク「戦場を開く（GM）」x: 3.5〜32%, y: 79〜96% */}
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

          {/* 中央ブラシストローク「戦に参加する」x: 35.5〜63%, y: 79〜96% */}
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
            <div
              style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)' }}
              className="ornate-card rounded-xl p-3 w-80 max-w-[90vw]"
            >
              <p className="text-[#f08080] text-sm text-center font-bold font-brush">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* ── 参加モード：fixed ブラー暗幕 + ルームコード入力 ── */}
      {mode === 'join' && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 1.5rem' }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }} />
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

      {/* スクロール防止用のダミー（高さを持たせてbodyがスクロールしないように） */}
      <div style={{ height: '100dvh' }} aria-hidden />
    </>
  )
}
