import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { RubiksCube } from './RubiksCube'
import { CubeState } from '../../types/cube'

interface CubeViewerProps {
  cubeState: CubeState
}

export function CubeViewer({ cubeState }: CubeViewerProps) {
  return (
    <div className="w-full h-full min-h-[300px]">
      <Canvas camera={{ position: [4, 3, 5], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />

        <RubiksCube cubeState={cubeState} />

        <OrbitControls
          enablePan={false}
          minDistance={6}
          maxDistance={15}
          autoRotate={false}
          enableDamping
        />

        <Environment preset="city" />
      </Canvas>
    </div>
  )
}
