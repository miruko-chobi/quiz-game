'use client'

import { Player } from '@/types'

interface WaitingRoomProps {
  players: Player[]
  roomCode: string
}

export default function WaitingRoom({ players, roomCode }: WaitingRoomProps) {
  return (
    <div className="w-full max-w-md mx-auto text-center space-y-5">

      {/* 合言葉表示 */}
      <div className="washi-card rounded-2xl p-8">
        <p className="text-xs text-[#8a6a30] mb-2 tracking-[0.3em] font-brush">― 合言葉 ―</p>
        <p className="text-5xl font-extrabold tracking-[0.3em] text-[#8c1c2f] mb-3 font-brush">
          {roomCode}
        </p>
        <div className="kimetsu-divider text-xs my-2">
          <span className="text-[#c8a252]">⚔️</span>
        </div>
        <p className="text-sm text-[#5a3a10] font-brush">この合言葉を仲間に伝えよ</p>
      </div>

      {/* 参加者一覧 */}
      <div className="washi-card rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-extrabold text-[#1a1208] font-brush tracking-wider">
            ⚔️ 隊員一覧
          </h3>
          <span className="text-sm text-[#5a3a10] font-brush">{players.length}名</span>
        </div>

        {players.length === 0 ? (
          <p className="text-[#8a6a30] text-sm py-4 font-brush">
            仲間の到着を待っとうよ、、、
          </p>
        ) : (
          <ul className="space-y-2">
            {players.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg"
                style={{ background: 'rgba(26, 66, 40, 0.08)', border: '1px solid rgba(200,162,82,0.3)' }}
              >
                <span className="w-2 h-2 rounded-full bg-[#1a8a40] shadow-[0_0_6px_#1a8a40]" />
                <span className="font-bold text-[#1a1208] font-brush">{p.nickname}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="kimetsu-divider text-xs mt-4 mb-2">
          <span className="text-[#c8a252] text-xs">◆</span>
        </div>
        <p className="text-xs text-[#8a6a30] font-brush">指令官がゲームを開始するまでお待ちください</p>
      </div>
    </div>
  )
}
