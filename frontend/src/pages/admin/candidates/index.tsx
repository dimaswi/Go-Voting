import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { candidatesAPI } from "@/lib/api"
import { DataTable } from "@/components/data-table/DataTable"
import { getColumns } from "./columns"
import { Button, buttonVariants } from "@/components/ui/button"
import { Plus, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Candidate } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SlidersHorizontal, Download, Check, ChevronsUpDown } from "lucide-react"

export default function CandidatesPageIndex() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [isActiveFilter, setIsActiveFilter] = useState("all")
  const [openStatus, setOpenStatus] = useState(false)

  const statuses = [
    { value: "all", label: "All", color: "bg-slate-300" },
    { value: "true", label: "Aktif", color: "bg-green-500" },
    { value: "false", label: "Tidak Aktif", color: "bg-red-500" },
  ]

  const [uploadCandidateId, setUploadCandidateId] = useState<string | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["candidates", search, isActiveFilter],
    queryFn: () => candidatesAPI.list({
      search,
      is_active: isActiveFilter === "all" ? "" : isActiveFilter,
      per_page: 100
    }),
  })

  const candidates: Candidate[] = data?.data?.data || []

  const deleteMutation = useMutation({
    mutationFn: (id: string) => candidatesAPI.delete(id),
    onSuccess: () => {
      toast.success("Kandidat berhasil dihapus!")
      qc.invalidateQueries({ queryKey: ["candidates"] })
    },
  })

  const uploadPhotoMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => candidatesAPI.uploadPhoto(id, file),
    onSuccess: () => {
      toast.success('Foto berhasil diupload!')
      qc.invalidateQueries({ queryKey: ['candidates'] })
      setUploadFile(null)
      setUploadCandidateId(null)
    },
  })

  const handleDelete = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus kandidat ini?")) {
      deleteMutation.mutate(id)
    }
  }

  const columns = getColumns((id) => setUploadCandidateId(id), handleDelete)

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kandidat</h1>
          <p className="text-muted-foreground">
            Kelola data kandidat pemilihan.
          </p>
        </div>
        <Button onClick={() => navigate('/admin/candidates/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Kandidat
        </Button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari kandidat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-md pl-9 pr-9 shadow-xs bg-transparent"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Popover open={openStatus} onOpenChange={setOpenStatus}>
            <PopoverTrigger
              role="combobox"
              aria-expanded={openStatus}
              className={cn(buttonVariants({ variant: "outline" }), "h-9 w-[180px] justify-between shadow-xs bg-transparent font-normal border-input")}
            >
              {isActiveFilter ? (
                <div className="flex items-center gap-2">
                  <div className={cn("h-2 w-2 rounded-full", statuses.find(s => s.value === isActiveFilter)?.color)} />
                  <span>{statuses.find((s) => s.value === isActiveFilter)?.label}</span>
                </div>
              ) : (
                "Filter status"
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </PopoverTrigger>
            <PopoverContent className="w-[180px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Cari status..." className="h-9 border-none outline-none ring-0 shadow-none focus:ring-0 focus:outline-none" />
                <CommandList>
                  <CommandEmpty>Status tidak ditemukan.</CommandEmpty>
                  <CommandGroup>
                    {statuses.map((status) => (
                      <CommandItem
                        key={status.value}
                        value={status.value}
                        onSelect={(currentValue) => {
                          setIsActiveFilter(currentValue)
                          setOpenStatus(false)
                        }}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <div className={cn("h-2 w-2 rounded-full", status.color)} />
                          <span>{status.label}</span>
                        </div>
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            isActiveFilter === status.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-10 bg-muted rounded animate-pulse" />
          <div className="h-32 bg-muted rounded animate-pulse" />
        </div>
      ) : (
        <DataTable columns={columns} data={candidates} />
      )}

      {/* Upload Photo Dialog */}
      <Dialog open={!!uploadCandidateId} onOpenChange={(o) => !o && setUploadCandidateId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upload Foto Kandidat</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              type="file"
              accept="image/*"
              onChange={e => setUploadFile(e.target.files?.[0] || null)}
            />
            {uploadFile && <p className="text-xs text-muted-foreground">{uploadFile.name}</p>}
          </div>
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="outline" onClick={() => { setUploadCandidateId(null); setUploadFile(null) }}>
              Batal
            </Button>
            <Button
              onClick={() => uploadCandidateId && uploadFile && uploadPhotoMutation.mutate({ id: uploadCandidateId, file: uploadFile })}
              disabled={!uploadFile || uploadPhotoMutation.isPending}
            >
              {uploadPhotoMutation.isPending ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
