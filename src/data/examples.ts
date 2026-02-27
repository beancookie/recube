// 示例数据结构 - 难度定义

export interface Example {
  id: string
  name: string
  difficulty: 'easy' | 'medium' | 'hard'
  steps: number
  // cubeState 将在 loadExample 时动态生成
}

// 简单示例 - 1步打乱
export const easyExample: Example = {
  id: 'easy',
  name: '简单',
  difficulty: 'easy',
  steps: 1,
}

// 中等示例 - 3步打乱
export const mediumExample: Example = {
  id: 'medium',
  name: '中等',
  difficulty: 'medium',
  steps: 3,
}

// 困难示例 - 6步打乱
export const hardExample: Example = {
  id: 'hard',
  name: '困难',
  difficulty: 'hard',
  steps: 6,
}

export const examples: Example[] = [easyExample, mediumExample, hardExample]

export function getExampleById(id: string): Example | undefined {
  return examples.find(e => e.id === id)
}
