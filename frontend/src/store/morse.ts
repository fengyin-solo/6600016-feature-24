import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { MORSE_TABLE, REVERSE_TABLE, textToMorse, morseToText } from '../utils/morse-code'
import type { TrainMode, QuizType, HistoryEntry, ScoreRecord } from '../types'

const WORD_BANK = [
  'HELLO', 'WORLD', 'MORSE', 'CODE', 'RADIO', 'SIGNAL',
  'SOS', 'HELP', 'OVER', 'OUT', 'COPY', 'ROGER',
  'ALPHA', 'BRAVO', 'DELTA', 'ECHO', 'GOLF', 'HOTEL',
  'INDIA', 'LIMA', 'OSCAR', 'ROMEO', 'SIERRA', 'TANGO',
  'VICTOR', 'WHISKEY', 'YANKEE', 'ZULU',
  'CQ', 'QRZ', 'QRM', 'QRN', 'QTH', 'QSL',
  'ANTENNA', 'BEACON', 'CALLSIGN', 'FREQUENCY',
  'TRANSMIT', 'RECEIVE', 'STATION', 'CONTACT',
  'NIGHT', 'DAY', 'SUN', 'MOON', 'STAR', 'FIRE',
  'WATER', 'EARTH', 'WIND', 'RAIN', 'SNOW', 'STORM',
  'SHIP', 'BOAT', 'PLANE', 'TRAIN', 'CAR', 'BIKE',
  'NORTH', 'SOUTH', 'EAST', 'WEST',
  'ATTACK', 'RETREAT', 'ADVANCE', 'DEFEND',
]

export const useMorseStore = defineStore('morse', () => {
  const inputText = ref('')
  const morseOutput = ref('')
  const decodedText = ref('')
  const wpm = ref(15)
  const frequency = ref(700)
  const volume = ref(0.6)
  const trainMode = ref<TrainMode>('charToCode')
  const quizType = ref<QuizType>('char')
  const history = ref<HistoryEntry[]>([])
  const quizChar = ref('')
  const userAnswer = ref('')
  const charScore = ref<ScoreRecord>({ correct: 0, total: 0 })
  const wordScore = ref<ScoreRecord>({ correct: 0, total: 0 })
  const isPlaying = ref(false)
  let audioCtx: AudioContext | null = null
  let currentOscillator: OscillatorNode | null = null

  const dotDuration = computed(() => 1200 / wpm.value)

  const score = computed<ScoreRecord>(() => ({
    correct: charScore.value.correct + wordScore.value.correct,
    total: charScore.value.total + wordScore.value.total,
  }))

  function getAudioCtx(): AudioContext {
    if (!audioCtx) audioCtx = new AudioContext()
    return audioCtx
  }

  function playTone(duration: number): Promise<void> {
    return new Promise(resolve => {
      const ctx = getAudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = frequency.value
      gain.gain.value = volume.value
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      currentOscillator = osc
      setTimeout(() => { osc.stop(); currentOscillator = null; resolve() }, duration)
    })
  }

  async function playMorse(morse: string) {
    isPlaying.value = true
    const dd = dotDuration.value
    for (const token of morse.split(' ')) {
      if (token === '/') { await sleep(dd * 7); continue }
      for (const sym of token) {
        await playTone(sym === '.' ? dd : dd * 3)
        await sleep(dd)
      }
      await sleep(dd * 2)
    }
    isPlaying.value = false
  }

  function sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms))
  }

  function encode() {
    morseOutput.value = textToMorse(inputText.value)
  }

  function decode() {
    decodedText.value = morseToText(inputText.value)
  }

  function generateQuiz() {
    if (quizType.value === 'char') {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      quizChar.value = chars[Math.floor(Math.random() * chars.length)]
    } else {
      quizChar.value = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)]
    }
    userAnswer.value = ''
  }

  function checkAnswer() {
    let correct: boolean
    const expected = textToMorse(quizChar.value)
    if (quizType.value === 'char') {
      correct = userAnswer.value.trim() === MORSE_TABLE[quizChar.value]
    } else {
      correct = userAnswer.value.trim() === expected
    }
    if (quizType.value === 'char') {
      charScore.value.total++
      if (correct) charScore.value.correct++
    } else {
      wordScore.value.total++
      if (correct) wordScore.value.correct++
    }
    history.value.unshift({
      id: Date.now(), input: quizChar.value, output: userAnswer.value,
      correct, timestamp: Date.now(), quizType: quizType.value
    })
    generateQuiz()
  }

  function resetScore() {
    charScore.value = { correct: 0, total: 0 }
    wordScore.value = { correct: 0, total: 0 }
    history.value = []
  }

  function setQuizType(type: QuizType) {
    quizType.value = type
    quizChar.value = ''
    userAnswer.value = ''
  }

  return {
    inputText, morseOutput, decodedText, wpm, frequency, volume,
    trainMode, quizType, history, quizChar, userAnswer,
    charScore, wordScore, score, isPlaying,
    dotDuration, encode, decode, playMorse, playTone,
    generateQuiz, checkAnswer, resetScore, setQuizType
  }
})
