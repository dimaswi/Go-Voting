import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { candidatesAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, Edit, Trash2, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export default function ShowCandidatePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['candidates', id],
    queryFn: () => candidatesAPI.getById(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => candidatesAPI.delete(id!),
    onSuccess: () => {
      toast.success('Kandidat berhasil dihapus!')
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      navigate('/admin/candidates')
    }
  })

  const handleDelete = () => {
    if (window.confirm('Yakin ingin menghapus kandidat ini?')) {
      deleteMutation.mutate()
    }
  }

  const candidate = data?.data?.data

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Kandidat tidak ditemukan
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin/candidates')} className="bg-white">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{candidate.full_name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/admin/candidates/${id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" /> Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteMutation.isPending}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-xl border shadow-sm p-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Nama</p>
                <p className="text-sm">{candidate.full_name}</p>
              </div>

              <div className="w-full h-px bg-border" />

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Jabatan Saat Ini</p>
                <p className="text-sm">{candidate.current_position || '-'}</p>
              </div>

              <div className="w-full h-px bg-border" />

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
                  <Badge variant={candidate.is_active ? 'default' : 'secondary'} className={candidate.is_active ? 'bg-green-600 hover:bg-green-600' : ''}>
                    {candidate.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Dibuat Pada</p>
                  <p className="text-sm">{new Date(candidate.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Kategori</p>
                  <Badge variant="outline">Candidates</Badge>
                </div>
              </div>

              <div className="w-full h-px bg-border" />

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Biodata Tambahan</p>
                <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">NIK</p>
                    <p className="text-sm">{candidate.nik || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Jenis Kelamin</p>
                    <p className="text-sm">{candidate.gender === 'L' ? 'Laki-laki' : candidate.gender === 'P' ? 'Perempuan' : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">TTL</p>
                    <p className="text-sm">{candidate.birth_place || '-'}, {candidate.birth_date ? new Date(candidate.birth_date).toLocaleDateString() : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Kontak</p>
                    <p className="text-sm">{candidate.phone || candidate.email || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border shadow-sm p-6">
            <div className="space-y-6">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Motto</p>
                {candidate.motto ? (
                  <blockquote className="border-l-4 border-primary pl-4 italic text-sm text-foreground">
                    "{candidate.motto}"
                  </blockquote>
                ) : <p className="text-sm text-muted-foreground">-</p>}
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Visi</p>
                <p className="text-sm whitespace-pre-wrap">{candidate.vision || '-'}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Misi</p>
                <p className="text-sm whitespace-pre-wrap">{candidate.mission || '-'}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Program Kerja</p>
                <p className="text-sm whitespace-pre-wrap">{candidate.work_program || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="text-sm font-semibold">Foto Kandidat</h3>
            </div>
            <div className="p-6 flex justify-center bg-muted/30">
              {candidate.photo_url ? (
                <img src={candidate.photo_url} alt={candidate.full_name} className="max-w-full h-auto rounded-lg shadow-sm" />
              ) : (
                <div className="w-full aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground bg-background">
                  <User className="w-8 h-8 mb-2" />
                  <span className="text-sm">Tidak ada foto</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
