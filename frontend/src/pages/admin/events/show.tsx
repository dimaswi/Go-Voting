import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { eventsAPI, candidatesAPI, votersAPI } from "@/lib/api"
import { VotingEvent, EventCandidate, EventVoter, Candidate, Voter } from "@/types"
import { cn, getStatusColor, getStatusLabel, formatDateTime } from "@/lib/utils"
import { toast } from "sonner"
import {
  ArrowLeft, Calendar, Users, UserCheck, BarChart2,
  Plus, Trash2, Play, Square, ExternalLink,
  CheckSquare, Copy, Edit, Printer
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"


export default function ShowEventPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'candidates' | 'voters'>('candidates')
  const [candidateSearch, setCandidateSearch] = useState('')
  const [voterSearch, setVoterSearch] = useState('')
  const [showAssignCandidates, setShowAssignCandidates] = useState(false)
  const [showAssignVoters, setShowAssignVoters] = useState(false)
  const [selectedCandidates, setSelectedCandidates] = useState<Record<string, { number: number }>>({})
  const [selectedVoterIds, setSelectedVoterIds] = useState<string[]>([])
  const [selectedToRemove, setSelectedToRemove] = useState<string[]>([])
  const [deleteVoterId, setDeleteVoterId] = useState<string | null>(null)
  const [showBulkRemoveVoter, setShowBulkRemoveVoter] = useState(false)

  const { data: eventData, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsAPI.getById(id!),
    enabled: !!id,
  })

  const { data: eventCandidatesData } = useQuery({
    queryKey: ['event-candidates', id],
    queryFn: () => candidatesAPI.listByEvent(id!),
    enabled: !!id,
  })

  const { data: eventVotersData } = useQuery({
    queryKey: ['event-voters', id],
    queryFn: () => votersAPI.listByEvent(id!, { per_page: 100000 }),
    enabled: !!id,
  })

  const { data: allCandidatesData } = useQuery({
    queryKey: ['all-candidates', candidateSearch],
    queryFn: () => candidatesAPI.list({ search: candidateSearch, is_active: true, per_page: 100000 }),
    enabled: showAssignCandidates,
  })

  const { data: allVotersData } = useQuery({
    queryKey: ['all-voters', voterSearch],
    queryFn: () => votersAPI.list({ search: voterSearch, per_page: 100000 }),
    enabled: showAssignVoters,
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => eventsAPI.updateStatus(id!, status),
    onSuccess: () => {
      toast.success('Status event diperbarui!')
      qc.invalidateQueries({ queryKey: ['event', id] })
      qc.invalidateQueries({ queryKey: ['events'] })
    },
  })

  const assignCandidatesMutation = useMutation({
    mutationFn: (candidates: object[]) => candidatesAPI.assignToEvent(id!, candidates),
    onSuccess: () => {
      toast.success('Kandidat berhasil di-assign!')
      qc.invalidateQueries({ queryKey: ['event-candidates', id] })
      qc.invalidateQueries({ queryKey: ['event', id] })
      setShowAssignCandidates(false)
      setSelectedCandidates({})
    },
  })

  const removeCandidateMutation = useMutation({
    mutationFn: (candidateId: string) => candidatesAPI.removeFromEvent(id!, candidateId),
    onSuccess: () => {
      toast.success('Kandidat dihapus dari event!')
      qc.invalidateQueries({ queryKey: ['event-candidates', id] })
    },
  })

  const assignVotersMutation = useMutation({
    mutationFn: (voterIds: string[]) => votersAPI.assignToEvent(id!, voterIds),
    onSuccess: () => {
      toast.success('Voter berhasil di-assign!')
      qc.invalidateQueries({ queryKey: ['event-voters', id] })
      qc.invalidateQueries({ queryKey: ['event', id] })
      setShowAssignVoters(false)
      setSelectedVoterIds([])
    },
  })

  const removeVoterMutation = useMutation({
    mutationFn: (voterId: string) => votersAPI.removeFromEvent(id!, voterId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-voters', id] })
    },
  })

  const removeBulkVotersMutation = useMutation({
    mutationFn: (voterIds: string[]) => Promise.all(voterIds.map(voterId => votersAPI.removeFromEvent(id!, voterId))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-voters', id] })
      qc.invalidateQueries({ queryKey: ['event', id] })
      setSelectedToRemove([])
    },
  })

  const event: VotingEvent | undefined = eventData?.data?.data
  const eventCandidates: EventCandidate[] = eventCandidatesData?.data?.data || []
  const eventVoters: EventVoter[] = eventVotersData?.data?.data || []
  const allCandidates: Candidate[] = allCandidatesData?.data?.data || []
  const allVoters: Voter[] = allVotersData?.data?.data || []

  const maxExistingNumber = eventCandidates.reduce((max, ec) => Math.max(max, ec.candidate_number || 0), 0)

  if (isLoading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
    </div>
  )

  if (!event) return (
    <div className="text-center py-12 text-muted-foreground">
      Event tidak ditemukan
    </div>
  )

  const copyLink = () => {
    const link = `${window.location.origin}/vote`
    navigator.clipboard.writeText(link)
    toast.success('Link voting disalin!')
  }

  const handleAssignCandidates = () => {
    const candidates = Object.entries(selectedCandidates).map(([candidateId, data], idx) => ({
      candidate_id: candidateId,
      candidate_number: data.number || maxExistingNumber + idx + 1,
      sort_order: eventCandidates.length + idx,
    }))
    assignCandidatesMutation.mutate(candidates)
  }

  const confirmRemoveVoter = () => {
    if (!deleteVoterId) return
    toast.promise(removeVoterMutation.mutateAsync(deleteVoterId).finally(() => setDeleteVoterId(null)), {
      loading: 'Menghapus voter dari event...',
      success: 'Voter berhasil dihapus dari event!',
      error: 'Gagal menghapus voter'
    })
  }

  const confirmBulkRemoveVoters = () => {
    if (selectedToRemove.length === 0) {
      setShowBulkRemoveVoter(false)
      return
    }
    toast.promise(removeBulkVotersMutation.mutateAsync(selectedToRemove).finally(() => setShowBulkRemoveVoter(false)), {
      loading: 'Menghapus voter dari event...',
      success: 'Voter berhasil dihapus dari event!',
      error: 'Gagal menghapus voter'
    })
  }

  const handlePrintEventVoters = async () => {
    if (eventVoters.length === 0) {
      toast.error("Tidak ada voter di event ini")
      return
    }

    try {
      const toastId = toast.loading("Generating PDF...")
      const voterIds = eventVoters.map(ev => ev.voter_id)
      const response = await votersAPI.printBulk(voterIds)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `event_voters_qr_${new Date().getTime()}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success("PDF berhasil diunduh!", { id: toastId })
    } catch (err) {
      toast.error("Gagal men-generate PDF")
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin/events')} className="bg-white">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          {event.status === 'draft' && (
            <Button size="sm" onClick={() => statusMutation.mutate('active')} disabled={statusMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white">
              <Play className="w-4 h-4 mr-2" /> Aktifkan
            </Button>
          )}
          {event.status === 'active' && (
            <Button size="sm" onClick={() => statusMutation.mutate('finished')} disabled={statusMutation.isPending} variant="destructive">
              <Square className="w-4 h-4 mr-2" /> Selesaikan
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => navigate(`/admin/events/${id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" /> Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-xl border shadow-sm p-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Nama Event</p>
                <p className="text-sm">{event.name}</p>
              </div>

              <div className="w-full h-px bg-border" />

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Deskripsi</p>
                <p className="text-sm">{event.description || '-'}</p>
              </div>

              <div className="w-full h-px bg-border" />

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
                  <Badge variant="secondary" className={getStatusColor(event.status)}>
                    {getStatusLabel(event.status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Kategori</p>
                  <Badge variant="outline">Events</Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Dibuat Pada</p>
                  <p className="text-sm">{new Date(event.created_at || Date.now()).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="w-full h-px bg-border" />

              <div>
                <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Mulai</p>
                    <p className="text-sm font-medium">{formatDateTime(event.start_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Selesai</p>
                    <p className="text-sm font-medium">{formatDateTime(event.end_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Aturan Pilihan</p>
                    <p className="text-sm font-medium">Min: {event.min_choices} | Max: {event.max_choices}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{event.allow_multiple_choices ? 'Boleh multi pilih' : 'Single pilih'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Akses Hasil</p>
                    <p className="text-sm font-medium">{event.is_result_public ? 'Publik' : 'Privat'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('candidates')}
                className={cn(
                  "flex-1 py-4 text-sm font-medium transition-colors",
                  activeTab === 'candidates'
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                Kandidat ({event.total_candidates})
              </button>
              <button
                onClick={() => setActiveTab('voters')}
                className={cn(
                  "flex-1 py-4 text-sm font-medium transition-colors",
                  activeTab === 'voters'
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                Voter ({event.total_voters})
              </button>
            </div>

            {/* Candidates tab */}
            {activeTab === 'candidates' && (
              <div>
                <div className="flex items-center justify-between px-5 py-4 border-b">
                  <p className="text-sm text-muted-foreground">{eventCandidates.length} kandidat di-assign</p>
                  <Button size="sm" onClick={() => setShowAssignCandidates(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Assign Kandidat
                  </Button>
                </div>
                {eventCandidates.length === 0 ? (
                  <div className="py-12 text-center">
                    <Users className="w-10 h-10 text-muted mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">Belum ada kandidat di-assign ke event ini</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {eventCandidates.map(ec => (
                      <div key={ec.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/50">
                        <div className="w-9 h-9 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-bold text-sm">
                          {ec.candidate_number}
                        </div>
                        {ec.photo_url && (
                          <img src={ec.photo_url} alt={ec.full_name} className="w-9 h-9 rounded-xl object-cover" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{ec.full_name}</p>
                          {ec.vision && <p className="text-xs text-muted-foreground truncate mt-0.5">{ec.vision}</p>}
                        </div>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => removeCandidateMutation.mutate(ec.candidate_id)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Voters tab */}
            {activeTab === 'voters' && (
              <div>
                <div className="flex items-center justify-between px-5 py-4 border-b">
                  <div className="flex items-center">
                    <Checkbox
                      className="mr-3"
                      checked={eventVoters.length > 0 && selectedToRemove.length === eventVoters.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedToRemove(eventVoters.map(ev => ev.voter_id))
                        } else {
                          setSelectedToRemove([])
                        }
                      }}
                    />
                    <p className="text-sm text-muted-foreground">{eventVoters.length} voter di-assign</p>
                  </div>
                  <div className="flex gap-2">
                    {selectedToRemove.length > 0 && (
                      <Button size="sm" variant="destructive" onClick={() => setShowBulkRemoveVoter(true)} disabled={removeBulkVotersMutation.isPending}>
                        <Trash2 className="w-4 h-4 mr-2" /> Hapus {selectedToRemove.length}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={handlePrintEventVoters} disabled={eventVoters.length === 0}>
                      <Printer className="w-4 h-4 mr-2" /> Print Semua QR
                    </Button>
                    <Button size="sm" onClick={() => setShowAssignVoters(true)}>
                      <Plus className="w-4 h-4 mr-2" /> Assign Voter
                    </Button>
                  </div>
                </div>
                {eventVoters.length === 0 ? (
                  <div className="py-12 text-center">
                    <UserCheck className="w-10 h-10 text-muted mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">Belum ada voter di-assign ke event ini</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {eventVoters.map(ev => (
                      <div key={ev.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/50">
                        <Checkbox 
                          checked={selectedToRemove.includes(ev.voter_id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedToRemove(prev => [...prev, ev.voter_id])
                            } else {
                              setSelectedToRemove(prev => prev.filter(id => id !== ev.voter_id))
                            }
                          }}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {ev.is_anonymous ? '🔒 Anonim' : ev.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 font-mono">{ev.unique_code}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {ev.has_voted ? (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-600">✓ Sudah Vote</Badge>
                          ) : (
                            <Badge variant="secondary">Belum Vote</Badge>
                          )}
                          {ev.qr_code_url && (
                            <a href={ev.qr_code_url} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 hover:bg-muted rounded-lg transition">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <Button
                            variant="ghost" size="icon"
                            disabled={removeVoterMutation.isPending}
                            onClick={() => setDeleteVoterId(ev.voter_id)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card rounded-xl border shadow-sm p-6">
            <h2 className="text-sm font-semibold mb-6">Akses & Hasil</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border">
                <span className="text-xs font-medium text-muted-foreground">Kode Event</span>
                <strong className="text-sm font-mono tracking-wider">{event.code}</strong>
              </div>
              <Button variant="outline" className="w-full" onClick={copyLink}>
                <Copy className="w-4 h-4 mr-2" /> Salin Link Voting
              </Button>
              <Button className="w-full" onClick={() => navigate(`/admin/events/${id}/results`)}>
                <BarChart2 className="w-4 h-4 mr-2" /> Lihat Hasil Voting
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-xl border shadow-sm p-6">
            <h2 className="text-sm font-semibold mb-6">Statistik Partisipasi</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground flex items-center"><Users className="w-4 h-4 mr-2 text-primary" /> Total Kandidat</span>
                <span className="font-semibold text-sm">{event.total_candidates}</span>
              </div>
              <div className="w-full h-px bg-border" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground flex items-center"><UserCheck className="w-4 h-4 mr-2 text-primary" /> Total Voter</span>
                <span className="font-semibold text-sm">{event.total_voters}</span>
              </div>
              <div className="w-full h-px bg-border" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground flex items-center"><CheckSquare className="w-4 h-4 mr-2 text-green-600" /> Sudah Vote</span>
                <span className="font-semibold text-sm">{event.total_voted}</span>
              </div>
              <div className="w-full h-px bg-border" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground flex items-center"><Calendar className="w-4 h-4 mr-2 text-amber-500" /> Belum Vote</span>
                <span className="font-semibold text-sm">{event.total_voters - event.total_voted}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Candidates Dialog */}
      <Dialog open={showAssignCandidates} onOpenChange={setShowAssignCandidates}>
        <DialogContent className="max-w-xl max-h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2 border-b">
            <DialogTitle>Assign Kandidat ke Event</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-3 flex items-center justify-between border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  allCandidates.length > 0 &&
                  allCandidates.every(c => !!selectedCandidates[c.id] || eventCandidates.some(ec => ec.candidate_id === c.id))
                }
                onCheckedChange={(checked) => {
                  if (checked) {
                    const toAdd = allCandidates.filter(c => !eventCandidates.some(ec => ec.candidate_id === c.id))
                    setSelectedCandidates(prev => {
                      const next = { ...prev }
                      let offset = maxExistingNumber + Object.keys(prev).length + 1
                      toAdd.forEach(c => {
                        if (!next[c.id]) {
                          next[c.id] = { number: offset++ }
                        }
                      })
                      return next
                    })
                  } else {
                    const pageIds = allCandidates.map(c => c.id)
                    setSelectedCandidates(prev => {
                      const next = { ...prev }
                      pageIds.forEach(id => delete next[id])
                      return next
                    })
                  }
                }}
              />
              <span className="text-sm font-medium">Pilih Semua {candidateSearch && "yang difilter"}</span>
            </div>
          </div>
          <div className="px-6 py-2">
            <Input
              value={candidateSearch}
              onChange={e => setCandidateSearch(e.target.value)}
              placeholder="Cari kandidat..."
            />
          </div>
          <div className="flex-1 overflow-y-auto divide-y">
            {allCandidates.map((c, idx) => {
              const isSelected = !!selectedCandidates[c.id]
              const isAlreadyAssigned = eventCandidates.some(ec => ec.candidate_id === c.id)
              return (
                <div
                  key={c.id}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3 transition",
                    isAlreadyAssigned ? "opacity-50 cursor-not-allowed bg-muted/50" : "hover:bg-muted cursor-pointer",
                    isSelected && "bg-primary/5"
                  )}
                  onClick={() => {
                    if (isAlreadyAssigned) return
                    setSelectedCandidates(prev => {
                      if (prev[c.id]) {
                        const n = { ...prev }
                        delete n[c.id]
                        return n
                      }
                      return { ...prev, [c.id]: { number: maxExistingNumber + Object.keys(prev).length + 1 } }
                    })
                  }}
                >
                  <Checkbox checked={isSelected || isAlreadyAssigned} disabled={isAlreadyAssigned} />
                  {c.photo_url && <img src={c.photo_url} alt={c.full_name} className="w-8 h-8 rounded-lg object-cover" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{c.full_name}</p>
                    {isAlreadyAssigned && <p className="text-xs text-muted-foreground">Sudah di-assign</p>}
                  </div>
                  {isSelected && (
                    <Input
                      type="number"
                      value={selectedCandidates[c.id]?.number || ''}
                      min={1}
                      onClick={e => e.stopPropagation()}
                      onChange={e => setSelectedCandidates(prev => ({
                        ...prev, [c.id]: { number: parseInt(e.target.value) || 1 }
                      }))}
                      className="w-16 h-8 text-center"
                    />
                  )}
                </div>
              )
            })}
          </div>
          <div className="p-4 border-t flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAssignCandidates(false)}>Batal</Button>
            <Button
              onClick={handleAssignCandidates}
              disabled={Object.keys(selectedCandidates).length === 0 || assignCandidatesMutation.isPending}
            >
              {assignCandidatesMutation.isPending ? 'Menyimpan...' : `Assign ${Object.keys(selectedCandidates).length} Kandidat`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Voters Dialog */}
      <Dialog open={showAssignVoters} onOpenChange={setShowAssignVoters}>
        <DialogContent className="max-w-xl max-h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2 border-b">
            <DialogTitle>Assign Voter ke Event</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-3 flex items-center justify-between border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  allVoters.length > 0 &&
                  allVoters.every(v => selectedVoterIds.includes(v.id) || eventVoters.some(ev => ev.voter_id === v.id))
                }
                onCheckedChange={(checked) => {
                  if (checked) {
                    const toAdd = allVoters
                      .filter(v => !eventVoters.some(ev => ev.voter_id === v.id))
                      .map(v => v.id)
                    setSelectedVoterIds(prev => [...new Set([...prev, ...toAdd])])
                  } else {
                    const pageIds = allVoters.map(v => v.id)
                    setSelectedVoterIds(prev => prev.filter(id => !pageIds.includes(id)))
                  }
                }}
              />
              <span className="text-sm font-medium">Pilih Semua {voterSearch && "yang difilter"}</span>
            </div>
          </div>
          <div className="px-6 py-2">
            <Input
              value={voterSearch}
              onChange={e => setVoterSearch(e.target.value)}
              placeholder="Cari voter..."
            />
          </div>
          <div className="flex-1 overflow-y-auto divide-y">
            {allVoters.map(v => {
              const isSelected = selectedVoterIds.includes(v.id)
              const isAlreadyAssigned = eventVoters.some(ev => ev.voter_id === v.id)
              return (
                <div
                  key={v.id}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3 transition",
                    isAlreadyAssigned ? "opacity-50 cursor-not-allowed bg-muted/50" : "hover:bg-muted cursor-pointer",
                    isSelected && "bg-primary/5"
                  )}
                  onClick={() => {
                    if (isAlreadyAssigned) return
                    setSelectedVoterIds(prev =>
                      prev.includes(v.id) ? prev.filter(id => id !== v.id) : [...prev, v.id]
                    )
                  }}
                >
                  <Checkbox checked={isSelected || isAlreadyAssigned} disabled={isAlreadyAssigned} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{v.full_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{v.unique_code}</p>
                    {isAlreadyAssigned && <p className="text-xs text-primary">Sudah di-assign</p>}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="p-4 border-t flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAssignVoters(false)}>Batal</Button>
            <Button
              onClick={() => assignVotersMutation.mutate(selectedVoterIds)}
              disabled={selectedVoterIds.length === 0 || assignVotersMutation.isPending}
            >
              {assignVotersMutation.isPending ? 'Menyimpan...' : `Assign ${selectedVoterIds.length} Voter`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteVoterId}
        onOpenChange={(o) => !o && setDeleteVoterId(null)}
        title="Hapus Voter"
        description="Apakah Anda yakin ingin menghapus voter ini dari event? Tindakan ini tidak dapat dibatalkan."
        onConfirm={confirmRemoveVoter}
        isLoading={removeVoterMutation.isPending}
      />
      <ConfirmDialog
        open={showBulkRemoveVoter}
        onOpenChange={setShowBulkRemoveVoter}
        title="Hapus Voter Terpilih"
        description={`Apakah Anda yakin ingin menghapus ${selectedToRemove.length} voter terpilih dari event ini?`}
        onConfirm={confirmBulkRemoveVoters}
        isLoading={removeBulkVotersMutation.isPending}
      />
    </div>
  )
}
