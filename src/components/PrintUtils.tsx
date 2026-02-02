import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PrintButtonProps {
  contentRef: React.RefObject<HTMLElement>
  title?: string
  className?: string
}

export function PrintButton({ contentRef, title = 'Print', className }: PrintButtonProps) {
  const handlePrint = () => {
    if (!contentRef.current) return

    const printContent = contentRef.current.innerHTML
    const printWindow = window.open('', '_blank')
    
    if (!printWindow) {
      alert('Please allow popups to print')
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              padding: 20px;
              color: #1a1a1a;
              line-height: 1.5;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: 600;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              padding-bottom: 20px;
              border-bottom: 2px solid #333;
            }
            .header h1 {
              font-size: 24px;
              margin-bottom: 5px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 500;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .font-bold {
              font-weight: bold;
            }
            .mb-4 {
              margin-bottom: 16px;
            }
            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Tansiq Pulse</h1>
            <p>Hospital Management System</p>
          </div>
          ${printContent}
          <div class="footer">
            <p>Printed on ${new Date().toLocaleString()}</p>
            <p>Powered by Tansiq Pulse © ${new Date().getFullYear()} Tansiq Labs</p>
          </div>
        </body>
      </html>
    `)
    
    printWindow.document.close()
    printWindow.focus()
    
    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  return (
    <Button variant="outline" onClick={handlePrint} className={className}>
      <Printer className="mr-2 h-4 w-4" />
      Print
    </Button>
  )
}

// Print wrapper component
interface PrintableAreaProps {
  children: React.ReactNode
  className?: string
}

export function PrintableArea({ children, className }: PrintableAreaProps) {
  return (
    <div className={`print:p-0 ${className || ''}`}>
      {children}
    </div>
  )
}

// Invoice print component
interface InvoicePrintData {
  invoiceNumber: string
  date: string
  patient: {
    name: string
    mrn: string
    phone: string
    address?: string
  }
  items: {
    description: string
    quantity: number
    unitPrice: number
    total: number
  }[]
  subtotal: number
  discount: number
  tax: number
  total: number
  amountPaid: number
  balance: number
  hospitalName: string
  hospitalAddress?: string
  hospitalPhone?: string
}

export function generateInvoicePrintHTML(data: InvoicePrintData): string {
  const itemsHTML = data.items.map(item => `
    <tr>
      <td>${item.description}</td>
      <td class="text-center">${item.quantity}</td>
      <td class="text-right">$${item.unitPrice.toFixed(2)}</td>
      <td class="text-right">$${item.total.toFixed(2)}</td>
    </tr>
  `).join('')

  return `
    <div style="max-width: 800px; margin: 0 auto;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div>
          <h2 style="margin-bottom: 5px;">${data.hospitalName}</h2>
          ${data.hospitalAddress ? `<p>${data.hospitalAddress}</p>` : ''}
          ${data.hospitalPhone ? `<p>Tel: ${data.hospitalPhone}</p>` : ''}
        </div>
        <div style="text-align: right;">
          <h2 style="margin-bottom: 5px;">INVOICE</h2>
          <p><strong>${data.invoiceNumber}</strong></p>
          <p>Date: ${data.date}</p>
        </div>
      </div>

      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="margin-bottom: 10px;">Bill To:</h3>
        <p><strong>${data.patient.name}</strong></p>
        <p>MRN: ${data.patient.mrn}</p>
        <p>Phone: ${data.patient.phone}</p>
        ${data.patient.address ? `<p>${data.patient.address}</p>` : ''}
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="text-center" style="width: 80px;">Qty</th>
            <th class="text-right" style="width: 100px;">Unit Price</th>
            <th class="text-right" style="width: 100px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
        <table style="width: 250px;">
          <tr>
            <td>Subtotal:</td>
            <td class="text-right">$${data.subtotal.toFixed(2)}</td>
          </tr>
          ${data.discount > 0 ? `
          <tr>
            <td>Discount:</td>
            <td class="text-right">-$${data.discount.toFixed(2)}</td>
          </tr>
          ` : ''}
          ${data.tax > 0 ? `
          <tr>
            <td>Tax:</td>
            <td class="text-right">$${data.tax.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr style="font-weight: bold; font-size: 16px;">
            <td>Total:</td>
            <td class="text-right">$${data.total.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Amount Paid:</td>
            <td class="text-right">$${data.amountPaid.toFixed(2)}</td>
          </tr>
          <tr style="font-weight: bold; color: ${data.balance > 0 ? '#dc2626' : '#16a34a'};">
            <td>Balance Due:</td>
            <td class="text-right">$${data.balance.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <div style="margin-top: 40px; text-align: center; color: #666;">
        <p>Thank you for choosing ${data.hospitalName}!</p>
      </div>
    </div>
  `
}
