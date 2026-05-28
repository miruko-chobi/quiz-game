'use client'

import Image from 'next/image'
import { QuizQuestion } from '@/types'

interface QuizCardProps {
  question: QuizQuestion
  selectedChoice: number | null
  submitted: boolean
  onSelect: (index: number) => void
}

// 左列（炎）：壱・参、右列（水）：弐・肆
const CHOICE_LABELS = ['壱', '弐', '参', '肆']
const CHOICE_ICONS  = ['🔥', '💧', '🔥', '💧']

export default function QuizCard({ question, selectedChoice, submitted, onSelect }: QuizCardProps) {
  // 2択は左右に並べる、4択も左右2列
  const isTwoChoice = question.type === '2choice'

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">

      {/* ── 問題文カード ── */}
      <div className="ornate-card rounded-2xl p-6 relative">
        {/* 四隅の装飾 */}
        <span aria-hidden className="absolute top-2 left-3 text-[#c8a252] text-xs opacity-70">◆</span>
        <span aria-hidden className="absolute top-2 right-3 text-[#c8a252] text-xs opacity-70">◆</span>
        <span aria-hidden className="absolute bottom-2 left-3 text-[#c8a252] text-xs opacity-70">◆</span>
        <span aria-hidden className="absolute bottom-2 right-3 text-[#c8a252] text-xs opacity-70">◆</span>

        <p className="text-lg font-bold text-[#f5ede0] leading-relaxed font-brush text-center px-2 whitespace-pre-line">
          {question.question}
        </p>
        {question.image && (
          <div className="mt-4 rounded-xl overflow-hidden border border-[#c8a252]">
            <Image src={question.image} alt="クイズ画像" width={600} height={300} className="w-full object-cover" />
          </div>
        )}
      </div>

      {/* ── 回答ボタン群 ── */}
      <div className="grid grid-cols-2 gap-3">
        {question.choices.map((choice, index) => {
          const isLeft   = index % 2 === 0   // 左列 = 炎
          const base     = isLeft ? 'btn-fire' : 'btn-water'
          const isSelected = selectedChoice === index

          let cls = `${base} flex items-center gap-2 p-4 rounded-xl text-left font-bold w-full`
          if (isSelected) cls += ' selected'
          if (submitted)  cls += ' submitted'
          // 2択の場合は1行で横並び
          if (isTwoChoice && question.choices.length === 2) {
            cls += ' justify-center text-center'
          }

          return (
            <button
              key={index}
              className={cls}
              onClick={() => !submitted && onSelect(index)}
              disabled={submitted}
            >
              {/* ラベル丸 */}
              <span
                className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-sm font-brush"
                style={{
                  background: isSelected
                    ? 'rgba(255,255,255,0.2)'
                    : isLeft
                      ? 'rgba(180, 60, 20, 0.4)'
                      : 'rgba(20, 80, 160, 0.4)',
                  border: isLeft ? '1px solid #e07030' : '1px solid #3a80c0',
                  color: isLeft ? '#f8d080' : '#80c0f0',
                }}
              >
                {CHOICE_LABELS[index]}
              </span>
              <span className="font-brush text-sm leading-snug flex-1">
                {CHOICE_ICONS[index]} {choice}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
