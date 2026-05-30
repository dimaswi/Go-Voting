import { useNavigate } from 'react-router-dom'
import { CheckCircle, PartyPopper } from 'lucide-react'

export default function SuccessPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#fef3c7] flex items-center justify-center p-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap" rel="stylesheet" />
      <div className="w-full max-w-md text-center">
        <div className="bg-white border-4 border-black shadow-[12px_12px_0px_#fbbf24] rounded-3xl p-10">
          <div className="w-24 h-24 bg-green-400 border-4 border-black rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="w-12 h-12 text-black" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-black text-black uppercase tracking-tight mb-3">
            SUARA<br />TERKIRIM!
          </h1>
          <p className="text-gray-600 font-medium mb-8">
            Terima kasih! Suara Anda telah berhasil dicatat.<br />
            Hasil voting akan diumumkan oleh panitia.
          </p>
          <div className="bg-yellow-400 border-3 border-black rounded-2xl p-4 mb-6">
            <p className="font-black text-black text-sm uppercase">🎉 TERIMA KASIH TELAH BERPARTISIPASI!</p>
          </div>
          <button
            onClick={() => navigate('/vote')}
            className="neo-btn w-full bg-black text-white py-4 rounded-xl font-black uppercase text-lg"
          >
            SELESAI
          </button>
        </div>
      </div>
    </div>
  )
}
