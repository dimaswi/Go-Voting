import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { eventsAPI } from "@/lib/api"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"

export default function CreateEventPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    name: '',
    description: '',
    start_at: '',
    end_at: '',
    min_choices: 1,
    max_choices: 1,
    allow_multiple_choices: false,
    is_result_public: false,
  })

  const createMutation = useMutation({
    mutationFn: (d: typeof form) => eventsAPI.create(d),
    onSuccess: () => {
      toast.success('Event berhasil dibuat!')
      qc.invalidateQueries({ queryKey: ['events'] })
      navigate('/admin/events')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Terjadi kesalahan')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.min_choices > form.max_choices) {
      toast.error('Minimal pilihan tidak boleh lebih dari maksimal pilihan')
      return
    }
    const payload: any = { ...form }
    if (payload.start_at) payload.start_at = new Date(payload.start_at).toISOString()
    if (payload.end_at) payload.end_at = new Date(payload.end_at).toISOString()

    Object.keys(payload).forEach(key => {
      if (payload[key] === '' || payload[key] === null) {
        delete payload[key]
      }
    })

    createMutation.mutate(payload)
  }

  return (
    <div className="max-w-full space-y-6 animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/events')} className="rounded-full bg-white shadow-sm border border-slate-200">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Buat Event Voting</h1>
          <p className="text-muted-foreground text-sm">Tambahkan event pemilihan baru dan atur konfigurasinya.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section: Event Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="md:col-span-1">
            <h2 className="text-lg font-semibold text-slate-900">Detail Event</h2>
            <p className="text-sm text-slate-500 mt-1">Informasi dasar mengenai event pemilihan.</p>
          </div>

          <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-slate-700">Nama Event <span className="text-red-500">*</span></Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                placeholder="Contoh: Pemilihan Ketua BEM 2025"
                className="bg-transparent shadow-xs"
              />
              <p className="text-[13px] text-slate-500">Nama resmi dari event pemilihan yang akan ditampilkan kepada voter.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700">Deskripsi</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={4}
                placeholder="Penjelasan singkat mengenai event ini..."
                className="bg-transparent shadow-xs resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section: Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="md:col-span-1">
            <h2 className="text-lg font-semibold text-slate-900">Jadwal Pelaksanaan</h2>
            <p className="text-sm text-slate-500 mt-1">Tentukan kapan event ini dimulai dan berakhir.</p>
          </div>

          <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-700">Waktu Mulai <span className="text-red-500">*</span></Label>
                <Input
                  type="datetime-local"
                  value={form.start_at}
                  onChange={(e) => setForm((f) => ({ ...f, start_at: e.target.value }))}
                  required
                  className="bg-transparent shadow-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Waktu Selesai <span className="text-red-500">*</span></Label>
                <Input
                  type="datetime-local"
                  value={form.end_at}
                  onChange={(e) => setForm((f) => ({ ...f, end_at: e.target.value }))}
                  required
                  className="bg-transparent shadow-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section: Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="md:col-span-1">
            <h2 className="text-lg font-semibold text-slate-900">Konfigurasi Voting</h2>
            <p className="text-sm text-slate-500 mt-1">Atur batasan pilihan dan visibilitas hasil.</p>
          </div>

          <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <Label className="text-slate-700">Minimal Pilihan <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  value={form.min_choices}
                  onChange={e => setForm(f => ({ ...f, min_choices: parseInt(e.target.value) || 1 }))}
                  min={1}
                  className="bg-transparent shadow-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Maksimal Pilihan <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  value={form.max_choices}
                  onChange={e => setForm(f => ({ ...f, max_choices: parseInt(e.target.value) || 1 }))}
                  min={1}
                  className="bg-transparent shadow-xs"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="multiple"
                  checked={form.allow_multiple_choices}
                  onCheckedChange={(c) => setForm(f => ({ ...f, allow_multiple_choices: !!c }))}
                />
                <div className="leading-none">
                  <label htmlFor="multiple" className="text-sm font-medium text-slate-900 cursor-pointer">
                    Izinkan pilih lebih dari 1 kandidat
                  </label>
                  <p className="text-[13px] text-slate-500 mt-1">Centang jika pemilih diperbolehkan memilih beberapa opsi sekaligus.</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="public"
                  checked={form.is_result_public}
                  onCheckedChange={(c) => setForm(f => ({ ...f, is_result_public: !!c }))}
                />
                <div className="leading-none">
                  <label htmlFor="public" className="text-sm font-medium text-slate-900 cursor-pointer">
                    Tampilkan Hasil Publik
                  </label>
                  <p className="text-[13px] text-slate-500 mt-1">Jika dicentang, voter dapat melihat hasil perolehan suara secara langsung.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 z-50 flex justify-end gap-3 bg-background/95 backdrop-blur border-t p-4 -mx-4 md:-mx-6 lg:-mx-8 mt-8">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/events')} className="shadow-xs">
            Batal
          </Button>
          <Button type="submit" disabled={createMutation.isPending} className="shadow-xs">
            {createMutation.isPending ? 'Menyimpan...' : 'Simpan Event'}
          </Button>
        </div>
      </form>
    </div>
  )
}
