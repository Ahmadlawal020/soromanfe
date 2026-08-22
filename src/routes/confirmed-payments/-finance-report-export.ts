import { format } from 'date-fns'
import {
  fundingRecorder, fundingDepositor, fundingPaidInto,
  type FinanceReportOrder, type OrderFunding,
} from '#/lib/hooks/useFinanceReport'

/**
 * Amounts and quantities are written as real numbers with a cell format,
 * never as pre-formatted strings — a column that looks like money or litres
 * but is text cannot be summed, and summing a column is the first thing
 * anyone does with one of these sheets. Figures are always written out in
 * full — no "1.2bn" abbreviations — since a finance report is exactly the
 * place a rounded figure would be read as the real one.
 */
const NGN = '₦#,##0.00;[Red]-₦#,##0.00'
const QTY = '#,##0 "L"'

const BRAND_GREEN = 'FF007A55'
const HEADER_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF1F3864' } }
const SUMMARY_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFE8EEF7' } }
// A payment-source sub-row gets the same font as an order row — only a faint
// tint marks it as nested, never italics or grey text.
const SUBROW_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFF7F9FB' } }
const TOTAL_FILL = SUMMARY_FILL
const THIN = { style: 'thin' as const, color: { argb: 'FFB7C0CC' } }
const ALL_BORDERS = { top: THIN, left: THIN, bottom: THIN, right: THIN }

export interface FinanceReportFilters {
  /** Human label — "Today", "This Week", "21 Aug 2026", etc. */
  periodLabel: string
  /** Short yyyy-MM-dd bounds, for the filename only — '' means all time. */
  dateFrom: string
  dateTo: string
  paymentStatus: string
  search: string
  locationName: string
  pfiNumber: string
  product: string
}

export interface FinanceReportSummary {
  count: number
  totalQuantity: number
  totalSalesValue: number
  totalAmountPaid: number
  /** Only meaningful — and only shown — when a single PFI is selected. */
  initialStock: number | null
  tankBalanceAfter: number | null
}

/** One row of the PFI Stock Summary block — every active PFI, stock and revenue side by side with the period's own sales. */
export interface PfiStockRow {
  pfiNumber: string
  locationName: string
  productName: string
  initialStock: number
  /** Litres sold within the report's current filters — not all-time. */
  volumeSoldPeriod: number
  volumeSoldAllTime: number
  volumeRemaining: number
  revenue: number
}

// The definitive column set — the on-screen table (confirmed-payments/index.tsx)
// mirrors this exactly, same order, same set, so what's on screen is always
// what comes out of the export. Everything up to and including "Amount" is
// order-level. "Balance" and "Wallet Balance After" are also order-only —
// they just live after Amount, since both read as "what happened to that
// amount" rather than "what was charged". Depositor / Payer through
// Recorded By is the payment-source group: only ever filled in on a sub-row
// underneath the order, one per deposit that funded it. "Amount" is the one
// column both row kinds fill in — a sub-row's amount is exactly as much of
// an "amount" as the order row's total is.
const COLUMNS: Array<{ header: string; key: string; width: number; fmt?: string }> = [
  { header: 'S/N', key: 'sn', width: 6 },
  { header: 'Date', key: 'date', width: 13 },
  { header: 'Order Reference', key: 'ref', width: 18 },
  { header: 'Customer', key: 'customer', width: 24 },
  { header: 'Company', key: 'company', width: 22 },
  { header: 'Qty (Litres)', key: 'qty', width: 14, fmt: QTY },
  { header: 'Product', key: 'product', width: 14 },
  { header: 'Rate', key: 'rate', width: 14, fmt: NGN },
  { header: 'Sales Value', key: 'salesValue', width: 16, fmt: NGN },
  { header: 'Location', key: 'location', width: 20 },
  { header: 'Payment Date', key: 'paymentDate', width: 13 },
  { header: 'Amount Paid', key: 'amount', width: 16, fmt: NGN },
  { header: 'Balance', key: 'balance', width: 14, fmt: NGN },
  { header: 'Wallet Balance After', key: 'walletBalanceAfter', width: 18, fmt: NGN },
  { header: 'Depositor / Payer', key: 'depositor', width: 22 },
  { header: 'Paid Into', key: 'paidInto', width: 34 },
  { header: 'Deposit Reference', key: 'depositRef', width: 20 },
  { header: 'Deposit Date', key: 'depositDate', width: 13 },
  { header: 'Recorded By', key: 'recordedBy', width: 18 },
]
/** Columns before this index (0-based) belong to the order row; this one on is payment-source only. */
export const FIRST_FUNDING_COLUMN_INDEX = COLUMNS.findIndex((c) => c.key === 'depositor')
/** The one column both an order row and a funding sub-row fill in. */
export const SHARED_AMOUNT_COLUMN_INDEX = COLUMNS.findIndex((c) => c.key === 'amount')
/** Order-only columns sitting between Amount and the payment-source group — blank on a sub-row, no colSpan needed since they're each their own cell. */
export const MIDDLE_BLANKS_AFTER_AMOUNT = FIRST_FUNDING_COLUMN_INDEX - SHARED_AMOUNT_COLUMN_INDEX - 1
export const TOTAL_COLUMN_COUNT = COLUMNS.length

