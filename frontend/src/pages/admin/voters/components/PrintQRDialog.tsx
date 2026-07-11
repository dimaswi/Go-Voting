import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { Voter } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface PrintQRDialogProps {
  voters: Voter[]
}

export function PrintQRDialog({ voters }: PrintQRDialogProps) {
  const [open, setOpen] = useState(false)

  const handlePrint = () => {
    // Generate a printable HTML document
    let htmlContent = `
      <html>
        <head>
          <title>Print QR Codes</title>
          <style>
            @media print {
              @page { margin: 1cm; }
              body { -webkit-print-color-adjust: exact; font-family: sans-serif; }
            }
            body { margin: 0; padding: 20px; font-family: sans-serif; }
            .grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
            }
            .card {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 16px;
              text-align: center;
              page-break-inside: avoid;
            }
            .qr-image {
              width: 100%;
              max-width: 120px;
              height: auto;
              margin: 0 auto 10px;
              display: block;
            }
            .name {
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 4px;
              word-break: break-word;
            }
            .group {
              font-size: 11px;
              color: #6b7280;
            }
            .code {
              font-size: 12px;
              font-family: monospace;
              margin-top: 8px;
              background: #f3f4f6;
              padding: 2px 4px;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="grid">
    `

    // Add only voters that have a QR code generated
    const votersWithQR = voters.filter(v => v.qr_code_url)

    votersWithQR.forEach(voter => {
      htmlContent += `
        <div class="card">
          <img src="${voter.qr_code_url}" class="qr-image" />
          <div class="name">${voter.full_name}</div>
          ${voter.group_name ? `<div class="group">${voter.group_name}</div>` : ''}
          <div class="code">${voter.unique_code}</div>
        </div>
      `
    })

    htmlContent += `
          </div>
          <script>
            window.onload = () => {
              window.print();
              // window.close();
            }
          </script>
        </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
    }
  }

  const qrCount = voters.filter(v => v.qr_code_url).length

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline"><Printer className="mr-2 h-4 w-4 inline" /> Print QR</Button>} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Print QR Code Pemilih</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Fitur ini akan membuka tab baru berisi daftar QR Code yang siap dicetak.
            Pastikan browser Anda mengizinkan popup window.
          </p>
          <div className="bg-muted p-4 rounded-lg flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">Total Pemilih</p>
              <p className="text-2xl font-bold">{voters.length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">Memiliki QR Code</p>
              <p className="text-2xl font-bold text-primary">{qrCount}</p>
            </div>
          </div>
          {qrCount < voters.length && (
            <p className="text-xs text-amber-600 mt-2">
              *Terdapat {voters.length - qrCount} pemilih yang belum memiliki QR Code.
              Silakan generate QR Code terlebih dahulu jika ingin dicetak.
            </p>
          )}
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button onClick={handlePrint} disabled={qrCount === 0}>
            <Printer className="mr-2 h-4 w-4" /> Buka Halaman Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
