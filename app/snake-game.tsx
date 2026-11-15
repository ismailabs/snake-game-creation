'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Pause, Play, RotateCcw } from 'lucide-react'

type Point = { x: number; y: number }
type Status = 'ready' | 'playing' | 'paused' | 'over'
const SIZE = 20
const START: Point[] = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }]
const DIRECTIONS: Record<string, Point> = {
  ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 }, s: { x: 0, y: 1 }, a: { x: -1, y: 0 }, d: { x: 1, y: 0 },
}
function randomFood(snake: Point[]): Point {
  let point: Point
  do { point = { x: Math.floor(Math.random() * SIZE), y: Math.floor(Math.random() * SIZE) } }
  while (snake.some((segment) => segment.x === point.x && segment.y === point.y))
  return point
}

export function SnakeGame() {
  const [snake, setSnake] = useState(START)
  const [food, setFood] = useState<Point>({ x: 14, y: 8 })
  const [status, setStatus] = useState<Status>('ready')
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const direction = useRef<Point>({ x: 1, y: 0 })
  const queued = useRef<Point>({ x: 1, y: 0 })

  useEffect(() => {
    const saved = Number(window.localStorage.getItem('snake-best') || 0)
    setBest(saved)
  }, [])

  const steer = useCallback((next: Point) => {
    if (next.x !== -direction.current.x || next.y !== -direction.current.y) queued.current = next
  }, [])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const next = DIRECTIONS[event.key] || DIRECTIONS[event.key.toLowerCase()]
      if (next) { event.preventDefault(); steer(next); if (status === 'ready') setStatus('playing') }
      if (event.code === 'Space') { event.preventDefault(); setStatus((value) => value === 'playing' ? 'paused' : value === 'paused' || value === 'ready' ? 'playing' : value) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [steer, status])

  const reset = () => {
    setSnake(START); setFood(randomFood(START)); setScore(0)
    direction.current = { x: 1, y: 0 }; queued.current = { x: 1, y: 0 }; setStatus('playing')
  }

  useEffect(() => {
    if (status !== 'playing') return
    const timer = window.setInterval(() => {
      direction.current = queued.current
      const head = { x: snake[0].x + direction.current.x, y: snake[0].y + direction.current.y }
      const ate = head.x === food.x && head.y === food.y
      const body = ate ? snake : snake.slice(0, -1)
      if (head.x < 0 || head.x >= SIZE || head.y < 0 || head.y >= SIZE || body.some((part) => part.x === head.x && part.y === head.y)) {
        setStatus('over'); return
      }
      const next = [head, ...snake.slice(0, ate ? undefined : -1)]
      setSnake(next)
      if (ate) {
        const nextScore = score + 10
        setScore(nextScore)
        if (nextScore > best) { setBest(nextScore); window.localStorage.setItem('snake-best', String(nextScore)) }
        setFood(randomFood(next))
      }
    }, Math.max(75, 145 - Math.floor(score / 50) * 8))
    return () => window.clearInterval(timer)
  }, [status, snake, food, score, best])

  const icons = [ArrowUp, ArrowLeft, ArrowDown, ArrowRight]
  const dirs = [{ x: 0, y: -1 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 0 }]
  return (
    <main className="arcade-shell">
      <header className="topbar"><a className="brand" href="#home" aria-label="Nibbles home"><span className="brand-mark">N</span><span>NIBBLES<span className="brand-dot">.</span></span></a><span className="top-note"><span className="live-dot" /> ARCADE CLASSIC <span className="top-separator">/</span> NO. 001</span></header>
      <section className="game-layout" aria-label="Snake arcade game">
        <div className="game-copy"><div className="eyebrow"><span>01</span><span className="eyebrow-line" /> THE ORIGINAL</div><h1>One more<br /><em>bite.</em></h1><p className="intro">A little nostalgia. A lot of self-control.<br />How long can you last?</p><div className="score-row"><div className="score-card"><span className="score-label">YOUR SCORE</span><strong>{String(score).padStart(3, '0')}</strong></div><div className="score-divider" /><div className="score-card best-card"><span className="score-label">PERSONAL BEST</span><strong>{String(best).padStart(3, '0')}<span className="best-star">✳</span></strong></div></div><div className="controls-hint"><span className="key-cluster"><kbd>↑</kbd><span><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd></span></span><span>USE ARROW KEYS<br />OR WASD TO MOVE</span></div></div>
        <div className="play-area"><div className="board-frame"><div className="board-top"><span><span className="board-light" /> GAME IN PROGRESS</span><span>20 × 20</span></div><div className="game-board" role="img" aria-label={`Snake game board. Score ${score}. ${status === 'over' ? 'Game over.' : status === 'paused' ? 'Paused.' : ''}`}>
          {Array.from({ length: SIZE * SIZE }, (_, index) => {
            const x = index % SIZE, y = Math.floor(index / SIZE)
            const snakeIndex = snake.findIndex((part) => part.x === x && part.y === y)
            const isFood = food.x === x && food.y === y
            return <div key={index} className={`grid-cell${snakeIndex === 0 ? ' snake-head' : snakeIndex > 0 ? ' snake-body' : ''}${isFood ? ' food-cell' : ''}`}>
              {snakeIndex === 0 && <span className={`snake-eyes eye-${direction.current.x === 1 ? 'right' : direction.current.x === -1 ? 'left' : direction.current.y === -1 ? 'up' : 'down'}`}><i /><i /></span>}
              {isFood && <span className="food-dot" />}
            </div>
          })}
          {status !== 'playing' && <div className="board-overlay"><div className="overlay-card"><span className="overlay-kicker">{status === 'over' ? 'THAT’S A WRAP' : status === 'paused' ? 'TAKE YOUR TIME' : 'READY WHEN YOU ARE'}</span><h2>{status === 'over' ? 'Game over.' : status === 'paused' ? 'Paused.' : 'Let’s play.'}</h2><p>{status === 'over' ? `You scored ${score} points. Fancy another round?` : status === 'paused' ? 'Press space or resume when you’re ready.' : 'Collect the dots. Avoid the walls.'}</p><button className="primary-button" onClick={status === 'over' ? reset : () => setStatus('playing')}><Play size={15} fill="currentColor" /> {status === 'over' ? 'PLAY AGAIN' : status === 'paused' ? 'RESUME GAME' : 'START GAME'}</button></div></div>}
        </div><div className="board-footer"><span>DON’T EAT YOURSELF</span><span>● ● ● <span className="footer-muted">● ●</span></span></div></div>
          <div className="game-actions"><div className="mobile-pad" aria-label="Touch controls">{icons.map((Icon, i) => <button key={i} onClick={() => { steer(dirs[i]); if (status === 'ready') setStatus('playing') }} aria-label={`Move ${['up', 'left', 'down', 'right'][i]}`}><Icon size={18} /></button>)}</div><button className="utility-button" onClick={() => setStatus((value) => value === 'playing' ? 'paused' : value === 'paused' ? 'playing' : value)} aria-label={status === 'playing' ? 'Pause game' : 'Resume game'}><Pause size={15} /> {status === 'playing' ? 'PAUSE' : 'PAUSE'}</button><button className="utility-button" onClick={reset}><RotateCcw size={15} /> RESTART</button></div>
        </div>
      </section><footer className="page-footer"><span>MADE FOR THE LOVE OF THE GAME</span><span>TAKE A BREATH. THEN TAKE A BITE.</span></footer>
    </main>
  )
}
