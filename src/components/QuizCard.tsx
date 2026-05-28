'use client'

import Image from 'next/image'
import { QuizQuestion } from '@/types'

interface QuizCardProps {
  question: QuizQuestion
  selectedChoice: number | null
  submitted: boolean
  onSelect: (index: number) => void
}

const CHOICE_LABELS = ['A', 'B', 'C', 'D']

export default function QuizCard({ question, selectedChoice, submitted, onSelect }: QuizCardProps) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">

      {/* 問題文カード */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <p className="text-lg font-bold text-gray-800 leading-relaxed text-center whitespace-pre-line">
          {question.question}
        </p>
        {question.image && (
          <div className="mt-4 rounded-xl overflow-hidden">
            <Image src={question.image} alt="クイズ画像" width={600} height={300} className="w-full object-cover" />
          </div>
        )}
      </div>

      {/* 回答ボタン群 */}
      <div className="grid grid-cols-2 gap-3">
        {question.choices.map((choice, index) => {
          const isSelected = selectedChoice === index
          return (
            <button
              key={index}
              className={`flex items-center gap-2 p-4 rounded-xl text-left font-bold w-full transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md'
                  : submitted
                  ? 'bg-gray-100 text-gray-400 opacity-50 cursor-default'
                  : 'bg-white border-2 border-gray-200 text-gray-800 hover:border-indigo-400 hover:bg-indigo-50'
              }`}
              onClick={() => !submitted && onSelect(index)}
              disabled={submitted}
            >
              <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm ${
                isSelected
                  ? 'bg-white text-indigo-600'
                  : 'bg-indigo-100 text-indigo-700'
              }`}>
                {CHOICE_LABELS[index]}
              </span>
              <span className="text-sm leading-snug flex-1">{choice}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
