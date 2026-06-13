<template>
  <div class="flex flex-col gap-4">
    <div class="flex gap-2">
      <button v-for="qt in quizTypes" :key="qt.id" @click="store.setQuizType(qt.id)"
        class="px-4 py-2 rounded text-sm font-medium"
        :class="store.quizType === qt.id ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'">
        {{ qt.label }}
      </button>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div class="bg-gray-900 rounded-xl p-4">
        <h3 class="text-amber-300 font-bold mb-3">
          {{ store.quizType === 'char' ? '听音/看码 猜字符' : '听音/看码 猜词组' }}
        </h3>
        <div v-if="!store.quizChar" class="text-center py-8">
          <button @click="store.generateQuiz()" class="bg-amber-500 text-black px-6 py-3 rounded-lg text-lg hover:bg-amber-400">
            开始训练
          </button>
        </div>
        <div v-else class="flex flex-col items-center gap-4">
          <div :class="store.quizType === 'char' ? 'text-8xl' : 'text-5xl'" class="font-bold text-amber-400">{{ store.quizChar }}</div>
          <button @click="store.playMorse(textToMorse(store.quizChar))" :disabled="store.isPlaying"
            class="bg-green-600 px-4 py-2 rounded hover:bg-green-500 disabled:opacity-50">
            {{ store.isPlaying ? '播放中...' : '🔊 播放音频' }}
          </button>
          <div class="text-xl font-mono text-green-400">{{ textToMorse(store.quizChar) }}</div>
          <input v-model="store.userAnswer" @keyup.enter="store.checkAnswer()"
            class="bg-gray-800 rounded px-4 py-2 text-center text-xl w-72" :placeholder="store.quizType === 'char' ? '输入莫尔斯码' : '输入莫尔斯码（字符间用空格分隔）'" />
          <button @click="store.checkAnswer()" class="bg-amber-500 text-black px-6 py-2 rounded hover:bg-amber-400">
            确认
          </button>
        </div>
      </div>

      <div class="bg-gray-900 rounded-xl p-4 flex flex-col gap-3">
        <div class="flex justify-between items-center">
          <h3 class="text-amber-300 font-bold">训练统计</h3>
          <button @click="store.resetScore()" class="text-red-400 text-sm hover:underline">重置</button>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="bg-gray-800 rounded p-3">
            <div class="text-xs text-gray-400 mb-2 text-center font-medium">字符练习</div>
            <div class="grid grid-cols-3 gap-1 text-center">
              <div>
                <div class="text-lg font-bold text-green-400">{{ store.charScore.correct }}</div>
                <div class="text-xs text-gray-400">正确</div>
              </div>
              <div>
                <div class="text-lg font-bold text-red-400">{{ store.charScore.total - store.charScore.correct }}</div>
                <div class="text-xs text-gray-400">错误</div>
              </div>
              <div>
                <div class="text-lg font-bold text-amber-400">
                  {{ store.charScore.total ? Math.round(store.charScore.correct / store.charScore.total * 100) : 0 }}%
                </div>
                <div class="text-xs text-gray-400">正确率</div>
              </div>
            </div>
          </div>
          <div class="bg-gray-800 rounded p-3">
            <div class="text-xs text-gray-400 mb-2 text-center font-medium">词组练习</div>
            <div class="grid grid-cols-3 gap-1 text-center">
              <div>
                <div class="text-lg font-bold text-green-400">{{ store.wordScore.correct }}</div>
                <div class="text-xs text-gray-400">正确</div>
              </div>
              <div>
                <div class="text-lg font-bold text-red-400">{{ store.wordScore.total - store.wordScore.correct }}</div>
                <div class="text-xs text-gray-400">错误</div>
              </div>
              <div>
                <div class="text-lg font-bold text-amber-400">
                  {{ store.wordScore.total ? Math.round(store.wordScore.correct / store.wordScore.total * 100) : 0 }}%
                </div>
                <div class="text-xs text-gray-400">正确率</div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-gray-800 rounded p-2">
          <div class="grid grid-cols-3 gap-1 text-center">
            <div>
              <div class="text-lg font-bold text-green-400">{{ store.score.correct }}</div>
              <div class="text-xs text-gray-400">总正确</div>
            </div>
            <div>
              <div class="text-lg font-bold text-red-400">{{ store.score.total - store.score.correct }}</div>
              <div class="text-xs text-gray-400">总错误</div>
            </div>
            <div>
              <div class="text-lg font-bold text-amber-400">
                {{ store.score.total ? Math.round(store.score.correct / store.score.total * 100) : 0 }}%
              </div>
              <div class="text-xs text-gray-400">总正确率</div>
            </div>
          </div>
        </div>

        <div class="flex gap-2">
          <button v-for="ht in historyFilterOptions" :key="ht.value" @click="historyFilter = ht.value"
            class="px-2 py-1 rounded text-xs"
            :class="historyFilter === ht.value ? 'bg-amber-500 text-black' : 'bg-gray-700 text-gray-300'">
            {{ ht.label }}
          </button>
        </div>

        <div class="flex-1 overflow-y-auto max-h-48">
          <div v-for="h in filteredHistory" :key="h.id"
            class="flex justify-between items-center bg-gray-800 rounded p-2 mb-1 text-sm"
            :class="h.correct ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'">
            <div class="flex items-center gap-2">
              <span class="text-xs px-1.5 py-0.5 rounded"
                :class="h.quizType === 'char' ? 'bg-blue-900 text-blue-300' : 'bg-purple-900 text-purple-300'">
                {{ h.quizType === 'char' ? '字符' : '词组' }}
              </span>
              <span>{{ h.input }} → {{ h.output }}</span>
            </div>
            <span>{{ h.correct ? '✓' : '✗' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMorseStore } from '../store/morse'
import { textToMorse } from '../utils/morse-code'
import type { QuizType } from '../types'

const store = useMorseStore()

const quizTypes: { id: QuizType; label: string }[] = [
  { id: 'char', label: '字符练习' },
  { id: 'word', label: '词组练习' },
]

const historyFilter = ref<'all' | 'char' | 'word'>('all')
const historyFilterOptions = [
  { value: 'all' as const, label: '全部' },
  { value: 'char' as const, label: '字符' },
  { value: 'word' as const, label: '词组' },
]

const filteredHistory = computed(() => {
  const items = historyFilter.value === 'all'
    ? store.history
    : store.history.filter(h => h.quizType === historyFilter.value)
  return items.slice(0, 20)
})
</script>
