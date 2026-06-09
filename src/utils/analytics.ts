export type AnalyticsData = Record<string, string | number | boolean>

interface UmamiGlobal {
  track: (event: string, data?: AnalyticsData) => void
}

// Надсилає кастомний івент в Umami. Аналітика — best-effort: скрипта може не
// бути (dev, адблокер, тести), і це ніколи не має ламати застосунок.
export const track = (event: string, data?: AnalyticsData): void => {
  if (typeof window === 'undefined') return
  const umami = (window as Window & { umami?: UmamiGlobal }).umami
  try {
    umami?.track(event, data)
  } catch {
    // ігноруємо: трекінг не вартий жодної помилки в UI
  }
}
