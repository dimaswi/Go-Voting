import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { votingAPI } from '@/lib/api'
import type { ValidateCodeResponse } from '@/types'
import { toast } from 'sonner'
import { Scan, Key, QrCode, Loader2 } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'

export default function ScanPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!showScanner) return;

    const html5QrCode = new Html5Qrcode("qr-reader");

    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        // Success
        html5QrCode.stop().then(() => html5QrCode.clear()).catch(console.error);
        setShowScanner(false);
        setCode(decodedText);
        handleValidate(decodedText);
      },
      (error) => {
        // Ignore expected scan errors
      }
    ).catch(err => {
      console.error("Camera error:", err);
      toast.error("Gagal membuka kamera. Pastikan browser diizinkan mengakses kamera.");
      setShowScanner(false);
    });

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode.clear()).catch(console.error);
      }
    };
  }, [showScanner]);

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
        {/* Code input card */}
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_#000] rounded-2xl p-8 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <Key className="w-5 h-5 text-black" />
            <h3 className="font-black text-black uppercase">KODE UNIK / QR CODE</h3>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 sm:gap-3">
              <input
                ref={inputRef}
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleValidate()}
                placeholder="Masukkan kode..."
                className="flex-1 min-w-0 w-full border-4 border-black rounded-xl px-3 sm:px-4 py-3 sm:py-3.5 text-base sm:text-lg font-bold uppercase tracking-wider outline-none focus:ring-4 focus:ring-yellow-400 placeholder:text-gray-300 placeholder:font-normal placeholder:normal-case placeholder:text-sm sm:placeholder:text-base"
                disabled={isLoading}
                autoFocus={!showScanner}
              />
              <button
                onClick={() => setShowScanner(!showScanner)}
                className="w-14 sm:w-16 h-[52px] sm:h-[60px] border-4 border-black rounded-xl flex items-center justify-center bg-yellow-400 hover:bg-yellow-500 transition-colors flex-shrink-0 shadow-[4px_4px_0px_#000]"
                title="Scan QR Code"
              >
                <Scan className="w-5 sm:w-6 h-5 sm:h-6 text-black font-black" />
              </button>
            </div>

            {showScanner && (
              <div className="border-4 border-black rounded-xl overflow-hidden p-2 bg-gray-50">
                <div id="qr-reader" className="w-full"></div>
                <button 
                  onClick={() => setShowScanner(false)}
                  className="w-full py-2 mt-2 font-bold text-sm text-gray-500 hover:text-black uppercase"
                >
                  Tutup Scanner
                </button>
              </div>
            )}

            <button
              onClick={() => handleValidate()}
              disabled={isLoading || (!code.trim() && !showScanner)}
              className="neo-btn w-full bg-black text-white py-4 rounded-xl mt-2 text-lg disabled:opacity-50"
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
        </div>

        {/* Instructions */}
        <div className="bg-black text-white border-4 border-black shadow-[6px_6px_0px_#fbbf24] rounded-2xl p-6">
          <h4 className="font-black uppercase mb-4 text-yellow-400">CARA VOTING</h4>
          <ol className="space-y-3">
            {[
              'Dapatkan kode unik dari panitia atau siapkan QR Code Anda',
              'Ketikkan kode atau klik tombol Scanner (kuning) untuk memindai',
              'Klik MULAI VOTING',
              'Pilih kandidat pilihan Anda dan konfirmasi',
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
