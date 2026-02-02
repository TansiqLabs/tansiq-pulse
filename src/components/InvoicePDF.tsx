import { useState } from 'react'
import { format } from 'date-fns'
import { FileText, Download, Printer, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import type { Invoice, Patient } from '@/types'

interface InvoicePDFProps {
  invoice: Invoice
  patient?: Patient
  hospitalName?: string
  hospitalAddress?: string
  hospitalPhone?: string
  hospitalEmail?: string
}

export function InvoicePDF({
  invoice,
  patient,
  hospitalName = 'Tansiq Pulse Hospital',
  hospitalAddress = '123 Healthcare Avenue, Medical District',
  hospitalPhone = '+1 (555) 123-4567',
  hospitalEmail = 'billing@tansiqpulse.com',
}: InvoicePDFProps) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [printing, setPrinting] = useState(false)

  const generatePrintableHTML = () => {
    const items = invoice.items || []
    const payments = invoice.payments || []

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice #${invoice.invoiceNumber}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #333;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 20px;
            border-bottom: 2px solid #0066cc;
            margin-bottom: 20px;
          }
          .hospital-info h1 {
            font-size: 24px;
            color: #0066cc;
            margin-bottom: 5px;
          }
          .hospital-info p {
            color: #666;
            font-size: 11px;
          }
          .invoice-meta {
            text-align: right;
          }
          .invoice-meta h2 {
            font-size: 28px;
            color: #333;
            margin-bottom: 10px;
          }
          .invoice-meta .label {
            color: #666;
            font-size: 10px;
            text-transform: uppercase;
          }
          .invoice-meta .value {
            font-size: 13px;
            font-weight: 600;
          }
          .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .info-box {
            width: 48%;
          }
          .info-box h3 {
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 8px;
            padding-bottom: 5px;
            border-bottom: 1px solid #eee;
          }
          .info-box p {
            font-size: 12px;
            margin-bottom: 3px;
          }
          .info-box .name {
            font-size: 14px;
            font-weight: 600;
            color: #333;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background: #f5f5f5;
            padding: 10px 12px;
            text-align: left;
            font-size: 10px;
            text-transform: uppercase;
            color: #666;
            border-bottom: 2px solid #ddd;
          }
          th:nth-child(3),
          th:nth-child(4),
          td:nth-child(3),
          td:nth-child(4) {
            text-align: right;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #eee;
          }
          .totals {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 20px;
          }
          .totals-table {
            width: 300px;
          }
          .totals-table tr td {
            padding: 8px 12px;
            border: none;
          }
          .totals-table tr td:first-child {
            color: #666;
          }
          .totals-table tr td:last-child {
            text-align: right;
            font-weight: 500;
          }
          .totals-table .total-row {
            background: #f5f5f5;
            font-size: 14px;
          }
          .totals-table .total-row td {
            font-weight: 700;
            color: #333;
          }
          .totals-table .due-row td {
            color: #dc2626;
            font-weight: 700;
          }
          .payments-section {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
          }
          .payments-section h3 {
            font-size: 14px;
            margin-bottom: 10px;
            color: #333;
          }
          .payment-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dashed #eee;
            font-size: 11px;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .status-paid {
            background: #dcfce7;
            color: #15803d;
          }
          .status-pending {
            background: #fef9c3;
            color: #a16207;
          }
          .status-partial {
            background: #dbeafe;
            color: #1d4ed8;
          }
          .status-overdue {
            background: #fee2e2;
            color: #dc2626;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #666;
            font-size: 10px;
          }
          .notes {
            margin-top: 20px;
            padding: 15px;
            background: #f9fafb;
            border-radius: 8px;
          }
          .notes h4 {
            font-size: 11px;
            color: #666;
            margin-bottom: 5px;
          }
          .notes p {
            font-size: 12px;
            color: #333;
          }
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div class="hospital-info">
            <h1>${hospitalName}</h1>
            <p>${hospitalAddress}</p>
            <p>Phone: ${hospitalPhone}</p>
            <p>Email: ${hospitalEmail}</p>
          </div>
          <div class="invoice-meta">
            <h2>INVOICE</h2>
            <p class="label">Invoice Number</p>
            <p class="value">${invoice.invoiceNumber}</p>
            <p class="label" style="margin-top: 10px;">Date</p>
            <p class="value">${format(new Date(invoice.createdAt), 'MMM dd, yyyy')}</p>
            <p class="label" style="margin-top: 10px;">Status</p>
            <span class="status-badge status-${invoice.status.toLowerCase()}">${invoice.status}</span>
          </div>
        </div>

        <div class="info-section">
          <div class="info-box">
            <h3>Bill To</h3>
            <p class="name">${patient ? `${patient.firstName} ${patient.lastName}` : 'N/A'}</p>
            <p>${patient?.email || ''}</p>
            <p>${patient?.phone || ''}</p>
            <p>${patient?.address || ''}</p>
          </div>
          <div class="info-box">
            <h3>Payment Details</h3>
            <p><strong>Invoice Date:</strong> ${format(new Date(invoice.createdAt), 'MMM dd, yyyy')}</p>
            <p><strong>Payment Method:</strong> Cash / Card / Bank Transfer</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 50%;">Description</th>
              <th style="width: 15%;">Qty</th>
              <th style="width: 17%;">Unit Price</th>
              <th style="width: 18%;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.unitPrice)}</td>
                <td>${formatCurrency(item.totalPrice)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <table class="totals-table">
            <tr>
              <td>Subtotal</td>
              <td>${formatCurrency(invoice.subtotal)}</td>
            </tr>
            ${invoice.discountAmount > 0 ? `
              <tr>
                <td>Discount</td>
                <td>-${formatCurrency(invoice.discountAmount)}</td>
              </tr>
            ` : ''}
            <tr>
              <td>Tax (5%)</td>
              <td>${formatCurrency(invoice.taxAmount)}</td>
            </tr>
            <tr class="total-row">
              <td>Total</td>
              <td>${formatCurrency(invoice.totalAmount)}</td>
            </tr>
            <tr>
              <td>Paid</td>
              <td>${formatCurrency(invoice.paidAmount)}</td>
            </tr>
            <tr class="due-row">
              <td>Balance Due</td>
              <td>${formatCurrency(invoice.balanceAmount)}</td>
            </tr>
          </table>
        </div>

        ${payments.length > 0 ? `
          <div class="payments-section">
            <h3>Payment History</h3>
            ${payments.map(payment => `
              <div class="payment-item">
                <span>${format(new Date(payment.paidAt), 'MMM dd, yyyy')} - ${payment.paymentMethod}</span>
                <span>${formatCurrency(payment.amount)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${invoice.notes ? `
          <div class="notes">
            <h4>Notes</h4>
            <p>${invoice.notes}</p>
          </div>
        ` : ''}

        <div class="footer">
          <p>Thank you for choosing ${hospitalName}</p>
          <p>This is a computer generated invoice. No signature required.</p>
        </div>
      </body>
      </html>
    `
  }

  const handlePrint = () => {
    setPrinting(true)
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(generatePrintableHTML())
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        setPrinting(false)
      }, 250)
    } else {
      setPrinting(false)
    }
  }

  const handleDownload = () => {
    const htmlContent = generatePrintableHTML()
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Invoice-${invoice.invoiceNumber}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handlePreview = () => {
    setPreviewOpen(true)
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handlePreview}>
          <FileText className="mr-2 h-4 w-4" />
          Preview
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint} disabled={printing}>
          {printing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Printer className="mr-2 h-4 w-4" />
          )}
          Print
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
            <DialogDescription>
              Invoice #{invoice.invoiceNumber} for {patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'}
            </DialogDescription>
          </DialogHeader>
          
          <div 
            className="bg-white rounded-lg overflow-hidden"
            dangerouslySetInnerHTML={{ __html: generatePrintableHTML() }}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            <Button onClick={handlePrint} disabled={printing}>
              {printing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Printer className="mr-2 h-4 w-4" />
              )}
              Print
            </Button>
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
