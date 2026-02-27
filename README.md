# Recube - 3阶魔方还原 H5 应用

上传魔方6个面的照片，自动识别并计算还原步骤，3D动画演示还原过程。

## 技术栈

- React 18 + TypeScript
- Vite
- React Three Fiber (Three.js)
- cubejs (Kociemba 算法)
- Zustand (状态管理)
- Tailwind CSS

## 运行项目

### 1. 安装依赖

```bash
cd recube
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173/

### 3. 构建生产版本

```bash
npm run build
```

## 使用方法

1. **上传照片** - 点击6个方框，分别上传魔方的上、下、左、右、前、后6个面的照片
2. **开始还原** - 上传完成后点击"开始还原"按钮
3. **观看动画** - 查看3D魔方动画演示还原步骤
4. **播放控制** - 可以暂停/播放、调整速度、查看步骤列表

## 项目结构

```
src/
├── components/
│   ├── upload/       # 上传组件
│   └── cube/         # 3D可视化
├── lib/
│   ├── cubejs/       # cubejs封装
│   └── analyzer/     # 图像分析
├── stores/           # Zustand状态管理
├── types/            # TypeScript类型
└── pages/            # 页面组件
```

## 注意事项

- 请确保上传的照片光线充足、清晰
- 照片需要包含完整的魔方面
- 颜色识别结果依赖于照片质量
