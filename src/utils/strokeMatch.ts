// Pure helpers for the «write the kana» (tracing) format. Correctness is judged
// by how well the learner's drawing covers the target glyph, working on
// downsampled boolean grids so the geometry stays testable without a canvas.

export interface Point {
  x: number
  y: number
}

// Total length of a polyline — used to ignore trivially short scribbles.
export const pathLength = (points: Point[]): number => {
  let len = 0
  for (let i = 1; i < points.length; i += 1) {
    len += Math.hypot(points[i]!.x - points[i - 1]!.x, points[i]!.y - points[i - 1]!.y)
  }
  return len
}

export const totalLength = (strokes: Point[][]): number =>
  strokes.reduce((sum, stroke) => sum + pathLength(stroke), 0)

export interface TraceScore {
  // Share of the glyph's ink the learner drew over [0..1].
  covered: number
  // Share of the learner's ink that fell outside the glyph [0..1].
  spill: number
}

// `target` marks the glyph ink, `drawn` marks where the learner drew; both are
// flat, equal-length, row-major boolean grids.
export const traceScore = (target: boolean[], drawn: boolean[]): TraceScore => {
  if (target.length !== drawn.length) throw new Error('grid size mismatch')

  let targetOn = 0
  let covered = 0
  let drawnOn = 0
  let spill = 0

  for (let i = 0; i < target.length; i += 1) {
    if (target[i]) {
      targetOn += 1
      if (drawn[i]) covered += 1
    }
    if (drawn[i]) {
      drawnOn += 1
      if (!target[i]) spill += 1
    }
  }

  return {
    covered: targetOn === 0 ? 0 : covered / targetOn,
    spill: drawnOn === 0 ? 0 : spill / drawnOn,
  }
}

export interface TraceThresholds {
  minCovered?: number
  maxSpill?: number
}

export const passesTrace = (score: TraceScore, thresholds: TraceThresholds = {}): boolean =>
  score.covered >= (thresholds.minCovered ?? 0.6) && score.spill <= (thresholds.maxSpill ?? 0.5)

// Grow every «on» cell into its 8 neighbours. Used to give the target glyph a
// tolerance band so a slightly-off (but thick) pen stroke still counts.
export const dilate = (grid: boolean[], width: number, height: number): boolean[] => {
  const out = grid.slice()
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!grid[y * width + x]) continue
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx
          const ny = y + dy
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) out[ny * width + nx] = true
        }
      }
    }
  }
  return out
}
