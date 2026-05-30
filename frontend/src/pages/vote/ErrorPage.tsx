import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

export default function ErrorPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#fef3c7] flex items-center justify-center p-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap" rel="stylesheet" />
      <div className="w-full max-w-md text-center">
        <div className="bg-white border-4 border-black shadow-[12px_12px_0px_#ef4444] rounded-3xl p-10">
          <div className="w-24 h-24 bg-red-400 border-4 border-black rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-12 h-12 text-black" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-black text-black uppercase tracking-tight mb-3">
            GAGAL!
          </h1>
          <p className="text-gray-600 font-medium mb-8">
            Terjadi kesalahan saat memproses suara Anda.<br />
            Mungkin Anda sudah pernah vote atau sesi sudah habis.
          </p>
          <button
            onClick={() => navigate('/vote')}
            className="neo-btn w-full bg-black text-white py-4 rounded-xl font-black uppercase text-lg"
          >
            COBA LAGI
          </button>
        </div>
      </div>
    </div>
  )
}
