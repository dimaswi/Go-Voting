import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { votingAPI } from '@/lib/api'
import type { ValidateCodeResponse, EventCandidate } from '@/types'
import { cn, formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import { Check, ChevronRight, Loader2, Vote, User, AlertCircle, Clock, Info } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function VotingPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [detailCandidate, setDetailCandidate] = useState<EventCandidate | null>(null)

  // Get session from storage
  const sessionData: ValidateCodeResponse | null = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('voting_session') || 'null')
    } catch {
      return null
    }
  })()

  const event = sessionData?.events.find(e => e.id === eventId)

  const { data: candidatesData, isLoading } = useQuery({
    queryKey: ['vote-candidates', eventId],
    queryFn: () => votingAPI.getCandidates(eventId!, sessionData?.token || ''),
    enabled: !!eventId && !!sessionData?.token,
  })

  const candidates: EventCandidate[] = candidatesData?.data?.data || []

  useEffect(() => {
    if (!sessionData) {
      toast.error('Sesi tidak ditemukan. Silakan scan ulang.', { id: 'session-error' })
      navigate('/vote')
    }
  }, [sessionData, navigate])

  if (!sessionData || !event) {
    return (
      <div className="min-h-screen bg-[#fef3c7] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="font-bold text-black">Sesi tidak valid</p>
          <button onClick={() => navigate('/vote')} className="neo-btn bg-black text-white px-6 py-2.5 rounded-xl mt-4 text-sm">
            Kembali
          </button>
        </div>
      </div>
    )
  }

  if (event.has_voted) {
    return (
      <div className="min-h-screen bg-[#fef3c7] flex items-center justify-center p-6">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_#000] rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-400 border-4 border-black rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-black" />
          </div>
          <h2 className="text-2xl font-black text-black uppercase">SUDAH VOTE!</h2>
          <p className="text-gray-600 mt-2">Anda sudah memberikan suara di event ini.</p>
          <button onClick={() => navigate('/vote')} className="neo-btn bg-black text-white px-6 py-3 rounded-xl mt-6 w-full">
            SELESAI
          </button>
        </div>
      </div>
    )
  }

  const toggleCandidate = (id: string) => {
    if (event.allow_multiple_choices) {
      if (selectedIds.includes(id)) {
        setSelectedIds(prev => prev.filter(i => i !== id))
      } else {
        if (selectedIds.length >= event.max_choices) {
          toast.error(`Maksimal ${event.max_choices} kandidat`)
          return
        }
        setSelectedIds(prev => [...prev, id])
      }
    } else {
      setSelectedIds([id])
    }
  }

  const canProceed = selectedIds.length >= event.min_choices && selectedIds.length <= event.max_choices

  const handleProceed = () => {
    if (!canProceed) {
      toast.error(`Pilih ${event.min_choices === event.max_choices ? event.min_choices : `${event.min_choices}-${event.max_choices}`} kandidat`)
      return
    }
    // Store selections and navigate to confirm
    sessionStorage.setItem('voting_selections', JSON.stringify(selectedIds))
    navigate(`/vote/event/${eventId}/confirm`)
  }

  const voterName = sessionData.voter.is_anonymous ? 'Pemilih Anonim' : sessionData.voter.full_name

  return (
    <div className="min-h-screen bg-[#fef3c7]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap" rel="stylesheet" />

      {/* Header */}
      <div className="bg-white border-b-4 border-black sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-black text-black uppercase text-lg tracking-tight">{event.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <User className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500 font-medium">{voterName}</span>
              <Clock className="w-3 h-3 text-gray-400 ml-2" />
              <span className="text-xs text-gray-500">s/d {formatDateTime(event.end_at)}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-black">{selectedIds.length}</div>
            <div className="text-xs text-gray-500 font-medium">dipilih</div>
          </div>
        </div>
      </div>

      {/* Instructions bar */}
      <div className="bg-black text-yellow-400 px-6 py-3">
        <p className="text-sm font-black uppercase text-center tracking-wide max-w-2xl mx-auto">
          {event.max_choices === 1
            ? 'PILIH 1 KANDIDAT →'
            : event.allow_multiple_choices
              ? `PILIH ${event.min_choices}-${event.max_choices} KANDIDAT →`
              : `PILIH ${event.min_choices} KANDIDAT →`}
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-black" />
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-20">
            <Vote className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="font-bold text-gray-600">Belum ada kandidat</p>
          </div>
        ) : (
          <div className="space-y-4">
            {candidates.map((candidate) => {
              const isSelected = selectedIds.includes(candidate.candidate_id)
              return (
                <div
                  key={candidate.id}
                  onClick={() => toggleCandidate(candidate.candidate_id)}
                  className={cn(
                    "bg-white rounded-2xl border-4 cursor-pointer transition-all duration-150 overflow-hidden",
                    isSelected
                      ? "border-black shadow-[6px_6px_0px_#fbbf24] bg-yellow-50"
                      : "border-black shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5"
                  )}
                >
                  <div className="flex items-start gap-5 p-5">
                    {/* Number badge */}
                    <div className={cn(
                      "w-14 h-14 rounded-xl border-3 border-black flex items-center justify-center text-2xl font-black flex-shrink-0",
                      isSelected ? "bg-yellow-400 text-black" : "bg-black text-white"
                    )}>
                      {candidate.candidate_number}
                    </div>

                    {/* Photo */}
                    {candidate.photo_url ? (
                      <img
                        src={candidate.photo_url}
                        alt={candidate.full_name}
                        className="w-20 h-20 rounded-xl object-cover border-3 border-black flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-200 to-blue-300 border-3 border-black flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl font-black text-blue-700">{candidate.full_name[0]}</span>
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-black text-lg leading-tight">{candidate.full_name}</h3>
                      {candidate.vision && (
                        <p className="text-gray-600 text-sm mt-1 font-medium line-clamp-2">{candidate.vision}</p>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDetailCandidate(candidate)
                        }}
                        className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wide flex items-center gap-1"
                      >
                        <Info className="w-3 h-3" /> Lihat Detail
                      </button>
                    </div>

                    {/* Check indicator */}
                    <div className={cn(
                      "w-8 h-8 rounded-lg border-3 border-black flex items-center justify-center flex-shrink-0 transition-all",
                      isSelected ? "bg-green-400" : "bg-white"
                    )}>
                      {isSelected && <Check className="w-5 h-5 text-black font-black" strokeWidth={3} />}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 sticky bottom-0 -mx-6 px-6 pb-8 pt-4 bg-gradient-to-t from-[#fef3c7] to-transparent">
          <button
            onClick={handleProceed}
            disabled={!canProceed}
            className={cn(
              "neo-btn w-full py-4 rounded-2xl text-lg flex items-center justify-center gap-3",
              canProceed
                ? "bg-black text-white"
                : "bg-gray-300 text-gray-500 border-gray-400 shadow-[4px_4px_0px_#9ca3af]"
            )}
          >
            <span>LANJUTKAN</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <Dialog open={!!detailCandidate} onOpenChange={(open) => !open && setDetailCandidate(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] flex flex-col p-0 border-4 border-black rounded-2xl shadow-[8px_8px_0px_#000]">
          <DialogHeader className="p-6 pb-4 border-b-4 border-black bg-[#fef3c7] rounded-t-xl">
            <DialogTitle className="text-xl font-black uppercase text-black tracking-tight">Detail Kandidat</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white rounded-b-xl">
            {detailCandidate && (
              <>
                <div className="flex items-center gap-5">
                  {detailCandidate.photo_url ? (
                    <img src={detailCandidate.photo_url} alt={detailCandidate.full_name} className="w-24 h-24 rounded-xl object-cover border-4 border-black shadow-[4px_4px_0px_#000] flex-shrink-0" />
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-blue-200 to-blue-300 border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_#000] flex-shrink-0">
                      <span className="text-3xl font-black text-blue-700">{detailCandidate.full_name[0]}</span>
                    </div>
                  )}
                  <div>
                    <div className="w-10 h-10 bg-yellow-400 border-3 border-black rounded-lg flex items-center justify-center font-black text-lg mb-2">
                      {detailCandidate.candidate_number}
                    </div>
                    <h2 className="text-xl font-black uppercase text-black leading-tight">{detailCandidate.full_name}</h2>
                  </div>
                </div>

                {detailCandidate.motto && (
                  <div className="bg-blue-50 p-4 rounded-xl border-3 border-black italic font-bold text-center text-blue-900 shadow-[4px_4px_0px_#000]">
                    "{detailCandidate.motto}"
                  </div>
                )}

                <div className="space-y-4 pt-2">
                  <div className="bg-gray-50 border-3 border-black rounded-xl p-5 shadow-[4px_4px_0px_#000]">
                    <h3 className="font-black uppercase text-black mb-3 bg-yellow-400 inline-block px-2 py-1 rounded border-2 border-black text-sm">Visi</h3>
                    <p className="font-medium text-gray-700 whitespace-pre-line text-sm leading-relaxed">{detailCandidate.vision || '-'}</p>
                  </div>

                  <div className="bg-gray-50 border-3 border-black rounded-xl p-5 shadow-[4px_4px_0px_#000]">
                    <h3 className="font-black uppercase text-black mb-3 bg-green-400 inline-block px-2 py-1 rounded border-2 border-black text-sm">Misi</h3>
                    <p className="font-medium text-gray-700 whitespace-pre-line text-sm leading-relaxed">{detailCandidate.mission || '-'}</p>
                  </div>

                  <div className="bg-gray-50 border-3 border-black rounded-xl p-5 shadow-[4px_4px_0px_#000]">
                    <h3 className="font-black uppercase text-black mb-3 bg-purple-400 inline-block px-2 py-1 rounded border-2 border-black text-sm text-white">Program Kerja</h3>
                    <p className="font-medium text-gray-700 whitespace-pre-line text-sm leading-relaxed">{detailCandidate.work_program || '-'}</p>
                  </div>

                  {detailCandidate.goals && (
                    <div className="bg-gray-50 border-3 border-black rounded-xl p-5 shadow-[4px_4px_0px_#000]">
                      <h3 className="font-black uppercase text-black mb-3 bg-red-400 inline-block px-2 py-1 rounded border-2 border-black text-sm text-white">Target / Sasaran</h3>
                      <p className="font-medium text-gray-700 whitespace-pre-line text-sm leading-relaxed">{detailCandidate.goals}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
