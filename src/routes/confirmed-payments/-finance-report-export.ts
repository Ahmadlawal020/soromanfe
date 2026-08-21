import { format } from 'date-fns'
import {
  fundingRecorder, fundingDepositor, fundingAccountPaidTo, fundingBankInfo,
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
  { header: 'Amount', key: 'amount', width: 16, fmt: NGN },
  { header: 'Balance', key: 'balance', width: 16, fmt: NGN },
  { header: 'Depositor / Payer', key: 'depositor', width: 22 },
  { header: 'Account Paid To', key: 'accountPaidTo', width: 26 },
  { header: 'Account Name', key: 'accountName', width: 22 },
  { header: 'Deposit Reference', key: 'depositRef', width: 20 },
  { header: 'Recorded By', key: 'recordedBy', width: 18 },
]

function rowValues(o: FinanceReportOrder, i: number) {
  const qty = Number(o.quantity || 0)
  const rate = Number(o.price || 0)
  return {
    sn: i + 1,
    date: o.createdAt ? new Date(o.createdAt) : null,
    ref: o.reference,
    customer: o.customerName || 'Unknown',
    company: o.customerCompanyName || '—',
    qty,
    product: o.productName || '—',
    rate,
    salesValue: rate * qty,
    location: o.depotName || '—',
    paymentDate: o.paymentConfirmedAt ? new Date(o.paymentConfirmedAt) : null,
    amount: Number(o.totalAmount || 0),
    balance: o.walletBalanceAfter,
  }
}

/** A funding sub-row — no order details repeated, just where that money came from. */
function fundingRowValues(f: OrderFunding) {
  return {
    amount: Number(f.amount || 0),
    depositor: fundingDepositor(f) || '—',
    accountPaidTo: fundingAccountPaidTo(f) || '—',
    accountName: fundingBankInfo(f).accountName || '—',
    depositRef: f.depositReference || '—',
    recordedBy: fundingRecorder(f) || '—',
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

export function buildFilename(filters: FinanceReportFilters) {
  const parts = ['finance-report']
  if (filters.locationName && filters.locationName !== 'All locations') parts.push(filters.locationName.replace(/\s+/g, '-'))
  if (filters.pfiNumber && filters.pfiNumber !== 'All PFIs') parts.push(filters.pfiNumber.replace(/\s+/g, '-'))
  parts.push(
    filters.dateFrom === filters.dateTo
      ? filters.dateFrom || 'all-time'
      : `${filters.dateFrom}_to_${filters.dateTo}`,
  )
  return parts.join('_')
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
    { header: 'Number of Orders', value: summary.count },
    { header: 'Period', value: filters.periodLabel },
    { header: 'Total Quantity', value: summary.totalQuantity, fmt: QTY },
    { header: 'Location', value: filters.locationName },
    { header: 'PFI', value: filters.pfiNumber },
    { header: 'Product', value: filters.product },
    { header: 'Total Sales Value', value: summary.totalSalesValue, fmt: NGN },
    { header: 'Total Amount Paid', value: summary.totalAmountPaid, fmt: NGN },
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
      v.balance != null ? naira(v.balance) : '—',
      '', '', '', '', '',
    ])

    if (o.fundingTracked) {
      for (const f of o.funding) {
        body.push([
          '', '', '', '', '', '', '', '', '', '', '',
          naira(Number(f.amount)),
          '',
          fundingDepositor(f) || '—',
          fundingAccountPaidTo(f) || '—',
          fundingBankInfo(f).accountName || '—',
          f.depositReference || '—',
          fundingRecorder(f) || '—',
        ])
      }
    }
  })

  autoTable(doc, {
    startY: cursorY,
    head: [COLUMNS.map((c) => c.header)],
    body,
    foot: [[
      '', '', `Total (${rows.length})`, '', '',
      summary.totalQuantity.toLocaleString(), '', '', naira(summary.totalSalesValue),
      '', '', naira(summary.totalAmountPaid), '', '', '', '', '', '',
    ]],
    styles: { fontSize: 6.5, cellPadding: 1.5, lineColor: [183, 192, 204], lineWidth: 0.1 },
    headStyles: { fillColor: [31, 56, 100], textColor: 255, lineWidth: 0.1 },
    footStyles: { fillColor: [232, 238, 247], textColor: [20, 20, 20], fontStyle: 'bold', lineWidth: 0.1 },
    alternateRowStyles: { fillColor: [247, 249, 251] },
  })

  doc.save(`${buildFilename(filters)}.pdf`)
}
