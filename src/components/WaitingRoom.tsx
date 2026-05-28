'use client'

import { Player } from '@/types'

interface WaitingRoomProps {
  players: Player[]
  roomCode: string
}

export default function WaitingRoom({ players, roomCode }: WaitingRoomProps) {
  return (
    <div className="w-full max-w-md mx-auto text-center space-y-5">

      {/* ルームコード表示 */}
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <p className="text-sm text-gray-500 mb-2">ルームコード</p>
        <p className="text-5xl font-extrabold tracking-[0.3em] text-indigo-700 mb-3">
          {roomCode}
        </p>
        <p className="text-sm text-gray-500">このコードを仲間に伝えてください</p>
      </div>

      {/* 参加者一覧 */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-extrabold text-gray-800">👥 参加者一覧</h3>
          <span className="text-sm text-gray-500">{players.length}人</span>
        </div>

        {players.length === 0 ? (
          <p className="text-gray-400 text-sm py-4">参加者を待っています...</p>
        ) : (
          <ul className="space-y-2">
            {players.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 px-3 py-2 bg-indigo-50 rounded-lg"
              >
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className="font-bold text-gray-800">{p.nickname}</span>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-gray-400 mt-4">GMがゲームを開始するまでお待ちください</p>
      </div>
    </div>
  )
}
