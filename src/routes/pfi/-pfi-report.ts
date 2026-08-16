import { format } from 'date-fns'
import api from '#/lib/api/http'
import type { PfiWithFinancials, PfiExpense, PfiMovement } from '#/lib/hooks/usePfis'

/**
 * Amounts are written as real numbers with a currency format, never as
 * pre-formatted strings — a column of text that looks like money cannot be
 * summed, and the first thing anyone does with these sheets is sum a column.
 */
const NGN = '₦#,##0.00;[Red]-₦#,##0.00'
const QTY = '#,##0 "L"'
const PCT = '0.0%'

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

const HEADER_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF007A55' } }

function styleHeader(ws: any) {
  const row = ws.getRow(1)
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  row.fill = HEADER_FILL
}

/** A label/value sheet — the identity and money block. */
function addPairs(ws: any, pairs: Array<[string, any, string?]>) {
  for (const [label, value, fmt] of pairs) {
    const row = ws.addRow([label, value])
    row.getCell(1).font = { bold: true }
    if (fmt) row.getCell(2).numFmt = fmt
  }
}

export async function downloadPfiReport(pfiId: number) {
  const res = await api.get(`/pfis/${pfiId}`)
  const { pfi, expenses, movements } = res.data.data as {
    pfi: PfiWithFinancials
    expenses: PfiExpense[]
    movements: PfiMovement[]
  }
  const f = pfi.financials

  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()

  // ── Summary ───────────────────────────────────────────────────────────────
  const s = wb.addWorksheet('Summary')
  s.columns = [{ width: 32 }, { width: 26 }]
  s.addRow(['Soroman — PFI Report']).font = { bold: true, size: 14 }
  s.addRow([`Generated ${format(new Date(), 'd MMM yyyy, HH:mm')}`])
  s.addRow([])

  addPairs(s, [
    ['PFI number', pfi.pfiNumber],
    ['Status', pfi.status === 'active' ? 'Active' : 'Finished'],
    ['Location', pfi.locationName || '—'],
    ['Product', pfi.productName || '—'],
    ['PFI date', pfi.pfiDate ? new Date(pfi.pfiDate) : '—'],
    ['Vessel', pfi.vesselName || '—'],
    ['Broker', pfi.vesselBroker || '—'],
    ['Surveyor', pfi.surveyorName || '—'],
  ])

  s.addRow([])
  s.addRow(['Quantities']).font = { bold: true }
  addPairs(s, [
    ['BL quantity (papers)', f.blQtyLitres ?? '—', QTY],
    ['Tank quantity (measured)', f.tankQtyLitres, QTY],
    ['Surplus / deficit', f.surplusDeficitLitres ?? '—', QTY],
    ['Sold', f.sold, QTY],
    ['Remaining', f.remaining, QTY],
    ['Sell-through', f.sellThrough ?? '—', PCT],
  ])

  s.addRow([])
  s.addRow(['Financials']).font = { bold: true }
  addPairs(s, [
    ['Price per litre', f.pricePerLitre ?? '—', NGN],
    ['Cargo value (BL × price)', f.pfiValue ?? '—', NGN],
    ['Total expenses', f.totalExpenses, NGN],
    ['Total cost', f.totalCost ?? '—', NGN],
    ...(f.creditBalance > 0
      ? ([
        ['Credit balance', -f.creditBalance, NGN],
        ['Grand total cost', f.grandTotalCost ?? '—', NGN],
      ] as Array<[string, any, string?]>)
      : []),
    ['Revenue', f.revenue, NGN],
    ['Profit / loss', f.profitLoss ?? '—', NGN],
    ['Margin', f.margin != null ? f.margin / 100 : '—', PCT],
  ])

  // The caveat travels with the file. A number read out of a spreadsheet
  // three weeks later has no page around it to explain itself.
  if (!f.profitIsMeaningful && f.sellThrough != null) {
    s.addRow([])
    const warn = s.addRow([
      'Note',
      `Only ${Math.round(f.sellThrough * 100)}% of this batch has been sold. The full cargo cost is charged against partial revenue, so the profit figure above is not yet economically real.`,
    ])
    warn.getCell(1).font = { bold: true, color: { argb: 'FFB45309' } }
    warn.getCell(2).alignment = { wrapText: true }
  }
  if (f.deficitCost != null) {
    const warn = s.addRow([
      'Deficit',
      `${Math.abs(f.surplusDeficitLitres ?? 0).toLocaleString()} L was paid for but never landed, worth ${f.deficitCost.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}.`,
    ])
    warn.getCell(1).font = { bold: true, color: { argb: 'FFB91C1C' } }
    warn.getCell(2).alignment = { wrapText: true }
  }

  s.addRow([])
  s.addRow(['People']).font = { bold: true }
  addPairs(s, [
    ['Sales manager', pfi.salesManagerName || '—'],
    ['Audit officer', pfi.auditOfficerName || '—'],
    ['Product officer', pfi.productOfficerName || '—'],
    ['IT / compliance', pfi.itComplianceOfficerName || '—'],
    ['Security exit', pfi.securityExitOfficerName || '—'],
    ['Commission officer', pfi.commissionOfficerName || '—'],
  ])

  if (pfi.status === 'finished') {
    s.addRow([])
    s.addRow(['Closure']).font = { bold: true }
    addPairs(s, [
      ['Closure date', pfi.closureDate ? new Date(pfi.closureDate) : '—'],
      ['Handler', pfi.closureHandler || '—'],
      ['Bank', pfi.closureBank || '—'],
      ['Total inflow', Number(pfi.totalInflow) || 0, NGN],
      ['Purchase cost (entered)', Number(pfi.purchaseCost) || 0, NGN],
      ['— system computes', f.pfiValue ?? '—', NGN],
      ['Aggregate expenses (entered)', Number(pfi.aggregateExpenses) || 0, NGN],
      ['— system computes', f.totalExpenses, NGN],
      ['Remarks', pfi.closureRemarks || '—'],
    ])
  }

  // ── Expenses ──────────────────────────────────────────────────────────────
  const e = wb.addWorksheet('Expenses')
  e.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Category', key: 'cat', width: 26 },
    { header: 'Vendor', key: 'vendor', width: 24 },
    { header: 'Description', key: 'desc', width: 34 },
    { header: 'Bank', key: 'bank', width: 18 },
    { header: 'Entered by', key: 'by', width: 18 },
    { header: 'Amount', key: 'amount', width: 18 },
  ]
  styleHeader(e)
  for (const x of expenses) {
    const row = e.addRow({
      date: new Date(x.expense_date),
      cat: x.category_name,
      vendor: x.vendor,
      desc: x.description,
      bank: x.bank_paid_from,
      by: x.entered_by,
      amount: Number(x.amount),
    })
    row.getCell('amount').numFmt = NGN
    row.getCell('date').numFmt = 'dd/mm/yyyy'
  }
  const eTotal = e.addRow({ desc: 'Total', amount: f.totalExpenses })
  eTotal.font = { bold: true }
  eTotal.getCell('amount').numFmt = NGN

  // ── Movements ─────────────────────────────────────────────────────────────
  const m = wb.addWorksheet('Movements')
  m.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Order', key: 'order', width: 22 },
    { header: 'Customer', key: 'customer', width: 28 },
    { header: 'Action', key: 'action', width: 14 },
    { header: 'Quantity', key: 'qty', width: 16 },
  ]
  styleHeader(m)
  for (const x of movements) {
    const row = m.addRow({
      date: new Date(x.created_at),
      order: x.order_number || `#${x.id}`,
      customer: x.customer_name || '',
      action: x.action,
      qty: x.qty_litres,
    })
    row.getCell('qty').numFmt = QTY
    row.getCell('date').numFmt = 'dd/mm/yyyy'
  }
  const mTotal = m.addRow({ action: 'Total sold', qty: f.sold })
  mTotal.font = { bold: true }
  mTotal.getCell('qty').numFmt = QTY

  const buf = await wb.xlsx.writeBuffer()
  triggerDownload(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `PFI_${pfi.pfiNumber.replace(/[^\w-]+/g, '-')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
  )
}

/** Portfolio view: every PFI on one sheet, with totals that actually sum. */
export async function downloadMasterReport(pfis: PfiWithFinancials[]) {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('All PFIs')

  ws.columns = [
    { header: 'PFI', key: 'pfi', width: 30 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Location', key: 'loc', width: 18 },
    { header: 'Product', key: 'product', width: 22 },
    { header: 'BL qty', key: 'bl', width: 16 },
    { header: 'Tank qty', key: 'tank', width: 16 },
    { header: 'Surplus/deficit', key: 'gap', width: 16 },
    { header: 'Sold', key: 'sold', width: 16 },
    { header: 'Remaining', key: 'rem', width: 16 },
    { header: 'Sell-through', key: 'through', width: 14 },
    { header: 'Cargo value', key: 'cargo', width: 18 },
    { header: 'Expenses', key: 'exp', width: 18 },
    { header: 'Total cost', key: 'cost', width: 18 },
    { header: 'Revenue', key: 'rev', width: 18 },
    { header: 'Profit / loss', key: 'profit', width: 18 },
    { header: 'Profit meaningful?', key: 'meaningful', width: 18 },
  ]
  styleHeader(ws)

  let cost = 0, revenue = 0, expenses = 0, costed = 0
  for (const p of pfis) {
    const f = p.financials
    expenses += f.totalExpenses
    revenue += f.revenue
    if (f.totalCost != null) { cost += f.totalCost; costed++ }

    const row = ws.addRow({
      pfi: p.pfiNumber,
      status: p.status === 'active' ? 'Active' : 'Finished',
      loc: p.locationName || '',
      product: p.productName || '',
      bl: f.blQtyLitres ?? '',
      tank: f.tankQtyLitres,
      gap: f.surplusDeficitLitres ?? '',
      sold: f.sold,
      rem: f.remaining,
      through: f.sellThrough ?? '',
      cargo: f.pfiValue ?? '',
      exp: f.totalExpenses,
      cost: f.totalCost ?? '',
      rev: f.revenue,
      profit: f.profitLoss ?? '',
      // Spelled out rather than left to a reader's judgement.
      meaningful: f.profitIsMeaningful ? 'Yes' : `No — ${Math.round((f.sellThrough ?? 0) * 100)}% sold`,
    })
    for (const k of ['bl', 'tank', 'gap', 'sold', 'rem']) row.getCell(k).numFmt = QTY
    for (const k of ['cargo', 'exp', 'cost', 'rev', 'profit']) row.getCell(k).numFmt = NGN
    row.getCell('through').numFmt = PCT
  }

  ws.addRow([])
  const total = ws.addRow({
    pfi: `Portfolio (${pfis.length} batches)`,
    exp: expenses,
    cost,
    rev: revenue,
    profit: costed > 0 ? revenue - cost : '',
  })
  total.font = { bold: true }
  for (const k of ['exp', 'cost', 'rev', 'profit']) total.getCell(k).numFmt = NGN

  // Unpriced batches are excluded from the cost total; say so in the file
  // rather than letting the column quietly understate.
  if (costed < pfis.length) {
    const note = ws.addRow({
      pfi: `Note: ${pfis.length - costed} batch(es) have no BL quantity or price and are excluded from the cost and profit totals.`,
    })
    note.font = { italic: false, color: { argb: 'FFB45309' } }
  }

  const buf = await wb.xlsx.writeBuffer()
  triggerDownload(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `PFI_Master_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
  )
}
