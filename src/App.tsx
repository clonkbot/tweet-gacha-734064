import { useState, useRef, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Float, RoundedBox, Text, MeshDistortMaterial, Stars, useTexture, Html } from '@react-three/drei'
import * as THREE from 'three'

// Rarity types and colors
const RARITIES = [
  { name: 'Common', color: '#9ca3af', chance: 0.5, glow: 0.2 },
  { name: 'Rare', color: '#3b82f6', chance: 0.3, glow: 0.5 },
  { name: 'Epic', color: '#a855f7', chance: 0.15, glow: 0.8 },
  { name: 'Legendary', color: '#f59e0b', chance: 0.045, glow: 1.2 },
  { name: 'Mythic', color: '#ef4444', chance: 0.005, glow: 2 },
]

// Tweet content for cards
const TWEET_POOL = [
  { text: "ratio + L + didn't ask", likes: "420K", author: "@CryptoKing" },
  { text: "we are so back", likes: "1.2M", author: "@vibes" },
  { text: "this is the future liberals want", likes: "89K", author: "@MemeLord" },
  { text: "she's a 10 but she uses light mode", likes: "567K", author: "@DevHumor" },
  { text: "no thoughts just vibes", likes: "234K", author: "@CozyCore" },
  { text: "BREAKING: local man too blessed to be stressed", likes: "1.8M", author: "@blessed" },
  { text: "silence brand", likes: "999K", author: "@woke" },
  { text: "sir this is a wendy's", likes: "2.1M", author: "@WendysOfficial" },
  { text: "me explaining why i need another monitor", likes: "345K", author: "@TechBro" },
  { text: "touch grass challenge (impossible)", likes: "678K", author: "@GamerMoment" },
]

interface Card {
  id: number
  rarity: typeof RARITIES[number]
  tweet: typeof TWEET_POOL[number]
}

// Gacha capsule component
function GachaCapsule({
  position,
  isOpening,
  onOpenComplete
}: {
  position: [number, number, number]
  isOpening: boolean
  onOpenComplete: () => void
}) {
  const capsuleRef = useRef<THREE.Group>(null!)
  const topRef = useRef<THREE.Mesh>(null!)
  const bottomRef = useRef<THREE.Mesh>(null!)
  const [openProgress, setOpenProgress] = useState(0)

  useFrame((state, delta) => {
    if (capsuleRef.current) {
      capsuleRef.current.rotation.y += delta * 0.5
      capsuleRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1
    }

    if (isOpening && openProgress < 1) {
      const newProgress = Math.min(openProgress + delta * 0.8, 1)
      setOpenProgress(newProgress)

      if (topRef.current) {
        topRef.current.position.y = newProgress * 1.5
        topRef.current.rotation.x = newProgress * Math.PI * 0.3
      }

      if (newProgress >= 1) {
        onOpenComplete()
      }
    }
  })

  return (
    <group ref={capsuleRef} position={position}>
      {/* Bottom half */}
      <mesh ref={bottomRef} position={[0, -0.3, 0]}>
        <sphereGeometry args={[0.5, 32, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color="#1d9bf0" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Top half */}
      <mesh ref={topRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.5, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#ffffff" metalness={0.8} roughness={0.2} transparent opacity={0.9} />
      </mesh>

      {/* Center ring */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.05, 16, 32]} />
        <meshStandardMaterial color="#ffd700" metalness={1} roughness={0.1} />
      </mesh>
    </group>
  )
}

// Particle explosion effect
function ParticleExplosion({ active, color }: { active: boolean, color: string }) {
  const particlesRef = useRef<THREE.Points>(null!)
  const [positions] = useState(() => {
    const pos = new Float32Array(300)
    for (let i = 0; i < 300; i += 3) {
      pos[i] = (Math.random() - 0.5) * 0.1
      pos[i + 1] = (Math.random() - 0.5) * 0.1
      pos[i + 2] = (Math.random() - 0.5) * 0.1
    }
    return pos
  })
  const [velocities] = useState(() => {
    const vel = []
    for (let i = 0; i < 100; i++) {
      vel.push(new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 4
      ))
    }
    return vel
  })

  useFrame((state, delta) => {
    if (particlesRef.current && active) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < 100; i++) {
        positions[i * 3] += velocities[i].x * delta
        positions[i * 3 + 1] += velocities[i].y * delta
        positions[i * 3 + 2] += velocities[i].z * delta
        velocities[i].y -= delta * 5 // gravity
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  if (!active) return null

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={100}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.1} color={color} transparent opacity={0.8} />
    </points>
  )
}

