import { useState, useRef } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { votersAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Upload, Loader2 } from "lucide-react"
import { toast } from "sonner"
import * as xlsx from "xlsx"

export function VoterUploader() {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (data: any) => votersAPI.create(data)
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error("Pilih file excel terlebih dahulu")
      return
    }

    setLoading(true)
    try {
      const data = await file.arrayBuffer()
      const workbook = xlsx.read(data, { type: "array" })

      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]

      // Baca mulai baris 1 (index 0)
      const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1, range: 0 }) as any[][]

      const rows = rawData

      const votersToCreate = []
      let currentOrg = ""

      for (const row of rows) {
        if (!row || row.length === 0) continue

        // Kolom A (index 0) = Nama, Kolom B (index 1) = Kelompok/Utusan
        const name = row[0] ? String(row[0]).trim() : ""
        let org = row[1] ? String(row[1]).trim() : ""

        if (org) {
          currentOrg = org
        } else {
          org = currentOrg
        }

        if (name) {
          votersToCreate.push({
            full_name: name,
            group_name: org,
            is_anonymous: false,
            status: "active"
          })
        }
      }

      if (votersToCreate.length === 0) {
        toast.error("Tidak ada data voter valid yang ditemukan")
        setLoading(false)
        return
      }

      setProgress({ current: 0, total: votersToCreate.length })

      let successCount = 0
      let errorCount = 0

      for (let i = 0; i < votersToCreate.length; i++) {
        try {
          await createMutation.mutateAsync(votersToCreate[i])
          successCount++
        } catch (err: any) {
          console.error(`Gagal insert ${votersToCreate[i].full_name}`, err)
          errorCount++
        }
        setProgress({ current: i + 1, total: votersToCreate.length })
      }

      toast.success(`Import selesai! Berhasil: ${successCount}, Gagal: ${errorCount}`)
      queryClient.invalidateQueries({ queryKey: ["voters"] })
      setOpen(false)
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""

    } catch (error) {
      console.error(error)
      toast.error("Gagal memproses file excel")
    } finally {
      setLoading(false)
      setProgress({ current: 0, total: 0 })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline"><Upload className="mr-2 h-4 w-4 inline" /> Import Excel</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Data Voter</DialogTitle>
          <DialogDescription className="space-y-2">
            <p>Upload file Excel data pemilih. Pastikan mengikuti aturan berikut:</p>
            <ul className="list-disc pl-4 text-xs">
              <li>Hanya Kolom A (Nama) dan Kolom B (Kelompok/Utusan) yang akan dibaca.</li>
              <li>Kolom Nama WAJIB diisi.</li>
              <li>Data akan dibaca SELURUHNYA dari baris pertama sampai akhir.</li>
              <li>Jika kolom Kelompok kosong, sistem akan menggunakan kelompok dari baris sebelumnya.</li>
            </ul>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="excel">File Excel (.xlsx)</Label>
            <Input
              id="excel"
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              ref={fileInputRef}
              disabled={loading}
            />
          </div>

          {loading && progress.total > 0 && (
            <div className="text-sm text-center space-y-2">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
              <p>Memproses {progress.current} dari {progress.total} data...</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Batal</Button>
          <Button onClick={handleUpload} disabled={!file || loading}>
            {loading ? "Memproses..." : "Upload & Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}