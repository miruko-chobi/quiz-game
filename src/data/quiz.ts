import { QuizQuestion } from '@/types'

export const QUIZ_DATA: QuizQuestion[] = [
  {
    id: 0,
    question: '日本で一番高い山はどれ？',
    image: null,
    type: '4choice',
    choices: ['白山', '富士山', '穂高岳', '北岳'],
    correct: 1,
  },
  {
    id: 1,
    question: 'サッカーワールドカップで日本が初めてベスト16に進出したのはいつ？',
    image: null,
    type: '4choice',
    choices: ['1994年 アメリカ大会', '1998年 フランス大会', '2002年 日韓大会', '2006年 ドイツ大会'],
    correct: 2,
  },
  {
    id: 2,
    question: '「アンパンマン」の作者は誰？',
    image: null,
    type: '2choice',
    choices: ['手塚治虫', 'やなせたかし'],
    correct: 1,
  },
]

export const TOTAL_QUESTIONS = QUIZ_DATA.length
