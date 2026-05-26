'use client'

import { Player } from '@/types'

interface WaitingRoomProps {
  players: Player[]
  roomCode: string
}

export default function WaitingRoom({ players, roomCode }: WaitingRoomProps) {
  return (
    <div className="w-full max-w-md mx-auto text-center space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <p className="text-sm text-gray-500 mb-2">ルームコード</p>
        <p className="text-5xl font-extrabold tracking-widest text-indigo-600 mb-2">{roomCode}</p>
        <p className="text-sm text-gray-400">このコードを友達に共有してね</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-700">参加中のプレイヤー</h3>
          <span className="text-sm text-gray-500">{players.length}人</span>
        </div>
        {players.length === 0 ? (
          <p className="text-gray-400 text-sm py-4">まだ誰も参加していないたい...</p>
        ) : (
          <ul className="space-y-2">
            {players.map((p) => (
              <li key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className="font-medium text-gray-700">{p.nickname}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-gray-400 mt-4">ゲームマスターが開始するまでお待ちください</p>
      </div>
    </div>
  )
}
