import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { votingAPI } from '@/lib/api'
import type { ValidateCodeResponse, EventCandidate } from '@/types'
import { toast } from 'sonner'
import { AlertCircle, ArrowLeft, Check, Loader2 } from 'lucide-react'

export default function ConfirmPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sessionData: ValidateCodeResponse | null = (() => {
    try { return JSON.parse(sessionStorage.getItem('voting_session') || 'null') }
    catch { return null }
  })()

  const selectedIds: string[] = (() => {
    try { return JSON.parse(sessionStorage.getItem('voting_selections') || '[]') }
    catch { return [] }
  })()

  const event = sessionData?.events.find(e => e.id === eventId)

  const { data: candidatesData } = useQuery({
    queryKey: ['vote-candidates', eventId],
    queryFn: () => votingAPI.getCandidates(eventId!, sessionData?.token || ''),
    enabled: !!eventId && !!sessionData?.token,
  })

  const candidates: EventCandidate[] = candidatesData?.data?.data || []
  const selectedCandidates = candidates.filter(c => selectedIds.includes(c.candidate_id))

  useEffect(() => {
    if (!sessionData || !selectedIds.length) {
      navigate('/vote')
    }
  }, [])

  const handleSubmit = async () => {
    if (!sessionData?.token || !eventId || isSubmitting) return
    setIsSubmitting(true)
    try {
      await votingAPI.submitVote(eventId, sessionData.token, selectedIds)
      sessionStorage.removeItem('voting_session')
      sessionStorage.removeItem('voting_selections')
      navigate('/vote/success')
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Gagal mengirim suara. Coba lagi.'
      toast.error(message)
      if (err?.response?.status === 401 || err?.response?.status === 409) {
        navigate('/vote/error')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!sessionData || !event) return null

  return (
    <div className="min-h-screen bg-[#fef3c7]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap" rel="stylesheet" />

      {/* Header */}
      <div className="bg-white border-b-4 border-black px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-xl border-3 border-black hover:bg-gray-100 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-black text-black uppercase text-xl tracking-tight">KONFIRMASI PILIHAN</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Warning */}
        <div className="bg-amber-400 border-4 border-black shadow-[6px_6px_0px_#000] rounded-2xl p-5 mb-8 flex items-start gap-4">
          <AlertCircle className="w-7 h-7 text-black flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-black text-black uppercase text-lg">PASTIKAN PILIHAN ANDA!</h3>
            <p className="text-black/70 font-medium text-sm mt-1">
              Suara yang sudah dikirim <strong>tidak dapat diubah</strong>. Periksa kembali pilihan Anda sebelum mengkonfirmasi.
            </p>
          </div>
        </div>

        {/* Event info */}
        <div className="mb-6">
          <h2 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-2">EVENT</h2>
          <p className="font-black text-black text-2xl uppercase">{event.name}</p>
          <p className="text-gray-500 text-sm font-medium mt-1">
            Voter: {sessionData.voter.is_anonymous ? '🔒 Anonim' : sessionData.voter.full_name}
          </p>
        </div>

        {/* Selected candidates */}
        <h2 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-3">KANDIDAT PILIHAN</h2>
        <div className="space-y-3 mb-8">
          {selectedCandidates.map(candidate => (
            <div
              key={candidate.id}
              className="bg-white border-4 border-black shadow-[4px_4px_0px_#fbbf24] rounded-2xl p-5 flex items-center gap-5"
            >
              <div className="w-12 h-12 bg-yellow-400 border-3 border-black rounded-xl flex items-center justify-center text-xl font-black flex-shrink-0">
                {candidate.candidate_number}
              </div>
              {candidate.photo_url && (
                <img src={candidate.photo_url} alt={candidate.full_name} className="w-14 h-14 rounded-xl border-3 border-black object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-black text-lg">{candidate.full_name}</h3>
                {candidate.vision && <p className="text-gray-500 text-sm font-medium truncate mt-0.5">{candidate.vision}</p>}
              </div>
              <div className="w-9 h-9 bg-green-400 border-3 border-black rounded-xl flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-black" strokeWidth={3} />
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="neo-btn w-full bg-green-400 text-black py-5 rounded-2xl text-xl font-black uppercase"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin" />
                MENGIRIM SUARA...
              </span>
            ) : (
              'KIRIM SUARA ✓'
            )}
          </button>
          <button
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
            className="neo-btn w-full bg-white text-black py-4 rounded-2xl text-base font-bold uppercase"
          >
            ← UBAH PILIHAN
          </button>
        </div>
      </div>
    </div>
  )
}