// Revealed card component
function RevealedCard({ card, visible }: { card: Card | null, visible: boolean }) {
  const cardRef = useRef<THREE.Group>(null!)
  const [scale, setScale] = useState(0)

  useEffect(() => {
    if (visible) {
      setScale(0)
    }
  }, [visible, card])

  useFrame((state, delta) => {
    if (visible && scale < 1) {
      setScale(Math.min(scale + delta * 2, 1))
    }
    if (cardRef.current && visible) {
      cardRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
      cardRef.current.position.y = 1.5 + Math.sin(state.clock.elapsedTime * 2) * 0.05
    }
  })

  if (!card || !visible) return null

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
      <group ref={cardRef} scale={scale} position={[0, 1.5, 0]}>
        {/* Card glow */}
        <mesh>
          <planeGeometry args={[2.2, 3.2]} />
          <meshBasicMaterial color={card.rarity.color} transparent opacity={0.3 * card.rarity.glow} />
        </mesh>

        {/* Card body */}
        <RoundedBox args={[2, 3, 0.1]} radius={0.1} position={[0, 0, 0.1]}>
          <meshStandardMaterial color="#15202b" metalness={0.3} roughness={0.5} />
        </RoundedBox>

        {/* Card border */}
        <mesh position={[0, 0, 0.16]}>
          <planeGeometry args={[1.9, 2.9]} />
          <meshStandardMaterial color={card.rarity.color} metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Inner card */}
        <mesh position={[0, 0.2, 0.17]}>
          <planeGeometry args={[1.7, 2.2]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>

        {/* Rarity label */}
        <Text
          position={[0, -1.2, 0.2]}
          fontSize={0.18}
          color={card.rarity.color}
          font="https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8T-267oIAQAu6jDQyK3nVivM.woff"
          anchorX="center"
          anchorY="middle"
        >
          {card.rarity.name.toUpperCase()}
        </Text>

        {/* Tweet text */}
        <Text
          position={[0, 0.4, 0.2]}
          fontSize={0.12}
          color="#ffffff"
          maxWidth={1.5}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
        >
          {card.tweet.text}
        </Text>

        {/* Author */}
        <Text
          position={[0, -0.3, 0.2]}
          fontSize={0.1}
          color="#1d9bf0"
          anchorX="center"
          anchorY="middle"
        >
          {card.tweet.author}
        </Text>

        {/* Likes */}
        <Text
          position={[0, -0.55, 0.2]}
          fontSize={0.08}
          color="#ef4444"
          anchorX="center"
          anchorY="middle"
        >
          ♥ {card.tweet.likes}
        </Text>

        {/* Twitter bird icon area */}
        <mesh position={[0, 0.95, 0.18]}>
          <circleGeometry args={[0.15, 32]} />
          <meshStandardMaterial color="#1d9bf0" />
        </mesh>
      </group>
    </Float>
  )
}

// Gacha machine
function GachaMachine({ onPull }: { onPull: () => void }) {
  const machineRef = useRef<THREE.Group>(null!)

  return (
    <group ref={machineRef} position={[0, -1, 0]}>
      {/* Base */}
      <RoundedBox args={[3, 0.5, 2]} radius={0.1} position={[0, -0.5, 0]}>
        <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.3} />
      </RoundedBox>

      {/* Dome */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[1.2, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.3} metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Inner glow */}
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <MeshDistortMaterial color="#1d9bf0" transparent opacity={0.3} distort={0.3} speed={2} />
      </mesh>

      {/* Pull lever base */}
      <mesh position={[1.8, 0, 0]} rotation={[0, 0, Math.PI / 6]}>
        <cylinderGeometry args={[0.1, 0.1, 1, 16]} />
        <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Lever knob */}
      <mesh
        position={[2.1, 0.5, 0]}
        onClick={onPull}
        onPointerOver={(e) => {
          document.body.style.cursor = 'pointer'
          ;(e.object as THREE.Mesh).scale.setScalar(1.2)
        }}
        onPointerOut={(e) => {
          document.body.style.cursor = 'default'
          ;(e.object as THREE.Mesh).scale.setScalar(1)
        }}
      >
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#ef4444" metalness={0.6} roughness={0.3} emissive="#ef4444" emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}

