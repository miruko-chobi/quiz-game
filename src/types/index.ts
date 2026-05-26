export type RoomStatus = 'waiting' | 'playing' | 'finished'

export interface Room {
  id: string
  code: string
  status: RoomStatus
  current_question: number
  created_at: string
}

export interface Player {
  id: string
  room_id: string
  nickname: string
  is_gm: boolean
  score: number
  created_at: string
}

export interface Answer {
  id: string
  room_id: string
  player_id: string
  question_index: number
  selected_choice: number
  is_correct: boolean
  created_at: string
}

export interface QuizQuestion {
  id: number
  question: string
  image: string | null
  type: '2choice' | '4choice'
  choices: string[]
  correct: number
}
