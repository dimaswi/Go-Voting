import { ColumnDef } from "@tanstack/react-table"
import { Candidate } from "@/types"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, Edit, Trash2, Upload } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Link } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export const getColumns = (
  onUploadPhoto: (id: string) => void,
  onDelete: (id: string) => void
): ColumnDef<Candidate>[] => [
  {
    accessorKey: "full_name",
    header: "Kandidat",
    cell: ({ row }) => {
      const candidate = row.original
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border">
            {candidate.photo_url ? (
              <AvatarImage src={candidate.photo_url} alt={candidate.full_name} className="object-cover" />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary">
              {candidate.full_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <Link to={`/admin/candidates/${candidate.id}`} className="font-semibold text-primary hover:underline">
              {candidate.full_name}
            </Link>
            {candidate.current_position && (
              <span className="text-xs text-muted-foreground mt-0.5">{candidate.current_position}</span>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "gender",
    header: "Jenis Kelamin",
    cell: ({ row }) => {
      const gender = row.getValue("gender") as string
      if (!gender) return "-"
      const labels: Record<string, string> = { male: "Laki-laki", female: "Perempuan", other: "Lainnya" }
      return labels[gender] || gender
    },
  },
  {
    accessorKey: "vision",
    header: "Visi",
    cell: ({ row }) => {
      const vision = row.getValue("vision") as string
      if (!vision) return "-"
      return <div className="max-w-[250px] truncate text-sm" title={vision}>{vision}</div>
    },
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("is_active") as boolean
      return isActive ? (
        <Badge variant="default" className="bg-green-600 hover:bg-green-700">Aktif</Badge>
      ) : (
        <Badge variant="destructive">Nonaktif</Badge>
      )
    },
  },
  {
    id: "actions",
    header: () => <div className="w-10"></div>,
    cell: ({ row }) => {
      const candidate = row.original

      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 w-8 p-0 flex items-center justify-center rounded-md hover:bg-muted">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuItem>
              <Link to={`/admin/candidates/${candidate.id}`} className="flex w-full items-center">
                <Eye className="mr-2 h-4 w-4" /> Detail
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link to={`/admin/candidates/${candidate.id}/edit`} className="flex w-full items-center">
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUploadPhoto(candidate.id)}>
              <Upload className="mr-2 h-4 w-4" /> Upload Foto
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(candidate.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
              <Trash2 className="mr-2 h-4 w-4" /> Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      )
    },
  },
]
