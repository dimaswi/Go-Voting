import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { votersAPI } from "@/lib/api"
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
import { Voter } from "@/types"
import { SlidersHorizontal, Download, Check, ChevronsUpDown } from "lucide-react"

export default function VotersPageIndex() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [openStatus, setOpenStatus] = useState(false)

  const statuses = [
    { value: "all", label: "All", color: "bg-slate-300" },
    { value: "active", label: "Aktif", color: "bg-green-500" },
    { value: "blocked", label: "Diblokir", color: "bg-red-500" },
  ]

  const { data, isLoading } = useQuery({
    queryKey: ["voters", search, statusFilter],
    queryFn: () => votersAPI.list({
      search,
      status: statusFilter === "all" ? "" : statusFilter,
      per_page: 100
    }),
  })

  const voters: Voter[] = data?.data?.data || []

  const deleteMutation = useMutation({
    mutationFn: (id: string) => votersAPI.delete(id),
    onSuccess: () => {
      toast.success("Voter berhasil dihapus!")
      qc.invalidateQueries({ queryKey: ["voters"] })
    },
  })

  const generateQRMutation = useMutation({
    mutationFn: (id: string) => votersAPI.generateQR(id),
    onSuccess: () => {
      toast.success("QR Code berhasil digenerate!")
      qc.invalidateQueries({ queryKey: ["voters"] })
    },
  })

  const handleDelete = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus voter ini?")) {
      deleteMutation.mutate(id)
    }
  }

  const columns = getColumns((id) => generateQRMutation.mutate(id), handleDelete)

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Voter</h1>
          <p className="text-muted-foreground">
            Kelola data pemilih dan generate QR code.
          </p>
        </div>
        <Button onClick={() => navigate('/admin/voters/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Voter
        </Button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari voter..."
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
              {statusFilter ? (
                <div className="flex items-center gap-2">
                  <div className={cn("h-2 w-2 rounded-full", statuses.find(s => s.value === statusFilter)?.color)} />
                  <span>{statuses.find((s) => s.value === statusFilter)?.label}</span>
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
                          setStatusFilter(currentValue)
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
                            statusFilter === status.value ? "opacity-100" : "opacity-0"
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
        <DataTable columns={columns} data={voters} />
      )}
    </div>
  )
}
