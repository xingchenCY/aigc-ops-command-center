export function formatNumber(value: number) {
  return new Intl.NumberFormat('zh-CN').format(Math.round(value))
}

export function formatPercent(value: number, digits = 1) {
  return `${value.toFixed(digits)}%`
}

export function formatSeconds(value: number) {
  return `${value.toFixed(1)}s`
}

export function shortDate(date: string) {
  return date.slice(5).replace('-', '/')
}

export function dateLabel(date: string) {
  return `${date.slice(5, 7)}月${date.slice(8, 10)}日`
}
