'use client'

import { Player, Answer } from '@/types'
import { QUIZ_DATA } from '@/data/quiz'

interface ResultScreenProps {
  player: Player
  allPlayers: Player[]
  answers: Answer[]
}

const RANK_LABELS = ['壱之位', '弐之位', '参之位']
const RANK_COLORS = ['#c8a252', '#9a9a9a', '#c87040']

export default function ResultScreen({ player, allPlayers, answers }: ResultScreenProps) {
  const sorted = [...allPlayers].sort((a, b) => b.score - a.score)
  const rank = sorted.findIndex((p) => p.id === player.id) + 1

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5">

      {/* 自分の結果 */}
      <div className="washi-card rounded-2xl p-8 text-center">
        <div className="text-3xl mb-2 font-brush font-extrabold" style={{ color: rank <= 3 ? RANK_COLORS[rank - 1] : '#5a3a10' }}>
          {rank <= 3 ? RANK_LABELS[rank - 1] : `第${rank}位`}
        </div>
        <h2 className="text-2xl font-extrabold text-[#1a1208] mb-1 font-brush">{player.nickname}</h2>
        <div className="kimetsu-divider text-xs my-3" style={{ '--kd-color': '#c8a252' } as React.CSSProperties}>
          <span className="text-[#c8a252]">◆</span>
        </div>
        <div
          className="inline-block rounded-xl px-8 py-4 border-2"
          style={{ background: 'linear-gradient(135deg, #1a4228, #0d2818)', borderColor: '#c8a252' }}
        >
          <span className="text-5xl font-extrabold text-[#c8a252] font-brush">{player.score}</span>
          <span className="text-xl text-[#a0c8a0] ml-2 font-brush">/ {QUIZ_DATA.length}</span>
          <p className="text-sm text-[#7ab07a] mt-1 font-brush">正解数</p>
        </div>
      </div>

      {/* 各問の正誤 */}
      <div className="washi-card rounded-2xl p-5">
        <h3 className="font-extrabold text-[#1a1208] mb-4 font-brush tracking-wider">⚔️ 各問の戦績</h3>
        <div className="space-y-3">
          {QUIZ_DATA.map((q, i) => {
            const ans = answers.find((a) => a.question_index === i)
            const isCorrect = ans?.is_correct ?? false
            const selectedLabel = ans != null ? q.choices[ans.selected_choice] : '未回答'

            return (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: isCorrect ? 'rgba(26, 66, 40, 0.1)' : 'rgba(140, 28, 47, 0.08)', border: '1px solid rgba(200,162,82,0.25)' }}
              >
                <span
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold font-brush"
                  style={
                    isCorrect
                      ? { background: 'linear-gradient(135deg, #1a4228, #0d2818)', color: '#7adc8a', border: '1px solid #3a8a50' }
                      : { background: 'linear-gradient(135deg, #8c1c2f, #5a0f1f)', color: '#f5b0b0', border: '1px solid #8c1c2f' }
                  }
                >
                  {isCorrect ? '◯' : '✕'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#1a1208] font-brush">{q.question}</p>
                  <p className="text-xs text-[#5a3a10] mt-0.5 font-brush">
                    あなたの答え：<span className="font-bold">{selectedLabel}</span>
                  </p>
                  {!isCorrect && (
                    <p className="text-xs text-[#1a6a30] mt-0.5 font-bold font-brush">
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
      <div className="washi-card rounded-2xl p-5">
        <h3 className="font-extrabold text-[#1a1208] mb-4 font-brush tracking-wider">🏆 最終順位</h3>
        <div className="space-y-2">
          {sorted.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-3 rounded-xl"
              style={
                p.id === player.id
                  ? { background: 'linear-gradient(135deg, rgba(140,28,47,0.12), rgba(140,28,47,0.06))', border: '1.5px solid #c8a252' }
                  : { background: 'rgba(26,66,40,0.06)', border: '1px solid rgba(200,162,82,0.2)' }
              }
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-8 text-center font-extrabold text-sm font-brush"
                  style={{ color: i < 3 ? RANK_COLORS[i] : '#5a3a10' }}
                >
                  {i < 3 ? RANK_LABELS[i] : `${i + 1}位`}
                </span>
                <span className={`font-bold font-brush text-sm ${p.id === player.id ? 'text-[#8c1c2f]' : 'text-[#1a1208]'}`}>
                  {p.nickname}
                  {p.id === player.id && <span className="text-xs ml-1 text-[#c8a252]">（あなた）</span>}
                </span>
              </div>
              <span className="font-bold text-[#1a4228] font-brush text-sm">
                {p.score} / {QUIZ_DATA.length}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
