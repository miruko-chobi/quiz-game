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
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">

      {/* ── 右半分オーバーレイ（冨岡カラー） ── */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        {/* 右半分を深えんじ色で染める */}
        <div className="absolute right-0 top-0 w-1/2 h-full"
          style={{ background: 'linear-gradient(to right, transparent 0%, #2d0810 25%)' }} />
        {/* 右半分に亀甲ラティス */}
        <div className="absolute right-0 top-0 w-1/2 h-full"
          style={{
            backgroundImage:
              'linear-gradient(45deg, rgba(200,162,82,0.16) 2px, transparent 2px), linear-gradient(-45deg, rgba(200,162,82,0.16) 2px, transparent 2px)',
            backgroundSize: '22px 22px',
          }} />
        {/* 左右の境界グロー */}
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-px"
          style={{ background: 'linear-gradient(to bottom, transparent 0%, #c8a252 20%, #e8d080 50%, #c8a252 80%, transparent 100%)', opacity: 0.5 }} />
      </div>

      {/* ── 背景装飾漢字 ── */}
      <div aria-hidden className="fixed pointer-events-none select-none z-0"
        style={{ left: '4%', top: '50%', transform: 'translateY(-50%)', fontSize: '22rem', lineHeight: 1, fontFamily: "'Shippori Mincho B1', serif", fontWeight: 800, color: 'rgba(255,255,255,0.035)' }}>
        炎
      </div>
      <div aria-hidden className="fixed pointer-events-none select-none z-0"
        style={{ right: '3%', top: '50%', transform: 'translateY(-50%)', fontSize: '22rem', lineHeight: 1, fontFamily: "'Shippori Mincho B1', serif", fontWeight: 800, color: 'rgba(106,180,212,0.06)' }}>
        凪
      </div>

      {/* ── 中央の刀 ── */}
      <div aria-hidden className="fixed left-1/2 top-0 bottom-0 -translate-x-1/2 flex flex-col items-center z-[1] pointer-events-none">
        {/* 刃先 */}
        <div style={{ width: 3, height: '18vh', background: 'linear-gradient(to bottom, transparent, #c8a252 80%)' }} />
        {/* 刀身 上 */}
        <div style={{ width: 3, height: '22vh', background: 'linear-gradient(to bottom, #c8a252, #e8d880 30%, #c8a090 70%, #b07830)' }} />
        {/* 鍔（つば） */}
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'radial-gradient(circle, #e8c860 0%, #b08020 50%, #604010 100%)',
          border: '2px solid #e8d060',
          boxShadow: '0 0 10px rgba(200,162,82,0.7), 0 0 24px rgba(200,162,82,0.3)',
          flexShrink: 0,
        }} />
        {/* 柄（つか） */}
        <div style={{
          width: 5, flexGrow: 1,
          background: 'repeating-linear-gradient(135deg, #3a1a04 0px, #3a1a04 4px, #6a3010 4px, #6a3010 8px)',
          maxHeight: '35vh',
        }} />
        {/* 柄頭 */}
        <div style={{
          width: 14, height: 14, borderRadius: '50%',
          background: 'radial-gradient(circle, #c8a252 0%, #7a5010 100%)',
          flexShrink: 0, marginBottom: '10vh',
        }} />
      </div>

      {/* ── メインコンテンツ ── */}
      <div className="relative z-10 w-full max-w-sm px-6 space-y-5">

        {/* タイトル */}
        <div className="text-center mb-8">
          <div className="text-xs tracking-[0.4em] text-[#c8a252] mb-3 font-brush">
            ― 鬼殺隊　公認 ―
          </div>
          <h1 className="text-6xl font-extrabold title-glow font-brush mb-3 leading-tight">
            鬼滅クイズ
          </h1>
          <div className="kimetsu-divider text-xs my-3">
            <span className="text-[#c8a252]">⚔️</span>
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
              {loading ? '戦場を準備中...' : '⚔️ 戦場を開く（GM）'}
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
          <div className="ornate-card rounded-xl p-3">
            <p className="text-[#f08080] text-sm text-center font-bold font-brush">{error}</p>
          </div>
        )}

        <p className="text-center text-[#2a4a2a] text-xs font-brush tracking-wider">全集中の呼吸で挑め</p>
      </div>
    </main>
  )
}
