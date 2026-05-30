import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { votingAPI } from '@/lib/api'
import type { ValidateCodeResponse } from '@/types'
import { toast } from 'sonner'
import { Scan, Key, QrCode, Loader2 } from 'lucide-react'

export default function ScanPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleValidate = async (inputCode?: string) => {
    const finalCode = inputCode || code
    if (!finalCode.trim()) {
      toast.error('Masukkan kode unik terlebih dahulu')
      return
    }
    setIsLoading(true)
    try {
      const res = await votingAPI.validateCode(finalCode.trim())
      const data: ValidateCodeResponse = res.data.data

      // Store session info
      sessionStorage.setItem('voting_session', JSON.stringify(data))

      if (data.events.length === 1) {
        navigate(`/vote/event/${data.events[0].id}`)
      } else if (data.events.length > 1) {
        navigate(`/vote/event/${data.events[0].id}`)
      } else {
        toast.error('Tidak ada event voting yang tersedia untuk Anda')
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Kode tidak valid atau sudah digunakan'
      toast.error(message)
      setCode('')
      inputRef.current?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fef3c7]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Load Outfit font */}
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap" rel="stylesheet" />

      {/* Header */}
      <div className="bg-white border-b-4 border-black px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
            <QrCode className="w-5 h-5 text-[#fef3c7]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-black uppercase tracking-tight">GO-VOTE</h1>
            <p className="text-xs font-medium text-gray-500">SISTEM E-VOTING DIGITAL</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-black rounded-3xl mb-6 shadow-[8px_8px_0px_#fbbf24]">
            <Scan className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-4xl font-black text-black uppercase tracking-tight leading-tight mb-4">
            MASUK<br />UNTUK VOTE!
          </h2>
          <p className="text-gray-600 font-medium">
            Scan QR Code atau masukkan kode unik Anda
          </p>
        </div>

        {/* Code input card */}
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_#000] rounded-2xl p-8 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <Key className="w-5 h-5 text-black" />
            <h3 className="font-black text-black uppercase">KODE UNIK</h3>
          </div>
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleValidate()}
              placeholder="Masukkan kode di sini..."
              className="flex-1 border-4 border-black rounded-xl px-4 py-3.5 text-lg font-bold uppercase tracking-wider outline-none focus:ring-4 focus:ring-yellow-400 placeholder:text-gray-300 placeholder:font-normal placeholder:normal-case placeholder:text-base"
              disabled={isLoading}
              autoFocus
            />
          </div>
          <button
            onClick={() => handleValidate()}
            disabled={isLoading || !code.trim()}
            className="neo-btn w-full bg-black text-white py-4 rounded-xl mt-4 text-lg disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                MEMVALIDASI...
              </span>
            ) : (
              'MULAI VOTING →'
            )}
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-black text-white border-4 border-black shadow-[6px_6px_0px_#fbbf24] rounded-2xl p-6">
          <h4 className="font-black uppercase mb-4 text-yellow-400">CARA VOTING</h4>
          <ol className="space-y-3">
            {[
              'Dapatkan kode unik dari panitia atau scan QR Code',
              'Masukkan kode dan klik MULAI VOTING',
              'Pilih kandidat pilihan Anda',
              'Konfirmasi pilihan dan kirim suara',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-7 h-7 bg-yellow-400 text-black font-black rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                  {i + 1}
                </span>
                <p className="text-gray-300 font-medium text-sm">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
