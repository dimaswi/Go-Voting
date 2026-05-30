import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { candidatesAPI } from "@/lib/api"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { FileUpload } from "@/components/ui/file-upload"

const genderOptions = [
  { value: "male", label: "Laki-laki" },
  { value: "female", label: "Perempuan" },
]

export default function CreateCandidatePage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    full_name: '', nik: '', birth_place: '', birth_date: '',
    gender: '', address: '', phone: '', email: '',
    education: '', organization_experience: '', current_position: '',
    vision: '', mission: '', work_program: '', goals: '',
    motto: '', description: '', is_active: true,
  })

  const [photo, setPhoto] = useState<File | null>(null)
  const [openGender, setOpenGender] = useState(false)

  const createMutation = useMutation({
    mutationFn: (d: typeof form) => candidatesAPI.create(d),
    onSuccess: async (res) => {
      const newCandidateId = res.data?.data?.id
      // Upload photo if exists
      if (photo && newCandidateId) {
        try {
          await candidatesAPI.uploadPhoto(newCandidateId, photo)
        } catch (error) {
          toast.error('Gagal mengunggah foto kandidat, tetapi data berhasil disimpan.')
        }
      }

      toast.success('Kandidat berhasil ditambahkan!')
      qc.invalidateQueries({ queryKey: ['candidates'] })
      navigate('/admin/candidates')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Terjadi kesalahan')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: any = { ...form }
    if (payload.birth_date) {
      payload.birth_date = new Date(payload.birth_date).toISOString()
    } else {
      payload.birth_date = null
    }

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
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/candidates')} className="rounded-full bg-white shadow-sm border border-slate-200">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tambah Kandidat</h1>
          <p className="text-muted-foreground text-sm">Masukkan profil lengkap dan visi misi kandidat baru.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Section: Profil Utama */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="md:col-span-1">
            <h2 className="text-lg font-semibold text-slate-900">Profil Utama</h2>
            <p className="text-sm text-slate-500 mt-1">Informasi dasar tentang identitas kandidat.</p>
          </div>

          <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <Label className="text-slate-700">Nama Lengkap <span className="text-red-500">*</span></Label>
                <Input
                  value={form.full_name}
                  onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))}
                  required
                  placeholder="Nama lengkap beserta gelar (opsional)"
                  className="bg-transparent shadow-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">NIK / Nomor Induk</Label>
                <Input
                  value={form.nik}
                  onChange={(e) => setForm(f => ({ ...f, nik: e.target.value }))}
                  placeholder="Identitas formal"
                  className="bg-transparent shadow-xs"
                />
              </div>

              <div className="space-y-2 flex flex-col">
                <Label className="text-slate-700 mb-2">Jenis Kelamin</Label>
                <Popover open={openGender} onOpenChange={setOpenGender}>
                  <PopoverTrigger
                    render={
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openGender}
                        className="w-full justify-between bg-transparent shadow-xs font-normal"
                      />
                    }
                  >
                    {form.gender
                      ? genderOptions.find((opt) => opt.value === form.gender)?.label
                      : "Pilih jenis kelamin..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Cari jenis kelamin..." />
                      <CommandList>
                        <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {genderOptions.map((opt) => (
                            <CommandItem
                              key={opt.value}
                              value={opt.value}
                              onSelect={(currentValue) => {
                                setForm(f => ({ ...f, gender: currentValue === form.gender ? "" : currentValue }))
                                setOpenGender(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.gender === opt.value ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {opt.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">Tempat Lahir</Label>
                <Input
                  value={form.birth_place}
                  onChange={(e) => setForm(f => ({ ...f, birth_place: e.target.value }))}
                  className="bg-transparent shadow-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">Tanggal Lahir</Label>
                <Input
                  type="date"
                  value={form.birth_date}
                  onChange={(e) => setForm(f => ({ ...f, birth_date: e.target.value }))}
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
                  placeholder="kandidat@email.com"
                  className="bg-transparent shadow-xs"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label className="text-slate-700">Jabatan Saat Ini</Label>
                <Input
                  value={form.current_position}
                  onChange={(e) => setForm(f => ({ ...f, current_position: e.target.value }))}
                  className="bg-transparent shadow-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section: Platform & Visi Misi */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="md:col-span-1">
            <h2 className="text-lg font-semibold text-slate-900">Platform & Visi Misi</h2>
            <p className="text-sm text-slate-500 mt-1">Motto, visi utama, dan penjabaran program kerja kandidat.</p>
          </div>

          <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-slate-700">Motto</Label>
              <Input
                value={form.motto}
                onChange={(e) => setForm(f => ({ ...f, motto: e.target.value }))}
                placeholder="Slogan singkat yang menarik"
                className="bg-transparent shadow-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700">Visi</Label>
              <Textarea
                rows={3}
                value={form.vision}
                onChange={(e) => setForm(f => ({ ...f, vision: e.target.value }))}
                className="bg-transparent shadow-xs resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700">Misi</Label>
              <Textarea
                rows={3}
                value={form.mission}
                onChange={(e) => setForm(f => ({ ...f, mission: e.target.value }))}
                className="bg-transparent shadow-xs resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700">Program Kerja</Label>
              <Textarea
                rows={4}
                value={form.work_program}
                onChange={(e) => setForm(f => ({ ...f, work_program: e.target.value }))}
                className="bg-transparent shadow-xs resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section: Media & File */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="md:col-span-1">
            <h2 className="text-lg font-semibold text-slate-900">Media & File</h2>
            <p className="text-sm text-slate-500 mt-1">Unggah foto atau poster untuk profil kandidat.</p>
          </div>

          <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-700">Foto Kandidat</Label>
              <FileUpload
                onFileSelect={(file) => setPhoto(file)}
                maxSize={2}
                accept="image/jpeg, image/png, image/webp"
              />
            </div>

            <div className="flex items-center space-x-3 pt-4 border-t border-slate-100">
              <Checkbox
                id="active"
                checked={form.is_active}
                onCheckedChange={(c) => setForm(f => ({ ...f, is_active: !!c }))}
              />
              <div className="leading-none">
                <label htmlFor="active" className="text-sm font-medium text-slate-900 cursor-pointer">
                  Kandidat Aktif
                </label>
                <p className="text-[13px] text-slate-500 mt-1">Hanya kandidat aktif yang dapat ditambahkan ke event.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 z-50 flex justify-end gap-3 bg-background/95 backdrop-blur border-t p-4 -mx-4 md:-mx-6 lg:-mx-8 mt-8">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/candidates')} className="shadow-xs">
            Batal
          </Button>
          <Button type="submit" disabled={createMutation.isPending} className="shadow-xs">
            {createMutation.isPending ? 'Menyimpan...' : 'Simpan Kandidat'}
          </Button>
        </div>
      </form>
    </div>
  )
}
