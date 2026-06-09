// Pure helpers for a tiny SVG sparkline (accuracy over time, etc.).

export interface SparkPoint {
  x: number
  y: number
  value: number
}

const round = (n: number): number => Math.round(n * 100) / 100

// Map a series of values onto a width×height box. Pass fixed min/max (e.g. 0..100
// for accuracy) to keep a flat series sensibly placed rather than collapsed.
export const sparkline = (
  values: number[],
  width: number,
  height: number,
  min = Math.min(...values),
  max = Math.max(...values),
): SparkPoint[] => {
  if (values.length === 0) return []
  const span = max - min || 1
  const stepX = values.length === 1 ? 0 : width / (values.length - 1)
  return values.map((value, i) => ({
    x: round(values.length === 1 ? width / 2 : i * stepX),
    y: round(height - ((value - min) / span) * height),
    value,
  }))
}

export const polyline = (points: SparkPoint[]): string =>
  points.map((p) => `${p.x},${p.y}`).join(' ')

// Closed path under the line for a soft fill.
export const areaPath = (points: SparkPoint[], height: number): string => {
  if (points.length === 0) return ''
  const first = points[0]!
  const last = points[points.length - 1]!
  const line = points.map((p) => `L${p.x},${p.y}`).join(' ')
  return `M${first.x},${height} ${line} L${last.x},${height} Z`
}
