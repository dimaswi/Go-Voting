import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { votersAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, Edit, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export default function ShowVoterPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['voters', id],
    queryFn: () => votersAPI.getById(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => votersAPI.delete(id!),
    onSuccess: () => {
      toast.success('Voter berhasil dihapus!')
      queryClient.invalidateQueries({ queryKey: ['voters'] })
      navigate('/admin/voters')
    }
  })

  const handleDelete = () => {
    if (window.confirm('Yakin ingin menghapus voter ini?')) {
      deleteMutation.mutate()
    }
  }

  const voter = data?.data?.data

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!voter) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Voter tidak ditemukan
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin/voters')} className="bg-white">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{voter.full_name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/admin/voters/${id}/edit`)}>
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
                <p className="text-xs font-medium text-muted-foreground mb-1">Nama Lengkap</p>
                <p className="text-sm">{voter.full_name}</p>
              </div>

              <div className="w-full h-px bg-border" />

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
                  <Badge variant={voter.status === 'active' ? 'default' : 'secondary'} className={voter.status === 'active' ? 'bg-green-600 hover:bg-green-600' : ''}>
                    {voter.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Anonimitas</p>
                  <Badge variant={voter.is_anonymous ? 'default' : 'outline'}>
                    {voter.is_anonymous ? 'Anonim' : 'Terbuka'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Dibuat Pada</p>
                  <p className="text-sm">{new Date(voter.created_at || Date.now()).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="w-full h-px bg-border" />

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Biodata & Kontak</p>
                <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">NIK</p>
                    <p className="text-sm">{voter.nik || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                    <p className="text-sm">{voter.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Telepon</p>
                    <p className="text-sm">{voter.phone || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card rounded-xl border shadow-sm p-6">
            <h2 className="text-sm font-semibold mb-6">Akses Voting</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border">
                <span className="text-xs font-medium text-muted-foreground">Kode Akses</span>
                <strong className="text-sm font-mono tracking-wider">{voter.unique_code}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
