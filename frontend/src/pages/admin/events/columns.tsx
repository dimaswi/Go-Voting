import { ColumnDef } from "@tanstack/react-table"
import { VotingEvent } from "@/types"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Play, Square, Eye, Edit, Trash2 } from "lucide-react"
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
import { getStatusColor, getStatusLabel, formatDateTime } from "@/lib/utils"
import { Link } from "react-router-dom"

export const getColumns = (
  onStatusChange: (id: string, status: string) => void,
  onDelete: (id: string) => void
): ColumnDef<VotingEvent>[] => [
  {
    accessorKey: "name",
    header: "Event",
    cell: ({ row }) => {
      const event = row.original
      return (
        <div className="flex flex-col">
          <Link to={`/admin/events/${event.id}`} className="font-semibold text-primary hover:underline">
            {event.name}
          </Link>
          <span className="text-xs text-muted-foreground mt-0.5">Code: {event.code}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge variant="secondary" className={getStatusColor(status)}>
          {getStatusLabel(status)}
        </Badge>
      )
    },
  },
  {
    accessorKey: "start_at",
    header: "Periode",
    cell: ({ row }) => {
      const event = row.original
      return (
        <div className="text-xs text-muted-foreground flex flex-col">
          <span>{formatDateTime(event.start_at)}</span>
          <span>s/d {formatDateTime(event.end_at)}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "total_candidates",
    header: () => <div className="text-center">Kandidat</div>,
    cell: ({ row }) => <div className="text-center font-medium">{row.getValue("total_candidates")}</div>,
  },
  {
    accessorKey: "total_voters",
    header: () => <div className="text-center">Voter</div>,
    cell: ({ row }) => <div className="text-center font-medium">{row.getValue("total_voters")}</div>,
  },
  {
    id: "votes",
    header: () => <div className="text-center">Vote</div>,
    cell: ({ row }) => {
      const event = row.original
      return (
        <div className="text-center">
          <span className="font-semibold text-green-600">{event.total_voted}</span>
          <span className="text-muted-foreground text-xs">/{event.total_voters}</span>
        </div>
      )
    },
  },
  {
    id: "actions",
    header: () => <div className="w-10"></div>,
    cell: ({ row }) => {
      const event = row.original

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
              <Link to={`/admin/events/${event.id}`} className="flex w-full items-center">
                <Eye className="mr-2 h-4 w-4" /> Detail
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link to={`/admin/events/${event.id}/edit`} className="flex w-full items-center">
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {event.status === 'draft' && (
              <DropdownMenuItem onClick={() => onStatusChange(event.id, 'active')}>
                <Play className="mr-2 h-4 w-4" /> Aktifkan
              </DropdownMenuItem>
            )}
            {event.status === 'active' && (
              <DropdownMenuItem onClick={() => onStatusChange(event.id, 'finished')}>
                <Square className="mr-2 h-4 w-4" /> Selesaikan
              </DropdownMenuItem>
            )}
            {event.status === 'draft' && (
              <DropdownMenuItem onClick={() => onDelete(event.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                <Trash2 className="mr-2 h-4 w-4" /> Hapus
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      )
    },
  },
]
