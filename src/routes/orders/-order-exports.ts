import { format } from 'date-fns'

import { formatNaira, isPaid, toNumber } from './-orders-utils'

/**
 * Both exports take the filtered set sorted oldest-first, so the file matches
 * what is on screen rather than the raw table.
 *
 * The spec's Truck No. / Trucks Loaded / Vol. Loaded columns are absent: the
 * Node backend's order model has no truck-ticket relation to source them from.
 */
const COLUMNS = [
  { header: 'Reference', width: 22, get: (o: any) => o.orderNumber ?? '' },
  { header: 'Date', width: 18, get: (o: any) => (o.createdAt ? format(new Date(o.createdAt), 'yyyy-MM-dd HH:mm') : '') },
  { header: 'Customer', width: 26, get: (o: any) => o.customerName ?? '' },
  { header: 'Company', width: 26, get: (o: any) => o.customerCompanyName ?? '' },
  { header: 'Contact', width: 18, get: (o: any) => o.customerPhone ?? '' },
  { header: 'Location', width: 20, get: (o: any) => o.depotName ?? o.state ?? '' },
  { header: 'PFI', width: 18, get: (o: any) => o.pfiNumber ?? '' },
  { header: 'Product', width: 22, get: (o: any) => o.productName ?? '' },
  { header: 'Qty', width: 14, get: (o: any) => toNumber(o.quantity) },
  { header: 'Unit Price', width: 16, get: (o: any) => toNumber(o.price) },
  { header: 'Amount', width: 18, get: (o: any) => toNumber(o.totalAmount) },
  { header: 'Paid', width: 10, get: (o: any) => (isPaid(o) ? 'Yes' : 'No') },
  { header: 'Status', width: 14, get: (o: any) => o.status ?? '' },
]

const oldestFirst = (rows: any[]) =>
  [...rows].sort(
    (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
  )

/** Filenames pick up whichever PFI and location filters are active. */
export function buildFilename(prefix: string, filters: { pfi?: string; location?: string }) {
  const parts = [prefix]
  if (filters.location && filters.location !== 'all') parts.push(filters.location.replace(/\s+/g, '-'))
  if (filters.pfi && filters.pfi !== 'all') parts.push(filters.pfi.replace(/\s+/g, '-'))
  parts.push(format(new Date(), 'yyyy-MM-dd'))
  return parts.join('_')
}

export async function exportOrdersExcel(rows: any[], filters: { pfi?: string; location?: string }) {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Orders')

  ws.columns = COLUMNS.map((c) => ({ header: c.header, key: c.header, width: c.width }))
  ws.getRow(1).font = { bold: true }

  for (const o of oldestFirst(rows)) {
    ws.addRow(Object.fromEntries(COLUMNS.map((c) => [c.header, c.get(o)])))
  }

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  triggerDownload(blob, `${buildFilename('orders', filters)}.xlsx`)
}

export async function exportOrdersPdf(rows: any[], filters: { pfi?: string; location?: string }) {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(14)
  doc.text('Soroman — Orders', 14, 16)
  doc.setFontSize(9)
  doc.text(`Generated ${format(new Date(), 'd MMM yyyy, HH:mm')} · ${rows.length} orders`, 14, 22)

  autoTable(doc, {
    startY: 28,
    head: [COLUMNS.map((c) => c.header)],
    body: oldestFirst(rows).map((o) =>
      COLUMNS.map((c) => {
        const v = c.get(o)
        return typeof v === 'number' && c.header !== 'Qty' ? formatNaira(v) : String(v)
      }),
    ),
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [0, 122, 85], textColor: 255 },
  })

  doc.save(`${buildFilename('orders', filters)}.pdf`)
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
