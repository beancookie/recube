import { examples, Example } from '../../data/examples'

interface ExampleSelectorProps {
  onSelect: (example: Example) => void
}

export function ExampleSelector({ onSelect }: ExampleSelectorProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="font-medium text-gray-800 mb-3">示例演示</h3>
      <p className="text-sm text-gray-500 mb-4">选择示例查看还原过程</p>

      <div className="space-y-2">
        {examples.map(example => (
          <button
            key={example.id}
            onClick={() => onSelect(example)}
            className="w-full p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">{example.name}</span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  example.difficulty === 'easy'
                    ? 'bg-green-100 text-green-700'
                    : example.difficulty === 'medium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {example.difficulty === 'easy'
                  ? '简单'
                  : example.difficulty === 'medium'
                  ? '中等'
                  : '困难'}
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              预估步数: {example.steps}+ 步
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
