export function csvEscape(value) {
  const text = value == null ? '' : String(value)
  if (/[,"\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function downloadCsv(filename, rows) {
  const csv = ['\uFEFF' + rows.map((row) => row.map(csvEscape).join(',')).join('\n')]
  const blob = new Blob(csv, { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
