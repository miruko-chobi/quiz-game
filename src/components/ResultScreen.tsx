'use client'

import { Player, Answer } from '@/types'
import { QUIZ_DATA } from '@/data/quiz'

interface ResultScreenProps {
  player: Player
  allPlayers: Player[]
  answers: Answer[]
}

export default function ResultScreen({ player, allPlayers, answers }: ResultScreenProps) {
  const sorted = [...allPlayers].sort((a, b) => b.score - a.score)
  const rank = sorted.findIndex((p) => p.id === player.id) + 1

  const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}位`

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5">

      {/* 自分の結果 */}
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
        <div className="text-4xl mb-2">{rankEmoji}</div>
        <h2 className="text-2xl font-extrabold text-gray-800 mb-1">{player.nickname}</h2>
        <p className="text-gray-500 text-sm mb-4">第{rank}位</p>
        <div className="inline-block bg-indigo-50 rounded-xl px-8 py-4">
          <span className="text-5xl font-extrabold text-indigo-600">{player.score}</span>
          <span className="text-xl text-gray-500 ml-2">/ {QUIZ_DATA.length}</span>
          <p className="text-sm text-gray-500 mt-1">正解数</p>
        </div>
      </div>

      {/* 各問の正誤 */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="font-extrabold text-gray-800 mb-4">📋 各問の結果</h3>
        <div className="space-y-3">
          {QUIZ_DATA.map((q, i) => {
            const ans = answers.find((a) => a.question_index === i)
            const isCorrect = ans?.is_correct ?? false
            const selectedLabel = ans != null ? q.choices[ans.selected_choice] : '未回答'

            return (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-xl border ${
                  isCorrect
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold text-white ${
                  isCorrect ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {isCorrect ? '○' : '✕'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800">{q.question}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    あなたの答え：<span className="font-bold">{selectedLabel}</span>
                  </p>
                  {!isCorrect && (
                    <p className="text-xs text-green-600 mt-0.5 font-bold">
                      正解：{q.choices[q.correct]}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 順位表 */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="font-extrabold text-gray-800 mb-4">🏆 最終順位</h3>
        <div className="space-y-2">
          {sorted.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center justify-between p-3 rounded-xl ${
                p.id === player.id
                  ? 'bg-indigo-50 border-2 border-indigo-300'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 text-center font-extrabold text-sm">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}位`}
                </span>
                <span className={`font-bold text-sm ${p.id === player.id ? 'text-indigo-700' : 'text-gray-800'}`}>
                  {p.nickname}
                  {p.id === player.id && <span className="text-xs ml-1 text-gray-400">（あなた）</span>}
                </span>
              </div>
              <span className="font-bold text-gray-700 text-sm">
                {p.score} / {QUIZ_DATA.length}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
