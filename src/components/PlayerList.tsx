'use client'

import { Player } from '@/types'

interface PlayerListProps {
  players: Player[]
  answeredPlayerIds: string[]
  currentQuestion: number
  totalQuestions: number
}

export default function PlayerList({
  players,
  answeredPlayerIds,
  currentQuestion,
  totalQuestions,
}: PlayerListProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)

  return (
    <div className="bg-white rounded-2xl shadow-lg p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-700">プレイヤー一覧</h2>
        <span className="text-sm text-gray-500">
          {answeredPlayerIds.length} / {players.length} 回答済み
        </span>
      </div>

      <div className="space-y-2">
        {sortedPlayers.map((player) => {
          const hasAnswered = answeredPlayerIds.includes(player.id)
          return (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-3 h-3 rounded-full ${
                    hasAnswered ? 'bg-green-400' : 'bg-gray-300'
                  }`}
                />
                <span className="font-medium text-gray-800">{player.nickname}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {player.score} / {currentQuestion} 正解
                </span>
                {hasAnswered && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    回答済み
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
