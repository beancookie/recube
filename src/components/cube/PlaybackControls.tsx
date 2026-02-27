import { useEffect, useRef } from 'react'
import { useCubeStore } from '../../stores/cubeStore'

export function PlaybackControls() {
  const { solution, playback, setPlaybackState, nextStep, prevStep } = useCubeStore()
  const timerRef = useRef<number | null>(null)

  // 自动播放
  useEffect(() => {
    if (playback.isPlaying && playback.currentStep < solution.length) {
      timerRef.current = window.setTimeout(() => {
        nextStep()
      }, playback.speed)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [playback.isPlaying, playback.currentStep, solution.length, playback.speed, nextStep])

  const handlePlayPause = () => {
    setPlaybackState({ isPlaying: !playback.isPlaying })
  }

  const handlePrev = () => {
    if (playback.currentStep > 0) {
      prevStep()
    }
  }

  const handleNext = () => {
    if (playback.currentStep < solution.length) {
      nextStep()
    }
  }

  const handleReset = () => {
    setPlaybackState({ isPlaying: false, currentStep: 0 })
  }

  const handleSpeedChange = (speed: number) => {
    setPlaybackState({ speed })
  }

  const currentMove = playback.currentStep > 0 ? solution[playback.currentStep - 1] : null

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
      {/* 当前步骤显示 */}
      <div className="text-center">
        {currentMove ? (
          <div className="text-2xl font-bold text-blue-600">
            {currentMove.name}
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            {playback.currentStep === 0 ? '点击开始' : '完成!'}
          </div>
        )}
        <div className="text-xs text-gray-400 mt-1">
          {playback.currentStep} / {solution.length} 步
        </div>
      </div>

      {/* 播放控制按钮 */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleReset}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </button>

        <button
          onClick={handlePrev}
          disabled={playback.currentStep === 0}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
          </svg>
        </button>

        <button
          onClick={handlePlayPause}
          disabled={playback.currentStep >= solution.length}
          className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center transition-colors text-white"
        >
          {playback.isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        <button
          onClick={handleNext}
          disabled={playback.currentStep >= solution.length}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M11.555 5.168A1 1 0 0010 6v2.798l-5.445-3.63A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4z" />
          </svg>
        </button>
      </div>

      {/* 速度控制 */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500">速度:</span>
        <button
          onClick={() => handleSpeedChange(800)}
          className={`px-2 py-1 rounded ${playback.speed === 800 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}
        >
          慢
        </button>
        <button
          onClick={() => handleSpeedChange(500)}
          className={`px-2 py-1 rounded ${playback.speed === 500 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}
        >
          中
        </button>
        <button
          onClick={() => handleSpeedChange(200)}
          className={`px-2 py-1 rounded ${playback.speed === 200 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}
        >
          快
        </button>
      </div>

      {/* 步骤列表 */}
      {solution.length > 0 && (
        <div className="max-h-32 overflow-y-auto w-full">
          <div className="grid grid-cols-5 gap-1 text-xs">
            {solution.map((move, i) => (
              <div
                key={i}
                className={`p-1 text-center rounded ${
                  i < playback.currentStep
                    ? 'bg-blue-500 text-white'
                    : i === playback.currentStep
                    ? 'bg-blue-200 text-blue-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {move.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
