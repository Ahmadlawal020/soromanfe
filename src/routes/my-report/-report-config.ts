/**
 * The five daily reports, as data.
 *
 * Upstream these were five hand-written panels with their own copies of the
 * same form, table and PDF code. They differ only in which fields show, what
 * those fields are called, and which columns the history lists — so they are
 * described here and rendered by one component.
 *
 * Field keys are the API's own column names. Nothing is packed into remarks
 * and nothing is tagged onto the submitter's name: `reportType` is a real
 * column, so filtering happens in SQL.
 */

export type ReportType =
  | 'sales_manager'
  | 'product_manager'
  | 'security_gate'
  | 'commissions'
  | 'it_compliance'

export type FieldDef = {
  key: string
  label: string
  type?: 'number' | 'text' | 'money' | 'textarea'
  /** Half width on desktop unless this is set. */
  full?: boolean
  hint?: string
}

export type ReportDef = {
  type: ReportType
  title: string
  description: string
  /** Grouped so a long form reads as sections rather than one wall. */
  sections: Array<{ label: string; fields: FieldDef[] }>
  columns: Array<{ key: string; label: string; align?: 'right'; money?: boolean }>
  pdfTitle: string
  filePrefix: string
}

const REMARKS: FieldDef = { key: 'remarks', label: 'Remarks', type: 'textarea', full: true }

export const REPORTS: Record<ReportType, ReportDef> = {
  security_gate: {
    type: 'security_gate',
    title: 'Gate report',
    description: 'Trucks through the gate today.',
    sections: [
      {
        label: 'Gate figures',
        fields: [
          { key: 'carriedOverLoading', label: 'Carried over from yesterday', type: 'number' },
          { key: 'truckCount', label: 'Trucks exited today', type: 'number' },
          { key: 'loadingLeftOver', label: 'Trucks left over today', type: 'number' },
        ],
      },
      { label: 'Notes', fields: [REMARKS] },
    ],
    columns: [
      { key: 'truckCount', label: 'Trucks exited', align: 'right' },
      { key: 'loadingLeftOver', label: 'Left over', align: 'right' },
    ],
    pdfTitle: 'Daily gate report',
    filePrefix: 'GateReport',
  },

  commissions: {
    type: 'commissions',
    title: 'Commission report',
    description: 'Volume sold and commission paid today.',
    sections: [
      {
        label: 'Sales',
        fields: [
          { key: 'litresSold', label: 'Litres sold today', type: 'number' },
          { key: 'truckCount', label: 'Trucks sold', type: 'number' },
          // Real columns. These used to be regexed out of the remarks text,
          // so editing your own note silently destroyed them.
          { key: 'customerCount', label: 'Customers', type: 'number' },
          { key: 'orderCount', label: 'Orders', type: 'number' },
        ],
      },
      {
        label: 'Commission',
        fields: [
          { key: 'amountPaid', label: 'Total commission paid', type: 'money', full: true },
          REMARKS,
        ],
      },
    ],
    columns: [
      { key: 'litresSold', label: 'Litres sold', align: 'right' },
      { key: 'amountPaid', label: 'Commission', align: 'right', money: true },
    ],
    pdfTitle: 'Daily commission report',
    filePrefix: 'CommissionReport',
  },

  it_compliance: {
    type: 'it_compliance',
    title: 'Compliance report',
    description: 'Orders, volume and the rates that applied today.',
    sections: [
      {
        label: 'Today',
        fields: [
          { key: 'orderCount', label: 'Orders today', type: 'number' },
          { key: 'litresSold', label: 'Total litres', type: 'number' },
        ],
      },
      {
        label: 'Rates',
        fields: [
          {
            key: 'rates',
            label: 'Rates for the day',
            full: true,
            hint: 'e.g. ₦300/L standard, ₦350/L bulk',
          },
          REMARKS,
        ],
      },
    ],
    columns: [
      { key: 'orderCount', label: 'Orders', align: 'right' },
      { key: 'litresSold', label: 'Litres', align: 'right' },
    ],
    pdfTitle: 'IT compliance report',
    filePrefix: 'ComplianceReport',
  },

  sales_manager: {
    type: 'sales_manager',
    title: 'Daily sales report',
    description: 'What sold today, at what price, and what was banked.',
    sections: [
      {
        label: 'Loading & opening',
        fields: [
          { key: 'carriedOverLoading', label: "Yesterday's carried over", type: 'number' },
          { key: 'openingStock', label: 'Product brought forward', type: 'number' },
        ],
      },
      {
        label: 'Sales figures',
        fields: [
          { key: 'litresSold', label: 'Litres sold today', type: 'number' },
          { key: 'avgPrice', label: 'Price per litre', type: 'money' },
          { key: 'tankBalance', label: 'Tank balance', type: 'number' },
          { key: 'truckCount', label: 'Trucks sold', type: 'number' },
        ],
      },
      {
        label: 'Financial',
        fields: [
          { key: 'totalSalesAmount', label: 'Total sales amount', type: 'money' },
          { key: 'amountPaid', label: 'Amount paid', type: 'money' },
          { key: 'differentials', label: 'Differentials', type: 'money' },
          { key: 'loadingLeftOver', label: 'Loading left over', type: 'number' },
        ],
      },
      {
        label: 'Banking',
        fields: [
          { key: 'bankName', label: 'Bank name' },
          { key: 'accountNumber', label: 'Account number' },
          REMARKS,
        ],
      },
    ],
    columns: [
      { key: 'litresSold', label: 'Qty sold', align: 'right' },
      { key: 'totalSalesAmount', label: 'Total', align: 'right', money: true },
    ],
    pdfTitle: 'Daily sales report',
    filePrefix: 'DailySalesReport',
  },

  // Same form as sales_manager; kept a separate type so the two audiences'
  // history stays separate.
  product_manager: {
    type: 'product_manager',
    title: 'Daily sales report',
    description: 'What sold today at your location.',
    sections: [],
    columns: [],
    pdfTitle: 'Daily sales report',
    filePrefix: 'DailySalesReport',
  },
}

// product_manager mirrors sales_manager exactly bar the tag.
REPORTS.product_manager.sections = REPORTS.sales_manager.sections
REPORTS.product_manager.columns = REPORTS.sales_manager.columns

/** Which report each role files. Mirrors the upstream role → panel mapping. */
export const ROLE_REPORT: Record<number, ReportType> = {
  9: 'sales_manager',
  10: 'product_manager',
  5: 'security_gate',
  15: 'commissions',
  16: 'commissions',
  18: 'it_compliance',
}

/** Super admin files on behalf of any role, so it gets the full set. */
export const ALL_TYPES: ReportType[] = [
  'sales_manager',
  'product_manager',
  'security_gate',
  'commissions',
  'it_compliance',
]
