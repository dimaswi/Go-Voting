import * as React from "react"
import { UploadCloud } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps extends React.HTMLAttributes<HTMLDivElement> {
  onFileSelect: (file: File) => void
  accept?: string
  maxSize?: number // in MB
}

export function FileUpload({ className, onFileSelect, accept = "image/*", maxSize = 5, ...props }: FileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size should not exceed ${maxSize}MB`)
      return
    }
    setSelectedFile(file)
    onFileSelect(file)
  }

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-xl transition-colors cursor-pointer",
        isDragging ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      {...props}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={accept}
        onChange={handleFileChange}
      />
      
      <div className="flex flex-col items-center justify-center space-y-2 text-center">
        <div className="p-3 bg-slate-100 rounded-full mb-2">
          <UploadCloud className="w-6 h-6 text-slate-500" />
        </div>
        {selectedFile ? (
          <>
            <p className="text-sm font-medium text-slate-900">{selectedFile.name}</p>
            <p className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-slate-900">
              Drag & drop files here, or click to browse
            </p>
            <p className="text-xs text-slate-500">
              Max Size: {maxSize}MB
            </p>
          </>
        )}
      </div>
    </div>
  )
}