// Main 3D Scene
function Scene({ onPull, isPulling, currentCard, showCard, onOpenComplete }: {
  onPull: () => void
  isPulling: boolean
  currentCard: Card | null
  showCard: boolean
  onOpenComplete: () => void
}) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#1d9bf0" />
      <pointLight position={[5, 5, 5]} intensity={0.5} color="#a855f7" />

      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <GachaMachine onPull={onPull} />

      {isPulling && (
        <GachaCapsule
          position={[0, 1, 0]}
          isOpening={isPulling}
          onOpenComplete={onOpenComplete}
        />
      )}

      <ParticleExplosion active={showCard} color={currentCard?.rarity.color || '#ffffff'} />
      <RevealedCard card={currentCard} visible={showCard} />

      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={10}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2}
        enableDamping
        dampingFactor={0.05}
      />
      <Environment preset="night" />
    </>
  )
}

// Collection display component
function Collection({ cards }: { cards: Card[] }) {
  if (cards.length === 0) return null

  return (
    <div className="absolute top-4 right-4 max-w-xs md:max-w-sm bg-slate-900/80 backdrop-blur-xl rounded-2xl p-3 md:p-4 border border-cyan-500/30">
      <h3 className="text-cyan-400 font-bold text-sm md:text-base mb-2 md:mb-3 tracking-wider">COLLECTION ({cards.length})</h3>
      <div className="flex flex-wrap gap-1.5 md:gap-2 max-h-40 md:max-h-48 overflow-y-auto custom-scrollbar">
        {cards.slice(-12).map((card) => (
          <div
            key={card.id}
            className="w-10 h-14 md:w-12 md:h-16 rounded-lg flex items-center justify-center text-xs"
            style={{
              backgroundColor: card.rarity.color + '30',
              border: `2px solid ${card.rarity.color}`,
              boxShadow: `0 0 10px ${card.rarity.color}50`
            }}
          >
            <span className="text-white text-xs">🐦</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Pull rates display
function PullRates() {
  return (
    <div className="absolute bottom-20 md:bottom-16 left-4 bg-slate-900/70 backdrop-blur-xl rounded-xl p-3 md:p-4 border border-purple-500/30">
      <h4 className="text-purple-400 font-bold text-xs mb-2 tracking-wider">DROP RATES</h4>
      <div className="space-y-1">
        {RARITIES.map((r) => (
          <div key={r.name} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color, boxShadow: `0 0 6px ${r.color}` }} />
            <span className="text-gray-400">{r.name}</span>
            <span className="text-gray-500 ml-auto">{(r.chance * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [isPulling, setIsPulling] = useState(false)
  const [currentCard, setCurrentCard] = useState<Card | null>(null)
  const [showCard, setShowCard] = useState(false)
  const [collection, setCollection] = useState<Card[]>([])
  const [currency, setCurrency] = useState(1000)
  const [cardIdCounter, setCardIdCounter] = useState(0)

  const pullCost = 100

  const performPull = () => {
    if (isPulling || currency < pullCost) return

    setCurrency(c => c - pullCost)
    setIsPulling(true)
    setShowCard(false)
    setCurrentCard(null)

    // Determine rarity
    const roll = Math.random()
    let cumulative = 0
    let selectedRarity = RARITIES[0]
    for (const rarity of RARITIES) {
      cumulative += rarity.chance
      if (roll < cumulative) {
        selectedRarity = rarity
        break
      }
    }

    // Create card
    const newCard: Card = {
      id: cardIdCounter,
      rarity: selectedRarity,
      tweet: TWEET_POOL[Math.floor(Math.random() * TWEET_POOL.length)]
    }
    setCardIdCounter(c => c + 1)
    setCurrentCard(newCard)
  }

  const handleOpenComplete = () => {
    setShowCard(true)
    setIsPulling(false)
    if (currentCard) {
      setCollection(prev => [...prev, currentCard])
    }
  }

  const addCurrency = () => {
    setCurrency(c => c + 500)
  }

  return (
    <div className="w-screen h-screen bg-slate-950 overflow-hidden relative">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 2, 6], fov: 50 }}
        shadows
        className="touch-none"
      >
        <Suspense fallback={null}>
          <Scene
            onPull={performPull}
            isPulling={isPulling}
            currentCard={currentCard}
            showCard={showCard}
            onOpenComplete={handleOpenComplete}
          />
        </Suspense>
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Title */}
        <div className="absolute top-4 left-4 md:top-6 md:left-6">
          <h1 className="text-2xl md:text-4xl font-black tracking-tighter">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500">
              TWEET
            </span>
            <span className="text-white">GACHA</span>
          </h1>
          <p className="text-gray-500 text-xs md:text-sm mt-1 tracking-wide">Pull viral tweets • Build your collection</p>
        </div>

        {/* Currency display */}
        <div className="absolute top-4 md:top-6 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-xl rounded-full px-4 md:px-6 py-2 md:py-3 border border-yellow-500/30 flex items-center gap-2 md:gap-3 pointer-events-auto">
          <span className="text-xl md:text-2xl">🪙</span>
          <span className="text-yellow-400 font-bold text-lg md:text-xl tabular-nums">{currency.toLocaleString()}</span>
          <button
            onClick={addCurrency}
            className="ml-1 md:ml-2 bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-400 rounded-full w-7 h-7 md:w-8 md:h-8 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          >
            +
          </button>
        </div>

        {/* Collection */}
        <div className="pointer-events-auto">
          <Collection cards={collection} />
        </div>

        {/* Pull rates */}
        <div className="pointer-events-auto hidden md:block">
          <PullRates />
        </div>

        {/* Pull button */}
        <div className="absolute bottom-24 md:bottom-20 left-1/2 -translate-x-1/2 pointer-events-auto">
          <button
            onClick={performPull}
            disabled={isPulling || currency < pullCost}
            className={`
              relative px-8 md:px-12 py-4 md:py-5 rounded-2xl font-black text-lg md:text-xl tracking-wider
              transition-all duration-300 transform
              ${isPulling || currency < pullCost
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white hover:scale-105 hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] active:scale-95'
              }
            `}
          >
            <span className="relative z-10 flex items-center gap-2 md:gap-3">
              {isPulling ? (
                <>
                  <span className="animate-spin">⚡</span>
                  PULLING...
                </>
              ) : (
                <>
                  PULL x1
                  <span className="text-sm md:text-base opacity-70">({pullCost} 🪙)</span>
                </>
              )}
            </span>
            {!isPulling && currency >= pullCost && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-50 blur-xl -z-10 animate-pulse" />
            )}
          </button>
        </div>

        {/* Card reveal notification */}
        {showCard && currentCard && (
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none animate-bounce">
            <div
              className="px-4 md:px-6 py-2 md:py-3 rounded-xl font-bold text-base md:text-lg tracking-wider"
              style={{
                backgroundColor: currentCard.rarity.color + '30',
                border: `2px solid ${currentCard.rarity.color}`,
                color: currentCard.rarity.color,
                boxShadow: `0 0 30px ${currentCard.rarity.color}50`
              }}
            >
              ★ {currentCard.rarity.name.toUpperCase()}! ★
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-gray-500 text-xs md:text-sm text-center">
          <p>Click the button or tap the red lever to pull • Drag to rotate camera</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-2 right-4 text-gray-600 text-xs">
        Requested by <a href="https://twitter.com/sellingshovels" className="hover:text-gray-400 transition-colors">@sellingshovels</a> · Built by <a href="https://twitter.com/clonkbot" className="hover:text-gray-400 transition-colors">@clonkbot</a>
      </footer>

      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(34, 211, 238, 0.5);
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}
