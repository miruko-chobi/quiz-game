'use client'

import Image from 'next/image'
import { QuizQuestion } from '@/types'

interface QuizCardProps {
  question: QuizQuestion
  selectedChoice: number | null
  submitted: boolean
  onSelect: (index: number) => void
}

const CHOICE_KANJI = ['壱', '弐', '参', '肆']

export default function QuizCard({ question, selectedChoice, submitted, onSelect }: QuizCardProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">

      {/* 問題文 */}
      <div className="washi-card rounded-2xl p-6 mb-5">
        <p className="text-lg font-bold text-[#1a1208] leading-relaxed font-brush">
          {question.question}
        </p>
        {question.image && (
          <div className="mt-4 rounded-xl overflow-hidden border border-[#c8a252]">
            <Image
              src={question.image}
              alt="クイズ画像"
              width={600}
              height={300}
              className="w-full object-cover"
            />
          </div>
        )}
      </div>

      {/* 選択肢 */}
      <div className={`grid gap-3 ${question.type === '2choice' ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {question.choices.map((choice, index) => {
          const isSelected = selectedChoice === index
          let className = 'choice-btn flex items-center gap-3 p-4 rounded-xl text-left font-bold'
          if (submitted) {
            className += isSelected ? ' selected submitted' : ' submitted opacity-60'
          } else if (isSelected) {
            className += ' selected'
          }

          return (
            <button
              key={index}
              className={className}
              onClick={() => !submitted && onSelect(index)}
              disabled={submitted}
            >
              <span
                className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-sm font-brush"
                style={
                  isSelected
                    ? { background: 'rgba(255,255,255,0.25)', color: '#f5ede0', border: '1px solid rgba(255,255,255,0.4)' }
                    : { background: 'linear-gradient(135deg, #1a4228, #0d2818)', color: '#c8a252', border: '1px solid #c8a252' }
                }
              >
                {CHOICE_KANJI[index]}
              </span>
              <span className="font-brush text-sm leading-snug">{choice}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
