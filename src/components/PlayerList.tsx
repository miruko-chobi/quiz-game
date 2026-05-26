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
    <div className="washi-card rounded-2xl p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-extrabold text-[#1a1208] font-brush tracking-wider">刃 隊員一覧</h2>
        <span className="text-sm text-[#5a3a10] font-brush">
          {answeredPlayerIds.length} / {players.length} 回答済
        </span>
      </div>

      <div className="space-y-2">
        {sortedPlayers.map((player) => {
          const hasAnswered = answeredPlayerIds.includes(player.id)
          return (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 rounded-xl"
              style={
                hasAnswered
                  ? { background: 'rgba(26,66,40,0.12)', border: '1px solid rgba(58,138,80,0.4)' }
                  : { background: 'rgba(26,18,8,0.06)', border: '1px solid rgba(200,162,82,0.2)' }
              }
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-3 h-3 rounded-full"
                  style={
                    hasAnswered
                      ? { background: '#3adc70', boxShadow: '0 0 6px #3adc70' }
                      : { background: '#8a7a60' }
                  }
                />
                <span className="font-bold text-[#1a1208] font-brush">{player.nickname}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#5a3a10] font-brush">
                  {player.score} / {currentQuestion}
                </span>
                {hasAnswered && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-brush font-bold"
                    style={{ background: 'linear-gradient(135deg, #1a4228, #0d2818)', color: '#7adc8a', border: '1px solid #3a8a50' }}
                  >
                    回答済
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
