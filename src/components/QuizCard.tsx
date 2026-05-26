'use client'

import Image from 'next/image'
import { QuizQuestion } from '@/types'

interface QuizCardProps {
  question: QuizQuestion
  selectedChoice: number | null
  submitted: boolean
  onSelect: (index: number) => void
}

export default function QuizCard({ question, selectedChoice, submitted, onSelect }: QuizCardProps) {
  const choiceLabels = ['A', 'B', 'C', 'D']

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <p className="text-xl font-bold text-gray-800 leading-relaxed">{question.question}</p>
        {question.image && (
          <div className="mt-4 rounded-xl overflow-hidden">
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

      <div className={`grid gap-3 ${question.type === '2choice' ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {question.choices.map((choice, index) => {
          const isSelected = selectedChoice === index
          let btnClass =
            'flex items-center gap-3 p-4 rounded-xl border-2 text-left font-semibold transition-all '

          if (submitted) {
            if (isSelected) {
              btnClass += 'border-indigo-500 bg-indigo-100 text-indigo-800 cursor-default'
            } else {
              btnClass += 'border-gray-200 bg-gray-50 text-gray-400 cursor-default'
            }
          } else if (isSelected) {
            btnClass += 'border-indigo-500 bg-indigo-50 text-indigo-700 scale-[1.02]'
          } else {
            btnClass += 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer'
          }

          return (
            <button
              key={index}
              className={btnClass}
              onClick={() => !submitted && onSelect(index)}
              disabled={submitted}
            >
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                {choiceLabels[index]}
              </span>
              <span>{choice}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