/** Exported text reads upper-cased throughout — the on-screen table doesn't. */
const up = (v: string) => v.toUpperCase()

function rowValues(o: FinanceReportOrder, i: number) {
  const qty = Number(o.quantity || 0)
  const rate = Number(o.price || 0)
  const salesValue = rate * qty
  const amount = Number(o.totalAmount || 0)
  return {
    sn: i + 1,
    date: o.createdAt ? new Date(o.createdAt) : null,
    ref: up(o.reference),
    customer: up(o.customerName || 'Unknown'),
    company: up(o.customerCompanyName || '—'),
    qty,
    product: up(o.productName || '—'),
    rate,
    salesValue,
    location: up(o.depotName || '—'),
    paymentDate: o.paymentConfirmedAt ? new Date(o.paymentConfirmedAt) : null,
    amount,
    // What's left after this order's own sales value and what actually got
    // paid — normally 0 (an order isn't marked Paid until its wallet hold
    // covers the total in full), nonzero only if totalAmount was corrected
    // by hand after the fact.
    balance: salesValue - amount,
    walletBalanceAfter: o.walletBalanceAfter,
  }
}

/** A funding sub-row — no order details repeated, just where that money came from. */
function fundingRowValues(f: OrderFunding) {
  return {
    amount: Number(f.amount || 0),
    depositor: up(fundingDepositor(f) || '—'),
    paidInto: up(fundingPaidInto(f) || '—'),
    depositRef: up(f.depositReference || '—'),
    depositDate: f.depositCreatedAt ? new Date(f.depositCreatedAt) : null,
    recordedBy: up(fundingRecorder(f) || '—'),
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** "ZENITH-DEPOT PAYMENTS REPORT 22-08-26" — PFI takes precedence over location, since it's the narrower filter. */
export function buildFilename(filters: FinanceReportFilters) {
  const scope =
    filters.pfiNumber && filters.pfiNumber !== 'All PFIs'
      ? filters.pfiNumber
      : filters.locationName && filters.locationName !== 'All locations'
        ? filters.locationName
        : 'ALL'
  const dateTag = filters.dateTo
    ? format(new Date(filters.dateTo), 'dd-MM-yy')
    : format(new Date(), 'dd-MM-yy')
  return `${scope} PAYMENTS REPORT ${dateTag}`.toUpperCase().replace(/\s+/g, ' ')
}

/**
 * The summary as a row of columns rather than a label/value list — reads as
 * an actual table both in Excel and in the PDF, not a sidebar of captions.
 */
function summaryColumns(
  summary: FinanceReportSummary,
  filters: FinanceReportFilters,
): Array<{ header: string; value: string | number; fmt?: string }> {
  const cols: Array<{ header: string; value: string | number; fmt?: string }> = [
    { header: 'Generated At', value: up(format(new Date(), 'd MMM yyyy, HH:mm')) },
    { header: 'Period', value: up(filters.periodLabel) },
    { header: 'Location', value: up(filters.locationName) },
    { header: 'PFI', value: up(filters.pfiNumber) },
    { header: 'Product', value: up(filters.product) },
    { header: 'Number of Orders', value: summary.count },
    { header: 'Total Quantity', value: summary.totalQuantity, fmt: QTY },
    { header: 'Total Sales Value', value: summary.totalSalesValue, fmt: NGN },
    { header: 'Total Amount Paid', value: summary.totalAmountPaid, fmt: NGN },
    { header: 'Balance', value: summary.totalSalesValue - summary.totalAmountPaid, fmt: NGN },
  ]
  if (summary.initialStock != null) cols.push({ header: 'Initial Stock (PFI)', value: summary.initialStock, fmt: QTY })
  if (summary.tankBalanceAfter != null) cols.push({ header: 'Tank Balance After (PFI)', value: summary.tankBalanceAfter, fmt: QTY })
  return cols
}

/** Filters that don't earn their own summary column — noted as a caption instead. */
function extraFilterNote(filters: FinanceReportFilters): string {
  const parts: string[] = []
  if (filters.paymentStatus !== 'Paid') parts.push(`Payment status: ${filters.paymentStatus}`)
  if (filters.search) parts.push(`Search: "${filters.search}"`)
  return parts.join('   ·   ')
}

/**
 * One sheet: the summary table first, then a blank gap, then the payments
 * table — deliberately not split across sheets, so opening the file lands
 * on everything at once. Each order with tracked funding gets one indented
 * sub-row per deposit right underneath it, filling only the payment-source
 * columns so nothing about the order itself is repeated.
 */
export async function exportFinanceReportExcel(
  rows: FinanceReportOrder[],
  summary: FinanceReportSummary,
  filters: FinanceReportFilters,
  pfiStock: PfiStockRow[] = [],
) {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Soroman System'
  wb.created = new Date()

  const ws = wb.addWorksheet('Finance Report')
  // key + width only, no `header` — that would auto-write a header into row
  // 1, and row 1 here belongs to the title instead. Both header rows below
  // are written by hand once their block's position is known.
  ws.columns = COLUMNS.map((c) => ({ key: c.key, width: c.width }))

  const summaryCols = summaryColumns(summary, filters)
  // The summary table's own headers/values are often wider than the main
  // table's column widths were tuned for (e.g. "Total Amount Paid" vs the
  // 6-wide S/N column) — widen just the columns it actually occupies.
  summaryCols.forEach((c, i) => {
    const col = ws.getColumn(i + 1)
    col.width = Math.max(col.width || 10, c.header.length + 2, String(c.value).length + 2)
  })

  ws.getCell('A1').value = 'Soroman — Finance Report'
  ws.getCell('A1').font = { bold: true, size: 14, color: { argb: BRAND_GREEN } }
  ws.getCell('A2').value = `Generated ${format(new Date(), 'd MMM yyyy, HH:mm')}`
  ws.getCell('A2').font = { italic: true, size: 9, color: { argb: 'FF666666' } }

  let cursor = 4
  const summaryHeaderRow = ws.getRow(cursor)
  summaryHeaderRow.values = summaryCols.map((c) => c.header)
  for (let i = 1; i <= summaryCols.length; i++) {
    const cell = summaryHeaderRow.getCell(i)
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = HEADER_FILL
    cell.border = ALL_BORDERS
    cell.alignment = { vertical: 'middle' }
  }
  cursor++

  const summaryValueRow = ws.getRow(cursor)
  summaryValueRow.values = summaryCols.map((c) => c.value)
  for (let i = 1; i <= summaryCols.length; i++) {
    const cell = summaryValueRow.getCell(i)
    cell.border = ALL_BORDERS
    cell.fill = SUMMARY_FILL
    cell.font = { bold: true }
    if (summaryCols[i - 1].fmt) cell.numFmt = summaryCols[i - 1].fmt as string
  }
  cursor++

  const note = extraFilterNote(filters)
  if (note) {
    ws.getCell(cursor, 1).value = note
    ws.getCell(cursor, 1).font = { italic: true, size: 9, color: { argb: 'FF666666' } }
    cursor++
  }
  cursor += 1

  const headerRow = ws.getRow(cursor)
  headerRow.values = COLUMNS.map((c) => c.header)
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = HEADER_FILL
    cell.border = ALL_BORDERS
    cell.alignment = { vertical: 'middle' }
  })
  cursor++

  const tableStartRow = cursor
  rows.forEach((o, i) => {
    const row = ws.getRow(cursor)
    row.values = rowValues(o, i)
    for (const c of COLUMNS) {
      const cell = row.getCell(c.key)
      cell.border = ALL_BORDERS
      if (c.fmt) cell.numFmt = c.fmt
    }
    if (row.getCell('date').value) row.getCell('date').numFmt = 'dd/mm/yyyy'
    if (row.getCell('paymentDate').value) row.getCell('paymentDate').numFmt = 'dd/mm/yyyy'
    cursor++

    if (o.fundingTracked) {
      for (const f of o.funding) {
        const subRow = ws.getRow(cursor)
        subRow.values = fundingRowValues(f)
        for (const c of COLUMNS) {
          const cell = subRow.getCell(c.key)
          cell.border = ALL_BORDERS
          cell.fill = SUBROW_FILL
          if (c.key === 'amount') cell.numFmt = NGN
        }
        if (subRow.getCell('depositDate').value) subRow.getCell('depositDate').numFmt = 'dd/mm/yyyy'
        cursor++
      }
    }
  })
  ws.views = [{ state: 'frozen', ySplit: tableStartRow - 1 }]

  const totalRow = ws.getRow(cursor)
  totalRow.values = {
    ref: `Total (${rows.length} orders)`,
    qty: summary.totalQuantity,
    salesValue: summary.totalSalesValue,
    amount: summary.totalAmountPaid,
  }
  // eachCell() alone would skip the columns this row never set a value for,
  // leaving the shading/border look like it stops partway across — walk
  // every column position instead so the totals row reads as one solid bar.
  for (let i = 1; i <= COLUMNS.length; i++) {
    const cell = totalRow.getCell(i)
    cell.border = ALL_BORDERS
    cell.fill = TOTAL_FILL
    cell.font = { bold: true }
  }
  totalRow.getCell('qty').numFmt = QTY
  totalRow.getCell('salesValue').numFmt = NGN
  totalRow.getCell('amount').numFmt = NGN
  cursor += 3

  if (pfiStock.length > 0) {
    ws.getCell(cursor, 1).value = 'PFI STOCK SUMMARY'
    ws.getCell(cursor, 1).font = { bold: true, size: 12, color: { argb: BRAND_GREEN } }
    cursor += 2

    const stockHeaders = ['PFI', 'Location', 'Product', 'Initial Stock', 'Volume Sold (Period)', 'Total Volume Sold', 'Volume Remaining', 'Revenue']
    const stockHeaderRow = ws.getRow(cursor)
    stockHeaderRow.values = stockHeaders
    stockHeaderRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = HEADER_FILL
      cell.border = ALL_BORDERS
      cell.alignment = { vertical: 'middle' }
    })
    cursor++

    let periodTotal = 0
    for (const p of pfiStock) {
      const row = ws.getRow(cursor)
      row.values = [
        up(p.pfiNumber), up(p.locationName), up(p.productName),
        p.initialStock, p.volumeSoldPeriod, p.volumeSoldAllTime, p.volumeRemaining, p.revenue,
      ]
      periodTotal += p.volumeSoldPeriod
      for (let i = 1; i <= 8; i++) {
        const cell = row.getCell(i)
        cell.border = ALL_BORDERS
        if (i >= 4 && i <= 7) cell.numFmt = QTY
        if (i === 8) cell.numFmt = NGN
        // Negative remaining stock is a real deficit — the batch was
        // charged for more than the tank actually received.
        if (i === 7 && p.volumeRemaining < 0) cell.font = { color: { argb: 'FFCC0000' } }
      }
      cursor++
    }

    // Only the period-sold column is totalled — initial stock and remaining
    // are per-PFI positions in mixed batches, and summing them across PFIs
    // would not mean anything.
    const stockTotalRow = ws.getRow(cursor)
    stockTotalRow.getCell(1).value = `Total (${pfiStock.length} PFIs)`
    stockTotalRow.getCell(5).value = periodTotal
    stockTotalRow.getCell(5).numFmt = QTY
    for (let i = 1; i <= 8; i++) {
      const cell = stockTotalRow.getCell(i)
      cell.border = ALL_BORDERS
      cell.fill = TOTAL_FILL
      cell.font = { bold: true }
    }
  }

  const buf = await wb.xlsx.writeBuffer()
  triggerDownload(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${buildFilename(filters)}.xlsx`,
  )
}

export async function exportFinanceReportPdf(
  rows: FinanceReportOrder[],
  summary: FinanceReportSummary,
  filters: FinanceReportFilters,
  pfiStock: PfiStockRow[] = [],
) {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(14)
  doc.text('Soroman — Finance Report', 14, 15)
  doc.setFontSize(9)
  doc.text(`Generated ${format(new Date(), 'd MMM yyyy, HH:mm')}`, 14, 21)

  const naira = (n: number) => `NGN ${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const summaryCols = summaryColumns(summary, filters)
  const displayValue = (c: { value: string | number; fmt?: string }) => {
    if (typeof c.value !== 'number') return c.value
    if (c.fmt === NGN) return naira(c.value)
    if (c.fmt === QTY) return `${c.value.toLocaleString()} L`
    return c.value.toLocaleString()
  }

  autoTable(doc, {
    startY: 25,
    head: [summaryCols.map((c) => c.header)],
    body: [summaryCols.map((c) => displayValue(c))],
    styles: { fontSize: 7.5, cellPadding: 2, lineColor: [183, 192, 204], lineWidth: 0.1 },
    headStyles: { fillColor: [0, 122, 85], textColor: 255, fontStyle: 'bold' },
    bodyStyles: { fillColor: [232, 238, 247], fontStyle: 'bold', textColor: [20, 20, 20] },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cursorY = (doc as any).lastAutoTable.finalY + 6
  const note = extraFilterNote(filters)
  if (note) {
    doc.setFontSize(8)
    doc.setTextColor(100)
    doc.text(note, 14, cursorY)
    doc.setTextColor(0)
    cursorY += 5
  }

  // How many blank cells surround the shared "Amount" column on each row
  // kind — all derived from COLUMNS itself so none of this drifts out of
  // sync with the header if a column is ever added or reordered.
  const leadingBlanksForFunding = SHARED_AMOUNT_COLUMN_INDEX
  const trailingBlanksForOrder = COLUMNS.length - FIRST_FUNDING_COLUMN_INDEX

  const body: (string | number)[][] = []
  rows.forEach((o, i) => {
    const v = rowValues(o, i)
    body.push([
      v.sn,
      v.date ? format(v.date, 'dd/MM/yyyy') : '—',
      v.ref,
      v.customer,
      v.company,
      v.qty.toLocaleString(),
      v.product,
      naira(v.rate),
      naira(v.salesValue),
      v.location,
      v.paymentDate ? format(v.paymentDate, 'dd/MM/yyyy') : '—',
      naira(v.amount),
      naira(v.balance),
      v.walletBalanceAfter != null ? naira(v.walletBalanceAfter) : '—',
      ...Array(trailingBlanksForOrder).fill(''),
    ])

    if (o.fundingTracked) {
      for (const f of o.funding) {
        const fv = fundingRowValues(f)
        body.push([
          ...Array(leadingBlanksForFunding).fill(''),
          naira(fv.amount),
          ...Array(MIDDLE_BLANKS_AFTER_AMOUNT).fill(''),
          fv.depositor,
          fv.paidInto,
          fv.depositRef,
          fv.depositDate ? format(fv.depositDate, 'dd/MM/yyyy') : '—',
          fv.recordedBy,
        ])
      }
    }
  })

  // Indexed by key, not position, so this can't silently point at the wrong
  // cell if a column is ever inserted before one of these.
  const footRow = new Array(COLUMNS.length).fill('')
  const footAt = (key: string, value: string) => {
    const idx = COLUMNS.findIndex((c) => c.key === key)
    if (idx >= 0) footRow[idx] = value
  }
  footAt('ref', `Total (${rows.length})`)
  footAt('qty', summary.totalQuantity.toLocaleString())
  footAt('salesValue', naira(summary.totalSalesValue))
  footAt('amount', naira(summary.totalAmountPaid))

  const refColumnIndex = COLUMNS.findIndex((c) => c.key === 'ref')

  autoTable(doc, {
    startY: cursorY,
    head: [COLUMNS.map((c) => c.header)],
    body,
    foot: [footRow],
    styles: { fontSize: 6.5, cellPadding: 1.5, lineColor: [183, 192, 204], lineWidth: 0.1 },
    headStyles: { fillColor: [31, 56, 100], textColor: 255, lineWidth: 0.1 },
    footStyles: { fillColor: [232, 238, 247], textColor: [20, 20, 20], fontStyle: 'bold', lineWidth: 0.1 },
    // A payment-source sub-row gets the same faint tint as its Excel
    // counterpart — never a font change, just enough to read as nested. A
    // sub-row is the one whose Order Reference cell is blank. Plain
    // alternating-row striping would be meaningless here (a "row" is an
    // order or one of its sub-rows depending on how many came before it),
    // so this replaces it rather than layering on top.
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.raw[refColumnIndex] === '') {
        data.cell.styles.fillColor = [247, 249, 251]
      }
    },
  })

  if (pfiStock.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let stockY = (doc as any).lastAutoTable.finalY + 8
    doc.setFontSize(12)
    doc.setTextColor(0, 122, 85)
    doc.text('PFI STOCK SUMMARY', 14, stockY)
    doc.setTextColor(0)
    stockY += 4

    const periodTotal = pfiStock.reduce((s, p) => s + p.volumeSoldPeriod, 0)
    autoTable(doc, {
      startY: stockY,
      head: [['PFI', 'Location', 'Product', 'Initial Stock', 'Volume Sold (Period)', 'Total Volume Sold', 'Volume Remaining', 'Revenue']],
      body: pfiStock.map((p) => [
        up(p.pfiNumber), up(p.locationName), up(p.productName),
        p.initialStock.toLocaleString(), p.volumeSoldPeriod.toLocaleString(),
        p.volumeSoldAllTime.toLocaleString(), p.volumeRemaining.toLocaleString(), naira(p.revenue),
      ]),
      // Only the period-sold column is totalled — initial stock and
      // remaining are per-PFI positions in mixed batches, summing them
      // across PFIs would not mean anything.
      foot: [['', '', `Total (${pfiStock.length} PFIs)`, '', periodTotal.toLocaleString(), '', '', '']],
      styles: { fontSize: 7, cellPadding: 1.5, lineColor: [183, 192, 204], lineWidth: 0.1 },
      headStyles: { fillColor: [31, 56, 100], textColor: 255, lineWidth: 0.1 },
      footStyles: { fillColor: [232, 238, 247], textColor: [20, 20, 20], fontStyle: 'bold', lineWidth: 0.1 },
      // A batch charged for more BL than the tank received shows a negative
      // remaining — a real deficit, worth the same red flag it gets on screen.
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 6 && String(data.cell.raw).trim().startsWith('-')) {
          data.cell.styles.textColor = [204, 0, 0]
        }
      },
    })
  }

  doc.save(`${buildFilename(filters)}.pdf`)
}
