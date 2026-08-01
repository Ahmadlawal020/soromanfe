/**
 * Client-side statement parsing.
 *
 * The app already ships a spreadsheet reader, so the grid is read here rather
 * than uploaded raw. That makes the format-setup screen instant — you see the
 * real rows while choosing which column is which.
 *
 * Deduplication is deliberately NOT done here. It stays on the server, behind
 * a unique index, so it cannot be bypassed by a client.
 */

export type Grid = string[][]

export type ColumnMapping = {
  headerRow: number
  dateColumn: number
  /** A single signed amount column… */
  amountColumn: number | null
  /** …or a dedicated credit column. When set, debits are skipped entirely. */
  creditColumn: number | null
  depositorColumn: number | null
  referenceColumn: number | null
  narrationColumn: number | null
}

export type ParsedRow = {
  txnDate: string
  amount: number
  depositor: string
  bankRef: string
  narration: string
  rawRow: string[]
}

const MAX_PREVIEW_ROWS = 400

/** Reads the first worksheet into a plain 2D array of display strings. */
export async function readGrid(file: File): Promise<Grid> {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  const buffer = await file.arrayBuffer()

  if (file.name.toLowerCase().endsWith('.csv')) {
    const text = new TextDecoder().decode(buffer)
    return text
      .split(/\r?\n/)
      .slice(0, MAX_PREVIEW_ROWS)
      .map((line) => splitCsvLine(line))
  }

  await wb.xlsx.load(buffer)
  const ws = wb.worksheets[0]
  if (!ws) return []

  const grid: Grid = []
  ws.eachRow({ includeEmpty: true }, (row, i) => {
    if (i > MAX_PREVIEW_ROWS) return
    const values = row.values as any[]
    // exceljs is 1-indexed and puts a hole at position 0.
    grid.push(values.slice(1).map((v) => cellToString(v)))
  })
  return grid
}

function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') { cur += '"'; i++ } else quoted = !quoted
    } else if (ch === ',' && !quoted) {
      out.push(cur); cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out
}

function cellToString(v: any): string {
  if (v === null || v === undefined) return ''
  if (v instanceof Date) return v.toISOString()
  if (typeof v === 'object') {
    // Formula cells and rich text.
    if ('result' in v) return cellToString(v.result)
    if ('text' in v) return String(v.text)
    if ('richText' in v) return v.richText.map((t: any) => t.text).join('')
    return ''
  }
  return String(v)
}

/** Excel serial dates, ISO strings and common Nigerian d/m/y formats. */
export function coerceDate(raw: string): Date | null {
  const s = String(raw ?? '').trim()
  if (!s) return null

  // Excel serial (days since 1899-12-30).
  if (/^\d{5}(\.\d+)?$/.test(s)) {
    const d = new Date(Math.round((Number(s) - 25569) * 86400 * 1000))
    return Number.isNaN(d.getTime()) ? null : d
  }

  const dmy = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/)
  if (dmy) {
    const [, a, b, c] = dmy
    const year = c.length === 2 ? 2000 + Number(c) : Number(c)
    // Day-first: the convention on Nigerian bank exports.
    const d = new Date(year, Number(b) - 1, Number(a))
    return Number.isNaN(d.getTime()) ? null : d
  }

  const parsed = new Date(s)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/** Strips currency symbols, thousands separators and bracketed negatives. */
export function coerceAmount(raw: string): number | null {
  const s = String(raw ?? '').trim()
  if (!s) return null
  const negative = /^\(.*\)$/.test(s)
  const cleaned = s.replace(/[₦$,\s()]/g, '')
  if (!cleaned || Number.isNaN(Number(cleaned))) return null
  const n = Number(cleaned)
  return negative ? -n : n
}

/**
 * Turns a raw grid into importable credit rows.
 *
 * Anything without a valid date or a positive amount is skipped rather than
 * raised — repeated headers, blank rows, totals and debits all fall out here.
 */
export function parseRows(grid: Grid, mapping: ColumnMapping) {
  const rows: ParsedRow[] = []
  let skipped = 0

  const at = (row: string[], col: number | null) =>
    col === null || col === undefined ? '' : (row[col] ?? '')

  for (let i = mapping.headerRow + 1; i < grid.length; i++) {
    const row = grid[i]
    if (!row || row.every((c) => !String(c ?? '').trim())) { skipped++; continue }

    const date = coerceDate(at(row, mapping.dateColumn))
    if (!date) { skipped++; continue }

    // A credit column means debits live elsewhere and are simply not read.
    const amountSource = mapping.creditColumn ?? mapping.amountColumn
    const amount = coerceAmount(at(row, amountSource))
    if (amount === null || amount <= 0) { skipped++; continue }

    rows.push({
      txnDate: date.toISOString(),
      amount,
      depositor: String(at(row, mapping.depositorColumn)).trim(),
      bankRef: String(at(row, mapping.referenceColumn)).trim(),
      narration: String(at(row, mapping.narrationColumn)).trim(),
      rawRow: row.map((c) => String(c ?? '')),
    })
  }

  return { rows, skipped }
}
