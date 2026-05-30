import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { votersAPI } from "@/lib/api"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2 } from "lucide-react"

export default function EditVoterPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['voters', id],
    queryFn: () => votersAPI.getById(id!),
    enabled: !!id,
  })

  const [form, setForm] = useState({
    full_name: '',
    identity_number: '',
    phone: '',
    email: '',
    group_name: '',
    is_anonymous: false,
  })

  useEffect(() => {
    if (data?.data?.data) {
      const v = data.data.data
      setForm({
        full_name: v.full_name || '',
        identity_number: v.identity_number || '',
        phone: v.phone || '',
        email: v.email || '',
        group_name: v.group_name || '',
        is_anonymous: v.is_anonymous || false,
      })
    }
  }, [data])

  const updateMutation = useMutation({
    mutationFn: (d: typeof form) => votersAPI.update(id!, d),
    onSuccess: () => {
      toast.success('Voter berhasil diperbarui!')
      qc.invalidateQueries({ queryKey: ['voters'] })
      navigate('/admin/voters')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Terjadi kesalahan')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: any = { ...form }
    Object.keys(payload).forEach(key => {
      if (payload[key] === '' || payload[key] === null) {
        delete payload[key]
      }
    })
    updateMutation.mutate(payload)
  }

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="max-w-full space-y-6 animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/voters')} className="rounded-full bg-white shadow-sm border border-slate-200">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Voter</h1>
          <p className="text-muted-foreground text-sm">Perbarui data diri dan privasi pemilih.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Section: Data Pemilih */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="md:col-span-1">
            <h2 className="text-lg font-semibold text-slate-900">Data Diri Pemilih</h2>
            <p className="text-sm text-slate-500 mt-1">Informasi identitas untuk memverifikasi hak suara voter.</p>
          </div>

          <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-700">Nama Lengkap <span className="text-red-500">*</span></Label>
                <Input
                  value={form.full_name}
                  onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))}
                  required
                  placeholder="Nama voter sesuai identitas"
                  className="bg-transparent shadow-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">NIK / ID Peserta</Label>
                <Input
                  value={form.identity_number}
                  onChange={(e) => setForm(f => ({ ...f, identity_number: e.target.value }))}
                  placeholder="Nomor identitas (opsional)"
                  className="bg-transparent shadow-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">No. HP</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="0812xxxxxx"
                  className="bg-transparent shadow-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="voter@email.com"
                  className="bg-transparent shadow-xs"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label className="text-slate-700">Instansi / Kelompok</Label>
                <Input
                  value={form.group_name}
                  onChange={(e) => setForm(f => ({ ...f, group_name: e.target.value }))}
                  placeholder="Kelas, angkatan, divisi, dsb."
                  className="bg-transparent shadow-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section: Pengaturan Privasi */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="md:col-span-1">
            <h2 className="text-lg font-semibold text-slate-900">Pengaturan Privasi</h2>
            <p className="text-sm text-slate-500 mt-1">Konfigurasi anonimitas suara pemilih.</p>
          </div>

          <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="anonymous"
                checked={form.is_anonymous}
                onCheckedChange={(c) => setForm(f => ({ ...f, is_anonymous: !!c }))}
              />
              <div className="leading-none">
                <label htmlFor="anonymous" className="text-sm font-medium text-slate-900 cursor-pointer">
                  Jadikan Voter Anonim
                </label>
                <p className="text-[13px] text-slate-500 mt-1">Identitas voter akan disembunyikan dalam laporan hasil voting publik.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 z-50 flex justify-end gap-3 bg-background/95 backdrop-blur border-t p-4 -mx-4 md:-mx-6 lg:-mx-8 mt-8">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/voters')} className="shadow-xs">
            Batal
          </Button>
          <Button type="submit" disabled={updateMutation.isPending} className="shadow-xs">
            {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </div>
  )
}
