import { QuizQuestion } from '@/types'

export const QUIZ_DATA: QuizQuestion[] = [
  {
    id: 0,
    question: '鬼滅の刃第1話で炭治郎が義勇に向かって投げた武器は次のうちどれ？',
    image: null,
    type: '4choice',
    choices: ['刀', '斧', '鎌', '槍'],
    correct: 1,
  },
  {
    id: 1,
    question: '那谷蜘蛛山で義勇が累を倒した時に使った技は？',
    image: null,
    type: '4choice',
    choices: ['壱ノ型　水面斬り', '肆ノ型　打ち潮', '陸ノ型　ねじれ渦', '拾壱ノ型　凪'],
    correct: 3,
  },
  {
    id: 2,
    question: '那谷蜘蛛山で累が消えたあとの炭治郎のセリフです。（　）に入る言葉は？\n「鬼は人間だったんだから。俺と同じ人間だったんだから。(　　)をどけてください。」',
    image: null,
    type: '4choice',
    choices: ['手', '足', '刀', '腕'],
    correct: 1,
  },
  {
    id: 3,
    question: '柱合会議で不死川に押さえつけられている状態の炭治郎から見た義勇は、左右どちらを向いている？',
    image: null,
    type: '2choice',
    choices: ['右', '左'],
    correct: 0,
  },
  {
    id: 4,
    question: '【アニオリ】柱合会議後、任務に出発する炭治郎の元を訪れた義勇が「続けると良い」と言ったのは？',
    image: null,
    type: '4choice',
    choices: ['基礎体力の向上', '水の呼吸の修練', '全集中の呼吸・常中', 'ヒノカミ神楽の体得'],
    correct: 2,
  },
  {
    id: 5,
    question: '柱稽古編。炭治郎が義勇の屋敷を訪ねた回は単行本で第何話？',
    image: null,
    type: '4choice',
    choices: ['第130話', '第131話', '第132話', '第133話'],
    correct: 0,
  },
]

export const TOTAL_QUESTIONS = QUIZ_DATA.length
